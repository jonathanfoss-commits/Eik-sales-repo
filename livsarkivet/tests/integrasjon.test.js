// Integrasjonsflaten: API-nøkler, selskapets lesetilgang og webhooks.
// Testene prøver å bruke nøkkelen til mer enn den skal rekke — inn i et annet
// selskaps saker, inn i saker som ikke er frigitt, og forbi et tilbaketrekk.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { medBruker, lukkPools } = await import('../server/db.js');
const { nyApiNokkel } = await import('../server/api/selskap.js');
const { signer, sendUtestaaendeWebhooks } = await import('../server/webhook.js');

const PORT = 3415;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

let eier, server, mottaker;
let tilgjengelig = true;
let tenantA, tenantB, nokkelA, nokkelB;
let hvelvA, sakA, hvelvB, sakB, endepunktA, hemmelighetA;
let mottatt = [];

const som = (brukerId, rolle = 'person') => ({ brukerId, rolle });

async function api(sti, nokkel) {
  const svar = await fetch(BASE + sti,
    { headers: nokkel ? { Authorization: `Bearer ${nokkel}` } : {} });
  let data = {};
  try { data = await svar.json(); } catch { /* tomt */ }
  return { status: svar.status, data };
}

// Bygger et hvelv med en frigitt sak og en aktiv deling.
async function nySak(tenantId, epostPrefiks, frigitt) {
  const kunde = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash, tenant_id)
     VALUES ($1, $2, 'scrypt:x:x', $3) RETURNING id`,
    [`Kunde ${epostPrefiks}`, `ig-${epostPrefiks}@test.no`, tenantId])).rows[0].id;
  let hvelvId, kontaktId;
  await medBruker(som(kunde), async (c) => {
    hvelvId = (await c.query(
      'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [kunde])).rows[0].id;
    kontaktId = (await c.query(
      `INSERT INTO kontakter (hvelv_id, navn, epost, er_betrodd)
       VALUES ($1, 'Melder', $2, true) RETURNING id`,
      [hvelvId, `ig-melder-${epostPrefiks}@test.no`])).rows[0].id;
    await c.query(
      `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi)
       VALUES ($1, 'polisenummer', $2)`, [hvelvId, `POL-${epostPrefiks}`]);
  });
  const hendelseId = (await eier.query(
    `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
     VALUES ($1, 'dodsfall', 'manuell', $2) RETURNING id`, [hvelvId, kontaktId])).rows[0].id;
  const sakId = (await eier.query(
    `INSERT INTO frigivelser (hendelse_id, hvelv_id, status, frigitt_tid)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [hendelseId, hvelvId, frigitt ? 'frigitt' : 'karenstid',
      frigitt ? new Date() : null])).rows[0].id;
  return { hvelvId, sakId };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Integrasjonstester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'ig-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'ig-%@test.no'`);
  await eier.query(`DELETE FROM tenanter WHERE slug IN ('ig-alfa', 'ig-beta')`);

  tenantA = (await eier.query(
    `INSERT INTO tenanter (slug, navn) VALUES ('ig-alfa', 'Alfa') RETURNING id`)).rows[0].id;
  tenantB = (await eier.query(
    `INSERT INTO tenanter (slug, navn) VALUES ('ig-beta', 'Beta') RETURNING id`)).rows[0].id;

  const a = nyApiNokkel(); const b = nyApiNokkel();
  nokkelA = a.raa; nokkelB = b.raa;
  for (const [t, n] of [[tenantA, a], [tenantB, b]]) {
    await eier.query(
      `INSERT INTO api_nokler (tenant_id, navn, nokkel_hash, prefiks)
       VALUES ($1, 'test', $2, $3)`, [t, n.hash, n.prefiks]);
  }

  ({ hvelvId: hvelvA, sakId: sakA } = await nySak(tenantA, 'alfa', true));
  ({ hvelvId: hvelvB, sakId: sakB } = await nySak(tenantB, 'beta', true));

  // mottaker for webhooks — en ekte HTTP-server, ikke en mock
  mottaker = http.createServer((req, res) => {
    let kropp = '';
    req.on('data', (d) => { kropp += d; });
    req.on('end', () => {
      mottatt.push({ kropp, headere: req.headers });
      res.writeHead(200).end('{}');
    });
  });
  await new Promise((r) => mottaker.listen(3416, '127.0.0.1', r));

  hemmelighetA = crypto.randomBytes(16).toString('hex');
  endepunktA = (await eier.query(
    `INSERT INTO webhook_endepunkter (tenant_id, url, hemmelighet)
     VALUES ($1, 'http://127.0.0.1:3416/hook', $2) RETURNING id`,
    [tenantA, hemmelighetA])).rows[0].id;

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), LIVSARKIV_TESTMODUS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const frist = Date.now() + 30_000;
  for (;;) {
    try { if ((await fetch(BASE + '/api/helse')).ok) break; } catch { /* venter */ }
    if (Date.now() > frist) throw new Error('Serveren kom aldri opp');
    await new Promise((r) => setTimeout(r, 100));
  }
});

