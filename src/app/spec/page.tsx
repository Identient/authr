import styles from "./spec.module.css";

export const metadata = {
  title: "AuthR Spec v0.1 — Authorship Representation Protocol",
  description:
    "The complete AuthR protocol specification. Six primitives, three operations, one invariant set.",
};

const PRIMITIVES = [
  {
    id: "author",
    name: "Author",
    section: "§4.1",
    summary: "The real-world referent whose judgment is being executed.",
    detail:
      "A human, a verified digital twin, an organization, or a committee. It is not the agent that runs the code. Separating Author from Actor is the structural move that makes responsibility provable. An Author without grounding is a synthetic persona. A grounded Author is verifiable — tied to an HR record, a professional license, a board approval, or a registry entry with a verifier and an evidence digest.",
    fields: [
      {
        name: "id",
        type: "string",
        desc: "DID or registry URI identifying the author.",
      },
      {
        name: "display_name",
        type: "string",
        desc: "Human-readable name for audit displays.",
      },
      {
        name: "role",
        type: "string",
        desc: "Organizational role (e.g. CFO, CISO, Board).",
      },
      {
        name: "type",
        type: "enum",
        desc: "verified_human | verified_digital_twin | organization | committee",
      },
      {
        name: "grounding.referent_type",
        type: "string",
        desc: "What the author is grounded to (e.g. verified_human).",
      },
      {
        name: "grounding.verifier",
        type: "string",
        desc: "System that performed verification (e.g. acme-hrms).",
      },
      {
        name: "grounding.evidence_digest",
        type: "string",
        desc: "sha256 digest of the grounding evidence document.",
      },
    ],
  },
  {
    id: "actor",
    name: "Actor",
    section: "§4.2",
    summary: "The entity that actually executes the action.",
    detail:
      "Usually an agent, AI worker, synthetic agent, orchestrator, or tool. Actors carry model manifests (signed code and model hashes) and runtime attestation (TEE quotes, SPIFFE SVIDs, or platform attestation). Swapping the model under a stable agent identifier is a known attack vector — binding the actor to a measured manifest closes it.",
    fields: [
      {
        name: "id",
        type: "string",
        desc: "SPIFFE SVID or registry URI for the agent.",
      },
      { name: "type", type: "enum", desc: "agent | orchestrator | tool" },
      {
        name: "display_name",
        type: "string",
        desc: "Human-readable agent name.",
      },
      {
        name: "model_manifest.code_hash",
        type: "string",
        desc: "sha256 of the agent code at execution time.",
      },
      {
        name: "model_manifest.model_hash",
        type: "string",
        desc: "sha256 of the model weights.",
      },
      {
        name: "model_manifest.model_version",
        type: "string",
        desc: "Semantic version of the model.",
      },
      {
        name: "model_manifest.signer_id",
        type: "string",
        desc: "Identity of the governance authority that signed the manifest.",
      },
      {
        name: "attestation.type",
        type: "string",
        desc: "tee_tdx | tpm | spiffe | platform",
      },
      {
        name: "attestation.evidence_digest",
        type: "string",
        desc: "Digest of the runtime attestation evidence.",
      },
    ],
  },
  {
    id: "intent",
    name: "Intent",
    section: "§4.3",
    summary: "Why this action is being taken, captured at authorship time.",
    detail:
      "Intent answers why this action is being taken, in the author's own words, at authorship time. It includes a canonical purpose label, a natural-language statement, a risk tier, and whether a human checkpoint is required before irreversible effects. Intent persists across the chain — it is inherited by downstream hops, not reinvented.",
    fields: [
      {
        name: "purpose",
        type: "string",
        desc: "Machine-readable canonical label (e.g. approve_wire_transfer).",
      },
      {
        name: "statement",
        type: "string",
        desc: "Natural-language statement of intent in the author's own words.",
      },
      {
        name: "risk_tier",
        type: "enum",
        desc: "low | medium | high — determines HITL routing.",
      },
      {
        name: "human_in_the_loop",
        type: "boolean",
        desc: "If true, a live human confirmation is required before irreversible effects.",
      },
    ],
  },
  {
    id: "scope",
    name: "Scope",
    section: "§4.4",
    summary: "Explicit limits on what the Actor may do under this authorship.",
    detail:
      "Scope is the explicit limits on what the Actor may do: actions, resources, monetary caps, time windows, maximum delegation depth. The central invariant: scope attenuates monotonically. A sub-agent can receive a narrower scope. It cannot receive a wider one. The AuthR verifier enforces this, not the application.",
    fields: [
      {
        name: "permitted_actions",
        type: "string[]",
        desc: "Exhaustive list of actions the actor may invoke.",
      },
      {
        name: "resources",
        type: "string[]",
        desc: "Resource URIs the actor may access.",
      },
      {
        name: "constraints.max_amount",
        type: "number",
        desc: "Maximum monetary value the actor may authorize.",
      },
      {
        name: "constraints.currency",
        type: "string",
        desc: "ISO 4217 currency code.",
      },
      {
        name: "constraints.max_delegation_depth",
        type: "number",
        desc: "Maximum chain depth from this record.",
      },
    ],
  },
  {
    id: "provenance",
    name: "Provenance",
    section: "§4.5",
    summary: "The lineage — ordered chain of prior records and data sources.",
    detail:
      "Provenance records the ordered chain of prior AuthR records (each referenced by id and depth), a correlation id that ties the whole execution graph together, and the data sources (datasets, policies, prior rulings, retrieved documents) that shaped the decision. Without provenance, authorship collapses into a claim with nothing behind it.",
    fields: [
      {
        name: "chain",
        type: "ChainLink[]",
        desc: "Ordered list of parent record references with depth and issuer.",
      },
      {
        name: "chain[n].authr_id",
        type: "string",
        desc: "URN of the parent record at depth n.",
      },
      {
        name: "chain[n].depth",
        type: "number",
        desc: "Hop depth from root (root = 0).",
      },
      {
        name: "correlation_id",
        type: "string",
        desc: "Stable identifier tying the entire execution graph together.",
      },
      {
        name: "data_sources",
        type: "DataSource[]",
        desc: "Policies, datasets, and documents consulted at authorship time.",
      },
    ],
  },
  {
    id: "drift",
    name: "Drift",
    section: "§4.6",
    summary: "First-class awareness of uncertainty and staleness.",
    detail:
      "Drift is first-class awareness of uncertainty and staleness: confidence at decision time, a stale_after timestamp, and observed deviation signals indicating the original intent may no longer match reality. An AuthR record that is not drift-aware is not really governed — it is hopeful.",
    fields: [
      {
        name: "confidence",
        type: "number",
        desc: "0.0–1.0 confidence at decision time. Below 0.80 triggers re-anchoring.",
      },
      {
        name: "stale_after",
        type: "string",
        desc: "ISO timestamp after which the record must be re-anchored.",
      },
      {
        name: "deviation_signals",
        type: "string[]",
        desc: "Observed signals indicating intent drift (empty = clean).",
      },
    ],
  },
];

