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
  assert.equal(ansatt.status, 500, 'ansatte har ikke stemmerett (RLS avviser)');
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
  const purr = await api('leder', 'POST', `/api/fakturaer/${f.id}/purring`, { trinn: 3 });
  assert.ok(purr.data.tekst.includes('inkassoloven § 9'), 'inkassovarselet har hjemmelen');
  assert.equal(purr.data.faktura.status, 'varslet');
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

// SIST med vilje: demperen sperrer IP-en for videre innlogginger i testen.
test('feil passord avvises, og rate-demperen svarer 429 til slutt', async () => {
  if (!tilgjengelig) return;
  let sist = 0;
  for (let i = 0; i < 12; i++) {
    sist = (await api(null, 'POST', '/api/login', { epost: 'api-admin@test.local', passord: 'feil' })).status;
  }
  assert.equal(sist, 429, 'demperen slår inn etter mange forsøk');
});
