"""
IssuingAuthority — mints and extends signed AuthR Records.

In a production deployment, the IssuingAuthority is the AuthR analogue of OAuth's
Authorization Server. Its signing key MUST be protected (HSM, KMS, or threshold
signing) — compromise of this key is the highest-impact failure mode in the v0.1
threat model.

For development and reference purposes, this implementation generates an in-memory
Ed25519 key pair on instantiation. Production deployments MUST use durable,
hardware-backed key storage.
"""

from __future__ import annotations

import base64
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    PublicFormat,
    PrivateFormat,
    NoEncryption,
)

from authr.canonical import canonicalize
from authr.errors import ScopeWidenedError, DelegationDepthExceededError, GroundingError
from authr.types import (
    Actor,
    Author,
    AuthRRecord,
    ChainLink,
    DataSource,
    Drift,
    Grounding,
    Intent,
    Provenance,
    Scope,
    Signature,
)


def _now_iso() -> str:
    """Return current UTC time as ISO 8601 with Z suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _iso_plus(seconds: int) -> str:
    """Return current UTC time plus `seconds`, as ISO 8601 with Z suffix."""
    return (datetime.now(timezone.utc) + timedelta(seconds=seconds)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )


def _new_authr_id() -> str:
    """Generate a new globally unique AuthR record identifier."""
    return f"urn:authr:{uuid.uuid4()}"


def _new_correlation_id() -> str:
    """Generate a new correlation id for an execution graph."""
    return f"corr-{uuid.uuid4()}"


def _b64url(data: bytes) -> str:
    """Base64url-encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _assert_grounded(author: Author) -> None:
    """Author must have grounding evidence."""
    g = author.grounding
    if not g or not g.evidence_digest or not g.verifier:
        raise GroundingError(
            f"Author {author.id!r} is not grounded: evidence_digest and verifier are required"
        )


def _assert_scope_narrows(parent: Scope, child: Scope) -> None:
    """
    Invariant 4: child.scope MUST be a strict subset of parent.scope.

    For v0.1:
    - actions: child.actions must be a subset of parent.actions
    - resources: child.resources must be a subset of parent.resources
    - constraints: child must not loosen any quantitative constraint
    """
    parent_actions = set(parent.actions)
    child_actions = set(child.actions)
    if not child_actions.issubset(parent_actions):
        added = child_actions - parent_actions
        raise ScopeWidenedError(f"scope expansion: actions {added}")

    parent_resources = set(parent.resources)
    child_resources = set(child.resources)
    if not child_resources.issubset(parent_resources):
        added = child_resources - parent_resources
        raise ScopeWidenedError(f"scope expansion: resources {added}")

    for key, parent_val in parent.constraints.items():
        if key not in child.constraints:
            continue
        child_val = child.constraints[key]
        if key in ("max_amount", "max_delegation_depth", "valid_window_minutes"):
            if child_val > parent_val:
                raise ScopeWidenedError(
                    f"scope expansion: constraint {key} loosened from {parent_val} to {child_val}"
                )


def _chain_depth(record: AuthRRecord) -> int:
    """Return the depth of this record (root = 0)."""
    return len(record.provenance.chain)


def _assert_depth_ok(parent: AuthRRecord) -> None:
    """Verify that extending the parent would not exceed max_delegation_depth."""
    max_depth = parent.scope.constraints.get("max_delegation_depth")
    if max_depth is None:
        return
    if _chain_depth(parent) + 1 > max_depth:
        raise DelegationDepthExceededError(
            f"delegation depth would be {_chain_depth(parent) + 1}, exceeds max {max_depth}"
        )


