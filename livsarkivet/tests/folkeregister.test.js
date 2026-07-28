// Folkeregister-triggeren. Den viktigste testen her er ikke at det VIRKER,
// men at det ikke virker for godt: en offisiell kilde skal opprette en sak til
// verifisering — ikke frigi noe, ikke hoppe over fire øyne, ikke omgå
// karenstiden eller eierens nødbrems.
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';
process.env.FNR_PEPPER ||= 'test-pepper-som-ikke-er-hemmelig';
process.env.FOLKEREGISTER_URL ||= 'https://folkeregister.test/dodsfall';

const { medBruker, lukkPools } = await import('../server/db.js');
const { fnrHash, ingestDodsfall } = await import('../server/folkeregister.js');

let eier;
let tilgjengelig = true;
let kundeId, hvelvA;
const FNR = '01019012345';

const som = (brukerId, rolle = 'person') => ({ brukerId, rolle });
// Fast kilde i stedet for et ekte oppslag: løpet nedstrøms er det samme.
const kilde = (rader) => async () => rader;

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Folkeregistertester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'fr-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'fr-%@test.no'`);

  kundeId = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash, fnr_hash)
     VALUES ('Kari Folkeregister', 'fr-kari@test.no', 'scrypt:x:x', $1) RETURNING id`,
    [fnrHash(FNR)])).rows[0].id;
  await medBruker(som(kundeId), async (c) => {
    hvelvA = (await c.query(
      'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [kundeId])).rows[0].id;
    await c.query(
      `INSERT INTO kontakter (hvelv_id, navn, epost, er_betrodd)
       VALUES ($1, 'Bjørn', 'fr-bjorn@test.no', true)`, [hvelvA]);
  });
});

test.after(async () => {
  if (tilgjengelig) {
    await eier.query(`DELETE FROM folkeregister_hendelser WHERE fnr_hash = $1`, [fnrHash(FNR)]);
    await eier.query(`DELETE FROM hvelv WHERE eier_id IN
      (SELECT id FROM brukere WHERE epost LIKE 'fr-%@test.no')`);
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'fr-%@test.no'`);
    await eier.end().catch(() => {});
  }
  await lukkPools();
});

const hopp = () => !tilgjengelig;

test('hashen er nøklet, stabil og avviser tull', { skip: hopp() }, async () => {
  assert.equal(fnrHash(FNR), fnrHash('010190 12345'), 'formatering skal ikke telle');
  assert.notEqual(fnrHash(FNR), fnrHash('01019012346'));
  assert.equal(fnrHash('123'), null, 'for kort skal avvises');
  assert.equal(fnrHash(''), null);
  // hashen skal ikke være et rått fødselsnummer noe sted
  assert.equal(fnrHash(FNR).includes(FNR), false);
  assert.equal(fnrHash(FNR).length, 64);

  // uten pepper skal INGENTING kunne matches — ellers ville en feilkonfigurert
  // server matchet på en forutsigbar sha256
  const pepper = process.env.FNR_PEPPER;
  delete process.env.FNR_PEPPER;
  assert.equal(fnrHash(FNR), null, 'uten pepper skal hashen nekte å svare');
  process.env.FNR_PEPPER = pepper;
});

test('et dødsfall fra registeret oppretter sak til VERIFISERING — ikke frigivelse',
  { skip: hopp() }, async () => {
    const res = await ingestDodsfall(new Date(),
      kilde([{ hash: fnrHash(FNR), dodsdato: '2026-07-20' }]));
    assert.equal(res.opprettet, 1);

    const sak = (await eier.query(
      `SELECT f.status, h.kilde, h.meldt_av_kontakt_id, f.godkjent_1_av, f.karenstid_slutt
         FROM frigivelser f JOIN hendelser h ON h.id = f.hendelse_id
        WHERE f.hvelv_id = $1`, [hvelvA])).rows;
    assert.equal(sak.length, 1);
    assert.equal(sak[0].status, 'under_verifisering', 'saken skal IKKE være frigitt');
    assert.equal(sak[0].kilde, 'folkeregisteret');
    assert.equal(sak[0].meldt_av_kontakt_id, null, 'ingen kontakt meldte dette');
    assert.equal(sak[0].godkjent_1_av, null, 'fire øyne gjenstår');
    assert.equal(sak[0].karenstid_slutt, null, 'karenstiden starter først ved andre signatur');
  });

test('eier og alle kontakter varsles — nødbremsen er verdiløs uten', { skip: hopp() }, async () => {
  const antall = (await eier.query(
    `SELECT count(*)::int AS n FROM varslinger WHERE hvelv_id = $1 AND type = 'hendelse_meldt'`,
    [hvelvA])).rows[0].n;
  assert.equal(antall, 2, 'eieren og den betrodde kontakten skal begge ha fått varsel');
});

test('samme dødsfall igjen lager ikke en sak til', { skip: hopp() }, async () => {
  const res = await ingestDodsfall(new Date(),
    kilde([{ hash: fnrHash(FNR), dodsdato: '2026-07-20' }]));
  assert.equal(res.opprettet, 0);
  const n = (await eier.query(
    'SELECT count(*)::int AS n FROM frigivelser WHERE hvelv_id = $1', [hvelvA])).rows[0].n;
  assert.equal(n, 1);
  const spor = (await eier.query(
    `SELECT utfall FROM folkeregister_hendelser WHERE fnr_hash = $1 ORDER BY mottatt`,
    [fnrHash(FNR)])).rows.map((r) => r.utfall);
  assert.deepEqual(spor, ['sak_opprettet', 'alt_apen_sak']);
});

test('ukjent person spores, men rører ingenting', { skip: hopp() }, async () => {
  const ukjent = fnrHash('31129912345');
  const res = await ingestDodsfall(new Date(), kilde([{ hash: ukjent, dodsdato: null }]));
  assert.equal(res.opprettet, 0);
  const rad = (await eier.query(
    'SELECT utfall, hvelv_id FROM folkeregister_hendelser WHERE fnr_hash = $1', [ukjent])).rows[0];
  assert.equal(rad.utfall, 'ukjent_person');
  assert.equal(rad.hvelv_id, null);
  await eier.query('DELETE FROM folkeregister_hendelser WHERE fnr_hash = $1', [ukjent]);
});

test('ingen HTTP-vei kan sette kilde=folkeregisteret', { skip: hopp() }, async () => {
  // En betrodd kontakt prøver å utgi seg for å være registeret.
  const kontakt = (await eier.query(
    `SELECT id FROM kontakter WHERE hvelv_id = $1`, [hvelvA])).rows[0].id;
  const bjorn = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash) VALUES ('Bjørn', 'fr-bjorn@test.no', 'scrypt:x:x')
     ON CONFLICT (epost) DO UPDATE SET navn = EXCLUDED.navn RETURNING id`)).rows[0].id;
  await eier.query('UPDATE kontakter SET bruker_id = $2 WHERE id = $1', [kontakt, bjorn]);
  await medBruker(som(bjorn), async (c) => {
    await assert.rejects(c.query(
      `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
       VALUES ($1, 'dodsfall', 'folkeregisteret', $2)`, [hvelvA, kontakt]),
    /row-level security/);
  });
});

test('uten oppsett gjør ingest ingenting i det hele tatt', { skip: hopp() }, async () => {
  const url = process.env.FOLKEREGISTER_URL;
  delete process.env.FOLKEREGISTER_URL;
  const res = await ingestDodsfall(new Date(), kilde([{ hash: fnrHash(FNR) }]));
  assert.deepEqual(res, { hentet: 0, opprettet: 0 });
  process.env.FOLKEREGISTER_URL = url;
});
