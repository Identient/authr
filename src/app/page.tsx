"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

/* ─── Theme ──────────────────────────────────────────────────────────────── */
function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = localStorage.getItem("authr-theme") as
      | "dark"
      | "light"
      | null;
    if (stored === "light") {
      setTheme("light");
      document.documentElement.dataset.theme = "light";
    }
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    localStorage.setItem("authr-theme", next);
  };
  return { theme, toggle };
}

/* ─── Scroll-reveal hook ─────────────────────────────────────────────────── */
function useInView(threshold = 0.08) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Data ───────────────────────────────────────────────────────────────── */
const PILLARS = [
  {
    name: "AuthN",
    full: "Authentication",
    q: "Who are you?",
    status: "solved" as const,
  },
  {
    name: "AuthZ",
    full: "Authorization",
    q: "What can you do?",
    status: "solved" as const,
  },
  {
    name: "AuthR",
    full: "Authorship Representation",
    q: "Whose judgment drove this?",
    status: "missing" as const,
  },
];

const PRIMITIVES = [
  {
    name: "Author",
    icon: "◎",
    color: "accent" as const,
    what: "The grounded human, twin, or committee whose judgment is executed",
    why: "Separates authorship from execution — the structural move that makes responsibility provable across every hop.",
  },
  {
    name: "Actor",
    icon: "⬡",
    color: "green" as const,
    what: "The agent, AI worker, or tool that actually runs the code",
    why: "Bound to a measured model manifest and runtime attestation — not just an opaque token.",
  },
  {
    name: "Intent",
    icon: "◈",
    color: "amber" as const,
    what: "The why — canonical purpose, natural-language statement, risk tier, HITL flag",
    why: "Inherited across hops, never reinvented. Makes intent drift legible and structurally detectable.",
  },
  {
    name: "Scope",
    icon: "▣",
    color: "accent" as const,
    what: "Explicit limits — permitted actions, resource constraints, monetary caps, max delegation depth",
    why: "Attenuates monotonically. No child record can claim more than its parent — enforced at the verifier.",
  },
  {
    name: "Provenance",
    icon: "⟳",
    color: "green" as const,
    what: "Lineage — parent record IDs, correlation ID, data sources consulted at decision time",
    why: "Without provenance, authorship is a claim with nothing behind it. Provenance makes it auditable.",
  },
  {
    name: "Drift",
    icon: "◐",
    color: "red" as const,
    what: "Confidence at decision time, stale_after timestamp, observed deviation signals",
    why: "A record that is not drift-aware is not really governed — it is hopeful. Drift is a first-class primitive.",
  },
];

const OPERATIONS = [
  {
    step: "01",
    name: "Issue Root",
    spec: "§5.3.1",
    desc: "The Issuing Authority mints a signed root AuthR record. Author, actor, intent, scope, and provenance are cryptographically bound at authorship time — not at execution time.",
    detail:
      "The root record anchors the entire chain. Everything downstream inherits from and traces back to this record.",
  },
  {
    step: "02",
    name: "Extend Chain",
    spec: "§5.3.2",
    desc: "Each delegation hop creates a child record linked to its parent. Scope attenuates monotonically — the child can only narrow, never widen. The original author is preserved across every hop.",
    detail:
      "The orchestrator knows exactly what the CFO authorized. The sub-agent knows what the orchestrator delegated. No hop can invent new permissions.",
  },
  {
    step: "03",
    name: "Verify Chain",
    spec: "§5.3.3",
    desc: "The enforcement point — an API gateway, MCP server, or resource service — verifies all six invariants structurally before any action reaches the resource.",
    detail:
      "A compromised sub-agent that claims wire.cancel when the root only authorized wire.submit is rejected before the request lands. Structural, not aspirational.",
  },
];

