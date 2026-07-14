/*
 * Company Factory end-to-end tests (Playwright + mocked Claude API).
 * Dekker førsteversjonens definisjon av ferdig, uten API-nøkkel:
 * idé → prosjekt → inntak/antakelser → styrevurdering → scoring →
 * beslutning → faseplan → MVP-brief → portefølje/status → porter →
 * svak idé (stopp) → eksempelprosjekt (isolert TEST) → navneromsisolasjon.
 *
 * Run:  node tests/factory.e2e.js [baseURL]   (default http://localhost:8130/)
 */
const { chromium } = require("playwright");

const BASE = (process.argv[2] || "http://localhost:8130/") + "factory/";
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

const INTAKE = {
  summary: "Abonnement som gir boligeiere en vedlikeholdsplan med sesongvarsler.",
  problem: "Boligeiere vet ikke hvilket vedlikehold som trengs når.",
  target_group: "Eiere av enebolig/rekkehus.",
  solution: "Digital plan + varsler + sjekklister.",
  willingness_to_pay: "Hypotese 49–99 kr/mnd – uvalidert.",
  market: "Stort norsk volum – må verifiseres.",
  channel: "SEO + partnere.",
  subscription_potential: "Høyt, sesongbasert gjentakelse.",
  assumptions: [
    { claim: "Betalingsvilje 49–99 kr/mnd", type: "krever_ekstern_validering", confidence: "lav" },
    { claim: "Problemet oppleves som reelt", type: "antakelse", confidence: "middels" },
  ],
  unknowns: ["Churn etter første sesong"],
  decision_changing_questions: ["Finnes distribusjonsfortrinn som senker CAC?"],
};

const FRAMING = {
  case_summary: "Abonnement på boligvedlikehold.",
  selected_roles: ["cf_marked", "cf_kunde", "cf_vekst"],
  rationale: "Marked, kundesmerte og distribusjon er de kritiske usikkerhetene.",
};

const VERDICT = (rec, p) => ({
  position: "Kort posisjon fra mandatet.",
  strongest_argument_against: "Forsikringsselskap kan tilby dette gratis.",
  top_risks: ["Kopiering", "Churn"],
  recommendation: rec,
  certainty: "middels",
  probability_success: p,
});

const scorecard = (n) => [
  "problemsmerte", "frekvens", "betalingsvilje", "markedsstørrelse", "differensiering",
  "gjennomførbarhet", "tid_til_marked", "gjentakende_inntekt", "automatiseringsgrad", "forsvarbarhet",
].map((criterion) => ({ criterion, score: n, reasoning: "Begrunnelse for " + criterion }));

const SYNTHESIS_MVP = {
  summary: "Sterk sak: reelt problem, god økonomi, rask vei til marked.",
  scorecard: scorecard(8),
  score_drivers_up: ["Rask tid til marked"],
  score_drivers_down: ["Forsvarbarhet"],
  weaknesses: ["Kopierbart innhold"],
  improvements: ["Partnerdistribusjon"],
  alternative_ideas: ["B2B white-label"],
  scenarios: [
    { name: "Beste", probability: 0.2, outcome: "Sterk vekst", value_estimate: "5 MNOK ARR" },
    { name: "Sannsynlig", probability: 0.5, outcome: "Moderat", value_estimate: "1 MNOK ARR" },
    { name: "Dårligste", probability: 0.3, outcome: "Nedleggelse", value_estimate: "-100 000 kr" },
  ],
  decision: "mvp",
  decision_rationale: "Betalingsvilje sannsynliggjort; bygg minste betalbare versjon.",
  certainty: "middels",
  assumptions_to_validate: [
    { claim: "CAC < 300 kr organisk", test: "SEO-pilot", threshold: "3 artikler > 500 besøk/mnd", cost_estimate: "0 kr", horizon: "6 uker" },
  ],
};

const SYNTHESIS_STOP = {
  ...SYNTHESIS_MVP,
  scorecard: scorecard(2),
  summary: "Svak sak: ingen dokumentert smerte, gratisalternativer dominerer.",
  score_drivers_up: [],
  score_drivers_down: ["Ingen betalingsvilje", "Ingen differensiering"],
  weaknesses: ["Problemet er ikke smertefullt nok", "Gratisalternativer finnes overalt"],
  improvements: ["Smalere nisje med akutt smerte"],
  alternative_ideas: ["Hytteeier-nisje med høyere betalingsvilje"],
  decision: "stopp",
  decision_rationale: "Åpenbart svak idé: bygging ville vært sløsing – stopp nå.",
};