const INVARIANTS = [
  {
    num: 1,
    ref: "§5.3.3 inv.1",
    name: "Signature valid and kid trusted",
    detail:
      "The record signature must be valid and the key identifier (kid) must be present in the trust store of the relying party.",
  },
  {
    num: 2,
    ref: "§5.3.3 inv.2",
    name: "Record not expired",
    detail:
      "The current timestamp must be before expires_at. Records with stale_after in the past require re-anchoring before irreversible effects.",
  },
  {
    num: 3,
    ref: "§5.3.3 inv.3",
    name: "Author stable across chain",
    detail:
      "The author.id field must be identical across every record in the chain. Authorship does not change hands across delegation hops.",
  },
  {
    num: 4,
    ref: "§5.3.3 inv.4",
    name: "Scope monotonically narrows",
    detail:
      "For every consecutive pair of records in the chain, the child's permitted_actions must be a subset of the parent's. No new actions may be introduced at any hop.",
  },
  {
    num: 5,
    ref: "§5.3.3 inv.5",
    name: "Chain continuity",
    detail:
      "Each non-root record's last provenance.chain entry must reference the immediate parent by authr_id.",
  },
  {
    num: 6,
    ref: "§5.3.3 inv.6",
    name: "Correlation ID consistent",
    detail:
      "The provenance.correlation_id must be identical across all records in the chain, tying the full execution graph together for audit reconstruction.",
  },
];

