"""
AuthR v0.1 — Flagship Example: CFO Wire Approval

Scenario: A CFO (Jane Doe) — via her verified digital twin — authorizes a
treasury orchestrator agent to release a Q2 supplier payment. The orchestrator
delegates the prepare-and-validate work to a narrower validator sub-agent.
Finally, a compromised tool attempts to widen scope to a cancel operation
that was never authorized, and the verifier rejects it.

Run:
    python -m authr.examples.cfo_wire

What this demonstrates:
    - Issuance of a root AuthR Record anchored to a grounded human author
    - Extension (hop) with monotonic scope attenuation
    - Full-chain verification against all six invariants
    - Rejection of a scope-widening attack
"""

from __future__ import annotations

from authr import (
    Actor,
    Author,
    DataSource,
    Grounding,
    Intent,
    IssuingAuthority,
    Scope,
    Verifier,
)
from authr.errors import ScopeWidenedError


def main() -> None:
    print("=" * 72)
    print("AuthR v0.1 — Flagship Scenario: CFO Wire Approval")
    print("=" * 72)
    print()

    # ---------------- T0: SETUP ----------------
    # In production, the IssuingAuthority's signing key lives in an HSM or KMS.
    # For this demo, it's an in-memory Ed25519 key.
    ia = IssuingAuthority(key_id="treasury-twin-key-1")
    verifier = Verifier(trust_store={"treasury-twin-key-1": ia.public_key_bytes})

    # ---------------- T1: ISSUE ROOT ----------------
    # Jane Doe (CFO), via her verified digital twin, approves a quarterly
    # supplier payment. The IssuingAuthority mints a root record.
    cfo = Author(
        id="did:web:acme.com:people:jane-doe",
        type="verified_digital_twin",
        role="CFO",
        display_name="Jane Doe (CFO)",
        grounding=Grounding(
            referent_type="verified_human",
            verifier="acme-hrms",
            evidence_digest="sha256:a3f2...",
            verified_at="2026-04-20T14:02:10Z",
        ),
    )
    orchestrator = Actor(
        id="spiffe://acme.com/agents/treasury-orchestrator/instance-42",
        type="orchestrator",
    )
    intent = Intent(
        purpose="approve_wire_transfer",
        statement=(
            "Release Q2 supplier payment per approved schedule; "
            "halt if variance > 5% or counterparty changed in last 48h."
        ),
        risk_tier="high",
        human_in_the_loop=True,
    )
    full_scope = Scope(
        actions=["wire.prepare", "wire.validate", "wire.approve", "wire.submit"],
        resources=["account:acme-opex-7788", "counterparty:acme-supplies"],
        constraints={
            "max_amount": 250000.00,
            "currency": "USD",
            "max_delegation_depth": 2,
            "valid_window_minutes": 30,
        },
    )
    policy = DataSource(
        source_id="policy:treasury-payments-v7",
        source_hash="sha256:b1f0...",
        source_type="policy",
    )

    root = ia.issue_root(
        author=cfo,
        actor=orchestrator,
        intent=intent,
        scope=full_scope,
        data_sources=[policy],
    )

    print(f"Root record id:     {root.authr_id}")
    print(f"Correlation id:     {root.provenance.correlation_id}")
    print(f"Author (root):      {root.author.display_name}")
    print(f"Root actions:       {root.scope.actions}")
    print()

    # ---------------- T2: EXTEND (HOP) ----------------
    # The orchestrator delegates prepare-and-validate to a narrower sub-agent.
    # Scope attenuates: approve and submit are dropped.
    validator = Actor(
        id="spiffe://acme.com/agents/wire-validator/instance-7",
        type="agent",
    )
    attenuated = Scope(
        actions=["wire.prepare", "wire.validate"],
        resources=full_scope.resources,
        constraints=full_scope.constraints,
    )
    hop = ia.extend(parent=root, actor=validator, attenuated_scope=attenuated)

    print(f"Hop record id:      {hop.authr_id}")
    print(f"Author (preserved): {hop.author.display_name}")
    print(f"Hop actions:        {hop.scope.actions}")
    print(f"Chain depth:        {len(hop.provenance.chain)}")
    print()

    # ---------------- T3: VERIFY CHAIN ----------------
    chain = [root, hop]
    verifier.verify_chain(chain)
    print("Chain verified OK against all six invariants.")
    print()

    # ---------------- T4: ADVERSARIAL — SCOPE-WIDENING ATTEMPT ----------------
    # A compromised sub-agent tries to widen scope to cancel the wire —
    # an action the parent never authorized. The IssuingAuthority refuses
    # to mint the hop, and even if a malicious record were forged, the
    # Verifier would reject it.
    print("Adversarial test: compromised tool attempts to widen scope...")
    malicious_scope = Scope(
        actions=["wire.cancel"],  # NEVER authorized by parent
        resources=full_scope.resources,
        constraints=full_scope.constraints,
    )
    try:
        ia.extend(parent=hop, actor=validator, attenuated_scope=malicious_scope)
        print("  UNEXPECTED: extension succeeded (this is a bug)")
    except ScopeWidenedError as e:
        print(f"  REJECTED by IssuingAuthority: {e}")
    print()

    print("=" * 72)
    print("Result: chain valid; widening rejected structurally, not operationally.")
    print("=" * 72)


if __name__ == "__main__":
    main()
