// Abonnementstester mot Stripe-mock: prøveperiode, checkout, signaturverifisert
// webhook, og — viktigst — den ETISKE gatingen: utløpt prøveperiode stenger kun
// eierens redigering. Frigivelsesløpet og etterlattevisningen går alltid.
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { lukkPools } = await import('../server/db.js');

const PORT = 3403;
const STRIPE_MOCK_PORT = 3404;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');
const WEBHOOK_HEMMELIGHET = 'whsec_test123';

let eier, server, stripeMock;
let tilgjengelig = true;
let sisteStripeKall = null;

function nyJar() { return { cookie: '' }; }
async function api(jar, metode, sti, kropp, headers = {}) {
  const svar = await fetch(BASE + sti, {
    method: metode,
    headers: { 'Content-Type': 'application/json',
      ...(jar?.cookie ? { Cookie: jar.cookie } : {}), ...headers },
    body: kropp === undefined ? undefined
      : typeof kropp === 'string' ? kropp : JSON.stringify(kropp),
  });
  const satt = svar.headers.get('set-cookie');
  if (satt && jar) jar.cookie = satt.split(';')[0];
  let data = {};
  try { data = await svar.json(); } catch { /* tomt */ }
  return { status: svar.status, data };
}

function signert(kropp) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = crypto.createHmac('sha256', WEBHOOK_HEMMELIGHET).update(`${t}.${kropp}`).digest('hex');
  return { 'stripe-signature': `t=${t},v1=${v1}` };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Abonnementstester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'abo-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'abo-%@test.no'`);

  stripeMock = http.createServer((req, res) => {
    let kropp = '';
    req.on('data', (b) => { kropp += b; });
    req.on('end', () => {
      sisteStripeKall = { sti: req.url, auth: req.headers.authorization,
        felter: Object.fromEntries(new URLSearchParams(kropp)) };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'cs_test_1', url: 'https://checkout.stripe.com/test-okt' }));
    });
  });
  await new Promise((r) => stripeMock.listen(STRIPE_MOCK_PORT, '127.0.0.1', r));

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1',
      LIVSARKIV_TESTMODUS: '1', KARENSTID_SEKUNDER: '2',
      STRIPE_BASE_URL: `http://127.0.0.1:${STRIPE_MOCK_PORT}`,
      STRIPE_SECRET: 'sk_test_fiksturnokkel', STRIPE_PRIS_ID: 'price_test_1',
      STRIPE_WEBHOOK_HEMMELIGHET: WEBHOOK_HEMMELIGHET },
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(BASE + '/api/helse')).ok) return; } catch { /* venter */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Serveren kom aldri opp');
});

