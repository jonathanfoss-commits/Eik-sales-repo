// Nivå 6 — lasttest på de to flatene som må holde under trykk: innlogging
// (scrypt er bevisst kostbart) og frigivelsesflytens lesninger (etterlatte som
// alle logger inn samtidig etter et dødsfall).
//
// Dette er en SMOKE-nivå lasttest, ikke en kapasitetsmåling: den skal fange
// tregheter og feil under samtidighet i CI, på maskinvare vi ikke kontrollerer.
// Terskler er derfor romslige og målt som «ingen feil» + p95 under tak.
//
//   npm run lasttest
import { spawn } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { hashPassord } = await import('../server/auth.js');
const { lukkPools } = await import('../server/db.js');

const PORT = 3405;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

const BRUKERE = 20;          // samtidige eiere
// Rate-demperen tillater 30 innlogginger per IP per kvarter. Lasttesten kommer
// fra én IP, så den holder seg bevisst under taket — at demperen slår inn over
// taket testes for seg lenger ned.
// MERK TIL JONATHAN: bak mobil-CGNAT deler mange abonnenter én IP. Taket på 30
// kan da ramme legitime brukere (flere etterlatte som logger inn samtidig).
// Kontoen er uansett vernet av per-e-post-taket på 10. Å heve IP-taket er en
// sikkerhetsavveining — den lar jeg stå til du bestemmer.
const INNLOGGINGER = 25;     // samtidige innlogginger (under IP-taket)
const LESNINGER = 200;       // samtidige statuslesninger
const P95_INNLOGGING_MS = 5000;
const P95_LESNING_MS = 1500;

let feil = 0;
function sjekk(betingelse, navn, detalj = '') {
  if (betingelse) console.log('  ✓', navn, detalj);
  else { feil++; console.error('  ✗', navn, detalj); }
}

const p95 = (tall) => tall.slice().sort((a, b) => a - b)[Math.floor(tall.length * 0.95)] ?? 0;

async function tid(fn) {
  const t0 = performance.now();
  const svar = await fn();
  return { ms: performance.now() - t0, svar };
}

const eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
await eier.connect();
await eier.query(`DELETE FROM hvelv WHERE eier_id IN
  (SELECT id FROM brukere WHERE epost LIKE 'last-%@test.no')`);
await eier.query(`DELETE FROM brukere WHERE epost LIKE 'last-%@test.no'`);

// seed brukere med kjent passord (scrypt-hashen lages én gang og gjenbrukes)
const hash = await hashPassord('passord1234');
const eposter = [];
for (let i = 0; i < BRUKERE; i++) {
  const epost = `last-${i}@test.no`;
  eposter.push(epost);
  const bruker = (await eier.query(
    `INSERT INTO brukere (navn, epost, passord_hash) VALUES ($1, $2, $3) RETURNING id`,
    [`Laster ${i}`, epost, hash])).rows[0];
  await eier.query('INSERT INTO hvelv (eier_id) VALUES ($1)', [bruker.id]);
}

const server = spawn('node', ['server/index.js'], {
  cwd: ROT,
  env: { ...process.env, PORT: String(PORT), LIVSARKIV_TESTMODUS: '1' },
  stdio: ['ignore', 'ignore', 'inherit'],   // stdout er per-forespørsel-logg
});
for (let i = 0; ; i++) {
  try { if ((await fetch(BASE + '/api/helse')).ok) break; } catch { /* venter */ }
  if (i > 100) { console.error('Serveren kom aldri opp'); process.exit(1); }
  await new Promise((r) => setTimeout(r, 100));
}

try {
  console.log(`Lasttest: ${INNLOGGINGER} samtidige innlogginger, ${LESNINGER} samtidige lesninger`);

  // ── Innlogging under samtidighet ──
  const innlogginger = await Promise.all(
    Array.from({ length: INNLOGGINGER }, (_, i) => tid(() => fetch(BASE + '/api/auth/logg-inn', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ epost: eposter[i % BRUKERE], passord: 'passord1234' }),
    }))));
  const innloggFeil = innlogginger.filter((r) => r.svar.status !== 200).length;
  sjekk(innloggFeil === 0, 'alle innlogginger lyktes', `(${innloggFeil} feil)`);
  const p95Innlogg = Math.round(p95(innlogginger.map((r) => r.ms)));
  sjekk(p95Innlogg < P95_INNLOGGING_MS, 'innlogging p95 under taket',
    `(p95 ${p95Innlogg} ms < ${P95_INNLOGGING_MS} ms)`);

  // en gyldig sesjon til leserunden
  const cookie = innlogginger.find((r) => r.svar.status === 200)
    .svar.headers.get('set-cookie').split(';')[0];

  // ── Lesninger på frigivelsesflytens flater ──
  const stier = ['/api/status', '/api/hvelv', '/api/etterlatt', '/api/melding/hvelv'];
  const lesninger = await Promise.all(
    Array.from({ length: LESNINGER }, (_, i) => tid(() =>
      fetch(BASE + stier[i % stier.length], { headers: { Cookie: cookie } }))));
  const lesFeil = lesninger.filter((r) => r.svar.status !== 200).length;
  sjekk(lesFeil === 0, 'alle lesninger lyktes', `(${lesFeil} feil)`);
  const p95Les = Math.round(p95(lesninger.map((r) => r.ms)));
  sjekk(p95Les < P95_LESNING_MS, 'lesning p95 under taket',
    `(p95 ${p95Les} ms < ${P95_LESNING_MS} ms)`);

  // ── Rate-demperen skal slå inn (over taket), ikke velte serveren ──
  const spam = await Promise.all(Array.from({ length: 30 }, () => fetch(BASE + '/api/auth/logg-inn', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epost: eposter[0], passord: 'feil passord' }),
  })));
  const koder = new Set(spam.map((s) => s.status));
  sjekk(koder.has(429), 'rate-demperen slår inn på gjentatte feilforsøk', `(statuser: ${[...koder]})`);
  sjekk((await fetch(BASE + '/api/helse')).ok, 'serveren svarer fortsatt etter lastspissen');
} catch (e) {
  feil++;
  console.error('Lasttesten krasjet:', e);
} finally {
  server.kill();
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'last-%@test.no')`).catch(() => {});
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'last-%@test.no'`).catch(() => {});
  await eier.end().catch(() => {});
  await lukkPools();
}

if (feil) { console.error(`\n${feil} lasttest-sjekk(er) feilet`); process.exit(1); }
console.log('\nLasttesten passerte.');
process.exit(0);
