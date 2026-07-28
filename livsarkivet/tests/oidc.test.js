// OIDC-innlogging mot selskapets IdP.
//
// Testen kjører mot en FALSK IdP med EKTE RSA-nøkler: discovery, JWKS og
// token-endepunkt er ekte HTTP, tokenet er ekte signert. Det var derfor jeg
// tok feil da jeg utsatte dette med «krever en ekte IdP å teste mot» — en
// ekte IdP hadde testet nøyaktig det samme, bare tregere og med en avtale i
// veien. Det eneste en ekte tilbyder legger til, er deres egne særegenheter.
//
// Halvparten av testene prøver å komme forbi verifiseringen: feil signatur,
// feil utsteder, feil mottaker, utløpt token, feil nonce, gjenbrukt state.
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

const { lukkPools } = await import('../server/db.js');
const { verifiserIdToken, tomOidcCache } = await import('../server/oidc.js');
const { hashPassord } = await import('../server/auth.js');

const PORT = 3417;
const IDP_PORT = 3418;
const BASE = `http://127.0.0.1:${PORT}`;
const ISSUER = `http://127.0.0.1:${IDP_PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');
const KLIENT_ID = 'livsarkivet-test';

let eier, server, idp, tilgjengelig = true;
let tenantA, privat, jwk;
// styres av testene: hva IdP-en skal svare med ved neste kodebytte
let nesteToken = null;
let sisteAutorisering = null;

const b64url = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

function lagIdToken({ sub = 'bankid-12345', epost = 'oidc-nyy@test.no', navn = 'Ola Nordmann',
  iss = ISSUER, aud = KLIENT_ID, nonce, exp, iat, feilSignatur = false } = {}) {
  const naa = Math.floor(Date.now() / 1000);
  const hode = b64url({ alg: 'RS256', typ: 'JWT', kid: 'test-1' });
  const kropp = b64url({ iss, aud, sub, email: epost, name: navn, nonce,
    iat: iat ?? naa, exp: exp ?? naa + 300 });
  const data = Buffer.from(`${hode}.${kropp}`);
  const sig = feilSignatur
    ? crypto.randomBytes(256)
    : crypto.sign('RSA-SHA256', data, privat);
  return `${hode}.${kropp}.${sig.toString('base64url')}`;
}

// Følger omdirigeringer manuelt, så vi kan inspisere hvert hopp.
function hent(sti, { cookie } = {}) {
  return new Promise((los, avvis) => {
    const url = new URL(sti, BASE);
    const forespørsel = http.request({ host: url.hostname, port: url.port,
      path: url.pathname + url.search, method: 'GET',
      headers: cookie ? { Cookie: cookie } : {} }, (svar) => {
      let tekst = '';
      svar.on('data', (d) => { tekst += d; });
      svar.on('end', () => los({ status: svar.statusCode, headere: svar.headers, tekst }));
    });
    forespørsel.on('error', avvis);
    forespørsel.end();
  });
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('OIDC-tester hoppet over: ingen Postgres');
    return;
  }
  const par = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  privat = par.privateKey;
  jwk = { ...par.publicKey.export({ format: 'jwk' }), kid: 'test-1', use: 'sig', alg: 'RS256' };

  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'oidc-%@test.no'`);
  await eier.query(`DELETE FROM tenanter WHERE slug = 'oidc-alfa'`);
  tenantA = (await eier.query(
    `INSERT INTO tenanter (slug, navn, konfig) VALUES ('oidc-alfa', 'Alfa', $1) RETURNING id`,
    [JSON.stringify({ vertsnavn: ['127.0.0.1'] })])).rows[0].id;
  await eier.query(
    `INSERT INTO oidc_konfig (tenant_id, issuer, klient_id, klient_hemmelighet)
     VALUES ($1, $2, $3, 'hemmelig')`, [tenantA, ISSUER, KLIENT_ID]);

  idp = http.createServer((req, res) => {
    const url = new URL(req.url, ISSUER);
    if (url.pathname === '/.well-known/openid-configuration') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/auth`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
      }));
    }
    if (url.pathname === '/jwks') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ keys: [jwk] }));
    }
    if (url.pathname === '/token') {
      let kropp = '';
      req.on('data', (d) => { kropp += d; });
      return req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id_token: nesteToken, token_type: 'Bearer' }));
      });
    }
    res.writeHead(404).end('{}');
  });
  await new Promise((r) => idp.listen(IDP_PORT, '127.0.0.1', r));

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
  idp?.close();
  if (tilgjengelig) {
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'oidc-%@test.no'`);
    await eier.query(`DELETE FROM tenanter WHERE slug = 'oidc-alfa'`);
    await eier.end().catch(() => {});
  }
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// Starter flyten og plukker state+nonce ut av omdirigeringen.
async function start() {
  const svar = await hent('/api/auth/oidc/start');
  assert.equal(svar.status, 302, 'start skal omdirigere til IdP-en');
  const url = new URL(svar.headere.location);
  sisteAutorisering = url;
  return { state: url.searchParams.get('state'), nonce: url.searchParams.get('nonce') };
}

