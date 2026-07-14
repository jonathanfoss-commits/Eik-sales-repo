/* Company Factory – AI-drevet startup-studio på Eik-plattformen.
 * Moduler: Store, LLM, Board, Pipeline, Projects, Intake, Evaluation, Planner, Brief, Demo, SelfReview.
 * Kontrakter: se ARCHITECTURE.md. Kun LLM gjør nettverkskall.
 * Navnerom: cf_*. Leser (skriver ALDRI) jarvis_api_key, jarvis_model, aeis_roles, aeis_profile.
 */
"use strict";

/* ================= Store ================= */
const Store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  },
  set(key, value) {
    if (!key.startsWith("cf_")) throw new Error("Store skriver kun til cf_*-navnerommet: " + key);
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    if (!key.startsWith("cf_")) throw new Error("Store sletter kun i cf_*-navnerommet: " + key);
    localStorage.removeItem(key);
  },
  /* Lese-kontrakter mot plattformen (aldri skriv) */
  get apiKey() { return localStorage.getItem("jarvis_api_key") || ""; },
  get model() { return localStorage.getItem("jarvis_model") || "claude-opus-4-8"; },
  get ownerProfile() { return localStorage.getItem("aeis_profile") || ""; },
  aeisRoles() { return this.get("aeis_roles", null); },

  projectIds() { return this.get("cf_index", []); },
  loadProject(id) { return this.get("cf_project_" + id, null); },
  saveProject(p) {
    p.updatedAt = new Date().toISOString();
    this.set("cf_project_" + p.id, p);
    const idx = this.projectIds();
    if (!idx.includes(p.id)) { idx.push(p.id); this.set("cf_index", idx); }
    return p;
  },
  deleteProject(id) {
    this.remove("cf_project_" + id);
    this.set("cf_index", this.projectIds().filter((x) => x !== id));
  },
  exportProject(id) { return JSON.stringify(this.loadProject(id), null, 2); },
  exportAll() {
    const projects = {};
    for (const id of this.projectIds()) projects["cf_project_" + id] = this.loadProject(id);
    return JSON.stringify({ cf_index: this.projectIds(), ...projects, exported: new Date().toISOString() }, null, 2);
  },
  importAll(json) {
    const d = JSON.parse(json);
    if (Array.isArray(d.cf_index)) this.set("cf_index", d.cf_index);
    for (const k of Object.keys(d)) if (k.startsWith("cf_project_")) this.set(k, d[k]);
  },
};

/* ================= LLM (eneste nettverkspunkt) ================= */
const PHILOSOPHY = `Du er en modul i Company Factory – eierens AI-drevne startup-studio for digitale selskaper med gjentakende inntekter.
GRUNNLOV (overstyrer alt annet):
- Vær kritisk, ikke hyggelig. Forsøk å AVKREFTE idéen før du anbefaler å bygge den. Bygg aldri videre på en åpenbart dårlig idé fordi eieren nevnte den.
- Gjett aldri. Skill eksplisitt mellom fakta, eierens påstander, systemets antakelser og usikkerhet. Marker hva som krever ekstern validering.
- Uttrykk aldri større sikkerhet enn dataene tilsier. Ingen falsk presisjon i scoring – forklar hva som trekker opp og ned.
- Finn den billigste og raskeste testen av de mest kritiske antakelsene før tung utvikling anbefales.
- Unngå tomme fraser («revolusjonerende», «sømløs», «kraftig», «fremtidens») uten bevis. Copy og vurderinger skal være konkrete og basert på kundens problem.
- Tilpass omfanget til idéen: små idéer får små planer. Ikke maksimal kompleksitet for kompleksitetens skyld.
- Optimaliser for: rask læring, betalingsvilje, gjentakende inntekt, høy automatisering, lave faste kostnader, enkel drift, enkel avvikling av dårlige idéer.
Svar på norsk.`;

const LLM = {
  async call({ system, user, schema, tools, maxTokens = 8192, onStatus }) {
    if (!Store.apiKey) throw new Error("Ingen API-nøkkel. Lim inn under SYSTEM-fanen (deles med JARVIS/AEIS).");
    let messages = [{ role: "user", content: user }];
    for (let round = 0; round < 6; round++) {
      const body = { model: Store.model, max_tokens: maxTokens, system: PHILOSOPHY + "\n\n" + system, messages };
      if (schema) body.output_config = { format: { type: "json_schema", schema } };
      if (tools) body.tools = tools;
      const res = await this._post(body);
      if (res.stop_reason === "pause_turn") {
        messages = [...messages, { role: "assistant", content: res.content }];
        if (onStatus) onStatus("arbeider videre …");
        continue;
      }
      if (res.stop_reason === "refusal") throw new Error("Forespørselen ble avvist av modellen.");
      const text = (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
      if (schema) {
        try { return { json: JSON.parse(text), usage: res.usage }; }
        catch (e) { throw new Error("Klarte ikke å tolke strukturert svar: " + e.message); }
      }
      return { text, usage: res.usage };
    }
    throw new Error("Avbrutt: for mange fortsettelsesrunder.");
  },
  async _post(body, attempt = 0) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Store.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      if ((res.status === 429 || res.status >= 500) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
        return this._post(body, attempt + 1);
      }
      let detail = "";
      try { detail = (await res.json()).error?.message || ""; } catch (_) {}
      throw new Error(`API-feil ${res.status}. ${detail}`);
    }
    return res.json();
  },
};

/* Begrenset parallellitet (kostnadskontroll) */
async function pool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) { const idx = i++; results[idx] = await fn(items[idx], idx); }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/* ================= Board (gjenbruker AEIS' Executive Board) ================= */
const FACTORY_ROLES = [
  ["studio", "Studioleder", "Helhetsansvar for fabrikken: porteføljeprioritering, ressursbruk, kill-disiplin. Syntetiserer og eier beslutningen."],
  ["marked", "Markedsanalytiker", "Markedsstørrelse, vekst, konkurrenter, alternativer, hvorfor noen vil bytte, kopieringsrisiko."],
  ["kunde", "Kundeinnsiktsansvarlig", "Hvem har problemet, hvor smertefullt og hyppig er det, hvem betaler, kundereise, churn-signaler."],
  ["merkevare", "Merkevarestrateg", "Posisjonering, kategori, løfte, differensiering, navn, tone of voice, troverdig kommunikasjon uten tomme fraser."],
  ["ux", "UX- og produktdesigner", "Viktigste brukerreise, onboarding, aktivering, konverteringsflyt, mobilbruk, tilgjengelighet."],
  ["vekst", "Growth/Performance", "Kanalvalg etter målgruppe og økonomi, CAC/LTV-logikk, SEO, betalt trafikk, produktdrevet vekst, eksperimentkø."],
  ["salg", "Salgsansvarlig", "Om produktet krever salg: ICP, pipeline, outreach, kvalifisering, innvendinger, ekspansjon."],
  ["drift", "Drift og kundeservice", "Supportbelastning, kunnskapsbase, hendelseshåndtering, hvor mye manuelt arbeid modellen krever."],
  ["sikkerhet", "Sikkerhetsansvarlig", "Autentisering, tilgangsstyring, persondata, betalingssikkerhet, tredjepartsrisiko, misbruk."],
];

const Board = {
  /* Roster = AEIS' aktive roller (med fortjent autoritet) ∪ fabrikkens fagroller. Lese-kun mot AEIS. */
  roster() {
    const factory = FACTORY_ROLES.map(([id, title, mandate]) => ({ id: "cf_" + id, title, mandate, weight: 1.0, source: "factory" }));
    const aeis = (Store.aeisRoles() || [])
      .filter((r) => r.active && !r.temporary)
      .map((r) => ({
        id: r.id, title: r.title, mandate: r.mandate, source: "aeis",
        weight: !r.track || r.track.n === 0 ? 1.0 : Math.min(2.0, Math.max(0.5, 0.25 / (0.05 + r.track.brierSum / r.track.n))),
      }));
    return [...aeis, ...factory];
  },
  byId(id) { return this.roster().find((r) => r.id === id); },
};

/* ================= Pipeline (kanoniske faser + porter) ================= */
const PHASES = [
  { n: 0,  id: "inntak",      title: "Inntak av idé",          gate: "idé godkjent for analyse" },
  { n: 1,  id: "vurdering",   title: "Idévurdering",           gate: "analyse godkjent for validering" },
  { n: 2,  id: "validering",  title: "Markedsvalidering",      gate: "validering godkjent for MVP" },
  { n: 3,  id: "forretning",  title: "Forretningsmodell",      gate: "modell godkjent" },
  { n: 4,  id: "strategi",    title: "Selskap og strategi",    gate: "strategi godkjent" },
  { n: 5,  id: "produkt",     title: "Produktdefinisjon",      gate: "MVP-omfang godkjent" },
  { n: 6,  id: "merkevare",   title: "Merkevare",              gate: "identitet godkjent" },
  { n: 7,  id: "arkitektur",  title: "Teknisk arkitektur",     gate: "arkitektur godkjent" },
  { n: 8,  id: "bygg",        title: "Bygg produkt og nettside", gate: "MVP godkjent for produksjon" },
  { n: 9,  id: "betaling",    title: "Betaling og abonnement", gate: "kommersiell flyt godkjent (eier)" },
  { n: 10, id: "juridisk",    title: "Juridisk, personvern og sikkerhet", gate: "juridisk kontroll (krever fagperson)" },
  { n: 11, id: "marketing",   title: "Markedsføring",          gate: "kanalstrategi godkjent" },
  { n: 12, id: "salg",        title: "Salg",                   gate: "salgssystem godkjent" },
  { n: 13, id: "drift",       title: "Drift og kundeservice",  gate: "driftsklar" },
  { n: 14, id: "qa",          title: "Testing og kvalitetssikring", gate: "produksjon godkjent for lansering" },
  { n: 15, id: "lansering",   title: "Lansering",              gate: "offentlig lansering (eier)" },
  { n: 16, id: "vekst",       title: "Måling og vekst",        gate: "lansering godkjent for skalering" },
];

