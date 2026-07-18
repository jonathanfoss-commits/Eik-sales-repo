// Modul: Prosjektrommet — én side per prosjekt, automatisk utledet av det
// laget allerede registrerer (dagbok, timer, tillegg, varsler, frister).
// Ingen ny registreringsbyrde: rommet ER summen av de andre modulene.
// Nivåene består hele veien: alt hentes bak RLS, så en ansatt ser DELT + egne
// PRIVAT-rader, ledelsen ser sitt — dokument og tidslinje arver det automatisk.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { kallEvne, sjekkKvote, loggKost } from '../ai/gateway.js';
import { osloDato } from '../dato.js';
import { leggTilMnd } from './frister.js';

const esc = (s) => String(s ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');

const VARSELTYPE = { varemottak: 'Varemottak/avvik', endringsvarsel: 'Endringsvarsel' };

// timestamptz kommer fra pg som JS-Date (date-kolonner som ISO-streng) —
// datodelen regnes alltid i norsk tid, aldri via String(Date)
const isoDag = (ts) => new Date(ts).toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });

// Datagrunnlaget per prosjekt — én kilde for tidslinje, bevis og ukesrapport.
// RLS avgjør hva spørreren faktisk får (timer: egne, eller alle for ledelsen).
async function hentGrunnlag(c, prosjekt, { fraDag = null } = {}) {
  // fraDag er en ISO-dato regnet i Oslo-tid hos kalleren — alltid parameter,
  // aldri interpolert (granskingsfunn: tall-interpolasjonen og UTC-vinduet)
  const p = fraDag ? [prosjekt, fraDag] : [prosjekt];
  const datoKrav = (kol) => (fraDag ? `AND ${kol} >= $2::date` : '');
  const tidKrav = (kol) => (fraDag ? `AND (${kol} AT TIME ZONE 'Europe/Oslo')::date >= $2::date` : '');
  const [dagbok, varsler, tillegg, timer, frist] = await Promise.all([
    c.query(`SELECT d.*, b.navn AS bruker_navn FROM dagbok d JOIN brukere b ON b.id = d.bruker_id
              WHERE d.prosjekt = $1 ${datoKrav('d.dato')} ORDER BY d.dato, d.opprettet`, p),
    c.query(`SELECT v.*, b.navn AS bruker_navn FROM varsler v JOIN brukere b ON b.id = v.bruker_id
              WHERE v.prosjekt = $1 ${tidKrav('v.opprettet')} ORDER BY v.opprettet`, p),
    c.query(`SELECT t.*, b.navn AS bruker_navn FROM tillegg t JOIN brukere b ON b.id = t.bruker_id
              WHERE t.prosjekt = $1 ${datoKrav('t.dato')} ORDER BY t.dato, t.opprettet`, p),
    c.query(`SELECT t.*, b.navn AS bruker_navn FROM timeforinger t JOIN brukere b ON b.id = t.bruker_id
              WHERE t.prosjekt = $1 ${datoKrav('t.dato')} ORDER BY t.dato`, p),
    c.query(`SELECT * FROM prosjektfrister WHERE prosjekt = $1`, [prosjekt]),
  ]);
  return { dagbok: dagbok.rows, varsler: varsler.rows, tillegg: tillegg.rows,
    timer: timer.rows, frist: frist.rows[0] || null };
}

