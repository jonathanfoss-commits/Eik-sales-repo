// Integrasjonstest av hele API-et mot ekte database og ekte server, inkludert
// AI-kjeden mot lokal mock (ANTHROPIC_BASE_URL): innlogging, tenant-tema,
// datanivåene gjennom API-et, SSE-live, budsjettsperre og 503-reserven.
// Krever kjørende Postgres (hoppes over ellers).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';

const ROT = path.resolve(import.meta.dirname, '..');
const PORT = 3199;
const URL_ROT = `http://127.0.0.1:${PORT}`;
let tilgjengelig = true;
let server, aiMock, eier;
let orgA;
const PASSORD = 'test-passord-123';
const cookies = {}; // navn -> cookie

async function api(hvem, metode, sti, body) {
  const res = await fetch(URL_ROT + sti, {
    method: metode,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookies[hvem] ? { Cookie: cookies[hvem] } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const sett = res.headers.get('set-cookie');
  if (sett && hvem) cookies[hvem] = sett.split(';')[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

test.before(async () => {
  try {
    const pg = await import('pg');
    const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
    eier = new pg.default.Client({ connectionString: url });
    await eier.connect();
    // fixture-brukere i op-bygg-tenanten (opprettet av ny-tenant-verktøyet)
    orgA = (await eier.query(`SELECT id FROM organisasjoner WHERE slug = 'op-bygg'`)).rows[0]?.id;
    if (!orgA) throw new Error('op-bygg-tenanten mangler — kjør ny-tenant.js laerling først');
    const { hashPassord } = await import('../server/auth.js');
    for (const [navn, epost, rolle] of [
      ['Test Admin', 'api-admin@test.local', 'admin'],
      ['Test Leder', 'api-leder@test.local', 'pilotleder'],
      ['Test Ansatt', 'api-ansatt@test.local', 'ansatt'],
    ]) {
      await eier.query(
        `INSERT INTO brukere (org_id, navn, epost, rolle, passord_hash) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (epost) DO UPDATE SET passord_hash = EXCLUDED.passord_hash, aktiv = true`,
        [orgA, navn, epost, rolle, await hashPassord(PASSORD)]);
    }

    // AI-mock: later som den er Anthropic Messages API.
    aiMock = http.createServer((req, res) => {
      let kropp = '';
      req.on('data', (d) => { kropp += d; });
      req.on('end', () => {
        aiMock.sisteKall = JSON.parse(kropp);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          content: [{ type: 'text', text: 'MOCK-UTKAST fra modellen' }],
          usage: { input_tokens: 900, output_tokens: 400, cache_read_input_tokens: 700, cache_creation_input_tokens: 0 },
        }));
      });
    });
    await new Promise((r) => aiMock.listen(3198, r));

    server = spawn('node', ['server/index.js'], {
      cwd: ROT,
      env: {
        ...process.env,
        PORT: String(PORT),
        DATABASE_URL: process.env.DATABASE_URL,
        DATABASE_URL_AUTH: process.env.DATABASE_URL_AUTH,
        ANTHROPIC_API_KEY: 'sk-mock',
        ANTHROPIC_BASE_URL: 'http://127.0.0.1:3198',
        AI_MND_BUDSJETT_ORE: '50000',
      },
      stdio: 'pipe',
    });
    for (let i = 0; i < 40; i++) {
      try { await fetch(URL_ROT + '/api/helse'); break; }
      catch { await new Promise((r) => setTimeout(r, 150)); }
    }
  } catch (feil) {
    tilgjengelig = false;
    console.log('Hopper over API-tester:', feil.message);
  }
});

test.after(async () => {
  server?.kill();
  aiMock?.close();
  if (eier) {
    await eier.query(`DELETE FROM revisjon WHERE bruker_id IN (SELECT id FROM brukere WHERE epost LIKE 'api-%@test.local')`);
    await eier.query(`DELETE FROM godkjenninger WHERE versjon LIKE 'api-%'`);
    await eier.query(`DELETE FROM pilotlogg WHERE org_id = $1`, [orgA]);
    await eier.query(`DELETE FROM ai_logg WHERE org_id = $1`, [orgA]);
    await eier.query(`DELETE FROM dagbok WHERE prosjekt LIKE 'API-%'`);
    await eier.query(`DELETE FROM varsler WHERE prosjekt LIKE 'API-%'`);
    await eier.query(`DELETE FROM tillegg WHERE prosjekt LIKE 'API-%'`);
    await eier.query(`DELETE FROM prosjektfrister WHERE prosjekt LIKE 'API-%'`);
    await eier.query(`DELETE FROM fakturaer WHERE referanse LIKE 'API-%'`);
    await eier.query(`DELETE FROM nullstillinger WHERE bruker_id IN (SELECT id FROM brukere WHERE epost LIKE 'api-%@test.local')`);
    await eier.query(`DELETE FROM timeforinger WHERE prosjekt LIKE 'API-%'`);
    await eier.query(`DELETE FROM sesjoner WHERE bruker_id IN (SELECT id FROM brukere WHERE epost LIKE 'api-%@test.local')`);
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'api-%@test.local'`);
    await eier.end();
  }
});

test('innlogging + /api/meg gir tenant-tema og moduler (white-label)', async () => {
  if (!tilgjengelig) return;
  const inn = await api('admin', 'POST', '/api/login', { epost: 'api-admin@test.local', passord: PASSORD });
  assert.equal(inn.status, 200);
  const meg = await api('admin', 'GET', '/api/meg');
  assert.equal(meg.data.org.appnavn, 'Lærling');
  assert.equal(meg.data.org.tema.a, '#39E29B', 'midnatt-temaet kommer fra tenant-konfigen');
  assert.ok(meg.data.org.moduler.includes('dagbok'));
  assert.ok(!JSON.stringify(meg.data).includes('FAGREGLER'), 'AI-profilen lekker aldri til klienten');
});

test('datanivåene håndheves gjennom API-et (timer privat + ledelse)', async () => {
  if (!tilgjengelig) return;
  await api('leder', 'POST', '/api/login', { epost: 'api-leder@test.local', passord: PASSORD });
  await api('ansatt', 'POST', '/api/login', { epost: 'api-ansatt@test.local', passord: PASSORD });

  const post = await api('ansatt', 'POST', '/api/timer',
    { dato: new Date().toISOString().slice(0, 10), prosjekt: 'API-timer', timer: 6 });
  assert.equal(post.status, 200);

  const egne = await api('ansatt', 'GET', '/api/timer');
  assert.ok(egne.data.foringer.some((f) => f.prosjekt === 'API-timer'));

  const lederAlle = await api('leder', 'GET', '/api/timer?alle=1');
  assert.ok(lederAlle.data.foringer.some((f) => f.prosjekt === 'API-timer'), 'ledelsen ser alles timer');

  const adminKost = await api('admin', 'GET', '/api/sentral/ai-kost');
  assert.equal(adminKost.status, 200, 'admin ser AI-kost');
  const lederKost = await api('leder', 'GET', '/api/sentral/ai-kost');
  assert.equal(lederKost.status, 403, 'pilotleder ser IKKE AI-kost [JONATHAN]');
  const ansattSentral = await api('ansatt', 'GET', '/api/sentral');
  assert.equal(ansattSentral.status, 403, 'sentralen er for ledelsen');
});

test('live-laget: dagboklinje gir SSE-hendelse uten innhold', async () => {
  if (!tilgjengelig) return;
  const sse = await fetch(URL_ROT + '/api/hendelser', { headers: { Cookie: cookies.leder } });
  const leser = sse.body.getReader();
  const dekoder = new TextDecoder();

  await api('ansatt', 'POST', '/api/dagbok', { prosjekt: 'API-dagbok', tekst: 'HEMMELIG-INNHOLD-123' });

  let buffer = '', hendelse = null;
  const frist = Date.now() + 5000;
  while (!hendelse && Date.now() < frist) {
    const { value } = await Promise.race([leser.read(),
      new Promise((r) => setTimeout(() => r({ value: null }), 600))]);
    if (value) {
      buffer += dekoder.decode(value, { stream: true });
      const m = buffer.match(/data: (.+)\n/);
      if (m) hendelse = JSON.parse(m[1]);
    }
  }
  leser.cancel().catch(() => {});
  assert.ok(hendelse, 'SSE-hendelsen kom frem');
  assert.equal(hendelse.modul, 'dagbok');
  assert.ok(!buffer.includes('HEMMELIG-INNHOLD-123'), 'hendelser bærer ALDRI innhold');
});

test('AI-kjeden mot mock: opus-ruting, cachet profil, kostlogg — og budsjettsperre', async () => {
  if (!tilgjengelig) return;
  const svar = await api('ansatt', 'POST', '/api/skriv', { evne: 'purring', tekst: 'purr på Byggmakker' });
  assert.equal(svar.status, 200);
  assert.equal(svar.data.tekst, 'MOCK-UTKAST fra modellen');
  const kall = (await import('node:http')) && aiMock.sisteKall;
  assert.equal(kall.model, 'claude-opus-4-8', 'skrivearbeid bruker kvalitetsmodellen (D6)');
  assert.equal(kall.system[0].cache_control?.type, 'ephemeral', 'profilen er cachet prefiks');
  assert.ok(kall.system[0].text.includes('OP Bygg'), 'tenant-profilen brukes');

  const kost = await api('admin', 'GET', '/api/sentral/ai-kost');
  assert.ok(kost.data.mndKall >= 1 && kost.data.mndOre > 0, 'kostnaden er logget i øre');

  // budsjettsperren: legg en kjempekostnad i loggen → neste kall stoppes med 429
  await eier.query(
    `INSERT INTO ai_logg (org_id, evne, modell, kost_ore) VALUES ($1, 'test', 'claude-opus-4-8', 50000)`,
    [orgA]);
  const sperret = await api('ansatt', 'POST', '/api/skriv', { evne: 'purring', tekst: 'en til' });
  assert.equal(sperret.status, 429, 'budsjettsperren stopper ved taket (500 kr [JONATHAN])');
  await eier.query(`DELETE FROM ai_logg WHERE evne = 'test'`);
});

test('offline-idempotens: samme klient_id gir aldri dobbeltføring', async () => {
  if (!tilgjengelig) return;
  const kid = 'api-idem-1';
  const a = await api('ansatt', 'POST', '/api/dagbok', { prosjekt: 'API-idem', tekst: 'en gang', klient_id: kid });
  const b = await api('ansatt', 'POST', '/api/dagbok', { prosjekt: 'API-idem', tekst: 'en gang', klient_id: kid });
  assert.equal(a.data.linje.id, b.data.linje.id, 'resending ga samme rad');
});

test('godkjenning er autentisert audit-rad — én per bruker per versjon', async () => {
  if (!tilgjengelig) return;
  const en = await api('admin', 'POST', '/api/godkjenninger', { versjon: 'api-v1', stemme: 'godkjent' });
  assert.equal(en.status, 200);
  const ansatt = await api('ansatt', 'POST', '/api/godkjenninger', { versjon: 'api-v1', stemme: 'godkjent' });
  assert.equal(ansatt.status, 403, 'ansatte har ikke stemmerett (ryddig 403; RLS tetter uansett)');
});

test('uten sesjon: 401 på alt lukket', async () => {
  if (!tilgjengelig) return;
  const res = await fetch(URL_ROT + '/api/dagbok');
  assert.equal(res.status, 401);
});

test('NATTSKIFTET: purretrappa er KUN for ledelsen (D22)', async () => {
  if (!tilgjengelig) return;
  const gammelDato = new Date(Date.now() - 50 * 86400000).toISOString().slice(0, 10);
  const ny = await api('leder', 'POST', '/api/fakturaer',
    { kunde: 'Hansen AS', referanse: 'API-1042 · 48 500 kr', forfall: gammelDato });
  assert.equal(ny.status, 200);
  const liste = await api('leder', 'GET', '/api/fakturaer');
  const f = liste.data.fakturaer.find((x) => x.referanse.startsWith('API-1042'));
  assert.equal(f.foreslaatt, 3, '50 dager over forfall → inkassovarsel foreslås');
  const ansatt = await api('ansatt', 'GET', '/api/fakturaer');
  assert.equal(ansatt.status, 403, 'ansatte ser aldri fakturaer');
  const ansattSkriv = await api('ansatt', 'POST', '/api/fakturaer',
    { kunde: 'X', referanse: 'API-nei', forfall: gammelDato });
  assert.equal(ansattSkriv.status, 403, 'ansatte registrerer heller aldri fakturaer');
  // forhåndsvisning: teksten kommer, men statusløpet står stille (inkassoloven
  // § 9 — fristen løper fra faktisk utsendelse, ikke fra at arket ble åpnet)
  const forhaand = await api('leder', 'POST', `/api/fakturaer/${f.id}/purring`, { trinn: 3 });
  assert.ok(forhaand.data.tekst.includes('inkassoloven § 9'), 'inkassovarselet har hjemmelen');
  assert.equal(forhaand.data.faktura.status, 'aapen', 'forhåndsvisning endrer ikke status');
  const purr = await api('leder', 'POST', `/api/fakturaer/${f.id}/purring`, { trinn: 3, registrer: true });
  assert.equal(purr.data.faktura.status, 'varslet', '«registrer sendt» flytter statusløpet');
  const betalt = await api('leder', 'POST', `/api/fakturaer/${f.id}/betalt`);
  assert.equal(betalt.data.faktura.status, 'betalt');
});

test('NATTSKIFTET: tilleggsfangeren — DELT registrering, ledelsens fakturagrunnlag', async () => {
  if (!tilgjengelig) return;
  const ny = await api('ansatt', 'POST', '/api/tillegg',
    { prosjekt: 'API-tillegg', avtalt_med: 'byggherre Berg', tekst: 'flytte sluk 40 cm — på regning' });
  assert.equal(ny.status, 200);
  const kollega = await api('leder', 'GET', '/api/tillegg');
  assert.ok(kollega.data.tillegg.some((t) => t.prosjekt === 'API-tillegg'), 'tillegg er DELT');
  const grunnlag = await api('leder', 'GET', '/api/tillegg/fakturagrunnlag?prosjekt=API-tillegg');
  assert.ok(grunnlag.data.tekst.includes('flytte sluk') && grunnlag.data.antall >= 1);
  const ansattGrunnlag = await api('ansatt', 'GET', '/api/tillegg/fakturagrunnlag?prosjekt=API-tillegg');
  assert.equal(ansattGrunnlag.status, 403, 'fakturagrunnlaget er ledelsens');

  // RLS-vernet fra migration 007: selv med direkte databasetilgang som seg
  // selv kan ikke eieren (ansatt) sette status='fakturert' — databasen nekter.
  const pg = await import('pg');
  const appDb = new pg.default.Client({ connectionString: process.env.DATABASE_URL });
  await appDb.connect();
  try {
    const ansattId = (await eier.query(
      `SELECT id FROM brukere WHERE epost = 'api-ansatt@test.local'`)).rows[0].id;
    await appDb.query('BEGIN');
    await appDb.query(`SELECT set_config('app.org_id', $1, true)`, [orgA]);
    await appDb.query(`SELECT set_config('app.bruker_id', $1, true)`, [ansattId]);
    await appDb.query(`SELECT set_config('app.rolle', 'ansatt', true)`);
    const smugl = await appDb.query(
      `UPDATE tillegg SET status = 'fakturert' WHERE prosjekt = 'API-tillegg' RETURNING id`)
      .then(() => 'slapp gjennom', (feil) => feil.code);
    await appDb.query('ROLLBACK');
    assert.equal(smugl, '42501', 'RLS (007) stopper eieren fra å fakturere selv');
  } finally { await appDb.end(); }
  await eier.query(`DELETE FROM tillegg WHERE prosjekt = 'API-tillegg'`);
});

test('NATTSKIFTET: fristvakta regner månedsklampet (31.12 + 2 mnd = 28.2/29.2)', async () => {
  if (!tilgjengelig) return;
  const ny = await api('ansatt', 'POST', '/api/frister',
    { prosjekt: 'API-frist', overtakelse: '2026-12-31' });
  assert.equal(ny.status, 200);
  const liste = await api('leder', 'GET', '/api/frister');
  const f = liste.data.frister.find((x) => x.prosjekt === 'API-frist');
  assert.equal(f.sluttoppstilling, '2027-02-28', 'aldri 3. mars — kravet er preklusivt');
  assert.equal(f.soksmaal, '2027-08-31');
  await eier.query(`DELETE FROM prosjektfrister WHERE prosjekt = 'API-frist'`);
});

test('NATTSKIFTET: dagbok-autopiloten syr av egne timer + lagets varsler', async () => {
  if (!tilgjengelig) return;
  const iDag = new Date().toISOString().slice(0, 10);
  await api('ansatt', 'POST', '/api/timer', { dato: iDag, prosjekt: 'API-auto', timer: 7.5, notat: 'kledning' });
  await api('leder', 'POST', '/api/varsler',
    { type: 'endringsvarsel', prosjekt: 'API-auto', tekst: 'råte i bæring — varslet samme dag' });
  const auto = await api('ansatt', 'GET', '/api/dagbok/autopilot');
  assert.ok(auto.data.utkast.includes('API-auto — 7.5 t') || auto.data.utkast.includes('API-auto — 7,5 t'),
    'egne timer er med');
  assert.ok(auto.data.utkast.includes('råte i bæring'), 'lagets varsler er med');
  assert.ok(['API-auto', 'API-timer'].includes(auto.data.prosjekt), 'prosjektet hentes fra dagens kilder');
  // en ANNEN brukers autopilot skal IKKE inneholde ansattens timer (PRIVAT)
  const lederAuto = await api('leder', 'GET', '/api/dagbok/autopilot');
  assert.ok(!lederAuto.data.utkast.includes('7.5 t') && !lederAuto.data.utkast.includes('7,5 t'),
    'andres timer syes aldri inn');
  await eier.query(`DELETE FROM varsler WHERE prosjekt = 'API-auto'`);
});

test('NATTSKIFTET 2: prosjektrommet — auto-utledet liste, tidslinje med nivåvern', async () => {
  if (!tilgjengelig) return;
  const iDag = new Date().toISOString().slice(0, 10);
  await api('ansatt', 'POST', '/api/dagbok', { prosjekt: 'API-rom', tekst: 'støpt plate, fint vær' });
  await api('ansatt', 'POST', '/api/tillegg', { prosjekt: 'API-rom', avtalt_med: 'byggherre', tekst: 'ekstra drenering' });
  await api('ansatt', 'POST', '/api/varsler', { type: 'varemottak', prosjekt: 'API-rom', tekst: 'feil dimensjon levert' });
  await api('leder', 'POST', '/api/timer', { dato: iDag, prosjekt: 'API-rom', timer: 3, notat: 'LEDERTIME-HEMMELIG' });

  const liste = await api('ansatt', 'GET', '/api/prosjekter');
  const p = liste.data.prosjekter.find((x) => x.prosjekt === 'API-rom');
  assert.ok(p, 'prosjektet utledes automatisk av registreringene');
  assert.ok(p.dagboklinjer >= 1 && p.aapneTillegg >= 1, 'chips telles');

  // nivåvernet: ansattens tidslinje inneholder ALDRI lederens private timer
  const ansattTl = await api('ansatt', 'GET', '/api/prosjekter/tidslinje?prosjekt=' + encodeURIComponent('API-rom'));
  assert.ok(ansattTl.data.hendelser.some((h) => h.slag === 'dagbok'), 'dagbok er med (DELT)');
  assert.ok(ansattTl.data.hendelser.every((h) => /^\d{4}-\d{2}-\d{2}$/.test(h.dato)),
    'alle hendelser har ISO-dato — også varsler (timestamptz-regresjon)');
  assert.ok(!JSON.stringify(ansattTl.data).includes('LEDERTIME-HEMMELIG'), 'andres timer lekker aldri');
  const lederTl = await api('leder', 'GET', '/api/prosjekter/tidslinje?prosjekt=' + encodeURIComponent('API-rom'));
  assert.ok(JSON.stringify(lederTl.data).includes('LEDERTIME-HEMMELIG'), 'ledelsen ser timene (PRIVAT+LEDELSE)');
});

test('NATTSKIFTET 2: bevisdokumentet — escapet HTML, versjonsspor, aldri timer/økonomi', async () => {
  if (!tilgjengelig) return;
  const ny = await api('ansatt', 'POST', '/api/dagbok',
    { prosjekt: 'API-rom', tekst: 'farlig <script>alert(1)</script> tegn' });
  await api('ansatt', 'PUT', '/api/dagbok/' + ny.data.linje.id,
    { tekst: 'rettet linje uten farlige tegn', versjon: ny.data.linje.versjon });

  const res = await fetch(URL_ROT + '/api/prosjekter/bevis?prosjekt=' + encodeURIComponent('API-rom'),
    { headers: { Cookie: cookies.ansatt } });
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type').includes('text/html'));
  const html = await res.text();
  assert.ok(html.includes('BEVISDOKUMENT'), 'dokumentet genereres');
  assert.ok(!html.includes('<script>alert'), 'brukertekst er escapet — aldri kjørbar');
  assert.ok(html.includes('rettet — versjon 2'), 'rettelser er åpent merket (bevisverdi)');
  assert.ok(!html.includes('LEDERTIME-HEMMELIG'), 'timer holdes utenfor bevisdokumentet');
  const tom = await fetch(URL_ROT + '/api/prosjekter/bevis?prosjekt=API-finnes-ikke',
    { headers: { Cookie: cookies.ansatt } });
  assert.equal(tom.status, 404, 'tomt prosjekt gir ærlig 404');
});

test('NATTSKIFTET 2: ukesrapporten — varianter, rollevern og ekte datagrunnlag', async () => {
  if (!tilgjengelig) return;
  const nekt = await api('ansatt', 'POST', '/api/prosjekter/ukesrapport',
    { prosjekt: 'API-rom', variant: 'ledelse' });
  assert.equal(nekt.status, 403, 'ledelsesvarianten er ledelsens');

  const bh = await api('ansatt', 'POST', '/api/prosjekter/ukesrapport',
    { prosjekt: 'API-rom', variant: 'byggherre' });
  assert.equal(bh.status, 200);
  assert.equal(bh.data.tekst, 'MOCK-UTKAST fra modellen');
  const bhKall = JSON.stringify(aiMock.sisteKall.messages);
  assert.ok(bhKall.includes('BYGGHERRE-varianten'), 'variantinstruksen følger med');
  assert.ok(bhKall.includes('støpt plate'), 'ukens dagbok er datagrunnlaget');
  assert.ok(!bhKall.includes('TIMER DENNE UKEN'), 'byggherre-varianten får aldri timetall');

  const led = await api('leder', 'POST', '/api/prosjekter/ukesrapport',
    { prosjekt: 'API-rom', variant: 'ledelse' });
  assert.equal(led.status, 200);
  assert.ok(JSON.stringify(aiMock.sisteKall.messages).includes('TIMER DENNE UKEN'),
    'ledelsesvarianten har timene i grunnlaget');
});

test('GDPR-sletteretten: admin sletter en ANNENS private data — faktisk (funn-regresjon)', async () => {
  if (!tilgjengelig) return;
  const ansattId = (await eier.query(
    `SELECT id FROM brukere WHERE epost = 'api-ansatt@test.local'`)).rows[0].id;
  const foer = (await eier.query(
    `SELECT count(*)::int AS n FROM timeforinger WHERE bruker_id = $1`, [ansattId])).rows[0].n;
  assert.ok(foer >= 1, 'fixturen har timerader å slette');
  const svar = await api('admin', 'POST', '/api/personvern/slett-bruker',
    { brukerId: ansattId, bekreft: 'SLETT' });
  assert.equal(svar.status, 200);
  assert.ok(svar.data.slettet >= 1, 'slettingen er ikke en stille no-op (sikkerhetsfunnet)');
  const etter = (await eier.query(
    `SELECT count(*)::int AS n FROM timeforinger WHERE bruker_id = $1`, [ansattId])).rows[0].n;
  assert.equal(etter, 0, 'alle timeradene er borte');
});

test('passordflyten: bytte, ledelse-kode og nullstilling [JONATHAN: e-post]', async () => {
  if (!tilgjengelig) return;
  // uten e-postoppsett: /api/glemt svarer vennlig og peker på ledelsen
  const glemt = await api(null, 'POST', '/api/glemt', { epost: 'api-leder@test.local' });
  assert.equal(glemt.status, 200);
  assert.ok(glemt.data.melding.includes('Sentral'), 'reserven forklares når e-post ikke er satt opp');

  // bytte med feil gammelt passord avvises
  const feilBytte = await api('leder', 'POST', '/api/passord', { gammelt: 'feil', nytt: 'nytt-passord-123' });
  assert.equal(feilBytte.status, 400);

  // ledelsen lager nullstillingskode for leder → koden setter nytt passord
  const brukere = await api('admin', 'GET', '/api/sentral/brukere');
  const leder = brukere.data.brukere.find((b) => b.navn === 'Test Leder');
  const kode = await api('admin', 'POST', '/api/sentral/nullstill', { brukerId: leder.id });
  assert.equal(kode.status, 200);
  assert.match(kode.data.kode, /^[a-z2-9]{12}$/);
  const nullstill = await api(null, 'POST', '/api/nullstill',
    { kode: kode.data.kode, passord: 'helt-nytt-passord-1' });
  assert.equal(nullstill.status, 200);
  const gammelInn = await api(null, 'POST', '/api/login',
    { epost: 'api-leder@test.local', passord: PASSORD });
  assert.equal(gammelInn.status, 401, 'gammelt passord virker ikke lenger');
  const nyInn = await api(null, 'POST', '/api/login',
    { epost: 'api-leder@test.local', passord: 'helt-nytt-passord-1' });
  assert.equal(nyInn.status, 200, 'nytt passord virker');
  // engangs: samme kode kan ikke brukes igjen
  const omigjen = await api(null, 'POST', '/api/nullstill',
    { kode: kode.data.kode, passord: 'enda-et-passord-1' });
  assert.equal(omigjen.status, 400);
});

// NB: GDPR-testen over sletter api-ansatt — testene under bruker admin eller
// oppretter egne brukere (ryddes av after() på api-%@test.local-mønsteret).
test('API-gjennomgang: ugyldig id i sti gir 400, ikke Postgres-castfeil og 500', async () => {
  if (!tilgjengelig) return;
  const res = await api('admin', 'GET', '/api/dagbok/ikke-en-uuid');
  assert.equal(res.status, 400);
});

test('API-gjennomgang: ødelagt cookie gir 401, ikke 500', async () => {
  if (!tilgjengelig) return;
  const res = await fetch(URL_ROT + '/api/meg', { headers: { Cookie: 'plattform_sesjon=%E0' } });
  assert.equal(res.status, 401, 'verdien droppes — forespørselen behandles som uinnlogget');
});

test('API-gjennomgang: passordbytte logger ut alle andre sesjoner', async () => {
  if (!tilgjengelig) return;
  const { hashPassord } = await import('../server/auth.js');
  await eier.query(
    `INSERT INTO brukere (org_id, navn, epost, rolle, passord_hash) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (epost) DO UPDATE SET passord_hash = EXCLUDED.passord_hash, aktiv = true`,
    [orgA, 'Test Vakt', 'api-vakt@test.local', 'ansatt', await hashPassord(PASSORD)]);
  const inn = async () => {
    const res = await fetch(URL_ROT + '/api/login', { method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epost: 'api-vakt@test.local', passord: PASSORD }) });
    return res.headers.get('set-cookie').split(';')[0];
  };
  const a = await inn(), b = await inn();
  const bytte = await fetch(URL_ROT + '/api/passord', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: a },
    body: JSON.stringify({ gammelt: PASSORD, nytt: 'byttet-passord-123' }) });
  assert.equal(bytte.status, 200);
  assert.equal((await fetch(URL_ROT + '/api/meg', { headers: { Cookie: b } })).status, 401,
    'den andre sesjonen ryker — «noen andre har passordet» dekkes av byttet');
  assert.equal((await fetch(URL_ROT + '/api/meg', { headers: { Cookie: a } })).status, 200,
    'egen sesjon består');
});

test('API-gjennomgang: AI-kvoten kan settes per tenant i konfigen', async () => {
  if (!tilgjengelig) return;
  // suiten har alt logget >1 øre AI-kost for orgA — en tenant-kvote på 1 øre
  // sperrer. try/finally: konfigen skal aldri bli stående ved testfeil.
  try {
    await eier.query(
      `UPDATE organisasjoner SET konfig = konfig || '{"aiMndBudsjettOre": 1}' WHERE id = $1`, [orgA]);
    const sperret = await api('admin', 'POST', '/api/skriv', { evne: 'purring', tekst: 'kvotetest' });
    assert.equal(sperret.status, 429, 'tenant-kvoten i konfigen vinner over miljøvariabelen');
  } finally {
    await eier.query(
      `UPDATE organisasjoner SET konfig = konfig - 'aiMndBudsjettOre' WHERE id = $1`, [orgA]);
  }
  const aapen = await api('admin', 'POST', '/api/skriv', { evne: 'purring', tekst: 'kvotetest to' });
  assert.equal(aapen.status, 200, 'uten tenant-verdi gjelder miljøvariabelen (reserven)');
});

// SIST med vilje: demperen sperrer IP-en for videre innlogginger i testen.
test('feil passord avvises, og rate-demperen svarer 429 til slutt', async () => {
  if (!tilgjengelig) return;
  let sist = 0;
  for (let i = 0; i < 12; i++) {
    sist = (await api(null, 'POST', '/api/login', { epost: 'api-admin@test.local', passord: 'feil' })).status;
  }
  assert.equal(sist, 429, 'demperen slår inn etter mange forsøk');
});
