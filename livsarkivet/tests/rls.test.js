// RLS-suiten: beviser at policyene — ikke applikasjonskoden — er muren.
// Kjøres mot ekte Postgres (eier-tilkobling for seeding, app-rollen for
// spørringene). Uten tilgjengelig database hopper testene over seg selv.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { medBruker, lukkPools } = await import('../server/db.js');

let eier;               // eier-tilkobling (seeding, opprydding)
let tilgjengelig = true;
// testbrukere
let evaId, bjornId, adminId, admin2Id, kariId; // personer
let hvelvA;                                    // Evas hvelv
let elementA, kontaktKari;                     // Evas element + kontakt (Kari=Bjørn)

const som = (brukerId, rolle = 'person') => ({ brukerId, rolle });

async function nyBruker(navn, epost, rolle = 'person') {
  return (await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash) VALUES ($1, $2, $3, 'scrypt:x:x')
     ON CONFLICT (epost) DO UPDATE SET navn = EXCLUDED.navn RETURNING id`,
    [navn, epost, rolle])).rows[0].id;
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('RLS-tester hoppet over: ingen Postgres på MIGRATE_DATABASE_URL');
    return;
  }
  // rene fikstur-brukere (rls-test-prefiks, ryddes først — hvelv før brukere pga. FK)
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'rls-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'rls-%@test.no'`);
  evaId = await nyBruker('Eva RLS', 'rls-eva@test.no');
  bjornId = await nyBruker('Bjørn RLS', 'rls-bjorn@test.no');
  adminId = await nyBruker('Astrid Admin', 'rls-admin@test.no', 'admin');
  admin2Id = await nyBruker('Arne Admin', 'rls-admin2@test.no', 'admin');

  // Eva bygger hvelvet sitt GJENNOM app-rollen (policyene skal slippe eier til)
  await medBruker(som(evaId), async (c) => {
    hvelvA = (await c.query(
      'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [evaId])).rows[0].id;
    elementA = (await c.query(
      `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel, innhold)
       VALUES ($1, 'praktisk', 'Hemmelig A', 'Bare for Evas mottakere') RETURNING id`,
      [hvelvA])).rows[0].id;
    kontaktKari = (await c.query(
      `INSERT INTO kontakter (hvelv_id, navn, epost, er_betrodd)
       VALUES ($1, 'Kari (Bjørn)', 'rls-bjorn@test.no', true) RETURNING id`,
      [hvelvA])).rows[0].id;
  });
  // Bjørn er personen bak kontakten Kari (koblingen system-rollen gjør ved innløsning)
  await medBruker({ rolle: 'system' }, (c) =>
    c.query('UPDATE kontakter SET bruker_id = $2 WHERE id = $1', [kontaktKari, bjornId]));
});

