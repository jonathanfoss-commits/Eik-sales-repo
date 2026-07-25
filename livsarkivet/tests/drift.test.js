// Nivå 6 — drift: backup-gjenoppretting med integritetssjekk, atomisk
// varsling, og feilinjeksjon (e-post nede, nedetid midt i karenstid, samtidige
// feiinger). Kravet som prøves overalt her: TILSTAND SKAL ALDRI GÅ TAPT.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import pg from 'pg';

const kjor = promisify(execFile);
const ROT = path.resolve(import.meta.dirname, '..');

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { medBruker, lukkPools } = await import('../server/db.js');
const { feiKarenstid } = await import('../server/feier.js');
const { koVarsler, sendUtestaaende } = await import('../server/varsling.js');

const EIER_URL = process.env.MIGRATE_DATABASE_URL;
const GJENOPPRETTBASE = 'livsarkiv_restoretest';
const DUMP = path.join(ROT, 'testbevis', 'drift-backup.sql');

let eier, admin;
let tilgjengelig = true;
let evaId, bjornId, adminId, hvelvId, kontaktId, elementId, hendelseId, frigivelseId;
let epostMock, mottattEpost = [];

function medBase(url, base) {
  const u = new URL(url);
  u.pathname = '/' + base;
  return u.toString();
}

