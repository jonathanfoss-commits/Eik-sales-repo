// Delingslaget: kunden deler UTVALGTE felt med sitt eget selskap.
// Testene prøver å få ut mer enn kunden har delt — fra nabo-selskapet, fra
// plattformdriften, og etter at kunden har trukket delingen tilbake.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { medBruker, lukkPools } = await import('../server/db.js');
const { hashPassord } = await import('../server/auth.js');

const PORT = 3413;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

let eier, server;
let tilgjengelig = true;
let tenantA, adminA, adminB, plattformAdmin, kundeA, hvelvA;

const som = (brukerId, rolle = 'person') => ({ brukerId, rolle });

function jar() { return { cookie: '' }; }
async function api(j, metode, sti, kropp) {
  const svar = await fetch(BASE + sti, {
    method: metode,
    headers: { 'Content-Type': 'application/json', ...(j?.cookie ? { Cookie: j.cookie } : {}) },
    body: kropp === undefined ? undefined : JSON.stringify(kropp) });
  const satt = svar.headers.get('set-cookie');
  if (satt && j) j.cookie = satt.split(';')[0];
  let data = {};
  try { data = await svar.json(); } catch { /* tomt */ }
  return { status: svar.status, data };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Delingstester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'dl-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'dl-%@test.no'`);
  await eier.query(`DELETE FROM tenanter WHERE slug IN ('dl-alfa', 'dl-beta')`);

  tenantA = (await eier.query(
    `INSERT INTO tenanter (slug, navn) VALUES ('dl-alfa', 'Alfa Livsforsikring') RETURNING id`
  )).rows[0].id;
  const tenantB = (await eier.query(
    `INSERT INTO tenanter (slug, navn) VALUES ('dl-beta', 'Beta Livsforsikring') RETURNING id`
  )).rows[0].id;
  const plattform = (await eier.query(`SELECT standard_tenant() AS id`)).rows[0].id;

  const nyBruker = async (navn, epost, rolle, tenant) => (await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, tenant_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [navn, epost, rolle, await hashPassord('passord1234'), tenant])).rows[0].id;

  adminA = await nyBruker('Alfa-saksbehandler', 'dl-admin-a@test.no', 'admin', tenantA);
  adminB = await nyBruker('Beta-saksbehandler', 'dl-admin-b@test.no', 'admin', tenantB);
  plattformAdmin = await nyBruker('Plattformdrift', 'dl-admin-p@test.no', 'admin', plattform);
  kundeA = await nyBruker('Kunde hos Alfa', 'dl-kunde-a@test.no', 'person', tenantA);

  await medBruker(som(kundeA), async (c) => {
    hvelvA = (await c.query(
      'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [kundeA])).rows[0].id;
  });

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1', LIVSARKIV_TESTMODUS: '1' },
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
  if (tilgjengelig) {
    await eier.query(`DELETE FROM hvelv WHERE eier_id IN
      (SELECT id FROM brukere WHERE epost LIKE 'dl-%@test.no')`);
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'dl-%@test.no'`);
    await eier.query(`DELETE FROM tenanter WHERE slug IN ('dl-alfa', 'dl-beta')`);
    await eier.end().catch(() => {});
  }
  await lukkPools();
});

const hopp = () => !tilgjengelig;

async function delSom(kundeId, felttype, verdi) {
  return medBruker(som(kundeId), (c) => c.query(
    `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi) VALUES ($1, $2, $3) RETURNING id`,
    [hvelvA, felttype, verdi]));
}

test('kundens eget selskap ser KUN det kunden har delt', { skip: hopp() }, async () => {
  await delSom(kundeA, 'polisenummer', 'POL-553-2291');
  await medBruker(som(adminA, 'admin'), async (c) => {
    const rader = (await c.query(
      'SELECT felttype, verdi FROM selskapsdeling WHERE hvelv_id = $1', [hvelvA])).rows;
    assert.deepEqual(rader, [{ felttype: 'polisenummer', verdi: 'POL-553-2291' }]);
  });
});

test('nabo-selskapet ser ingenting', { skip: hopp() }, async () => {
  await medBruker(som(adminB, 'admin'), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM selskapsdeling WHERE hvelv_id = $1', [hvelvA])).rows.length, 0);
  });
});

// Den viktigste avgrensningen i hele leveransen: dette er kundens data delt
// med SITT selskap, ikke saksmetadata plattformen trenger for å drifte.
test('plattformdriften ser IKKE delte felt', { skip: hopp() }, async () => {
  await medBruker(som(plattformAdmin, 'admin'), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM selskapsdeling WHERE hvelv_id = $1', [hvelvA])).rows.length, 0,
    'Plattformdriften leste kundens polisenummer');
  });
});

test('tilbaketrekk håndheves i basen, ikke i appen', { skip: hopp() }, async () => {
  // Trekk direkte i basen som eier — selskapet skal miste raden umiddelbart,
  // uten at noen WHERE i applikasjonskoden er involvert.
  await medBruker(som(kundeA), (c) => c.query(
    `UPDATE selskapsdeling SET trukket_tid = now() WHERE hvelv_id = $1`, [hvelvA]));
  await medBruker(som(adminA, 'admin'), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM selskapsdeling WHERE hvelv_id = $1', [hvelvA])).rows.length, 0,
    'Selskapet så en trukket deling');
  });
  // men historikken finnes fortsatt for eieren og for revisjon
  const igjen = (await eier.query(
    'SELECT trukket_tid FROM selskapsdeling WHERE hvelv_id = $1', [hvelvA])).rows;
  assert.equal(igjen.length, 1);
  assert.ok(igjen[0].trukket_tid, 'historikken skal beholdes, ikke slettes');
});

test('selskapet kan ikke selv legge inn en deling på kundens vegne', { skip: hopp() }, async () => {
  await medBruker(som(adminA, 'admin'), async (c) => {
    await assert.rejects(c.query(
      `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi)
       VALUES ($1, 'begunstiget', 'Selskapet selv')`, [hvelvA]),
    /row-level security/);
  });
});

test('selskapet kan ikke omgjøre et tilbaketrekk', { skip: hopp() }, async () => {
  await medBruker(som(adminA, 'admin'), async (c) => {
    const res = await c.query(
      `UPDATE selskapsdeling SET trukket_tid = NULL WHERE hvelv_id = $1 RETURNING id`, [hvelvA]);
    assert.equal(res.rows.length, 0, 'Selskapet gjenopplivet en trukket deling');
  });
});

test('bare de fire definerte felttypene godtas', { skip: hopp() }, async () => {
  await medBruker(som(kundeA), async (c) => {
    await assert.rejects(c.query(
      `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi)
       VALUES ($1, 'fodselsnummer', '01019012345')`, [hvelvA]),
    /selskapsdeling_felttype_check/);
  });
});

// ── Over API-et, slik kunden faktisk møter det ──
test('API: dele, se, endre verdi og trekke tilbake', { skip: hopp() }, async () => {
  const kunde = jar();
  await api(kunde, 'POST', '/api/auth/logg-inn',
    { epost: 'dl-kunde-a@test.no', passord: 'passord1234' });

  const tomt = await api(kunde, 'GET', '/api/deling');
  assert.equal(tomt.status, 200);
  assert.equal(tomt.data.selskap.navn, 'Alfa Livsforsikring',
    'kunden må se HVEM hen deler med');

  assert.equal((await api(kunde, 'POST', '/api/deling',
    { felttype: 'polisenummer', verdi: 'POL-1' })).status, 200);
  // ny verdi på samme felt skal erstatte, ikke feile på det unike indekset
  assert.equal((await api(kunde, 'POST', '/api/deling',
    { felttype: 'polisenummer', verdi: 'POL-2' })).status, 200);

  const etter = await api(kunde, 'GET', '/api/deling');
  const aktive = etter.data.delinger.filter((d) => d.felttype === 'polisenummer');
  assert.equal(aktive.length, 1, 'kun én aktiv deling per felttype');
  assert.equal(aktive[0].verdi, 'POL-2');

  assert.equal((await api(kunde, 'DELETE', `/api/deling/${aktive[0].id}`)).status, 200);
  assert.equal((await api(kunde, 'DELETE', `/api/deling/${aktive[0].id}`)).status, 404,
    'dobbelt tilbaketrekk skal ikke late som det gjorde noe');

  const tilSlutt = await api(kunde, 'GET', '/api/deling');
  assert.equal(tilSlutt.data.delinger.length, 0);
});

test('API: ukjent felttype og tom verdi avvises', { skip: hopp() }, async () => {
  const kunde = jar();
  await api(kunde, 'POST', '/api/auth/logg-inn',
    { epost: 'dl-kunde-a@test.no', passord: 'passord1234' });
  assert.equal((await api(kunde, 'POST', '/api/deling',
    { felttype: 'fodselsnummer', verdi: '01019012345' })).status, 400);
  assert.equal((await api(kunde, 'POST', '/api/deling',
    { felttype: 'polisenummer', verdi: '   ' })).status, 400);
  assert.equal((await api(kunde, 'POST', '/api/deling',
    { felttype: 'polisenummer', verdi: 'x'.repeat(201) })).status, 400);
});

test('revisjonsloggen bærer felttypen, ALDRI verdien', { skip: hopp() }, async () => {
  const rader = (await eier.query(
    `SELECT hendelse, detaljer FROM revisjon
      WHERE hvelv_id = $1 AND hendelse LIKE 'deling_%' ORDER BY id`, [hvelvA])).rows;
  assert.ok(rader.length >= 2, 'både deling og tilbaketrekk skal logges');
  for (const rad of rader) {
    assert.ok(rad.detaljer.felttype, 'felttypen skal stå i loggen');
    assert.equal(JSON.stringify(rad.detaljer).includes('POL-'), false,
      'verdien skal ALDRI i revisjonsloggen');
  }
});
