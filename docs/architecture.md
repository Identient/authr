# AuthR Architecture Model

AuthR operates across three planes. The arrows describe the authorship path: issuance flows from Control to Execution; execution under authorship flows from Execution to Enforcement; revocation signals shortcut directly from Control to Enforcement so a cancelled authorship cannot keep riding downstream.

```
┌──────────────────────────────────────────────────────────────────┐
│  CONTROL PLANE                                                   │
│  Issues and verifies authorship                                  │
│                                                                  │
│   ┌─────────────────┐  ┌──────────┐  ┌──────────────────┐        │
│   │ Issuing         │  │ Registry │  │ Revocation       │        │
│   │ Authority       │  │ Authors, │  │ Service          │        │
│   │ Signs records   │  │ agents,  │  │ Cascades to chain│        │
│   └────────┬────────┘  │ twins    │  └────────┬─────────┘        │
│            │           └──────────┘           │                  │
└────────────┼──────────────────────────────────┼──────────────────┘
             │ Issuance                         │ Event-driven
             │                                  │ Revocation
             ▼                                  │
┌──────────────────────────────────────────────────────────────────┐
│  EXECUTION PLANE                                                 │
│  Agents act under authorship                                     │
│                                                                  │
│   ┌─────────────────┐ ┌────────────┐ ┌──────────────────┐        │
│   │ Verified        │ │Orchestrator│ │ Sub-agents/Tools │        │
│   │ Digital Twin    │ │ Agent      │ │ Receive          │        │
│   │ Anchors chain   │ │ Carries    │ │ attenuated hops; │        │
│   └─────────────────┘ │ root       │ │ author preserved │        │
│                       └─────┬──────┘ └──────────────────┘        │
└─────────────────────────────┼────────────────────────────────────┘
                              │ Execution under
                              │ authorship
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  ENFORCEMENT PLANE                                               │
│  Verifies before action                                          │
│                                                                  │
│   ┌─────────────┐  ┌────────────┐  ┌──────────────────┐          │
│   │ API Gateway │  │ MCP Server │  │ Resource Service │          │
│   │ First-line  │  │ Tool-level │  │ Last-mile gate   │          │
│   │ checks      │  │ verify     │  │                  │          │
│   └─────────────┘  └────────────┘  └──────────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

## The three planes

### Control plane — issues and verifies authorship

**Issuing Authority.** The role OAuth would call an Authorization Server, but its job is issuing signed authorship records rather than access tokens. It holds the signing key (which MUST be protected — HSM, cloud KMS, or threshold signing) and enforces the prerequisites of issuance: the Author must be grounded, the Actor must present valid attestation if configured, the requested scope must be within the Issuing Authority's policy.

**Registry.** Where CoSAI's "prove control on demand" lives. Every Author (humans, twins, organizations, committees), every Actor (agents, AI workers, tools), every active key — with lifecycle, ownership, and lineage. The Registry is the source of truth that grounds the `author.grounding` and `actor.model_manifest` fields. A Registry compromise (T-07 in the threat model) silently breaks authorship; v0.2 requires transparency-log anchoring to detect tampering.

**Revocation Service.** What makes the chain defensible in practice. When a CFO leaves, when a model is swapped, when intent drifts past tolerance — revocation has to cascade through every downstream hop in near real time. Short TTLs plus event-driven revocation is the v0.1 answer; richer cascade semantics are in the v0.2 backlog.

### Execution plane — agents act under authorship

**Verified Digital Twin.** Sits in the top-left slot of the execution plane intentionally. It is the *anchor* — the bridge between a grounded human and the agents that act on their behalf. Without it, the root record has nothing to point at and the whole chain collapses into synthetic authorship. The twin's training data, scope ceiling, and revocation controls live in the Registry.

**Orchestrator Agent.** Receives the root record and carries it through the execution graph. When it needs sub-agent work done, it requests an `extend` from the Issuing Authority, which produces a hop record with attenuated scope.

**Sub-agents and tools.** Receive narrower hops. The Author is preserved across every hop; only the Actor changes. A sub-agent cannot widen its scope, even if compromised — the structural invariant is enforced by the Verifier at the enforcement plane, not by the agent itself.

### Enforcement plane — verifies before action

**API gateways, MCP servers, resource services.** Verification happens at every hop, not just at a central ingress. This is the "enforce at every hop and at the last mile" principle applied to authorship rather than access. An API gateway does the first-line check; an MCP server verifies tool-level invocations; a resource service does the last-mile gate before any irreversible effect.

## How a single record moves through the planes

1. **Authorship request.** A grounded human (or their verified digital twin) decides an action should be taken.
2. **Issuance.** The Issuing Authority (Control plane) mints a root record, signs it, and hands it back to the execution plane.
3. **Execution.** The orchestrator acts under the record, possibly extending it to sub-agents.
4. **Enforcement.** At every action boundary, the relying party (Enforcement plane) verifies the chain against the six invariants before honoring the request.
5. **Audit.** Every record in the chain is retained, indexed by `correlation_id`, so the whole execution graph can be reconstructed after the fact.

## Why three planes, not two

A two-plane model (control + data) is the conventional shape for identity systems. AuthR splits the data plane into Execution and Enforcement because the planes have fundamentally different jobs in the agentic era:

- **Execution** is where agents compose, re-plan, and chain tools. It's high-throughput, often async, and frequently compromised by prompt injection.
- **Enforcement** is where irreversible effects happen — wire transfers, code deployments, customer-facing changes. It must be slower, more conservative, and harder to compromise.

Co-mingling them — relying on agents to honor their own authorship constraints — is exactly the failure mode AuthR is designed to prevent. The split is deliberate.

## Relationship to existing patterns

| Pattern | Role | AuthR equivalent |
|---|---|---|
| OAuth Authorization Server | Issues access tokens | Issuing Authority issues authorship records |
| OAuth Resource Server | Verifies access tokens at the API boundary | API Gateway in the Enforcement plane verifies authorship records |
| PKI Certificate Authority | Issues signed certificates | Issuing Authority — analogous trust model, different artifact |
| CRL / OCSP | Revokes certificates | Revocation Service with event-driven cascade |
| SPIFFE Workload API | Provides workload identity | Source of `actor.id` in AuthR Records |
| Identity Registry (HR/IGA) | Source of truth for human identities | Source of `author.id` and `author.grounding` |

## Implementation guidance

For v0.1 deployments, the practical mapping is:

- **Issuing Authority** = a service you run with an Ed25519 signing key in an HSM or cloud KMS, exposing `issue_root`, `extend`, and `verify` over an authenticated API.
- **Registry** = your existing identity systems (Okta, Entra, Workday, etc.) plus a workload identity layer (SPIFFE/SPIRE).
- **Revocation Service** = an event bus + short TTLs, with a fallback OCSP-style endpoint.
- **Verifier** = a library (this repository's reference implementation in Python, or a port) embedded in your API gateways, MCP servers, and resource services.

The reference implementation in [`reference/python/`](../reference/python/) provides the building blocks; production deployments add the durable signing, registry integration, and revocation channel that v0.1 leaves out by design.