class IssuingAuthority:
    """
    Signs AuthR Records. Holds an Ed25519 signing key, identified by key_id (kid).
    """

    DEFAULT_TTL_SECONDS = 1800  # 30 minutes

    def __init__(
        self,
        key_id: str,
        signing_key: Optional[Ed25519PrivateKey] = None,
        default_ttl_seconds: int = DEFAULT_TTL_SECONDS,
    ):
        self.key_id = key_id
        self._signing_key = signing_key or Ed25519PrivateKey.generate()
        self.default_ttl_seconds = default_ttl_seconds

    @property
    def public_key(self) -> Ed25519PublicKey:
        return self._signing_key.public_key()

    @property
    def public_key_bytes(self) -> bytes:
        """Raw public key bytes, suitable for storing in a Trust Store."""
        return self.public_key.public_bytes(
            encoding=Encoding.Raw, format=PublicFormat.Raw
        )

    def export_private_key_pem(self) -> bytes:
        """For testing or local persistence only. Production keys live in HSM/KMS."""
        return self._signing_key.private_bytes(
            encoding=Encoding.PEM,
            format=PrivateFormat.PKCS8,
            encryption_algorithm=NoEncryption(),
        )

    def _sign(self, record: AuthRRecord) -> Signature:
        """Compute a detached Ed25519 signature over the canonicalized record (minus signature)."""
        payload = canonicalize(record.to_dict(include_signature=False))
        sig_bytes = self._signing_key.sign(payload)
        return Signature(alg="EdDSA", kid=self.key_id, value=_b64url(sig_bytes))

    def issue_root(
        self,
        *,
        author: Author,
        actor: Actor,
        intent: Intent,
        scope: Scope,
        data_sources: Optional[list[DataSource]] = None,
        correlation_id: Optional[str] = None,
        confidence: float = 0.95,
        ttl_seconds: Optional[int] = None,
    ) -> AuthRRecord:
        """Mint a new root AuthR Record."""
        _assert_grounded(author)

        ttl = ttl_seconds or self.default_ttl_seconds
        issued_at = _now_iso()
        expires_at = _iso_plus(ttl)

        # Build the unsigned record; signature is placeholder until we sign.
        placeholder_sig = Signature(alg="EdDSA", kid=self.key_id, value="")

        record = AuthRRecord(
            authr_id=_new_authr_id(),
            version="0.1",
            issued_at=issued_at,
            expires_at=expires_at,
            author=author,
            actor=actor,
            intent=intent,
            scope=scope,
            provenance=Provenance(
                chain=[],
                correlation_id=correlation_id or _new_correlation_id(),
                data_sources=data_sources or [],
            ),
            drift=Drift(
                confidence=confidence,
                stale_after=expires_at,
                deviation_signals=[],
            ),
            signature=placeholder_sig,
        )

        # Replace placeholder signature with real one.
        real_sig = self._sign(record)
        return AuthRRecord(
            authr_id=record.authr_id,
            version=record.version,
            issued_at=record.issued_at,
            expires_at=record.expires_at,
            author=record.author,
            actor=record.actor,
            intent=record.intent,
            scope=record.scope,
            provenance=record.provenance,
            drift=record.drift,
            signature=real_sig,
        )

    def extend(
        self,
        *,
        parent: AuthRRecord,
        actor: Actor,
        attenuated_scope: Scope,
        confidence: float = 0.9,
    ) -> AuthRRecord:
        """
        Produce a hop record: same author and intent, new actor, narrower scope.

        Raises ScopeWidenedError if attenuated_scope violates monotonic scope.
        Raises DelegationDepthExceededError if depth would exceed max.
        """
        _assert_scope_narrows(parent.scope, attenuated_scope)
        _assert_depth_ok(parent)

        depth = _chain_depth(parent) + 1
        new_link = ChainLink(authr_id=parent.authr_id, depth=depth, issuer=self.key_id)

        placeholder_sig = Signature(alg="EdDSA", kid=self.key_id, value="")
        record = AuthRRecord(
            authr_id=_new_authr_id(),
            version="0.1",
            issued_at=_now_iso(),
            expires_at=parent.expires_at,  # children MUST NOT outlive parents
            author=parent.author,
            actor=actor,
            intent=parent.intent,
            scope=attenuated_scope,
            provenance=Provenance(
                chain=[*parent.provenance.chain, new_link],
                correlation_id=parent.provenance.correlation_id,
                data_sources=parent.provenance.data_sources,
            ),
            drift=Drift(
                confidence=confidence,
                stale_after=parent.expires_at,
                deviation_signals=[],
            ),
            signature=placeholder_sig,
        )
        real_sig = self._sign(record)
        return AuthRRecord(
            authr_id=record.authr_id,
            version=record.version,
            issued_at=record.issued_at,
            expires_at=record.expires_at,
            author=record.author,
            actor=record.actor,
            intent=record.intent,
            scope=record.scope,
            provenance=record.provenance,
            drift=record.drift,
            signature=real_sig,
        )
