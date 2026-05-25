import styles from '../doc-page.module.css'

export const metadata = { title: 'Contributing to AuthR' }

export default function ContributingPage() {
  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTitle}>On this page</div>
        <nav className={styles.sidebarNav}>
          <a href="#ways" className={styles.sidebarLink}>Ways to contribute</a>
          <a href="#python" className={styles.sidebarLink}>Python package</a>
          <a href="#test-vectors" className={styles.sidebarLink}>Test vectors</a>
          <a href="#typescript" className={styles.sidebarLink}>TypeScript port</a>
          <a href="#spec" className={styles.sidebarLink}>Spec contributions</a>
          <a href="#process" className={styles.sidebarLink}>Review process</a>
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.docHeader}>
          <div className={styles.docTag}>docs / contributing</div>
          <h1 className={styles.docTitle}>Contributing to AuthR</h1>
          <p className={styles.docSub}>The AuthR protocol is in active development. Contributions to the spec, the Python reference, the TypeScript port, and the test vector suite are all welcome.</p>
        </div>

        <section id="ways" className={styles.section}>
          <h2 className={styles.h2}>Ways to contribute</h2>
          <div className={styles.contribGrid}>
            {[
              { area: 'Protocol spec', desc: 'Propose amendments to authr-spec-v0.1. Open questions in §8 are the highest-priority discussion areas.', action: 'Open a GitHub Discussion', tag: 'Design' },
              { area: 'Python reference', desc: 'The canonical implementation. pip install authr-protocol. Contributions to core primitives, test coverage, and documentation are all in scope.', action: 'See Python section below', tag: 'Implementation' },
              { area: 'Test vectors', desc: '8–12 records, half passing and half failing for specific documented reasons. Other implementations verify against yours.', action: 'See test vectors section', tag: 'QA' },
              { area: 'TypeScript port', desc: 'The playground runs on the TypeScript port. Parity with Python output is the standard. New invariant implementations welcome.', action: 'See TypeScript section', tag: 'Implementation' },
            ].map((c, i) => (
              <div key={i} className={styles.contribCard}>
                <div className={styles.contribTag}>{c.tag}</div>
                <div className={styles.contribArea}>{c.area}</div>
                <p className={styles.contribDesc}>{c.desc}</p>
                <span className={styles.contribAction}>{c.action} →</span>
              </div>
            ))}
          </div>
        </section>

        <section id="python" className={styles.section}>
          <h2 className={styles.h2}>Python reference package</h2>
          <p className={styles.p}>The Python reference is the canonical AuthR implementation. It is the source of truth against which all other implementations are validated.</p>
          <div className={styles.codeBlock}>{`# Install from PyPI (when published)
pip install authr-protocol

# Install from source
git clone https://github.com/identient/authr-protocol
cd authr-protocol
pip install -e ".[dev]"

# Run the flagship scenario
python -m authr.scenarios.cfo_wire

# Run tests
pytest tests/`}</div>
          <p className={styles.p}>The flagship scenario output should match the test vector at <code className={styles.inlineCode}>test-vectors/cfo-wire-root.json</code>. If your implementation produces different output for the same inputs, that is a parity failure that needs resolution before merging.</p>
          <div className={styles.codeBlock}>{`# Package structure
authr/
  __init__.py          # Public API: issueRoot, extendChain, verifyChain
  primitives.py        # Author, Actor, Intent, Scope, Provenance, Drift
  issuing_authority.py # IssuingAuthority class
  verifier.py          # Verifier class — all six invariants
  exceptions.py        # ScopeExpansionError, AuthRError, etc.
  scenarios/
    cfo_wire.py        # Flagship runnable scenario

test-vectors/
  cfo-wire-root.json           # Root record — must pass all invariants
  cfo-wire-hop.json            # Hop record — scope narrowed
  scope-widening-attempt.json  # Must fail invariant 4
  expired-record.json          # Must fail invariant 2
  author-drift.json            # Must fail invariant 3
  chain-break.json             # Must fail invariant 5`}</div>
        </section>

        <section id="test-vectors" className={styles.section}>
          <h2 className={styles.h2}>Test vectors</h2>
          <p className={styles.p}>Test vectors are AuthR records in JSON format that implementations use to verify correctness. The suite must contain 8–12 records: at least half must be intentionally failing, each failing for a specific, documented invariant violation.</p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Vector file</th><th>Expected result</th><th>Reason</th><th>Invariant</th></tr></thead>
              <tbody>
                {[
                  ['cfo-wire-root.json', 'PASS', 'Valid root record, all fields correct', 'All 6'],
                  ['cfo-wire-hop.json', 'PASS', 'Valid hop, scope correctly narrowed', 'All 6'],
                  ['low-risk-auto.json', 'PASS', 'Low-risk record, auto-approve path', 'All 6'],
                  ['multi-hop-chain.json', 'PASS', 'Three-hop chain, all scopes valid', 'All 6'],
                  ['scope-widening-attempt.json', 'FAIL', 'wire.cancel added — not in parent scope', 'Inv.4'],
                  ['expired-record.json', 'FAIL', 'expires_at is in the past', 'Inv.2'],
                  ['author-drift.json', 'FAIL', 'author.id changes at hop 2', 'Inv.3'],
                  ['chain-break.json', 'FAIL', 'Hop does not reference parent authr_id', 'Inv.5'],
                  ['correlation-mismatch.json', 'FAIL', 'correlation_id differs at hop 2', 'Inv.6'],
                  ['bad-signature.json', 'FAIL', 'Signature value tampered', 'Inv.1'],
                ].map(([file, result, reason, inv], i) => (
                  <tr key={i}>
                    <td><code className={styles.inlineCode}>{file}</code></td>
                    <td><span className={result === 'PASS' ? styles.passLabel : styles.failLabel}>{result}</span></td>
                    <td>{reason}</td>
                    <td><code className={styles.inlineCode}>{inv}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.p}>To submit a new test vector, open a PR with the JSON file and a companion <code className={styles.inlineCode}>.meta.json</code> file documenting the expected result, the violated invariant (if failing), and the reason.</p>
        </section>

        <section id="typescript" className={styles.section}>
          <h2 className={styles.h2}>TypeScript port</h2>
          <p className={styles.p}>The TypeScript port lives in <code className={styles.inlineCode}>src/lib/authr.ts</code> in this repository. It must maintain output parity with the Python reference for all test vectors. To verify parity:</p>
          <div className={styles.codeBlock}>{`# Run parity tests
npm run test:parity

# The parity test suite runs all test vectors through
# both the Python and TypeScript implementations and
# compares the verification results.
# Signature values will differ (different mock seeds)
# but all invariant pass/fail results must match.`}</div>
        </section>

        <section id="spec" className={styles.section}>
          <h2 className={styles.h2}>Spec contributions</h2>
          <p className={styles.p}>The spec is in active discussion. The highest-priority open questions from §8 are:</p>
          <div className={styles.specItems}>
            {[
              'Cross-domain federation — OAuth Federation as the likely path. Looking for architects with federation experience.',
              'Multi-author records — committee authorship needs a concrete data model proposal.',
              'Wire format — JSON + JWS vs CBOR/COSE. Evaluation criteria needed for constrained environments.',
              'Revocation propagation — event-driven via Kafka is the v0.1 assumption. Edge cases need enumeration.',
            ].map((item, i) => (
              <div key={i} className={styles.specItem}>
                <span className={styles.specNum}>{i + 1}</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className={styles.p}>To propose a spec change, open a GitHub Discussion with the label <code className={styles.inlineCode}>spec-proposal</code>. Include the affected section, the proposed change, and the rationale. Breaking changes to v0.1 require consensus from at least two independent implementors.</p>
        </section>

        <section id="process" className={styles.section}>
          <h2 className={styles.h2}>Review process</h2>
          <div className={styles.processSteps}>
            {[
              { step: '1', title: 'Open an issue or discussion', desc: 'Before writing code, describe the change you want to make. For spec changes, use a GitHub Discussion. For implementation bugs, use a GitHub Issue.' },
              { step: '2', title: 'Fork and branch', desc: 'Fork the repository. Create a branch named feat/description, fix/description, or spec/description.' },
              { step: '3', title: 'Write tests first', desc: 'For implementation changes, add a failing test vector or unit test before writing the fix. For spec changes, describe what a conforming implementation must do.' },
              { step: '4', title: 'Open a PR', desc: 'PRs must pass all test vectors and parity tests. Include a description of the change, the motivation, and any open questions.' },
              { step: '5', title: 'Review and merge', desc: 'PRs require one review from a maintainer. Breaking changes require two independent implementor reviews. The spec maintainer has final say on spec PRs.' },
            ].map((s, i) => (
              <div key={i} className={styles.processStep}>
                <div className={styles.processNum}>{s.step}</div>
                <div>
                  <div className={styles.processTitle}>{s.title}</div>
                  <p className={styles.processDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
