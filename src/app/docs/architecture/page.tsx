import styles from '../doc-page.module.css'

export const metadata = { title: 'AuthR Architecture — System Design' }

export default function ArchitecturePage() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>On this page</div>
        <nav className={styles.sidebarNav}>
          <a href="#overview" className={styles.sidebarLink}>Overview</a>
          <a href="#control-plane" className={styles.sidebarLink}>Control plane</a>
          <a href="#issuing-authority" className={styles.sidebarLink}>Issuing Authority</a>
          <a href="#verifier" className={styles.sidebarLink}>Verifier</a>
          <a href="#registries" className={styles.sidebarLink}>Registries</a>
          <a href="#data-plane" className={styles.sidebarLink}>Data plane</a>
          <a href="#deployment" className={styles.sidebarLink}>Deployment patterns</a>
          <a href="#production" className={styles.sidebarLink}>Production stack</a>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.docHeader}>
          <div className={styles.docTag}>docs / architecture</div>
          <h1 className={styles.docTitle}>System architecture</h1>
          <p className={styles.docSub}>How the AuthR control plane, Issuing Authority, Verifier, and registries compose into a deployable system.</p>
        </div>

        <section id="overview" className={styles.section}>
          <h2 className={styles.h2}>Overview</h2>
          <p className={styles.p}>AuthR introduces a new control plane layer that sits above existing IAM infrastructure. It does not replace OAuth, SAML, or RBAC — it adds the authorship assertion layer that those systems cannot provide. The architecture separates three concerns: <strong>issuance</strong> (creating AuthR records), <strong>verification</strong> (enforcing invariants at resource boundaries), and <strong>audit</strong> (immutable logging of every authorship event).</p>
          <div className={styles.archDiagram}>
            {[
              { layer: 'Authorship layer', items: ['Issuing Authority', 'Author Registry', 'Agent Registry'], color: 'accent' },
              { layer: 'Enforcement layer', items: ['Verifier (per resource boundary)', 'Policy Engine', 'HITL Gateway'], color: 'green' },
              { layer: 'Audit layer', items: ['Immutable Audit Log (Kafka)', 'Compliance Query API', 'Drift Monitor'], color: 'amber' },
              { layer: 'Existing IAM (unchanged)', items: ['OAuth / OIDC', 'SAML / LDAP', 'RBAC / ABAC'], color: 'dim' },
            ].map((layer, i) => (
              <div key={i} className={`${styles.archLayer} ${styles['arch_' + layer.color]}`}>
                <div className={styles.archLayerLabel}>{layer.layer}</div>
                <div className={styles.archLayerItems}>
                  {layer.items.map((item, j) => <span key={j} className={styles.archItem}>{item}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="control-plane" className={styles.section}>
          <h2 className={styles.h2}>Control plane</h2>
          <p className={styles.p}>The AuthR control plane is responsible for minting, extending, and revoking AuthR records. It is analogous in role to an OAuth Authorization Server, but for authorship rather than access. In v0.1, the control plane is a single Issuing Authority. In v0.2, it federates across trust domains.</p>
          <p className={styles.p}>The control plane is <strong>not</strong> in the hot path of agent execution. Records are minted at authorship time (when a human or verified digital twin delegates authority), not at every API call. This means the control plane can be high-integrity and slightly slower without impacting agent throughput.</p>
        </section>

        <section id="issuing-authority" className={styles.section}>
          <h2 className={styles.h2}>Issuing Authority</h2>
          <p className={styles.p}>The Issuing Authority is the component that mints and extends AuthR records. It performs three functions: it validates that the requesting author is grounded (tied to an HR record or board approval), it constructs the AuthR record with correct provenance, and it signs the record using Ed25519 via an HSM-backed key.</p>
          <div className={styles.codeBlock}>{`# Issuing Authority interface (Python reference)

class IssuingAuthority:
    def issue_root(self, *, author, actor, intent, scope,
                   data_sources=None, correlation_id=None) -> AuthRRecord:
        # Validate author grounding
        # Construct record
        # Sign with HSM-backed Ed25519
        # Return signed record

    def extend(self, *, parent, actor, attenuated_scope) -> AuthRRecord:
        # Assert scope narrows (invariant 4)
        # Assert depth within bounds
        # Preserve author and intent
        # Sign and return

    def revoke(self, authr_id: str) -> None:
        # Mark record as revoked in registry
        # Publish revocation event to Kafka`}</div>
        </section>

        <section id="verifier" className={styles.section}>
          <h2 className={styles.h2}>Verifier</h2>
          <p className={styles.p}>The Verifier is a library embedded at every resource boundary — the last-mile enforcement point. It is not a service; it is a dependency that every resource server imports. This ensures enforcement happens structurally, not by policy, and cannot be bypassed by routing around a gateway.</p>
          <p className={styles.p}>The Verifier checks all six invariants in order and fails fast on the first violation. It consults the trust store for signature verification and the revocation endpoint for real-time status.</p>
          <div className={styles.codeBlock}>{`# Verifier usage at a resource boundary

from authr import Verifier

verifier = Verifier(trust_store=trust_store)

def handle_wire_transfer(authr_chain: list[AuthRRecord], request):
    result = verifier.verify_chain(authr_chain)
    if not result.passed:
        raise AuthorizationError(result.violations[0])
    # Proceed with wire transfer`}</div>
        </section>

        <section id="registries" className={styles.section}>
          <h2 className={styles.h2}>Author Registry and Agent Registry</h2>
          <p className={styles.p}>The <strong>Author Registry</strong> maps author DIDs to grounding evidence — HR records, board approvals, professional licenses. It is the source of truth for who is permitted to be named as an author in an AuthR record. In enterprise deployments this is typically backed by the HRMS.</p>
          <p className={styles.p}>The <strong>Agent Registry</strong> maps agent SPIFFEs to model manifests and attestation records. It enables the Verifier to confirm that the model running under a given agent identity matches the manifest in the AuthR record. Swapping the model under a stable agent ID is a known attack vector — the Agent Registry closes it.</p>
        </section>

        <section id="data-plane" className={styles.section}>
          <h2 className={styles.h2}>Data plane — what travels with the request</h2>
          <p className={styles.p}>AuthR records travel alongside existing OAuth tokens, not instead of them. The actor presents its OAuth access token for API authorization as normal. The AuthR record (or chain) travels as an additional header or body parameter. The Verifier at the resource boundary checks the AuthR chain before the request is processed.</p>
          <div className={styles.infoBox}>
            <strong>Header convention (proposed)</strong><br />
            <code>X-AuthR-Record: &lt;base64url-encoded AuthR chain JSON&gt;</code><br />
            <code>Authorization: Bearer &lt;OAuth access token&gt;</code>
          </div>
        </section>

        <section id="deployment" className={styles.section}>
          <h2 className={styles.h2}>Deployment patterns</h2>
          <div className={styles.patternGrid}>
            {[
              { name: 'Single-tenant enterprise', desc: 'Issuing Authority deployed as an internal service. Author Registry backed by HRMS (Workday, SAP). Agent Registry backed by internal MLOps platform. Verifier embedded in every internal service SDK.', tag: 'Recommended for v0.1' },
              { name: 'Multi-tenant SaaS', desc: 'Issuing Authority hosted by Identient. Each tenant has an isolated Author and Agent Registry. Records are tenant-scoped by DID namespace. Cross-tenant chains require explicit federation agreements.', tag: 'v0.2' },
              { name: 'Federated enterprise', desc: 'Each business unit runs its own Issuing Authority. Records cross trust domains via OAuth Federation. Author Registries federate via DID resolution. Each domain verifies the full chain using its own trust store.', tag: 'v0.2' },
            ].map((p, i) => (
              <div key={i} className={styles.patternCard}>
                <div className={styles.patternTag}>{p.tag}</div>
                <div className={styles.patternName}>{p.name}</div>
                <p className={styles.patternDesc}>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="production" className={styles.section}>
          <h2 className={styles.h2}>Production infrastructure stack</h2>
          <p className={styles.p}>The v0.1 playground uses mocked signatures and in-memory state. Production replaces these with enterprise-grade components:</p>
          <div className={styles.stackTable}>
            {[
              { component: 'Signing', dev: 'Deterministic hash (mock)', prod: 'Ed25519 via AWS KMS or Hashicorp Vault' },
              { component: 'Workload identity', dev: 'Static SPIFFE string', prod: 'SPIFFE/SPIRE with real SVIDs' },
              { component: 'Audit log', dev: 'Airtable (demo)', prod: 'Kafka with immutable topic retention' },
              { component: 'Author Registry', dev: 'Hardcoded CFO record', prod: 'HRMS API (Workday, SAP SuccessFactors)' },
              { component: 'Agent Registry', dev: 'Hardcoded manifest', prod: 'MLOps platform with signed manifests' },
              { component: 'Revocation', dev: 'Not implemented', prod: 'Event-driven via Kafka + short TTLs' },
              { component: 'HITL gateway', dev: 'Gmail / Slack webhook', prod: 'Dedicated approval service with audit trail' },
            ].map((row, i) => (
              <div key={i} className={styles.stackRow}>
                <div className={styles.stackComp}>{row.component}</div>
                <div className={styles.stackDev}><span className={styles.stackLabel}>v0.1 playground</span>{row.dev}</div>
                <div className={styles.stackProd}><span className={styles.stackLabel}>Production</span>{row.prod}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