test.after(async () => {
  server?.kill();
  mottaker?.close();
  if (tilgjengelig) {
    await eier.query(`DELETE FROM hvelv WHERE eier_id IN
      (SELECT id FROM brukere WHERE epost LIKE 'ig-%@test.no')`);
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'ig-%@test.no'`);
    await eier.query(`DELETE FROM tenanter WHERE slug IN ('ig-alfa', 'ig-beta')`);
    await eier.end().catch(() => {});
  }
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// ── Autentisering ──
test('uten nøkkel, med tull, og med tilbaketrukket nøkkel: 401', { skip: hopp() }, async () => {
  assert.equal((await api('/api/selskap/saker')).status, 401);
  assert.equal((await api('/api/selskap/saker', 'lva_finnesikkeidethele')).status, 401);
  assert.equal((await api('/api/selskap/saker', 'ikke-engang-riktig-form')).status, 401);

  const d = nyApiNokkel();
  await eier.query(
    `INSERT INTO api_nokler (tenant_id, navn, nokkel_hash, prefiks, tilbaketrukket)
     VALUES ($1, 'død', $2, $3, now())`, [tenantA, d.hash, d.prefiks]);
  assert.equal((await api('/api/selskap/saker', d.raa)).status, 401,
    'tilbaketrukket nøkkel slapp inn');
});

test('nøkkelen lagres aldri i klartekst', { skip: hopp() }, async () => {
  const rader = (await eier.query(
    `SELECT nokkel_hash, prefiks FROM api_nokler WHERE tenant_id = $1`, [tenantA])).rows;
  for (const r of rader) {
    assert.equal(r.nokkel_hash.length, 64, 'skal være en sha256-hash');
    assert.equal(nokkelA.includes(r.nokkel_hash), false);
  }
  assert.equal(rader.some((r) => r.nokkel_hash === sha256(nokkelA)), true);
});

// ── Rekkevidde ──
test('nøkkelen ser KUN egen tenants saker', { skip: hopp() }, async () => {
  const alfa = await api('/api/selskap/saker', nokkelA);
  assert.equal(alfa.status, 200);
  const ider = alfa.data.saker.map((s) => s.sakId);
  assert.ok(ider.includes(sakA), 'Alfa så ikke sin egen sak');
  assert.equal(ider.includes(sakB), false, 'Alfa så Betas sak i listen');

  const direkte = await api(`/api/selskap/saker/${sakB}`, nokkelA);
  assert.equal(direkte.status, 404, 'Alfa hentet Betas sak med sak-id');
});

test('kun FRIGITTE saker er synlige', { skip: hopp() }, async () => {
  const { sakId } = await nySak(tenantA, 'venter', false);
  assert.equal((await api(`/api/selskap/saker/${sakId}`, nokkelA)).status, 404,
    'en sak i karenstid ble eksponert — eieren kan fortsatt stoppe den');
});

test('selskapet får delte felt — og ALDRI hvelvinnhold', { skip: hopp() }, async () => {
  const sak = await api(`/api/selskap/saker/${sakA}`, nokkelA);
  assert.equal(sak.status, 200);
  assert.deepEqual(sak.data.delteFelter, { polisenummer: 'POL-alfa' });
  assert.deepEqual(Object.keys(sak.data).sort(),
    ['delteFelter', 'frigittTid', 'sakId', 'status']);
});

// Den avgjørende: et tilbaketrekk må virke også mot en integrasjon som
// allerede kjenner sak-id-en. Derfor bærer webhooken ingen verdier.
test('tilbaketrekk stenger API-et umiddelbart', { skip: hopp() }, async () => {
  await eier.query(
    `UPDATE selskapsdeling SET trukket_tid = now() WHERE hvelv_id = $1`, [hvelvA]);
  const sak = await api(`/api/selskap/saker/${sakA}`, nokkelA);
  assert.equal(sak.status, 200, 'saken finnes fortsatt');
  assert.deepEqual(sak.data.delteFelter, {}, 'trukket felt ble fortsatt utlevert');
  await eier.query(
    `UPDATE selskapsdeling SET trukket_tid = NULL WHERE hvelv_id = $1`, [hvelvA]);
});

test('misformet sak-id gir 404, ikke 500', { skip: hopp() }, async () => {
  assert.equal((await api('/api/selskap/saker/ikke-en-uuid', nokkelA)).status, 404);
});

// ── Webhooks ──
test('webhook køes i frigivelsestransaksjonen, kun for riktig tenant',
  { skip: hopp() }, async () => {
    await eier.query('DELETE FROM webhook_utsendinger');
    await medBruker({ rolle: 'system' }, (c) =>
      c.query('SELECT ko_webhooks($1, $2, $3)', [hvelvA, sakA, 'arkiv_frigitt']));
    const koe = (await eier.query('SELECT endepunkt_id, nyttelast FROM webhook_utsendinger')).rows;
    assert.equal(koe.length, 1, 'Betas endepunkt skulle ikke fått noe (det har ingen)');
    assert.equal(koe[0].endepunkt_id, endepunktA);
    // Nyttelasten skal IKKE bære personopplysninger
    assert.deepEqual(Object.keys(koe[0].nyttelast).sort(),
      ['hendelse', 'sak_id', 'tidspunkt']);
    assert.equal(JSON.stringify(koe[0].nyttelast).includes('POL-'), false);
  });

test('en vanlig bruker kan ikke utløse webhooks', { skip: hopp() }, async () => {
  const kunde = (await eier.query(
    `SELECT eier_id FROM hvelv WHERE id = $1`, [hvelvA])).rows[0].eier_id;
  await medBruker(som(kunde), async (c) => {
    await assert.rejects(
      c.query('SELECT ko_webhooks($1, $2, $3)', [hvelvA, sakA, 'arkiv_frigitt']),
      /kun system eller saksbehandler/);
  });
});

test('utsending signerer med HMAC og retryer ved feil', { skip: hopp() }, async () => {
  mottatt = [];
  await eier.query('DELETE FROM webhook_utsendinger');
  // Loopback er det ene unntaket fra https-kravet i CHECK-en, nettopp for at
  // denne testen skal kunne kjøre mot en EKTE HTTP-mottaker i stedet for en mock.
  await eier.query(
    `UPDATE webhook_endepunkter SET url = 'http://127.0.0.1:3416/hook' WHERE id = $1`,
    [endepunktA]);
  await medBruker({ rolle: 'system' }, (c) =>
    c.query('SELECT ko_webhooks($1, $2, $3)', [hvelvA, sakA, 'arkiv_frigitt']));

  const sendt = await sendUtestaaendeWebhooks();
  assert.equal(sendt, 1);
  assert.equal(mottatt.length, 1);
  const { kropp, headere } = mottatt[0];
  const tidsstempel = headere['x-livsarkivet-tidsstempel'];
  assert.ok(tidsstempel, 'tidsstempel mangler — uten det kan kallet spilles av på nytt');
  assert.equal(headere['x-livsarkivet-signatur'],
    signer(hemmelighetA, tidsstempel, kropp), 'signaturen stemmer ikke');
  // og den er merket som sendt, så neste passering ikke gjentar den
  const igjen = (await eier.query(
    'SELECT sendt_tid FROM webhook_utsendinger')).rows[0];
  assert.ok(igjen.sendt_tid);
  assert.equal(await sendUtestaaendeWebhooks(), 0, 'sendt webhook ble sendt på nytt');
});

test('feilet utsending blir liggende med tilbaketrekning, ikke tapt',
  { skip: hopp() }, async () => {
    await eier.query('DELETE FROM webhook_utsendinger');
    await eier.query(
      `UPDATE webhook_endepunkter SET url = 'http://127.0.0.1:1/dodt' WHERE id = $1`,
      [endepunktA]);
    await medBruker({ rolle: 'system' }, (c) =>
      c.query('SELECT ko_webhooks($1, $2, $3)', [hvelvA, sakA, 'arkiv_frigitt']));
    assert.equal(await sendUtestaaendeWebhooks(), 0);
    const rad = (await eier.query(
      'SELECT forsok, sendt_tid, siste_feil, neste_forsok > now() AS venter FROM webhook_utsendinger')).rows[0];
    assert.equal(rad.sendt_tid, null, 'en feilet utsending må IKKE merkes sendt');
    assert.equal(rad.forsok, 1);
    assert.ok(rad.siste_feil, 'feilen skal spores for drift');
    assert.equal(rad.venter, true, 'neste forsøk skal være skjøvet fram i tid');
  });