test('start sender brukeren til IdP-en med PKCE, state og nonce',
  { skip: hopp() }, async () => {
    const { state, nonce } = await start();
    const p = sisteAutorisering.searchParams;
    assert.equal(sisteAutorisering.origin + sisteAutorisering.pathname, `${ISSUER}/auth`);
    assert.equal(p.get('response_type'), 'code');
    assert.equal(p.get('client_id'), KLIENT_ID);
    assert.equal(p.get('code_challenge_method'), 'S256');
    assert.ok(p.get('code_challenge'), 'PKCE-utfordring mangler');
    assert.ok(state && nonce);
    assert.match(p.get('redirect_uri'), /\/api\/auth\/oidc\/tilbake$/);
  });

test('gyldig token gir konto og sesjon', { skip: hopp() }, async () => {
  const { state, nonce } = await start();
  nesteToken = lagIdToken({ nonce, epost: 'oidc-ny@test.no' });
  const svar = await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`);
  assert.equal(svar.status, 302);
  const cookie = String(svar.headere['set-cookie'] || '');
  assert.match(cookie, /livsarkiv_sesjon=/);
  assert.match(cookie, /HttpOnly/);

  // sesjonen virker, og kontoen havnet i riktig tenant
  const meg = await hent('/api/meg', { cookie: cookie.split(';')[0] });
  assert.equal(meg.status, 200);
  const rad = (await eier.query(
    `SELECT tenant_id, rolle, ekstern_id FROM brukere WHERE epost = 'oidc-ny@test.no'`)).rows[0];
  assert.equal(rad.tenant_id, tenantA);
  assert.equal(rad.rolle, 'person');
  assert.equal(rad.ekstern_id, 'bankid-12345');
});

test('samme sub igjen gjenbruker kontoen — det lages ikke en til',
  { skip: hopp() }, async () => {
    const { state, nonce } = await start();
    // e-posten er ENDRET hos IdP-en; koblingen skal fortsatt gå på sub
    nesteToken = lagIdToken({ nonce, epost: 'oidc-ny-adresse@test.no' });
    assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, 302);
    const n = (await eier.query(
      `SELECT count(*)::int AS n FROM brukere WHERE ekstern_id = 'bankid-12345'`)).rows[0].n;
    assert.equal(n, 1, 'ny e-post hos IdP-en skulle ikke gi en ny konto');
  });

// ── Verifiseringen skal si nei ──
for (const [navn, endring, ventet] of [
  ['forfalsket signatur', { feilSignatur: true }, 401],
  ['feil utsteder', { iss: 'https://ondsinnet.test' }, 401],
  ['token til en annen klient', { aud: 'noen-andre' }, 401],
  ['utløpt token', { exp: Math.floor(Date.now() / 1000) - 3600 }, 401],
]) {
  test(`avvises: ${navn}`, { skip: hopp() }, async () => {
    const { state, nonce } = await start();
    nesteToken = lagIdToken({ nonce, epost: 'oidc-angrep@test.no', ...endring });
    assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, ventet);
    const n = (await eier.query(
      `SELECT count(*)::int AS n FROM brukere WHERE epost = 'oidc-angrep@test.no'`)).rows[0].n;
    assert.equal(n, 0, 'et avvist token skal ikke ha opprettet noen konto');
  });
}

test('avvises: nonce fra en annen økt', { skip: hopp() }, async () => {
  const forste = await start();
  const andre = await start();
  // token signert med FØRSTE nonce, sendt inn med ANDRE state
  nesteToken = lagIdToken({ nonce: forste.nonce, epost: 'oidc-angrep@test.no' });
  assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${andre.state}`)).status, 401);
});