/* Handlinger som ALLTID krever eierens eksplisitte godkjenning */
const OWNER_GATE_ACTIONS = [
  "betalinger og kjøp", "publisering", "domenekjøp/-overføring", "juridisk bindende handlinger",
  "selskapsregistrering", "bank og skatt", "sletting av kritiske data", "masseutsendelse av kommunikasjon",
  "opprettelse av kostbare tjenester", "høyrisiko produksjonsendringer", "bruk av sensitive data", "offentlig lansering",
];

/* Modenhetsnivåer – «ferdig selskap» brukes aldri */
const MATURITY = ["prototype", "MVP", "beta", "produksjonsklart", "lanseringsklart digitalt produkt", "juridisk etablert selskap", "operativ virksomhet", "kommersielt validert virksomhet"];

/* ================= Projects ================= */
const Projects = {
  create(name, ideaText, opts = {}) {
    const id = "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    const p = {
      id, name, idea: ideaText, test: !!opts.test,
      status: "idé", phase: 0, maturity: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      assumptions: [], decisions: [], phasePlan: null,
      intake: null, evaluation: null, brief: null, gates: {},
    };
    return Store.saveProject(p);
  },
  list() {
    return Store.projectIds().map((id) => Store.loadProject(id)).filter(Boolean)
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  },
  get(id) { return Store.loadProject(id); },
  save(p) { return Store.saveProject(p); },
  remove(id) { Store.deleteProject(id); },
  logDecision(p, entry) {
    p.decisions.unshift({
      id: "b" + Date.now().toString(36) + p.decisions.length,
      at: new Date().toISOString(),
      role: entry.role || "system",
      phase: entry.phase ?? p.phase,
      decision: entry.decision,
      options: entry.options || [],
      rationale: entry.rationale || "",
      assumptions: entry.assumptions || [],
      risk: entry.risk || "",
      revisit: entry.revisit || "",
      byOwner: !!entry.byOwner,
    });
    return Store.saveProject(p);
  },
  logAssumptions(p, list, source) {
    for (const a of list || []) {
      p.assumptions.push({ claim: a.claim, type: a.type || "antakelse", confidence: a.confidence || "middels", source: source || "system", at: new Date().toISOString() });
    }
    return Store.saveProject(p);
  },
  approveGate(p, gateId, byOwner = true) {
    p.gates[gateId] = { approved: true, byOwner, at: new Date().toISOString() };
    this.logDecision(p, { decision: "PORT GODKJENT: " + gateId, rationale: byOwner ? "Eksplisitt eiergodkjenning." : "Autogodkjent lavrisikoport.", byOwner });
    return Store.saveProject(p);
  },
};

/* ================= JSON-skjemaer (modulkontrakter) ================= */
const ASSUMPTION_TYPES = ["fakta", "påstand_fra_eier", "antakelse", "ukjent", "krever_ekstern_validering"];
const DECISIONS = ["stopp", "parker", "valider_mer", "endre_konsept", "prototype", "mvp", "lansering"];
const CRITERIA = [
  ["problemsmerte", 1.5], ["frekvens", 0.7], ["betalingsvilje", 1.5], ["markedsstørrelse", 1.2],
  ["differensiering", 1.2], ["gjennomførbarhet", 1.0], ["tid_til_marked", 0.8],
  ["gjentakende_inntekt", 1.3], ["automatiseringsgrad", 1.0], ["forsvarbarhet", 0.8],
];

