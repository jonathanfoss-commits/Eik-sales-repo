// Designverktøy, ikke en test: logger inn som hver rolle og fotograferer hver
// skjerm på 390×844, slik at designarbeidet kan gjøres mot det appen FAKTISK
// viser i stedet for mot hukommelsen.
//
//   node tests/skjermbilder.js [mappe]
//
// Krever at serveren kjører med demo-data (server/verktoy/demo-data.js).
// Skriver også ut konsollfeil per skjerm — en skjerm med feil skal aldri
// ende opp i et investordekk.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { totpKode } from '../server/auth.js';

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3400';
const UT = process.argv[2] || 'skjermbilder';
const PASSORD = 'demopassord123';

// TOTP-hemmelighetene demo-data.js skriver ut. Overstyres med env når
// demo-dataen er lagt inn på nytt og hemmelighetene er andre.
const ASTRID_TOTP = process.env.ASTRID_TOTP || 'UJKGZX53E3PRFFNYVXUUP24AI6FPILSQ';

const feil = [];

async function skjerm(side, navn) {
  await side.waitForTimeout(350);
  await side.screenshot({ path: `${UT}/${navn}.png`, fullPage: true });
  console.log(`  ${navn}.png`);
}

async function loggInn(side, epost, totpHemmelighet = null) {
  await side.goto(BASE, { waitUntil: 'networkidle' });
  await side.fill('input[type=email]', epost);
  await side.fill('input[type=password]', PASSORD);
  await side.click('button:has-text("Logg inn")');
  if (totpHemmelighet) {
    await side.waitForSelector('input[placeholder*="Engangskode"]:not([hidden])',
      { timeout: 5000 });
    await side.fill('input[placeholder*="Engangskode"]', totpKode(totpHemmelighet));
    await side.click('button:has-text("Logg inn")');
  }
  await side.waitForSelector('#faner:not([hidden])', { timeout: 8000 });
}

async function fane(side, navn) {
  await side.click(`#faner button:has-text("${navn}")`);
  await side.waitForTimeout(500);
}

const nettleser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
await mkdir(UT, { recursive: true });

const kontekst = await nettleser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
});

const side = await kontekst.newPage();
side.on('console', (m) => {
  if (m.type() === 'error') feil.push(`${side.url()} → ${m.text()}`);
});
side.on('pageerror', (e) => feil.push(`${side.url()} → ${e.message}`));

console.log('Fotograferer:');

// 1. Utlogget
await side.goto(BASE, { waitUntil: 'networkidle' });
await skjerm(side, '01-innlogging');

// 2. Eier med fullt hvelv og løpende karenstid
await loggInn(side, 'kari@demo.livsarkivet.no');
await fane(side, 'Hvelv');      await skjerm(side, '02-hvelv');
await fane(side, 'Kontakter');  await skjerm(side, '03-kontakter');
await fane(side, 'Hvem får hva'); await skjerm(side, '04-matrise');
await fane(side, 'Status');     await skjerm(side, '05-status-karenstid');

// 3. Betrodd kontakt: meld dødsfall
await side.goto(`${BASE}/api/auth/logg-ut`).catch(() => {});
await kontekst.clearCookies();
await loggInn(side, 'bjorn@demo.livsarkivet.no');
await fane(side, 'Meld');       await skjerm(side, '06-meld-dodsfall');

// 4. Mottaker: etterlattevisningen
await kontekst.clearCookies();
await loggInn(side, 'mona@demo.livsarkivet.no');
await fane(side, 'Til deg');    await skjerm(side, '07-etterlatt');

// 5. Saksbehandler: kø og logg
await kontekst.clearCookies();
await loggInn(side, 'astrid@demo.livsarkivet.no', ASTRID_TOTP);
await fane(side, 'Kø');         await skjerm(side, '08-admin-koe');
await fane(side, 'Logg');       await skjerm(side, '09-admin-logg');

await nettleser.close();

if (feil.length) {
  console.log(`\n${feil.length} konsollfeil:`);
  for (const f of feil) console.log(`  · ${f}`);
  process.exit(1);
}
console.log('\nIngen konsollfeil.');
