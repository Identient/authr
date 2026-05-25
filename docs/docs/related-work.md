# Related Work

AuthR is designed to coexist with — not replace — existing identity standards. This document explains how AuthR relates to the major specifications and projects in adjacent territory.

## Authentication and authorization standards

### OAuth 2.0 and OpenID Connect

- **What they do:** OAuth 2.0 ([RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)) defines a framework for delegated access. OIDC layers authentication on top.
- **Where they stop:** Tokens carry *access claims* — who is the client, what subject is being acted on behalf of, what scopes are permitted. They do not carry *responsibility* — they cannot answer who *authored* the action that the access claim authorized.
- **How AuthR relates:** AuthR rides alongside OAuth tokens, not replacing them. The same edge carries both. A relying party that understands AuthR gets authorship; a relying party that only understands OAuth still gets the access claim and can be upgraded later.

### RFC 8693 — OAuth 2.0 Token Exchange

- **What it does:** Defines a protocol for exchanging tokens across security domains, preserving actor/subject claims through On-Behalf-Of patterns.
- **Where it stops:** OBO assumes short-lived synchronous execution and a fixed call path. It does not carry intent. It cannot enforce monotonic scope attenuation across an evolving agent graph. It answers *can this call be made* — not *should this action exist, and on whose authority.*
- **How AuthR relates:** AuthR's `extend` operation is the authorship analogue of token exchange. Both can be used together: OBO carries the access claim, AuthR carries the authorship claim. The [working paper §3](whitepaper.pdf) details the five specific points where OBO breaks down for agentic systems and how AuthR fills the gap.

### RFC 9396 — Rich Authorization Requests (RAR)

- **What it does:** Adds structured, fine-grained permissions to OAuth flows via `authorization_details`.
- **How AuthR relates:** AuthR's `scope.constraints` can reference or embed RAR `authorization_details`. Where RAR describes *what may be done at fine grain,* AuthR describes *who is responsible for the doing.*

### UMA 2.0 (User-Managed Access)

- **What it does:** Lets resource owners control access to their resources by third parties through a policy decision point.
- **How AuthR relates:** UMA grants access; AuthR declares responsibility for the action taken under that access. UMA's policy engine could naturally consume AuthR records as one input among many.

### SAML 2.0

- **What it does:** Issues federated authentication assertions.
- **How AuthR relates:** SAML asserts who signed in. AuthR asserts who authored the decision that a downstream agent is now executing. Different lifecycle, different audience, complementary.

## Workload and machine identity

### SPIFFE and SPIRE

- **What they do:** SPIFFE specifies workload identity; SPIRE provides a runtime that issues short-lived SVIDs to workloads.
- **How AuthR relates:** SPIFFE IDs are a natural fit for `actor.id` in AuthR Records. SVID attestation evidence belongs in `actor.attestation`. AuthR sits above SPIFFE — SPIFFE answers *what workload is this,* AuthR answers *under whose authorship is it acting.*

### X.509 / PKI

- **What it does:** Public key infrastructure for certificate-based authentication.
- **How AuthR relates:** The Issuing Authority is analogous in role to a Certificate Authority — it issues signed assertions. The mechanism differs (short-lived authorship records vs. longer-lived identity certificates), and AuthR records carry intent and scope where certificates do not.

## Portable identity and credentials

### W3C Verifiable Credentials and DIDs

- **What they do:** VC Data Model 2.0 defines portable, verifiable claims; DIDs provide self-sovereign identifiers.
- **How AuthR relates:** A natural fit for `author.id` (DIDs are excellent author identifiers) and `author.grounding.evidence_digest` (VCs can serve as grounding evidence). AuthR could plausibly evolve to use VC as its underlying envelope format in a future version.

### IETF JOSE / JWT / JWS

- **What they do:** JSON Object Signing and Encryption — the cryptographic plumbing under most identity tokens.
- **How AuthR relates:** AuthR records are signed JSON. JWS detached signatures are the natural wire format for the `signature` field. v0.1 specifies EdDSA over canonical JSON (RFC 8785); a JWS-formal wrapping is a candidate for v0.2.

## Agentic identity and AI governance

### CoSAI Agentic IAM

- **What it does:** The Coalition for Secure AI's Agentic IAM workstream defines requirements for treating AI agents as first-class identities, including the principle of "prove control on demand."
- **How AuthR relates:** AuthR is the *authorship* layer above the agent identity layer CoSAI defines. CoSAI's Registry-and-control work and AuthR's Issuing Authority + chain semantics are highly compatible; a deployment could conform to both.

### OWASP Agentic Security Initiative

- **What it does:** Develops threat models and guidance for AI agent security.
- **How AuthR relates:** AuthR provides one of the structural controls (monotonic scope attenuation, grounded authorship, chain verification) that the OWASP work calls for in its threat models.

### NIST AI RMF and the EU AI Act

- **What they do:** Risk management frameworks and regulation for AI systems.
- **How AuthR relates:** AuthR generates the audit trail (correlation_id-indexed chains of signed records) that regulators and auditors need to reconstruct accountability after the fact. It does not by itself satisfy any specific compliance requirement, but it provides the substrate on which compliance can be built.

## Data governance and provenance

### W3C PROV

- **What it does:** Provenance Data Model for tracking how things came to be.
- **How AuthR relates:** PROV models entities, activities, and agents in a generic way. AuthR's `provenance.chain` and `provenance.data_sources` are domain-specific provenance for agentic authorship. A future binding could express AuthR provenance as PROV-compatible RDF.

### Supply Chain Security (SLSA, in-toto)

- **What they do:** Frameworks for verifying the integrity of software supply chains.
- **How AuthR relates:** Similar philosophical move — making provenance and authorship structurally verifiable rather than asserted in prose. AuthR is to agentic decisions what SLSA is to software artifacts.

## Where AuthR is new

What AuthR contributes that the standards above do not:

1. **The Author/Actor split as a structural primitive.** OBO carries an actor-subject distinction within a single trust domain. AuthR separates *who is responsible* from *who is executing* as a first-class architectural concept, with grounded evidence required for the Author.
2. **Intent as a first-class object.** OBO carries scope; AuthR carries scope *and* the natural-language reason the action is happening. Intent is inherited across hops, never reinvented, making intent drift detectable.
3. **Monotonic scope attenuation as a verifier-enforced invariant.** AuthR specifies that the Verifier (not the application, not the agent) MUST reject any chain where a child's scope is not a strict subset of its parent's.
4. **The third question.** AuthN asks *who.* AuthZ asks *what.* AuthR asks *who is responsible.* The third question has been implicit in audit and compliance for decades; AuthR proposes making it a structural pillar of identity.

## Standards-body track

AuthR v0.1 is published as a draft for discussion. Possible paths to standardization include:

- **IETF** — fits the OAuth Working Group's mandate; would likely require a charter extension or new working group
- **OpenID Foundation** — has the right adjacent expertise; would fit alongside CAEP and Shared Signals work
- **W3C** — natural home if AuthR evolves toward a VC binding
- **CNCF** — appropriate if AuthR ends up tightly coupled to SPIFFE/SPIRE adoption

Feedback from veterans of any of these processes is explicitly invited. See [CONTRIBUTING.md](../CONTRIBUTING.md#standards-body-feedback).
