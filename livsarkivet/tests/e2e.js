// E2E: hele kjerneloopen gjennom EKTE UI i Chromium (iPhone-viewport 390×844).
// Lykkelig kjede + negativløp (avvist attest, fire-øyne-stopp, eier-blokkering,
// ikke-mottaker). Null uhåndterte JS-feil tolereres. Exit ≠ 0 ved feil.
//
//   node tests/e2e.js   (krever Postgres — se README)
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import pg from 'pg';

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { hashPassord, nyTotpHemmelighet, totpKode } = await import('../server/auth.js');

const PORT = 3402;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');
const KARENSTID_S = 3;

const { chromium } = await import('playwright').catch(() => import('playwright-core'));

let feil = 0;
function sjekk(betingelse, navn) {
  if (betingelse) { console.log('  ✓', navn); }
  else { feil++; console.error('  ✗', navn); }
}

// ── Database-fikstur ──
const eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
await eier.connect();
// rydd ALLE testfiksturer (også fra andre suiter) — admin-køen er global, og
// etterlatte saker i under_verifisering ville forurenset klikkene her
await eier.query(`DELETE FROM hvelv WHERE eier_id IN
  (SELECT id FROM brukere WHERE epost LIKE '%@test.no')`);
await eier.query(`DELETE FROM brukere WHERE epost LIKE '%@test.no'`);
const totpHemmeligheter = new Map();
for (const [navn, epost] of [['Astrid Admin', 'e2e-admin1@test.no'], ['Arne Admin', 'e2e-admin2@test.no']]) {
  const totp = nyTotpHemmelighet();
  totpHemmeligheter.set(epost, totp);
  await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet)
     VALUES ($1, $2, 'admin', $3, $4)`, [navn, epost, await hashPassord('adminpassord123'), totp]);
}

// ── Server ──
const server = spawn('node', ['server/index.js'], {
  cwd: ROT,
  env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1',
    LIVSARKIV_TESTMODUS: '1', KARENSTID_SEKUNDER: String(KARENSTID_S) },
  stdio: ['ignore', 'inherit', 'inherit'],
});
for (let i = 0; ; i++) {
  try { if ((await fetch(BASE + '/api/helse')).ok) break; } catch { /* venter */ }
  if (i > 100) { console.error('Serveren kom aldri opp'); process.exit(1); }
  await new Promise((r) => setTimeout(r, 100));
}

// ── Nettleser ──
const executablePath = ['/opt/pw-browsers/chromium', process.env.CHROMIUM_STI]
  .find((p) => p && fs.existsSync(p));
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const jsFeil = [];

const aapneSider = [];
async function nySide(navn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true });
  const side = await ctx.newPage();
  aapneSider.push([navn, side]);
  side._svar = []; // kø av prompt-svar (sikkerhetsfraser m.m.)
  side.on('pageerror', (e) => jsFeil.push(`${navn}: ${e.message}`));
  side.on('dialog', (d) => d.type() === 'prompt' ? d.accept(side._svar.shift() ?? '') : d.accept());
  await side.goto(BASE);
  return side;
}

const vent = (ms) => new Promise((r) => setTimeout(r, ms));

// Venter på en TILSTAND, ikke på klokka. Faste sleep-er rundt karenstiden gjorde
// testen ustabil: under last (rett etter full testsuite) rakk ikke feieren og
// sidelastingen innenfor sekundene vi ga den, og frigivelsestesten — den
// viktigste vi har — feilet uten at noe var galt med produktet.
async function ventTil(betingelse, hva, maksMs = 30000) {
  const frist = Date.now() + maksMs;
  for (;;) {
    if (await betingelse()) return;
    if (Date.now() > frist) throw new Error(`Ventet forgjeves på: ${hva}`);
    await vent(250);
  }
}

// Feilsøkingshjelp: ved en feilet sjekk lagres skjermbilde og synlig tekst, så
// en fremtidig rød runde kan forklares i stedet for å gjettes på.
async function bevisVedFeil(side, navn) {
  try {
    const fil = path.join(ROT, 'testbevis', `feil-${navn.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}.png`);
    fs.mkdirSync(path.dirname(fil), { recursive: true });
    await side.screenshot({ path: fil, fullPage: true });
    const tekst = (await side.locator('#innhold').innerText().catch(() => '')).slice(0, 400);
    console.error(`    skjermbilde: ${fil}\n    synlig tekst: ${tekst.replace(/\n/g, ' | ')}`);
  } catch { /* feilsøking skal aldri velte testen */ }
}

// Innloggingsfeltene har etiketter, ikke plassholdere: en plassholder forsvinner
// idet man begynner å skrive. Testen peker derfor på etiketten — det er også det
// en bruker og en skjermleser faktisk forholder seg til.
async function loggInnAdmin(side, epost) {
  await side.getByLabel('E-post').fill(epost);
  await side.getByLabel('Passord').fill('adminpassord123');
  await side.click('button:has-text("Logg inn")');
  await side.waitForSelector('input[inputmode="numeric"]');
  await side.getByLabel('Engangskode').fill(totpKode(totpHemmeligheter.get(epost)));
  await side.click('button:has-text("Logg inn")');
  await side.waitForSelector('#faner:not([hidden])');
}

try {
  // ── 1. Eva oppretter arkivet sitt ──
  console.log('1. Eier bygger hvelv, kontakter og matrise');
  const eva = await nySide('eva');
  // innloggingsskjermen skal være ren: hidden må faktisk skjule
  sjekk(!(await eva.isVisible('#logg-ut')) && !(await eva.isVisible('#faner')),
    '«Logg ut» og fanelinjen er skjult før innlogging');
  // med åpen registrering MÅ knappen finnes — den skjules bare når flagget er av
  // isVisible venter IKKE. Knappen tegnes først når /api/miljo har svart, så
  // sjekken kunne kjøre før den fantes — mens click() rett etter fant den, fordi
  // den auto-venter. Derfor så testen ut som om knappen manglet i et sekund.
  await eva.waitForSelector('button:has-text("Opprett ditt livsarkiv")', { timeout: 8000 })
    .catch(() => {});
  sjekk(await eva.isVisible('button:has-text("Opprett ditt livsarkiv")'),
    'registreringsknappen vises når selvregistrering er åpen');
  await eva.click('button:has-text("Opprett ditt livsarkiv")');
  await eva.fill('input[placeholder="Fullt navn"]', 'Eva E2E');
  await eva.fill('input[placeholder="E-post"]', 'e2e-eva@test.no');
  await eva.fill('input[placeholder*="Passord"]', 'passord1234');
  await eva.click('button:has-text("Opprett arkiv")');
  await eva.waitForSelector('#faner:not([hidden])');
  sjekk(await eva.isVisible('h1:has-text("Hvelvet ditt")'), 'hvelvfanen åpner');

  // to elementer
  for (const [kategori, tittel, innhold] of [
    ['juridisk', 'Testament', 'Ligger hos advokat Berg, Storgata 1'],
    ['praktisk', 'Strømavtale', 'Fjordkraft avtale 998877']]) {
    await eva.click('button:has-text("+ Legg til element")');
    await eva.selectOption('select', { value: kategori });
    await eva.getByLabel('Tittel').fill(tittel);
    await eva.fill('textarea', innhold);
    await eva.click('button:has-text("Lagre")');
    await eva.waitForSelector(`h3:has-text("${tittel}")`);
  }
  sjekk(await eva.isVisible('h3:has-text("Testament")'), 'elementene ligger i hvelvet');

  // sensitivt element: krypteres i NETTLESEREN (frase → gjenopprettingskode →
  // lagring), og serveren ser aldri klarteksten
  eva._svar.push('en veldig lang testfrase 123'); // ny sikkerhetsfrase
  await eva.click('button:has-text("+ Legg til element")');
  await eva.locator('select').nth(0).selectOption('tilgangsinfo');
  await eva.locator('select').nth(1).selectOption('sensitiv');
  await eva.getByLabel('Tittel').fill('Safekode');
  // ordet må ha bokstaver utenfor heksadesimal, så «finnes ikke i chiffertekst»
  // ikke kan slå til tilfeldig
  await eva.fill('textarea', 'Koden er zulu-plog');
  await eva.click('button:has-text("Lagre")');
  await eva.waitForSelector('h3:has-text("Safekode")');
  const lagret = await eier.query(
    `SELECT innhold, kryptert FROM hvelv_elementer WHERE tittel = 'Safekode'`);
  sjekk(lagret.rows[0].kryptert && !lagret.rows[0].innhold.includes('zulu-plog'),
    'sensitivt innhold lagres kun som chiffertekst');
  await eva.locator('.kort', { hasText: 'Safekode' }).locator('button:has-text("Endre")').click();
  await eva.click('button:has-text("Lås opp")'); // nøkkelen er alt i minnet
  await eva.waitForFunction(() => document.querySelector('textarea')?.value.includes('zulu-plog'));
  sjekk(true, 'eieren låser opp sensitivt innhold i nettleseren');
  await eva.click('button:has-text("Avbryt")');

  // kontakter: Kari og Per, begge betrodde
  const koder = {};
  for (const [navn, epost] of [['Kari', 'e2e-kari@test.no'], ['Per', 'e2e-per@test.no']]) {
    await eva.click('#faner button:has-text("Kontakter")');
    await eva.waitForSelector('h1:has-text("Kontakter")');
    await eva.getByLabel('Navn').fill(navn);
    await eva.getByLabel('E-post').fill(epost);
    await eva.check('#ny-betrodd');
    await eva.click('button:has-text("Legg til")');
    await eva.waitForSelector(`h3:has-text("${navn}")`);
    const kort = eva.locator('.kort', { hasText: navn }).first();
    await kort.locator('button:has-text("Inviter")').click();
    const tekst = await eva.locator('.melding-ok', { hasText: 'Invitasjonskode' }).first().textContent();
    koder[navn] = tekst.match(/:\s*([a-z0-9]{12})/)[1];
  }
  sjekk(Boolean(koder.Kari && koder.Per), 'invitasjonskoder vises én gang');

  // matrise: Testament → Kari
  await eva.click('#faner button:has-text("Hvem får hva")');
  await eva.waitForSelector('.matrise-tabell');
  await eva.click('td[aria-label="Testament til Kari"]');
  await vent(300);
  sjekk((await eva.textContent('td[aria-label="Testament til Kari"]')).includes('✓'),
    'matrisen huker av Testament → Kari');

  // ── 2. Kari og Per kobler seg til ──
  console.log('2. Kontaktene løser inn kodene sine');
  const kari = await nySide('kari');
  await kari.click('button:has-text("Har du fått en kode?")');
  await kari.fill('input[placeholder="Invitasjonskode"]', koder.Kari);
  await kari.fill('input[placeholder="Fullt navn"]', 'Kari Kontakt');
  await kari.fill('input[placeholder*="Velg passord"]', 'passord1234');
  await kari.click('button:has-text("Koble meg til")');
  await kari.waitForSelector('#faner button:has-text("Meld")');

  const per = await nySide('per');
  await per.click('button:has-text("Har du fått en kode?")');
  await per.fill('input[placeholder="Invitasjonskode"]', koder.Per);
  await per.fill('input[placeholder="Fullt navn"]', 'Per Kontakt');
  await per.fill('input[placeholder*="Velg passord"]', 'passord1234');
  await per.click('button:has-text("Koble meg til")');
  await per.waitForSelector('#faner button:has-text("Meld")');
  sjekk(true, 'begge betrodde har Meld-fanen');

  // ── 3. Kari melder dødsfall + laster opp attest ──
  console.log('3. Melding og attest');
  await kari.click('#faner button:has-text("Meld")');
  await kari.waitForSelector('button:has-text("Meld dødsfall")');
  await kari.click('button:has-text("Meld dødsfall")'); // confirm auto-aksepteres
  await kari.waitForSelector('button:has-text("Last opp attest")');
  await kari.setInputFiles('input[type="file"]',
    { name: 'dodsattest.pdf', mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 e2e-attest') });
  await kari.click('button:has-text("Last opp attest")');
  await kari.waitForSelector('.merkelapp:has-text("Attest mottatt")');
  sjekk(true, 'attest lastet opp — venter på uavhengig bekreftelse');

  // ── 4. Per bekrefter (to-kilde-regelen) ──
  await per.click('#faner button:has-text("Meld")');
  await per.waitForSelector('button:has-text("Bekreft meldingen")');
  await per.click('button:has-text("Bekreft meldingen")');
  await per.waitForSelector('.melding-ok');
  await per.click('#faner button:has-text("Meld")');
  await per.waitForSelector('.merkelapp:has-text("Til verifisering")');
  sjekk(true, 'uavhengig bekreftelse førte saken til verifisering');

  // ── 5. Fire øyne hos saksbehandlerne ──
  console.log('4. Fire-øyne-godkjenning');
  // alle klikk skopes til riktig sakskort — køen er global
  const kariSak = (side) => side.locator('.kort', { hasText: 'meldt av Kari' }).first();

  const admin1 = await nySide('admin1');
  await loggInnAdmin(admin1, 'e2e-admin1@test.no');
  await admin1.waitForSelector('h1:has-text("Verifiseringskø")');
  sjekk(await admin1.isVisible('.kort:has-text("meldt av Kari")'), 'saken står i køen med melder-metadata');
  await kariSak(admin1).locator('button:has-text("Godkjenn attesten")').click();
  await kariSak(admin1).locator('button:has-text("Godkjenn (andre signatur)")').waitFor();

  // samme admin prøver igjen → stoppes
  await kariSak(admin1).locator('button:has-text("Godkjenn (andre signatur)")').click();
  await kariSak(admin1).locator('.melding-feil').waitFor();
  sjekk((await kariSak(admin1).locator('.melding-feil').textContent()).includes('annen saksbehandler'),
    'fire øyne: samme admin stoppes med synlig feilmelding');

  const admin2 = await nySide('admin2');
  await loggInnAdmin(admin2, 'e2e-admin2@test.no');
  await kariSak(admin2).locator('button:has-text("Godkjenn (andre signatur)")').click();
  await kariSak(admin2).locator('.merkelapp:has-text("Karenstid")').waitFor();
  sjekk(true, 'annen admin ga andre signatur — karenstiden løper');

  // ── 6. Eva ser nedtellingen (og lar den løpe) ──
  await eva.click('#faner button:has-text("Status")');
  await eva.waitForSelector('.nedtelling');
  sjekk(await eva.isVisible('button:has-text("STOPP FRIGIVELSEN")'),
    'eieren ser nedtelling og stor stopp-knapp');

  // ── 7. Karenstiden løper ut → Kari ser «Til deg» ──
  console.log('5. Frigivelse og etterlattevisning');
  // Vent på det Kari FAKTISK ser, ikke på klokka. Sidelastingen trigger den late
  // feiingen (bakgrunnsfeieren er av i testmodus), så dette venter på hele
  // kjeden: karenstid utløpt → feiing → frigivelse → fane synlig.
  // Merk: appen må ha REKKET å tegne før vi ser etter fanen. Uten ventingen på
  // #faner målte løkken alltid rett etter en reload — altså på det ene
  // tidspunktet der fanen garantert ikke finnes ennå.
  await ventTil(async () => {
    await kari.reload();
    try { await kari.waitForSelector('#faner:not([hidden])', { timeout: 5000 }); }
    catch { return false; }
    return kari.isVisible('#faner button:has-text("Til deg")');
  }, 'at Kari får «Til deg»-fanen etter at karenstiden er ute');
  await kari.click('#faner button:has-text("Til deg")');
  await kari.waitForSelector('h3:has-text("Testament")');
  sjekk(!(await kari.isVisible('h3:has-text("Strømavtale")')),
    'kun matrisens element er frigitt (Strømavtale er ikke med)');
  await kari.locator('.kort', { hasText: 'Testament' }).locator('button:has-text("Åpne")').click();
  await kari.waitForSelector('text=advokat Berg');
  sjekk(true, 'innholdet åpner i rolig etterlattevisning');

  // Per (uten matriserad) har INGEN «Til deg»-fane
  await per.reload();
  await per.waitForSelector('#faner:not([hidden])');
  sjekk(!(await per.isVisible('#faner button:has-text("Til deg")')),
    'kontakt uten mottakerrettigheter ser ingen etterlattevisning');

  // ── 8. Negativløp: avvist attest ──
  console.log('6. Negativløp: avvist attest');
  await kari.click('#faner button:has-text("Meld")');
  await kari.waitForSelector('button:has-text("Meld dødsfall")');
  await kari.click('button:has-text("Meld dødsfall")');
  await kari.waitForSelector('button:has-text("Last opp attest")');
  await kari.setInputFiles('input[type="file"]',
    { name: 'uleselig.pdf', mimeType: 'application/pdf', buffer: Buffer.from('tull') });
  await kari.click('button:has-text("Last opp attest")');
  await kari.waitForSelector('.merkelapp:has-text("Attest mottatt")');
  await per.click('#faner button:has-text("Meld")');
  await per.waitForSelector('button:has-text("Bekreft meldingen")');
  await per.click('button:has-text("Bekreft meldingen")');
  await per.waitForSelector('.melding-ok');

  await admin1.click('#faner button:has-text("Kø")');
  await kariSak(admin1).locator('button:has-text("Godkjenn attesten")').waitFor();
  await kariSak(admin1).getByLabel('Grunn ved avvisning').fill('Dokumentet er uleselig');
  await kariSak(admin1).locator('button:has-text("Avvis")').click();
  await admin1.waitForSelector('p.meta:has-text("Køen er tom."), .kort:has-text("Karenstid")', { state: 'attached' }).catch(() => {});
  await kari.click('#faner button:has-text("Meld")');
  await kari.waitForSelector('.merkelapp:has-text("Avvist")');
  sjekk(await kari.isVisible('text=Dokumentet er uleselig'), 'melder ser avvisningen med grunn');

  // ── 9. Negativløp: eieren stopper frigivelsen i karenstid ──
  console.log('7. Negativløp: eier-blokkering');
  await kari.click('button:has-text("Meld dødsfall")');
  await kari.waitForSelector('button:has-text("Last opp attest")');
  await kari.setInputFiles('input[type="file"]',
    { name: 'attest2.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 attest2') });
  await kari.click('button:has-text("Last opp attest")');
  await kari.waitForSelector('.merkelapp:has-text("Attest mottatt")');
  await per.click('#faner button:has-text("Meld")');
  await per.waitForSelector('button:has-text("Bekreft meldingen")');
  await per.click('button:has-text("Bekreft meldingen")');
  await per.waitForSelector('.melding-ok');

  await admin1.click('#faner button:has-text("Kø")');
  await kariSak(admin1).locator('button:has-text("Godkjenn attesten")').waitFor();
  await kariSak(admin1).locator('button:has-text("Godkjenn attesten")').click();
  await admin2.click('#faner button:has-text("Kø")');
  await kariSak(admin2).locator('button:has-text("Godkjenn (andre signatur)")').waitFor();
  await kariSak(admin2).locator('button:has-text("Godkjenn (andre signatur)")').click();
  await kariSak(admin2).locator('.merkelapp:has-text("Karenstid")').waitFor();

  await eva.click('#faner button:has-text("Status")');
  await eva.waitForSelector('button:has-text("STOPP FRIGIVELSEN")');
  await eva.click('button:has-text("STOPP FRIGIVELSEN")');
  await eva.waitForSelector('.merkelapp:has-text("Stoppet av eier")');
  sjekk(true, 'eieren stoppet frigivelsen fra appen');

  // Her venter vi på at karenstidens SLUTT er passert (poll, ikke fast sleep) og
  // at en feiing faktisk har kjørt — først da beviser det noe at saken fortsatt
  // står som stoppet.
  await ventTil(async () => (await eier.query(
    `SELECT 1 FROM frigivelser f
       JOIN hvelv h ON h.id = f.hvelv_id JOIN brukere b ON b.id = h.eier_id
      WHERE b.epost = 'e2e-eva@test.no' AND f.status = 'blokkert'
        AND f.karenstid_slutt <= now()`)).rows.length > 0,
    'at den blokkerte sakens karenstid er utløpt');
  // trigger en feiing ETTER utløpet — den skal ikke frigi. Vent på at siden er
  // ferdig lastet, ellers har feiingen kanskje ikke rukket å kjøre i det hele tatt.
  await kari.reload();
  await kari.waitForSelector('#faner:not([hidden])');
  await eva.click('#faner button:has-text("Status")');
  await eva.waitForSelector('.merkelapp:has-text("Stoppet av eier")');
  // nyeste sak (øverst — kun første kjede-sak skal stå som Frigitt lenger ned)
  const nyesteSak = await eva.locator('#innhold .kort').first().textContent();
  sjekk(nyesteSak.includes('Stoppet av eier') && !nyesteSak.includes('Frigitt'),
    '… forblir den blokkerte saken stoppet');

  // ── Skjermbilder som testbevis ──
  const bevisKatalog = path.join(ROT, 'testbevis');
  fs.mkdirSync(bevisKatalog, { recursive: true });
  await eva.click('#faner button:has-text("Hvelv")');
  await vent(400);
  await eva.screenshot({ path: path.join(bevisKatalog, 'eier-hvelv.png') });
  await eva.click('#faner button:has-text("Status")');
  await vent(400);
  await eva.screenshot({ path: path.join(bevisKatalog, 'eier-status-blokkert.png') });
  await kari.click('#faner button:has-text("Til deg")');
  await vent(400);
  await kari.screenshot({ path: path.join(bevisKatalog, 'etterlatt-visning.png') });
  await admin1.click('#faner button:has-text("Kø")');
  await vent(400);
  await admin1.screenshot({ path: path.join(bevisKatalog, 'admin-koe.png') });

  // ── Null JS-feil ──
  sjekk(jsFeil.length === 0, `null uhåndterte JS-feil (${jsFeil.length} funnet)`);
  for (const f of jsFeil) console.error('   JS-feil:', f);
} catch (e) {
  feil++;
  console.error('E2E krasjet:', e);
} finally {
  // Feilet noe, lagres bevis fra alle åpne sider FØR nettleseren lukkes — en
  // rød runde skal kunne forklares, ikke gjettes på.
  if (feil) {
    console.error('\nLagrer feilbevis:');
    for (const [navn, side] of aapneSider) await bevisVedFeil(side, navn);
  }
  await browser.close().catch(() => {});
  server.kill();
  await eier.end().catch(() => {});
}

if (feil) { console.error(`\n${feil} E2E-sjekk(er) feilet`); process.exit(1); }
console.log('\nAlle E2E-sjekker passerte.');
process.exit(0);