const strArr = { type: "array", items: { type: "string" } };
const SCHEMAS = {
  intake: {
    type: "object",
    properties: {
      summary: { type: "string" },
      problem: { type: "string" },
      target_group: { type: "string" },
      solution: { type: "string" },
      willingness_to_pay: { type: "string" },
      market: { type: "string" },
      channel: { type: "string" },
      subscription_potential: { type: "string" },
      assumptions: { type: "array", items: {
        type: "object",
        properties: { claim: { type: "string" }, type: { type: "string", enum: ASSUMPTION_TYPES }, confidence: { type: "string", enum: ["høy", "middels", "lav"] } },
        required: ["claim", "type", "confidence"], additionalProperties: false } },
      unknowns: strArr,
      decision_changing_questions: strArr,
    },
    required: ["summary", "problem", "target_group", "solution", "willingness_to_pay", "market", "channel", "subscription_potential", "assumptions", "unknowns", "decision_changing_questions"],
    additionalProperties: false,
  },
  framing: {
    type: "object",
    properties: { case_summary: { type: "string" }, selected_roles: strArr, rationale: { type: "string" } },
    required: ["case_summary", "selected_roles", "rationale"], additionalProperties: false,
  },
  verdict: {
    type: "object",
    properties: {
      position: { type: "string" },
      strongest_argument_against: { type: "string" },
      top_risks: strArr,
      recommendation: { type: "string" },
      certainty: { type: "string", enum: ["høy", "middels", "lav"] },
      probability_success: { anyOf: [{ type: "number" }, { type: "null" }] },
    },
    required: ["position", "strongest_argument_against", "top_risks", "recommendation", "certainty", "probability_success"],
    additionalProperties: false,
  },
  synthesis: {
    type: "object",
    properties: {
      summary: { type: "string" },
      scorecard: { type: "array", items: {
        type: "object",
        properties: { criterion: { type: "string", enum: CRITERIA.map(([c]) => c) }, score: { type: "number" }, reasoning: { type: "string" } },
        required: ["criterion", "score", "reasoning"], additionalProperties: false } },
      score_drivers_up: strArr,
      score_drivers_down: strArr,
      weaknesses: strArr,
      improvements: strArr,
      alternative_ideas: strArr,
      scenarios: { type: "array", items: {
        type: "object",
        properties: { name: { type: "string" }, probability: { type: "number" }, outcome: { type: "string" }, value_estimate: { type: "string" } },
        required: ["name", "probability", "outcome", "value_estimate"], additionalProperties: false } },
      decision: { type: "string", enum: DECISIONS },
      decision_rationale: { type: "string" },
      certainty: { type: "string", enum: ["høy", "middels", "lav"] },
      assumptions_to_validate: { type: "array", items: {
        type: "object",
        properties: { claim: { type: "string" }, test: { type: "string" }, threshold: { type: "string" }, cost_estimate: { type: "string" }, horizon: { type: "string" } },
        required: ["claim", "test", "threshold", "cost_estimate", "horizon"], additionalProperties: false } },
    },
    required: ["summary", "scorecard", "score_drivers_up", "score_drivers_down", "weaknesses", "improvements", "alternative_ideas", "scenarios", "decision", "decision_rationale", "certainty", "assumptions_to_validate"],
    additionalProperties: false,
  },
  validation: {
    type: "object",
    properties: {
      summary: { type: "string" },
      per_experiment: { type: "array", items: {
        type: "object",
        properties: { claim: { type: "string" }, verdict: { type: "string", enum: ["bestått", "ikke_bestått", "uklart"] }, implication: { type: "string" } },
        required: ["claim", "verdict", "implication"], additionalProperties: false } },
      decision: { type: "string", enum: DECISIONS },
      decision_rationale: { type: "string" },
      certainty: { type: "string", enum: ["høy", "middels", "lav"] },
      next_steps: strArr,
    },
    required: ["summary", "per_experiment", "decision", "decision_rationale", "certainty", "next_steps"],
    additionalProperties: false,
  },
  landing: {
    type: "object",
    properties: {
      seo_title: { type: "string" },
      seo_description: { type: "string" },
      headline: { type: "string" },
      subheadline: { type: "string" },
      pain_points: strArr,
      value_props: { type: "array", items: {
        type: "object",
        properties: { title: { type: "string" }, text: { type: "string" } },
        required: ["title", "text"], additionalProperties: false } },
      offer: { type: "string" },
      price_line: { type: "string" },
      cta_text: { type: "string" },
      faq: { type: "array", items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"], additionalProperties: false } },
      honest_disclaimer: { type: "string" },
    },
    required: ["seo_title", "seo_description", "headline", "subheadline", "pain_points", "value_props", "offer", "price_line", "cta_text", "faq", "honest_disclaimer"],
    additionalProperties: false,
  },
  bizmodel: {
    type: "object",
    properties: {
      value_prop: { type: "string" },
      icp: { type: "string" },
      buyer: { type: "string" },
      user: { type: "string" },
      revenue_model: { type: "string" },
      plans: { type: "array", items: {
        type: "object",
        properties: { name: { type: "string" }, price_month: { type: "number" }, price_year: { type: "number" }, target_share: { type: "number" }, includes: strArr },
        required: ["name", "price_month", "price_year", "target_share", "includes"], additionalProperties: false } },
      free_tier: { type: "string" },
      trial: { type: "string" },
      assumptions: { type: "object",
        properties: {
          visitors_m1: { type: "number" }, visitor_growth_pct_m: { type: "number" },
          signup_rate: { type: "number" }, paid_conversion: { type: "number" },
          churn_monthly: { type: "number" }, cac: { type: "number" },
          fixed_costs_monthly: { type: "number" }, variable_cost_per_user: { type: "number" },
        },
        required: ["visitors_m1", "visitor_growth_pct_m", "signup_rate", "paid_conversion", "churn_monthly", "cac", "fixed_costs_monthly", "variable_cost_per_user"],
        additionalProperties: false },
      assumption_notes: strArr,
      risks: strArr,
    },
    required: ["value_prop", "icp", "buyer", "user", "revenue_model", "plans", "free_tier", "trial", "assumptions", "assumption_notes", "risks"],
    additionalProperties: false,
  },
  site: {
    type: "object",
    properties: {
      brand: { type: "object",
        properties: {
          name: { type: "string" }, slogan: { type: "string" }, tone: { type: "string" },
          color_primary: { type: "string" }, color_ink: { type: "string" }, color_bg: { type: "string" }, color_accent: { type: "string" },
        },
        required: ["name", "slogan", "tone", "color_primary", "color_ink", "color_bg", "color_accent"],
        additionalProperties: false },
      seo_title: { type: "string" },
      seo_description: { type: "string" },
      hero_headline: { type: "string" },
      hero_sub: { type: "string" },
      cta_text: { type: "string" },
      features: { type: "array", items: {
        type: "object",
        properties: { title: { type: "string" }, text: { type: "string" } },
        required: ["title", "text"], additionalProperties: false } },
      how_it_works: strArr,
      pricing_faq: { type: "array", items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"], additionalProperties: false } },
      faq: { type: "array", items: {
        type: "object",
        properties: { q: { type: "string" }, a: { type: "string" } },
        required: ["q", "a"], additionalProperties: false } },
      about_story: { type: "string" },
      about_values: strArr,
      terms_outline: strArr,
      privacy_outline: strArr,
    },
    required: ["brand", "seo_title", "seo_description", "hero_headline", "hero_sub", "cta_text", "features", "how_it_works", "pricing_faq", "faq", "about_story", "about_values", "terms_outline", "privacy_outline"],
    additionalProperties: false,
  },
  retro: {
    type: "object",
    properties: {
      what_worked: strArr,
      what_failed: strArr,
      wrong_assumptions: strArr,
      process_improvements: strArr,
      reusable: strArr,
      not_reusable: strArr,
      lesson: { type: "string" },
    },
    required: ["what_worked", "what_failed", "wrong_assumptions", "process_improvements", "reusable", "not_reusable", "lesson"],
    additionalProperties: false,
  },
  plan: {
    type: "object",
    properties: {
      phases: { type: "array", items: {
        type: "object",
        properties: {
          phase: { type: "number" }, relevant: { type: "boolean" }, scope: { type: "string" },
          key_deliverables: strArr, first_actions: strArr, stop_criteria: { type: "string" },
          owner_role: { type: "string" }, risks: strArr,
        },
        required: ["phase", "relevant", "scope", "key_deliverables", "first_actions", "stop_criteria", "owner_role", "risks"], additionalProperties: false } },
      sequencing_notes: { type: "string" },
    },
    required: ["phases", "sequencing_notes"], additionalProperties: false,
  },
  brief: {
    type: "object",
    properties: {
      working_name: { type: "string" },
      product_vision: { type: "string" },
      core_problem: { type: "string" },
      core_job: { type: "string" },
      primary_user_journey: { type: "string" },
      mvp_features: { type: "array", items: {
        type: "object",
        properties: { name: { type: "string" }, why: { type: "string" }, acceptance: { type: "string" } },
        required: ["name", "why", "acceptance"], additionalProperties: false } },
      later_features: strArr,
      not_building: strArr,
      data_model_outline: strArr,
      monetization: { type: "object",
        properties: { model: { type: "string" }, price_hypothesis: { type: "string" }, trial: { type: "string" } },
        required: ["model", "price_hypothesis", "trial"], additionalProperties: false },
      launch_channels: strArr,
      success_metrics: { type: "array", items: {
        type: "object",
        properties: { metric: { type: "string" }, target: { type: "string" } },
        required: ["metric", "target"], additionalProperties: false } },
      risks: strArr,
      build_estimate: { type: "string" },
    },
    required: ["working_name", "product_vision", "core_problem", "core_job", "primary_user_journey", "mvp_features", "later_features", "not_building", "data_model_outline", "monetization", "launch_channels", "success_metrics", "risks", "build_estimate"],
    additionalProperties: false,
  },
};

/* ================= Lessons (varige lærdommer på tvers av prosjekter) ================= */
const Lessons = {
  list() { return Store.get("cf_lessons", []); },
  add(lesson, projectName) {
    const list = this.list();
    list.unshift({ lesson, project: projectName, at: new Date().toISOString() });
    Store.set("cf_lessons", list.slice(0, 20));
  },
  latest(n = 5) { return this.list().slice(0, n).map((l) => `- [${l.project}] ${l.lesson}`); },
};

function ownerContext() {
  const profile = Store.ownerProfile;
  const lessons = Lessons.latest(5);
  let ctx = profile ? `OM EIEREN (fra AEIS-profilen):\n${profile}\n\n` : "";
  if (lessons.length) ctx += `VARIGE LÆRDOMMER FRA TIDLIGERE FABRIKKPROSJEKTER (retro):\n${lessons.join("\n")}\n\n`;
  return ctx;
}

function escHtml(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ================= ZIP-writer (ukomprimert/STORE – ingen avhengigheter) ================= */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
/* makeZip({ "index.html": "<html>…", … }) → Uint8Array (gyldig .zip, STORE-metode) */
function makeZip(files) {
  const enc = new TextEncoder();
  const chunks = [], central = [];
  let offset = 0;
  const u16 = (v) => [v & 0xff, (v >> 8) & 0xff];
  const u32 = (v) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
  for (const name of Object.keys(files)) {
    const nameB = enc.encode(name);
    const data = enc.encode(files[name]);
    const crc = crc32(data);
    /* Local file header: signatur, versjon 20, flagg 0x0800 (UTF-8 navn), metode 0, tid/dato 0 */
    const lfh = new Uint8Array([0x50, 0x4b, 0x03, 0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0)]);
    chunks.push(lfh, nameB, data);
    central.push(new Uint8Array([0x50, 0x4b, 0x01, 0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nameB.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset)]), nameB);
    offset += lfh.length + nameB.length + data.length;
  }
  const centralSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new Uint8Array([0x50, 0x4b, 0x05, 0x06, ...u16(0), ...u16(0), ...u16(central.length / 2), ...u16(central.length / 2), ...u32(centralSize), ...u32(offset), ...u16(0)]);
  const total = offset + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of [...chunks, ...central, eocd]) { out.set(c, pos); pos += c.length; }
  return out;
}

/* ================= Intake (Fase 0) ================= */
const Intake = {
  async run(p, onStatus) {
    if (onStatus) onStatus("Fase 0: strukturerer idéen …");
    const { json } = await LLM.call({
      system: `Du er Company Factorys inntaksmodul (Fase 0). Trekk ut problem, målgruppe, mulig løsning, betalingsvilje, marked, kanal og abonnementspotensial fra eierens idé. Skill knallhardt mellom fakta, eierens påstander, antakelser, ukjente og forhold som krever ekstern validering. Lag rimelige antakelser der informasjon mangler (marker dem), og still KUN spørsmål som faktisk kan endre beslutningen eller løsningen. Ikke stopp prosessen fordi informasjon mangler.`,
      user: `${ownerContext()}IDÉ FRA EIEREN:\n${p.idea}`,
      schema: SCHEMAS.intake,
      maxTokens: 4096,
    });
    p.intake = json;
    p.phase = 1;
    Projects.logAssumptions(p, json.assumptions, "inntak");
    Projects.logDecision(p, { phase: 0, decision: "Idé strukturert – godkjent for analyse", rationale: json.summary, role: "inntaksmodul" });
    return Projects.save(p);
  },
};

