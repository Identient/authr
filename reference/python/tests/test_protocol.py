"""Tests for IssuingAuthority and Verifier — exercises the six invariants."""

from __future__ import annotations

import time
from datetime import datetime, timedelta, timezone

import pytest

from authr import (
    Actor,
    Author,
    AuthRRecord,
    DataSource,
    Grounding,
    Intent,
    IssuingAuthority,
    Scope,
    Signature,
    Verifier,
)
from authr.errors import (
    AuthorDriftError,
    ChainBrokenError,
    ExpiredError,
    GroundingError,
    RevokedError,
    ScopeWidenedError,
    SignatureError,
)


def _author() -> Author:
    return Author(
        id="did:web:example.com:people:alice",
        type="verified_human",
        role="CFO",
        display_name="Alice (CFO)",
        grounding=Grounding(
            referent_type="verified_human",
            verifier="example-hrms",
            evidence_digest="sha256:abc123",
        ),
    )


def _actor(suffix: str = "1") -> Actor:
    return Actor(
        id=f"spiffe://example.com/agents/orchestrator-{suffix}",
        type="agent",
    )


def _intent() -> Intent:
    return Intent(
        purpose="approve_purchase",
        statement="Approve Q2 supplier payment",
        risk_tier="medium",
        human_in_the_loop=False,
    )


def _scope() -> Scope:
    return Scope(
        actions=["po.approve", "po.submit"],
        resources=["account:opex-100"],
        constraints={"max_amount": 50000.0, "max_delegation_depth": 3},
    )


def _ia() -> IssuingAuthority:
    return IssuingAuthority(key_id="test-key-1")


def _verifier_for(ia: IssuingAuthority) -> Verifier:
    return Verifier(trust_store={ia.key_id: ia.public_key_bytes})


def test_issue_root_produces_verifiable_record():
    ia = _ia()
    v = _verifier_for(ia)
    record = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    assert v.verify_record(record) is True


def test_extend_preserves_author_and_intent_and_narrows_scope():
    ia = _ia()
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    narrow = Scope(actions=["po.approve"], resources=root.scope.resources, constraints=root.scope.constraints)
    hop = ia.extend(parent=root, actor=_actor("2"), attenuated_scope=narrow)
    assert hop.author.id == root.author.id
    assert hop.intent == root.intent
    assert set(hop.scope.actions) == {"po.approve"}
    assert hop.provenance.correlation_id == root.provenance.correlation_id


def test_chain_verifies():
    ia = _ia()
    v = _verifier_for(ia)
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    narrow = Scope(actions=["po.approve"], resources=root.scope.resources, constraints=root.scope.constraints)
    hop = ia.extend(parent=root, actor=_actor("2"), attenuated_scope=narrow)
    assert v.verify_chain([root, hop]) is True


def test_extend_rejects_scope_widening_actions():
    ia = _ia()
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    with pytest.raises(ScopeWidenedError):
        wider = Scope(
            actions=["po.approve", "po.submit", "po.cancel"],  # adds an action
            resources=root.scope.resources,
            constraints=root.scope.constraints,
        )
        ia.extend(parent=root, actor=_actor("2"), attenuated_scope=wider)


def test_extend_rejects_scope_widening_resources():
    ia = _ia()
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    with pytest.raises(ScopeWidenedError):
        wider = Scope(
            actions=root.scope.actions,
            resources=["account:opex-100", "account:capex-200"],  # adds a resource
            constraints=root.scope.constraints,
        )
        ia.extend(parent=root, actor=_actor("2"), attenuated_scope=wider)


def test_extend_rejects_loosening_constraint():
    ia = _ia()
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    with pytest.raises(ScopeWidenedError):
        looser = Scope(
            actions=root.scope.actions,
            resources=root.scope.resources,
            constraints={**root.scope.constraints, "max_amount": 999999.0},  # raises cap
        )
        ia.extend(parent=root, actor=_actor("2"), attenuated_scope=looser)


def test_unknown_kid_fails_verification():
    ia = _ia()
    v = Verifier(trust_store={"some-other-kid": ia.public_key_bytes})
    record = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    with pytest.raises(SignatureError):
        v.verify_record(record)


def test_tampered_record_fails_signature():
    ia = _ia()
    v = _verifier_for(ia)
    record = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    # Tamper: build a new record with a different actor id but the original signature
    tampered = AuthRRecord(
        authr_id=record.authr_id,
        version=record.version,
        issued_at=record.issued_at,
        expires_at=record.expires_at,
        author=record.author,
        actor=Actor(id="spiffe://example.com/agents/EVIL", type="agent"),
        intent=record.intent,
        scope=record.scope,
        provenance=record.provenance,
        drift=record.drift,
        signature=record.signature,
    )
    with pytest.raises(SignatureError):
        v.verify_record(tampered)


def test_revoked_record_fails():
    ia = _ia()
    v = _verifier_for(ia)
    record = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    v.revoke(record.authr_id)
    with pytest.raises(RevokedError):
        v.verify_record(record)


def test_expired_record_fails():
    ia = IssuingAuthority(key_id="test-key-1", default_ttl_seconds=1)
    v = _verifier_for(ia)
    record = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    time.sleep(2)
    with pytest.raises(ExpiredError):
        v.verify_record(record)


def test_ungrounded_author_rejected():
    ia = _ia()
    bad = Author(
        id="did:web:example.com:people:bob",
        type="verified_human",
        grounding=Grounding(referent_type="verified_human", verifier="", evidence_digest=""),
    )
    with pytest.raises(GroundingError):
        ia.issue_root(author=bad, actor=_actor(), intent=_intent(), scope=_scope())


def test_author_drift_in_chain_fails():
    # Construct a chain where the second record has a different author.
    # We have to do this by hand because the IssuingAuthority won't let us.
    ia = _ia()
    v = _verifier_for(ia)
    root = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())

    # Mint a separate root with a different author, then claim it's a hop of the first.
    other_author = Author(
        id="did:web:example.com:people:eve",
        type="verified_human",
        grounding=Grounding(
            referent_type="verified_human", verifier="example-hrms", evidence_digest="sha256:xyz"
        ),
    )
    forged_hop = ia.issue_root(author=other_author, actor=_actor("2"), intent=_intent(), scope=_scope())
    with pytest.raises(AuthorDriftError):
        v.verify_chain([root, forged_hop])


def test_chain_continuity_broken_fails():
    ia = _ia()
    v = _verifier_for(ia)
    root_a = ia.issue_root(author=_author(), actor=_actor(), intent=_intent(), scope=_scope())
    root_b = ia.issue_root(author=_author(), actor=_actor("2"), intent=_intent(), scope=_scope())
    # root_b has empty chain, so verify_chain([root_a, root_b]) should detect the break.
    with pytest.raises(ChainBrokenError):
        v.verify_chain([root_a, root_b])
