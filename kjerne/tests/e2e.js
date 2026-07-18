/* E2E-bevisene i ekte nettleser (iPhone 390×844): tenant-tema, LIVE-beviset
   (to samtidige brukere), rollenivåene, tenant-isolasjonen, 503-reserven og
   innflyttingen. Selvforsynt: setter egne fixture-passord via eier-tilkoblingen
   og rydder etter seg. Kjøres av CI (node tests/e2e.js) og lokalt.
   Chromium: bruker CHROMIUM_STI / /opt/pw-browsers/chromium hvis satt/finnes,
   ellers Playwrights egen installasjon (CI). */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import pg from 'pg';
import { hashPassord } from '../server/auth.js';

const { chromium } = await import('playwright').catch(() => import('playwright-core'));

const ROT = path.resolve(import.meta.dirname, '..');
const PORT = 3193;
const URL = `http://127.0.0.1:${PORT}`;
const PASSORD = 'e2e-testpassord-1';
const KJENT = ['jonathan.foss@eikandfriends.no', 'ole.fabian@opbygg.no', 'demo@malermester-demo.no'];

let ok = 0, feil = 0;
const sjekk = (navn, b, ekstra) => {
  if (b) { ok++; console.log('  ✅ ' + navn); }
  else { feil++; console.log('  ❌ ' + navn + (ekstra ? ' — ' + ekstra : '')); }
};

const eierUrl = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
const eier = new pg.Client({ connectionString: eierUrl });
await eier.connect();
// kjente fixture-passord (kun test-databasen) + rydd tidligere e2e-brukere
for (const epost of KJENT) {
  await eier.query('UPDATE brukere SET passord_hash = $2, aktiv = true WHERE lower(epost) = $1',
    [epost, hashPassord(PASSORD)]);
}
// generisk opprydding av forrige kjørings e2e-brukere: nuller/sletter i ALLE
// tabeller som refererer brukere (nye moduler blir automatisk med)
const E2E_FILTER = `IN (SELECT id FROM brukere WHERE epost LIKE 'e2e-%@opbygg.no')`;
await eier.query(`UPDATE invitasjoner SET brukt_av = NULL WHERE brukt_av ${E2E_FILTER}`);
for (const [tabell, kolonne] of [
  ['sesjoner', 'bruker_id'], ['nullstillinger', 'bruker_id'], ['pilotlogg', 'bruker_id'],
  ['revisjon', 'bruker_id'], ['godkjenninger', 'bruker_id'], ['tillegg', 'bruker_id'],
  ['dagbok', 'bruker_id'], ['varsler', 'bruker_id'], ['fakturaer', 'bruker_id'],
  ['prosjektfrister', 'bruker_id'], ['timeforinger', 'bruker_id'], ['innspill', 'bruker_id'],
  ['ai_logg', 'bruker_id'],
]) {
  await eier.query(`DELETE FROM ${tabell} WHERE ${kolonne} ${E2E_FILTER}`).catch(() => {});
}
await eier.query(`DELETE FROM brukere WHERE epost LIKE 'e2e-%@opbygg.no'`);

const server = spawn('node', ['server/index.js'], {
  cwd: ROT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'pipe',
});
for (let i = 0; i < 60; i++) {
  try { await fetch(URL + '/api/helse'); break; }
  catch { await new Promise((r) => setTimeout(r, 200)); }
}

const lokalChromium = process.env.CHROMIUM_STI
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch(lokalChromium ? { executablePath: lokalChromium } : {});
const mobil = { viewport: { width: 390, height: 844 } };

async function loggInn(hvem) {
  const ctx = await browser.newContext(mobil);
  const p = await ctx.newPage();
  p._feil = [];
  p.on('pageerror', (e) => p._feil.push(String(e)));
  await p.goto(URL);
  await p.waitForSelector('#login-epost', { state: 'visible' });
  await p.fill('#login-epost', hvem);
  await p.fill('#login-passord', PASSORD);
  await p.click('#login-knapp');
  await p.waitForSelector('#app-navn', { state: 'visible', timeout: 8000 });
  await p.waitForTimeout(500);
  return p;
}