const OPERATIONS = [
  {
    name: "Issue (root)",
    section: "§5.3.1",
    desc: "A root AuthR record is minted when a human author (directly or via a verified digital twin) authorizes an agent to act. The record carries the author, the actor, intent, scope, and relevant data sources. It is signed by an Issuing Authority — a control plane component comparable in role to an OAuth authorization server, but for authorship rather than access.",
    code: `# Python reference
from authr import IssuingAuthority, Author, Actor, Intent, Scope

ia = IssuingAuthority(kid="treasury-twin-key-2026-05")

root = ia.issue_root(
    author=Author(id="did:web:acme.com:people:jane-doe", role="CFO"),
    actor=Actor(id="spiffe://acme.com/agents/treasury-orchestrator"),
    intent=Intent(
        purpose="approve_wire_transfer",
        statement="Release Q2 supplier payment. Halt if variance >5%.",
        risk_tier="high",
        human_in_the_loop=True,
    ),
    scope=Scope(
        permitted_actions=["wire.prepare","wire.validate","wire.approve","wire.submit"],
        constraints={"max_amount": 250000, "currency": "USD"},
    ),
)`,
  },
  {
    name: "Extend (hop)",
    section: "§5.3.2",
    desc: "When an orchestrator delegates a sub-task to a sub-agent, it calls extend on the parent record. The Issuing Authority produces a new record with the same author (authorship does not change hands), a new actor (the sub-agent), an attenuated scope (subset of the parent's), an inherited intent, and a link to the parent in provenance.",
    code: `# Python reference
hop = ia.extend(
    parent=root,
    actor=Actor(id="spiffe://acme.com/agents/wire-validator"),
    attenuated_scope=Scope(
        permitted_actions=["wire.prepare","wire.validate"],  # narrowed
        constraints={"max_amount": 250000, "currency": "USD"},
    ),
)
# Attempting to add wire.cancel here raises:
# ScopeExpansionError: actions {'wire.cancel'} not in parent scope`,
  },
  {
    name: "Verify",
    section: "§5.3.3",
    desc: "A relying party verifies a record or full chain against a trust store. All six invariants must pass. Any failure blocks the request before it reaches the resource. The verifier is the last-mile enforcement point — not the application layer.",
    code: `# Python reference
verifier = Verifier(trust_store=trust_store)
result = verifier.verify_chain([root, hop])

# result.passed  → True
# result.invariants[3].passed  → True (scope monotonically narrows)

# Attempting with a widened scope:
bad_hop = ia.extend(parent=root, actor=validator,
    attenuated_scope=Scope(permitted_actions=["wire.cancel"]))
# Raises: ScopeExpansionError before record is even issued`,
  },
];

