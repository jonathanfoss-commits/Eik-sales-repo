// Herdingen fra sikkerhetsgjennomgangen før lansering. Hver test svarer til et
// konkret funn — de er her for at funnene ikke skal komme tilbake.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { hashPassord, nyTotpHemmelighet, totpKode } = await import('../server/auth.js');
const { lukkPools } = await import('../server/db.js');

const PORT = 3409;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

let eier, server;
let tilgjengelig = true;

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
  return { status: svar.status, data, headers: svar.headers };
}
async function nyEier(navn, epost) {
  const j = jar();
  await api(j, 'POST', '/api/auth/registrer', { navn, epost, passord: 'passord1234' });
  await api(j, 'POST', '/api/auth/logg-inn', { epost, passord: 'passord1234' });
  return j;
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Herdingstester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'herd-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'herd-%@test.no'`);
  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1', LIVSARKIV_TESTMODUS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  await ventPaaServer(PORT);
});

// Testfilene kjører parallelt, så en server kan bruke merkbart lengre tid på å
// komme opp enn den gjør alene. 10 sekunder var for lite — ventetiden er
// generøs med vilje: alternativet er en test som feiler av last, ikke av feil.
async function ventPaaServer(port) {
  const frist = Date.now() + 30_000;
  for (;;) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/helse`)).ok) return; } catch { /* venter */ }
    if (Date.now() > frist) throw new Error(`Serveren på port ${port} kom aldri opp`);
    await new Promise((r) => setTimeout(r, 100));
  }
}

test.after(async () => {
  server?.kill();
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// ── FUNN 1: attest med vilkårlig MIME kunne kjøre som side på vårt domene ──
test('attest: HTML og SVG avvises ved opplasting', { skip: hopp() }, async () => {
  const odd = await nyEier('Odd Herd', 'herd-odd@test.no');
  const kontakt = await api(odd, 'POST', '/api/kontakter',
    { navn: 'Siri', epost: 'herd-siri@test.no', erBetrodd: true });
  const inv = await api(odd, 'POST', `/api/kontakter/${kontakt.data.kontakt.id}/invitasjon`);
  const siri = jar();
  await api(siri, 'POST', '/api/auth/innlos-invitasjon',
    { kode: inv.data.kode, navn: 'Siri Herd', passord: 'passord1234' });
  const hvelvId = (await api(siri, 'GET', '/api/melding/hvelv')).data.hvelv[0].hvelv_id;
  const meldt = await api(siri, 'POST', '/api/hendelser', { hvelvId });

  for (const mime of ['text/html', 'image/svg+xml', 'application/javascript', 'text/plain']) {
    const svar = await api(siri, 'POST', `/api/hendelser/${meldt.data.hendelseId}/attest`,
      { filnavn: 'angrep.html', mime,
        innholdBase64: Buffer.from('<script>alert(1)</script>').toString('base64') });
    assert.equal(svar.status, 400, `${mime} ble sluppet gjennom`);
  }
  // PDF går fint
  const ok = await api(siri, 'POST', `/api/hendelser/${meldt.data.hendelseId}/attest`,
    { filnavn: 'attest.pdf', mime: 'application/pdf',
      innholdBase64: Buffer.from('%PDF-1.4').toString('base64') });
  assert.equal(ok.status, 200);
  return { hendelseId: meldt.data.hendelseId };
});

test('attest: databasen avviser ulovlig MIME også utenom API-et', { skip: hopp() }, async () => {
  const hendelse = (await eier.query(
    `SELECT h.id FROM hendelser h JOIN hvelv v ON v.id = h.hvelv_id
       JOIN brukere b ON b.id = v.eier_id WHERE b.epost = 'herd-odd@test.no' LIMIT 1`)).rows[0];
  await assert.rejects(eier.query(
    `INSERT INTO attester (hendelse_id, filnavn, mime, storrelse, innhold)
     VALUES ($1, 'x.html', 'text/html', 3, 'abc')`, [hendelse.id]),
    /attest_mime_tillatt/);
});

test('attest serveres med sandbox-CSP, og aldri inline for utrygg type', { skip: hopp() }, async () => {
  // opprett saksbehandler med TOTP
  const totp = nyTotpHemmelighet();
  await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet)
     VALUES ('Admin Herd', 'herd-admin@test.no', 'admin', $1, $2)`,
    [await hashPassord('passord1234'), totp]);
  const admin = jar();
  await api(admin, 'POST', '/api/auth/logg-inn',
    { epost: 'herd-admin@test.no', passord: 'passord1234', totp: totpKode(totp) });

  const attest = (await eier.query(
    `SELECT a.id FROM attester a JOIN hendelser h ON h.id = a.hendelse_id
       JOIN hvelv v ON v.id = h.hvelv_id JOIN brukere b ON b.id = v.eier_id
      WHERE b.epost = 'herd-odd@test.no' LIMIT 1`)).rows[0];
  const svar = await fetch(`${BASE}/api/admin/attester/${attest.id}/fil`,
    { headers: { Cookie: admin.cookie } });
  assert.equal(svar.status, 200);
  assert.match(svar.headers.get('content-security-policy'), /sandbox/);
  assert.equal(svar.headers.get('x-content-type-options'), 'nosniff');
  assert.match(svar.headers.get('content-disposition'), /^inline; filename="attest\.pdf"$/);
});

