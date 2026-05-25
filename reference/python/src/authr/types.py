"""
AuthR data types — the six primitives and the AuthR Record composing them.

All dataclasses are JSON-serializable via the .to_dict() method, and the resulting
dicts are designed to canonicalize identically across implementations using JCS
(RFC 8785) or equivalent.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any, Literal, Optional


AuthorType = Literal["verified_human", "verified_digital_twin", "organization", "committee"]
ActorType = Literal["agent", "ai_worker", "orchestrator", "tool", "human_operator"]
RiskTier = Literal["low", "medium", "high", "critical"]
ReferentType = Literal["verified_human", "verified_organization", "verified_committee"]
SourceType = Literal["policy", "dataset", "ruling", "document", "credential"]
AttestationType = Literal[
    "tee_tdx", "tee_sgx", "tee_sev_snp", "spiffe_svid", "platform_attestation"
]
SignatureAlg = Literal["EdDSA", "ES256", "RS256"]


@dataclass(frozen=True)
class Grounding:
    """Evidence linking an Author to a real-world referent."""

    referent_type: ReferentType
    verifier: str
    evidence_digest: str
    verified_at: Optional[str] = None  # ISO 8601 UTC; set by IssuingAuthority if omitted

    def to_dict(self) -> dict[str, Any]:
        return {k: v for k, v in asdict(self).items() if v is not None}


@dataclass(frozen=True)
class Author:
    """The responsible party whose judgment is being executed."""

    id: str
    type: AuthorType
    grounding: Grounding
    role: Optional[str] = None
    display_name: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "id": self.id,
            "type": self.type,
            "grounding": self.grounding.to_dict(),
        }
        if self.role is not None:
            out["role"] = self.role
        if self.display_name is not None:
            out["display_name"] = self.display_name
        return out


@dataclass(frozen=True)
class ModelManifest:
    """Signed code and model hashes for an Actor."""

    code_hash: str
    model_hash: str
    model_version: str
    signer_id: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Attestation:
    """Runtime attestation evidence for an Actor."""

    type: AttestationType
    evidence_digest: str
    verified_at: str  # ISO 8601 UTC

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Actor:
    """The entity that actually executes the action."""

    id: str
    type: ActorType
    model_manifest: Optional[ModelManifest] = None
    attestation: Optional[Attestation] = None

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {"id": self.id, "type": self.type}
        if self.model_manifest is not None:
            out["model_manifest"] = self.model_manifest.to_dict()
        if self.attestation is not None:
            out["attestation"] = self.attestation.to_dict()
        return out


@dataclass(frozen=True)
class Intent:
    """The purpose and parameters of the action."""

    purpose: str
    statement: str
    risk_tier: RiskTier
    human_in_the_loop: bool

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Scope:
    """Explicit limits on what the Actor may do under this authorship."""

    actions: list[str]
    resources: list[str]
    constraints: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "actions": list(self.actions),
            "resources": list(self.resources),
        }
        if self.constraints:
            out["constraints"] = dict(self.constraints)
        return out


@dataclass(frozen=True)
class ChainLink:
    """A reference to a parent record within a provenance chain."""

    authr_id: str
    depth: int
    issuer: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class DataSource:
    """A source consulted in producing this authorship decision."""

    source_id: str
    source_hash: str
    source_type: SourceType

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class Provenance:
    """Lineage and correlation for an AuthR Record."""

    chain: list[ChainLink]
    correlation_id: str
    data_sources: list[DataSource] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "chain": [link.to_dict() for link in self.chain],
            "correlation_id": self.correlation_id,
        }
        if self.data_sources:
            out["data_sources"] = [ds.to_dict() for ds in self.data_sources]
        return out


@dataclass(frozen=True)
class Drift:
    """Confidence, staleness, and deviation signals."""

    confidence: float
    stale_after: str  # ISO 8601 UTC
    deviation_signals: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "confidence": self.confidence,
            "stale_after": self.stale_after,
        }
        if self.deviation_signals:
            out["deviation_signals"] = list(self.deviation_signals)
        return out


@dataclass(frozen=True)
class Signature:
    """Detached signature over the canonicalized record."""

    alg: SignatureAlg
    kid: str
    value: str  # base64url-encoded

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class AuthRRecord:
    """A signed AuthR Record asserting authorship for a unit of agentic work."""

    authr_id: str
    version: str
    issued_at: str
    expires_at: str
    author: Author
    actor: Actor
    intent: Intent
    scope: Scope
    provenance: Provenance
    signature: Signature
    drift: Optional[Drift] = None

    def to_dict(self, include_signature: bool = True) -> dict[str, Any]:
        """
        Serialize the record to a dict.

        If include_signature is False, the signature field is omitted —
        used by IssuingAuthority and Verifier to compute the bytes-to-sign.
        """
        out: dict[str, Any] = {
            "authr_id": self.authr_id,
            "version": self.version,
            "issued_at": self.issued_at,
            "expires_at": self.expires_at,
            "author": self.author.to_dict(),
            "actor": self.actor.to_dict(),
            "intent": self.intent.to_dict(),
            "scope": self.scope.to_dict(),
            "provenance": self.provenance.to_dict(),
        }
        if self.drift is not None:
            out["drift"] = self.drift.to_dict()
        if include_signature:
            out["signature"] = self.signature.to_dict()
        return out