// karenstid-sak klar til frigivelse (karenstid_slutt satt i FORTID = utløpt
// mens ingen feide, altså «nedetid»)
async function nyUtloptSak() {
  const h = (await eier.query(
    `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
     VALUES ($1, 'dodsfall', 'manuell', $2) RETURNING id`, [hvelvId, kontaktId])).rows[0];
  const f = (await eier.query(
    `INSERT INTO frigivelser (hendelse_id, hvelv_id, status, karenstid_start, karenstid_slutt)
     VALUES ($1, $2, 'karenstid', now() - interval '49 hours', now() - interval '1 hour')
     RETURNING id`, [h.id, hvelvId])).rows[0];
  return { hendelseId: h.id, frigivelseId: f.id };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: EIER_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Driftstester hoppet over: ingen Postgres');
    return;
  }
  admin = new pg.Client({ connectionString: medBase(EIER_URL, 'postgres') });
  await admin.connect().catch(() => { admin = null; });

  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'drift-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'drift-%@test.no'`);
  evaId = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash)
     VALUES ('Eva Drift', 'drift-eva@test.no', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  bjornId = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash)
     VALUES ('Bjørn Drift', 'drift-bjorn@test.no', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  adminId = (await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash)
     VALUES ('Astrid Drift', 'drift-admin@test.no', 'admin', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  hvelvId = (await eier.query(
    'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [evaId])).rows[0].id;
  kontaktId = (await eier.query(
    `INSERT INTO kontakter (hvelv_id, navn, epost, er_betrodd, bruker_id)
     VALUES ($1, 'Bjørn', 'drift-bjorn@test.no', true, $2) RETURNING id`,
    [hvelvId, bjornId])).rows[0].id;
  elementId = (await eier.query(
    `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel, innhold)
     VALUES ($1, 'praktisk', 'Driftsfikstur', 'Nøkkel under matta') RETURNING id`,
    [hvelvId])).rows[0].id;
  await eier.query(
    'INSERT INTO mottakermatrise (element_id, kontakt_id) VALUES ($1, $2)',
    [elementId, kontaktId]);
  ({ hendelseId, frigivelseId } = await nyUtloptSak());

  // e-postmottaker som kan skrus av og på
  epostMock = http.createServer((req, res) => {
    let kropp = '';
    req.on('data', (b) => { kropp += b; });
    req.on('end', () => {
      mottattEpost.push(JSON.parse(kropp));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"id":"ep_1"}');
    });
  });
  await new Promise((r) => epostMock.listen(3198, '127.0.0.1', r));
});

test.after(async () => {
  epostMock?.close();
  delete process.env.EPOST_API_URL;
  delete process.env.EPOST_API_NOKKEL;
  if (tilgjengelig) await eier.end().catch(() => {});
  await admin?.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// ── Feilinjeksjon 1: nedetid midt i karenstid ──
test('nedetid midt i karenstid: tilstanden består, og neste feiing frigir', { skip: hopp() }, async () => {
  // saken utløp for en time siden — «ingen feide fordi tjenesten var nede»
  const foer = (await eier.query(
    'SELECT status FROM frigivelser WHERE id = $1', [frigivelseId])).rows[0];
  assert.equal(foer.status, 'karenstid', 'tilstanden står urørt etter nedetid');

  const antall = await feiKarenstid();
  assert.ok(antall >= 1);
  const etter = (await eier.query(
    'SELECT status, frigitt_tid FROM frigivelser WHERE id = $1', [frigivelseId])).rows[0];
  assert.equal(etter.status, 'frigitt', 'saken plukkes opp etter nedetid — ikke tapt');
  assert.ok(etter.frigitt_tid);

  // og varselet ligger i kø (fasit), uansett om e-post virket
  const varsler = (await eier.query(
    `SELECT count(*) AS n FROM varslinger
      WHERE hendelse_id = $1 AND type = 'frigivelse_frigitt'`, [hendelseId])).rows[0];
  assert.equal(Number(varsler.n), 2, 'eier + kontakt varslet');
});

// ── Feilinjeksjon 2: atomisitet — rulles tilstanden tilbake, forsvinner varselet ──
test('atomisitet: tilstandsendring og varsling står og faller sammen', { skip: hopp() }, async () => {
  const sak = await nyUtloptSak();
  const klient = await (await import('pg')).default.Client;
  // gjør samme arbeid som feieren, men rull tilbake på slutten
  const c = new klient({ connectionString: process.env.DATABASE_URL
    || 'postgres://livsarkiv_app:app@localhost:5432/livsarkiv' });
  await c.connect();
  try {
    await c.query('BEGIN');
    await c.query("SELECT set_config('app.rolle', 'system', true)");
    await c.query(
      `UPDATE frigivelser SET status = 'frigitt', frigitt_tid = now() WHERE id = $1`,
      [sak.frigivelseId]);
    await c.query('SELECT ko_varsler($1, $2, $3)', [hvelvId, sak.hendelseId, 'frigivelse_frigitt']);
    // her «dør prosessen»
    await c.query('ROLLBACK');
  } finally {
    await c.end();
  }

  const status = (await eier.query(
    'SELECT status FROM frigivelser WHERE id = $1', [sak.frigivelseId])).rows[0].status;
  assert.equal(status, 'karenstid', 'tilstanden er urørt etter avbrutt transaksjon');
  const varsler = (await eier.query(
    'SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1', [sak.hendelseId])).rows[0];
  assert.equal(Number(varsler.n), 0, 'ingen halvferdige varsler ligger igjen');

  // neste feiing gjør jobben helt — begge deler
  await feiKarenstid();
  const etter = (await eier.query(
    'SELECT status FROM frigivelser WHERE id = $1', [sak.frigivelseId])).rows[0].status;
  assert.equal(etter, 'frigitt');
  const varslerEtter = (await eier.query(
    'SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1', [sak.hendelseId])).rows[0];
  assert.equal(Number(varslerEtter.n), 2);
});

// ── Feilinjeksjon 3: e-post nede ──
test('e-post nede: varslene blir liggende i kø og sendes ved neste passering', { skip: hopp() }, async () => {
  const sak = await nyUtloptSak();
  delete process.env.EPOST_API_URL;      // transporten er nede
  delete process.env.EPOST_API_NOKKEL;
  await feiKarenstid();

  const usendte = (await eier.query(
    `SELECT count(*) AS n FROM varslinger
      WHERE hendelse_id = $1 AND sendt_tid IS NULL`, [sak.hendelseId])).rows[0];
  assert.equal(Number(usendte.n), 2, 'varslene ligger i kø, ikke tapt');

  // transporten kommer opp igjen
  mottattEpost = [];
  process.env.EPOST_API_URL = 'http://127.0.0.1:3198/send';
  process.env.EPOST_API_NOKKEL = 'testnokkel';
  const sendt = await sendUtestaaende();
  assert.ok(sendt >= 2, 'køen tømmes når e-post er tilbake');
  assert.ok(mottattEpost.length >= 2);
  assert.ok(!JSON.stringify(mottattEpost).includes('Nøkkel under matta'),
    'varsel-e-post bærer aldri hvelvinnhold');

  const igjen = (await eier.query(
    `SELECT count(*) AS n FROM varslinger
      WHERE hendelse_id = $1 AND sendt_tid IS NULL`, [sak.hendelseId])).rows[0];
  assert.equal(Number(igjen.n), 0);
});

// ── Feilinjeksjon 4: to samtidige feiinger ──
test('samtidige feiinger frigir hver sak nøyaktig én gang', { skip: hopp() }, async () => {
  const saker = [await nyUtloptSak(), await nyUtloptSak(), await nyUtloptSak()];
  const [a, b] = await Promise.all([feiKarenstid(), feiKarenstid()]);
  assert.equal(a + b, saker.length, 'til sammen frigis nøyaktig antallet utløpte saker');
  for (const sak of saker) {
    const varsler = (await eier.query(
      `SELECT count(*) AS n FROM varslinger
        WHERE hendelse_id = $1 AND type = 'frigivelse_frigitt'`, [sak.hendelseId])).rows[0];
    assert.equal(Number(varsler.n), 2, 'ingen dobbeltvarsling ved kappløp');
  }
});

// ── Vaktposten i ko_varsler ──
test('ko_varsler kan ikke misbrukes til å varsle for et fremmed hvelv', { skip: hopp() }, async () => {
  const fremmedId = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash)
     VALUES ('Fremmed Drift', 'drift-fremmed@test.no', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  await assert.rejects(
    medBruker({ brukerId: fremmedId, rolle: 'person' },
      (c) => koVarsler(c, hvelvId, hendelseId, 'hendelse_meldt')),
    /ingen tilgang/i);
});

// ── Backup og gjenoppretting ──
test('backup → gjenoppretting i isolert base: integritet og RLS intakt', { skip: hopp() }, async () => {
  if (!admin) { console.log('  (hoppet over: mangler rettighet til CREATE DATABASE)'); return; }
  fs.mkdirSync(path.dirname(DUMP), { recursive: true });
  const url = new URL(EIER_URL);
  const env = { ...process.env, PGPASSWORD: url.password };
  await kjor('pg_dump', ['-h', url.hostname, '-p', url.port || '5432', '-U', url.username,
    '-d', url.pathname.slice(1), '-f', DUMP], { env, maxBuffer: 64 * 1024 * 1024 });

  await admin.query(`DROP DATABASE IF EXISTS ${GJENOPPRETTBASE} WITH (FORCE)`);
  await admin.query(`CREATE DATABASE ${GJENOPPRETTBASE}`);
  await kjor('psql', ['-h', url.hostname, '-p', url.port || '5432', '-U', url.username,
    '-d', GJENOPPRETTBASE, '-q', '-v', 'ON_ERROR_STOP=1', '-f', DUMP],
    { env, maxBuffer: 64 * 1024 * 1024 });

  const gjenopprettet = new pg.Client({ connectionString: medBase(EIER_URL, GJENOPPRETTBASE) });
  await gjenopprettet.connect();
  try {
    // Integritetssjekk mot DENNE testens fiksturer, ikke globale radtall:
    // testfilene kjører parallelt, så global opptelling ville sammenliknet
    // dumpens øyeblikksbilde med en base andre suiter har skrevet til siden.
    const SPORRINGER = {
      brukere: [`SELECT count(*) AS n FROM brukere WHERE epost LIKE 'drift-%@test.no'`, []],
      hvelv: ['SELECT count(*) AS n FROM hvelv WHERE id = $1', [hvelvId]],
      hvelv_elementer: ['SELECT count(*) AS n FROM hvelv_elementer WHERE hvelv_id = $1', [hvelvId]],
      mottakermatrise: [`SELECT count(*) AS n FROM mottakermatrise m
         JOIN hvelv_elementer e ON e.id = m.element_id WHERE e.hvelv_id = $1`, [hvelvId]],
      hendelser: ['SELECT count(*) AS n FROM hendelser WHERE hvelv_id = $1', [hvelvId]],
      frigivelser: ['SELECT count(*) AS n FROM frigivelser WHERE hvelv_id = $1', [hvelvId]],
      varslinger: ['SELECT count(*) AS n FROM varslinger WHERE hvelv_id = $1', [hvelvId]],
      revisjon: ['SELECT count(*) AS n FROM revisjon WHERE hvelv_id = $1', [hvelvId]],
    };
    for (const [tabell, [sql, params]] of Object.entries(SPORRINGER)) {
      const foer = Number((await eier.query(sql, params)).rows[0].n);
      const etter = Number((await gjenopprettet.query(sql, params)).rows[0].n);
      assert.ok(foer > 0, `fiksturen mangler rader i ${tabell}`);
      assert.equal(etter, foer, `radtall avviker for ${tabell} etter gjenoppretting`);
    }
    // innholdet er der, ikke bare radtallet
    const element = (await gjenopprettet.query(
      'SELECT innhold FROM hvelv_elementer WHERE id = $1', [elementId])).rows[0];
    assert.equal(element.innhold, 'Nøkkel under matta');
  } finally {
    await gjenopprettet.end();
  }

  // funksjonell sjekk: RLS virker fortsatt i den gjenopprettede basen
  const somApp = new pg.Client({ connectionString: medBase(
    process.env.DATABASE_URL || 'postgres://livsarkiv_app:app@localhost:5432/livsarkiv',
    GJENOPPRETTBASE) });
  await somApp.connect();
  try {
    await somApp.query('BEGIN');
    await somApp.query("SELECT set_config('app.bruker_id', $1, true)", [bjornId]);
    await somApp.query("SELECT set_config('app.rolle', 'person', true)");
    // Bjørn er mottaker av ett frigitt element — og skal ikke se noe annet
    const synlige = await somApp.query('SELECT id FROM hvelv_elementer');
    assert.deepEqual(synlige.rows.map((r) => r.id), [elementId],
      'mottakeren ser nøyaktig sitt frigitte element i gjenopprettet base');
    await somApp.query('ROLLBACK');

    // admin (egen bruker, ikke kontakt noe sted) ser fortsatt null hvelvinnhold
    await somApp.query('BEGIN');
    await somApp.query("SELECT set_config('app.bruker_id', $1, true)", [adminId]);
    await somApp.query("SELECT set_config('app.rolle', 'admin', true)");
    const somAdmin = await somApp.query('SELECT id FROM hvelv_elementer');
    assert.equal(somAdmin.rows.length, 0, 'RLS-garantien for admin overlevde gjenopprettingen');
    await somApp.query('ROLLBACK');
  } finally {
    await somApp.end();
  }

  await admin.query(`DROP DATABASE IF EXISTS ${GJENOPPRETTBASE} WITH (FORCE)`);
  fs.rmSync(DUMP, { force: true });
});
