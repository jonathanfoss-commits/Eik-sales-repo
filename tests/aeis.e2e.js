/*
 * AEIS end-to-end tests (Playwright + mocked Claude API).
 * Exercises the full board pipeline with no API key:
 * framing → independent analyses → devil's advocate (incl. veto) →
 * pre-mortem → CEO synthesis → ledger → outcome → scoring/weights → lessons.
 *
 * Run:  node tests/aeis.e2e.js [baseURL]   (default http://localhost:8130/)
 */
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8130/") + "aeis/";
let failures = 0;
function check(name, cond, detail) {
  console.log((cond ? "  ✅ " : "  ❌ ") + name + (cond ? "" : "  → " + JSON.stringify(detail)));
  if (!cond) failures++;
}

const respond = (payload) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({
    content: [{ type: "text", text: JSON.stringify(payload) }],
    stop_reason: "end_turn",
    usage: { input_tokens: 100, output_tokens: 100 },
  }),
});

const FRAMING = {
  problem: "Bør eieren starte selskap X i marked Y?",
  unknowns: ["Reell markedsstørrelse"],
  data_needed: ["Konkurrentpriser"],
  selected_roles: ["cfo", "cso"],
  temporary_experts: [],
  rationale: "Finans og strategi er kjernen her.",
};
const ANALYSIS = (rec, p) => ({
  position: "Posisjon basert på mandatet.",
  assumptions: [{ claim: "Markedet vokser 10 % årlig", confidence: "middels" }],
  risks: ["Kapitalbinding"],
  data_gaps: [],
  recommendation: rec,
  certainty: "middels",
  probability_success: p,
  needs_more_info: false,
});
const DEVIL_OK = {
  objections: ["CAC-antakelsen er svakt underbygget"],
  untested_assumptions: ["Markedsvekst"],
  groupthink_signals: [],
  risk_underestimated: false,
  veto: false,
  veto_reason: "",
};
const DEVIL_VETO = { ...DEVIL_OK, risk_underestimated: true, veto: true, veto_reason: "Risiko vesentlig undervurdert; antakelser ikke testet." };
const PREMORTEM = {
  failure_story: "To år senere var kapitalen brent uten produkt–marked-tilpasning.",
  causes: ["For tidlig skalering"],
  missed_signals: ["Lav retensjon i pilot"],
  mitigations: ["Milepælsbasert kapitalutløsning"],
};
const SYNTHESIS = {
  summary: "Styret heller mot betinget ja.",
  disagreements: ["CFO mer forsiktig enn CSO"],
  scenarios: [
    { name: "Base", probability: 0.5, outcome: "Moderat suksess", value_estimate: "2× kapital" },
    { name: "Bull", probability: 0.2, outcome: "Sterk vekst", value_estimate: "8× kapital" },
    { name: "Bear", probability: 0.3, outcome: "Nedleggelse", value_estimate: "-70 %" },
  ],
  expected_value_reasoning: "Positiv forventet verdi gitt milepælsstyring.",
  recommendation: "Betinget JA: start med begrenset pilot.",
  certainty: "middels",
  probability_success: 0.62,
  action_plan: ["Definer pilot", "Sett kill-kriterier"],
  assumptions_to_track: [{ claim: "CAC < 500 kr", test: "Kjør 4 ukers betalt kampanje", review_horizon: "6 uker" }],
};
const POSTMORTEM = {
  what_worked: ["Milepælsstyringen"],
  what_failed: ["Kanalvalget"],
  assumptions_right: ["Markedsvekst"],
  assumptions_wrong: ["CAC-nivået"],
  process_improvements: ["Krev kanaltest før beslutning"],
  best_agents: undefined, // ikke del av skjema — fjernes under
  lesson: "Krev alltid kanaltest før markedsantakelser godtas.",
};
delete POSTMORTEM.best_agents;

function mockRouter(overrides = {}) {
  const counts = { framing: 0, analysis: 0, devil: 0, premortem: 0, synthesis: 0, postmortem: 0 };
  const bodies = [];
  const handler = (route) => {
    const body = JSON.parse(route.request().postData());
    bodies.push(body);
    const sys = body.system || "";
    if (sys.includes("framing-modul")) { counts.framing++; return route.fulfill(respond(overrides.framing || FRAMING)); }
    if (sys.includes("Devil's Advocate i AEIS")) {
      counts.devil++;
      const payload = overrides.devilSequence ? overrides.devilSequence[Math.min(counts.devil - 1, overrides.devilSequence.length - 1)] : DEVIL_OK;
      return route.fulfill(respond(payload));
    }
    if (sys.includes("pre-mortem-modul")) { counts.premortem++; return route.fulfill(respond(PREMORTEM)); }
    if (sys.includes("CEO i AEIS")) { counts.synthesis++; return route.fulfill(respond(SYNTHESIS)); }
    if (sys.includes("post-mortem-modul")) { counts.postmortem++; return route.fulfill(respond(POSTMORTEM)); }
    if (sys.includes("Executive Board")) {
      counts.analysis++;
      const isCfo = sys.includes("Chief Financial Officer");
      return route.fulfill(respond(ANALYSIS(isCfo ? "Forsiktig ja med kapitaltak" : "Ja, posisjonen er ledig", isCfo ? 0.6 : 0.7)));
    }
    return route.fulfill(respond({ note: "ukjent kall" }));
  };
  return { handler, counts, bodies };
}

