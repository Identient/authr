# AuthR — Python Reference Implementation

The reference implementation of the [AuthR v0.1 specification](../../spec/AUTHR-v0.1.md).

This is the canonical implementation. Other-language implementations should produce byte-identical canonical JSON output and pass the same verification invariants.

## Install

From the repository root:

```bash
cd reference/python
pip install -e .
```

For development:

```bash
pip install -e ".[dev]"
```

## Run the flagship example

```bash
python -m authr.examples.cfo_wire
```

This walks through the CFO wire approval scenario from the working paper: a root record minted, a sub-agent hop extended with attenuated scope, a full-chain verification, and an attempted scope-widening that is rejected by the verifier.

## Minimal usage

```python
from authr import (
    IssuingAuthority, Verifier,
    Author, Actor, Intent, Scope, Grounding,
)

# Mint a signing key and a verifier sharing its public key.
ia = IssuingAuthority(key_id="my-key")
verifier = Verifier(trust_store={"my-key": ia.public_key_bytes})

# Issue a root record.
record = ia.issue_root(
    author=Author(
        id="did:web:example.com:people:alice",
        type="verified_human",
        grounding=Grounding(
            referent_type="verified_human",
            verifier="example-hrms",
            evidence_digest="sha256:abc123...",
        ),
    ),
    actor=Actor(
        id="spiffe://example.com/agents/orchestrator-1",
        type="agent",
    ),
    intent=Intent(
        purpose="approve_purchase",
        statement="Approve Q2 supplier payment up to $50k",
        risk_tier="medium",
        human_in_the_loop=False,
    ),
    scope=Scope(
        actions=["po.approve"],
        resources=["account:opex-100"],
        constraints={"max_amount": 50000.0, "currency": "USD"},
    ),
)

# Verify the record. Raises AuthRError subclass on any invariant violation.
verifier.verify_record(record)
```

## Package structure

```
authr/
├── __init__.py        Public API
├── types.py           Dataclasses for the six primitives and AuthRRecord
├── canonical.py       Deterministic JSON serialization
├── issuing.py         IssuingAuthority — mints and extends records
├── verifier.py        Verifier — enforces the six invariants
├── errors.py          Exception hierarchy
└── examples/
    ├── __init__.py
    └── cfo_wire.py    Flagship runnable scenario
```

## Public API

| Symbol | Purpose |
|---|---|
| `IssuingAuthority` | Holds a signing key; mints and extends AuthR Records |
| `Verifier` | Verifies records and chains against a Trust Store |
| `AuthRRecord` | The signed record dataclass |
| `Author`, `Actor`, `Intent`, `Scope`, `Provenance`, `Drift` | The six primitives |
| `Grounding`, `ModelManifest`, `Attestation`, `ChainLink`, `DataSource`, `Signature` | Sub-structures |
| `canonicalize(obj) -> bytes` | Produces canonical JSON for signing |
| `AuthRError` (and subclasses) | Raised by verify operations on invariant violations |

## Errors

All errors inherit from `AuthRError`:

| Exception | Invariant violated |
|---|---|
| `SignatureError` | 1 — signature does not validate, or kid not in Trust Store |
| `ExpiredError` | 2 — record's expires_at has passed |
| `AuthorDriftError` | 3 — author.id changed across the chain |
| `ScopeWidenedError` | 4 — child scope is not a strict subset of parent |
| `ChainBrokenError` | 5 — chain continuity or correlation_id violated |
| `RevokedError` | 6 — record has been revoked |
| `DelegationDepthExceededError` | Extend would exceed max_delegation_depth |
| `GroundingError` | Author is not properly grounded |

## Tests

```bash
pytest
```

## Production deployment notes

This is a reference implementation. Before using AuthR in production:

- **Replace in-memory key generation with hardware-backed keys.** `IssuingAuthority` generates an in-memory Ed25519 key on instantiation by default. Production deployments MUST inject a key managed by an HSM, cloud KMS, or threshold-signing scheme.
- **Persist correlation and replay state.** The reference does not include a replay cache. Production systems should detect duplicate `authr_id` values within the expiry window.
- **Implement the Revocation Service.** v0.1's `Verifier` accepts an in-memory set of revoked IDs. Production systems need an event-driven revocation channel and a persistent store.
- **Tune `expires_at` to your risk tier.** The default 30-minute TTL is reasonable for many scenarios but should be shorter for high-risk operations and longer with caution.

See the [v0.1 specification §6 (Security considerations)](../../spec/AUTHR-v0.1.md#6-security-considerations) for the full residual-risk picture.

## License

Apache 2.0. See [../../LICENSE](../../LICENSE).