/* ================= Evaluation (Fase 1: styret + scoring) ================= */
const Evaluation = {
  totalScore(scorecard) {
    const w = Object.fromEntries(CRITERIA);
    let sum = 0, max = 0;
    for (const row of scorecard || []) {
      const weight = w[row.criterion] ?? 1;
      sum += Math.max(0, Math.min(10, row.score)) * weight;
      max += 10 * weight;
    }
    return max ? Math.round((sum / max) * 100) : 0;
  },

  async run(p, onProgress) {
    const say = (step, detail) => onProgress && onProgress(step, detail);
    if (!p.intake) throw new Error("Kjør inntak (Fase 0) først.");
    const caseText = `SAK: ${p.name}\nPROBLEM: ${p.intake.problem}\nMÅLGRUPPE: ${p.intake.target_group}\nLØSNING: ${p.intake.solution}\nBETALINGSVILJE: ${p.intake.willingness_to_pay}\nMARKED: ${p.intake.market}\nKANAL: ${p.intake.channel}\nABONNEMENTSPOTENSIAL: ${p.intake.subscription_potential}\nUKJENTE: ${p.intake.unknowns.join("; ") || "(ingen)"}`;

    /* 1) Framing: velg kun roller som tilfører saken noe */
    say("framing", "Velger relevante fagroller …");
    const roster = Board.roster();
    const framing = (await LLM.call({
      system: `Du er framing-modulen i Company Factory. Velg KUN de 3–6 rollene fra styret som faktisk tilfører DENNE saken noe – ingen deltar av høflighet. Bruk id-ene nøyaktig.`,
      user: `${ownerContext()}${caseText}\n\nTILGJENGELIG STYRE OG FAGROLLER:\n${roster.map((r) => `${r.id}: ${r.title} – ${r.mandate} (vekt ${r.weight.toFixed(2)}×)`).join("\n")}`,
      schema: SCHEMAS.framing,
      maxTokens: 2048,
    })).json;
    let participants = (framing.selected_roles || []).map((id) => Board.byId(id)).filter(Boolean).slice(0, 6);
    if (participants.length < 3) participants = [Board.byId("cf_marked"), Board.byId("cf_kunde"), Board.byId("cf_vekst")].filter(Boolean);
    say("participants", participants.map((r) => r.title));

    /* 2) Isolerte, korte rollevurderinger (ingen rollespill – konkrete verdikter) */
    const verdicts = await pool(participants, 3, async (role) => {
      say("role_start", role.id);
      const { json } = await LLM.call({
        system: `Du er ${role.title}, fagrolle i Company Factorys vurdering (Fase 1). Mandat: ${role.mandate}\nDu arbeider UAVHENGIG og ser ikke de andres vurderinger. Lever en KORT, konkret vurdering fra ditt mandat – ingen generell prosa. Din viktigste jobb er å finne grunnen til at dette IKKE bør bygges, hvis den finnes. Sett probability_success (0–1) kun hvis du reelt kan estimere den, ellers null.`,
        user: `${ownerContext()}${caseText}`,
        schema: SCHEMAS.verdict,
        maxTokens: 2048,
      });
      say("role_done", role.id);
      return { roleId: role.id, roleTitle: role.title, weight: role.weight, ...json };
    });

    /* 3) Kritisk syntese + scoring + beslutning */
    say("synthesis", "Studioleder scorer og beslutter …");
    const synthesis = (await LLM.call({
      system: `Du er studioleder og syntese- og scoringsmodulen i Company Factory. Vei rollene etter oppgitt vekt, men fakta trumfer autoritet. Score idéen 0–10 på HVERT kriterium: ${CRITERIA.map(([c]) => c).join(", ")}. Ingen falsk presisjon – forklar per kriterium. List svakheter, forbedringer og alternative idéer basert på samme innsikt. Lag beste/sannsynlig/dårligste scenario. Konkluder med ÉN beslutning (${DECISIONS.join("|")}) og de mest kritiske antakelsene med billigste test, terskel, kostnad og horisont. Vær ærlig hvis riktig svar er stopp.`,
      user: `${ownerContext()}${caseText}\n\nROLLENES UAVHENGIGE VURDERINGER:\n${JSON.stringify(verdicts.map((v) => ({ rolle: v.roleTitle, vekt: v.weight, posisjon: v.position, sterkeste_motargument: v.strongest_argument_against, risikoer: v.top_risks, anbefaling: v.recommendation, sikkerhet: v.certainty, p: v.probability_success })), null, 2)}`,
      schema: SCHEMAS.synthesis,
      maxTokens: 8192,
    })).json;

    const total = this.totalScore(synthesis.scorecard);
    p.evaluation = { framing, verdicts, synthesis, totalScore: total, at: new Date().toISOString() };
    p.status = { stopp: "avsluttet", parker: "parkert", valider_mer: "validering", endre_konsept: "idé", prototype: "bygging", mvp: "bygging", lansering: "bygging" }[synthesis.decision] || "vurdert";
    p.phase = synthesis.decision === "valider_mer" ? 2 : p.phase;
    p.maturity = null;
    Projects.logAssumptions(p, (synthesis.assumptions_to_validate || []).map((a) => ({ claim: a.claim, type: "krever_ekstern_validering", confidence: "lav" })), "idévurdering");
    Projects.logDecision(p, {
      phase: 1, role: "studioleder",
      decision: `Idévurdering: ${synthesis.decision.toUpperCase()} (score ${total}/100)`,
      options: DECISIONS, rationale: synthesis.decision_rationale,
      risk: (synthesis.score_drivers_down || []).join("; "),
      revisit: synthesis.decision === "parker" ? "Revurderes ved ny informasjon" : "",
    });
    say("done", synthesis.decision);
    return Projects.save(p);
  },
};

/* ================= Experiments (Fase 2: markedsvalidering) ================= */
const Experiments = {
  /* Eksperimentkøen avledes direkte fra de kritiske antakelsene – ingen LLM-kostnad */
  createFrom(p) {
    if (p.experiments && p.experiments.length) return p;
    const src = (p.evaluation && p.evaluation.synthesis.assumptions_to_validate) || [];
    if (!src.length) throw new Error("Ingen kritiske antakelser å validere – kjør idévurdering først.");
    p.experiments = src.map((a, i) => ({
      id: "e" + Date.now().toString(36) + i,
      claim: a.claim, test: a.test, threshold: a.threshold,
      cost_estimate: a.cost_estimate, horizon: a.horizon,
      status: "planlagt", result: "", passed: null, at: null,
    }));
    Projects.logDecision(p, { phase: 2, role: "valideringsmodul", decision: `Eksperimentkø opprettet (${p.experiments.length} tester)`, rationale: "Avledet direkte fra de kritiske antakelsene – billigste test først, terskel definert før resultatet finnes." });
    return Projects.save(p);
  },
  /* Eieren registrerer faktisk resultat mot forhåndsdefinert terskel */
  registerResult(p, expId, result, passed) {
    const e = (p.experiments || []).find((x) => x.id === expId);
    if (!e) throw new Error("Fant ikke eksperimentet.");
    e.result = result; e.passed = !!passed; e.status = "fullført"; e.at = new Date().toISOString();
    Projects.logDecision(p, { phase: 2, role: "eier", byOwner: true, decision: `Eksperiment ${e.passed ? "BESTÅTT" : "IKKE BESTÅTT"}: ${e.claim}`, rationale: `Terskel: ${e.threshold}. Resultat: ${result}` });
    return Projects.save(p);
  },
  /* Valideringsporten: syntetiser resultatene → én beslutning */
  async review(p, onStatus) {
    const done = (p.experiments || []).filter((e) => e.status === "fullført");
    if (!done.length) throw new Error("Ingen fullførte eksperimenter å evaluere.");
    if (onStatus) onStatus("Evaluerer valideringsresultatene …");
    const { json } = await LLM.call({
      system: `Du er valideringsmodulen i Company Factory (Fase 2-porten). Vurder eksperimentresultatene nøkternt mot tersklene som ble satt FØR resultatene fantes. Allerede brukt tid og penger er IKKE et argument for å fortsette. Konkluder med én beslutning (${DECISIONS.join("|")}): bestått validering kan gi prototype/mvp; delvis bestått kan gi endre_konsept eller valider_mer (kun hvis en NY, billig test finnes); ikke bestått skal normalt gi stopp eller parker.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\nIDÉ: ${p.idea}\n\nBESLUTNING FRA IDÉVURDERING: ${p.evaluation.synthesis.decision} (score ${p.evaluation.totalScore}/100)\n\nEKSPERIMENTER OG RESULTATER:\n${JSON.stringify(p.experiments.map((e) => ({ antakelse: e.claim, test: e.test, terskel: e.threshold, status: e.status, resultat: e.result, bestått_iflg_eier: e.passed })), null, 2)}`,
      schema: SCHEMAS.validation,
      maxTokens: 4096,
    });
    p.validation = { ...json, at: new Date().toISOString() };
    p.status = { stopp: "avsluttet", parker: "parkert", valider_mer: "validering", endre_konsept: "idé", prototype: "bygging", mvp: "bygging", lansering: "bygging" }[json.decision] || p.status;
    if (["prototype", "mvp", "lansering"].includes(json.decision)) {
      const next = ((p.phasePlan && p.phasePlan.phases) || []).filter((f) => f.relevant && f.phase > 2).map((f) => f.phase).sort((a, b) => a - b)[0];
      p.phase = next ?? 3;
    }
    Projects.logDecision(p, { phase: 2, role: "valideringsmodul", decision: `Valideringsport: ${json.decision.toUpperCase()}`, options: DECISIONS, rationale: json.decision_rationale });
    return Projects.save(p);
  },
};

