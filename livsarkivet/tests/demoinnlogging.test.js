// Ett-trykks demoinnlogging: skal være usynlig når flagget er av, og kunne
// KUN nå demokontoer når det er på — aldri en ekte konto, uansett miljø.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { lukkPools } = await import('../server/db.js');
const ROT = path.resolve(import.meta.dirname, '..');

let eier;
let tilgjengelig = true;
const servere = [];

function start(port, ekstra) {
  const s = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(port), LIVSARKIV_TESTMODUS: '1', ...ekstra },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  servere.push(s);
  return s;
}
async function ventPaa(port) {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/helse`)).ok) return; } catch { /* venter */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server på ${port} kom ikke opp`);
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Demoinnloggingstester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN (SELECT id FROM brukere
    WHERE epost IN ('demoinn@demo.livsarkivet.no', 'demoinn-ekte@example.no'))`);
  await eier.query(`DELETE FROM brukere
    WHERE epost IN ('demoinn@demo.livsarkivet.no', 'demoinn-ekte@example.no')`);
  await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash)
     VALUES ('Demo Bruker', 'demoinn@demo.livsarkivet.no', 'scrypt:x:x'),
            ('Ekte Bruker', 'demoinn-ekte@example.no', 'scrypt:x:x')`);
  start(3407, { DEMO_INNLOGGING: '1' });
  start(3408, {});                       // flagget AV
  await Promise.all([ventPaa(3407), ventPaa(3408)]);
});

test.after(async () => {
  for (const s of servere) s.kill();
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

test('uten flagget finnes ikke ruten i det hele tatt', { skip: hopp() }, async () => {
  const svar = await fetch('http://127.0.0.1:3408/api/demo/inn?som=demoinn', { redirect: 'manual' });
  assert.equal(svar.status, 404);
  assert.equal(svar.headers.get('set-cookie'), null, 'ingen sesjon skal settes');
});

test('med flagget gir demokonto en EKTE sesjon og omdirigering', { skip: hopp() }, async () => {
  const svar = await fetch('http://127.0.0.1:3407/api/demo/inn?som=demoinn', { redirect: 'manual' });
  assert.equal(svar.status, 302);
  assert.equal(svar.headers.get('location'), '/');
  const cookie = svar.headers.get('set-cookie');
  assert.match(cookie, /livsarkiv_sesjon=/);
  assert.match(cookie, /HttpOnly/);

  // sesjonen er reell: /api/meg svarer med brukeren
  const meg = await fetch('http://127.0.0.1:3407/api/meg',
    { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal(meg.status, 200);
  assert.equal((await meg.json()).bruker.navn, 'Demo Bruker');
});

test('ekte konto kan ALDRI nås — heller ikke med flagget på', { skip: hopp() }, async () => {
  // full e-post, forsøk på å bryte ut av demo-domenet, og en ekte konto
  for (const som of ['demoinn-ekte@example.no', 'demoinn-ekte@example.no%00',
    '../demoinn-ekte', 'demoinn-ekte']) {
    const svar = await fetch(
      `http://127.0.0.1:3407/api/demo/inn?som=${encodeURIComponent(som)}`, { redirect: 'manual' });
    assert.ok([400, 404].includes(svar.status), `«${som}» ga ${svar.status}`);
    assert.equal(svar.headers.get('set-cookie'), null, `«${som}» satte sesjon`);
  }
});

test('ukjent demokonto gir 404 uten sesjon', { skip: hopp() }, async () => {
  const svar = await fetch('http://127.0.0.1:3407/api/demo/inn?som=finnesikke',
    { redirect: 'manual' });
  assert.equal(svar.status, 404);
  assert.equal(svar.headers.get('set-cookie'), null);
});
