# AuthR Test Vectors

Reference records produced by the Python implementation. Other-language implementations should verify against these to confirm interoperability.

## How to use

1. Load the trust store from [`trust-store.json`](trust-store.json) — it maps `kid` to base64-encoded raw Ed25519 public key bytes.
2. For each record in [`valid/`](valid/), your `Verifier` MUST report success.
3. For each record or chain in [`invalid/`](invalid/), your `Verifier` MUST report the expected failure mode.

## Valid records

| File | Description | Expected result |
|---|---|---|
| `valid/01-root-record.json` | A signed root record with all required fields | `verify_record` returns success |
| `valid/02-extended-chain.json` | A two-record chain: root + one hop with attenuated scope | `verify_chain` returns success |

## Invalid records (must be rejected)

| File | What was tampered | Expected error |
|---|---|---|
| `invalid/01-scope-widened.json` | Hop record's `scope.actions` was modified after signing to include `wire.cancel` | `SignatureError` (invariant 1) — any byte change invalidates the signature, so tampered chains never even reach the scope check |
| `invalid/02-tampered-record.json` | Root record's `actor.id` was modified after signing | `SignatureError` (invariant 1) |

This is exactly the intended defense: a tampered record cannot be re-signed without the Issuing Authority's signing key, so invariant 1 catches the attack before any deeper check is needed. Tests that exercise the deeper invariants (scope, author drift, chain continuity) need to construct legitimately-signed-but-structurally-invalid chains, which is harder to do without compromising the IA — additional vectors of this kind will land in subsequent releases.

## Adding test vectors

To contribute additional test vectors:

1. Open an issue describing the scenario and which invariant it exercises
2. Generate the record using the Python reference (so signatures match the canonical-JSON format)
3. Submit a PR adding the vector to the appropriate directory and updating this README

## Cross-implementation conformance

When other-language implementations land (TypeScript, Go, Rust, etc.), they should:

1. Pass all valid vectors with the same trust store
2. Reject all invalid vectors with the expected error class
3. Produce byte-identical canonical JSON output when serializing the same logical record

Conformance test reports can be posted as Discussions in the repository.