export default function SpecPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>Contents</div>
        <nav className={styles.sidebarNav}>
          <a href="#overview" className={styles.sidebarLink}>
            Overview
          </a>
          <a href="#why-authr" className={styles.sidebarLink}>
            Why AuthR
          </a>
          <a href="#primitives" className={styles.sidebarLink}>
            Primitives
          </a>
          {PRIMITIVES.map((p) => (
            <a
              key={p.id}
              href={`#primitive-${p.id}`}
              className={`${styles.sidebarLink} ${styles.sidebarSub}`}
            >
              {p.section} {p.name}
            </a>
          ))}
          <a href="#operations" className={styles.sidebarLink}>
            Operations
          </a>
          <a href="#invariants" className={styles.sidebarLink}>
            Invariants
          </a>
          <a href="#record-structure" className={styles.sidebarLink}>
            Record structure
          </a>
          <a href="#standards" className={styles.sidebarLink}>
            Standards
          </a>
          <a href="#open-questions" className={styles.sidebarLink}>
            Open questions
          </a>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.docHeader}>
          <div className={styles.docTag}>authr-spec-v0.1 · April 2026</div>
          <h1 className={styles.docTitle}>AuthR — Authorship Representation</h1>
          <p className={styles.docSubtitle}>
            A Protocol Sketch for the Agentic Era
          </p>
          <div className={styles.pullQuote}>
            "We've spent 20 years solving AuthN and AuthZ. The next 10 will be
            about AuthR — who actually authored the decision."
          </div>
        </div>

        <section id="overview" className={styles.section}>
          <h2 className={styles.h2}>Overview</h2>
          <p className={styles.p}>
            Identity and Access Management has historically answered two
            questions. <strong>AuthN</strong> asks who you are.{" "}
            <strong>AuthZ</strong> asks what you may do. Both were designed for
            a world where a human sits in front of a terminal, signs in, and
            directly invokes a system. That world is ending.
          </p>
          <p className={styles.p}>
            Autonomous agents, AI workers, synthetic personas, and verified
            digital twins now act across time, systems, and teams on behalf of
            people and organizations. They compose. They re-plan. They chain
            tools. They run overnight. When something goes wrong — or right —
            the question that matters is not who signed in, nor what scope did
            the token carry. The question is:{" "}
            <strong>who is ultimately responsible for this action?</strong>
          </p>
          <p className={styles.p}>
            This paper proposes{" "}
            <strong>AuthR — Authorship Representation</strong> — as the third
            pillar of identity, complementing AuthN and AuthZ. Where OAuth's
            On-Behalf-Of pattern delegates access, AuthR delegates authorship:
            it carries grounded responsibility, intent, and lineage across the
            entire execution graph.
          </p>
          <div className={styles.threeCol}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarLabel}>AuthN</div>
              <div className={styles.pillarQ}>Who are you?</div>
              <div className={styles.pillarNote}>OAuth, OIDC, SAML</div>
            </div>
            <div className={styles.pillarCard}>
              <div className={styles.pillarLabel}>AuthZ</div>
              <div className={styles.pillarQ}>What can you do?</div>
              <div className={styles.pillarNote}>OAuth scopes, RBAC, ABAC</div>
            </div>
            <div className={`${styles.pillarCard} ${styles.pillarAccent}`}>
              <div className={styles.pillarLabel}>AuthR</div>
              <div className={styles.pillarQ}>Whose judgment was executed?</div>
              <div className={styles.pillarNote}>authr-spec-v0.1</div>
            </div>
          </div>
        </section>

        <section id="why-authr" className={styles.section}>
          <h2 className={styles.h2}>Why AuthR</h2>
          <p className={styles.p}>
            Naming matters. A new primitive that does not feel native to
            engineers who already live in AuthN and AuthZ will not be adopted.
            AuthR was chosen because the ambiguity of R is a feature:{" "}
            <strong>authorship</strong>, <strong>responsibility</strong>, and{" "}
            <strong>representation</strong> are the same idea viewed from three
            angles. The protocol exists to make all three verifiable.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Expands to</th>
                  <th>Strength</th>
                  <th>Weakness</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.tableHighlight}>
                  <td>AuthR</td>
                  <td>Authorship · Responsibility · Representation</td>
                  <td>
                    Keeps the pattern. R maps cleanly to all three concepts.
                  </td>
                  <td>Slight ambiguity on which R word is canonical.</td>
                </tr>
                <tr>
                  <td>AuthS</td>
                  <td>Source</td>
                  <td>Emphasizes origin.</td>
                  <td>Softer than authorship. Reads as provenance only.</td>
                </tr>
                <tr>
                  <td>AuthP</td>
                  <td>Provenance</td>
                  <td>Aligned with data governance language.</td>
                  <td>Breaks the authorship framing.</td>
                </tr>
                <tr>
                  <td>AuthA</td>
                  <td>Attribution</td>
                  <td>Conceptually clean.</td>
                  <td>Easily confused with AuthN.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="primitives" className={styles.section}>
          <h2 className={styles.h2}>The six primitives</h2>
          <p className={styles.p}>
            AuthR defines six primitives. The first four derive directly from
            the Verified Intelligence pillars (Grounding, Scope, Provenance,
            Drift) and extend them for identity contexts.
          </p>
          {PRIMITIVES.map((p) => (
            <div
              key={p.id}
              id={`primitive-${p.id}`}
              className={styles.primitive}
            >
              <div className={styles.primitiveHeader}>
                <span className={styles.primitiveSection}>{p.section}</span>
                <h3 className={styles.primitiveTitle}>{p.name}</h3>
              </div>
              <p className={styles.primitiveSummary}>{p.summary}</p>
              <p className={styles.p}>{p.detail}</p>
              <div className={styles.fieldTable}>
                <div className={styles.fieldTableHeader}>
                  <span>Field</span>
                  <span>Type</span>
                  <span>Description</span>
                </div>
                {p.fields.map((f, i) => (
                  <div key={i} className={styles.fieldRow}>
                    <code className={styles.fieldName}>{f.name}</code>
                    <code className={styles.fieldType}>{f.type}</code>
                    <span className={styles.fieldDesc}>{f.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section id="operations" className={styles.section}>
          <h2 className={styles.h2}>The three operations</h2>
          {OPERATIONS.map((op, i) => (
            <div key={i} className={styles.operation}>
              <div className={styles.opHeader}>
                <span className={styles.opSection}>{op.section}</span>
                <h3 className={styles.opTitle}>{op.name}</h3>
              </div>
              <p className={styles.p}>{op.desc}</p>
              <pre className={styles.codeBlock}>{op.code}</pre>
            </div>
          ))}
        </section>

        <section id="invariants" className={styles.section}>
          <h2 className={styles.h2}>Verification invariants</h2>
          <p className={styles.p}>
            A relying party verifies a chain by checking all six invariants in
            order. Any failure blocks the request before it reaches the
            resource. Invariants are checked structurally — not by policy, not
            by the application.
          </p>
          <div className={styles.invariantList}>
            {INVARIANTS.map((inv) => (
              <div key={inv.num} className={styles.invRow}>
                <div className={styles.invNum}>{inv.num}</div>
                <div className={styles.invContent}>
                  <div className={styles.invHeader}>
                    <span className={styles.invName}>{inv.name}</span>
                    <code className={styles.invRef}>{inv.ref}</code>
                  </div>
                  <p className={styles.invDetail}>{inv.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="record-structure" className={styles.section}>
          <h2 className={styles.h2}>Record structure — v0.1</h2>
          <p className={styles.p}>
            An AuthR Record is a JSON object signed with EdDSA (Ed25519). The
            signature covers the canonicalized record minus the signature field
            itself.
          </p>
          <pre className={styles.codeBlock}>{`{
  "authr_id": "urn:authr:01HZXQ6K8Y4F9D3W2P7N5V0A1B",
  "version": "0.1",
  "issued_at": "2026-04-20T14:02:11Z",
  "expires_at": "2026-04-20T14:32:11Z",
  "author": {
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
  },
  "actor": {
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
  },
  "intent": {
    "purpose": "approve_wire_transfer",
    "statement": "Release Q2 supplier payment per approved schedule.",
    "risk_tier": "high",
    "human_in_the_loop": true
  },
  "scope": {
    "permitted_actions": ["wire.prepare","wire.validate","wire.approve","wire.submit"],
    "resources": ["account:acme-opex-7788","counterparty:acme-supplies"],
    "constraints": {
      "max_amount": 250000.00,
      "currency": "USD",
      "max_delegation_depth": 2
    }
  },
  "provenance": {
    "chain": [],
    "correlation_id": "corr-7e21...",
    "data_sources": [
      { "source_id": "policy:treasury-payments-v7", "source_type": "policy" }
    ]
  },
  "drift": {
    "confidence": 0.97,
    "stale_after": "2026-04-20T14:32:11Z",
    "deviation_signals": []
  },
  "signature": {
    "alg": "EdDSA",
    "kid": "treasury-twin-key-1",
    "value": "..."
  }
}`}</pre>
        </section>

        <section id="standards" className={styles.section}>
          <h2 className={styles.h2}>Relationship to existing standards</h2>
          <p className={styles.p}>
            AuthR does not replace OAuth, SAML, OIDC, or UMA. It sits above
            them.
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Standard</th>
                  <th>Role</th>
                  <th>How AuthR relates</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>OAuth 2.0 / OIDC</td>
                  <td>Authentication and access token issuance</td>
                  <td>
                    Used unchanged. The actor presents OAuth tokens for API
                    access; the AuthR record travels alongside as an additional
                    assertion.
                  </td>
                </tr>
                <tr>
                  <td>RFC 8693 Token Exchange</td>
                  <td>Cross-domain delegation of access</td>
                  <td>
                    AuthR extension is the authorship analogue. Both can be used
                    together: OBO for the token, AuthR for the decision.
                  </td>
                </tr>
                <tr>
                  <td>RFC 9396 Rich Authorization</td>
                  <td>Structured fine-grained permissions</td>
                  <td>
                    AuthR scope.constraints can reference or embed RAR
                    authorization_details.
                  </td>
                </tr>
                <tr>
                  <td>UMA 2.0</td>
                  <td>User-managed access for resource sharing</td>
                  <td>
                    UMA grants access; AuthR declares who is responsible for the
                    action taken under that access.
                  </td>
                </tr>
                <tr>
                  <td>W3C Verifiable Credentials</td>
                  <td>Portable identity assertions</td>
                  <td>
                    Natural fit for author.id and grounding.evidence_digest.
                  </td>
                </tr>
                <tr>
                  <td>SPIFFE / SPIRE</td>
                  <td>Workload identity</td>
                  <td>Natural fit for actor.id and attestation evidence.</td>
                </tr>
                <tr>
                  <td>CoSAI Agentic IAM</td>
                  <td>Agents as first-class identities</td>
                  <td>
                    AuthR is the authorship layer above the agent identity layer
                    CoSAI defines.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="open-questions" className={styles.section}>
          <h2 className={styles.h2}>Open questions — v0.2 scope</h2>
          <div className={styles.openList}>
            {[
              {
                q: "Cross-domain federation",
                d: "When author and actor sit in different trust domains, how do Issuing Authorities federate? OAuth Federation is the likely starting point.",
              },
              {
                q: "Multi-author records",
                d: "Committee authorship (joint CFO + General Counsel approval) needs either nested records or a native multi-author primitive.",
              },
              {
                q: "Revocation propagation",
                d: "A revoked authorship should cascade through every downstream hop in near real time. Event-driven revocation plus short TTLs gets most of the way, but edge cases remain.",
              },
              {
                q: "Durable intent",
                d: "An intent statement captured at T0 is a snapshot. As execution unfolds and conditions change, the system needs a way to detect intent drift and force re-anchoring.",
              },
              {
                q: "Wire format",
                d: "JSON with detached JWS is the obvious path. CBOR / COSE deserves evaluation for constrained environments. Privacy-preserving variants (selective disclosure, BBS+) are worth exploring.",
              },
              {
                q: "Governed swarms",
                d: "When an authorship chain fans out into a swarm rather than a linear sequence, the scope-narrowing invariant still holds per branch — but reconstructing a single defensible answer from many parallel branches needs more thought.",
              },
            ].map((item, i) => (
              <div key={i} className={styles.openItem}>
                <div className={styles.openQ}>{item.q}</div>
                <div className={styles.openD}>{item.d}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
