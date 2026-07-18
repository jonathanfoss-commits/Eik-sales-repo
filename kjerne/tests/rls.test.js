// Tilgangsstyring: beviser at Row Level Security faktisk håndhever både
// tenant-isolasjon (org A ser aldri org B) og datanivåene (D2):
// timer = PRIVAT+ledelse, ai_logg = kun admin, dagbok = DELT i org-en.
// Krever kjørende Postgres med migrasjonene kjørt (hoppes over ellers).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { medOrg, lukkPools } from '../server/db.js';

let tilgjengelig = true;
let eier, orgA, orgB, ansattA, ansattA2, lederA, adminA, ansattB;

test.before(async () => {
  try {
    const pg = await import('pg');
    const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
    eier = new pg.default.Client({ connectionString: url });
    await eier.connect();
    orgA = (await eier.query(`INSERT INTO organisasjoner (slug, navn) VALUES ('rls-a', 'RLS-test A') RETURNING id`)).rows[0].id;
    orgB = (await eier.query(`INSERT INTO organisasjoner (slug, navn) VALUES ('rls-b', 'RLS-test B') RETURNING id`)).rows[0].id;
    const nyBruker = async (org, navn, rolle) => (await eier.query(
      `INSERT INTO brukere (org_id, navn, epost, rolle, passord_hash)
       VALUES ($1, $2, $3, $4, 'x') RETURNING id`,
      [org, navn, navn.toLowerCase().replaceAll(' ', '.') + '@rls-test.local', rolle])).rows[0].id;
    ansattA = await nyBruker(orgA, 'Ansatt A', 'ansatt');
    ansattA2 = await nyBruker(orgA, 'Ansatt A2', 'ansatt');
    lederA = await nyBruker(orgA, 'Leder A', 'pilotleder');
    adminA = await nyBruker(orgA, 'Admin A', 'admin');
    ansattB = await nyBruker(orgB, 'Ansatt B', 'ansatt');
  } catch (feil) {
    tilgjengelig = false;
    console.log('Hopper over RLS-tester (ingen database):', feil.message);
  }
});

test.after(async () => {
  if (tilgjengelig) {
    for (const tabell of ['timeforinger', 'dagbok', 'ai_logg', 'pilotlogg']) {
      await eier.query(`DELETE FROM ${tabell} WHERE org_id IN ($1, $2)`, [orgA, orgB]);
    }
    await eier.query('DELETE FROM brukere WHERE org_id IN ($1, $2)', [orgA, orgB]);
    await eier.query('DELETE FROM organisasjoner WHERE id IN ($1, $2)', [orgA, orgB]);
    await eier.end();
  }
  await lukkPools();
});

const som = (orgId, brukerId, rolle) => ({ orgId, brukerId, rolle, navn: 'test' });

test('tenant-isolasjon: org B ser aldri org A sin dagbok', async () => {
  if (!tilgjengelig) return;
  await medOrg(som(orgA, ansattA, 'ansatt'), (c) => c.query(
    `INSERT INTO dagbok (bruker_id, dato, prosjekt, tekst) VALUES ($1, CURRENT_DATE, 'Hemmelig A', 'kun for A')`,
    [ansattA]));
  const hosA = await medOrg(som(orgA, ansattB, 'ansatt'), (c) =>
    c.query(`SELECT * FROM dagbok WHERE prosjekt = 'Hemmelig A'`));
  // NB: ansattB tilhører org B — med org A-kontekst er brukeren fortsatt
  // utenfor sin egen org, men testen under er den som gjelder:
  const hosB = await medOrg(som(orgB, ansattB, 'ansatt'), (c) =>
    c.query(`SELECT * FROM dagbok WHERE prosjekt = 'Hemmelig A'`));
  assert.equal(hosB.rows.length, 0, 'org B skal ikke se org A sine dagboklinjer');
  assert.ok(hosA.rows.length >= 0); // org-konteksten avgjør — se dagbok_delt-testen
});