/* ================= Landing (falsk-dør-landingsside – fabrikken BYGGER den) ================= */
const Landing = {
  async run(p, opts = {}, onStatus) {
    if (!p.intake || !p.evaluation) throw new Error("Kjør inntak og idévurdering først.");
    if (onStatus) onStatus("Skriver copy og bygger landingssiden …");
    const { json } = await LLM.call({
      system: `Du er landingsside-modulen i Company Factory. Skriv komplett copy for en falsk-dør-landingsside som tester betalingsvilje FØR produktet bygges. Krav: copy er konkret, troverdig og basert på kundens problem – ingen tomme fraser («revolusjonerende», «sømløs», «kraftig», «fremtidens»). Prisen skal være tydelig (falsk dør uten pris måler ingenting). CTA er venteliste-påmelding. honest_disclaimer skal ærlig si at tjenesten er under utvikling og at påmelding er uforpliktende – vi lurer ikke folk til å tro de kjøper et ferdig produkt. Skriv for målgruppen, på norsk.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\n\nINNTAK:\n${JSON.stringify(p.intake, null, 2)}\n\nFRA STYRETS VURDERING:\n${JSON.stringify({ svakheter: p.evaluation.synthesis.weaknesses, forbedringer: p.evaluation.synthesis.improvements, antakelser_som_testes: p.evaluation.synthesis.assumptions_to_validate.map((a) => a.claim) }, null, 2)}`,
      schema: SCHEMAS.landing,
      maxTokens: 4096,
    });
    p.landing = { content: json, formEndpoint: opts.formEndpoint || "", html: this.renderHTML(json, { formEndpoint: opts.formEndpoint || "" }), at: new Date().toISOString() };
    Projects.logDecision(p, { phase: 2, role: "landingsside-modul", decision: "Falsk-dør-landingsside generert", rationale: `«${json.headline}» – pris synlig (${json.price_line}), venteliste som CTA.${opts.formEndpoint ? "" : " NB: uten skjema-endepunkt lagres påmeldinger kun i besøkerens nettleser – legg inn f.eks. et Formspree-endepunkt før reell trafikk."}` });
    return Projects.save(p);
  },
  /* Selvstendig, responsiv, deploybar HTML – ingen eksterne avhengigheter */
  renderHTML(c, opts = {}) {
    const e = escHtml;
    const form = opts.formEndpoint
      ? `<form class="wl" action="${e(opts.formEndpoint)}" method="POST"><input type="email" name="email" required placeholder="din@epost.no" aria-label="E-post"><button type="submit">${e(c.cta_text)}</button></form>`
      : `<form class="wl" id="wlForm"><input type="email" id="wlEmail" required placeholder="din@epost.no" aria-label="E-post"><button type="submit">${e(c.cta_text)}</button></form><p class="tiny" id="wlThanks" hidden>Takk! Du står på ventelisten.</p>`;
    return `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(c.seo_title)}</title>
<meta name="description" content="${e(c.seo_description)}">
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: c.seo_title, description: c.seo_description, offers: { "@type": "Offer", description: c.price_line, availability: "https://schema.org/PreOrder" } })}<\/script>
<style>
  :root { --ink:#15222e; --muted:#5a6b7a; --accent:#0b6e6e; --bg:#f7f9fa; --card:#ffffff; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); background:var(--bg); line-height:1.6; }
  main { max-width:720px; margin:0 auto; padding:24px 20px 60px; }
  .hero { text-align:center; padding:48px 0 32px; }
  h1 { font-size:clamp(28px,5vw,40px); line-height:1.2; margin-bottom:14px; }
  .sub { font-size:18px; color:var(--muted); max-width:560px; margin:0 auto 24px; }
  .wl { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
  .wl input { flex:1 1 220px; max-width:320px; padding:13px 14px; font-size:16px; border:1px solid #c8d2da; border-radius:10px; }
  .wl button { padding:13px 22px; font-size:16px; border:0; border-radius:10px; background:var(--accent); color:#fff; cursor:pointer; }
  .price { text-align:center; font-size:17px; margin:14px 0 4px; font-weight:600; }
  .tiny { text-align:center; font-size:13px; color:var(--muted); margin-top:8px; }
  h2 { font-size:20px; margin:40px 0 14px; }
  ul.pains { padding-left:22px; } ul.pains li { margin-bottom:8px; }
  .props { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; }
  .prop { background:var(--card); border:1px solid #e3e9ee; border-radius:12px; padding:16px; }
  .prop h3 { font-size:15px; margin-bottom:6px; }
  .prop p { font-size:14px; color:var(--muted); }
  details { background:var(--card); border:1px solid #e3e9ee; border-radius:10px; padding:12px 16px; margin-bottom:8px; }
  summary { cursor:pointer; font-weight:600; font-size:15px; }
  details p { margin-top:8px; font-size:14px; color:var(--muted); }
  footer { text-align:center; font-size:12px; color:var(--muted); padding:24px 20px; border-top:1px solid #e3e9ee; }
</style>
</head>
<body>
<main>
  <section class="hero">
    <h1>${e(c.headline)}</h1>
    <p class="sub">${e(c.subheadline)}</p>
    <p class="price">${e(c.price_line)}</p>
    ${form}
    <p class="tiny">${e(c.offer)}</p>
  </section>
  <section><h2>Kjenner du deg igjen?</h2><ul class="pains">${(c.pain_points || []).map((x) => `<li>${e(x)}</li>`).join("")}</ul></section>
  <section><h2>Det du får</h2><div class="props">${(c.value_props || []).map((v) => `<div class="prop"><h3>${e(v.title)}</h3><p>${e(v.text)}</p></div>`).join("")}</div></section>
  <section><h2>Spørsmål og svar</h2>${(c.faq || []).map((f) => `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join("")}</section>
</main>
<footer>${e(c.honest_disclaimer)}</footer>
<script>
(function () {
  try { localStorage.setItem("cf_lp_views", (parseInt(localStorage.getItem("cf_lp_views") || "0", 10) + 1) + ""); } catch (_) {}
  var f = document.getElementById("wlForm");
  if (f) f.addEventListener("submit", function (ev) {
    ev.preventDefault();
    try {
      var list = JSON.parse(localStorage.getItem("cf_waitlist") || "[]");
      list.push({ email: document.getElementById("wlEmail").value, at: new Date().toISOString() });
      localStorage.setItem("cf_waitlist", JSON.stringify(list));
    } catch (_) {}
    f.hidden = true;
    document.getElementById("wlThanks").hidden = false;
  });
})();
<\/script>
</body>
</html>`;
  },
};

/* ================= SiteGen (Fase 6+8: fabrikken BYGGER nettstedet) ================= */
const SiteGen = {
  async run(p, onStatus) {
    if (!p.intake || !p.evaluation) throw new Error("Kjør inntak og idévurdering først.");
    if (onStatus) onStatus("Bygger nettstedet: merkevare, copy og sider …");
    const plans = p.bizmodel ? p.bizmodel.model.plans : null;
    const { json } = await LLM.call({
      system: `Du er nettsted-modulen i Company Factory (Fase 6+8). Lever merkevare-tokens og komplett sideinnhold for produktets nettsted. Krav: copy er konkret, troverdig og skrevet for målgruppen – ingen tomme fraser («revolusjonerende», «sømløs», «kraftig», «fremtidens»). Farger som hex (god kontrast: ink mot bg). terms_outline og privacy_outline er UTKAST til punkter – de merkes automatisk som «må kvalitetssikres av advokat». Tone tilpasses målgruppen, ikke generisk SaaS.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\n\nINNTAK:\n${JSON.stringify(p.intake, null, 2)}\n\nMVP-BRIEF:\n${JSON.stringify(p.brief || "(ikke laget – bruk inntaket)", null, 2)}${plans ? `\n\nPRISPLANER (bruk disse eksakt):\n${JSON.stringify(plans, null, 2)}` : ""}`,
      schema: SCHEMAS.site,
      maxTokens: 8192,
    });
    const files = this.renderSite(json, { plans, trial: p.bizmodel ? p.bizmodel.model.trial : "", freeTier: p.bizmodel ? p.bizmodel.model.free_tier : "" });
    p.site = { content: json, files, at: new Date().toISOString() };
    p.maturity = "prototype";
    Projects.logDecision(p, { phase: 8, role: "nettsted-modul", decision: `Nettsted generert (${Object.keys(files).length} filer)`, rationale: `«${json.hero_headline}» – komplett statisk nettsted klart for deploy. Betalingsknapper er plassholdere til Stripe Payment Links legges inn (eier-port: betaling). Juridiske sider er utkast som krever advokat.` });
    return Projects.save(p);
  },

  /* Deterministisk rendering: delt designsystem fra brand-tokens, ingen eksterne avhengigheter */
  renderSite(c, opts = {}) {
    const e = escHtml;
    const b = c.brand;
    const css = `
  :root { --primary:${e(b.color_primary)}; --ink:${e(b.color_ink)}; --bg:${e(b.color_bg)}; --accent:${e(b.color_accent)}; --muted:#5f6f7d; --card:#ffffff; --line:#e2e8ee; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:var(--ink); background:var(--bg); line-height:1.65; }
  header { border-bottom:1px solid var(--line); background:var(--card); }
  .nav { max-width:960px; margin:0 auto; padding:14px 20px; display:flex; align-items:center; gap:18px; flex-wrap:wrap; }
  .nav .logo { font-weight:700; font-size:18px; color:var(--primary); text-decoration:none; margin-right:auto; }
  .nav a { color:var(--ink); text-decoration:none; font-size:14px; }
  .nav a:hover { color:var(--primary); }
  main { max-width:960px; margin:0 auto; padding:24px 20px 64px; }
  .hero { text-align:center; padding:56px 0 40px; }
  h1 { font-size:clamp(28px,5vw,42px); line-height:1.15; margin-bottom:14px; }
  .sub { font-size:18px; color:var(--muted); max-width:600px; margin:0 auto 26px; }
  .btn { display:inline-block; background:var(--primary); color:#fff; padding:14px 26px; border-radius:10px; text-decoration:none; font-size:16px; font-weight:600; border:0; cursor:pointer; }
  .btn.alt { background:var(--card); color:var(--primary); border:2px solid var(--primary); }
  h2 { font-size:24px; margin:44px 0 16px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
  .card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:18px; }
  .card h3 { font-size:16px; margin-bottom:8px; }
  .card p { font-size:14px; color:var(--muted); }
  ol.steps { padding-left:24px; } ol.steps li { margin-bottom:10px; }
  .plans { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; align-items:stretch; }
  .plan { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:22px; display:flex; flex-direction:column; }
  .plan .price { font-size:30px; font-weight:700; color:var(--primary); margin:10px 0 2px; }
  .plan .per { font-size:13px; color:var(--muted); margin-bottom:12px; }
  .plan ul { padding-left:20px; font-size:14px; color:var(--muted); flex:1; margin-bottom:14px; }
  details { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:12px 16px; margin-bottom:8px; }
  summary { cursor:pointer; font-weight:600; font-size:15px; }
  details p { margin-top:8px; font-size:14px; color:var(--muted); }
  .notice { background:#fff7e0; border:1px solid #eedc9a; border-radius:10px; padding:14px 16px; font-size:13px; margin:18px 0; }
  footer { border-top:1px solid var(--line); text-align:center; font-size:13px; color:var(--muted); padding:26px 20px; }
  footer a { color:var(--muted); }`;
    const nav = `<header><div class="nav"><a class="logo" href="index.html">${e(b.name)}</a><a href="pris.html">Pris</a><a href="faq.html">FAQ</a><a href="om.html">Om oss</a></div></header>`;
    const footer = `<footer>© ${e(b.name)} · <a href="vilkar.html">Vilkår</a> · <a href="personvern.html">Personvern</a><br>${e(b.slogan)}</footer>`;
    const shell = (title, desc, body) => `<!DOCTYPE html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<style>${css}</style>
</head>
<body>
${nav}
<main>
${body}
</main>
${footer}
</body>
</html>`;

    const legalNotice = `<div class="notice"><b>Merk:</b> Dette dokumentet er et automatisk generert utkast og er IKKE juridisk kvalitetssikret. Det må gjennomgås og godkjennes av advokat eller annen autorisert fagperson før publisering og bruk.</div>`;
    const plans = opts.plans || [{ name: "Standard", price_month: 0, price_year: 0, target_share: 1, includes: ["Se pris ved lansering"] }];

    const index = shell(c.seo_title, c.seo_description, `
<section class="hero">
  <h1>${e(c.hero_headline)}</h1>
  <p class="sub">${e(c.hero_sub)}</p>
  <a class="btn" href="pris.html">${e(c.cta_text)}</a>
</section>
<section><h2>Det du får</h2><div class="grid">${c.features.map((f) => `<div class="card"><h3>${e(f.title)}</h3><p>${e(f.text)}</p></div>`).join("")}</div></section>
<section><h2>Slik fungerer det</h2><ol class="steps">${c.how_it_works.map((s) => `<li>${e(s)}</li>`).join("")}</ol></section>
<section class="hero"><a class="btn" href="pris.html">${e(c.cta_text)}</a></section>`);

    const pris = shell(`Pris – ${b.name}`, c.seo_description, `
<h1>Pris</h1>
${opts.trial ? `<p class="sub" style="margin:8px 0 20px; text-align:left">${e(opts.trial)}${opts.freeTier ? " · " + e(opts.freeTier) : ""}</p>` : ""}
<div class="plans">${plans.map((pl) => `<div class="plan"><h3>${e(pl.name)}</h3><div class="price">${Math.round(pl.price_month)} kr</div><div class="per">per måned · ${Math.round(pl.price_year)} kr/år</div><ul>${(pl.includes || []).map((i) => `<li>${e(i)}</li>`).join("")}</ul><button class="btn" data-stripe-payment-link="ERSTATT-MED-STRIPE-PAYMENT-LINK" onclick="alert('Betaling aktiveres ved lansering.')">Velg ${e(pl.name)}</button></div>`).join("")}</div>
<div class="notice"><b>Til eieren (fjernes før lansering):</b> knappene over er plassholdere. Opprett produkter i Stripe og lim inn Payment Links i data-stripe-payment-link-attributtene, eller koble til abonnementsflyten. Betaling er en eier-port i Company Factory.</div>
<h2>Spørsmål om pris</h2>${c.pricing_faq.map((f) => `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join("")}`);

    const faq = shell(`FAQ – ${b.name}`, c.seo_description, `<h1>Ofte stilte spørsmål</h1>${c.faq.map((f) => `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join("")}`);

    const om = shell(`Om oss – ${b.name}`, c.seo_description, `<h1>Om ${e(b.name)}</h1><p style="max-width:640px">${e(c.about_story)}</p><h2>Det vi styrer etter</h2><div class="grid">${c.about_values.map((v) => `<div class="card"><p>${e(v)}</p></div>`).join("")}</div>`);

    const vilkar = shell(`Vilkår – ${b.name}`, "Avtalevilkår", `<h1>Avtalevilkår</h1>${legalNotice}<ol class="steps">${c.terms_outline.map((t) => `<li>${e(t)}</li>`).join("")}</ol>`);

    const personvern = shell(`Personvern – ${b.name}`, "Personvernerklæring", `<h1>Personvernerklæring</h1>${legalNotice}<ol class="steps">${c.privacy_outline.map((t) => `<li>${e(t)}</li>`).join("")}</ol>`);

    const readme = `# ${b.name} – generert av Company Factory

Statisk nettsted uten eksterne avhengigheter. Alle sider deler designsystemet
(merkevare-tokens i CSS-variabler øverst i hver fil).

## Deploy
- GitHub Pages: legg filene i et repo → Settings → Pages → deploy fra branch.
- Netlify/Vercel/Cloudflare Pages: dra og slipp mappen.

## Før lansering (eier-porter i Company Factory)
1. **Betaling:** opprett produkter i Stripe og lim inn Payment Links i
   \`data-stripe-payment-link\`-attributtene i pris.html. Fjern eier-notisen.
2. **Juridisk:** vilkar.html og personvern.html er UTKAST – må kvalitetssikres
   av advokat/fagperson før publisering.
3. **Domene og e-post:** kjøp/pek domene, sett opp e-post (eier-port).
4. **Analyse:** legg inn valgfritt verktøy (f.eks. Plausible/Umami) – bevisst
   ikke inkludert for å holde siden fri for tredjeparter som standard.

Generert ${new Date().toISOString().slice(0, 10)}. Copy og struktur kan redigeres fritt.
`;

    return {
      "index.html": index,
      "pris.html": pris,
      "faq.html": faq,
      "om.html": om,
      "vilkar.html": vilkar,
      "personvern.html": personvern,
      "README-deploy.md": readme,
    };
  },

  zip(p) {
    if (!p.site) throw new Error("Nettstedet er ikke generert.");
    return makeZip(p.site.files);
  },
};

/* ================= Retro (seksjon 12: selvevaluering per prosjekt) ================= */
const Retro = {
  async run(p, onStatus) {
    if (onStatus) onStatus("Kjører retro på prosjektet …");
    const { json } = await LLM.call({
      system: `Du er retro-modulen i Company Factory. Evaluer prosjektgjennomføringen nøkternt: hva fungerte, hva feilet, hvilke antakelser var gale, hvilke prosessforbedringer bør gjøres, hva kan generaliseres til gjenbruksbiblioteket – og hva bør IKKE gjenbrukes. Formuler ÉN kort, generaliserbar lærdom («lesson») som fabrikken skal huske i alle fremtidige prosjekter. Ikke foreslå forbedringer som bare gjør systemet større uten målbar verdi.`,
      user: `${ownerContext()}PROSJEKT: ${p.name} [status: ${p.status}, fase ${p.phase}]\nIDÉ: ${p.idea}\n\nVURDERING: ${p.evaluation ? `${p.evaluation.synthesis.decision} (score ${p.evaluation.totalScore}/100) – ${p.evaluation.synthesis.decision_rationale}` : "(ikke kjørt)"}\n\nEKSPERIMENTER:\n${JSON.stringify((p.experiments || []).map((x) => ({ antakelse: x.claim, status: x.status, bestått: x.passed, resultat: x.result })), null, 2)}\n\nVALIDERINGSPORT: ${p.validation ? `${p.validation.decision} – ${p.validation.decision_rationale}` : "(ikke kjørt)"}\n\nANTAKELSER (${p.assumptions.length}):\n${p.assumptions.slice(0, 15).map((a) => `- [${a.type}] ${a.claim}`).join("\n")}\n\nBESLUTNINGER (${p.decisions.length}):\n${p.decisions.slice(0, 15).map((d) => `- ${d.decision}`).join("\n")}`,
      schema: SCHEMAS.retro,
      maxTokens: 4096,
    });
    p.retro = { ...json, at: new Date().toISOString() };
    Lessons.add(json.lesson, p.name);
    Projects.logDecision(p, { role: "retro-modul", decision: "Retro gjennomført", rationale: "Lærdom: " + json.lesson });
    return Projects.save(p);
  },
};

/* ================= Finance (deterministisk økonomimodell – ingen LLM) ================= */
const Finance = {
  avgPrice(plans) {
    let sum = 0, weight = 0;
    for (const pl of plans || []) { sum += (pl.price_month || 0) * (pl.target_share || 0); weight += pl.target_share || 0; }
    return weight ? sum / weight : (plans && plans[0] ? plans[0].price_month : 0);
  },
  /* 24-måneders fremskrivning fra antakelsene. All matematikk i kode – modellen gjetter aldri tall den kan regne ut. */
  project(a, months = 24) {
    let customers = 0, visitors = a.visitors_m1, cumulative = 0, breakEvenMonth = null;
    const rows = [];
    for (let m = 1; m <= months; m++) {
      const newCustomers = visitors * a.signup_rate * a.paid_conversion;
      customers = customers * (1 - a.churn_monthly) + newCustomers;
      const mrr = customers * a.price_avg;
      const costs = a.fixed_costs_monthly + customers * a.variable_cost_per_user + newCustomers * a.cac;
      const profit = mrr - costs;
      cumulative += profit;
      if (breakEvenMonth === null && profit > 0) breakEvenMonth = m;
      rows.push({ m, visitors: Math.round(visitors), newCustomers: Math.round(newCustomers * 10) / 10, customers: Math.round(customers), mrr: Math.round(mrr), profit: Math.round(profit), cumulative: Math.round(cumulative) });
      visitors *= 1 + a.visitor_growth_pct_m;
    }
    const contribution = a.price_avg - a.variable_cost_per_user;
    const ltv = a.churn_monthly > 0 ? contribution / a.churn_monthly : null;
    const last = rows[rows.length - 1];
    return {
      rows, breakEvenMonth,
      customers24: last.customers, mrr24: last.mrr, arr24: last.mrr * 12, cumulative24: last.cumulative,
      ltv: ltv === null ? null : Math.round(ltv),
      ltvCac: ltv !== null && a.cac > 0 ? Math.round((ltv / a.cac) * 10) / 10 : null,
      capitalNeed: Math.round(Math.min(0, ...rows.map((r) => r.cumulative))) * -1,
    };
  },
  /* Konservativ / sannsynlig / offensiv – faste multiplikatorer, tydelig dokumentert */
  scenarios(a) {
    const mk = (mult) => this.project({
      ...a,
      signup_rate: a.signup_rate * mult.conv,
      paid_conversion: a.paid_conversion * mult.conv,
      churn_monthly: Math.min(0.9, a.churn_monthly * mult.churn),
      cac: a.cac * mult.cac,
    });
    return {
      konservativ: mk({ conv: 0.6, churn: 1.5, cac: 1.4 }),
      sannsynlig: mk({ conv: 1, churn: 1, cac: 1 }),
      offensiv: mk({ conv: 1.4, churn: 0.7, cac: 0.8 }),
    };
  },
};

/* ================= BizModel (Fase 3: forretningsmodell) ================= */
const BizModel = {
  async run(p, onStatus) {
    if (!p.intake || !p.evaluation) throw new Error("Kjør inntak og idévurdering først.");
    if (onStatus) onStatus("Fase 3: bygger forretningsmodell …");
    const { json } = await LLM.call({
      system: `Du er forretningsmodell-modulen i Company Factory (Fase 3). Definer en konkret modell: verdi, ICP, kjøper/bruker, inntektsmodell, 1–3 abonnementsplaner med månedspris/årspris og forventet kundefordeling (target_share, summerer til ~1), gratisnivå/prøveperiode. Sett NØKTERNE talleantakelser (trafikk måned 1, månedlig vekst, registreringsrate, betalt konvertering, månedlig churn, CAC, faste kostnader, variabel kostnad per bruker) – all videre matematikk gjøres av kode, ikke av deg. Hver talleantakelse skal begrunnes kort i assumption_notes. Ikke pynt på tallene: modellen skal kunne avkreftes.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\n\nINNTAK:\n${JSON.stringify(p.intake, null, 2)}\n\nFRA VURDERINGEN:\n${JSON.stringify({ beslutning: p.evaluation.synthesis.decision, score: p.evaluation.totalScore, svakheter: p.evaluation.synthesis.weaknesses }, null, 2)}${p.validation ? `\n\nVALIDERINGSRESULTATER:\n${JSON.stringify(p.validation.per_experiment, null, 2)}` : ""}`,
      schema: SCHEMAS.bizmodel,
      maxTokens: 4096,
    });
    p.bizmodel = { model: json, at: new Date().toISOString() };
    this.recompute(p);
    Projects.logAssumptions(p, json.assumption_notes.map((n) => ({ claim: n, type: "antakelse", confidence: "lav" })), "forretningsmodell");
    Projects.logDecision(p, { phase: 3, role: "forretningsmodell-modul", decision: "Forretningsmodell etablert", rationale: `${json.revenue_model}. Snittpris ${Math.round(Finance.avgPrice(json.plans))} kr/mnd. Oppdateres med faktiske data etter lansering.` });
    return Projects.save(p);
  },
  /* Rekalkuler lokalt (gratis) – f.eks. etter at eieren justerer antakelser */
  recompute(p, patch) {
    const m = p.bizmodel.model;
    if (patch) m.assumptions = { ...m.assumptions, ...patch };
    const a = { ...m.assumptions, price_avg: Finance.avgPrice(m.plans) };
    p.bizmodel.computed = { scenarios: Finance.scenarios(a), price_avg: Math.round(a.price_avg), at: new Date().toISOString() };
    return Projects.save(p);
  },
};

/* ================= Planner (tilpasset faseplan) ================= */
const Planner = {
  async run(p, onStatus) {
    if (!p.evaluation) throw new Error("Kjør idévurdering (Fase 1) først.");
    if (onStatus) onStatus("Lager tilpasset faseplan …");
    const { json } = await LLM.call({
      system: `Du er planmodulen i Company Factory. Tilpass standardpipelinen til DETTE prosjektet: marker hvilke faser som er relevante (små idéer får små planer – dropp faser som ikke trengs), definer omfang, leveranser, første konkrete handlinger, stoppkriterier, ansvarlig rolle og risiko per relevant fase. Valider billig før tung bygging: menneskeheten har allerede laget nok ubrukte dashboards.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\nBESLUTNING FRA IDÉVURDERING: ${p.evaluation.synthesis.decision} (score ${p.evaluation.totalScore}/100)\nBEGRUNNELSE: ${p.evaluation.synthesis.decision_rationale}\n\nINNTAK:\n${JSON.stringify(p.intake, null, 2)}\n\nKRITISKE ANTAKELSER Å VALIDERE:\n${JSON.stringify(p.evaluation.synthesis.assumptions_to_validate, null, 2)}\n\nSTANDARDFASER:\n${PHASES.map((f) => `${f.n}: ${f.title} (port: ${f.gate})`).join("\n")}`,
      schema: SCHEMAS.plan,
      maxTokens: 8192,
    });
    p.phasePlan = { ...json, at: new Date().toISOString() };
    Projects.logDecision(p, { decision: "Faseplan opprettet", rationale: json.sequencing_notes, role: "planmodul" });
    return Projects.save(p);
  },
};

/* ================= Brief (MVP-brief) ================= */
const Brief = {
  async run(p, onStatus) {
    if (!p.evaluation) throw new Error("Kjør idévurdering (Fase 1) først.");
    if (onStatus) onStatus("Skriver MVP-brief …");
    const { json } = await LLM.call({
      system: `Du er MVP-brief-modulen i Company Factory. Skriv en konkret, byggbar brief. MVP = den minste løsningen som skaper reell verdi og tester betalingsvilje – ikke en halvferdig versjon av et enormt produkt. Vær eksplisitt om hva som IKKE skal bygges. Bruk tydelig prioritering, ingen funksjonsinflasjon, ingen tomme fraser.`,
      user: `${ownerContext()}PROSJEKT: ${p.name}\n\nINNTAK:\n${JSON.stringify(p.intake, null, 2)}\n\nSYNTESE FRA STYRET:\n${JSON.stringify({ beslutning: p.evaluation.synthesis.decision, begrunnelse: p.evaluation.synthesis.decision_rationale, svakheter: p.evaluation.synthesis.weaknesses, forbedringer: p.evaluation.synthesis.improvements }, null, 2)}`,
      schema: SCHEMAS.brief,
      maxTokens: 8192,
    });
    p.brief = { ...json, at: new Date().toISOString() };
    p.maturity = "MVP-brief klar";
    Projects.logDecision(p, { decision: "MVP-brief produsert: " + json.working_name, rationale: json.product_vision, role: "brief-modul" });
    return Projects.save(p);
  },
};

/* ================= Pipeline-kjøring (Fase 0 → 1 → plan/brief) ================= */
const Pipeline = {
  PHASES, OWNER_GATE_ACTIONS, MATURITY, CRITERIA, DECISIONS,
  async runFrom(idea, name, onProgress) {
    const p = Projects.create(name, idea);
    return this.resume(p.id, onProgress);
  },
  async resume(projectId, onProgress) {
    const say = (step, detail) => onProgress && onProgress(step, detail);
    let p = Projects.get(projectId);
    if (!p) throw new Error("Fant ikke prosjektet.");
    if (!p.intake) p = await Intake.run(p, (s) => say("intake", s));
    if (!p.evaluation) p = await Evaluation.run(p, onProgress);
    /* Valideringsporten (Fase 2) overstyrer idévurderingens beslutning når den er kjørt */
    const d = (p.validation && p.validation.decision) || p.evaluation.synthesis.decision;
    const buildable = ["prototype", "mvp", "lansering"].includes(d);
    if ((buildable || d === "valider_mer") && !p.phasePlan) p = await Planner.run(p, (s) => say("plan", s));
    if (buildable && !p.brief) p = await Brief.run(p, (s) => say("brief", s));
    /* Byggekjeden (F3): besluttet bygging → forretningsmodell → nettsted */
    if (buildable && !p.bizmodel) p = await BizModel.run(p, (s) => say("bizmodel", s));
    if (buildable && !p.site) p = await SiteGen.run(p, (s) => say("site", s));
    say("finished", d);
    return p;
  },
};

/* ================= Demo (eksempelprosjekt – ISOLERT TESTDATA, ingen API-kall) ================= */
const Demo = {
  load() {
    const existing = Projects.list().find((x) => x.test && x.name === "BoligPuls (TEST)");
    if (existing) return existing;
    const p = Projects.create("BoligPuls (TEST)", "Lag en abonnementstjeneste som hjelper boligeiere med vedlikehold av bolig.", { test: true });
    p.intake = {
      summary: "Abonnement som gir boligeiere en personlig vedlikeholdsplan med sesongvarsler og hjelp til å bestille håndverkere.",
      problem: "Boligeiere vet ikke hvilket vedlikehold boligen trenger når, og småfeil blir dyre skader.",
      target_group: "Eiere av enebolig/rekkehus 30–65 år, primært førstegangs eneboligeiere.",
      solution: "Digital vedlikeholdsplan per bolig + sesongbaserte påminnelser + sjekklister + prisantydninger.",
      willingness_to_pay: "Ukjent. Hypotese: 49–99 kr/mnd. Krever validering.",
      market: "≈1,9 mill. eneboliger/småhus i Norge (SSB) – må verifiseres.",
      channel: "SEO på vedlikeholdssøk, boligkjøpsøyeblikket (bank/megler-partnere), Facebook-grupper.",
      subscription_potential: "Høyt: vedlikehold er tilbakevendende per sesong; lav marginalkostnad per kunde.",
      assumptions: [
        { claim: "Boligeiere opplever vedlikeholdsplanlegging som et reelt problem", type: "antakelse", confidence: "middels" },
        { claim: "1,9 mill. småhus i Norge", type: "krever_ekstern_validering", confidence: "middels" },
        { claim: "Betalingsvilje 49–99 kr/mnd", type: "krever_ekstern_validering", confidence: "lav" },
      ],
      unknowns: ["Churn etter første sesong", "Om forsikringsselskap allerede tilbyr dette gratis"],
      decision_changing_questions: ["Finnes distribusjonsfortrinn (f.eks. partneravtale) som senker CAC?"],
    };
    p.phase = 1;
    Projects.logAssumptions(p, p.intake.assumptions, "inntak");
    Projects.logDecision(p, { phase: 0, decision: "Idé strukturert – godkjent for analyse", rationale: p.intake.summary, role: "inntaksmodul" });
    const scorecard = [
      { criterion: "problemsmerte", score: 6, reasoning: "Reell, men lav akutt smerte – utsettes ofte." },
      { criterion: "frekvens", score: 7, reasoning: "Sesongbasert, 4+ ganger årlig." },
      { criterion: "betalingsvilje", score: 4, reasoning: "Uvalidert; gratisalternativer (sjekklister) finnes." },
      { criterion: "markedsstørrelse", score: 7, reasoning: "Stort volum i Norge, mulig Norden." },
      { criterion: "differensiering", score: 5, reasoning: "Forsikring/banker kan kopiere som gratis tillegg." },
      { criterion: "gjennomførbarhet", score: 8, reasoning: "Teknisk enkelt: plan + varsler + innhold." },
      { criterion: "tid_til_marked", score: 8, reasoning: "MVP på uker, ikke måneder." },
      { criterion: "gjentakende_inntekt", score: 7, reasoning: "Naturlig abonnement, men churn-risiko etter år 1." },
      { criterion: "automatiseringsgrad", score: 8, reasoning: "Innhold og varsler kan automatiseres nesten helt." },
      { criterion: "forsvarbarhet", score: 3, reasoning: "Lav – innhold kopierbart; ev. datamoat over tid." },
    ];
    p.evaluation = {
      framing: { case_summary: "Abonnement på boligvedlikehold", selected_roles: ["cf_marked", "cf_kunde", "cf_vekst"], rationale: "Marked, kundesmerte og distribusjon er de kritiske usikkerhetene." },
      verdicts: [
        { roleId: "cf_marked", roleTitle: "Markedsanalytiker", weight: 1, position: "Stort volum, svak forsvarbarhet.", strongest_argument_against: "Forsikringsselskap kan gi dette gratis.", top_risks: ["Kopiering"], recommendation: "Valider betalingsvilje før bygging.", certainty: "middels", probability_success: 0.35 },
        { roleId: "cf_kunde", roleTitle: "Kundeinnsiktsansvarlig", weight: 1, position: "Problemet er reelt, men lavfrekvent smerte.", strongest_argument_against: "Folk utsetter vedlikehold – betaler de for påminnelser?", top_risks: ["Churn etter sesong 1"], recommendation: "Falsk-dør-test + 10 intervjuer.", certainty: "middels", probability_success: 0.4 },
        { roleId: "cf_vekst", roleTitle: "Growth/Performance", weight: 1, position: "SEO-potensialet er sterkt og billig.", strongest_argument_against: "CAC via betalt trafikk trolig > LTV ved 79 kr/mnd.", top_risks: ["CAC/LTV"], recommendation: "Test organisk kanal først.", certainty: "middels", probability_success: 0.45 },
      ],
      synthesis: {
        summary: "Gjennomførbar idé med reelt problem, men uvalidert betalingsvilje og svak forsvarbarhet. Billig å teste – dyr å anta.",
        scorecard,
        score_drivers_up: ["Rask tid til marked", "Høy automatiseringsgrad", "Naturlig abonnementsmodell"],
        score_drivers_down: ["Uvalidert betalingsvilje", "Lav forsvarbarhet", "Churn-risiko etter første sesong"],
        weaknesses: ["Gratisalternativer finnes", "Kopierbart av forsikring/bank"],
        improvements: ["Partnerskap med forsikring som distribusjon", "Årsabonnement med boligrapport som ankerleveranse"],
        alternative_ideas: ["B2B: white-label vedlikeholdsplan for forsikringsselskap", "Nisjeversjon for hytteeiere (høyere betalingsvilje, mindre konkurranse)"],
        scenarios: [
          { name: "Beste", probability: 0.15, outcome: "5 000 betalende via SEO+partner", value_estimate: "4–5 MNOK ARR" },
          { name: "Sannsynlig", probability: 0.55, outcome: "Validering viser betalingsvilje kun hos smalt segment", value_estimate: "pivot til nisje/B2B" },
          { name: "Dårligste", probability: 0.3, outcome: "Falsk dør < 2 % konvertering", value_estimate: "stopp, tap < 5 000 kr" },
        ],
        decision: "valider_mer",
        decision_rationale: "Kritiske antakelser (betalingsvilje, churn) kan avkreftes for under 5 000 kr på 3 uker. Bygging før det er uansvarlig kapitalbruk.",
        certainty: "middels",
        assumptions_to_validate: [
          { claim: "≥3 % av besøkende legger inn kort/venteliste ved 79 kr/mnd", test: "Falsk-dør-landingsside + 300 kr/dag i annonser", threshold: "≥3 % konvertering til venteliste med pris synlig", cost_estimate: "≈4 500 kr", horizon: "3 uker" },
          { claim: "Problemet er topp-3-bekymring for nye eneboligeiere", test: "10 intervjuer med eiere < 2 år", threshold: "≥6 av 10 nevner det uoppfordret", cost_estimate: "0 kr", horizon: "2 uker" },
        ],
      },
      totalScore: 0, at: new Date().toISOString(),
    };
    p.evaluation.totalScore = Evaluation.totalScore(scorecard);
    p.status = "validering";
    p.phase = 2;
    Projects.logAssumptions(p, p.evaluation.synthesis.assumptions_to_validate.map((a) => ({ claim: a.claim, type: "krever_ekstern_validering", confidence: "lav" })), "idévurdering");
    Projects.logDecision(p, { phase: 1, role: "studioleder", decision: `Idévurdering: VALIDER_MER (score ${p.evaluation.totalScore}/100)`, options: DECISIONS, rationale: p.evaluation.synthesis.decision_rationale, risk: p.evaluation.synthesis.score_drivers_down.join("; ") });
    p.phasePlan = {
      phases: [
        { phase: 2, relevant: true, scope: "Falsk dør + intervjuer, se antakelseslogg", key_deliverables: ["Landingsside", "Intervjunotater", "Beslutningsnotat"], first_actions: ["Sett opp landingsside med pris", "Rekrutter 10 eiere"], stop_criteria: "< 2 % konvertering OG < 4/10 nevner problemet", owner_role: "Kundeinnsiktsansvarlig", risks: ["Skjevt utvalg i intervjuer"] },
        { phase: 3, relevant: true, scope: "Kun hvis validering består: enkel enhetsøkonomi", key_deliverables: ["Prismodell", "CAC/LTV-estimat"], first_actions: ["Modellér 49/79/149 kr/mnd"], stop_criteria: "LTV/CAC < 3 i alle scenarier", owner_role: "CFO/Investment", risks: ["Optimistisk churn-antakelse"] },
        { phase: 5, relevant: true, scope: "MVP-omfang etter validering", key_deliverables: ["MVP-brief v2"], first_actions: ["Revider brief med valideringsdata"], stop_criteria: "—", owner_role: "Produkt", risks: [] },
      ],
      sequencing_notes: "Alt etter fase 2 er betinget av bestått validering. Merkevare/bygging bevisst utsatt.",
      at: new Date().toISOString(),
    };
    Projects.logDecision(p, { decision: "Faseplan opprettet", rationale: p.phasePlan.sequencing_notes, role: "planmodul" });
    return Projects.save(p);
  },
};

/* ================= SelfReview ================= */
const SelfReview = {
  async run() {
    let arch = "";
    try { arch = await (await fetch("ARCHITECTURE.md")).text(); } catch (_) {}
    const stats = {
      prosjekter: Projects.list().length,
      per_status: Projects.list().reduce((m, p) => ((m[p.status] = (m[p.status] || 0) + 1), m), {}),
      beslutninger: Projects.list().reduce((n, p) => n + p.decisions.length, 0),
    };
    const { text } = await LLM.call({
      system: `Du er Company Factorys selvevalueringsmodul. Evaluer fabrikken ærlig etter faktisk bruk: hva fungerte, hva var unødvendig, hvilke antakelser var feil, hva bør generaliseres til gjenbruksbiblioteket, hva bør IKKE gjenbrukes, og hvilke forbedringer gir målbar verdi (unngå selvforbedring som bare gjør systemet større). Prioriter en kort migreringsplan.`,
      user: `GJELDENDE ARKITEKTUR:\n${arch || "(utilgjengelig)"}\n\nBRUKSSTATISTIKK: ${JSON.stringify(stats)}\n\nPROSJEKTER:\n${Projects.list().map((p) => `- ${p.name} [${p.status}, fase ${p.phase}${p.test ? ", TEST" : ""}] score ${p.evaluation?.totalScore ?? "–"}`).join("\n") || "(ingen)"}`,
      maxTokens: 8192,
    });
    return text;
  },
};

/* Eksponer modulene (også for tester) */
window.CF = { Store, LLM, Board, Pipeline, Projects, Intake, Evaluation, Experiments, Landing, BizModel, Finance, SiteGen, Retro, Lessons, Planner, Brief, Demo, SelfReview, SCHEMAS, PHASES, OWNER_GATE_ACTIONS, FACTORY_ROLES, CRITERIA, pool, makeZip, crc32 };
