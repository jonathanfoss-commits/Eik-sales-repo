/* SAGA OS – Styret-flaten. Rent visningslag på window.AEIS-motoren.
 * Full styreside (rolleadministrasjon, kryptert backup, utfallsregistrering)
 * bor fortsatt på board/ – denne flaten dekker daglig bruk: nye saker,
 * hovedboken, åpne antakelser, radar – og broen fabrikk ↔ styre.
 */
(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const { esc, when } = window.OS;
const A = window.AEIS;

function certBadge(c) {
  const cls = c === "høy" ? "h" : c === "middels" ? "m" : "l";
  return `<span class="badge ${cls}">${esc(c || "?")} sikkerhet</span>`;
}
function nok(usd) { return (Math.round(usd * 11 * 10) / 10).toLocaleString("nb-NO") + " kr"; }

let openId = null;

function render() {
  const el = $("boardView");
  const est = A.Engine.estimateCost();
  const assumptions = A.Ledger.openAssumptions();
  const radar = A.Radar.latest();
  const decisions = A.Ledger.list().filter((d) => !d.radar);

  el.innerHTML = `
  <h2>NY STYRESAK</h2>
  <div class="panel">
    <input type="text" id="bdTitle" placeholder="Sak (f.eks. «Bør jeg prioritere prosjekt X over Y i høst?»)">
    <textarea id="bdContext" rows="3" placeholder="Kontekst: fakta, tall, rammer – styret gjetter ikke, det spør eller sier «for lite informasjon»." style="margin-top:8px"></textarea>
    <div class="row" style="margin-top:8px; align-items:center">
      <button class="primary" id="bdRun">🏛 Kjør styremøte</button>
      <span class="note" style="flex:1">~${nok(est.usd)} <span class="badge est">estimat</span> · ${est.calls} AI-kall · ruting: ${esc(est.routing)}</span>
    </div>
    <div class="note" id="bdProgress"></div>
  </div>

  ${assumptions.length ? `<h2>ÅPNE ANTAKELSER – STYRET VIL FØLGES OPP</h2>
  <div class="panel">${assumptions.slice(0, 6).map((a) => `<div class="note">☐ <b>${esc(a.claim)}</b> – test: ${esc(a.test)} (${esc(a.review_horizon)}) <span class="muted">[${esc(a.decisionTitle)}]</span> <button class="small" data-bd-check="${a.decisionId}:${a.index}">✓ Fulgt opp</button></div>`).join("")}</div>` : ""}

  <h2>RADAR – STYRETS PROAKTIVE ØYNE</h2>
  <div class="panel">
    <div class="row" style="align-items:center">
      <button class="small" id="bdRadar">📡 Kjør radar-skanning nå</button>
      <span class="note" style="flex:1">${A.Radar.lastRun ? "Sist: " + esc(when(A.Radar.lastRun)) : "Aldri kjørt."} Funn merket [MULIGHET] dukker opp som kandidater i Idélab-innboksen.</span>
    </div>
    ${radar ? `<div class="note" style="margin-top:8px">${A.Radar.parseFindings(radar.radar).slice(0, 5).map((f) => `<b>[${esc(f.tag)}]</b> ${esc(f.title)}`).join("<br>")}</div>` : ""}
  </div>

  <h2>HOVEDBOKEN – ALLE STYREBESLUTNINGER</h2>
  ${decisions.length ? decisions.slice(0, 15).map((d) => {
    const s = d.synthesis;
    return `<div class="alert sev2" data-bd-open="${d.id}" style="cursor:pointer">
      <div><div class="p">${esc(d.title)}${d.projectName ? ` <span class="badge m">${esc(d.projectName)}</span>` : ""}${d.devil && d.devil.veto ? ' <span class="badge l">VETO RUNDE 1</span>' : ""}${d.outcome ? ' <span class="badge h">UTFALL REGISTRERT</span>' : ""}</div>
      <div class="t">${s ? esc(s.recommendation).slice(0, 160) : "(pågår/uten syntese)"}</div>
      <div class="d">${esc(when(d.at))}${s ? " · " + esc(s.certainty) + " sikkerhet" : ""}${d.cost ? " · ~" + nok(d.cost.usd) + " (estimat)" : ""}</div></div>
    </div>`;
  }).join("") : `<div class="panel muted">Ingen styresaker enda. Kjør en sak over – eller send et selskap til styret fra prosjektsiden.</div>`}
  <div id="bdDetail">${openId ? detailHtml(openId) : ""}</div>
  <div class="note muted">Rolleadministrasjon, kalibreringsvekter, utfallsregistrering og kryptert sky-backup: <a href="board/">åpne styret i fullskjerm →</a></div>`;

  wire();
}

function detailHtml(id) {
  const d = A.Ledger.get(id);
  if (!d || !d.synthesis) return "";
  const s = d.synthesis;
  return `<div class="panel" style="border-color:var(--saga-primary)">
    <h3>${esc(d.title)} ${certBadge(s.certainty)}</h3>
    <b style="color:var(--cyan)">${esc(s.recommendation)}</b>
    <div class="note">${esc(s.summary)}</div>
    ${s.outside_view ? `<div class="note"><b>Utenfra-blikk (base rate):</b> ${esc(s.outside_view)}</div>` : ""}
    ${(s.disagreements || []).length ? `<div class="note"><b>Reelle uenigheter:</b> ${s.disagreements.map(esc).join(" · ")}</div>` : ""}
    <table><tr><th>SCENARIO</th><th>P</th><th>UTFALL</th></tr>${(s.scenarios || []).map((x) => `<tr><td>${esc(x.name)}</td><td>${Math.round(x.probability * 100)}%</td><td class="muted">${esc(x.outcome)}</td></tr>`).join("")}</table>
    <div class="note"><b>Handlingsplan:</b><br>${(s.action_plan || []).map((a, i) => `${i + 1}. ${esc(a)}`).join("<br>")}</div>
    ${d.projectId ? `<button class="small" data-bd-project="${d.projectId}">Åpne selskapet →</button>` : ""}
  </div>`;
}

function wire() {
  $("bdRun").onclick = () => runCase($("bdTitle").value.trim(), $("bdContext").value.trim(), null);
  $("bdRadar").onclick = async () => {
    const p = $("bdProgress");
    try { p.textContent = "Radar skanner (websøk) …"; await A.Radar.run((s) => p.textContent = "Radar: " + s); p.textContent = ""; render(); }
    catch (e) { p.textContent = "Feil: " + e.message; }
  };
  document.querySelectorAll("[data-bd-open]").forEach((x) => { x.onclick = () => { openId = x.dataset.bdOpen; render(); }; });
  document.querySelectorAll("[data-bd-check]").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); const [id, i] = b.dataset.bdCheck.split(":"); A.Ledger.toggleAssumption(id, parseInt(i, 10)); render(); };
  });
  document.querySelectorAll("[data-bd-project]").forEach((b) => {
    b.onclick = () => { window.OS.goTab("portfolio"); window.OS.showProject(b.dataset.bdProject); };
  });
}