const PLAN = {
  phases: [
    { phase: 2, relevant: true, scope: "Falsk dør + intervjuer", key_deliverables: ["Landingsside"], first_actions: ["Sett opp falsk dør"], stop_criteria: "< 2 % konvertering", owner_role: "Kundeinnsikt", risks: ["Skjevt utvalg"] },
    { phase: 6, relevant: false, scope: "Utsatt til etter validering", key_deliverables: [], first_actions: [], stop_criteria: "", owner_role: "Merkevare", risks: [] },
    { phase: 8, relevant: true, scope: "Minste betalbare versjon", key_deliverables: ["Nettside med betaling"], first_actions: ["Sett opp mal"], stop_criteria: "Kritiske tester mangler", owner_role: "CTO", risks: ["Scope-vekst"] },
  ],
  sequencing_notes: "Validering før bygging; merkevare bevisst utsatt.",
};

const BRIEF = {
  working_name: "BoligPuls",
  product_vision: "Vedlikehold uten hodebry for vanlige boligeiere.",
  core_problem: "Ukjent vedlikeholdsbehov gir dyre skader.",
  core_job: "Fortell meg hva jeg må gjøre med boligen, når.",
  primary_user_journey: "Registrer bolig → få plan → motta sesongvarsel → utfør/kryss av.",
  mvp_features: [
    { name: "Boligprofil", why: "Grunnlag for planen", acceptance: "Bruker kan registrere boligtype/byggeår" },
    { name: "Sesongvarsler", why: "Kjerneverdien", acceptance: "E-post sendes ved sesongstart" },
    { name: "Stripe-abonnement", why: "Tester betalingsvilje", acceptance: "Betaling → tilgang; kansellering fungerer" },
  ],
  later_features: ["Håndverkerbestilling"],
  not_building: ["Egen app", "Markedsplass", "AI-chat"],
  data_model_outline: ["bruker", "bolig", "oppgave", "abonnement"],
  monetization: { model: "abonnement", price_hypothesis: "79 kr/mnd eller 790 kr/år", trial: "14 dager" },
  launch_channels: ["SEO", "boligkjøpsøyeblikket"],
  success_metrics: [{ metric: "betalende kunder uke 4", target: "≥ 20" }],
  risks: ["Churn etter sesong 1"],
  build_estimate: "2–3 uker for én utvikler",
};

const LANDING = {
  seo_title: "BoligPuls – vedlikeholdsplan for boligen din",
  seo_description: "Sesongbaserte varsler og sjekklister for boligvedlikehold.",
  headline: "Slutt å gjette hva boligen trenger",
  subheadline: "Få en vedlikeholdsplan tilpasset din bolig, med varsler når det faktisk er tid.",
  pain_points: ["Du oppdager taklekkasjen etter at skaden har skjedd", "Sjekklister på nett passer ikke din bolig"],
  value_props: [
    { title: "Plan for din bolig", text: "Basert på boligtype og byggeår." },
    { title: "Sesongvarsler", text: "Beskjed når oppgaven faktisk må gjøres." },
  ],
  offer: "Uforpliktende venteliste – først i køen ved lansering.",
  price_line: "79 kr/mnd ved lansering",
  cta_text: "Sett meg på ventelisten",
  faq: [{ q: "Når lanserer dere?", a: "Vi bygger nå og varsler ventelisten først." }],
  honest_disclaimer: "BoligPuls er under utvikling. Påmelding til ventelisten er gratis og uforpliktende.",
};

const VALIDATION = {
  summary: "Begge kritiske antakelser holdt mot forhåndsdefinerte terskler.",
  per_experiment: [
    { claim: "≥3 % av besøkende legger inn kort/venteliste ved 79 kr/mnd", verdict: "bestått", implication: "Betalingsvilje sannsynliggjort ved prispunktet." },
    { claim: "Problemet er topp-3-bekymring for nye eneboligeiere", verdict: "bestått", implication: "Målgruppen bekrefter smerten uoppfordret." },
  ],
  decision: "mvp",
  decision_rationale: "Terskler satt før testen ble nådd; bygg minste betalbare versjon.",
  certainty: "middels",
  next_steps: ["Revider MVP-brief med valideringsdata", "Behold landingssiden som konverteringsside"],
};

