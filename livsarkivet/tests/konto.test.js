// Dataportabilitet og sletterett (GDPR art. 15, 17, 20) mot ekte server.
// Det som må bevises: eksporten er komplett OG faktisk brukbar (nøklene følger
// med, så eieren kan dekryptere utenfor tjenesten), og slettingen fjerner alt
// eget — uten å rive andres data, og uten å slette revisjonssporet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { lukkPools } = await import('../server/db.js');
const krypto = await import('../app/js/krypto.js');

const PORT = 3406;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');
// bokstaver utenfor heksadesimal, så skanningen ikke treffer UUID-er/tidsstempler
const SENSITIVT = 'Safekode zulu-plog-vinsj, bankboks DNB';
const SOEKEORD = 'zulu-plog-vinsj';

let eier, server;
let tilgjengelig = true;

function nyJar() { return { cookie: '' }; }
async function api(jar, metode, sti, kropp) {
  const svar = await fetch(BASE + sti, {
    method: metode,
    headers: { 'Content-Type': 'application/json', ...(jar.cookie ? { Cookie: jar.cookie } : {}) },
    body: kropp === undefined ? undefined : JSON.stringify(kropp),
  });
  const satt = svar.headers.get('set-cookie');
  if (satt) jar.cookie = satt.split(';')[0];
  let data = {};
  try { data = await svar.json(); } catch { /* tomt */ }
  return { status: svar.status, data, headers: svar.headers };
}

async function nyEier(navn, epost) {
  const jar = nyJar();
  await api(jar, 'POST', '/api/auth/registrer', { navn, epost, passord: 'passord1234' });
  await api(jar, 'POST', '/api/auth/logg-inn', { epost, passord: 'passord1234' });
  return jar;
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Kontotester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'konto-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'konto-%@test.no'`);

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1', LIVSARKIV_TESTMODUS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(BASE + '/api/helse')).ok) return; } catch { /* venter */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Serveren kom aldri opp');
});