try {
  console.log('── 1: Lærling-tenanten — tema, moduler, roller ──');
  const pJ = await loggInn(KJENT[0]);
  sjekk('Jonathan er inne', !(await pJ.isVisible('#login-epost')));
  sjekk('Appnavnet er «Lærling» (fra konfig)', (await pJ.textContent('#app-navn')) === 'Lærling');
  const aksent = await pJ.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--aksent').trim());
  sjekk('Midnatt-temaet er aktivt (aurora-grønn)', aksent === '#39E29B', aksent);
  const faner = await pJ.$$eval('#tabs .tab', (t) => t.map((x) => x.textContent));
  sjekk('Ledelsen ser Sentral-fanen', faner.some((f) => f.includes('Sentral')));

  console.log('── 2: LIVE-beviset — to brukere, ingen omlasting ──');
  const pO = await loggInn(KJENT[1]);
  await pJ.click('#tabs .tab:has-text("Dagbok")');
  await pJ.waitForTimeout(500);
  const beviset = 'Levert bindingsverk i 2. etasje ' + Date.now();
  await pO.click('#tabs .tab:has-text("Dagbok")');
  await pO.waitForTimeout(400);
  await pO.click('#fane-dagbok .knapp:has-text("Ny linje")');
  await pO.fill('#f-prosjekt', 'Krohgs gate 60');
  await pO.fill('#f-tekst', beviset);
  await pO.click('#ark .knapp:has-text("Før i dagboka")');
  await pO.waitForTimeout(2000); // SSE + refetch hos Jonathan — INGEN reload
  sjekk('LIVE: Jonathan ser Ole Fabians linje uten omlasting',
    (await pJ.textContent('#fane-dagbok')).includes(beviset.slice(0, 40)));
  sjekk('LIVE: «Ole Fabian · skrev i dagboka»-markering vises',
    (await pJ.textContent('#live-status')).includes('Ole Fabian'));

  console.log('── 3: Rollenivåene — ansatt via invitasjon ──');
  await pJ.click('#tabs .tab:has-text("Sentral")');
  await pJ.waitForTimeout(700);
  await pJ.click('button:has-text("Lag invitasjonskode")');
  await pJ.waitForSelector('#ark-innhold .utkast-ut', { timeout: 5000 });
  const kode = (await pJ.textContent('#ark-innhold .utkast-ut')).trim();
  sjekk('Invitasjonskode laget fra Sentral (i ark)', /^[a-z2-9]{12}$/.test(kode), kode);
  await pJ.click('#ark-lukk');
  await pJ.waitForTimeout(300);
  const ctxA = await browser.newContext(mobil);
  const pA = await ctxA.newPage();
  pA._feil = [];
  pA.on('pageerror', (e) => pA._feil.push(String(e)));
  await pA.goto(URL);
  await pA.waitForSelector('#vis-registrering', { state: 'visible' });
  await pA.click('#vis-registrering');
  await pA.fill('#reg-kode', kode);
  await pA.fill('#reg-navn', 'Emil Ansatt');
  await pA.fill('#reg-epost', 'e2e-' + Date.now() + '@opbygg.no'); // unik — databasen består
  await pA.fill('#reg-passord', 'langt-nok-passord-1');
  await pA.click('#reg-knapp');
  await pA.waitForSelector('#app-navn', { state: 'visible', timeout: 8000 });
  sjekk('Ansatt registrert med invitasjonskode og logget inn', true);
  const ansattFaner = await pA.$$eval('#tabs .tab', (t) => t.map((x) => x.textContent));
  sjekk('Ansatt ser IKKE Sentral-fanen', !ansattFaner.some((f) => f.includes('Sentral')));
  const kost = await pA.evaluate(() => fetch('/api/sentral/ai-kost').then((r) => r.status));
  sjekk('Ansatt får 403 på AI-kost også rett mot API-et', kost === 403);
  await pA.click('#tabs .tab:has-text("Timer")');
  await pA.waitForTimeout(400);
  await pA.click('#fane-timer .knapp:has-text("Før timer")');
  await pA.fill('#f-prosjekt', 'Krohgs gate 60');
  for (let i = 0; i < 12; i++) await pA.click('#ark .knapp:has-text("+0,5")');
  await pA.click('#ark .knapp:has-text("Lagre")');
  await pA.waitForTimeout(900);
  await pJ.click('#tabs .tab:has-text("Timer")');
  await pJ.waitForTimeout(500);
  await pJ.click('#fane-timer .knapp:has-text("Vis hele laget")');
  await pJ.waitForTimeout(700);
  sjekk('Ledelsen ser Emils timer i lagsvisningen',
    (await pJ.textContent('#fane-timer')).includes('Emil'));
  const emilsListe = await pA.textContent('#fane-timer');
  sjekk('Emil ser aldri andres timer', !emilsListe.includes('Jonathan') && !emilsListe.includes('Ole'));

  console.log('── 4: Tenant-isolasjonen — Malermester Demo ──');
  const pM = await loggInn(KJENT[2]);
  sjekk('Mesterhjelpen har eget navn', (await pM.textContent('#app-navn')) === 'Mesterhjelpen');
  const mAksent = await pM.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--aksent').trim());
  sjekk('Malermester-temaet er aktivt (gull — ikke aurora)', mAksent === '#E8B64C', mAksent);
  const mFaner = await pM.$$eval('#tabs .tab', (t) => t.map((x) => x.textContent));
  sjekk('Færre moduler (ingen Dagbok-fane)', !mFaner.some((f) => f.includes('Dagbok')));
  const mDagbok = await pM.evaluate(() => fetch('/api/dagbok').then((r) => r.json()));
  // Malermester kan ha EGNE demolinjer — beviset er at ingenting fra OP Bygg
  // lekker over (prosjektet «Krohgs gate» finnes kun hos OP Bygg).
  sjekk('Isolasjon: null OP Bygg-dagbok hos Malermester (RLS)',
    Array.isArray(mDagbok.linjer) &&
    !JSON.stringify(mDagbok.linjer).includes('Krohgs gate'));

  console.log('── 5: Skrivemotor-reserven (uten API-nøkkel) og innflyttingen ──');
  await pA.click('#pluss');
  await pA.waitForTimeout(300);
  await pA.click('#ark .hurtig:has-text("Utkast")');
  await pA.waitForTimeout(700);
  await pA.fill('#f-tekst', 'purr på byggmakker om karmene');
  await pA.click('#ark .knapp:has-text("Lag utkast")');
  await pA.waitForTimeout(900);
  sjekk('Uten nøkkel: jordnær 503-beskjed, ingen krasj',
    (await pA.textContent('#toast')).includes('ikke koblet til'));
  await pA.click('#ark-lukk');
  await pA.waitForTimeout(300);
  await pA.click('#pluss');
  await pA.waitForTimeout(300);
  await pA.click('#ark .hurtig:has-text("Innflytting")');
  await pA.waitForTimeout(400);
  const eksport = JSON.stringify({ eksportert: '2026-07-18', versjon: '1',
    timer: [{ dato: '2026-07-17', prosjekt: 'Solveien 12', timer: 7.5, notat: 'Kledning' }],
    veiviser: { motor: 1 } });
  await pA.fill('#ark textarea', eksport);
  await pA.waitForTimeout(300);
  await pA.click('#ark .knapp:has-text("Importer")');
  await pA.waitForTimeout(900);
  const kvitt = await pA.textContent('#ark-innhold');
  sjekk('Innflyttingen importerer med kvittering',
    kvitt.includes('1 timeføring') && kvitt.includes('veiviser'));

  for (const [navn, p] of [['Jonathan', pJ], ['Ole Fabian', pO], ['Emil', pA], ['Malermester', pM]]) {
    sjekk(`Ingen JS-feil (${navn})`, p._feil.length === 0, p._feil.join(' | '));
  }
} finally {
  await browser.close();
  server.kill();
  await eier.end();
}

console.log(`\n══ E2E-RESULTAT: ${ok} OK, ${feil} feil ══`);
process.exit(feil ? 1 : 0);