test.after(async () => {
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// ── Kryssbruker-isolasjon ──
test('fremmed bruker ser null av eierens elementer', { skip: hopp() }, async () => {
  const hosBjorn = await medBruker(som(bjornId), (c) =>
    c.query(`SELECT * FROM hvelv_elementer WHERE tittel = 'Hemmelig A'`));
  assert.equal(hosBjorn.rows.length, 0);
});

test('fremmed bruker ser ikke eierens kontakter eller matrise', { skip: hopp() }, async () => {
  // (Bjørn ser sin EGEN kontaktrad — men ikke Evas øvrige kontaktregister)
  const kontakter = await medBruker(som(bjornId), (c) =>
    c.query('SELECT * FROM kontakter WHERE hvelv_id = $1 AND bruker_id IS DISTINCT FROM $2',
      [hvelvA, bjornId]));
  assert.equal(kontakter.rows.length, 0);
  const matrise = await medBruker(som(bjornId), (c) => c.query('SELECT * FROM mottakermatrise'));
  assert.equal(matrise.rows.length, 0);
});

test('fremmed bruker kan ikke skrive inn i eierens hvelv', { skip: hopp() }, async () => {
  await assert.rejects(
    medBruker(som(bjornId), (c) => c.query(
      `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel) VALUES ($1, 'praktisk', 'Innbrudd')`,
      [hvelvA])),
    /row-level security/i);
});

test('fremmed bruker kan ikke legge rader i eierens matrise', { skip: hopp() }, async () => {
  await assert.rejects(
    medBruker(som(bjornId), (c) => c.query(
      'INSERT INTO mottakermatrise (element_id, kontakt_id) VALUES ($1, $2)',
      [elementA, kontaktKari])),
    /row-level security/i);
});

// ── Admin: saksbehandler, aldri innsyn i hvelvinnhold ──
test('admin ser NULL rader i hvelv_elementer — strukturelt, ikke filtrert', { skip: hopp() }, async () => {
  const res = await medBruker(som(adminId, 'admin'), (c) => c.query('SELECT * FROM hvelv_elementer'));
  assert.equal(res.rows.length, 0);
});

test('admin ser kontakter (verifiserings-metadata) men ikke brukere', { skip: hopp() }, async () => {
  const kontakter = await medBruker(som(adminId, 'admin'), (c) =>
    c.query('SELECT navn FROM kontakter WHERE id = $1', [kontaktKari]));
  assert.equal(kontakter.rows.length, 1);
  const brukere = await medBruker(som(adminId, 'admin'), (c) =>
    c.query('SELECT navn FROM brukere WHERE id = $1', [evaId]));
  assert.equal(brukere.rows.length, 0);
});

test('app-rollen kan aldri lese passord-hash — kolonnen er ikke grantet', { skip: hopp() }, async () => {
  await assert.rejects(
    medBruker(som(evaId), (c) => c.query('SELECT passord_hash FROM brukere WHERE id = $1', [evaId])),
    /permission denied/i);
});

// ── Uten kontekst: ingenting ──
test('uten brukerkontekst gis null rader overalt', { skip: hopp() }, async () => {
  // medBruker krever gyldig kontekst — gå via system-rollen uten bruker-id,
  // som ikke har SELECT-policyer på hvelvdata
  const res = await medBruker({ rolle: 'system' }, (c) => c.query('SELECT * FROM hvelv_elementer'));
  assert.equal(res.rows.length, 0);
});

// ── Revisjonsloggen er immutabel ──
test('revisjon: INSERT går, UPDATE og DELETE avvises med permission denied', { skip: hopp() }, async () => {
  await medBruker(som(evaId), (c) => c.query(
    `INSERT INTO revisjon (bruker_id, rolle, hvelv_id, hendelse) VALUES ($1, 'person', $2, 'rls_test')`,
    [evaId, hvelvA]));
  await assert.rejects(
    medBruker(som(evaId), (c) => c.query(`UPDATE revisjon SET hendelse = 'omskrevet'`)),
    /permission denied/i);
  await assert.rejects(
    medBruker(som(adminId, 'admin'), (c) => c.query('DELETE FROM revisjon')),
    /permission denied/i);
});

// ── Frigivelses-portingen: mottaker ser INGENTING før frigitt, og NØYAKTIG
//    matrisens ikke-sensitive elementer etter ──
let frigivelseId, hendelseId, elementSensitiv, elementUmappet;

test('frigivelsesflyt: oppsett (hendelse meldes GJENNOM policyene)', { skip: hopp() }, async () => {
  // fikstur via eier: sensitivt element (API-et sperrer, RLS må likevel holde)
  // + et umappet element
  elementSensitiv = (await eier.query(
    `INSERT INTO hvelv_elementer (hvelv_id, kategori, nivaa, tittel, innhold, kryptert, nokkel_ref)
     VALUES ($1, 'tilgangsinfo', 'sensitiv', 'Hovedpassord',
             '{"iv":"x","ct":"chiffertekst"}', true, '{"iv":"y","ct":"pakketnokkel"}')
     RETURNING id`, [hvelvA])).rows[0].id;
  elementUmappet = (await eier.query(
    `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel, innhold)
     VALUES ($1, 'juridisk', 'Umappet', 'Ikke til Kari') RETURNING id`,
    [hvelvA])).rows[0].id;
  await eier.query(
    `INSERT INTO mottakermatrise (element_id, kontakt_id) VALUES ($1, $3), ($2, $3)`,
    [elementA, elementSensitiv, kontaktKari]);

  // Bjørn (betrodd) melder gjennom app-rollen — policyene slipper det gjennom
  await medBruker(som(bjornId), async (c) => {
    hendelseId = (await c.query(
      `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
       VALUES ($1, 'dodsfall', 'manuell', $2) RETURNING id`,
      [hvelvA, kontaktKari])).rows[0].id;
    frigivelseId = (await c.query(
      `INSERT INTO frigivelser (hendelse_id, hvelv_id) VALUES ($1, $2) RETURNING id`,
      [hendelseId, hvelvA])).rows[0].id;
  });
});

test('betrodd kontakt kan IKKE melde med annen kilde enn manuell', { skip: hopp() }, async () => {
  await assert.rejects(
    medBruker(som(bjornId), (c) => c.query(
      `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
       VALUES ($1, 'dodsfall', 'folkeregisteret', $2)`, [hvelvA, kontaktKari])),
    /row-level security/i);
});

test('før frigivelse: mottakeren ser fortsatt ingenting', { skip: hopp() }, async () => {
  const res = await medBruker(som(bjornId), (c) =>
    c.query('SELECT * FROM hvelv_elementer WHERE hvelv_id = $1', [hvelvA]));
  assert.equal(res.rows.length, 0);
});

test('eier kan IKKE blokkere utenfor karenstid (policy gir 0 rader)', { skip: hopp() }, async () => {
  const res = await medBruker(som(evaId), (c) => c.query(
    `UPDATE frigivelser SET status = 'blokkert' WHERE id = $1`, [frigivelseId]));
  assert.equal(res.rowCount, 0);
});

test('melder kan KUN sette tilbakekalt — aldri frigitt', { skip: hopp() }, async () => {
  await assert.rejects(
    medBruker(som(bjornId), (c) => c.query(
      `UPDATE frigivelser SET status = 'frigitt' WHERE id = $1`, [frigivelseId])),
    /row-level security/i);
});

test('i karenstid: eier får KUN sette blokkert — frigitt avvises', { skip: hopp() }, async () => {
  await eier.query(
    `UPDATE frigivelser SET status = 'karenstid',
       karenstid_start = now(), karenstid_slutt = now() + interval '1 hour' WHERE id = $1`,
    [frigivelseId]);
  await assert.rejects(
    medBruker(som(evaId), (c) => c.query(
      `UPDATE frigivelser SET status = 'frigitt' WHERE id = $1`, [frigivelseId])),
    /row-level security/i);
  const blokkert = await medBruker(som(evaId), (c) => c.query(
    `UPDATE frigivelser SET status = 'blokkert' WHERE id = $1`, [frigivelseId]));
  assert.equal(blokkert.rowCount, 1);
});

test('etter frigitt: mottakeren ser NØYAKTIG matrisens elementer — sensitivt kun som chiffertekst', { skip: hopp() }, async () => {
  await eier.query(`UPDATE frigivelser SET status = 'frigitt' WHERE id = $1`, [frigivelseId]);
  const res = await medBruker(som(bjornId), (c) =>
    c.query('SELECT id, kryptert, innhold FROM hvelv_elementer WHERE hvelv_id = $1 ORDER BY opprettet', [hvelvA]));
  assert.deepEqual(res.rows.map((r) => r.id).sort(), [elementA, elementSensitiv].sort(),
    'de to mappede elementene — og bare de');
  // det sensitive elementet frigis KRYPTERT (nøkkelen går kun via deponiet)
  const sensitiv = res.rows.find((r) => r.id === elementSensitiv);
  assert.equal(sensitiv.kryptert, true);
  assert.ok(sensitiv.innhold.includes('chiffertekst'));
  const umappet = await medBruker(som(bjornId), (c) =>
    c.query('SELECT 1 FROM hvelv_elementer WHERE id = $1', [elementUmappet]));
  assert.equal(umappet.rows.length, 0);
  // uten frigitt sak: deponi-tabellen gir mottakeren null rader (egen negativ
  // dekkes strukturelt av policy-uttrykket element_frigitt_for_meg)
});

test('admin ser fortsatt null hvelvinnhold — selv etter frigivelse', { skip: hopp() }, async () => {
  const res = await medBruker(som(adminId, 'admin'), (c) => c.query('SELECT * FROM hvelv_elementer'));
  assert.equal(res.rows.length, 0);
});

test('fire-øyne-CHECKen holder selv for databaseeieren', { skip: hopp() }, async () => {
  await assert.rejects(
    eier.query(
      `UPDATE frigivelser SET godkjent_1_av = $2, godkjent_2_av = $2 WHERE id = $1`,
      [frigivelseId, adminId]),
    /fire_oyne/);
});

test('betrodd kontakt ser hvelvet og eierens navn — men ikke innholdet', { skip: hopp() }, async () => {
  const hvelv = await medBruker(som(bjornId), (c) =>
    c.query('SELECT id FROM hvelv WHERE id = $1', [hvelvA]));
  assert.equal(hvelv.rows.length, 1);
  const eierNavn = await medBruker(som(bjornId), (c) =>
    c.query('SELECT navn FROM brukere WHERE id = $1', [evaId]));
  assert.equal(eierNavn.rows.length, 1);
  // (elementA er nå frigitt til ham — men ufrigitt innhold er fortsatt stengt)
  const innhold = await medBruker(som(bjornId), (c) =>
    c.query('SELECT * FROM hvelv_elementer WHERE id = $1', [elementUmappet]));
  assert.equal(innhold.rows.length, 0);
});