// ── FUNN 2: admin uten TOTP kom inn på passord alene ──
test('saksbehandler uten tofaktor blir nektet — ikke sluppet inn', { skip: hopp() }, async () => {
  await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash)
     VALUES ('Slurv Admin', 'herd-slurv@test.no', 'admin', $1)`,
    [await hashPassord('passord1234')]);
  const svar = await api(jar(), 'POST', '/api/auth/logg-inn',
    { epost: 'herd-slurv@test.no', passord: 'passord1234' });
  assert.equal(svar.status, 403);
  assert.match(svar.data.feil, /tofaktor/i);
});

// ── FUNN 5: demomiljøet sa ikke at det var et demomiljø ──
test('/api/miljo melder demomodus uten innlogging', { skip: hopp() }, async () => {
  // uten flagget: ingen advarsel
  assert.deepEqual((await api(null, 'GET', '/api/miljo')).data, { demo: false });

  // med flagget: advarselen må komme, og den må kunne leses FØR innlogging
  const port = PORT + 1;
  const demo = spawn('node', ['server/index.js'], { cwd: ROT,
    env: { ...process.env, PORT: String(port), DEMO_INNLOGGING: '1', LIVSARKIV_TESTMODUS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'] });
  try {
    await ventPaaServer(port);
    const svar = await fetch(`http://127.0.0.1:${port}/api/miljo`);
    assert.equal(svar.status, 200, 'ruten må være åpen — banneret vises før innlogging');
    assert.deepEqual(await svar.json(), { demo: true });
  } finally {
    demo.kill();
  }
});

// ── FUNN 3: lengdegrenser på hvelvinnhold ──
test('for lang tittel og for langt innhold avvises', { skip: hopp() }, async () => {
  const eva = await nyEier('Eva Herd', 'herd-eva@test.no');
  const langTittel = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'x'.repeat(201), innhold: 'kort' });
  assert.equal(langTittel.status, 400);
  const langtInnhold = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Lang', innhold: 'y'.repeat(200001) });
  assert.equal(langtInnhold.status, 400);
  // innenfor grensene går fint
  const ok = await api(eva, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'x'.repeat(200), innhold: 'y'.repeat(200000) });
  assert.equal(ok.status, 200);
});

// ── FUNN 4: passordbytte for innlogget bruker manglet helt ──
test('passordbytte: krever riktig gammelt, og rykker andre sesjoner', { skip: hopp() }, async () => {
  const per = await nyEier('Per Herd', 'herd-per@test.no');
  // en annen enhet logget inn samtidig
  const annenEnhet = jar();
  await api(annenEnhet, 'POST', '/api/auth/logg-inn',
    { epost: 'herd-per@test.no', passord: 'passord1234' });
  assert.equal((await api(annenEnhet, 'GET', '/api/meg')).status, 200);

  assert.equal((await api(per, 'POST', '/api/auth/passord',
    { gammelt: 'feil passord', nytt: 'nyttpassord123' })).status, 400);
  assert.equal((await api(per, 'POST', '/api/auth/passord',
    { gammelt: 'passord1234', nytt: 'kort' })).status, 400);
  assert.equal((await api(per, 'POST', '/api/auth/passord',
    { gammelt: 'passord1234', nytt: 'passord1234' })).status, 400, 'samme passord skal avvises');

  assert.equal((await api(per, 'POST', '/api/auth/passord',
    { gammelt: 'passord1234', nytt: 'nyttpassord123' })).status, 200);
  // egen sesjon lever, den andre enheten er kastet ut
  assert.equal((await api(per, 'GET', '/api/meg')).status, 200);
  assert.equal((await api(annenEnhet, 'GET', '/api/meg')).status, 401, 'andre sesjoner skal rykkes');
  // og det nye passordet gjelder
  assert.equal((await api(jar(), 'POST', '/api/auth/logg-inn',
    { epost: 'herd-per@test.no', passord: 'passord1234' })).status, 401);
  assert.equal((await api(jar(), 'POST', '/api/auth/logg-inn',
    { epost: 'herd-per@test.no', passord: 'nyttpassord123' })).status, 200);
});
