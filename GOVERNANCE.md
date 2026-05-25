# AuthR Governance

This document describes how AuthR is currently maintained and how decisions get made. It is intentionally light at v0.x. Governance is expected to evolve as the protocol matures and the contributor base grows.

## Status

**v0.1 — Editor-led, single maintainer.** AuthR is in its earliest phase. The intent is to broaden stewardship as the protocol stabilizes, ultimately landing in either a foundation-housed working group or a standards-body process.

## Current editor

**Steve Tout** ([@stevetout](https://github.com/Identient)) — Founder & CEO, [Identient](https://identient.com).

The editor is responsible for:

- Maintaining the spec
- Reviewing and accepting pull requests
- Tagging releases and managing the changelog
- Stewarding the roadmap
- Triaging issues and discussions
- Convening contributors when needed

## How decisions get made at v0.x

Three categories:

**Editorial decisions** (typos, formatting, clarifications, broken links): the editor decides. No discussion required.

**Substantive but non-breaking decisions** (clarifying ambiguous spec language without changing behavior, adding examples, refining the threat model): the editor proposes, opens a PR or issue for comment, and decides after a reasonable feedback window — typically 7 days for non-urgent items.

**Breaking or category-shaping decisions** (changing record structure, modifying invariants, adding or removing primitives, changing verification semantics): the editor opens a Discussion, invites input from active contributors, and aims for rough consensus. If consensus cannot be reached and the question is genuinely contested, the editor decides and documents the decision and dissent in the Discussion. The principle is *progress over perfection at v0.x.*

All decisions of any size are made in public (issues, discussions, PRs) — never on private channels.

## Roadmap stewardship

The roadmap lives in two places:

- [README.md](README.md#roadmap) — the high-level summary
- [GitHub Issues](https://github.com/identient/authr/issues?q=is%3Aissue+label%3Av0.2) labeled `v0.2`, `v0.3`, etc.

Items move onto the roadmap by being filed as issues, discussed (in Discussions if material), and accepted by the editor. Items move off the roadmap when they ship or are deprecated.

## Release cadence

No fixed schedule. Releases are tagged when meaningful changes accumulate. v0.x releases are explicitly draft and may include breaking changes. v1.0 will commit to backwards compatibility going forward.

The CHANGELOG documents what changed in each release and why.

## Path to broader stewardship

The editor's intent is to broaden governance as the protocol matures. Possible paths under consideration:

- **Foundation-housed working group** — donating the spec to a neutral foundation (e.g., Linux Foundation, CNCF) with a working group structure
- **Standards-body submission** — taking AuthR to IETF, W3C, or the OpenID Foundation as a draft for formalization
- **Multi-organization editorial board** — keeping AuthR independent but moving to a small board of editors from multiple organizations

The trigger for any of these moves is: v1.0 stability, three or more independent implementations, and at least one production deployment by an organization other than Identient.

If you have strong opinions about which path is right, open a Discussion with the `governance` label.

## Trademark and identifier

"AuthR" as a term and the records emitted by the protocol are intended to remain open. Identient does not assert trademark over the term AuthR for use in implementations of this protocol. Identient does assert its branding rights over "Identient" and the Verified Intelligence product that runs on top of AuthR.

## Conflicts of interest

The current editor is also the founder of Identient, a company that builds a commercial product on top of AuthR. This is an intentional but disclosed conflict: AuthR is published openly because the protocol layer compounds value for everyone, including but not limited to Identient. Editor decisions that materially favor Identient over other implementers should be flagged in the relevant discussion or issue, and the editor commits to recusal from decisions where the conflict is direct (e.g., spec changes that would specifically advantage Identient's roadmap at the expense of interoperability).

## Amendments

This governance document can itself be amended. Changes go through the same process as substantive spec decisions: PR, discussion window, editor approval. Major restructuring (e.g., moving to a multi-editor model) requires explicit notice in the changelog and a 30-day discussion window.

---

*Last updated: v0.1 release.*
