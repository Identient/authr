# Example: CFO Wire Approval

The flagship scenario from the [AuthR working paper](../../docs/whitepaper.pdf), as runnable code.

## What it shows

A CFO authorizes a $250K supplier wire via her verified digital twin. A treasury orchestrator agent receives the root authorship record, then delegates prepare-and-validate work to a narrower validator sub-agent. The full chain verifies against all six invariants. Finally, a compromised tool attempts to widen scope to a `wire.cancel` action that was never authorized — the verifier rejects it.

This is the regime AuthR was designed for: **high-stakes, multi-hop, asynchronous, agent-driven, and auditable after the fact** — the conditions under which OAuth On-Behalf-Of alone falls short.

## Run it

From the repository root:

```bash
cd reference/python
pip install -e .
python -m authr.examples.cfo_wire
```

Expected output:

```
========================================================================
AuthR v0.1 — Flagship Scenario: CFO Wire Approval
========================================================================

Root record id:     urn:authr:...
Correlation id:     corr-...
Author (root):      Jane Doe (CFO)
Root actions:       ['wire.prepare', 'wire.validate', 'wire.approve', 'wire.submit']

Hop record id:      urn:authr:...
Author (preserved): Jane Doe (CFO)
Hop actions:        ['wire.prepare', 'wire.validate']
Chain depth:        1

Chain verified OK against all six invariants.

Adversarial test: compromised tool attempts to widen scope...
  REJECTED by IssuingAuthority: scope expansion: actions {'wire.cancel'}

========================================================================
Result: chain valid; widening rejected structurally, not operationally.
========================================================================
```

## What the chain looks like

### T0 — Authorship anchors

The CFO (via her verified digital twin) approves a quarterly supplier payment. The Issuing Authority mints a **root** record:

- `author` = Jane Doe (CFO), grounded by an HRMS record
- `actor` = treasury orchestrator agent
- `intent` = release Q2 supplier payment per approved schedule; halt if variance > 5% or counterparty changed in 48h
- `scope` = `[wire.prepare, wire.validate, wire.approve, wire.submit]` on a specific account and counterparty, max $250K, 30-minute window, delegation depth 2
- `human_in_the_loop` = true

### T1 — Sub-agent hop

The orchestrator delegates prepare-and-validate to a narrower validator agent. The Issuing Authority extends the chain:

- **Same** author (Jane Doe — authorship does not change hands)
- **New** actor (validator sub-agent)
- **Attenuated** scope (only `[wire.prepare, wire.validate]`)
- **Same** intent (carries forward unchanged)
- **Same** correlation id

### T2 — Adversarial test

A compromised sub-agent attempts to add `wire.cancel` to its scope. The verifier (and the Issuing Authority's `extend` operation) reject the attempt before it reaches any resource. **Monotonic scope attenuation is enforced structurally, not hoped for operationally.**

## What would have failed under OBO alone

The working paper describes four specific failure modes that this scenario exposes:

- **Intent drift** — an OBO token would authorize a re-planned wire with different rationale. AuthR's intent statement makes the mismatch legible.
- **Long-running execution** — a token minted at T0 and used 30 minutes later would be suspect. AuthR's `stale_after` forces a re-anchor before irreversible effects.
- **Accountability** — an OBO audit tells you which token was used. An AuthR audit tells you whose judgment was executed and proves it with grounding evidence.
- **Scope expansion** — a compromised sub-agent cannot widen its own scope in AuthR. The verifier rejects it before any request reaches the wire service.

## Modify and extend

The example lives in [`reference/python/src/authr/examples/cfo_wire.py`](../../reference/python/src/authr/examples/cfo_wire.py). Modify it freely to test other scenarios — different intent statements, deeper delegation chains, alternate scope attenuation patterns, drift-detection cases.

If you build a useful new example, consider contributing it back. See [CONTRIBUTING.md](../../CONTRIBUTING.md).
