"""
AuthR — Authorship Representation
Reference implementation of the v0.1 protocol.

This package provides:
    - Dataclasses for the six primitives (Author, Actor, Intent, Scope, Provenance, Drift)
    - AuthRRecord composing them
    - IssuingAuthority for minting and extending records
    - Verifier for enforcing the six invariants
    - Helper functions for canonical JSON serialization

Quick start:

    from authr import IssuingAuthority, Verifier, Author, Actor, Intent, Scope, Grounding

    ia = IssuingAuthority(key_id="my-key")
    verifier = Verifier(trust_store={"my-key": ia.public_key_bytes})

    record = ia.issue_root(
        author=Author(
            id="did:web:example.com:people:alice",
            type="verified_human",
            grounding=Grounding(
                referent_type="verified_human",
                verifier="example-hrms",
                evidence_digest="sha256:abc...",
            ),
        ),
        actor=Actor(
            id="spiffe://example.com/agents/orchestrator-1",
            type="agent",
        ),
        intent=Intent(
            purpose="approve_purchase",
            statement="Approve Q2 supplier payment",
            risk_tier="medium",
            human_in_the_loop=False,
        ),
        scope=Scope(actions=["po.approve"], resources=["account:opex-100"]),
    )

    verifier.verify_record(record)  # raises AuthRError on failure

See spec/AUTHR-v0.1.md in the repository for the normative protocol document.
"""

from authr.types import (
    AuthRRecord,
    Author,
    Actor,
    Intent,
    Scope,
    Provenance,
    Drift,
    Grounding,
    ModelManifest,
    Attestation,
    ChainLink,
    DataSource,
    Signature,
)
from authr.issuing import IssuingAuthority
from authr.verifier import Verifier
from authr.errors import (
    AuthRError,
    SignatureError,
    ExpiredError,
    AuthorDriftError,
    ScopeWidenedError,
    ChainBrokenError,
    DelegationDepthExceededError,
)
from authr.canonical import canonicalize

__version__ = "0.1.0"
__spec_version__ = "0.1"

__all__ = [
    # Types
    "AuthRRecord",
    "Author",
    "Actor",
    "Intent",
    "Scope",
    "Provenance",
    "Drift",
    "Grounding",
    "ModelManifest",
    "Attestation",
    "ChainLink",
    "DataSource",
    "Signature",
    # Operations
    "IssuingAuthority",
    "Verifier",
    # Errors
    "AuthRError",
    "SignatureError",
    "ExpiredError",
    "AuthorDriftError",
    "ScopeWidenedError",
    "ChainBrokenError",
    "DelegationDepthExceededError",
    # Helpers
    "canonicalize",
    # Versions
    "__version__",
    "__spec_version__",
]