async function freshPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("jarvis_api_key", "sk-ant-test"); });
  await page.reload({ waitUntil: "networkidle" });
  return { page, errors };
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

  /* ---------- Scenario 1: full pipeline uten veto ---------- */
  console.log("AEIS 1: full beslutningspipeline");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts } = mockRouter();
    await page.route("**/v1/messages", handler);
    await page.fill("#decTitle", "Starte selskap X?");
    await page.fill("#decContext", "Har 2 MNOK tilgjengelig.");
    await page.click("#runBtn");
    await page.waitForSelector("#verdict .panel", { timeout: 20000 });
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 20000 });

    check("framing kjørt én gang", counts.framing === 1, counts);
    check("2 uavhengige analyser (kun valgte roller)", counts.analysis === 2, counts);
    check("devil + premortem + synthesis kjørt", counts.devil === 1 && counts.premortem === 1 && counts.synthesis === 1, counts);
    const cards = await page.evaluate(() => document.querySelectorAll("#board .card").length);
    check("2 rollekort rendret", cards === 2, cards);
    const verdict = await page.evaluate(() => document.getElementById("verdict").textContent);
    check("CEO-anbefaling vises", verdict.includes("Betinget JA"), verdict.slice(0, 120));
    check("scenarier med sannsynlighet vises", verdict.includes("Bull") && verdict.includes("20%"), null);
    check("pre-mortem vises", verdict.includes("katastrofe") || verdict.includes("kapitalen brent"), null);
    const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem("aeis_ledger")));
    check("beslutningen lagret i hovedboken", ledger.length === 1 && ledger[0].synthesis.recommendation.includes("Betinget"), ledger.length);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 2: Devil's Advocate-veto utløser runde 2 ---------- */
  console.log("AEIS 2: veto → ny analyserunde");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts, bodies } = mockRouter({ devilSequence: [DEVIL_VETO, DEVIL_OK] });
    await page.route("**/v1/messages", handler);
    await page.fill("#decTitle", "Oppkjøp av konkurrent?");
    await page.click("#runBtn");
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 20000 });

    check("devil kjørt to ganger (veto + re-vurdering)", counts.devil === 2, counts);
    check("analysene kjørt i to runder (2 roller × 2)", counts.analysis === 4, counts);
    const round2HasObjections = bodies.some((b) =>
      (b.system || "").includes("Executive Board") && (b.messages?.[0]?.content || "").includes("NEDLAGT VETO"));
    check("runde 2 fikk innvendingene injisert", round2HasObjections, null);
    const veto = await page.evaluate(() => document.getElementById("verdict").textContent.includes("NEDLA VETO"));
    check("veto vises i domsslutningen", veto, null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 3: utfall → kalibrering, vekter og lærdom ---------- */
  console.log("AEIS 3: utfall → scoring + post-mortem + læringssløyfe");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, bodies } = mockRouter();
    await page.route("**/v1/messages", handler);
    await page.fill("#decTitle", "Pilotlansering?");
    await page.click("#runBtn");
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 20000 });

    // Gå til hovedboken og registrer utfall 80 %
    await page.click('nav button[data-tab="ledger"]');
    await page.click(".ledger-item");
    await page.fill("#outcomePct", "80");
    await page.fill("#outcomeNotes", "Piloten traff.");
    await page.click("#outcomeBtn");
    await page.waitForFunction(() => document.getElementById("ledgerDetail").textContent.includes("POST-MORTEM"), null, { timeout: 20000 });

    const state = await page.evaluate(() => {
      const roles = JSON.parse(localStorage.getItem("aeis_roles"));
      const cfo = roles.find((r) => r.id === "cfo");
      const cso = roles.find((r) => r.id === "cso");
      return {
        cfo: { n: cfo.track.n, w: window.AEIS.Scoring.weightOf(cfo) },
        cso: { n: cso.track.n, w: window.AEIS.Scoring.weightOf(cso) },
        lessons: window.AEIS.Ledger.lessons(5),
      };
    });
    // cfo: p=0.6, utfall=0.8 → brier 0.04 → vekt 0.25/0.09 = 2.78 → klippes til 2.0
    // cso: p=0.7, utfall=0.8 → brier 0.01 → vekt 0.25/0.06 = 4.17 → klippes til 2.0
    check("agentene ble scoret (n=1)", state.cfo.n === 1 && state.cso.n === 1, state);
    check("vekter oppdatert etter kalibrering", state.cfo.w === 2.0 && state.cso.w === 2.0, state);
    check("lærdom lagret fra post-mortem", state.lessons.length === 1 && state.lessons[0].includes("kanaltest"), state.lessons);

    // Læringssløyfen: neste sak skal få lærdommene injisert i framing-kallet
    await page.click('nav button[data-tab="boardroom"]');
    await page.fill("#decTitle", "Neste sak");
    await page.click("#runBtn");
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 20000 });
    const framingWithLessons = bodies.some((b) =>
      (b.system || "").includes("framing-modul") && (b.messages?.[0]?.content || "").includes("VARIGE LÆRDOMMER") && (b.messages?.[0]?.content || "").includes("kanaltest"));
    check("lærdom injiseres i fremtidige framing-kall", framingWithLessons, null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 4: dynamisk organisasjon ---------- */
  console.log("AEIS 4: roller kan opprettes og avvikles");
  {
    const { page, errors } = await freshPage(browser);
    await page.click('nav button[data-tab="roles"]');
    const before = await page.evaluate(() => window.AEIS.Roles.active().length);
    await page.fill("#newRoleTitle", "Real Estate Director");
    await page.fill("#newRoleMandate", "Eiendom: yield, belåning, regulering.");
    await page.click("#addRoleBtn");
    const after = await page.evaluate(() => window.AEIS.Roles.active().length);
    await page.evaluate(() => window.AEIS.Roles.retire("growth"));
    const growthActive = await page.evaluate(() => window.AEIS.Roles.byId("growth").active);
    check("ny rolle opprettet", after === before + 1, { before, after });
    check("rolle avviklet (ingen rolle er permanent)", growthActive === false, growthActive);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? "\nALL AEIS TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
