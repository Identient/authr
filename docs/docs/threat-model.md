# AuthR v0.1 Threat Model

> "A protocol you haven't tried to break isn't a protocol. It's a wish."

This document evaluates AuthR v0.1 against four adversary classes and twelve threat scenarios. It uses STRIDE as the baseline methodology and adds two agentic-era-specific vectors: **Authorship Forgery** and **Intent Drift**.

The goal is not to claim AuthR v0.1 is complete. The goal is to make its current defensive posture legible, so deployers know what v0.1 protects against, what it partially protects against, and what remains open until v0.2.

## Adversary classes

| ID | Adversary | Capabilities |
|---|---|---|
| **A1** | External attacker | No insider access. Can observe public surfaces and send unauthenticated requests. |
| **A2** | Compromised agent | Possesses valid credentials for an Actor in the system; behavior altered by prompt injection or model compromise. |
| **A3** | Compromised sub-component | Controls a single node in the execution graph (e.g., one sub-agent or one MCP server). |
| **A4** | Insider with Issuing Authority signing key | The worst-case insider: full access to the key that signs authorship records. |

## Residual risk matrix

### Adequately defended in v0.1

| ID | Threat | Adversary | Defense in v0.1 |
|---|---|---|---|
| **T-01** | Forged authorship by a feral twin (a synthetic persona impersonating a grounded human) | A2 | Blocked by `author.grounding.evidence_digest` plus multi-verifier requirements in the Registry. An author without grounding cannot mint a record. |
| **T-04** | Record modification in transit | A1, A3 | Defended by strict canonical JSON (RFC 8785) serialization and Ed25519 detached signatures. Any byte change invalidates the signature. |

### Partial defense in v0.1

| ID | Threat | Adversary | Defense in v0.1 | Gap |
|---|---|---|---|---|
| **T-02** | Author impersonation (an attacker claims to be the CFO) | A1, A4 | Relies on out-of-band HITL confirmation when `intent.human_in_the_loop = true`. The wire service refuses high-risk actions without a fresh authorship signal. | If HITL is not configured or is bypassed by the relying party, T-02 is open. |
| **T-05** | Chain truncation (drop the last hop and present a shorter, wider-scoped chain) | A2, A3 | Defended by mandatory full-chain transport and `provenance.chain` continuity check at the Enforcement plane. | If a Verifier accepts a single record instead of the full chain, truncation succeeds. Implementations MUST require the full chain. |
| **T-09** | Sensitive intent leakage (the natural-language `intent.statement` reveals information the Actor should not see) | A2, A3 | Bounded by access control on the records themselves; high-sensitivity intents can be redacted in transit. | No native selective disclosure in v0.1. v0.2 targets BBS+ signatures for redactable assertions. |
| **T-10** | Revocation cascade failure (revocation does not reach all downstream enforcement points in time) | A4 | Bounded by short `expires_at` windows. A record with a 30-minute TTL has a bounded blast radius even if revocation is slow. | Push-based revocation is not specified in v0.1. Implementations rely on short TTLs and pull-based status checks. v0.2 specifies event-driven cascade. |

### Critical risks open in v0.1

These four threats represent **known limitations of v0.1 that any production deployment must mitigate operationally until v0.2 ships.**

| ID | Threat | Adversary | Severity | v0.2 requirement |
|---|---|---|---|---|
| **T-03** | Issuing Authority key compromise | A4 | **High** | Threshold signing — distribute the signing operation across multiple key holders so no single compromise can mint records. |
| **T-06** | Parallel chain scope-widening (a valid root used to spawn parallel maximum-scope hops) | A2, A3 | **High** | Parent-to-child cryptographic binding so each hop verifies it was specifically derived from a unique parent. |
| **T-07** | Registry compromise (silent alteration of grounding evidence) | A4 | **High** | Mandatory transparency-log anchoring of Registry mutations, so alterations are publicly detectable. |
| **T-12** | Cross-level swarm escalation (low-trust worker inherits full authority halo from high-trust parent in a swarm fan-out) | A2 | **High** | A `trust_floor` field that travels in the record and prevents low-trust nodes from acting on high-authority intent. |

### The hardest open problem

**T-11: Intent Drift.** v0.1 makes drift *auditable* — `intent.statement` is captured at authorship time and inherited across hops, so a divergence between what was authorized and what was executed is reconstructible after the fact. v0.1 does **not** make drift *preventable*. Automated intent-to-action matching — comparing what the agent did to what the author said — remains open research. This is the deepest limitation of v0.1 and the highest-leverage research direction for v0.x.

## Defenses that DO work in v0.1

For clarity on what v0.1 does provide:

- **Monotonic scope attenuation** (Invariant 4) is structural. A compromised sub-agent cannot widen its own scope; the Verifier rejects the attempt before any resource is touched.
- **Stable author** (Invariant 3) is structural. A compromised mid-chain agent cannot substitute a different author and have the chain still verify.
- **Chain continuity** (Invariant 5) is structural. A malicious record inserted into the middle of a chain breaks `provenance.chain` linkage and fails verification.
- **Signature validity** (Invariant 1) is cryptographic. Any tampering with the record bytes invalidates the signature.
- **Expiry** (Invariant 2) bounds blast radius. Short TTLs mean compromise windows are minutes, not days.
- **Revocation supremacy** (Invariant 6) gives operators a kill switch. Even without push-based cascade, pulling a record from the active set invalidates it on next check.

These defenses are not optional — they are enforced by the spec and the reference Verifier. Implementations that omit any of them are not conformant.

## What deployers should do today

Until v0.2 closes the critical-risk gaps:

1. **Protect the Issuing Authority signing key.** HSM or cloud KMS. Not on a developer laptop. Not in a config file.
2. **Keep `expires_at` short.** 30 minutes is the v0.1 default; for high-risk operations, consider 5–10 minutes.
3. **Require full-chain verification at every enforcement point.** Do not accept single records when chains exist.
4. **Configure `human_in_the_loop = true` for irreversible actions.** HITL is the v0.1 mitigation for author impersonation; it works only if relying parties enforce it.
5. **Monitor for Registry mutations.** Until transparency-log anchoring ships in v0.2, log and alert on every change to grounding evidence.
6. **Treat AuthR v0.1 as a layer alongside existing controls, not a replacement.** Defense in depth — OAuth, RBAC, network segmentation, fraud detection — still applies.

## Methodology note

The threat model uses STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) as its scaffolding, with two agentic-era additions:

- **Authorship Forgery** — adversary creates or modifies a record to falsely claim a specific Author is responsible. Covered by T-01 and T-02.
- **Intent Drift** — the action executed diverges from the action authorized, without any record being forged. Covered by T-11.

Future versions will extend the methodology to include LINDDUN (privacy threats) and PASTA (process-driven analysis) as the protocol surface broadens.

---

*An AuthR record that has not been stress-tested is a promise. An AuthR record that survives this threat model and its successors is a protocol.*