test('state kan brukes ÉN gang', { skip: hopp() }, async () => {
  const { state, nonce } = await start();
  nesteToken = lagIdToken({ nonce, epost: 'oidc-engang@test.no' });
  assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, 302);
  // samme state igjen: forsøket er slettet
  nesteToken = lagIdToken({ nonce, epost: 'oidc-engang@test.no' });
  assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, 400);
});

test('ukjent state avvises', { skip: hopp() }, async () => {
  assert.equal((await hent('/api/auth/oidc/tilbake?code=abc&state=oppdiktet')).status, 400);
});

// ── Kontoovertakelse ──
test('eksisterende passordkonto overtas IKKE automatisk', { skip: hopp() }, async () => {
  await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash, tenant_id)
     VALUES ('Eksisterende', 'oidc-finnes@test.no', $1, $2)`,
    [await hashPassord('passord1234'), tenantA]);
  const { state, nonce } = await start();
  nesteToken = lagIdToken({ nonce, sub: 'annen-sub-999', epost: 'oidc-finnes@test.no' });
  const svar = await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`);
  assert.equal(svar.status, 409, 'IdP-en fikk overta en konto den ikke opprettet');
  const rad = (await eier.query(
    `SELECT ekstern_id FROM brukere WHERE epost = 'oidc-finnes@test.no'`)).rows[0];
  assert.equal(rad.ekstern_id, null);
});

// Den viktigste: fire-øyne-regelen er verdiløs hvis selskapets egen IdP kan
// utnevne godkjennere hos oss.
test('en ekstern innlogging kan ALDRI bli saksbehandler', { skip: hopp() }, async () => {
  const { state, nonce } = await start();
  nesteToken = lagIdToken({ nonce, sub: 'vil-bli-admin', epost: 'oidc-admin@test.no',
    navn: 'Vil Bli Admin' });
  assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, 302);
  const rad = (await eier.query(
    `SELECT rolle FROM brukere WHERE epost = 'oidc-admin@test.no'`)).rows[0];
  assert.equal(rad.rolle, 'person');

  // og databasen nekter det direkte også: rollen kommer aldri fra tokenet
  const som = (await eier.query(`SELECT * FROM oidc_koble_bruker($1, $2, 'ny-sub-2',
    'oidc-admin2@test.no', 'Nummer To')`, [tenantA, ISSUER])).rows[0];
  assert.equal(som.rolle, 'person');
});

test('deaktivert konto slipper ikke inn', { skip: hopp() }, async () => {
  await eier.query(`UPDATE brukere SET aktiv = false WHERE ekstern_id = 'vil-bli-admin'`);
  const { state, nonce } = await start();
  nesteToken = lagIdToken({ nonce, sub: 'vil-bli-admin', epost: 'oidc-admin@test.no' });
  assert.equal((await hent(`/api/auth/oidc/tilbake?code=abc&state=${state}`)).status, 403);
});

// ── Enhetsnivå: verifiseringen alene ──
test('verifiserIdToken avviser alg=none og manglende sub', { skip: hopp() }, async () => {
  tomOidcCache();
  const valg = { issuer: ISSUER, klientId: KLIENT_ID, nonce: 'n', jwksUri: `${ISSUER}/jwks` };
  const ingen = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.`
    + `${Buffer.from(JSON.stringify({ iss: ISSUER, aud: KLIENT_ID, sub: 'x', nonce: 'n',
      exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url')}.`;
  await assert.rejects(verifiserIdToken(ingen, valg), /uventet algoritme/);

  const utenSub = lagIdToken({ nonce: 'n' });
  const [h, , s] = utenSub.split('.');
  const kropp = Buffer.from(JSON.stringify({ iss: ISSUER, aud: KLIENT_ID, nonce: 'n',
    exp: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  await assert.rejects(verifiserIdToken(`${h}.${kropp}.${s}`, valg), /signaturen stemmer ikke/);
});
