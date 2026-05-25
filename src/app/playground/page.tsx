"use client";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import {
  AuthRRecord,
  VerificationResult,
  issueRoot,
  extendChain,
  verifyChain,
  CFO_AUTHOR,
  TREASURY_ORCHESTRATOR,
  WIRE_VALIDATOR,
  CFO_INTENT,
  ROOT_SCOPE,
  VALIDATOR_SCOPE,
  mockHash,
  nowISO,
  expISO,
  newId,
  newCorrelationId,
} from "@/lib/authr";

type Tab = "walkthrough" | "compare" | "freestyle";
type StepId = "mint" | "delegate" | "verify" | "attack";

interface StepState {
  mint: AuthRRecord | null;
  hop: AuthRRecord | null;
  verifyResult: VerificationResult | null;
  attackError: string | null;
  currentStep: number;
  openStep: number | null;
}

const STEPS: {
  id: StepId;
  title: string;
  desc: string;
  spec: string;
  btnLabel: string;
  btnVariant: "primary" | "success" | "danger";
}[] = [
  {
    id: "mint",
    title: "Mint root record",
    desc: "The CFO (via her verified digital twin) authorizes a $180K wire transfer. The Issuing Authority constructs a signed AuthR record — capturing author, actor, intent, scope, and provenance.",
    spec: "authr-spec-v0.1 §5.3.1",
    btnLabel: "Mint root record",
    btnVariant: "primary",
  },
  {
    id: "delegate",
    title: "Delegate to validator sub-agent",
    desc: "The orchestrator delegates to a narrower sub-agent. Scope attenuates monotonically — [prepare, validate, approve, submit] narrows to [prepare, validate]. Author is preserved across the hop.",
    spec: "authr-spec-v0.1 §5.3.2",
    btnLabel: "Delegate to sub-agent",
    btnVariant: "primary",
  },
  {
    id: "verify",
    title: "Verify the chain",
    desc: "The wire service (last-mile enforcement point) verifies the full chain against six invariants before any action reaches the resource.",
    spec: "authr-spec-v0.1 §5.3.3",
    btnLabel: "Verify chain",
    btnVariant: "success",
  },
  {
    id: "attack",
    title: "Compromise the sub-agent",
    desc: "A compromised sub-agent attempts to add wire.cancel — an action the CFO never authorized. Watch the verifier reject it structurally, before it touches any resource.",
    spec: "authr-spec-v0.1 §4.4",
    btnLabel: "Try to widen scope",
    btnVariant: "danger",
  },
];

const OBO_SCENARIOS = [
  {
    title: "Intent drift",
    obo: "OBO token authorizes the call. If the orchestrator re-plans and issues a different wire with different rationale (same API), the token still passes. Mismatch is invisible.",
    authr:
      "AuthR captures intent as a first-class field — locked at authorship time, inherited across every hop. A re-planned wire with different intent fails verification.",
    failLabel: "Intent mismatch undetectable",
    passLabel: "Intent preserved and verifiable across chain",
  },
  {
    title: "Long-running execution",
    obo: "OBO assumes short-lived synchronous requests. A token minted at T0 used at T3 (one hour later) is suspect — but OBO has no native stale detection for async agent flows.",
    authr:
      "AuthR has explicit issued_at, expires_at, and stale_after fields. Records force re-anchoring before irreversible effects. Drift awareness is a first-class primitive.",
    failLabel: "No stale detection for async agent hops",
    passLabel: "Explicit expiry and drift signals enforced",
  },
  {
    title: "Scope expansion",
    obo: "OBO propagates scope but cannot enforce monotonic narrowing across an evolving agent graph. A compromised sub-agent can attempt to widen scope at the application layer.",
    authr:
      "The AuthR verifier enforces monotonic scope attenuation structurally. A sub-agent that claims wider scope than its parent is rejected before reaching any resource.",
    failLabel: "Widening detectable only at application layer",
    passLabel: "Structural rejection — verifier blocks at resource boundary",
  },
  {
    title: "Accountability",
    obo: "OBO audit answers: which token was used, what scope it carried. It cannot cleanly answer whose judgment was executed across async multi-agent chains.",
    authr:
      "AuthR separates Author (the CFO — real-world referent) from Actor (the agent). Grounding evidence ties the author to HR records or board approvals. Responsibility is provable.",
    failLabel: "Audit answers: which token was used",
    passLabel: "Audit answers: whose judgment was executed, proven",
  },
];