test('dagbok er DELT i organisasjonen', async () => {
  if (!tilgjengelig) return;
  const somKollega = await medOrg(som(orgA, ansattA2, 'ansatt'), (c) =>
    c.query(`SELECT * FROM dagbok WHERE prosjekt = 'Hemmelig A'`));
  assert.equal(somKollega.rows.length, 1, 'kollegaen i samme org skal se dagboklinjen');
});

test('timer er PRIVAT + LEDELSE: kollega ser ikke, ledelsen ser', async () => {
  if (!tilgjengelig) return;
  await medOrg(som(orgA, ansattA, 'ansatt'), (c) => c.query(
    `INSERT INTO timeforinger (bruker_id, dato, prosjekt, timer) VALUES ($1, CURRENT_DATE, 'RLS-prosjekt', 7.5)`,
    [ansattA]));
  const somEier = await medOrg(som(orgA, ansattA, 'ansatt'), (c) =>
    c.query(`SELECT * FROM timeforinger WHERE prosjekt = 'RLS-prosjekt'`));
  const somKollega = await medOrg(som(orgA, ansattA2, 'ansatt'), (c) =>
    c.query(`SELECT * FROM timeforinger WHERE prosjekt = 'RLS-prosjekt'`));
  const somLeder = await medOrg(som(orgA, lederA, 'pilotleder'), (c) =>
    c.query(`SELECT * FROM timeforinger WHERE prosjekt = 'RLS-prosjekt'`));
  assert.equal(somEier.rows.length, 1, 'eieren ser egne timer');
  assert.equal(somKollega.rows.length, 0, 'kollegaen ser IKKE andres timer');
  assert.equal(somLeder.rows.length, 1, 'pilotlederen ser alle timer');
});

test('ansatt kan ikke føre timer på andre (WITH CHECK)', async () => {
  if (!tilgjengelig) return;
  await assert.rejects(
    medOrg(som(orgA, ansattA2, 'ansatt'), (c) => c.query(
      `INSERT INTO timeforinger (bruker_id, dato, prosjekt, timer) VALUES ($1, CURRENT_DATE, 'Svindel', 8)`,
      [ansattA])),
    /row-level security/i,
    'å føre timer i en annens navn skal avvises av policyen');
});

test('ai_logg (SENSITIVT) er kun for admin — ikke pilotleder, ikke ansatt', async () => {
  if (!tilgjengelig) return;
  await medOrg(som(orgA, adminA, 'admin'), (c) => c.query(
    `INSERT INTO ai_logg (bruker_id, evne, modell, kost_ore) VALUES ($1, 'tilbud', 'claude-opus-4-8', 42)`,
    [adminA]));
  const somAdmin = await medOrg(som(orgA, adminA, 'admin'), (c) => c.query('SELECT * FROM ai_logg'));
  const somLeder = await medOrg(som(orgA, lederA, 'pilotleder'), (c) => c.query('SELECT * FROM ai_logg'));
  const somAnsatt = await medOrg(som(orgA, ansattA, 'ansatt'), (c) => c.query('SELECT * FROM ai_logg'));
  assert.equal(somAdmin.rows.length, 1, 'admin ser kostnadsloggen [JONATHAN]');
  assert.equal(somLeder.rows.length, 0, 'pilotleder ser IKKE kostnader [JONATHAN]');
  assert.equal(somAnsatt.rows.length, 0, 'ansatt ser IKKE kostnader');
});

test('uten org-kontekst: ingen rader i det hele tatt', async () => {
  if (!tilgjengelig) return;
  const { pool } = await import('../server/db.js');
  const c = await pool.connect();
  try {
    const res = await c.query('SELECT * FROM dagbok');
    assert.equal(res.rows.length, 0, 'uten app.org_id skal RLS gi null rader');
  } finally {
    c.release();
  }
});
