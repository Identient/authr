# Changelog

All notable changes to AuthR will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and AuthR adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — with the caveat that v0.x releases are explicitly drafts and may include breaking changes between minor versions.

## [Unreleased]

See [open milestones](https://github.com/identient/authr/milestones) for what's in flight.

## [0.1.0] — 2026-04-XX

### Added

- **Specification v0.1** ([spec/AUTHR-v0.1.md](spec/AUTHR-v0.1.md)) — initial protocol sketch defining six primitives (Author, Actor, Intent, Scope, Provenance, Drift), the AuthR Record structure, three operations (issue, extend, verify), and six verification invariants.
- **JSON Schema** ([schema/authr-record.schema.json](schema/authr-record.schema.json)) — formal schema for AuthR Records.
- **Python reference implementation** ([reference/python/](reference/python/)) — installable as `authr-protocol`, with dataclasses for all primitives, an `IssuingAuthority` for minting and extending records, and a `Verifier` enforcing all six invariants. Uses Ed25519 signatures and canonical JSON serialization.
- **Flagship example** ([reference/python/src/authr/examples/cfo_wire.py](reference/python/src/authr/examples/cfo_wire.py)) — runnable walkthrough of the CFO wire approval scenario, demonstrating root issuance, sub-agent hop, chain verification, and a rejected scope-widening attempt.
- **Working paper** ([docs/whitepaper.pdf](docs/whitepaper.pdf)) — long-form narrative with motivation, rationale, threat model, and use cases.
- **Architecture model** ([docs/architecture.md](docs/architecture.md)) — three-plane model (Control, Execution, Enforcement) documenting how AuthR records flow from authorship to enforcement.
- **Threat model** ([docs/threat-model.md](docs/threat-model.md)) — initial threat analysis covering external attackers, compromised agents, compromised sub-components, and insider Issuing Authority threats; STRIDE-aligned with two agentic-era-specific vectors (Authorship Forgery and Intent Drift).
- **Related work** ([docs/related-work.md](docs/related-work.md)) — positioning relative to OAuth 2.0/OIDC, RFC 8693, UMA 2.0, W3C VC/DIDs, SPIFFE, and CoSAI agentic IAM.

### Known limitations

- **Cross-domain federation** — not yet specified
- **Multi-author records** — committee authorship not yet supported as a native primitive
- **Revocation propagation** — bounded by short TTLs in v0.1; full cascade semantics defined in v0.2
- **Wire format** — JSON with detached JWS only; CBOR/COSE evaluation pending
- **Issuing Authority key compromise** — high residual risk; threshold signing targeted for v0.2
- **Intent drift detection** — auditable in v0.1, not yet preventable

See [docs/threat-model.md](docs/threat-model.md) for the full residual risk matrix.

### Notes

This is the first public draft. Naming, primitive structure, field names, and invariants are all subject to change based on feedback during the v0.x cycle. Implementers building production systems on v0.1 should expect breaking changes before v1.0.

---

[Unreleased]: https://github.com/identient/authr/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/identient/authr/releases/tag/v0.1.0
