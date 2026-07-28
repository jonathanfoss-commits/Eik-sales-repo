// Exit-garantien, bevist — ikke påstått.
//
// Løftet er at eksporten virker UTEN oss. Den eneste måten å bevise det på, er
// å slå av serveren, åpne fila fra disk med file://, blokkere alt nettverk, og
// se at det sensitive innholdet faktisk kommer fram når frasen skrives inn.
// Går denne testen, kan en etterlatt med fila og frasen lese arkivet om ti år.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { lukkPools } = await import('../server/db.js');
const krypto = await import('../app/js/krypto.js');

const PORT = 3418;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

const FRASE = 'eksportfrase for ida';
// bokstaver utenfor heksadesimal, så treffet ikke kan være en UUID eller et tidsstempel
const SENSITIVT = 'Kodeord xylo-purpur-gnist, safen står på loftet';
const VANLIG = 'Fjordkraft kundenummer 4471';

let eier, server, mappe, filsti;
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
  return { status: svar.status, data };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Eksporttester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'eksport-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'eksport-%@test.no'`);

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
  if (mappe) await fs.rm(mappe, { recursive: true, force: true }).catch(() => {});
  if (tilgjengelig) await eier.end().catch(() => {});
  await lukkPools();
});

const hopp = () => !tilgjengelig;

test('eksporten er én selvstendig HTML-fil — så slås serveren av', { skip: hopp() }, async () => {
  const jar = nyJar();
  await api(jar, 'POST', '/api/auth/registrer',
    { navn: 'Ida Eksport', epost: 'eksport-ida@test.no', passord: 'passord1234' });
  await api(jar, 'POST', '/api/auth/logg-inn',
    { epost: 'eksport-ida@test.no', passord: 'passord1234' });

  await api(jar, 'POST', '/api/elementer',
    { kategori: 'praktisk', tittel: 'Strøm', innhold: VANLIG });

  // sensitivt element, kryptert i «appen» slik nettleseren gjør det
  const { tilServer } = await krypto.opprettHvelvnokler(FRASE);
  await api(jar, 'PUT', '/api/krypto/hvelvnokler', tilServer);
  const hvelvnokkel = await krypto.laasOppHvelvnokkel(FRASE, tilServer);
  const kryptert = await krypto.krypterElement(hvelvnokkel, SENSITIVT);
  const lagt = await api(jar, 'POST', '/api/elementer',
    { kategori: 'tilgangsinfo', nivaa: 'sensitiv', tittel: 'Safen',
      innhold: kryptert.innhold, kryptert: true, nokkelRef: kryptert.nokkelRef });
  assert.equal(lagt.status, 200, JSON.stringify(lagt.data));

  const svar = await fetch(BASE + '/api/eksport', { headers: { Cookie: jar.cookie } });
  assert.equal(svar.status, 200);
  assert.match(svar.headers.get('content-disposition'),
    /attachment; filename="livsarkivet-eksport\.html"/);
  assert.match(svar.headers.get('content-type'), /^text\/html/);
  const html = await svar.text();

  // Selvstendig: ingenting som må hentes fra oss eller fra nettet. Selve
  // datablokka holdes utenfor — den er brukerens egne ord, ikke markup.
  const skallet = html.replace(/<script type="application\/json"[\s\S]*?<\/script>/, '');
  assert.ok(!/<link\b/i.test(skallet), 'fila laster et eksternt stilark');
  assert.ok(!/\bsrc\s*=/i.test(skallet), 'fila laster en ekstern ressurs');
  assert.ok(!/@import|https?:\/\//i.test(skallet), 'fila peker ut på nettet');
  assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(skallet), 'fila kaller ut');
  // Zero-knowledge holder: klarteksten er ingen steder i fila
  assert.ok(!html.includes(SENSITIVT), 'eksporten bærer sensitiv klartekst');
  assert.ok(html.includes(VANLIG), 'det vanlige innholdet mangler i eksporten');

  mappe = await fs.mkdtemp(path.join(os.tmpdir(), 'livsarkivet-eksport-'));
  filsti = path.join(mappe, 'livsarkivet-eksport.html');
  await fs.writeFile(filsti, html, 'utf8');

  // Herfra og ut finnes vi ikke.
  server.kill();
  server = null;
  for (let i = 0; i < 50; i++) {
    try { await fetch(BASE + '/api/helse'); } catch { return; }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Serveren nektet å dø — offline-beviset ville vært verdiløst');
});

test('fila dekrypterer offline: riktig frase åpner innholdet, feil frase gir en forklaring',
  { skip: hopp() }, async () => {
    assert.ok(filsti, 'eksportfila ble aldri skrevet');
    let chromium;
    try {
      ({ chromium } = await import('playwright').catch(() => import('playwright-core')));
    } catch {
      console.log('Nettlesertesten hoppet over: playwright mangler');
      return;
    }
    const stier = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_STI].filter(Boolean);
    const executablePath = (await Promise.all(stier.map(async (p) =>
      (await fs.access(p).then(() => p, () => null))))).find(Boolean);
    const browser = await chromium.launch(executablePath ? { executablePath } : {});

    const nettverk = [];
    const jsFeil = [];
    try {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
        isMobile: true, hasTouch: true, offline: true });
      // ingen vei ut: alt som ikke er selve fila blir logget og avvist
      await ctx.route(/^(https?|ws):/i, (rute) => {
        nettverk.push(rute.request().url());
        return rute.abort();
      });
      const side = await ctx.newPage();
      side.on('request', (r) => {
        if (!r.url().startsWith('file://')) nettverk.push(r.url());
      });
      side.on('pageerror', (f) => jsFeil.push(String(f)));
      side.on('console', (m) => { if (m.type() === 'error') jsFeil.push(m.text()); });

      await side.goto('file://' + filsti);

      // Ukryptert innhold vises uten at noen frase er skrevet
      assert.match(await side.textContent('#elementer'), new RegExp(VANLIG),
        'vanlig innhold vises ikke uten frase');
      assert.ok(!(await side.textContent('#elementer')).includes(SENSITIVT),
        'sensitivt innhold lå åpent uten frase');

      // ── Feil frase: en forklaring, ikke en stack trace ──
      await side.fill('#frase', 'helt feil frase');
      await side.click('#laas-opp');
      await side.waitForSelector('#frase-melding.melding-feil', { timeout: 30_000 });
      const feilmelding = await side.textContent('#frase-melding');
      assert.match(feilmelding, /[Ff]eil sikkerhetsfrase/, 'feilmeldingen forklarer ikke hva som skjedde');
      assert.ok(!/OperationError|TypeError|at [A-Za-z]+ \(|\.js:\d+/.test(feilmelding),
        'feilmeldingen lekker en stack trace: ' + feilmelding);
      assert.ok(!(await side.textContent('#elementer')).includes(SENSITIVT),
        'feil frase åpnet innholdet likevel');

      // ── Riktig frase: klarteksten kommer fram ──
      await side.fill('#frase', FRASE);
      await side.click('#laas-opp');
      await side.waitForSelector('#frase-melding.melding-ok', { timeout: 30_000 });
      const apnet = await side.textContent('#elementer');
      assert.ok(apnet.includes(SENSITIVT),
        'klarteksten kom aldri fram etter riktig frase');

      assert.deepEqual(nettverk, [], 'fila forsøkte å hente noe fra nettet');
      assert.deepEqual(jsFeil, [], 'JS-feil i eksportfila');
    } finally {
      await browser.close();
    }
  });