test.after(async () => {
  server?.kill();
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

let ida, idaId, hvelvId, sensitivtId;

test('eksport: komplett, og sensitivt innhold kan dekrypteres utenfor tjenesten', { skip: hopp() }, async () => {
  ida = await nyEier('Ida Konto', 'konto-ida@test.no');
  idaId = (await eier.query(
    `SELECT id FROM brukere WHERE epost = 'konto-ida@test.no'`)).rows[0].id;

  // vanlig element + kontakt + matrise
  const vanlig = await api(ida, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Strøm', innhold: 'Fjordkraft 123' });
  const kontakt = await api(ida, 'POST', '/api/kontakter',
    { navn: 'Kontakt Konto', epost: 'konto-kontakt@test.no', erBetrodd: true });
  await api(ida, 'POST', '/api/matrise',
    { elementId: vanlig.data.element.id, kontaktId: kontakt.data.kontakt.id });

  // sensitivt element, kryptert i «appen»
  const { tilServer } = await krypto.opprettHvelvnokler('idas sikkerhetsfrase');
  await api(ida, 'PUT', '/api/krypto/hvelvnokler', tilServer);
  const hn = await krypto.laasOppHvelvnokkel('idas sikkerhetsfrase', tilServer);
  const kryptert = await krypto.krypterElement(hn, SENSITIVT);
  const sensitivt = await api(ida, 'POST', '/api/elementer',
    { kategori: 'tilgangsinfo', nivaa: 'sensitiv', tittel: 'Safe',
      innhold: kryptert.innhold, kryptert: true, nokkelRef: kryptert.nokkelRef });
  sensitivtId = sensitivt.data.element.id;
  hvelvId = (await eier.query(
    'SELECT id FROM hvelv WHERE eier_id = $1', [idaId])).rows[0].id;

  // eksporter
  const svar = await fetch(BASE + '/api/eksport', { headers: { Cookie: ida.cookie } });
  assert.equal(svar.status, 200);
  assert.match(svar.headers.get('content-disposition'), /attachment; filename="livsarkivet-eksport\.html"/);
  // Eksporten er én selvstendig HTML-fil; datasettet ligger i JSON-blokka.
  // At fila FAKTISK dekrypterer i en nettleser, bevises i tests/eksport.test.js.
  const html = await svar.text();
  const dump = JSON.parse(
    html.match(/<script type="application\/json" id="eksport-data">([\s\S]*?)<\/script>/)[1]);

  assert.equal(dump.format, 'livsarkivet-eksport/1');
  assert.equal(dump.bruker.epost, 'konto-ida@test.no');
  assert.equal(dump.elementer.length, 2);
  assert.equal(dump.kontakter.length, 1);
  assert.equal(dump.mottakermatrise.length, 1);
  assert.ok(dump.revisjonslogg.length > 0);
  assert.ok(dump.abonnement, 'abonnementsstatus følger med');

  // PORTABILITETSKRAVET: nøklene er med, så eieren kan dekryptere selv
  assert.ok(dump.kryptonokler?.hvelvnokkel_pakket, 'frasepakket hvelvnøkkel er med');
  const fraEksport = dump.elementer.find((e) => e.id === sensitivtId);
  assert.equal(fraEksport.kryptert, true);
  assert.ok(!html.includes(SOEKEORD), 'eksporten bærer ikke klartekst');
  const hnFraEksport = await krypto.laasOppHvelvnokkel('idas sikkerhetsfrase', dump.kryptonokler);
  assert.equal(
    await krypto.dekrypterElement(hnFraEksport, fraEksport.innhold, fraEksport.nokkel_ref),
    SENSITIVT, 'sensitivt innhold åpnes fra eksporten alene, med egen frase');
});

test('eksport krever innlogging', { skip: hopp() }, async () => {
  const svar = await fetch(BASE + '/api/eksport');
  assert.equal(svar.status, 401);
});

test('sletting krever riktig passord', { skip: hopp() }, async () => {
  const feil = await api(ida, 'POST', '/api/konto/slett', { passord: 'feil passord' });
  assert.equal(feil.status, 401);
  const uten = await api(ida, 'POST', '/api/konto/slett', {});
  assert.equal(uten.status, 401);
  // kontoen lever fortsatt
  assert.equal((await eier.query(
    'SELECT count(*) AS n FROM brukere WHERE id = $1', [idaId])).rows[0].n, '1');
});

test('sletting fjerner alt eget — men ikke andres data, og revisjonssporet består', { skip: hopp() }, async () => {
  // en annen eier som har Ida som kontakt: den kontaktraden skal BESTÅ (løsnet)
  const per = await nyEier('Per Konto', 'konto-per@test.no');
  const perKontakt = await api(per, 'POST', '/api/kontakter',
    { navn: 'Ida', epost: 'konto-ida@test.no', erBetrodd: true });
  await eier.query('UPDATE kontakter SET bruker_id = $2 WHERE id = $1',
    [perKontakt.data.kontakt.id, idaId]);
  const perElement = await api(per, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Pers element', innhold: 'Pers innhold' });

  const foerRevisjon = Number((await eier.query(
    'SELECT count(*) AS n FROM revisjon WHERE hvelv_id = $1', [hvelvId])).rows[0].n);
  assert.ok(foerRevisjon > 0);

  const slettet = await api(ida, 'POST', '/api/konto/slett', { passord: 'passord1234' });
  assert.equal(slettet.status, 200, JSON.stringify(slettet.data));

  // alt Idas er borte
  for (const [tabell, sql, params] of [
    ['brukere', 'SELECT count(*) AS n FROM brukere WHERE id = $1', [idaId]],
    ['hvelv', 'SELECT count(*) AS n FROM hvelv WHERE id = $1', [hvelvId]],
    ['hvelv_elementer', 'SELECT count(*) AS n FROM hvelv_elementer WHERE hvelv_id = $1', [hvelvId]],
    ['kontakter', 'SELECT count(*) AS n FROM kontakter WHERE hvelv_id = $1', [hvelvId]],
    ['hvelv_kryptonokler', 'SELECT count(*) AS n FROM hvelv_kryptonokler WHERE hvelv_id = $1', [hvelvId]],
    ['abonnementer', 'SELECT count(*) AS n FROM abonnementer WHERE bruker_id = $1', [idaId]],
    ['sesjoner', 'SELECT count(*) AS n FROM sesjoner WHERE bruker_id = $1', [idaId]],
  ]) {
    assert.equal(Number((await eier.query(sql, params)).rows[0].n), 0,
      `${tabell} har rader igjen etter sletting`);
  }

  // revisjonssporet overlever (bærer aldri innhold) og har sluttføringen
  const etterRevisjon = Number((await eier.query(
    'SELECT count(*) AS n FROM revisjon WHERE hvelv_id = $1', [hvelvId])).rows[0].n);
  assert.ok(etterRevisjon >= foerRevisjon, 'revisjonsloggen ble slettet med kontoen');
  const sluttspor = await eier.query(
    `SELECT 1 FROM revisjon WHERE bruker_id = $1 AND hendelse = 'konto_slettet'`, [idaId]);
  assert.equal(sluttspor.rows.length, 1);

  // Pers data er urørt, og hans kontaktrad består — bare løsnet fra Ida
  const persElement = await eier.query(
    'SELECT innhold FROM hvelv_elementer WHERE id = $1', [perElement.data.element.id]);
  assert.equal(persElement.rows[0].innhold, 'Pers innhold');
  const persKontakt = await eier.query(
    'SELECT navn, bruker_id FROM kontakter WHERE id = $1', [perKontakt.data.kontakt.id]);
  assert.equal(persKontakt.rows.length, 1, 'kontaktraden i Pers hvelv ble revet med');
  assert.equal(persKontakt.rows[0].bruker_id, null, 'kontakten er løsnet fra den slettede kontoen');

  // sesjonen er død
  const etter = await api(ida, 'GET', '/api/meg');
  assert.equal(etter.status, 401);
});

test('saksbehandler kan slettes uten å rive sakshistorikken', { skip: hopp() }, async () => {
  // fire-øyne-feltene skal tåle SET NULL (CHECK-en evaluerer til NULL)
  const admin = (await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash)
     VALUES ('Admin Konto', 'konto-admin@test.no', 'admin', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  const bruker = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash)
     VALUES ('Sak Konto', 'konto-sak@test.no', 'scrypt:x:x') RETURNING id`)).rows[0].id;
  const hvelv = (await eier.query(
    'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [bruker])).rows[0].id;
  const hendelse = (await eier.query(
    `INSERT INTO hendelser (hvelv_id, type, kilde) VALUES ($1, 'dodsfall', 'manuell')
     RETURNING id`, [hvelv])).rows[0].id;
  const frigivelse = (await eier.query(
    `INSERT INTO frigivelser (hendelse_id, hvelv_id, status, godkjent_1_av, godkjent_2_av)
     VALUES ($1, $2, 'karenstid', $3, $3) RETURNING id`,
    [hendelse, hvelv, admin]).catch(() => null)) ?? null;
  // samme admin i begge felt skal være umulig (fire-øyne-CHECK)
  assert.equal(frigivelse, null, 'fire-øyne-CHECK slapp gjennom samme admin to ganger');

  const gyldig = (await eier.query(
    `INSERT INTO frigivelser (hendelse_id, hvelv_id, status, godkjent_1_av)
     VALUES ($1, $2, 'godkjent_1', $3) RETURNING id`, [hendelse, hvelv, admin])).rows[0].id;
  await eier.query('DELETE FROM brukere WHERE id = $1', [admin]);
  const etter = await eier.query(
    'SELECT status, godkjent_1_av FROM frigivelser WHERE id = $1', [gyldig]);
  assert.equal(etter.rows.length, 1, 'saken ble revet med saksbehandleren');
  assert.equal(etter.rows[0].godkjent_1_av, null);
  assert.equal(etter.rows[0].status, 'godkjent_1', 'sakens tilstand er intakt');
});
