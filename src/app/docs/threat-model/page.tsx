import styles from '../doc-page.module.css'

export const metadata = { title: 'AuthR Threat Model — Security Analysis' }

const THREATS = [
  {
    id: 'scope-widening',
    name: 'Scope widening attack',
    severity: 'CRITICAL',
    vector: 'A compromised sub-agent attempts to claim permissions its parent never granted — for example, adding wire.cancel to a scope that only included wire.prepare and wire.validate.',
    mitigation: 'Structural enforcement via the monotonic scope attenuation invariant (§5.3.3 inv.4). The Verifier rejects the record before it reaches the resource. The Issuing Authority also refuses to mint a widened hop at issue time.',
    authrCovers: true,
  },
  {
    id: 'author-spoofing',
    name: 'Author spoofing',
    severity: 'CRITICAL',
    vector: 'An agent attempts to forge an AuthR record claiming a high-authority author (e.g. CFO) without actual authorization from that person.',
    mitigation: 'All AuthR records are signed by the Issuing Authority. The Issuing Authority validates author grounding against the Author Registry before minting. An unsigned or incorrectly signed record fails Invariant 1.',
    authrCovers: true,
  },
  {
    id: 'model-swap',
    name: 'Model swap under stable agent ID',
    vector: 'An attacker replaces the model weights or code running under a known, trusted agent SPIFFE identity. The agent identity remains the same but its behavior changes.',
    severity: 'HIGH',
    mitigation: 'Actor model_manifest binds code_hash and model_hash to the record. The Verifier confirms the running attestation matches the manifest in the AuthR record. Changing the model invalidates the attestation.',
    authrCovers: true,
  },
  {
    id: 'replay',
    name: 'Record replay attack',
    severity: 'HIGH',
    vector: 'An attacker captures a valid AuthR record and replays it at a later time to authorize a new action the original author never intended.',
    mitigation: 'Records have explicit expires_at and stale_after timestamps (Invariant 2). Short TTLs (30 minutes default) limit the replay window. The correlation_id is unique per execution graph.',
    authrCovers: true,
  },
  {
    id: 'intent-drift',
    name: 'Intent drift',
    severity: 'MEDIUM',
    vector: 'An orchestrator re-plans mid-execution and takes an action that is technically within scope but contradicts the stated intent. OAuth OBO cannot detect this — the token still authorizes the call.',
    mitigation: 'Intent is a first-class field captured at authorship time. The Verifier can check that the executing action matches the declared purpose. Drift signals surface when confidence drops below threshold.',
    authrCovers: true,
  },
  {
    id: 'issuing-authority-compromise',
    name: 'Issuing Authority compromise',
    severity: 'CRITICAL',
    vector: 'If the Issuing Authority is compromised, an attacker can mint arbitrary AuthR records with any author, actor, and scope.',
    mitigation: 'AuthR does not fully solve this in v0.1 — this is a trust anchor problem. Mitigations include HSM-backed signing keys, multi-party approval for high-risk records, short TTLs to limit blast radius, and audit log monitoring for anomalous issuance patterns.',
    authrCovers: false,
    partial: true,
  },
  {
    id: 'correlation-id-collision',
    name: 'Correlation ID collision',
    severity: 'LOW',
    vector: 'Two independent execution graphs share a correlation_id, causing audit logs to conflate unrelated chains.',
    mitigation: 'Correlation IDs must be generated with sufficient entropy (at minimum 128 bits). The Issuing Authority should validate uniqueness against its registry before minting. In practice, UUID v4 or ULID provides sufficient collision resistance.',
    authrCovers: true,
  },
  {
    id: 'denial-of-service',
    name: 'Verifier denial of service',
    severity: 'MEDIUM',
    vector: 'An attacker floods the Verifier with malformed or deeply nested chains, causing high CPU usage from repeated cryptographic verification.',
    mitigation: 'The Verifier enforces max_delegation_depth from the scope constraints. Chain depth is bounded at issuance time. The Issuing Authority enforces the depth limit before minting. Malformed records fail fast on Invariant 1 before deeper checks run.',
    authrCovers: true,
  },
]

