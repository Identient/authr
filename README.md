# AuthR — Authorship Representation

**The third pillar of identity for the agentic era.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Status: Draft](https://img.shields.io/badge/Status-Draft_for_Discussion-orange.svg)]()
[![Version: v0.1](https://img.shields.io/badge/Version-0.1-purple.svg)]()
[![Reference: Python](https://img.shields.io/badge/Reference-Python-yellow.svg)](reference/python)

> *"We've spent twenty years solving AuthN and AuthZ. The next ten will be about AuthR — who actually authored the decision."*

---

## Why AuthR

Identity and Access Management has historically answered two questions:

- **AuthN** asks *who you are.*
- **AuthZ** asks *what you may do.*

Both were designed for a world where a human sits at a terminal, signs in, and directly invokes a system. That world is ending.

Autonomous agents, AI workers, synthetic personas, and verified digital twins now act across time, systems, and teams on behalf of people and organizations. They compose. They re-plan. They chain tools. They run overnight. When something goes wrong — or right — the question that matters is no longer *who signed in,* nor *what scope did the token carry.* The question is:

**Who is ultimately responsible for this action?**

**AuthR** — Authorship Representation — proposes the third pillar of identity. Where OAuth's On-Behalf-Of pattern delegates *access,* AuthR delegates *authorship:* it carries grounded responsibility, intent, and lineage across the entire execution graph of agentic work. AuthR does not replace OAuth, SAML, OIDC, or UMA. It sits above them.

## Status

**v0.1 — Draft for Discussion.** This is an early sketch published openly to make the idea concrete enough to argue with. It defines six primitives, a signed record structure, three operations, six verification invariants, and ships a working Python reference implementation. It does **not** yet specify cross-domain federation, multi-author records, or formal revocation propagation. Those are tracked in [the v0.2 roadmap](#roadmap).

The protocol is being developed in public. Feedback, criticism, alternative implementations, and use case proposals are actively wanted. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Quick start

```bash
git clone https://github.com/identient/authr.git
cd authr/reference/python
pip install -e .
python -m authr.examples.cfo_wire
```

You'll see a root authorship record minted, a sub-agent hop extended with attenuated scope, the chain verified against all six invariants, and an attempted scope-widening rejected by the verifier.

In code, the minimal flow looks like this:

```python
from authr import IssuingAuthority, Verifier, Author, Actor, Intent, Scope

ia = IssuingAuthority(key_id="treasury-twin-key-1")
root = ia.issue_root(
    author=Author(id="did:web:acme.com:people:jane-doe", type="verified_digital_twin", role="CFO"),
    actor=Actor(id="spiffe://acme.com/agents/treasury-orchestrator", type="agent"),
    intent=Intent(purpose="approve_wire_transfer", risk_tier="high", human_in_the_loop=True),
    scope=Scope(actions=["wire.prepare", "wire.validate", "wire.approve", "wire.submit"]),
)

Verifier(trust_store={"treasury-twin-key-1": ia.public_key}).verify_record(root)
# returns True; raises AuthRError on any invariant violation
```

## The six primitives

| Primitive | What it carries | Why it matters |
|---|---|---|
| **Author** | The grounded human, twin, or committee whose judgment is executed | Separates authorship from execution — the structural move that makes responsibility provable |
| **Actor** | The agent, AI worker, or tool that actually runs the code | Bound to a measured model manifest and runtime attestation |
| **Intent** | The *why* — canonical purpose, natural-language statement, risk tier, HITL flag | Inherited across hops, never reinvented; makes intent drift legible |
| **Scope** | Explicit limits — actions, resources, monetary caps, time windows, max delegation depth | Attenuates monotonically across the chain |
| **Provenance** | The lineage — chain of parent record IDs, correlation ID, data sources consulted | Without it, authorship is a claim with nothing behind it |
| **Drift** | Confidence at decision time, stale-after timestamp, observed deviation signals | A record that is not drift-aware is not really governed — it is hopeful |

## The six invariants

For an AuthR chain to verify, all six MUST hold:

1. **Signature validity** — every record is signed by a trusted key
2. **Not expired** — the record's `expires_at` has not passed
3. **Stable author** — `author.id` is identical for every record in the chain
4. **Monotonic scope** — every child's scope is a strict subset of its parent's
5. **Chain continuity** — `provenance.chain` links unbroken with a single `correlation_id`
6. **Revocation supremacy** — a revoked record invalidates the entire downstream chain

A sub-agent that attempts to widen its scope is rejected before the request reaches any resource. Verification is enforced structurally, not hoped for operationally.

## Architecture

AuthR operates across three planes:

- **Control plane** — the Issuing Authority signs records; the Registry resolves grounded authors and actors; the Revocation Service propagates invalidations
- **Execution plane** — verified digital twins anchor chains; orchestrator agents carry roots; sub-agents receive attenuated hops
- **Enforcement plane** — API gateways, MCP servers, and resource services verify the chain before action

See [docs/architecture.md](docs/architecture.md) for the full model.

## Relationship to existing standards

| Standard | Role | How AuthR relates |
|---|---|---|
| OAuth 2.0 / OIDC | Authentication and access token issuance | Used unchanged. AuthR rides alongside as an additional assertion. |
| RFC 8693 Token Exchange | Cross-domain delegation of access | AuthR's *extend* is the authorship analogue. Both can be used together. |
| RFC 9396 Rich Authorization Requests | Fine-grained permissions | AuthR `scope.constraints` can reference or embed RAR `authorization_details`. |
| UMA 2.0 | User-managed access | UMA grants access; AuthR declares responsibility for the action taken. |
| W3C Verifiable Credentials / DIDs | Portable identity assertions | Natural fit for `author.id` and `grounding.evidence_digest`. |
| SPIFFE / SPIRE | Workload identity | Natural fit for `actor.id` and attestation evidence. |
| CoSAI Agentic IAM | Agents as first-class identities | AuthR is the authorship layer above the agent identity layer CoSAI defines. |

See [docs/related-work.md](docs/related-work.md) for the longer treatment.

## Read the spec

- [AuthR v0.1 Specification](spec/AUTHR-v0.1.md) — the normative protocol document
- [AuthR Working Paper (PDF)](docs/whitepaper.pdf) — the long-form narrative with use cases, threat model, and rationale
- [JSON Schema](schema/authr-record.schema.json) — for validating records programmatically

## Roadmap

v0.1 is deliberately narrow. The v0.2 backlog (tracked in [GitHub Issues](https://github.com/identient/authr/issues?q=is%3Aissue+label%3Av0.2)):

- **Cross-domain federation** — how Issuing Authorities federate across trust boundaries
- **Multi-author records** — committee authorship (e.g., joint CFO + General Counsel approval)
- **Revocation propagation** — cascade semantics beyond a single control plane
- **Durable intent** — automated intent-to-action matching for drift detection
- **Wire format alternatives** — CBOR/COSE for constrained environments; selective disclosure for regulated data
- **Threshold signing** — distributed Issuing Authority to remove single-key compromise risk

## How to contribute

AuthR is being developed in public. Specific contributions wanted:

- **Implementations in other languages** — TypeScript, Go, Rust ports of the reference. See [`good-first-contribution`](https://github.com/identient/authr/issues?q=is%3Aissue+label%3A%22good+first+contribution%22) issues.
- **Use case proposals** — if you're building agentic systems and AuthR seems relevant, open a Discussion describing your scenario.
- **Threat analysis** — security researchers, identity architects, and adversarial reviewers are especially welcome. The [threat model](docs/threat-model.md) is the starting point.
- **Standards-body feedback** — veterans of IETF, W3C, OpenID Foundation, or CNCF processes: what would AuthR need to change to be standards-track viable?

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution path and [GOVERNANCE.md](GOVERNANCE.md) for how decisions get made.

## License

Apache 2.0 — see [LICENSE](LICENSE).

## Maintainers

AuthR v0.1 was authored by [Steve Tout](https://www.linkedin.com/in/stevetout/) (Founder & CEO, [Identient](https://identient.com)). The current editor is Steve Tout. Stewardship is intended to broaden as the protocol matures.

## Citation

If you reference AuthR in a paper, talk, or implementation:

```
AuthR: Authorship Representation — A Protocol Sketch for the Agentic Era (v0.1).
Steve Tout, Identient. April 2026.
https://github.com/identient/authr
```

---

*Trust is expensive. So is its absence.*