const INVARIANTS = [
  {
    id: 1,
    name: "Signature validity",
    desc: "Every record in the chain is signed by a key present in the trust store",
    ref: "§5.3.3 inv.1",
  },
  {
    id: 2,
    name: "Not expired",
    desc: "The record's expires_at field has not passed at the moment of verification",
    ref: "§5.3.3 inv.2",
  },
  {
    id: 3,
    name: "Stable author",
    desc: "author.id is identical for every record in the chain — authorship cannot be transferred between hops",
    ref: "§5.3.3 inv.3",
  },
  {
    id: 4,
    name: "Monotonic scope",
    desc: "Every child record's permitted_actions is a strict subset of its parent's — scope widening is structurally impossible",
    ref: "§5.3.3 inv.4",
  },
  {
    id: 5,
    name: "Chain continuity",
    desc: "provenance.chain links unbroken with a single correlation_id across all hops in the execution graph",
    ref: "§5.3.3 inv.5",
  },
  {
    id: 6,
    name: "Revocation supremacy",
    desc: "A revoked record invalidates the entire downstream chain regardless of individual record validity",
    ref: "§5.3.3 inv.6",
  },
];

const STANDARDS = [
  {
    name: "OAuth 2.0 / OIDC",
    role: "Authentication and access token issuance",
    rel: "Used unchanged. AuthR rides alongside as an additional authorship assertion.",
  },
  {
    name: "RFC 8693 Token Exchange",
    role: "Cross-domain delegation of access",
    rel: "AuthR's extend_chain is the authorship analogue to token exchange. Both can be used together.",
  },
  {
    name: "RFC 9396 Rich Authorization Requests",
    role: "Fine-grained permissions in authorization",
    rel: "AuthR scope.constraints can reference or embed RAR authorization_details directly.",
  },
  {
    name: "W3C Verifiable Credentials / DIDs",
    role: "Portable, tamper-evident identity assertions",
    rel: "Natural fit for author.id and grounding.evidence_digest — AuthR is VC-compatible.",
  },
  {
    name: "SPIFFE / SPIRE",
    role: "Workload identity and runtime attestation",
    rel: "Natural fit for actor.id and actor.model_manifest attestation evidence.",
  },
  {
    name: "CoSAI Agentic IAM",
    role: "Agents as first-class identities in IAM",
    rel: "AuthR is the authorship layer above the agent identity layer CoSAI defines.",
  },
];