async function runCase(title, context, project) {
  const p = $("bdProgress") || { textContent: "" };
  if (!title) { p.textContent = "Gi saken en tittel."; return; }
  const est = A.Engine.estimateCost();
  if (!confirm(`Kjøre styremøte? ~${nok(est.usd)} i AI-kost (estimat, ${est.calls} kall).`)) return;
  try {
    const d = await A.Engine.runDecision(title, context, (step, detail) =>
      p.textContent = "Styret arbeider: " + step + (Array.isArray(detail) ? " (" + detail.join(", ") + ")" : detail ? " – " + detail : ""));
    if (project) {
      A.Ledger.update(d.id, { projectId: project.id, projectName: project.name });
      const s = d.synthesis;
      window.CF.Projects.logDecision(window.CF.Projects.get(project.id), {
        decision: "STYRET: " + s.recommendation.slice(0, 120),
        rationale: s.summary.slice(0, 300) + " (sikkerhet: " + s.certainty + ")",
        byOwner: false, role: "AEIS-styret",
      });
    }
    p.textContent = "";
    openId = d.id;
    render();
    return d;
  } catch (e) { p.textContent = "Feil: " + e.message; }
}

/* Broen fabrikk → styre: prosjektsiden kaller denne (eier-klikk + kost-bekreftelse) */
window.OS.boardCaseForProject = async (proj) => {
  const m = window.CF.Metrics.latest(proj);
  const parts = [
    "Selskap: " + proj.name + (proj.test ? " (TEST)" : ""),
    "Status: " + proj.status + " · fase " + proj.phase,
    "Idé: " + proj.idea,
    proj.evaluation ? "Fabrikkens vurdering: " + proj.evaluation.synthesis.decision + " (" + proj.evaluation.totalScore + "/100): " + proj.evaluation.synthesis.decision_rationale : "Ikke evaluert enda.",
    proj.validation ? "Valideringsport: " + proj.validation.decision : "",
    m ? "Siste måletall (FAKTISK): MRR " + m.mrr + " kr, " + (m.customers ?? "?") + " kunder" : "Ingen måletall registrert.",
  ].filter(Boolean);
  window.OS.goTab("board");
  $("bdTitle").value = "Styresak: " + proj.name + " – veien videre fra fase " + proj.phase;
  $("bdContext").value = parts.join("\n");
  return runCase($("bdTitle").value, $("bdContext").value, proj);
};

window.OS.registerView("board", render);
})();