const OUT_OF_SCOPE = [
  'Compromised human author — if Jane Doe\'s credentials are stolen and used to mint a root record, AuthR cannot detect this. That\'s an AuthN problem (MFA, hardware keys).',
  'Application-layer bugs — AuthR enforces authorship boundaries. If the underlying application has a privilege escalation bug, AuthR does not protect against that.',
  'Side-channel attacks on the HSM — out of scope for this protocol version.',
  'Collusion between the Issuing Authority operator and an attacker — requires out-of-band governance controls.',
]

export default function ThreatModelPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>On this page</div>
        <nav className={styles.sidebarNav}>
          <a href="#assumptions" className={styles.sidebarLink}>Assumptions</a>
          <a href="#threats" className={styles.sidebarLink}>Threat catalog</a>
          {THREATS.map(t => (
            <a key={t.id} href={`#threat-${t.id}`} className={`${styles.sidebarLink} ${styles.sidebarSub}`}>{t.name}</a>
          ))}
          <a href="#out-of-scope" className={styles.sidebarLink}>Out of scope</a>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.docHeader}>
          <div className={styles.docTag}>docs / threat-model</div>
          <h1 className={styles.docTitle}>Threat model</h1>
          <p className={styles.docSub}>Attack vectors AuthR is designed to prevent, partially mitigate, or explicitly does not cover.</p>
        </div>

        <section id="assumptions" className={styles.section}>
          <h2 className={styles.h2}>Trust assumptions</h2>
          <p className={styles.p}>The AuthR threat model assumes the following trust boundaries:</p>
          <div className={styles.assumptionList}>
            {[
              { label: 'Trusted', items: ['The Issuing Authority signing key (HSM-backed)', 'The Author Registry (backed by HRMS)', 'The Verifier implementation (audited library)', 'The trust store at each resource boundary'] },
              { label: 'Untrusted', items: ['Individual AI agents and orchestrators', 'Sub-agent implementations', 'Network transport between agents and resources', 'Agent runtime environments (unless TEE-attested)'] },
              { label: 'Semi-trusted', items: ['Verified digital twins (trusted only with explicit grounding)', 'Third-party Issuing Authorities in federated deployments', 'The human author\'s endpoint (protected by AuthN, not AuthR)'] },
            ].map((group, i) => (
              <div key={i} className={styles.assumptionGroup}>
                <div className={`${styles.assumptionLabel} ${styles['assumption_' + group.label.toLowerCase()]}`}>{group.label}</div>
                <ul className={styles.assumptionItems}>
                  {group.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="threats" className={styles.section}>
          <h2 className={styles.h2}>Threat catalog</h2>
          <div className={styles.threatList}>
            {THREATS.map(t => (
              <div key={t.id} id={`threat-${t.id}`} className={styles.threatCard}>
                <div className={styles.threatHeader}>
                  <h3 className={styles.threatName}>{t.name}</h3>
                  <span className={`${styles.severityBadge} ${styles['sev_' + t.severity]}`}>{t.severity}</span>
                  <span className={`${styles.coversBadge} ${t.authrCovers ? styles.coversYes : t.partial ? styles.coversPartial : styles.coversNo}`}>
                    {t.authrCovers ? 'AuthR covers' : t.partial ? 'Partially mitigated' : 'Not covered'}
                  </span>
                </div>
                <div className={styles.threatSection}>
                  <div className={styles.threatSectionLabel}>Attack vector</div>
                  <p className={styles.threatText}>{t.vector}</p>
                </div>
                <div className={styles.threatSection}>
                  <div className={styles.threatSectionLabel}>Mitigation</div>
                  <p className={styles.threatText}>{t.mitigation}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="out-of-scope" className={styles.section}>
          <h2 className={styles.h2}>Out of scope</h2>
          <p className={styles.p}>AuthR is deliberately narrow. The following are out of scope for v0.1 and require complementary controls:</p>
          <div className={styles.outList}>
            {OUT_OF_SCOPE.map((item, i) => (
              <div key={i} className={styles.outItem}>
                <span className={styles.outIcon}>—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
