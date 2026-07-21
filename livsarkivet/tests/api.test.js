// API-testen: spawner den EKTE serveren mot ekte Postgres og kjører hele
// kjerneloopen over HTTP — pluss negativløpene (avvist, tilbakekalt, blokkert,
// fire-øyne-brudd, mottaker uten rettigheter). Karenstiden er krympet til
// KARENSTID_SEKUNDER=2 så utløpet kan testes i sanntid.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { hashPassord, nyTotpHemmelighet, totpKode, lagNullstilling } = await import('../server/auth.js');
const { lukkPools } = await import('../server/db.js');

const PORT = 3401;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

let eier;              // owner-tilkobling for seeding/assertions
let server;            // child-prosessen
let tilgjengelig = true;

// liten cookie-jar per rolle
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
  try { data = await svar.json(); } catch { /* tomt svar */ }
  return { status: svar.status, data };
}

const totpFor = new Map(); // epost → hemmelighet

async function nyAdmin(navn, epost) {
  const totp = nyTotpHemmelighet();
  totpFor.set(epost, totp);
  await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet)
     VALUES ($1, $2, 'admin', $3, $4)`,
    [navn, epost, await hashPassord('adminpassord123'), totp]);
}

async function loggInnAdmin(epost) {
  const jar = nyJar();
  const uten = await api(jar, 'POST', '/api/auth/logg-inn', { epost, passord: 'adminpassord123' });
  assert.equal(uten.data.trengerTotp, true, 'admin uten TOTP-kode skal stoppes');
  const med = await api(jar, 'POST', '/api/auth/logg-inn',
    { epost, passord: 'adminpassord123', totp: totpKode(totpFor.get(epost)) });
  assert.equal(med.status, 200);
  return jar;
}

async function registrerOgLoggInn(navn, epost) {
  const jar = nyJar();
  const reg = await api(jar, 'POST', '/api/auth/registrer', { navn, epost, passord: 'passord1234' });
  assert.equal(reg.status, 200, JSON.stringify(reg.data));
  const inn = await api(jar, 'POST', '/api/auth/logg-inn', { epost, passord: 'passord1234' });
  assert.equal(inn.status, 200);
  return jar;
}

// eieren inviterer kontakten; kontakten løser inn koden og får konto + sesjon
async function inviterOgKoble(eierJar, kontaktId, navn) {
  const inv = await api(eierJar, 'POST', `/api/kontakter/${kontaktId}/invitasjon`);
  assert.equal(inv.status, 200);
  const jar = nyJar();
  const svar = await api(jar, 'POST', '/api/auth/innlos-invitasjon',
    { kode: inv.data.kode, navn, passord: 'passord1234' });
  assert.equal(svar.status, 200, JSON.stringify(svar.data));
  assert.ok(jar.cookie, 'innløsning skal gi sesjon');
  return jar;
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('API-tester hoppet over: ingen Postgres på MIGRATE_DATABASE_URL');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'api-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'api-%@test.no'`);

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1',
      LIVSARKIV_TESTMODUS: '1', KARENSTID_SEKUNDER: '2' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let i = 0; i < 100; i++) {
    try {
      const svar = await fetch(BASE + '/api/helse');
      if (svar.ok) return;
    } catch { /* venter */ }
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

// delt tilstand gjennom kjeden
let eva, kari, per, mona;             // cookie-jars
let admin1, admin2;
let elementE1, elementE2, hendelseId;
let kontaktKari, kontaktPer, kontaktMona;

test('kjede 0: eier bygger hvelv, kontakter og matrise', { skip: hopp() }, async () => {
  eva = await registrerOgLoggInn('Eva Eier', 'api-eva@test.no');

  const e1 = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Strømavtale', innhold: 'Fjordkraft, avtale 123' });
  const e2 = await api(eva, 'POST', '/api/elementer',
    { kategori: 'juridisk', tittel: 'Testament', innhold: 'Oppbevart hos advokat Berg' });
  elementE1 = e1.data.element.id;
  elementE2 = e2.data.element.id;

  const k1 = await api(eva, 'POST', '/api/kontakter',
    { navn: 'Kari', epost: 'api-kari@test.no', erBetrodd: true });
  const k2 = await api(eva, 'POST', '/api/kontakter',
    { navn: 'Per', epost: 'api-per@test.no', erBetrodd: true });
  const k3 = await api(eva, 'POST', '/api/kontakter',
    { navn: 'Mona', epost: 'api-mona@test.no', erBetrodd: false });
  kontaktKari = k1.data.kontakt.id; kontaktPer = k2.data.kontakt.id; kontaktMona = k3.data.kontakt.id;

  for (const [el, ko] of [[elementE1, kontaktMona], [elementE2, kontaktKari]]) {
    const m = await api(eva, 'POST', '/api/matrise', { elementId: el, kontaktId: ko });
    assert.equal(m.status, 200);
  }

  kari = await inviterOgKoble(eva, kontaktKari, 'Kari Kontakt');
  per = await inviterOgKoble(eva, kontaktPer, 'Per Kontakt');
  mona = await inviterOgKoble(eva, kontaktMona, 'Mona Mottaker');

  const meg = await api(kari, 'GET', '/api/meg');
  assert.equal(meg.data.betroddI.length, 1);
  assert.equal(meg.data.betroddI[0].eier_navn, 'Eva Eier');
});

test('kjede 0b: idempotens, optimistisk lås og sensitiv-sperre', { skip: hopp() }, async () => {
  const a = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Dublett', klientId: 'off-1' });
  const b = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Dublett', klientId: 'off-1' });
  assert.equal(b.data.gjenbruk, true);
  assert.equal(a.data.element.id, b.data.element.id);

  const stale = await api(eva, 'PUT', `/api/elementer/${elementE1}`,
    { tittel: 'Ny tittel', versjon: 99 });
  assert.equal(stale.status, 409);

  // sensitivt i klartekst avvises — serveren tar kun imot kryptert (ADR-001)
  const sens = await api(eva, 'POST', '/api/elementer',
    { kategori: 'tilgangsinfo', nivaa: 'sensitiv', tittel: 'Passord', innhold: 'hemmelig' });
  assert.equal(sens.status, 400);
});

test('kjede 0c: fremmed bruker når ikke eierens data over API-et', { skip: hopp() }, async () => {
  const les = await api(mona, 'PUT', `/api/elementer/${elementE1}`, { tittel: 'Kupp', versjon: 1 });
  assert.equal(les.status, 404);
  const slett = await api(mona, 'DELETE', `/api/elementer/${elementE2}`);
  assert.equal(slett.status, 404);
});

test('kjede 1: ikke-betrodd kan ikke melde; betrodd melder → varsler til alle', { skip: hopp() }, async () => {
  const avvist = await api(mona, 'POST', '/api/hendelser',
    { hvelvId: (await api(mona, 'GET', '/api/melding/hvelv')).data.hvelv[0]?.hvelv_id || elementE1 });
  assert.equal(avvist.status, 403);

  const hvelvListe = await api(kari, 'GET', '/api/melding/hvelv');
  const hvelvId = hvelvListe.data.hvelv[0].hvelv_id;
  const meldt = await api(kari, 'POST', '/api/hendelser', { hvelvId });
  assert.equal(meldt.status, 200, JSON.stringify(meldt.data));
  hendelseId = meldt.data.hendelseId;
  assert.equal(meldt.data.frigivelse.status, 'meldt');

  // dobbel melding avvises
  const dobbel = await api(per, 'POST', '/api/hendelser', { hvelvId });
  assert.equal(dobbel.status, 409);

  // varsler: eier + alle tre kontaktene
  const varsler = await eier.query(
    `SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1 AND type = 'hendelse_meldt'`,
    [hendelseId]);
  assert.equal(Number(varsler.rows[0].n), 4);
});

test('kjede 2: attest → attest_lastet_opp; to betrodde krever uavhengig bekreftelse', { skip: hopp() }, async () => {
  const pdf = Buffer.from('%PDF-1.4 attest-fikstur').toString('base64');
  const opp = await api(kari, 'POST', `/api/hendelser/${hendelseId}/attest`,
    { filnavn: 'dodsattest.pdf', mime: 'application/pdf', innholdBase64: pdf });
  assert.equal(opp.status, 200, JSON.stringify(opp.data));

  let status = await api(kari, 'GET', `/api/hendelser/${hendelseId}`);
  assert.equal(status.data.frigivelse.status, 'attest_lastet_opp',
    'to betrodde kontakter → attest alene er IKKE nok');

  const selvbekreft = await api(kari, 'POST', `/api/hendelser/${hendelseId}/bekreft`);
  assert.equal(selvbekreft.status, 400, 'melder kan ikke bekrefte selv');

  const bekreft = await api(per, 'POST', `/api/hendelser/${hendelseId}/bekreft`);
  assert.equal(bekreft.status, 200);
  status = await api(per, 'GET', `/api/hendelser/${hendelseId}`);
  assert.equal(status.data.frigivelse.status, 'under_verifisering');
});

test('kjede 3: fire øyne — samme admin stoppes, to ulike gir karenstid', { skip: hopp() }, async () => {
  await nyAdmin('Astrid Admin', 'api-admin1@test.no');
  await nyAdmin('Arne Admin', 'api-admin2@test.no');
  admin1 = await loggInnAdmin('api-admin1@test.no');
  admin2 = await loggInnAdmin('api-admin2@test.no');

  const koe = await api(admin1, 'GET', '/api/admin/koe');
  const sak = koe.data.saker.find((s) => s.hendelse_id === hendelseId);
  assert.ok(sak, 'saken skal stå i køen');
  assert.equal(sak.melder_navn, 'Kari');
  assert.equal(sak.attester.length, 1);

  const forste = await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  assert.equal(forste.data.status, 'godkjent_1');

  const samme = await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  assert.equal(samme.status, 409, 'fire øyne: samme admin skal stoppes');

  const andre = await api(admin2, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  assert.equal(andre.data.status, 'karenstid');

  const status = await api(eva, 'GET', `/api/hendelser/${hendelseId}`);
  assert.equal(status.data.frigivelse.status, 'karenstid');
  assert.ok(status.data.frigivelse.karenstidSlutt);

  const varsler = await eier.query(
    `SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1 AND type = 'karenstid_startet'`,
    [hendelseId]);
  assert.equal(Number(varsler.rows[0].n), 4);
});

test('kjede 4: før utløp ser mottaker INGENTING', { skip: hopp() }, async () => {
  const foer = await api(mona, 'GET', '/api/etterlatt');
  assert.equal(foer.data.elementer.length, 0);
});

test('kjede 5: etter karenstid frigis NØYAKTIG matrisens elementer', { skip: hopp() }, async () => {
  await new Promise((r) => setTimeout(r, 2300)); // karenstiden (2 s) løper ut
  const etter = await api(mona, 'GET', '/api/etterlatt');
  assert.equal(etter.data.elementer.length, 1, 'Mona skal se ett element');
  assert.equal(etter.data.elementer[0].tittel, 'Strømavtale');
  assert.equal(etter.data.elementer[0].eier_navn, 'Eva Eier');

  // innholdet kan åpnes — og lesingen revideres
  const en = await api(mona, 'GET', `/api/etterlatt/elementer/${etter.data.elementer[0].id}`);
  assert.equal(en.data.element.innhold, 'Fjordkraft, avtale 123');
  const lest = await eier.query(
    `SELECT count(*) AS n FROM revisjon WHERE hendelse = 'etterlatt_lest'
      AND detaljer->>'element_id' = $1`, [etter.data.elementer[0].id]);
  assert.equal(Number(lest.rows[0].n), 1);

  // Mona har IKKE testamentet i matrisen → 404 også på direkte oppslag
  const nekt = await api(mona, 'GET', `/api/etterlatt/elementer/${elementE2}`);
  assert.equal(nekt.status, 404);

  // Kari ser testamentet (matrise), men ikke strømavtalen
  const kariSyn = await api(kari, 'GET', '/api/etterlatt');
  assert.deepEqual(kariSyn.data.elementer.map((e) => e.tittel), ['Testament']);

  // frigitt-varsel gikk til alle
  const varsler = await eier.query(
    `SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1 AND type = 'frigivelse_frigitt'`,
    [hendelseId]);
  assert.equal(Number(varsler.rows[0].n), 4);
});

// ── Negativløpene: avvist, tilbakekalt, blokkert — i eget hvelv med ÉN betrodd ──
let odd, siri, kontaktSiri, oddHvelvId;

test('negativ 0: eier med én betrodd kontakt — attest alene gir verifisering', { skip: hopp() }, async () => {
  odd = await registrerOgLoggInn('Odd Eier', 'api-odd@test.no');
  await api(odd, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Nøkkelboks', innhold: 'Kode 4455' });
  const k = await api(odd, 'POST', '/api/kontakter',
    { navn: 'Siri', epost: 'api-siri@test.no', erBetrodd: true });
  kontaktSiri = k.data.kontakt.id;
  siri = await inviterOgKoble(odd, kontaktSiri, 'Siri Søster');
  oddHvelvId = (await api(siri, 'GET', '/api/melding/hvelv')).data.hvelv[0].hvelv_id;
});

async function meldMedAttest(jar, hvelvId) {
  const meldt = await api(jar, 'POST', '/api/hendelser', { hvelvId });
  assert.equal(meldt.status, 200, JSON.stringify(meldt.data));
  const pdf = Buffer.from('%PDF-1.4 attest').toString('base64');
  const opp = await api(jar, 'POST', `/api/hendelser/${meldt.data.hendelseId}/attest`,
    { filnavn: 'attest.pdf', innholdBase64: pdf });
  assert.equal(opp.status, 200);
  return meldt.data.hendelseId;
}

test('negativ 1: avvist attest stopper kjeden med grunn', { skip: hopp() }, async () => {
  const hid = await meldMedAttest(siri, oddHvelvId);
  const status = await api(siri, 'GET', `/api/hendelser/${hid}`);
  assert.equal(status.data.frigivelse.status, 'under_verifisering', 'én betrodd → attest er nok');

  const koe = await api(admin1, 'GET', '/api/admin/koe');
  const sak = koe.data.saker.find((s) => s.hendelse_id === hid);
  const utenGrunn = await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/avvis`, {});
  assert.equal(utenGrunn.status, 400);
  const avvist = await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/avvis`,
    { grunn: 'Dokumentet er uleselig' });
  assert.equal(avvist.data.status, 'avvist');

  const etter = await api(siri, 'GET', `/api/hendelser/${hid}`);
  assert.equal(etter.data.frigivelse.status, 'avvist');
  assert.equal(etter.data.frigivelse.avvistGrunn, 'Dokumentet er uleselig');
  assert.equal(etter.data.attester[0].status, 'avvist');
});

test('negativ 2: tilbakekall — og ny melding etterpå går fint', { skip: hopp() }, async () => {
  const hid = await meldMedAttest(siri, oddHvelvId);
  const trukket = await api(siri, 'POST', `/api/hendelser/${hid}/tilbakekall`);
  assert.equal(trukket.data.status, 'tilbakekalt');
  // saken er ute av køen
  const koe = await api(admin1, 'GET', '/api/admin/koe');
  assert.ok(!koe.data.saker.find((s) => s.hendelse_id === hid));
});

test('negativ 3: eier blokkerer i karenstid — hvelvet forblir lukket', { skip: hopp() }, async () => {
  const hid = await meldMedAttest(siri, oddHvelvId);
  const koe = await api(admin1, 'GET', '/api/admin/koe');
  const sak = koe.data.saker.find((s) => s.hendelse_id === hid);
  await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  await api(admin2, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);

  // eieren lever og trykker på nødbremsen
  const blokkert = await api(odd, 'POST', `/api/hendelser/${hid}/blokker`, { grunn: 'Jeg lever' });
  assert.equal(blokkert.data.status, 'blokkert');

  // mottakeren kan aldri blokkere, og melder kan ikke tilbakekalle terminal sak
  const siriBlokk = await api(siri, 'POST', `/api/hendelser/${hid}/blokker`);
  assert.equal(siriBlokk.status, 409);

  await new Promise((r) => setTimeout(r, 2300)); // selv etter «utløp»…
  const syn = await api(siri, 'GET', '/api/etterlatt');
  assert.equal(syn.data.elementer.length, 0, '…forblir hvelvet lukket');

  const varsler = await eier.query(
    `SELECT count(*) AS n FROM varslinger WHERE hendelse_id = $1 AND type = 'frigivelse_blokkert'`,
    [hid]);
  assert.equal(Number(varsler.rows[0].n), 2); // eier + Siri
});

test('zero-knowledge: sensitivt element gjennom HELE kjeden — serveren ser aldri klartekst', { skip: hopp() }, async () => {
  const krypto = await import('../app/js/krypto.js');
  const KLARTEKST = 'Koden til safen er 9911. Nettbank-BankID i skuffen.';

  // Siri (mottaker) setter sitt nøkkelpar; Odd (eier) sine hvelvnøkler
  const { tilServer: siriNokkel } = await krypto.opprettNokkelpar('siris egen frase her');
  assert.equal((await api(siri, 'PUT', '/api/krypto/min-nokkel', siriNokkel)).status, 200);
  const { tilServer: oddNokler } = await krypto.opprettHvelvnokler('odds sikkerhetsfrase');
  assert.equal((await api(odd, 'PUT', '/api/krypto/hvelvnokler', oddNokler)).status, 200);

  // eieren krypterer i «appen» og sender kun chiffertekst
  const hn = await krypto.laasOppHvelvnokkel('odds sikkerhetsfrase',
    (await api(odd, 'GET', '/api/krypto/hvelvnokler')).data.nokler);
  const kryptert = await krypto.krypterElement(hn, KLARTEKST);
  const element = await api(odd, 'POST', '/api/elementer',
    { kategori: 'tilgangsinfo', nivaa: 'sensitiv', tittel: 'Safe og BankID',
      innhold: kryptert.innhold, kryptert: true, nokkelRef: kryptert.nokkelRef });
  assert.equal(element.status, 200, JSON.stringify(element.data));

  // matrise-mapping krever deponi — uten avvises den
  const kontaktSvar = await api(odd, 'GET', '/api/kontakter');
  const siriKontakt = kontaktSvar.data.kontakter.find((k) => k.navn === 'Siri');
  const utenDeponi = await api(odd, 'POST', '/api/matrise',
    { elementId: element.data.element.id, kontaktId: siriKontakt.id });
  assert.equal(utenDeponi.status, 400);
  const offentlig = await api(odd, 'GET', `/api/krypto/offentlig/${siriKontakt.id}`);
  const deponi = await krypto.pakkTilMottaker(hn, kryptert.nokkelRef, offentlig.data.offentlig);
  const medDeponi = await api(odd, 'POST', '/api/matrise',
    { elementId: element.data.element.id, kontaktId: siriKontakt.id, nokkelDeponi: deponi });
  assert.equal(medDeponi.status, 200);

  // NEGATIVTEST mot databasen: klarteksten finnes INGEN steder
  for (const tabell of ['hvelv_elementer', 'element_nokkeldeponi', 'hvelv_kryptonokler', 'bruker_nokler', 'revisjon']) {
    const treff = await eier.query(
      `SELECT count(*) AS n FROM ${tabell} WHERE ${tabell}::text ILIKE '%safen%' OR ${tabell}::text ILIKE '%9911%'`);
    assert.equal(Number(treff.rows[0].n), 0, `klartekst lekket til ${tabell}`);
  }

  // hele frigivelsesløpet — og mottakeren dekrypterer med SIN frase
  const hid = await meldMedAttest(siri, oddHvelvId);
  const koe = await api(admin1, 'GET', '/api/admin/koe');
  const sak = koe.data.saker.find((s) => s.hendelse_id === hid);
  await api(admin1, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  await api(admin2, 'POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
  await new Promise((r) => setTimeout(r, 2300));

  const syn = await api(siri, 'GET', '/api/etterlatt');
  const sensitivt = syn.data.elementer.find((e) => e.tittel === 'Safe og BankID');
  assert.ok(sensitivt, 'sensitivt element frigitt (kryptert)');
  assert.equal(sensitivt.kryptert, true);
  assert.ok(!JSON.stringify(syn.data).includes('9911'), 'listevisningen lekker ikke klartekst');

  const detalj = await api(siri, 'GET', `/api/etterlatt/elementer/${sensitivt.id}`);
  assert.ok(detalj.data.element.nokkel_deponi, 'deponiet følger med etter frigivelse');
  const laastOpp = await krypto.aapneSomMottaker('siris egen frase her',
    siriNokkel, detalj.data.element.nokkel_deponi, detalj.data.element.innhold);
  assert.equal(laastOpp, KLARTEKST, 'mottakeren åpner med sin egen frase');
});

test('passordnullstilling: kode setter nytt passord og dreper gamle sesjoner', { skip: hopp() }, async () => {
  const evaId = (await eier.query(
    `SELECT id FROM brukere WHERE epost = 'api-eva@test.no'`)).rows[0].id;
  const kode = await lagNullstilling(evaId);

  const feilKode = await api(nyJar(), 'POST', '/api/auth/nullstill',
    { kode: 'feilkode123', passord: 'nyttpassord123' });
  assert.equal(feilKode.status, 400);

  const ok = await api(nyJar(), 'POST', '/api/auth/nullstill',
    { kode, passord: 'nyttpassord123' });
  assert.equal(ok.status, 200);

  // gammel sesjon er død, gammelt passord virker ikke, nytt virker
  const gammelSesjon = await api(eva, 'GET', '/api/meg');
  assert.equal(gammelSesjon.status, 401);
  const gammeltPassord = await api(nyJar(), 'POST', '/api/auth/logg-inn',
    { epost: 'api-eva@test.no', passord: 'passord1234' });
  assert.equal(gammeltPassord.status, 401);
  const nytt = await api(eva, 'POST', '/api/auth/logg-inn',
    { epost: 'api-eva@test.no', passord: 'nyttpassord123' });
  assert.equal(nytt.status, 200);
});

test('revisjon: hver overgang i hovedkjeden er logget', { skip: hopp() }, async () => {
  const hendelser = (await eier.query(
    `SELECT hendelse FROM revisjon WHERE detaljer->>'frigivelse_id' IN
       (SELECT id::text FROM frigivelser WHERE hendelse_id = $1)
      ORDER BY id`, [hendelseId])).rows.map((r) => r.hendelse);
  for (const ventet of ['frigivelse_attest_lastet_opp', 'frigivelse_under_verifisering',
    'frigivelse_godkjent_1', 'frigivelse_karenstid', 'frigivelse_frigitt']) {
    assert.ok(hendelser.includes(ventet), `mangler revisjon for ${ventet}`);
  }
});
