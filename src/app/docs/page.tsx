import Link from 'next/link'
import styles from './docs.module.css'

export const metadata = {
  title: 'AuthR Docs — Documentation & Guides',
}

const SECTIONS = [
  {
    href: '/docs/architecture',
    title: 'Architecture',
    desc: 'How the Issuing Authority, Verifier, Author Registry, and Agent Registry fit together. Control plane vs data plane. Deployment patterns for enterprise and cloud.',
    tag: 'System design',
  },
  {
    href: '/docs/threat-model',
    title: 'Threat model',
    desc: 'Attack vectors AuthR is designed to prevent: scope widening, author spoofing, model swapping, replay attacks, and intent drift. What AuthR does not cover.',
    tag: 'Security',
  },
  {
    href: '/docs/contributing',
    title: 'Contributing',
    desc: 'How to contribute to the protocol spec, the Python reference implementation, the TypeScript port, or the playground. Test vector format and submission process.',
    tag: 'Community',
  },
  {
    href: '/spec',
    title: 'Protocol spec',
    desc: 'The complete authr-spec-v0.1 document. Six primitives, three operations, six invariants, record structure, and open questions for v0.2.',
    tag: 'Specification',
  },
]

const QUICKLINKS = [
  { label: 'pip install authr-protocol', href: '/docs/contributing#python' },
  { label: 'JSON Schema', href: '/spec#record-structure' },
  { label: 'Test vectors', href: '/docs/contributing#test-vectors' },
  { label: 'CFO wire scenario', href: '/' },
  { label: 'Six invariants', href: '/spec#invariants' },
  { label: 'AuthR vs OBO', href: '/#compare' },
]

export default function DocsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroTag}>Documentation</div>
        <h1 className={styles.heroTitle}>AuthR v0.1 — Developer docs</h1>
        <p className={styles.heroSub}>Everything you need to understand, implement, and build on top of the AuthR Authorship Representation Protocol.</p>
      </div>

      <div className={styles.quicklinks}>
        <div className={styles.qlLabel}>Quick links</div>
        <div className={styles.qlGrid}>
          {QUICKLINKS.map(l => (
            <Link key={l.label} href={l.href} className={styles.qlLink}>
              <span className={styles.qlArrow}>→</span>
              {l.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.grid}>
        {SECTIONS.map(s => (
          <Link key={s.href} href={s.href} className={styles.card}>
            <div className={styles.cardTag}>{s.tag}</div>
            <h2 className={styles.cardTitle}>{s.title}</h2>
            <p className={styles.cardDesc}>{s.desc}</p>
            <span className={styles.cardArrow}>Read →</span>
          </Link>
        ))}
      </div>

      <div className={styles.status}>
        <div className={styles.statusTitle}>v0.1 status</div>
        <div className={styles.statusGrid}>
          {[
            { label: 'Python reference package', status: 'In progress', note: 'pip install authr-protocol' },
            { label: 'TypeScript port', status: 'Complete', note: 'Powers this playground' },
            { label: 'Interactive playground', status: 'Complete', note: 'You are here' },
            { label: 'JSON Schema', status: 'Complete', note: 'authr-spec-v0.1' },
            { label: 'Test vectors', status: 'In progress', note: '8–12 records, half failing' },
            { label: 'Documentation site', status: 'Complete', note: 'You are here' },
            { label: 'Issuing Authority server', status: 'v0.2', note: 'Requires hosted infra' },
            { label: 'Cross-domain federation', status: 'v0.2', note: 'OAuth Federation path' },
          ].map((item, i) => (
            <div key={i} className={styles.statusRow}>
              <span className={styles.statusLabel}>{item.label}</span>
              <span className={`${styles.statusBadge} ${styles['status_' + item.status.replace(' ', '_').toLowerCase()]}`}>{item.status}</span>
              <span className={styles.statusNote}>{item.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
