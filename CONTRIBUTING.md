# Contributing to AuthR

AuthR is being developed in public as a draft protocol. Feedback, criticism, alternative implementations, and use case proposals are actively wanted.

This is **v0.1, draft for discussion**. The goal of the current phase is not stability — it is to make the idea concrete enough that thoughtful people will argue with it. Your argument is more valuable than your patience.

## Where to start

| If you're... | Start here |
|---|---|
| Reading AuthR for the first time | The [README](README.md), then the [working paper PDF](docs/whitepaper.pdf) for the long form |
| Evaluating it as a protocol | The [v0.1 specification](spec/AUTHR-v0.1.md) and the [JSON Schema](schema/authr-record.schema.json) |
| Running the reference implementation | [`reference/python/`](reference/python/) — `pip install -e .` then `python -m authr.examples.cfo_wire` |
| Considering whether it applies to your problem | Open a [GitHub Discussion](https://github.com/identient/authr/discussions) describing your scenario |
| Wanting to find something concrete to do | Issues labeled [`good-first-contribution`](https://github.com/identient/authr/labels/good-first-contribution) |

## What we're looking for

### Implementations in other languages

The reference is in Python. Faithful ports to TypeScript, Go, Rust, and Java would each be valuable. A good port:

- Implements the same six primitives with the same field names
- Enforces the same six invariants during verification
- Produces canonical JSON output byte-identical to the Python reference
- Passes the test vectors in `/test-vectors` (coming in the next milestone)
- Lives in a sibling directory under `/reference/` (e.g. `/reference/typescript/`)

Open an issue first so we can coordinate and avoid duplicate effort.

### Use case proposals

If you're building agentic systems and AuthR seems relevant, open a Discussion describing:

- The scenario (who acts, on whose behalf, across which systems)
- Where existing standards (OBO, UMA, etc.) fall short for you
- Which AuthR primitives are most useful, which are missing, which are wrong
- What the *Author / Actor / Intent / Scope* split looks like in your domain

Use cases drive the spec evolution more than any other input.

### Threat analysis

The [threat model](docs/threat-model.md) is the starting point. v0.1 has known gaps (Issuing Authority key compromise, parallel chain scope-widening, registry compromise, cross-level swarm escalation). Adversarial review from security researchers, identity architects, and red-teamers is especially welcome. The bar is: find something we missed, or break something we thought we caught.

### Standards-body feedback

For veterans of IETF, W3C, OpenID Foundation, or CNCF processes: what would AuthR need to change to be standards-track viable? Where does the current draft conflict with conventions you'd expect? Which sections need to be reformatted as normative spec language? Open an issue with the `standards-track` label.

### Spec questions and editorial issues

Typos, ambiguous language, missing definitions, contradictions between the spec and the reference implementation — all welcome. File an issue with the `spec` label.

## How to file an issue

Use the templates in [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/):

- `spec_question.md` — for questions about the protocol itself
- `implementation_issue.md` — for bugs in the reference implementation
- `use_case_proposal.md` — for proposing a new scenario the spec should cover
- `feature_request.md` — for v0.2 backlog candidates

## How to submit a pull request

1. Open an issue first if the change is non-trivial — saves rework
2. Fork the repo and create a feature branch
3. For code changes, include tests
4. For spec changes, explain the reasoning in the PR description; reference any issues
5. Sign-off your commits if you can (`git commit -s`)
6. Open the PR against `main`

Small fixes (typos, broken links, clarifications) don't need an issue first — just open the PR.

## Code style

- Python: black + ruff with default settings; type hints required on public APIs
- Markdown: 80-column soft wrap; reference-style links for anything used twice
- JSON Schema: 2 spaces, sorted keys at the top level

## Governance

How decisions get made is documented in [GOVERNANCE.md](GOVERNANCE.md). The short version: Steve Tout is the current editor for v0.x. Stewardship is intended to broaden as the protocol matures, with a published path toward either a foundation-housed working group or a standards-body submission once v1.0 stabilizes.

## Code of conduct

Be honest, be specific, be respectful. Attack the spec, not the speaker. AuthR adopts the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Violations can be reported to authr-conduct@identient.com.

## Recognition

Contributors are listed in [CONTRIBUTORS.md](CONTRIBUTORS.md) (once it exists — open the PR that creates it and add yourself). Substantive contributions to the spec are credited in the spec's acknowledgments section.

---

*The fastest way to help AuthR is to argue with it. The next fastest is to break it. Welcome.*
