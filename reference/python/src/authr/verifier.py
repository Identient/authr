"""
Verifier — enforces the six invariants of an AuthR chain.

The Verifier is what a relying party (typically an enforcement point — API gateway,
MCP server, resource service) runs before honoring a request that claims to act
under a particular AuthR Record or chain.

The six invariants (from spec/AUTHR-v0.1.md §5):
    1. Signature validity
    2. Not expired
    3. Stable author across the chain
    4. Monotonic scope attenuation
    5. Chain continuity and correlation_id consistency
    6. Revocation supremacy (no revoked records in the chain)

In v0.1 the Verifier holds a Trust Store mapping kid -> public key bytes, and a
revocation set of authr_ids. Production deployments will likely back the
revocation set with a service rather than an in-memory set.
"""

from __future__ import annotations

import base64
from datetime import datetime, timezone
from typing import Iterable

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

from authr.canonical import canonicalize
from authr.errors import (
    AuthorDriftError,
    ChainBrokenError,
    ExpiredError,
    RevokedError,
    ScopeWidenedError,
    SignatureError,
)
from authr.types import AuthRRecord, Scope


def _parse_iso(s: str) -> datetime:
    """Parse an ISO 8601 string, accepting a trailing Z as UTC."""
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)


def _b64url_decode(s: str) -> bytes:
    """Base64url-decode, tolerating missing padding."""
    padding = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)


def _scope_narrows(parent: Scope, child: Scope) -> None:
    """Re-implement the monotonic-scope check at verify time (independent of IssuingAuthority)."""
    parent_actions = set(parent.actions)
    child_actions = set(child.actions)
    if not child_actions.issubset(parent_actions):
        raise ScopeWidenedError(
            f"scope expansion in chain: actions {child_actions - parent_actions}"
        )

    parent_resources = set(parent.resources)
    child_resources = set(child.resources)
    if not child_resources.issubset(parent_resources):
        raise ScopeWidenedError(
            f"scope expansion in chain: resources {child_resources - parent_resources}"
        )

    for key, parent_val in parent.constraints.items():
        if key not in child.constraints:
            continue
        child_val = child.constraints[key]
        if key in ("max_amount", "max_delegation_depth", "valid_window_minutes"):
            if child_val > parent_val:
                raise ScopeWidenedError(
                    f"scope expansion in chain: constraint {key} "
                    f"loosened from {parent_val} to {child_val}"
                )


class Verifier:
    """
    Verifies AuthR Records and full chains.

    Construct with:
        trust_store: dict mapping kid -> raw Ed25519 public key bytes (32 bytes each).
        revoked: optional iterable of authr_ids that have been revoked.
    """

    def __init__(
        self,
        trust_store: dict[str, bytes],
        revoked: Iterable[str] = (),
    ):
        self.trust_store = dict(trust_store)
        self.revoked: set[str] = set(revoked)

    def revoke(self, authr_id: str) -> None:
        self.revoked.add(authr_id)

    def verify_record(self, record: AuthRRecord) -> bool:
        """
        Verify a single record's signature and expiry (invariants 1, 2, 6).

        Does NOT check chain-level invariants (3, 4, 5). For those, use verify_chain().

        Returns True on success; raises AuthRError subclass on failure.
        """
        # Invariant 6: revocation
        if record.authr_id in self.revoked:
            raise RevokedError(f"record {record.authr_id} has been revoked")

        # Invariant 1: signature validity
        kid = record.signature.kid
        if kid not in self.trust_store:
            raise SignatureError(f"unknown kid: {kid}")

        pub_bytes = self.trust_store[kid]
        try:
            pub = Ed25519PublicKey.from_public_bytes(pub_bytes)
        except Exception as e:
            raise SignatureError(f"invalid public key for kid {kid}: {e}") from e

        payload = canonicalize(record.to_dict(include_signature=False))
        sig_bytes = _b64url_decode(record.signature.value)
        try:
            pub.verify(sig_bytes, payload)
        except InvalidSignature as e:
            raise SignatureError(f"signature failed to verify for record {record.authr_id}") from e

        # Invariant 2: not expired
        now = datetime.now(timezone.utc)
        expires = _parse_iso(record.expires_at)
        if now >= expires:
            raise ExpiredError(
                f"record {record.authr_id} expired at {record.expires_at} (now {now.isoformat()})"
            )

        return True

    def verify_chain(self, chain: list[AuthRRecord]) -> bool:
        """
        Verify a full chain. Enforces all six invariants.

        chain[0] is the root; chain[-1] is the leaf.
        """
        if not chain:
            raise ChainBrokenError("empty chain")

        # First: verify each record individually (invariants 1, 2, 6).
        for record in chain:
            self.verify_record(record)

        # Invariant 3: stable author across the chain.
        root_author_id = chain[0].author.id
        for r in chain[1:]:
            if r.author.id != root_author_id:
                raise AuthorDriftError(
                    f"author drift: chain root has {root_author_id!r}, "
                    f"record {r.authr_id} has {r.author.id!r}"
                )

        # Invariant 4: monotonic scope.
        for parent, child in zip(chain, chain[1:]):
            _scope_narrows(parent.scope, child.scope)

        # Invariant 5: chain continuity + correlation_id consistency.
        root_corr = chain[0].provenance.correlation_id
        for i, record in enumerate(chain[1:], start=1):
            if not record.provenance.chain:
                raise ChainBrokenError(f"non-root record {record.authr_id} has empty chain")
            last_link = record.provenance.chain[-1]
            expected_parent_id = chain[i - 1].authr_id
            if last_link.authr_id != expected_parent_id:
                raise ChainBrokenError(
                    f"chain break at position {i}: "
                    f"record {record.authr_id} links to {last_link.authr_id}, "
                    f"expected {expected_parent_id}"
                )
            if record.provenance.correlation_id != root_corr:
                raise ChainBrokenError(
                    f"correlation_id mismatch at position {i}: "
                    f"root has {root_corr!r}, record has {record.provenance.correlation_id!r}"
                )

        return True
