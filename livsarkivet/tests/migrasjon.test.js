// Nivå 2 — migrasjonstester: hele migrasjonsrekken kjører rent på en TOM base,
// er idempotent ved ny kjøring, og mister ikke data.
//
// Migrasjonene er forward-only (bevisst, som i kjerne-plattformen): det finnes
// ingen ned-migrasjoner å teste. Kravet «opp/ned uten datatap» dekkes her som
// «opp på tom base + ny oppkjøring uten datatap», og i drift.test.js som
// gjenoppretting fra backup — som er den faktiske veien tilbake.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import pg from 'pg';

const kjor = promisify(execFile);
const ROT = path.resolve(import.meta.dirname, '..');
const EIER_URL = process.env.MIGRATE_DATABASE_URL
  || 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
const TESTBASE = 'livsarkiv_migrasjonstest';

// tabeller/funksjoner som MÅ finnes etter full migrasjonsrekke
const TABELLER = ['tenanter', 'brukere', 'sesjoner', 'invitasjoner', 'revisjon',
  'hvelv', 'kontakter', 'hvelv_elementer', 'mottakermatrise',
  'hendelser', 'hendelse_bekreftelser', 'attester', 'frigivelser', 'varslinger',
  'agent_vurderinger', 'agent_logg', 'abonnementer', 'nullstillinger',
  'hvelv_kryptonokler', 'bruker_nokler', 'element_nokkeldeponi'];

let admin;              // tilkobling til postgres-basen (for CREATE/DROP DATABASE)
let testUrl;
let tilgjengelig = true;

function medBase(url, base) {
  const u = new URL(url);
  u.pathname = '/' + base;
  return u.toString();
}

test.before(async () => {
  admin = new pg.Client({ connectionString: medBase(EIER_URL, 'postgres') });
  try {
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${TESTBASE} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${TESTBASE}`);
  } catch (feil) {
    tilgjengelig = false;
    console.log('Migrasjonstester hoppet over:', feil.message);
    return;
  }
  testUrl = medBase(EIER_URL, TESTBASE);
});

test.after(async () => {
  if (tilgjengelig) {
    await admin.query(`DROP DATABASE IF EXISTS ${TESTBASE} WITH (FORCE)`).catch(() => {});
  }
  await admin?.end().catch(() => {});
});

const hopp = () => !tilgjengelig;

test('hele migrasjonsrekken kjører rent på en tom base', { skip: hopp() }, async () => {
  const { stdout } = await kjor('node', ['server/migrate.js'],
    { cwd: ROT, env: { ...process.env, MIGRATE_DATABASE_URL: testUrl } });
  assert.match(stdout, /Databasen er à jour/);

  const k = new pg.Client({ connectionString: testUrl });
  await k.connect();
  try {
    for (const tabell of TABELLER) {
      const finnes = (await k.query(
        `SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1`, [tabell])).rows.length;
      assert.equal(finnes, 1, `tabellen ${tabell} mangler`);
      // hver datatabell SKAL ha RLS påslått (sesjoner/nullstillinger eies av
      // auth-rollen alene og har ingen app-grants — de er unntaket)
      if (!['sesjoner', 'nullstillinger'].includes(tabell)) {
        const rls = (await k.query(
          `SELECT relrowsecurity FROM pg_class WHERE relname = $1`, [tabell])).rows[0];
        assert.equal(rls.relrowsecurity, true, `${tabell} mangler ENABLE ROW LEVEL SECURITY`);
      }
    }
    // fire-øyne- og krypto-vaktene er skjemanivå, ikke bare app-nivå
    const sjekker = (await k.query(
      `SELECT conname FROM pg_constraint WHERE conname IN ('fire_oyne', 'sensitiv_krever_kryptering')`)).rows;
    assert.equal(sjekker.length, 2, 'CHECK-vaktene fire_oyne og sensitiv_krever_kryptering mangler');
  } finally {
    await k.end();
  }
});

test('ny oppkjøring er idempotent og mister ikke data', { skip: hopp() }, async () => {
  const k = new pg.Client({ connectionString: testUrl });
  await k.connect();
  let brukerId;
  try {
    brukerId = (await k.query(
      `INSERT INTO brukere (navn, epost, passord_hash)
       VALUES ('Migrasjonsfikstur', 'migrasjon@test.no', 'scrypt:x:x') RETURNING id`)).rows[0].id;
    await k.query('INSERT INTO hvelv (eier_id) VALUES ($1)', [brukerId]);
  } finally {
    await k.end();
  }

  // andre gang: ingen migrasjoner skal kjøre på nytt
  const { stdout } = await kjor('node', ['server/migrate.js'],
    { cwd: ROT, env: { ...process.env, MIGRATE_DATABASE_URL: testUrl } });
  assert.ok(!/Kjører \d/.test(stdout), 'migrasjoner kjørte om igjen');

  const k2 = new pg.Client({ connectionString: testUrl });
  await k2.connect();
  try {
    const bruker = await k2.query('SELECT navn FROM brukere WHERE id = $1', [brukerId]);
    assert.equal(bruker.rows.length, 1, 'data forsvant ved ny migrasjonskjøring');
    const hvelv = await k2.query('SELECT 1 FROM hvelv WHERE eier_id = $1', [brukerId]);
    assert.equal(hvelv.rows.length, 1);
    const kjorte = await k2.query('SELECT count(*) AS n FROM migrasjoner');
    assert.ok(Number(kjorte.rows[0].n) >= 8, 'migrasjonsloggen er ufullstendig');
  } finally {
    await k2.end();
  }
});