const CODE_EXAMPLE = `from authr import IssuingAuthority, Verifier, Author, Actor, Intent, Scope

ia = IssuingAuthority(key_id="treasury-twin-key-1")

# The CFO authorizes a $180K wire via her verified digital twin
root = ia.issue_root(
    author=Author(
        id="did:web:acme.com:people:jane-doe",
        type="verified_digital_twin",
        role="CFO"
    ),
    actor=Actor(
        id="spiffe://acme.com/agents/treasury-orchestrator",
        type="agent"
    ),
    intent=Intent(
        purpose="approve_wire_transfer",
        risk_tier="high",
        human_in_the_loop=True
    ),
    scope=Scope(
        actions=["wire.prepare", "wire.validate",
                 "wire.approve", "wire.submit"]
    ),
)

# The orchestrator delegates a narrower scope to the validator
hop = ia.extend_chain(
    parent=root,
    actor=Actor(id="spiffe://acme.com/agents/wire-validator"),
    scope=Scope(actions=["wire.prepare", "wire.validate"])
    # wire.approve and wire.submit removed — monotonic attenuation
)

# Wire service verifies before any action reaches the resource
Verifier(
    trust_store={"treasury-twin-key-1": ia.public_key}
).verify_chain([root, hop])
# Returns True — all six invariants pass
# A hop claiming wire.cancel would raise AuthRError here`;

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroRef = useInView(0.05);
  const problemRef = useInView(0.08);
  const stackRef = useInView(0.08);
  const primitivesRef = useInView(0.05);
  const operationsRef = useInView(0.05);
  const invariantsRef = useInView(0.08);
  const archRef = useInView(0.08);
  const standardsRef = useInView(0.05);
  const ctaRef = useInView(0.08);

  return (
    <div className={styles.root}>
      {/* Nav */}
      {/* <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <div className={styles.navLogo}>
            <span className={styles.logoMark}>AuthR</span>
            <span className={styles.logoVersion}>v0.1</span>
            <span className={styles.logoDraft}>Draft</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#problem" className={styles.navLink}>Problem</a>
            <a href="#primitives" className={styles.navLink}>Primitives</a>
            <a href="#how-it-works" className={styles.navLink}>How it works</a>
            <a href="#invariants" className={styles.navLink}>Invariants</a>
            <a href="#standards" className={styles.navLink}>Standards</a>
            <a href="https://github.com/identient/authr" className={styles.navLink} target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          </div>
          <div className={styles.navActions}>
            <button className={styles.themeToggle} onClick={toggle} title="Toggle theme">
              {theme === "dark" ? "☀ Light" : "◗ Dark"}
            </button>
            <Link href="/playground" className={styles.navCta}>Try Playground →</Link>
          </div>
        </div>
      </nav> */}

      {/* Hero */}
      <section
        className={`${styles.hero} ${styles.reveal} ${heroRef.inView ? styles.inView : ""}`}
        ref={heroRef.ref}
      >
        <div className={styles.heroBg} aria-hidden="true">
          <div className={styles.heroGrid} />
          <div className={styles.heroGlow} />
          <div className={styles.heroGlow2} />
        </div>
        <div className={styles.container}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Protocol v0.1
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleLine1}>Authorship</span>
            <span className={styles.heroTitleLine2}>Representation</span>
          </h1>
          <p className={styles.heroTagline}>
            The third pillar of identity for the agentic era.
          </p>
          <p className={styles.heroBody}>
            AuthN proves who you are. AuthZ decides what you can do.{" "}
            <strong>AuthR proves whose judgment drove the decision</strong> —
            and carries that proof, cryptographically, across every hop of an
            agentic execution graph.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/playground" className={styles.ctaPrimary}>
              Try the Playground
            </Link>
            <a
              href="https://github.com/identient/authr/blob/main/spec/AUTHR-v0.1.md"
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the Spec ↗
            </a>
          </div>
          <div className={styles.heroPillars}>
            {PILLARS.map((p) => (
              <div
                key={p.name}
                className={`${styles.pillarCard} ${p.status === "missing" ? styles.pillarCardActive : ""}`}
              >
                <div
                  className={`${styles.pillarStatus} ${p.status === "solved" ? styles.pillarSolved : styles.pillarMissing}`}
                >
                  {p.status === "solved" ? "✓ solved" : "◎ AuthR"}
                </div>
                <div className={styles.pillarName}>{p.name}</div>
                <div className={styles.pillarFull}>{p.full}</div>
                <div className={styles.pillarQ}>{p.q}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section
        id="problem"
        className={`${styles.sectionAlt} ${styles.reveal} ${problemRef.inView ? styles.inView : ""}`}
        ref={problemRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>The Problem</div>
          <h2 className={styles.sectionTitle}>
            Identity infrastructure was built for humans at terminals.
            <br />
            That world is ending.
          </h2>
          <p className={styles.sectionBody}>
            Autonomous agents, AI workers, and verified digital twins now act
            across time, systems, and teams on behalf of people and
            organizations. They compose. They re-plan. They chain tools. They
            run overnight. When something goes wrong — or right — OAuth&apos;s
            On-Behalf-Of can tell you which token was used. It cannot tell you
            whose judgment was behind it.
          </p>
          <div className={styles.problemGrid}>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>◈</div>
              <h3 className={styles.problemTitle}>Intent drift is invisible</h3>
              <p className={styles.problemDesc}>
                An OBO token propagates access. If the orchestrator re-plans and
                issues a wire with different rationale — same API call,
                different judgment — the token still passes. The CFO&apos;s
                original intent disappears with no structural trace.
              </p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>⟳</div>
              <h3 className={styles.problemTitle}>
                Accountability chains don&apos;t exist
              </h3>
              <p className={styles.problemDesc}>
                Multi-agent executions span hours, services, and model versions.
                Current standards answer which token was used and what scope it
                carried. They cannot answer whose judgment was executed across
                an async, multi-hop agent graph.
              </p>
            </div>
            <div className={styles.problemCard}>
              <div className={styles.problemIcon}>▣</div>
              <h3 className={styles.problemTitle}>
                Scope enforcement is application-layer
              </h3>
              <p className={styles.problemDesc}>
                A compromised sub-agent can attempt to widen its permissions.
                With OBO there is no structural enforcement — only
                application-layer policy that assumes agents are well-behaved.
                Rejection happens too late, if at all.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution bridge */}
      <section
        className={`${styles.section} ${styles.reveal} ${stackRef.inView ? styles.inView : ""}`}
        ref={stackRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>The Solution</div>
          <h2 className={styles.sectionTitle}>
            AuthR doesn&apos;t replace OAuth, OIDC, or SAML.
            <br />
            It adds authorship above them.
          </h2>
          <p className={styles.sectionBody}>
            Where OAuth&apos;s On-Behalf-Of delegates <em>access</em>, AuthR
            delegates <em>authorship</em>: it carries grounded responsibility,
            intent, and lineage across the entire execution graph. AuthR sits
            above existing identity infrastructure without displacing it.
          </p>
          <div className={styles.stackDiagram}>
            <div className={styles.stackLayer} data-layer="authr">
              <span className={styles.stackLayerLabel}>AuthR</span>
              <span className={styles.stackLayerDesc}>
                Authorship · Intent · Provenance · Drift
              </span>
            </div>
            <div className={styles.stackConnector}>
              ↑ sits above, does not replace
            </div>
            <div className={styles.stackRow}>
              <div className={styles.stackLayerSmall}>OAuth 2.0 / OIDC</div>
              <div className={styles.stackLayerSmall}>SPIFFE / SPIRE</div>
              <div className={styles.stackLayerSmall}>W3C DIDs / VCs</div>
            </div>
          </div>
        </div>
      </section>

      {/* Six Primitives */}
      <section
        id="primitives"
        className={`${styles.sectionAlt} ${styles.reveal} ${primitivesRef.inView ? styles.inView : ""}`}
        ref={primitivesRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Six Primitives</div>
          <h2 className={styles.sectionTitle}>
            Every AuthR record carries six first-class fields.
          </h2>
          <p className={styles.sectionBody}>
            These are not metadata. They are structural primitives —
            cryptographically bound, inherited across hops, and enforced at the
            verification boundary. Together they make authorship provable, not
            just claimed.
          </p>
          <div className={styles.primitivesGrid}>
            {PRIMITIVES.map((p) => (
              <div
                key={p.name}
                className={`${styles.primitiveCard} ${styles[`primitive_${p.color}`]}`}
              >
                <div className={styles.primitiveIcon}>{p.icon}</div>
                <div className={styles.primitiveName}>{p.name}</div>
                <div className={styles.primitiveWhat}>{p.what}</div>
                <div className={styles.primitiveWhy}>{p.why}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className={`${styles.section} ${styles.reveal} ${operationsRef.inView ? styles.inView : ""}`}
        ref={operationsRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Three Operations</div>
          <h2 className={styles.sectionTitle}>Issue. Extend. Verify.</h2>
          <p className={styles.sectionBody}>
            AuthR defines three core operations. Everything in the protocol
            flows through these three verbs — from the moment the CFO authorizes
            a wire to the moment the resource service decides whether to
            proceed.
          </p>
          <div className={styles.operationsLayout}>
            <div className={styles.operationsList}>
              {OPERATIONS.map((op) => (
                <div key={op.step} className={styles.operationItem}>
                  <div className={styles.operationStep}>{op.step}</div>
                  <div className={styles.operationContent}>
                    <div className={styles.operationHeader}>
                      <span className={styles.operationName}>{op.name}</span>
                      <span className={styles.operationSpec}>{op.spec}</span>
                    </div>
                    <p className={styles.operationDesc}>{op.desc}</p>
                    <p className={styles.operationDetail}>{op.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.codePanel}>
              <div className={styles.codePanelHeader}>
                <span className={styles.codePanelTitle}>
                  Reference implementation — Python
                </span>
                <a
                  href="https://github.com/identient/authr/tree/main/reference/python"
                  className={styles.codePanelLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub ↗
                </a>
              </div>
              <pre className={styles.codeBlock}>
                <code>{CODE_EXAMPLE}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Six Invariants */}
      <section
        id="invariants"
        className={`${styles.sectionAlt} ${styles.reveal} ${invariantsRef.inView ? styles.inView : ""}`}
        ref={invariantsRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Six Invariants</div>
          <h2 className={styles.sectionTitle}>
            For a chain to verify, all six MUST hold.
          </h2>
          <p className={styles.sectionBody}>
            Verification is structural, not operational. A sub-agent cannot
            widen its scope at the application layer — the verifier rejects it
            before the request reaches any resource. One failed invariant
            invalidates the entire chain.
          </p>
          <div className={styles.invariantsGrid}>
            {INVARIANTS.map((inv) => (
              <div key={inv.id} className={styles.invariantCard}>
                <div className={styles.invariantNum}>
                  {String(inv.id).padStart(2, "0")}
                </div>
                <div className={styles.invariantContent}>
                  <div className={styles.invariantName}>{inv.name}</div>
                  <div className={styles.invariantDesc}>{inv.desc}</div>
                </div>
                <div className={styles.invariantRef}>{inv.ref}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section
        id="architecture"
        className={`${styles.section} ${styles.reveal} ${archRef.inView ? styles.inView : ""}`}
        ref={archRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Architecture</div>
          <h2 className={styles.sectionTitle}>
            Three planes. One trust model.
          </h2>
          <p className={styles.sectionBody}>
            AuthR operates across a control plane, an execution plane, and an
            enforcement plane. Each has distinct responsibilities — and distinct
            failure modes the protocol explicitly accounts for.
          </p>
          <div className={styles.planesGrid}>
            {[
              {
                plane: "control",
                label: "Control Plane",
                items: [
                  "Issuing Authority — signs records; holds the root key",
                  "Registry — resolves grounded authors and actor manifests",
                  "Revocation Service — propagates invalidations downstream",
                ],
              },
              {
                plane: "execution",
                label: "Execution Plane",
                items: [
                  "Verified digital twins — anchor chains to real humans",
                  "Orchestrator agents — carry and extend root records",
                  "Sub-agents — receive attenuated hops; cannot exceed parent scope",
                ],
              },
              {
                plane: "enforcement",
                label: "Enforcement Plane",
                items: [
                  "API gateways — verify the chain before passing requests",
                  "MCP servers — verify per tool invocation",
                  "Resource services — last-mile enforcement; reject on any invariant failure",
                ],
              },
            ].map(({ plane, label, items }) => (
              <div key={plane} className={styles.planeCard} data-plane={plane}>
                <div className={styles.planeLabel}>{label}</div>
                <div className={styles.planeItems}>
                  {items.map((item) => (
                    <div key={item} className={styles.planeItem}>
                      <span className={styles.planeItemDot} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Standards */}
      <section
        id="standards"
        className={`${styles.sectionAlt} ${styles.reveal} ${standardsRef.inView ? styles.inView : ""}`}
        ref={standardsRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Standards Compatibility</div>
          <h2 className={styles.sectionTitle}>
            AuthR works with the identity stack you already have.
          </h2>
          <p className={styles.sectionBody}>
            AuthR is not a competitor to existing standards. It is an additional
            assertion layer that slots above them. OAuth handles access
            delegation. AuthR handles authorship delegation. Both are necessary;
            neither is sufficient alone.
          </p>
          <div className={styles.standardsTable}>
            <div className={styles.standardsHeader}>
              <div className={styles.standardsHeaderCell}>Standard</div>
              <div className={styles.standardsHeaderCell}>Role</div>
              <div className={styles.standardsHeaderCell}>
                How AuthR relates
              </div>
            </div>
            {STANDARDS.map((s) => (
              <div key={s.name} className={styles.standardsRow}>
                <div className={styles.standardsName}>{s.name}</div>
                <div className={styles.standardsRole}>{s.role}</div>
                <div className={styles.standardsRel}>{s.rel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className={`${styles.ctaSection} ${styles.reveal} ${ctaRef.inView ? styles.inView : ""}`}
        ref={ctaRef.ref}
      >
        <div className={styles.container}>
          <div className={styles.sectionLabel}>Get Involved</div>
          <h2 className={styles.sectionTitle}>
            AuthR is being developed in public.
            <br />
            Feedback, criticism, and implementations are actively wanted.
          </h2>
          <p className={styles.sectionBody}>
            v0.1 is deliberately narrow. The v0.2 backlog includes cross-domain
            federation, multi-author records, formal revocation propagation, and
            threshold signing. Veterans of IETF, W3C, OpenID Foundation, and
            security researchers are especially welcome.
          </p>
          <div className={styles.ctaCards}>
            <div className={styles.ctaCard}>
              <div className={styles.ctaCardIcon}>⬡</div>
              <div className={styles.ctaCardTitle}>Read the Spec</div>
              <div className={styles.ctaCardDesc}>
                The normative v0.1 protocol document. Six primitives, three
                operations, six invariants, and the full threat model.
              </div>
              <a
                href="https://github.com/identient/authr/blob/main/spec/AUTHR-v0.1.md"
                className={styles.ctaCardLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                AUTHR-v0.1.md ↗
              </a>
            </div>
            <div className={styles.ctaCard}>
              <div className={styles.ctaCardIcon}>◎</div>
              <div className={styles.ctaCardTitle}>Python Reference</div>
              <div className={styles.ctaCardDesc}>
                A working implementation covering all three operations, the full
                invariant suite, and the CFO wire scenario end-to-end.
              </div>
              <a
                href="https://github.com/identient/authr/tree/main/reference/python"
                className={styles.ctaCardLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                reference/python ↗
              </a>
            </div>
            <div className={styles.ctaCard}>
              <div className={styles.ctaCardIcon}>▣</div>
              <div className={styles.ctaCardTitle}>Try the Playground</div>
              <div className={styles.ctaCardDesc}>
                Interactive demo of the full CFO wire scenario — mint a root
                record, delegate, verify the chain, and watch a scope-widening
                attack get rejected.
              </div>
              <Link href="/playground" className={styles.ctaCardLink}>
                Launch playground →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div>
              <div className={styles.footerLogo}>
                <span className={styles.logoMark}>AuthR</span>
                <span className={styles.logoVersion}>v0.1</span>
              </div>
              <p className={styles.footerTagline}>
                The third pillar of identity for the agentic era.
              </p>
              <p className={styles.footerLicense}>
                Apache 2.0 · Identient Corp · 2026
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerLinkGroup}>
                <div className={styles.footerLinkGroupTitle}>Protocol</div>
                <a
                  href="https://github.com/identient/authr/blob/main/spec/AUTHR-v0.1.md"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Specification v0.1
                </a>
                <a
                  href="https://github.com/identient/authr/blob/main/schema/authr-record.schema.json"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JSON Schema
                </a>
                <a
                  href="https://github.com/identient/authr/blob/main/docs/architecture.md"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Architecture docs
                </a>
                <a
                  href="https://github.com/identient/authr/blob/main/docs/threat-model.md"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Threat model
                </a>
              </div>
              <div className={styles.footerLinkGroup}>
                <div className={styles.footerLinkGroupTitle}>Contribute</div>
                <a
                  href="https://github.com/identient/authr"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/identient/authr/blob/main/CONTRIBUTING.md"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contributing
                </a>
                <a
                  href="https://github.com/identient/authr/issues"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Issues &amp; roadmap
                </a>
                <a
                  href="https://github.com/identient/authr/discussions"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discussions
                </a>
              </div>
              <div className={styles.footerLinkGroup}>
                <div className={styles.footerLinkGroupTitle}>Resources</div>
                <Link href="/playground" className={styles.footerLink}>
                  Interactive Playground
                </Link>
                <a
                  href="https://github.com/identient/authr/blob/main/docs/whitepaper.pdf"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Working Paper (PDF)
                </a>
                <a
                  href="https://identient.com"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Identient Corp
                </a>
                <a
                  href="https://www.linkedin.com/in/stevetout/"
                  className={styles.footerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Steve Tout — Author
                </a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <div className={styles.footerCitation}>
              <span className={styles.footerCitationLabel}>Citation</span>
              <span className={styles.footerCitationText}>
                AuthR: Authorship Representation — A Protocol Sketch for the
                Agentic Era (v0.1). Steve Tout, Identient. April 2026.
                https://github.com/identient/authr
              </span>
            </div>
            <div className={styles.footerCopyright}>
              <span>© 2026 Identient Corp</span>
              <span>·</span>
              <span>authr-spec-v0.1</span>
              <span>·</span>
              <span>Apache 2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