export function registrer(ruter) {
  // Prosjektlisten — navnene utledes av alt spørreren har rett til å se,
  // med status-chips som driver handling (åpne varsler, ufakturerte tillegg,
  // frister som nærmer seg).
  ruter.add('GET', '/api/prosjekter', ({ ctx }) => medOrg(ctx, async (c) => {
    const res = await c.query(
      `SELECT prosjekt, max(sist) AS sist FROM (
         SELECT prosjekt, max(opprettet) AS sist FROM dagbok GROUP BY prosjekt
         UNION ALL SELECT prosjekt, max(opprettet) FROM varsler GROUP BY prosjekt
         UNION ALL SELECT prosjekt, max(opprettet) FROM tillegg GROUP BY prosjekt
         UNION ALL SELECT prosjekt, max(opprettet) FROM timeforinger GROUP BY prosjekt
         UNION ALL SELECT prosjekt, max(opprettet) FROM prosjektfrister GROUP BY prosjekt
       ) alle WHERE prosjekt IS NOT NULL AND prosjekt <> ''
       GROUP BY prosjekt ORDER BY max(sist) DESC LIMIT 100`);
    const [varsler, tillegg, frister, dagbok] = await Promise.all([
      c.query(`SELECT prosjekt, count(*) AS antall FROM varsler
                WHERE status IN ('meldt','sendt') GROUP BY prosjekt`),
      c.query(`SELECT prosjekt, count(*) AS antall FROM tillegg
                WHERE status = 'registrert' GROUP BY prosjekt`),
      c.query(`SELECT prosjekt, overtakelse FROM prosjektfrister`),
      c.query(`SELECT prosjekt, count(*) AS antall FROM dagbok GROUP BY prosjekt`),
    ]);
    const perProsjekt = (rader) => Object.fromEntries(rader.map((r) => [r.prosjekt, r]));
    const vKart = perProsjekt(varsler.rows), tKart = perProsjekt(tillegg.rows),
      fKart = perProsjekt(frister.rows), dKart = perProsjekt(dagbok.rows);
    const iDag = osloDato();
    return {
      prosjekter: res.rows.map((p) => {
        const frist = fKart[p.prosjekt];
        let dagerTilSluttoppstilling = null;
        if (frist) {
          const slutt = leggTilMnd(String(frist.overtakelse), 2);
          dagerTilSluttoppstilling = Math.ceil((new Date(slutt) - new Date(iDag)) / 86400000);
        }
        return {
          prosjekt: p.prosjekt, sist: p.sist,
          dagboklinjer: Number(dKart[p.prosjekt]?.antall || 0),
          aapneVarsler: Number(vKart[p.prosjekt]?.antall || 0),
          aapneTillegg: Number(tKart[p.prosjekt]?.antall || 0),
          dagerTilSluttoppstilling,
        };
      }),
    };
  }));

  // Tidslinjen — alt om prosjektet i én kronologi. Prosjektnavn i query
  // (navnene har mellomrom/skråstrek — de hører ikke hjemme i stien).
  ruter.add('GET', '/api/prosjekter/tidslinje', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    const prosjekt = sok.get('prosjekt');
    if (!prosjekt) throw new ApiFeil(400, 'Angi prosjekt');
    const g = await hentGrunnlag(c, prosjekt);
    const hendelser = [
      ...g.dagbok.map((d) => ({ slag: 'dagbok', id: d.id, dato: String(d.dato),
        tid: d.opprettet, av: d.bruker_navn, tekst: d.tekst, versjon: d.versjon })),
      ...g.varsler.map((v) => ({ slag: 'varsel', id: v.id, dato: isoDag(v.opprettet),
        tid: v.opprettet, av: v.bruker_navn, tekst: v.tekst,
        type: v.type, status: v.status, svarfrist: v.svarfrist ? String(v.svarfrist) : null })),
      ...g.tillegg.map((t) => ({ slag: 'tillegg', id: t.id, dato: String(t.dato),
        tid: t.opprettet, av: t.bruker_navn, tekst: t.tekst,
        avtaltMed: t.avtalt_med, status: t.status })),
      ...g.timer.map((t) => ({ slag: 'timer', id: t.id, dato: String(t.dato),
        tid: t.opprettet, av: t.bruker_navn, tekst: `${t.timer} t${t.notat ? ` — ${t.notat}` : ''}` })),
    ].sort((a, b) => b.dato.localeCompare(a.dato) || (a.tid < b.tid ? 1 : -1));
    return { prosjekt, frist: g.frist, hendelser: hendelser.slice(0, 300) };
  }));

  // Bevisdokumentet — utskriftsklar HTML (print → PDF på telefonen). Kun DELT
  // innhold (dagbok, varsler, tillegg): PRIVATE timer og økonomi holdes utenfor
  // med vilje, så dokumentet trygt kan gis til byggherre/advokat.
  ruter.add('GET', '/api/prosjekter/bevis', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    const prosjekt = sok.get('prosjekt');
    if (!prosjekt) throw new ApiFeil(400, 'Angi prosjekt');
    const org = (await c.query('SELECT navn FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
    const g = await hentGrunnlag(c, prosjekt);
    if (!g.dagbok.length && !g.varsler.length && !g.tillegg.length) {
      throw new ApiFeil(404, 'Ingen dokumenterbare registreringer på dette prosjektet ennå');
    }
    const naa = new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo' });
    const pen = (iso) => String(iso).slice(0, 10).split('-').reverse().join('.');
    const tidspunkt = (ts) => new Date(ts).toLocaleString('nb-NO',
      { timeZone: 'Europe/Oslo', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit' });

    const dagbokHtml = g.dagbok.map((d) => `
      <tr><td class="mono">${pen(d.dato)}</td>
      <td>${esc(d.tekst)}${d.versjon > 1 ? ` <em class="rettet">(rettet — versjon ${d.versjon}, sist ${tidspunkt(d.endret)})</em>` : ''}</td>
      <td class="mono">${esc(d.bruker_navn)}<br>ført ${tidspunkt(d.opprettet)}</td></tr>`).join('');

    const varslerHtml = g.varsler.map((v) => `
      <tr><td class="mono">${tidspunkt(v.opprettet)}</td>
      <td><b>${esc(VARSELTYPE[v.type] || v.type)}</b>${v.leverandor ? ` · ${esc(v.leverandor)}` : ''}<br>${esc(v.tekst)}</td>
      <td class="mono">${esc(v.bruker_navn)}<br>status: ${esc(v.status)}${v.svarfrist ? `<br>svarfrist ${pen(v.svarfrist)}` : ''}</td></tr>`).join('');

    const tilleggHtml = g.tillegg.map((t) => `
      <tr><td class="mono">${pen(t.dato)}</td>
      <td>${esc(t.tekst)}${t.avtalt_med ? `<br><em>Avtalt med: ${esc(t.avtalt_med)}</em>` : ''}</td>
      <td class="mono">${esc(t.bruker_navn)}<br>registrert ${tidspunkt(t.opprettet)}</td></tr>`).join('');

    const fristHtml = g.frist ? `
      <p>Overtakelse: <b>${pen(g.frist.overtakelse)}</b> ·
      sluttoppstilling senest <b>${pen(leggTilMnd(String(g.frist.overtakelse), 2))}</b> ·
      søksmålsfrist <b>${pen(leggTilMnd(String(g.frist.overtakelse), 8))}</b> (NS 8407).</p>` : '';

    const html = `<!doctype html>
<html lang="nb"><head><meta charset="utf-8">
<title>Bevisdokument — ${esc(prosjekt)}</title>
<style>
  body{font:11pt/1.5 Georgia,'Times New Roman',serif;color:#111;margin:0 auto;max-width:820px;padding:32px 24px}
  h1{font-size:1.5rem;margin:0 0 2px}
  h2{font-size:1.05rem;margin:28px 0 6px;border-bottom:2px solid #111;padding-bottom:3px}
  .mono{font-family:'Courier New',monospace;font-size:.72rem;letter-spacing:.02em;color:#333}
  .topp{border-bottom:3px double #111;padding-bottom:10px;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  td{border-top:1px solid #bbb;padding:6px 8px 6px 0;vertical-align:top}
  td:first-child{white-space:nowrap;width:96px}
  td:last-child{width:150px;text-align:right}
  .rettet{color:#555;font-size:.85em}
  .ramme{border:1px solid #999;padding:10px 12px;font-size:.85rem;margin-top:26px;background:#f7f7f5}
  .skriv-ut{position:fixed;top:12px;right:12px;font:700 .8rem system-ui;padding:10px 16px;
    background:#111;color:#fff;border:0;border-radius:8px;cursor:pointer}
  @media print{.skriv-ut{display:none} body{padding:0} h2{break-after:avoid} tr{break-inside:avoid}}
</style>
<script src="/js/bevis.js" defer></script></head><body>
<button class="skriv-ut" id="skriv-ut">Skriv ut / lagre som PDF</button>
<div class="topp">
  <h1>BEVISDOKUMENT — PROSJEKTDOKUMENTASJON</h1>
  <p class="mono">Prosjekt: ${esc(prosjekt)} · Entreprenør: ${esc(org?.navn || '')}<br>
  Uttrekk generert ${esc(naa)} av ${esc(ctx.navn)} — direkte fra systemets database, uredigert.</p>
  ${fristHtml}
</div>
<h2>1 · Byggedagbok (${g.dagbok.length} innførsler, kronologisk)</h2>
<table>${dagbokHtml || '<tr><td colspan="3">Ingen dagboklinjer.</td></tr>'}</table>
<h2>2 · Varsler og avvik (${g.varsler.length})</h2>
<table>${varslerHtml || '<tr><td colspan="3">Ingen varsler.</td></tr>'}</table>
<h2>3 · Avtalt tilleggsarbeid (${g.tillegg.length})</h2>
<table>${tilleggHtml || '<tr><td colspan="3">Ingen tillegg.</td></tr>'}</table>
<div class="ramme"><b>Om dokumentets integritet:</b> Innførslene er gjort fortløpende
av navngitte personer med maskinsatt tidsstempel. Systemet tillater ikke sletting av
dagboklinjer — kun rettelser, som alltid øker versjonsnummeret og er merket i dette
uttrekket. Tidsnære, uredigerbare notater av denne typen tillegges normalt betydelig
bevisvekt. Dokumentet inneholder kun delte prosjektopplysninger — ingen personlige
timeføringer eller interne økonomidata.</div>
</body></html>`;
    return { _html: html };
  }));

  // Ukesrapporten — syr ukens registreringer til ferdig rapport via AI-evnen
  // «ukesrapport» i tenant-konfigen. To varianter: «byggherre» (DELT innhold)
  // og «ledelse» (m/ timer og ufakturerte tillegg — kun ledelsen, D22).
  // Foreslås alltid, sendes aldri automatisk [JONATHAN].
  ruter.add('POST', '/api/prosjekter/ukesrapport', async ({ ctx, body }) => {
    const { prosjekt, variant = 'byggherre' } = body;
    if (!prosjekt) throw new ApiFeil(400, 'Angi prosjekt');
    if (!['byggherre', 'ledelse'].includes(variant)) throw new ApiFeil(400, 'Ukjent variant');
    const ledelse = ['admin', 'pilotleder'].includes(ctx.rolle);
    if (variant === 'ledelse' && !ledelse) throw new ApiFeil(403, 'Ledelsesrapporten er for ledelsen');

    // 1) kort transaksjon: evne + kvote + ukens datagrunnlag
    const oppsett = await medOrg(ctx, async (c) => {
      const org = (await c.query('SELECT navn, konfig FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
      const e = org?.konfig?.evner?.ukesrapport;
      if (!e) throw new ApiFeil(400, 'Ukesrapporten er ikke satt opp for denne organisasjonen');
      await sjekkKvote(c);
      // «siste 7 dager» regnet i norsk tid (middag-UTC-trikset er DST-trygt)
      const fraDag = new Date(new Date(osloDato() + 'T12:00:00Z').getTime() - 7 * 86400000)
        .toISOString().slice(0, 10);
      const g = await hentGrunnlag(c, prosjekt, { fraDag });
      return { e, profil: org.konfig.profil || '', orgNavn: org.navn, g };
    });
    const { g } = oppsett;
    if (!g.dagbok.length && !g.varsler.length && !g.tillegg.length && !g.timer.length) {
      throw new ApiFeil(404, 'Ingen registreringer siste 7 dager på dette prosjektet');
    }

    const linjer = [
      `PROSJEKT: ${prosjekt} — UKE TIL OG MED ${osloDato()}`,
      '', 'DAGBOK:',
      ...g.dagbok.map((d) => `- ${String(d.dato)}: ${d.tekst} (${d.bruker_navn})`),
      '', 'VARSLER/AVVIK:',
      ...g.varsler.map((v) => `- ${isoDag(v.opprettet)}: [${v.type}, status ${v.status}] ${v.tekst}`),
      '', 'AVTALTE TILLEGG:',
      ...g.tillegg.map((t) => `- ${String(t.dato)}: ${t.tekst}${t.avtalt_med ? ` (avtalt med ${t.avtalt_med})` : ''} [${t.status}]`),
    ];
    if (variant === 'ledelse') {
      const sum = g.timer.reduce((s, t) => s + Number(t.timer), 0);
      const perMann = {};
      for (const t of g.timer) perMann[t.bruker_navn] = (perMann[t.bruker_navn] || 0) + Number(t.timer);
      linjer.push('', `TIMER DENNE UKEN (internt): totalt ${sum} t`,
        ...Object.entries(perMann).map(([navn, t]) => `- ${navn}: ${t} t`),
        '', `UFAKTURERTE TILLEGG: ${g.tillegg.filter((t) => t.status === 'registrert').length}`);
    }
    const instruksTillegg = variant === 'ledelse'
      ? 'Skriv den INTERNE ledelsesvarianten: fremdrift, avvik, timeforbruk, ufakturerte tillegg og hva ledelsen bør følge opp.'
      : 'Skriv BYGGHERRE-varianten: fremdrift, avvik/varsler og plan for neste uke. Ingen interne timetall eller økonomi.';

    // 2) modellkallet utenfor transaksjon — gjennom gatewayen (budsjett/logg)
    const resultat = await kallEvne({
      navn: 'ukesrapport', evne: oppsett.e, profil: oppsett.profil,
      tekst: instruksTillegg + '\n\n' + linjer.join('\n'),
    });
    await medOrg(ctx, (c) => loggKost(c, {
      orgId: ctx.orgId, brukerId: ctx.brukerId, evne: 'ukesrapport',
      modell: resultat.modell, usage: resultat.usage, kostOre: resultat.kostOre,
    }));
    return { tekst: resultat.tekst, variant };
  });
}