export default function PlaygroundPage() {
  const [tab, setTab] = useState<Tab>("walkthrough");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [step, setStep] = useState<StepState>({
    mint: null,
    hop: null,
    verifyResult: null,
    attackError: null,
    currentStep: 0,
    openStep: null,
  });
  const [oboIdx, setOboIdx] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  // Freestyle state
  const [fsAuthor, setFsAuthor] = useState("Jane Doe");
  const [fsRole, setFsRole] = useState("CFO");
  const [fsActor, setFsActor] = useState("Treasury Orchestrator Agent");
  const [fsAction, setFsAction] = useState("wire.submit");
  const [fsAmount, setFsAmount] = useState(180000);
  const [fsRisk, setFsRisk] = useState<"low" | "medium" | "high">("high");
  const [fsRecord, setFsRecord] = useState<AuthRRecord | null>(null);
  const [fsResult, setFsResult] = useState<{
    passed: boolean;
    reasons: string[];
  } | null>(null);

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

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.dataset.theme = "light";
    } else {
      delete document.documentElement.dataset.theme;
    }
    localStorage.setItem("authr-theme", next);
  };

  const copyText = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const runMint = () => {
    const root = issueRoot({
      author: CFO_AUTHOR,
      actor: TREASURY_ORCHESTRATOR,
      intent: CFO_INTENT,
      scope: ROOT_SCOPE,
      dataSources: [
        { source_id: "policy:treasury-payments-v7", source_type: "policy" },
      ],
    });
    setStep((s) => ({ ...s, mint: root, currentStep: 1, openStep: 0 }));
  };

  const runDelegate = () => {
    if (!step.mint) return;
    const hop = extendChain({
      parent: step.mint,
      actor: WIRE_VALIDATOR,
      attenuatedScope: VALIDATOR_SCOPE,
    });
    setStep((s) => ({ ...s, hop, currentStep: 2, openStep: 1 }));
  };

  const runVerify = () => {
    if (!step.mint || !step.hop) return;
    const result = verifyChain([step.mint, step.hop]);
    setStep((s) => ({
      ...s,
      verifyResult: result,
      currentStep: 3,
      openStep: 2,
    }));
  };

  const runAttack = () => {
    if (!step.mint) return;
    try {
      extendChain({
        parent: step.mint,
        actor: WIRE_VALIDATOR,
        attenuatedScope: {
          permitted_actions: ["wire.prepare", "wire.validate", "wire.cancel"],
          constraints: {
            max_amount: 250000,
            currency: "USD",
            max_delegation_depth: 1,
          },
        },
      });
      setStep((s) => ({
        ...s,
        attackError: null,
        currentStep: 4,
        openStep: 3,
      }));
    } catch (e: unknown) {
      setStep((s) => ({
        ...s,
        attackError: e instanceof Error ? e.message : String(e),
        currentStep: 4,
        openStep: 3,
      }));
    }
  };

  const runFreestyle = () => {
    const PERMITTED = [
      "wire.prepare",
      "wire.validate",
      "wire.approve",
      "wire.submit",
    ];
    const MAX = 250000;
    const reasons: string[] = [];
    if (!PERMITTED.includes(fsAction))
      reasons.push(`Action '${fsAction}' is not in permitted scope`);
    if (fsAmount > MAX)
      reasons.push(
        `Amount $${fsAmount.toLocaleString()} exceeds delegation ceiling of $${MAX.toLocaleString()}`,
      );

    const corrId = newCorrelationId();
    const issuedAt = nowISO();
    const record: AuthRRecord = {
      authr_id: newId(),
      version: "0.1",
      issued_at: issuedAt,
      expires_at: expISO(30),
      author: {
        id: `did:web:custom.com:people:${fsAuthor.toLowerCase().replace(/\s/g, "-")}`,
        display_name: fsAuthor,
        role: fsRole,
        type: "verified_digital_twin",
        grounding: {
          referent_type: "verified_human",
          verified_at: issuedAt,
          verifier: "custom-hrms",
          evidence_digest: mockHash(fsAuthor + fsRole),
        },
      },
      actor: {
        id: `spiffe://custom.com/agents/${fsActor.toLowerCase().replace(/\s/g, "-")}`,
        type: "agent",
        display_name: fsActor,
        model_manifest: {
          model_version: "2026.05",
          signer_id: "custom-ai-governance",
          code_hash: mockHash(fsActor),
        },
      },
      intent: {
        purpose: "custom_action",
        statement: "Freestyle mode — custom intent",
        risk_tier: fsRisk,
        human_in_the_loop: fsRisk === "high",
      },
      scope: {
        permitted_actions: PERMITTED,
        constraints: {
          max_amount: MAX,
          currency: "USD",
          max_delegation_depth: 2,
        },
      },
      provenance: { chain: [], correlation_id: corrId, data_sources: [] },
      drift: {
        confidence: 0.95,
        stale_after: expISO(30),
        deviation_signals: [],
      },
      signature: {
        alg: "EdDSA",
        kid: "freestyle-key",
        value: mockHash(fsAuthor + fsActor + fsAction + fsAmount),
        mock_note: "Mocked for MVP",
      },
    };
    setFsRecord(record);
    setFsResult({ passed: reasons.length === 0, reasons });
  };

  const getStepDone = (idx: number) => {
    if (idx === 0) return step.mint !== null;
    if (idx === 1) return step.hop !== null;
    if (idx === 2) return step.verifyResult !== null;
    if (idx === 3) return step.currentStep >= 4;
    return false;
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>AuthR</span>
            <span className={styles.logoVersion}>v0.1</span>
          </div>
          <nav className={styles.headerNav}>
            <Link href="/" className={styles.backLink}>
              ← Home
            </Link>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === "dark" ? "☀ Light" : "◗ Dark"}
            </button>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroTag}>Interactive playground</div>
          <h1 className={styles.heroTitle}>
            Authorship Representation
            <br />
            Protocol
          </h1>
          <p className={styles.heroSub}>
            AuthN asks who you are. AuthZ asks what you can do.
            <br />
            <strong>
              AuthR asks whose judgment drove the decision — and proves it.
            </strong>
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>60-second demo</span>
            <span className={styles.badge}>No login required</span>
            <span className={styles.badge}>CFO wire scenario</span>
          </div>
        </section>

        <div className={styles.tabs}>
          {(["walkthrough", "compare", "freestyle"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "walkthrough"
                ? "Guided walkthrough"
                : t === "compare"
                  ? "AuthR vs OBO"
                  : "Freestyle mode"}
            </button>
          ))}
        </div>

        {tab === "walkthrough" && (
          <div className={styles.walkthrough}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${step.currentStep * 25}%` }}
              />
            </div>

            {STEPS.map((s, idx) => {
              const done = getStepDone(idx);
              const locked = idx > step.currentStep;
              const open = step.openStep === idx;

              return (
                <div
                  key={s.id}
                  className={`${styles.stepCard} ${done ? styles.stepDone : ""} ${locked ? styles.stepLocked : ""}`}
                >
                  <button
                    className={styles.stepHeader}
                    onClick={() =>
                      setStep((prev) => ({
                        ...prev,
                        openStep: prev.openStep === idx ? null : idx,
                      }))
                    }
                    disabled={locked}
                  >
                    <div
                      className={`${styles.stepNum} ${done && idx !== 3 ? styles.stepNumDone : ""} ${done && idx === 3 ? styles.stepNumError : ""} ${!done && !locked ? styles.stepNumActive : ""}`}
                    >
                      {done && idx !== 3
                        ? "✓"
                        : done && idx === 3
                          ? "✗"
                          : idx + 1}
                    </div>
                    <div className={styles.stepInfo}>
                      <div className={styles.stepTitle}>{s.title}</div>
                      <div className={styles.stepSpec}>{s.spec}</div>
                    </div>
                    <div
                      className={`${styles.stepStatus} ${done && idx !== 3 ? styles.statusDone : done && idx === 3 ? styles.statusError : locked ? styles.statusLocked : styles.statusReady}`}
                    >
                      {done && idx !== 3
                        ? "complete"
                        : done && idx === 3
                          ? "blocked"
                          : locked
                            ? "locked"
                            : "ready"}
                    </div>
                    <span
                      className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
                    >
                      ›
                    </span>
                  </button>

                  {open && (
                    <div className={styles.stepBody}>
                      <p className={styles.stepDesc}>{s.desc}</p>

                      {!done && !locked && (
                        <button
                          className={`${styles.actionBtn} ${styles[`btn_${s.btnVariant}`]}`}
                          onClick={
                            idx === 0
                              ? runMint
                              : idx === 1
                                ? runDelegate
                                : idx === 2
                                  ? runVerify
                                  : runAttack
                          }
                        >
                          {s.btnLabel}
                        </button>
                      )}

                      {idx === 0 && step.mint && (
                        <div className={styles.resultBlock}>
                          <div className={styles.resultHeader}>
                            <span className={styles.resultLabel}>
                              AuthR root record
                            </span>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyText(
                                  JSON.stringify(step.mint, null, 2),
                                  "mint",
                                )
                              }
                            >
                              {copied === "mint" ? "Copied!" : "Copy JSON"}
                            </button>
                          </div>
                          <pre className={styles.jsonBlock}>
                            {JSON.stringify(step.mint, null, 2)}
                          </pre>
                        </div>
                      )}

                      {idx === 1 && step.hop && (
                        <div className={styles.resultBlock}>
                          <div className={styles.chainViz}>
                            <div className={styles.chainNode} data-type="root">
                              <div className={styles.cnLabel}>
                                Root — orchestrator
                              </div>
                              <div className={styles.cnActions}>
                                {[
                                  "wire.prepare",
                                  "wire.validate",
                                  "wire.approve",
                                  "wire.submit",
                                ].map((a) => (
                                  <span
                                    key={a}
                                    className={`${styles.scopeTag} ${["wire.approve", "wire.submit"].includes(a) ? styles.scopeRemoved : styles.scopeKept}`}
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className={styles.chainArrow}>→</div>
                            <div className={styles.chainNode} data-type="hop">
                              <div className={styles.cnLabel}>
                                Hop — validator sub-agent
                              </div>
                              <div className={styles.cnActions}>
                                {["wire.prepare", "wire.validate"].map((a) => (
                                  <span
                                    key={a}
                                    className={`${styles.scopeTag} ${styles.scopeKept}`}
                                  >
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className={styles.resultHeader}>
                            <span className={styles.resultLabel}>
                              Hop record
                            </span>
                            <button
                              className={styles.copyBtn}
                              onClick={() =>
                                copyText(
                                  JSON.stringify(step.hop, null, 2),
                                  "hop",
                                )
                              }
                            >
                              {copied === "hop" ? "Copied!" : "Copy JSON"}
                            </button>
                          </div>
                          <pre className={styles.jsonBlock}>
                            {JSON.stringify(step.hop, null, 2)}
                          </pre>
                        </div>
                      )}

                      {idx === 2 && step.verifyResult && (
                        <div className={styles.resultBlock}>
                          <div className={styles.invariantList}>
                            {step.verifyResult.invariants.map((inv, i) => (
                              <div
                                key={i}
                                className={`${styles.invRow} ${inv.passed ? styles.invPass : styles.invFail}`}
                              >
                                <span className={styles.invIcon}>
                                  {inv.passed ? "✓" : "✗"}
                                </span>
                                <span className={styles.invName}>
                                  {inv.name}
                                </span>
                                <span className={styles.invRef}>{inv.ref}</span>
                              </div>
                            ))}
                          </div>
                          <div className={styles.verifySuccess}>
                            Chain verified. All six invariants passed. Wire
                            service authorized to proceed.
                          </div>
                        </div>
                      )}

                      {idx === 3 && step.attackError && (
                        <div className={styles.resultBlock}>
                          <div className={styles.invariantList}>
                            {[
                              "Signature valid and kid trusted",
                              "Record not expired",
                              "Author stable across chain",
                            ].map((n, i) => (
                              <div
                                key={i}
                                className={`${styles.invRow} ${styles.invPass}`}
                              >
                                <span className={styles.invIcon}>✓</span>
                                <span className={styles.invName}>{n}</span>
                                <span className={styles.invRef}>
                                  §5.3.3 inv.{i + 1}
                                </span>
                              </div>
                            ))}
                            <div
                              className={`${styles.invRow} ${styles.invFail}`}
                            >
                              <span className={styles.invIcon}>✗</span>
                              <span className={styles.invName}>
                                Scope monotonically narrows — VIOLATED
                              </span>
                              <span className={styles.invRef}>
                                §5.3.3 inv.4
                              </span>
                            </div>
                          </div>
                          <div className={styles.rejectBox}>
                            <div className={styles.rejectTitle}>
                              Scope expansion rejected
                            </div>
                            <div className={styles.rejectDetail}>
                              {step.attackError}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "compare" && (
          <div className={styles.compare}>
            <p className={styles.compareIntro}>
              OAuth OBO propagates caller context but stops before the question
              that matters in agentic systems. Select a scenario to see what OBO
              misses and how AuthR covers it.
            </p>
            <div className={styles.oboTabs}>
              {OBO_SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  className={`${styles.oboTab} ${oboIdx === i ? styles.oboTabActive : ""}`}
                  onClick={() => setOboIdx(i)}
                >
                  {s.title}
                </button>
              ))}
            </div>
            <div className={styles.oboGrid}>
              <div className={styles.oboCard} data-type="fail">
                <div className={styles.oboLabel}>OAuth OBO alone</div>
                <p className={styles.oboText}>{OBO_SCENARIOS[oboIdx].obo}</p>
                <div className={styles.oboOutcome} data-type="fail">
                  {OBO_SCENARIOS[oboIdx].failLabel}
                </div>
              </div>
              <div className={styles.oboCard} data-type="pass">
                <div className={styles.oboLabel}>AuthR + OBO</div>
                <p className={styles.oboText}>{OBO_SCENARIOS[oboIdx].authr}</p>
                <div className={styles.oboOutcome} data-type="pass">
                  {OBO_SCENARIOS[oboIdx].passLabel}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "freestyle" && (
          <div className={styles.freestyle}>
            <p className={styles.compareIntro}>
              Craft your own AuthR record. Define author, actor, intent, and
              scope — then mint and verify.
            </p>
            <div className={styles.fsForm}>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Author name</label>
                <input
                  className={styles.fsInput}
                  value={fsAuthor}
                  onChange={(e) => setFsAuthor(e.target.value)}
                />
              </div>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Author role</label>
                <input
                  className={styles.fsInput}
                  value={fsRole}
                  onChange={(e) => setFsRole(e.target.value)}
                />
              </div>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Actor (agent)</label>
                <input
                  className={styles.fsInput}
                  value={fsActor}
                  onChange={(e) => setFsActor(e.target.value)}
                />
              </div>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Requested action</label>
                <select
                  className={styles.fsInput}
                  value={fsAction}
                  onChange={(e) => setFsAction(e.target.value)}
                >
                  <option>wire.submit</option>
                  <option>wire.validate</option>
                  <option>wire.cancel</option>
                  <option>wire.approve</option>
                  <option>data.export</option>
                  <option>account.delete</option>
                </select>
              </div>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Amount (USD)</label>
                <input
                  className={styles.fsInput}
                  type="number"
                  value={fsAmount}
                  onChange={(e) => setFsAmount(Number(e.target.value))}
                />
              </div>
              <div className={styles.fsField}>
                <label className={styles.fsLabel}>Risk tier</label>
                <select
                  className={styles.fsInput}
                  value={fsRisk}
                  onChange={(e) =>
                    setFsRisk(e.target.value as "low" | "medium" | "high")
                  }
                >
                  <option>high</option>
                  <option>medium</option>
                  <option>low</option>
                </select>
              </div>
            </div>
            <div className={styles.fsBtns}>
              <button
                className={`${styles.actionBtn} ${styles.btn_primary}`}
                onClick={runFreestyle}
              >
                Mint and verify
              </button>
              <button
                className={styles.copyBtn}
                onClick={() =>
                  fsRecord && copyText(JSON.stringify(fsRecord, null, 2), "fs")
                }
              >
                {copied === "fs" ? "Copied!" : "Copy record as JSON"}
              </button>
            </div>
            {fsResult && (
              <div
                className={styles.resultBlock}
                style={{ marginTop: "1.25rem" }}
              >
                {fsResult.passed ? (
                  <div className={styles.verifySuccess}>
                    Record minted and verified. All scope checks passed.
                  </div>
                ) : (
                  <div className={styles.rejectBox}>
                    <div className={styles.rejectTitle}>
                      Verification failed
                    </div>
                    {fsResult.reasons.map((r, i) => (
                      <div key={i} className={styles.rejectDetail}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
                {fsRecord && (
                  <pre className={styles.jsonBlock}>
                    {JSON.stringify(fsRecord, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <span>AuthR Protocol v0.1 — Identient Corp</span>
          <span>authr-spec-v0.1 | playground.identient.com/authr</span>
        </div>
      </footer>
    </div>
  );
}