function mockRouter(overrides = {}) {
  const counts = { intake: 0, framing: 0, verdict: 0, synthesis: 0, plan: 0, brief: 0, landing: 0, validation: 0, review: 0, total: 0 };
  const bodies = [];
  const handler = (route) => {
    const body = JSON.parse(route.request().postData());
    bodies.push(body);
    counts.total++;
    const sys = body.system || "";
    if (sys.includes("inntaksmodul")) { counts.intake++; return route.fulfill(respond(overrides.intake || INTAKE)); }
    if (sys.includes("framing-modulen i Company Factory")) { counts.framing++; return route.fulfill(respond(overrides.framing || FRAMING)); }
    if (sys.includes("fagrolle i Company Factory")) {
      counts.verdict++;
      const isMarked = sys.includes("Markedsanalytiker");
      return route.fulfill(respond(VERDICT(isMarked ? "Valider betalingsvilje først" : "Test organisk kanal", isMarked ? 0.35 : 0.45)));
    }
    if (sys.includes("scoringsmodulen i Company Factory")) { counts.synthesis++; return route.fulfill(respond(overrides.synthesis || SYNTHESIS_MVP)); }
    if (sys.includes("planmodulen i Company Factory")) { counts.plan++; return route.fulfill(respond(overrides.plan || PLAN)); }
    if (sys.includes("MVP-brief-modulen")) { counts.brief++; return route.fulfill(respond(overrides.brief || BRIEF)); }
    if (sys.includes("landingsside-modulen")) { counts.landing++; return route.fulfill(respond(overrides.landing || LANDING)); }
    if (sys.includes("valideringsmodulen i Company Factory")) { counts.validation++; return route.fulfill(respond(overrides.validation || VALIDATION)); }
    if (sys.includes("selvevalueringsmodul")) {
      counts.review++;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: [{ type: "text", text: "Selvevaluering: fabrikken fungerer; forbedre X." }], stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 } }) });
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

  /* ---------- Scenario 1: full pipeline, sterk idé → MVP ---------- */
  console.log("FACTORY 1: idé → inntak → styret → score → beslutning → plan → brief");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts } = mockRouter();
    await page.route("**/v1/messages", handler);
    await page.click('nav button[data-tab="idea"]');
    await page.fill("#ideaName", "BoligPuls");
    await page.fill("#ideaText", "Lag en abonnementstjeneste som hjelper boligeiere med vedlikehold av bolig.");
    await page.click("#runIdeaBtn");
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 30000 });

    check("kallkjede: 1 inntak, 1 framing, 3 fagroller, 1 syntese, 1 plan, 1 brief",
      counts.intake === 1 && counts.framing === 1 && counts.verdict === 3 && counts.synthesis === 1 && counts.plan === 1 && counts.brief === 1, counts);
    const cards = await page.evaluate(() => document.querySelectorAll("#board .card").length);
    check("3 rollekort rendret under vurderingen", cards === 3, cards);

    const p = await page.evaluate(() => {
      const id = JSON.parse(localStorage.getItem("cf_index"))[0];
      return JSON.parse(localStorage.getItem("cf_project_" + id));
    });
    check("prosjekt opprettet og lagret strukturert", !!p && p.name === "BoligPuls", p && p.name);
    check("inntak lagret (problem/målgruppe/betalingsvilje)", p.intake && p.intake.problem.includes("vedlikehold") && p.intake.target_group.length > 0, null);
    check("antakelser logget fra inntak + vurdering (2+1)", p.assumptions.length === 3 && p.assumptions.some((a) => a.type === "krever_ekstern_validering"), p.assumptions.length);
    check("score beregnet i kode: alle 8/10 → 80/100", p.evaluation.totalScore === 80, p.evaluation.totalScore);
    check("beslutning MVP med begrunnelse", p.evaluation.synthesis.decision === "mvp" && p.evaluation.synthesis.decision_rationale.length > 10, null);
    check("status oppdatert til bygging", p.status === "bygging", p.status);
    check("faseplan lagret med relevans-filter", p.phasePlan.phases.filter((f) => f.relevant).length === 2, null);
    check("MVP-brief lagret med ikke-bygges-liste", p.brief.working_name === "BoligPuls" && p.brief.not_building.length === 3, null);
    check("beslutningslogg: inntak + vurdering + plan + brief", p.decisions.length === 4, p.decisions.map((d) => d.decision));

    const detail = await page.evaluate(() => document.getElementById("detail").textContent);
    check("prosjektstatus vises (score, beslutning, brief, logger)",
      detail.includes("80") && detail.includes("MVP-BRIEF") && detail.includes("BESLUTNINGSLOGG") && detail.includes("ANTAKELSESLOGG") && detail.includes("FASEPLAN"), null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 2: svak idé → STOPP, ingen plan/brief ---------- */
  console.log("FACTORY 2: svak idé → kritisk vurdering → STOPP med alternativer");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts } = mockRouter({ synthesis: SYNTHESIS_STOP });
    await page.route("**/v1/messages", handler);
    await page.click('nav button[data-tab="idea"]');
    await page.fill("#ideaName", "Generisk sjekkliste-app");
    await page.fill("#ideaText", "En app med sjekklister for alt mulig.");
    await page.click("#runIdeaBtn");
    await page.waitForFunction(() => document.getElementById("pipeline").textContent.includes("FERDIG"), null, { timeout: 30000 });

    check("plan og brief kjøres IKKE ved stopp", counts.plan === 0 && counts.brief === 0, counts);
    const p = await page.evaluate(() => {
      const id = JSON.parse(localStorage.getItem("cf_index"))[0];
      return JSON.parse(localStorage.getItem("cf_project_" + id));
    });
    check("beslutning STOPP, status avsluttet", p.evaluation.synthesis.decision === "stopp" && p.status === "avsluttet", p.status);
    check("lav score (alle 2/10 → 20/100)", p.evaluation.totalScore === 20, p.evaluation.totalScore);
    const detail = await page.evaluate(() => document.getElementById("detail").textContent);
    check("svakheter, forbedringer og alternative idéer vises", detail.includes("SVAKHETER") && detail.includes("Hytteeier-nisje"), null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 3: eksempelprosjekt – isolert, merket TEST, null API-kall ---------- */
  console.log("FACTORY 3: eksempelprosjekt (TEST) uten API-kall");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts } = mockRouter();
    await page.route("**/v1/messages", handler);
    await page.click('nav button[data-tab="system"]');
    await page.click("#demoBtn");
    await page.waitForFunction(() => document.getElementById("detail").textContent.includes("BoligPuls"), null, { timeout: 5000 });

    check("null API-kall for eksempelprosjektet", counts.total === 0, counts.total);
    const detail = await page.evaluate(() => document.getElementById("detail").textContent);
    check("tydelig merket som isolert testprosjekt", detail.includes("TEST – ISOLERT EKSEMPELPROSJEKT"), null);
    const p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("test-flagg satt og beslutning VALIDER_MER", p.test === true && p.evaluation.synthesis.decision === "valider_mer", null);
    const scoreOk = await page.evaluate(() => {
      const p = window.CF.Projects.list()[0];
      return p.evaluation.totalScore === window.CF.Evaluation.totalScore(p.evaluation.synthesis.scorecard);
    });
    check("demo-score konsistent med scoringsmodellen", scoreOk, null);
    check("idempotent: ny lasting dupliserer ikke", await page.evaluate(() => { window.CF.Demo.load(); return window.CF.Projects.list().length === 1; }), null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 4: porter, navneromsisolasjon og AEIS-gjenbruk ---------- */
  console.log("FACTORY 4: eier-porter, cf_*-isolasjon, gjenbruk av AEIS-styret");
  {
    const { page, errors } = await freshPage(browser);
    /* Seed AEIS-roller for å verifisere lese-gjenbruk med fortjent autoritet */
    await page.evaluate(() => {
      localStorage.setItem("aeis_roles", JSON.stringify([
        { id: "cfo", title: "Chief Financial Officer", mandate: "Kapital", active: true, temporary: false, track: { n: 1, brierSum: 0.04 } },
        { id: "gammel", title: "Avviklet rolle", mandate: "-", active: false, temporary: false, track: { n: 0, brierSum: 0 } },
      ]));
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.click('nav button[data-tab="system"]');
    await page.click("#demoBtn");
    await page.waitForFunction(() => document.getElementById("detail").textContent.includes("BoligPuls"), null, { timeout: 5000 });

    const roster = await page.evaluate(() => window.CF.Board.roster());
    check("AEIS-roller gjenbrukes med kalibrert vekt (CFO 2.0×)",
      roster.some((r) => r.id === "cfo" && r.weight === 2.0), roster.filter((r) => r.source === "aeis"));
    check("avviklede AEIS-roller ekskluderes", !roster.some((r) => r.id === "gammel"), null);
    check("fabrikkens fagroller finnes i rosteret", roster.filter((r) => r.source === "factory").length === 9, null);

    /* Eier-port */
    await page.click("#pGate");
    const p = await page.evaluate(() => window.CF.Projects.list()[0]);
    const gateKeys = Object.keys(p.gates);
    check("port godkjent og logget med EIER-flagg", gateKeys.length === 1 && p.gates[gateKeys[0]].byOwner === true && p.decisions[0].decision.includes("PORT GODKJENT") && p.decisions[0].byOwner === true, p.decisions[0]);

    /* Navneromsisolasjon */
    const iso = await page.evaluate(() => {
      let threw = false;
      try { window.CF.Store.set("aeis_ledger", []); } catch (_) { threw = true; }
      const foreign = Object.keys(localStorage).filter((k) => !k.startsWith("cf_") && k !== "jarvis_api_key" && k !== "aeis_roles");
      return { threw, foreign, aeisUntouched: JSON.parse(localStorage.getItem("aeis_roles")).length === 2 };
    });
    check("Store nekter å skrive utenfor cf_*", iso.threw, null);
    check("ingen fremmede nøkler skrevet; AEIS-data urørt", iso.foreign.length === 0 && iso.aeisUntouched, iso.foreign);

    /* Per-prosjekt eksport (utspinning/avvikling) */
    const exp = await page.evaluate(() => JSON.parse(window.CF.Store.exportProject(window.CF.Projects.list()[0].id)));
    check("prosjekt kan eksporteres isolert", exp.name === "BoligPuls (TEST)" && Array.isArray(exp.decisions), null);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  /* ---------- Scenario 5: Fase 2 – eksperimenter, landingsside, valideringsport → MVP ---------- */
  console.log("FACTORY 5: validering → eksperimenter → landingsside → port → brief");
  {
    const { page, errors } = await freshPage(browser);
    const { handler, counts } = mockRouter();
    await page.route("**/v1/messages", handler);
    page.on("dialog", (d) => d.accept(""));
    await page.click('nav button[data-tab="system"]');
    await page.click("#demoBtn");
    await page.waitForFunction(() => document.getElementById("detail").textContent.includes("BoligPuls"), null, { timeout: 5000 });

    /* Eksperimentkø fra antakelsene (ingen API-kostnad) */
    await page.click("#expCreate");
    let p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("eksperimenter avledet fra kritiske antakelser (2 stk med terskel)",
      p.experiments.length === 2 && p.experiments.every((e) => e.threshold.length > 0 && e.status === "planlagt"), p.experiments.length);
    check("eksperimentkøen kostet ingen API-kall", counts.total === 0, counts.total);

    /* Registrer resultater mot terskler */
    await page.fill(".exp-result >> nth=0", "4,2 % konvertering til venteliste");
    await page.click(".exp-pass >> nth=0");
    await page.fill(".exp-result", "7 av 10 nevnte problemet uoppfordret");
    await page.click(".exp-pass");
    p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("resultater registrert og logget med EIER-flagg",
      p.experiments.every((e) => e.status === "fullført" && e.passed) && p.decisions[0].byOwner === true && p.decisions[0].decision.includes("BESTÅTT"), p.decisions[0]);

    /* Falsk-dør-landingsside – fabrikken bygger den */
    await page.click("#lpGen");
    await page.waitForFunction(() => !!(window.CF.Projects.list()[0] || {}).landing, null, { timeout: 10000 });
    p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("landingsside generert med copy og pris synlig",
      counts.landing === 1 && p.landing.html.includes("Slutt å gjette") && p.landing.html.includes("79 kr/mnd"), counts);
    check("selvstendig HTML: ingen eksterne script/stiler/bilder",
      !/<(script|link|img)[^>]+(src|href)=["']https?:/i.test(p.landing.html) && p.landing.html.includes("<!DOCTYPE html>"), null);
    check("ærlig venteliste-framing (disclaimer + PreOrder)",
      p.landing.html.includes("uforpliktende") && p.landing.html.includes("PreOrder"), null);

    /* Valideringsporten slipper prosjektet videre */
    await page.click("#valReview");
    await page.waitForFunction(() => document.getElementById("detail").textContent.includes("VALIDERINGSPORT"), null, { timeout: 10000 });
    p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("valideringsport: MVP → status bygging, neste relevante fase (3)",
      p.validation.decision === "mvp" && p.status === "bygging" && p.phase === 3, { status: p.status, phase: p.phase });
    check("portbeslutningen er logget", p.decisions[0].decision.includes("Valideringsport: MVP"), p.decisions[0]);

    /* «Kjør videre» produserer MVP-brief basert på validert beslutning */
    await page.click("#pResume");
    await page.waitForFunction(() => document.getElementById("detail").textContent.includes("MVP-BRIEF"), null, { timeout: 10000 });
    p = await page.evaluate(() => window.CF.Projects.list()[0]);
    check("MVP-brief generert etter bestått validering", counts.brief === 1 && p.brief.working_name === "BoligPuls", counts);
    check("ingen JS-feil", errors.length === 0, errors);
    await page.close();
  }

  await browser.close();
  console.log(failures === 0 ? "\nALL FACTORY TESTS PASSED" : `\n${failures} FAILURES`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });
