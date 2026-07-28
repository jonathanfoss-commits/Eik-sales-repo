// Generalprøve: går gjennom demo-manuset steg for steg og fotograferer hvert
// steg. Dette er ikke en enhetstest — det er en øvelse på det som skal skje i
// et rom med publikum, og den feiler høyt hvis noe i manuset ikke lar seg
// gjennomføre.
//
//   node tests/generalprove.js [mappe]
//
// Forutsetter fersk base, server på :3400 med KARENSTID_SEKUNDER lav, og
// node server/verktoy/demo-data.js kjørt. Se docs/demo-manus.md.
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';
import { totpKode } from '../server/auth.js';
import { config } from '../server/config.js';

const BASE = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3400';
const UT = process.argv[2] || 'generalprove';
const PASSORD = 'demopassord123';
const FRASE = 'demofrase123';
const D = (n) => `${n}@demo.livsarkivet.no`;

// To svar som IKKE er feil i appen, men som nettleseren logger som ressursfeil:
//   401 — /api/meg ved oppstart, appens måte å spørre «er noen her?»
//   409 — fire-øyne-sperren i steg 3. Den provoseres MED VILJE her; at den
//         svarer 409 er nettopp det manuset skal vise.
const VENTET = /401 \(Unauthorized\)|409 \(Conflict\)/;
const feil = [];
let steg = 0;

const db = new pg.Client({
  connectionString: process.env.MIGRATE_DATABASE_URL || config.databaseUrl });
await db.connect();
const totpFor = async (epost) => totpKode((await db.query(
  'SELECT totp_hemmelighet FROM brukere WHERE epost = $1', [epost])).rows[0].totp_hemmelighet);

const nettleser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
await mkdir(UT, { recursive: true });
const kontekst = await nettleser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, acceptDownloads: true });
const side = await kontekst.newPage();
side.on('console', (m) => {
  if (m.type() === 'error' && !VENTET.test(m.text())) feil.push(`${side.url()} → ${m.text()}`);
});
side.on('pageerror', (e) => feil.push(`${side.url()} → ${e.message}`));

async function foto(navn) {
  await side.waitForTimeout(400);
  const fil = `${String(++steg).padStart(2, '0')}-${navn}`;
  await side.screenshot({ path: `${UT}/${fil}.png`, fullPage: true });
  console.log(`  ${fil}.png`);
}
async function loggInn(epost, medTotp = false) {
  await kontekst.clearCookies();
  await side.goto(BASE, { waitUntil: 'networkidle' });
  await side.fill('input[type=email]', epost);
  await side.fill('input[type=password]', PASSORD);
  await side.click('button:has-text("Logg inn")');
  if (medTotp) {
    await side.waitForSelector('input[placeholder*="Engangskode"]:not([hidden])');
    await side.fill('input[placeholder*="Engangskode"]', await totpFor(epost));
    await side.click('button:has-text("Logg inn")');
  }
  await side.waitForSelector('#faner:not([hidden])', { timeout: 8000 });
}
const fane = async (n) => { await side.click(`#faner button:has-text("${n}")`); await side.waitForTimeout(500); };
function sjekk(ok, hva) {
  console.log(`    ${ok ? '✓' : '✗'} ${hva}`);
  if (!ok) feil.push(`MANUSET BRYTER: ${hva}`);
}

console.log('Generalprøve — demo-manuset steg for steg\n');

// ── Steg 1: eieren har bygget arkivet ──
console.log('Steg 1 · Eieren har bygget arkivet');
await loggInn(D('kari'));
await fane('Hvelv');           await foto('kari-hvelv');
await fane('Hvem får hva');    await foto('kari-matrise');

// ── Steg 2: noen melder dødsfallet ──
console.log('Steg 2 · Noen melder dødsfallet');
await loggInn(D('bjorn'));
await fane('Meld');
sjekk(await side.isVisible('button:has-text("Meld dødsfall")'), 'Bjørn kan melde for Åse');
await foto('bjorn-meld');
side.once('dialog', (d) => d.accept());
await side.click('button:has-text("Meld dødsfall")');
await side.waitForTimeout(700);
const filsti = `${UT}/dodsattest.pdf`;
await writeFile(filsti, '%PDF-1.4 Folkeregisteret — dødsattest (demo)');
await side.setInputFiles('input[type=file]', filsti);
await side.click('button:has-text("Last opp attest")');
await side.waitForTimeout(700);
await foto('bjorn-attest-lastet');

// ── Steg 3: fire øyne ──
console.log('Steg 3 · Fire øyne');
await loggInn(D('astrid'), true);
await fane('Kø');
sjekk(await side.isVisible('button:has-text("Godkjenn attesten")'), 'køen har en sak å godkjenne');
await foto('astrid-koe');
await side.click('button:has-text("Godkjenn attesten")');
await side.waitForTimeout(900);
await foto('astrid-godkjent-en-gang');

// samme saksbehandler igjen — dette er vollgraven, og den MÅ stoppe
const andreGang = side.locator('button:has-text("Godkjenn (andre signatur)")').first();
if (await andreGang.count()) {
  await andreGang.click();
  await side.waitForTimeout(900);
  sjekk(await side.isVisible('.melding-feil'), 'samme saksbehandler stoppes av fire-øyne-sperren');
  await foto('astrid-fire-oyne-sperre');
} else {
  sjekk(false, 'fant ingen «andre signatur»-knapp å teste sperren med');
}

await loggInn(D('arne'), true);
await fane('Kø');
const arneKnapp = side.locator('button:has-text("Godkjenn (andre signatur)")').first();
sjekk(await arneKnapp.count() > 0, 'Arne ser saken som venter på andre signatur');
if (await arneKnapp.count()) { await arneKnapp.click(); await side.waitForTimeout(900); }
await foto('arne-godkjent-karenstid-startet');

// ── Steg 4: nødbremsen ──
console.log('Steg 4 · Nødbremsen');
await loggInn(D('kari'));
await fane('Status');
sjekk(await side.isVisible('.nedtelling'), 'nedtellingen vises');
sjekk(await side.isVisible('button:has-text("STOPP FRIGIVELSEN")'), 'nødbremsen er synlig');
const stoppEr = await side.locator('button:has-text("STOPP FRIGIVELSEN")').boundingBox();
sjekk(stoppEr && stoppEr.y < 844, `nødbremsen er over skjermkanten (y=${Math.round(stoppEr?.y ?? -1)})`);
await foto('kari-karenstid');
await side.click('button:has-text("STOPP FRIGIVELSEN")');
await side.waitForTimeout(900);
sjekk(await side.isVisible('text=Stoppet av eier'), 'saken står som stoppet av eier');
await foto('kari-stoppet');

// ── Steg 5: den etterlatte ──
console.log('Steg 5 · Den etterlatte');
await loggInn(D('mona'));
await fane('Til deg');
sjekk(await side.isVisible('text=Det som haster'), '«én ting om gangen» vises øverst');
sjekk(await side.isVisible('text=Dette trenger du ikke lete etter'), 'Digitalt dødsbo-kortet er der');
await foto('mona-etterlatt');

// ── Steg 6: hva om dere forsvinner ──
console.log('Steg 6 · Exit-garantien');
await loggInn(D('kari'));
await fane('Hvelv');
const nedlasting = side.waitForEvent('download');
await side.click('a:has-text("Last ned alt")');
const fil = await nedlasting;
const eksportSti = `${UT}/livsarkivet-eksport.html`;
await fil.saveAs(eksportSti);
sjekk(fil.suggestedFilename().endsWith('.html'), `eksporten er én HTML-fil (${fil.suggestedFilename()})`);

// Serveren slås av — dette er hele poenget.
console.log('    (slår av serveren …)');
await import('node:child_process').then(({ execSync }) => {
  try { execSync('pkill -f "server/inde[x].js"'); } catch { /* allerede av */ }
});
await new Promise((r) => setTimeout(r, 1500));
const svarerEnda = await fetch(`${BASE}/api/helse`).then(() => true).catch(() => false);
sjekk(!svarerEnda, 'serveren svarer ikke lenger');

const offlineKtx = await nettleser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, offline: true });
const offline = await offlineKtx.newPage();
const nettforsok = [];
await offlineKtx.route(/^(https?|ws):/i, (r) => { nettforsok.push(r.request().url()); r.abort(); });
offline.on('pageerror', (e) => feil.push(`eksportfil → ${e.message}`));
await offline.goto(`file://${resolve(eksportSti)}`);
await offline.waitForTimeout(500);
await offline.screenshot({ path: `${UT}/${String(++steg).padStart(2, '0')}-eksport-laast.png`, fullPage: false });
console.log(`  ${String(steg).padStart(2, '0')}-eksport-laast.png`);

await offline.fill('input[type=password]', FRASE);
await offline.keyboard.press('Enter');
await offline.waitForTimeout(1200);
const aapnet = await offline.locator('text=Bankboks 44').count();
sjekk(aapnet > 0, 'sikkerhetsfrasen låser opp innholdet — uten server, uten nett');
sjekk(nettforsok.length === 0, `fila forsøkte ingen nettverkskall (${nettforsok.length})`);
await offline.screenshot({ path: `${UT}/${String(++steg).padStart(2, '0')}-eksport-aapnet.png`, fullPage: false });
console.log(`  ${String(steg).padStart(2, '0')}-eksport-aapnet.png`);

await nettleser.close();
await db.end();

console.log(`\n${steg} skjermbilder i ${UT}/`);
if (feil.length) {
  console.log(`\n${feil.length} problem(er):`);
  for (const f of feil) console.log(`  · ${f}`);
  process.exit(1);
}
console.log('Manuset går gjennom. Ingen konsollfeil.');
