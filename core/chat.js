/* SAGA – chat-motor for assistent-dokken og Assistent-flaten i OS-skallet.
 * Slank klient over Claude API med tool-use mot fabrikken, styret og broen.
 * (Fullskjerm-PWA-en i assistant/ har egen, rikere klient med stemme/PWA –
 * bevisst duplikat inntil konsolidering, se docs/improvements.md.)
 * Ingen DOM her – os/chat.js eier visningen. Eksponerer window.SAGACHAT.
 */
(() => {
"use strict";

const KEY = () => localStorage.getItem("saga_api_key") || localStorage.getItem("jarvis_api_key") || "";
const MODEL = () => localStorage.getItem("saga_model") || localStorage.getItem("jarvis_model") || "claude-sonnet-5";

const History = {
  list() { try { return JSON.parse(localStorage.getItem("saga_chat")) || []; } catch { return []; } },
  save(l) { localStorage.setItem("saga_chat", JSON.stringify(l.slice(-60))); },
  add(role, text) { const l = this.list(); l.push({ role, text, at: new Date().toISOString() }); this.save(l); },
  clear() { localStorage.removeItem("saga_chat"); },
};

const PERSONA = `Du er SAGA – eierens personlige assistent i SAGA OS (selskapsfabrikk + digitalt styre + deg).
Regler: Vær presis og ærlig. Gjett aldri – si «vet ikke» eller bruk verktøy/websøk. Merk tall som FAKTISK
(fra verktøydata) eller ESTIMAT. Ikke lov handlinger du ikke kan utføre. Verktøyene endrer eierens data –
bruk dem målrettet, aldri i løkke uten grunn. Svar på norsk, kort og konkret.`;

const TOOLS = [
  { name: "saga_factory_status", description: "Porteføljestatus fra fabrikken: prosjekter, faser, innboks, ventende research. FAKTISKE data.", input_schema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "saga_factory_add_idea", description: "Legg en idé i fabrikkens innboks (fanges, startes ikke).", input_schema: { type: "object", properties: { idea: { type: "string" } }, required: ["idea"], additionalProperties: false } },
  { name: "saga_board_status", description: "Styrets hovedbok: siste beslutninger med anbefaling/sikkerhet, og åpne antakelser som skal følges opp.", input_schema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "saga_answer_research", description: "Lever svar på en ventende research-forespørsel fra fabrikken (bruk id fra saga_factory_status/pending-listen).", input_schema: { type: "object", properties: { request_id: { type: "string" }, answer: { type: "string" } }, required: ["request_id", "answer"], additionalProperties: false } },
];

function execTool(name, input) {
  const B = window.SAGA && window.SAGA.bridge;
  try {
    if (name === "saga_factory_status") {
      const s = B.factoryStatus();
      const pend = B.pending("research").map((r) => ({ id: r.id, prosjekt: r.project, spørsmål: r.question }));
      return JSON.stringify({ ...s, ventende_research: pend });
    }
    if (name === "saga_factory_add_idea") { B.addIdeaToFactory(String(input.idea || "")); return "Idéen ligger i innboksen (FAKTISK)."; }
    if (name === "saga_board_status") {
      const A = window.AEIS;
      if (!A) return "Styret er ikke lastet.";
      const dec = A.Ledger.list().filter((d) => d.synthesis).slice(0, 5).map((d) => ({ tittel: d.title, anbefaling: d.synthesis.recommendation, sikkerhet: d.synthesis.certainty, dato: d.at.slice(0, 10) }));
      return JSON.stringify({ beslutninger: dec, åpne_antakelser: A.Ledger.openAssumptions().slice(0, 8) });
    }
    if (name === "saga_answer_research") { B.complete(String(input.request_id), String(input.answer || "")); return "Svaret er levert til prosjektpanelet (FAKTISK)."; }
    return "Ukjent verktøy: " + name;
  } catch (e) { return "Verktøyfeil: " + e.message; }
}

/* Kontekst fra der eieren står i skallet – injiseres i systemprompten */
function contextText() {
  const h = location.hash || "";
  const m = h.match(/^#\/companies\/(.+)$/);
  if (m && window.CF) {
    const p = window.CF.Projects.get(m[1]);
    if (p) return `KONTEKST: Eieren står i selskapet «${p.name}»${p.test ? " (TEST)" : ""} – status ${p.status}, fase ${p.phase}. Idé: ${p.idea}`;
  }
  if (h.startsWith("#/board")) return "KONTEKST: Eieren står i Styret-flaten.";
  if (h.startsWith("#/approvals")) return "KONTEKST: Eieren ser på ventende godkjenninger.";
  return "";
}

async function post(body) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": KEY(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify(body),
  }).catch(() => { throw new Error("Nettverksfeil. Er du i en forhåndsvisning som blokkerer eksterne kall? Åpne appen på GitHub Pages-adressen."); });
  if (!res.ok) {
    let detail = ""; try { detail = (await res.json()).error?.message || ""; } catch {}
    throw new Error("API-feil " + res.status + ". " + detail);
  }
  return res.json();
}

async function send(text, onEvent) {
  if (!KEY()) throw new Error("Ingen API-nøkkel – legg den inn under System.");
  const say = (t, d) => onEvent && onEvent(t, d);
  History.add("user", text);
  const ctx = contextText();
  const system = PERSONA + (ctx ? "\n\n" + ctx : "");
  let messages = History.list().slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

  for (let round = 0; round < 8; round++) {
    const res = await post({
      model: MODEL(), max_tokens: 4096, system, messages,
      tools: [...TOOLS, { type: "web_search_20260209", name: "web_search", max_uses: 3 }],
    });
    try { if (window.CF) window.CF.Costs.add(res.usage, "assistent-dokk", null); } catch {}
    if (res.stop_reason === "tool_use") {
      messages = [...messages, { role: "assistant", content: res.content }];
      const results = [];
      for (const b of res.content.filter((x) => x.type === "tool_use")) {
        say("tool", b.name);
        results.push({ type: "tool_result", tool_use_id: b.id, content: execTool(b.name, b.input || {}) });
      }
      messages.push({ role: "user", content: results });
      continue;
    }
    if (res.stop_reason === "pause_turn") { messages = [...messages, { role: "assistant", content: res.content }]; say("status", "arbeider videre …"); continue; }
    const out = (res.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim() || "(tomt svar)";
    History.add("assistant", out);
    say("done", out);
    try { if (window.SAGA) window.SAGA.activity.log("assistant", "dokk", text.slice(0, 60)); } catch {}
    return out;
  }
  throw new Error("Avbrutt: for mange verktøyrunder.");
}

window.SAGACHAT = { send, History, contextText };
})();
