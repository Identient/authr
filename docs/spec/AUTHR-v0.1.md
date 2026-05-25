# AuthR v0.1 Specification

**Authorship Representation: A Protocol for Verifying Responsibility in Agentic Systems**

| | |
|---|---|
| **Status** | Draft for Discussion |
| **Version** | 0.1.0 |
| **Date** | April 2026 |
| **Editor** | Steve Tout (Identient) |
| **License** | Apache 2.0 |

---

## Abstract

This document specifies AuthR (Authorship Representation), a protocol for asserting and verifying responsibility for actions taken by autonomous agents on behalf of human or organizational principals. AuthR complements existing identity standards — it does not replace AuthN (authentication) or AuthZ (authorization). It defines a signed, time-bound record format that carries grounded authorship, intent, and lineage across the full execution graph of agentic work; three operations (issue, extend, verify); and six invariants that all valid AuthR chains MUST satisfy.

This is an early sketch, published openly to invite criticism, alternative implementations, and standards-body engagement. Naming, structure, and semantics are subject to change before v1.0.

## 1. Conformance terminology

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** in this document are to be interpreted as described in [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) and [RFC 8174](https://datatracker.ietf.org/doc/html/rfc8174).

## 2. Terminology

- **Author** — The real-world referent whose judgment is being executed. A human, verified digital twin, organization, or committee. The Author is *not* the agent that executes the action.
- **Actor** — The entity that executes the action under the Author's authorship. Typically an agent, AI worker, orchestrator, or tool.
- **AuthR Record** — A signed, time-bound JSON object asserting authorship for a unit of agentic work.
- **Chain** — An ordered sequence of AuthR Records linked by `provenance.chain`, sharing a single `correlation_id`, beginning with a root record.
- **Issuing Authority** — A control plane component that signs AuthR Records. Analogous in role to an OAuth Authorization Server, but for authorship rather than access.
- **Trust Store** — A relying party's mapping of trusted key identifiers (`kid`) to public keys.
- **Verifier** — A component (typically at an enforcement point) that validates an AuthR Record or Chain against the Trust Store and the six invariants.
- **Root Record** — The first AuthR Record in a chain. Carries the original Author, initial Actor, full Intent, and the broadest Scope.
- **Hop Record** — A non-root AuthR Record produced by an `extend` operation. Inherits Author and Intent from its parent; has a narrower Scope; references its parent in `provenance.chain`.

## 3. The AuthR Record

An AuthR Record is a JSON object with the following top-level fields:

| Field | Type | Required | Description |
|---|---|---|---|
| `authr_id` | string | MUST | Globally unique identifier. URN format: `urn:authr:<ULID>` |
| `version` | string | MUST | Specification version. `"0.1"` for this draft. |
| `issued_at` | string (ISO 8601 UTC) | MUST | Issuance timestamp. |
| `expires_at` | string (ISO 8601 UTC) | MUST | Expiry timestamp. SHOULD be short-lived (minutes to hours, not days). |
| `author` | object | MUST | The responsible party. See §3.1. |
| `actor` | object | MUST | The executing entity. See §3.2. |
| `intent` | object | MUST | Purpose and parameters of the action. See §3.3. |
| `scope` | object | MUST | Explicit limits on what may be done. See §3.4. |
| `provenance` | object | MUST | Lineage and correlation. See §3.5. |
| `drift` | object | SHOULD | Confidence, staleness, and deviation signals. See §3.6. |
| `revocation` | object | MAY | Optional endpoint for real-time status checks. See §3.7. |
| `signature` | object | MUST | Detached signature over the canonicalized record. See §3.8. |

### 3.1 Author

```json
{
  "id": "did:web:acme.com:people:jane-doe",
  "type": "verified_digital_twin",
  "role": "CFO",
  "display_name": "Jane Doe (CFO)",
  "grounding": {
    "referent_type": "verified_human",
    "verified_at": "2026-04-20T14:02:10Z",
    "verifier": "acme-hrms",
    "evidence_digest": "sha256:a3f2..."
  }
}
```

- `id` (MUST) — Stable identifier. SHOULD be a DID, SPIFFE ID, or other globally unique URI.
- `type` (MUST) — One of: `verified_human`, `verified_digital_twin`, `organization`, `committee`.
- `grounding` (MUST) — Evidence linking the Author to a real-world referent. An Author without grounding is a synthetic persona; AuthR requires grounded Authors.

### 3.2 Actor

```json
{
  "id": "spiffe://acme.com/agents/treasury-orchestrator/instance-42",
  "type": "agent",
  "model_manifest": {
    "code_hash": "sha256:c81e...",
    "model_hash": "sha256:9f0a...",
    "model_version": "2026.04",
    "signer_id": "acme-ai-governance"
  },
  "attestation": {
    "type": "tee_tdx",
    "evidence_digest": "sha256:...",
    "verified_at": "2026-04-20T14:02:11Z"
  }
}
```

- `id` (MUST) — Stable identifier for the executing entity. SPIFFE IDs RECOMMENDED for workload identities.
- `type` (MUST) — One of: `agent`, `ai_worker`, `orchestrator`, `tool`, `human_operator`.
- `model_manifest` (SHOULD) — Signed code and model hashes. Without this, swapping a model under a stable agent identifier is undetectable.
- `attestation` (SHOULD) — Runtime attestation evidence (TEE quote, SPIFFE SVID, platform attestation).

### 3.3 Intent

```json
{
  "purpose": "approve_wire_transfer",
  "statement": "Release Q2 supplier payment per approved schedule; halt if variance > 5% or counterparty changed in last 48h.",
  "risk_tier": "high",
  "human_in_the_loop": true
}
```

- `purpose` (MUST) — Canonical purpose label from a controlled vocabulary defined by the deploying organization.
- `statement` (MUST) — Natural-language statement of intent in the Author's own terms, captured at authorship time.
- `risk_tier` (MUST) — One of: `low`, `medium`, `high`, `critical`.
- `human_in_the_loop` (MUST) — Boolean. If `true`, irreversible actions MUST pause for live human confirmation.

Intent **MUST** be inherited across hops (carried forward unchanged by `extend`). It is **never** reinvented at a hop.

### 3.4 Scope

```json
{
  "actions": ["wire.prepare", "wire.validate", "wire.approve", "wire.submit"],
  "resources": ["account:acme-opex-7788", "counterparty:acme-supplies"],
  "constraints": {
    "max_amount": 250000.00,
    "currency": "USD",
    "max_delegation_depth": 2,
    "valid_window_minutes": 30
  }
}
```

- `actions` (MUST) — Array of action identifiers permitted under this authorship.
- `resources` (MUST) — Array of resource identifiers the actions may target.
- `constraints` (SHOULD) — Quantitative or temporal limits.

**Invariant: Monotonic scope attenuation.** For any pair of records `parent` and `child` in a chain, `child.scope` MUST be a strict subset of `parent.scope`. A child MAY narrow any dimension; it MUST NOT widen any dimension. The Verifier enforces this; applications MUST NOT rely on actors to honor it voluntarily.

### 3.5 Provenance

```json
{
  "chain": [
    {"authr_id": "urn:authr:...", "depth": 1, "issuer": "treasury-twin-key-1"}
  ],
  "correlation_id": "corr-7e21...",
  "data_sources": [
    {
      "source_id": "policy:treasury-payments-v7",
      "source_hash": "sha256:...",
      "source_type": "policy"
    }
  ]
}
```

- `chain` (MUST) — Ordered array of ancestor record references. Empty array for root records.
- `correlation_id` (MUST) — Identifier tying the full execution graph together. Stable across the chain.
- `data_sources` (SHOULD) — Datasets, policies, prior rulings, or retrieved documents that shaped the decision.

### 3.6 Drift

```json
{
  "confidence": 0.97,
  "stale_after": "2026-04-20T14:32:11Z",
  "deviation_signals": []
}
```

- `confidence` (SHOULD) — Decision-time confidence, 0.0 to 1.0.
- `stale_after` (SHOULD) — Timestamp after which the record SHOULD be re-anchored before irreversible effects.
- `deviation_signals` (MAY) — Observed signals suggesting the original intent may no longer match reality.

### 3.7 Revocation

```json
{
  "status_endpoint": "https://control.acme.com/authr/status",
  "check_required": true
}
```

If present, enforcement points MUST consult `status_endpoint` before executing high-risk actions. Implementations SHOULD also support event-driven revocation via webhook or pub/sub.

### 3.8 Signature

```json
{
  "alg": "EdDSA",
  "kid": "treasury-twin-key-1",
  "value": "base64url..."
}
```

- `alg` (MUST) — Signature algorithm. `EdDSA` (Ed25519) REQUIRED at v0.1. Additional algorithms MAY be supported.
- `kid` (MUST) — Key identifier resolvable in the relying party's Trust Store.
- `value` (MUST) — Base64url-encoded signature over the canonicalized record (with the `signature` field removed).

**Canonicalization**: implementations MUST serialize records using JCS ([RFC 8785](https://datatracker.ietf.org/doc/html/rfc8785)) or an equivalent deterministic JSON canonicalization producing byte-identical output across implementations.

## 4. Operations

### 4.1 Issue (Root)

The Issuing Authority mints a root AuthR Record when an Author authorizes an Actor to begin work.

**Inputs**: `author`, `actor`, `intent`, `scope`, optional `data_sources`, optional `correlation_id`, optional `confidence`.

**Behavior**: the Issuing Authority assigns `authr_id`, `issued_at`, `expires_at`, an empty `provenance.chain`, a new `correlation_id` if not provided, and signs the record.

**Preconditions**:
- The Author MUST be resolvable in the Registry with non-revoked status.
- The Actor MUST present valid attestation, if attestation is configured for its type.

### 4.2 Extend (Hop)

When an Actor delegates a sub-task to another Actor, the Issuing Authority extends the parent record.

**Inputs**: `parent` (AuthR Record), `actor` (the new sub-Actor), `attenuated_scope`, optional `confidence`.

**Behavior**: the Issuing Authority produces a new record with:

- A new `authr_id`
- The **same** `author` (authorship does not transfer)
- The new `actor`
- The **same** `intent` (intent does not change at hops)
- The `attenuated_scope` (MUST be a strict subset of `parent.scope`)
- A `provenance.chain` containing the parent's chain plus a new link to the parent
- The **same** `correlation_id` as the parent
- An `expires_at` MUST NOT be later than the parent's `expires_at`

**Preconditions**:
- The parent record MUST verify successfully.
- The attenuated scope MUST satisfy monotonic scope attenuation (§3.4).
- The chain depth MUST NOT exceed `parent.scope.constraints.max_delegation_depth`.

### 4.3 Verify

A relying party (typically an enforcement point) verifies a record or full chain against its Trust Store.

**Inputs**: an AuthR Record (for single-record verification) or an ordered Chain (for full-chain verification).

**Behavior**: the Verifier evaluates the six invariants. If any fail, the Verifier MUST reject the request with an error referencing the failed invariant.

## 5. The six invariants

For a chain to verify, **all** of the following MUST hold:

1. **Signature validity** — every record's `signature.value` MUST be a valid signature over the canonicalized record (minus `signature`), produced by the key identified by `signature.kid`, where `kid` is present in the relying party's Trust Store.

2. **Not expired** — `now < record.expires_at` for every record in the chain.

3. **Stable author** — `author.id` MUST be identical for every record in the chain.

4. **Monotonic scope** — for every consecutive pair `(parent, child)` in the chain, `child.scope` MUST be a strict subset of `parent.scope` (no actions, resources, or constraint values added; constraint values MAY become more restrictive but MUST NOT loosen).

5. **Chain continuity** — for every non-root record, the last entry in `provenance.chain` MUST reference the `authr_id` of the immediately preceding record in the chain. All records MUST share the same `correlation_id`.

6. **Revocation supremacy** — if any record in the chain has been revoked (per its `revocation` endpoint or the Trust Store's revocation list), the entire downstream chain MUST be treated as invalid.

## 6. Security considerations

### 6.1 Threat model

The v0.1 threat model covers four adversary classes:

- **A1: External attacker** with no insider access
- **A2: Compromised agent** with valid credentials and prompt-injected behavior
- **A3: Compromised sub-component** controlling a single node in the execution graph
- **A4: Insider with Issuing Authority signing key access**

The full threat model is in [docs/threat-model.md](../docs/threat-model.md).

### 6.2 Residual risks in v0.1

Known gaps that MUST be addressed before AuthR is suitable for security-critical production deployment:

- **Issuing Authority key compromise** (T-03) — high residual risk; v0.2 introduces threshold signing.
- **Parallel chain scope-widening** (T-06) — a valid root MAY be used to spawn parallel max-scope hops without parent-to-child binding. v0.2 introduces explicit parent-to-child binding.
- **Registry compromise** (T-07) — silent alteration of grounding evidence is currently undetectable; v0.2 requires transparency-log anchoring.
- **Intent drift** (T-11) — v0.1 makes drift auditable but not preventable.

### 6.3 Key management

Issuing Authority signing keys MUST be protected. v0.1 RECOMMENDS hardware-backed key storage (HSM, TPM, or cloud KMS). Threshold signing is targeted for v0.2.

### 6.4 Expiry windows

`expires_at` SHOULD be short — minutes to hours, not days. Long-lived authorship records substantially expand the blast radius of any compromise.

### 6.5 Replay

Each AuthR Record's `authr_id` MUST be unique. Verifiers SHOULD maintain a short-lived replay-detection cache for high-risk operations.

## 7. Relationship to existing standards

AuthR is designed to coexist with, not replace, existing identity standards.

| Standard | Role | How AuthR interacts |
|---|---|---|
| **OAuth 2.0 / OIDC** | Authentication and access tokens | Unchanged. Actor presents OAuth tokens for API access; AuthR Record rides alongside as an additional assertion. |
| **RFC 8693 Token Exchange** | Cross-domain access delegation | AuthR's `extend` is the authorship analogue. Both can be used together: OBO for the token, AuthR for the decision. |
| **RFC 9396 Rich Authorization Requests** | Fine-grained permissions | `scope.constraints` MAY reference or embed RAR `authorization_details`. |
| **UMA 2.0** | User-managed access | UMA grants access; AuthR declares responsibility for the action taken under that access. |
| **W3C VC / DIDs** | Portable identity assertions | Natural fit for `author.id` and `grounding.evidence_digest`. |
| **SPIFFE / SPIRE** | Workload identity | Natural fit for `actor.id` and attestation evidence. |
| **CoSAI Agentic IAM** | Agents as first-class identities | AuthR is the authorship layer above the agent identity layer CoSAI defines. |

## 8. Open questions for v0.2

- **Cross-domain federation** — how Issuing Authorities federate across trust domains; OAuth Federation as a likely starting point
- **Multi-author records** — committee authorship as a native primitive vs nested records
- **Revocation propagation** — cascade semantics beyond a single control plane
- **Durable intent** — automated intent-to-action matching for drift prevention
- **Wire format** — CBOR/COSE for constrained environments; selective disclosure (BBS+) for regulated data
- **Naming the role** — Issuing Authority vs Authorship Server vs another term
- **Governed swarms** — reconciling parallel branches into a single defensible answer

## 9. IANA considerations

This section is reserved for future IANA registration of media types and well-known URIs if AuthR proceeds to a standards-track process. None are registered at v0.1.

## 10. References

### Normative

- [RFC 2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", March 1997.
- [RFC 8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", May 2017.
- [RFC 8785] Rundgren, A., et al., "JSON Canonicalization Scheme (JCS)", June 2020.
- [RFC 8032] Josefsson, S., Liusvaara, I., "Edwards-Curve Digital Signature Algorithm (EdDSA)", January 2017.

### Informative

- [RFC 8693] Jones, M., et al., "OAuth 2.0 Token Exchange", January 2020.
- [RFC 9396] Lodderstedt, T., et al., "OAuth 2.0 Rich Authorization Requests", May 2023.
- W3C, "Verifiable Credentials Data Model v2.0", 2024.
- SPIFFE, "Secure Production Identity Framework for Everyone", https://spiffe.io
- CoSAI, "Agentic IAM: Identity Management for AI Agents", 2025.

---

*End of AuthR v0.1 Specification.*