test.after(async () => {
  server?.kill();
  stripeMock?.close();
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;
let oda, odaId; // eier i prøveperiode

test('ny eier får prøveperiode automatisk', { skip: hopp() }, async () => {
  oda = nyJar();
  await api(oda, 'POST', '/api/auth/registrer',
    { navn: 'Oda Eier', epost: 'abo-oda@test.no', passord: 'passord1234' });
  await api(oda, 'POST', '/api/auth/logg-inn', { epost: 'abo-oda@test.no', passord: 'passord1234' });
  const abo = await api(oda, 'GET', '/api/abonnement');
  assert.equal(abo.data.abonnement.status, 'proveperiode');
  assert.equal(abo.data.abonnement.aktivNaa, true);
  assert.equal(abo.data.abonnement.stripeKlar, true);
  odaId = (await eier.query(
    `SELECT id FROM brukere WHERE epost = 'abo-oda@test.no'`)).rows[0].id;
});

test('checkout går mot Stripe med riktige felter', { skip: hopp() }, async () => {
  const svar = await api(oda, 'POST', '/api/abonnement/checkout');
  assert.equal(svar.status, 200);
  assert.equal(svar.data.url, 'https://checkout.stripe.com/test-okt');
  assert.equal(sisteStripeKall.sti, '/v1/checkout/sessions');
  assert.equal(sisteStripeKall.auth, 'Bearer sk_test_fiksturnokkel');
  assert.equal(sisteStripeKall.felter.mode, 'subscription');
  assert.equal(sisteStripeKall.felter.client_reference_id, odaId);
});

test('webhook uten gyldig signatur avvises', { skip: hopp() }, async () => {
  const kropp = JSON.stringify({ type: 'checkout.session.completed',
    data: { object: { client_reference_id: odaId } } });
  const uten = await api(null, 'POST', '/api/stripe/webhook', kropp);
  assert.equal(uten.status, 400);
  const feilSignatur = await api(null, 'POST', '/api/stripe/webhook', kropp,
    { 'stripe-signature': 't=1,v1=feil' });
  assert.equal(feilSignatur.status, 400);
});

test('signert checkout-webhook aktiverer abonnementet', { skip: hopp() }, async () => {
  const kropp = JSON.stringify({ type: 'checkout.session.completed',
    data: { object: { client_reference_id: odaId, customer: 'cus_test', subscription: 'sub_test_1' } } });
  const svar = await api(null, 'POST', '/api/stripe/webhook', kropp, signert(kropp));
  assert.equal(svar.status, 200);
  const abo = await api(oda, 'GET', '/api/abonnement');
  assert.equal(abo.data.abonnement.status, 'aktiv');
});

test('etisk gating: utløpt tilgang stenger KUN eierens redigering', { skip: hopp() }, async () => {
  // bygg først (aktiv): element + betrodd kontakt som kobles
  const e = await api(oda, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Nøkkelboks', innhold: 'Kode 4455' });
  assert.equal(e.status, 200);
  const k = await api(oda, 'POST', '/api/kontakter',
    { navn: 'Siri', epost: 'abo-siri@test.no', erBetrodd: true });
  const inv = await api(oda, 'POST', `/api/kontakter/${k.data.kontakt.id}/invitasjon`);
  const siri = nyJar();
  await api(siri, 'POST', '/api/auth/innlos-invitasjon',
    { kode: inv.data.kode, navn: 'Siri', passord: 'passord1234' });

  // abonnementet kanselleres via webhook
  const kropp = JSON.stringify({ type: 'customer.subscription.deleted',
    data: { object: { id: 'sub_test_1' } } });
  await api(null, 'POST', '/api/stripe/webhook', kropp, signert(kropp));
  await eier.query( // og prøveperioden er også ute
    `UPDATE abonnementer SET proveperiode_slutt = now() - interval '1 day' WHERE bruker_id = $1`, [odaId]);

  // eierens REDIGERING er stengt (402) …
  const nytt = await api(oda, 'POST', '/api/elementer', { kategori: 'praktisk', tittel: 'Ny' });
  assert.equal(nytt.status, 402);
  const endre = await api(oda, 'PUT', `/api/elementer/${e.data.element.id}`,
    { tittel: 'Endret', versjon: e.data.element.versjon });
  assert.equal(endre.status, 402);
  const nyKontakt = await api(oda, 'POST', '/api/kontakter', { navn: 'X', epost: 'abo-x@test.no' });
  assert.equal(nyKontakt.status, 402);

  // … men LESING går, og hele frigivelsesløpet går:
  const les = await api(oda, 'GET', '/api/hvelv');
  assert.equal(les.status, 200);
  assert.equal(les.data.elementer.length, 1);

  const hvelvId = (await api(siri, 'GET', '/api/melding/hvelv')).data.hvelv[0].hvelv_id;
  const meldt = await api(siri, 'POST', '/api/hendelser', { hvelvId });
  assert.equal(meldt.status, 200, 'melding om dødsfall strander ALDRI på betaling');
  const attest = await api(siri, 'POST', `/api/hendelser/${meldt.data.hendelseId}/attest`,
    { filnavn: 'attest.pdf', innholdBase64: Buffer.from('%PDF-1.4').toString('base64') });
  assert.equal(attest.status, 200);
  // eierens nødbrems er heller aldri portet (her: feil tilstand gir 409 — ikke 402)
  const blokker = await api(oda, 'POST', `/api/hendelser/${meldt.data.hendelseId}/blokker`);
  assert.equal(blokker.status, 409);
});
