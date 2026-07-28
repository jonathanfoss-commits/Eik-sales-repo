// Fyller en TOM database med et realistisk norsk demo-scenario, slik at du kan
// klikke gjennom hele produktet uten å registrere noe selv:
//
//   node server/verktoy/demo-data.js
//
// Du får fire hvelv i ulike stadier — et med karenstid som løper (så du ser
// nedtellingen og STOPP-knappen), et til verifisering (så saksbehandlerkøen har
// noe å vise), et frigitt (så etterlattevisningen har innhold), og et urørt
// (så «Meld dødsfall» kan prøves). Alle innlogginger skrives ut til slutt.
//
// Sperren verner om EKTE DATA, ikke om et miljønavn: verktøyet nekter hvis
// databasen inneholder én eneste konto som ikke er demo. (Første versjon
// nektet bare når NODE_ENV=production — men et testmiljø kjører gjerne med
// NODE_ENV=production for å få Secure-cookie og HSTS, så sperren slo ut på
// helt legitim bruk uten å si hva man skulle gjøre i stedet.)
import pg from 'pg';
import { config } from '../config.js';
import { hashPassord, nyTotpHemmelighet, totpKode } from '../auth.js';

const PASSORD = 'demopassord123';
// Lokalt som standard. Skal du fylle en tjeneste i skyen, sett DEMO_BASE_URL
// til dens URL og MIGRATE_DATABASE_URL til dens EKSTERNE tilkoblingsstreng.
const BASE = (process.env.DEMO_BASE_URL || `http://127.0.0.1:${config.port}`).replace(/\/$/, '');

// Serveren må kjøre — demo-dataen legges inn gjennom det EKTE API-et, slik at
// alt går gjennom de samme reglene og policyene som en vanlig bruker møter.
try {
  const helse = await fetch(BASE + '/api/helse');
  if (!helse.ok) throw new Error('helsesjekk feilet');
} catch {
  console.error(`Fant ingen server på ${BASE}. Start den først med «npm start»`
    + ' (og husk REGISTRERING_AAPEN=1 i .env), eller sett DEMO_BASE_URL.');
  process.exit(1);
}

const eier = new pg.Client({
  connectionString: process.env.MIGRATE_DATABASE_URL || config.databaseUrl });
await eier.connect();

// ── sperren ──
// Verktøyet sletter og gjenskaper BARE kontoer på @demo.livsarkivet.no; andres
// data røres aldri. Risikoen er derfor å forurense et system med ekte brukere,
// ikke å ødelegge noe. Da er riktig sperre å vise hva som finnes og kreve et
// bevisst valg — ikke å nekte blankt.
const ekte = (await eier.query(
  `SELECT navn, epost FROM brukere WHERE epost NOT LIKE '%@demo.livsarkivet.no'
    ORDER BY opprettet LIMIT 6`)).rows;
if (ekte.length && !process.argv.includes('--tving')) {
  console.error(
    `Stopper: her finnes allerede ${ekte.length > 5 ? 'mer enn 5' : ekte.length} konto(er)`
    + ' som ikke er demo:\n'
    + ekte.slice(0, 5).map((b) => `  · ${b.navn} <${b.epost}>`).join('\n')
    + '\n\nDemo-data hører ikke i et system med ekte brukere. Verktøyet sletter'
    + ' kun\nkontoer på @demo.livsarkivet.no, så ingenting av det over står i fare.'
    + '\nEr dette et testmiljø likevel (f.eks. en base som har kjørt testsuiten),'
    + '\nkjør igjen med --tving.');
  await eier.end();
  process.exit(1);
}

// ── nullstill forrige demo ──
await eier.query(`DELETE FROM hvelv WHERE eier_id IN
  (SELECT id FROM brukere WHERE epost LIKE '%@demo.livsarkivet.no')`);
await eier.query(`DELETE FROM brukere WHERE epost LIKE '%@demo.livsarkivet.no'`);

function jar() { return { cookie: '' }; }
async function api(j, metode, sti, kropp) {
  const svar = await fetch(BASE + sti, {
    method: metode,
    headers: { 'Content-Type': 'application/json', ...(j.cookie ? { Cookie: j.cookie } : {}) },
    body: kropp === undefined ? undefined : JSON.stringify(kropp) });
  const satt = svar.headers.get('set-cookie');
  if (satt) j.cookie = satt.split(';')[0];
  let data = {};
  try { data = await svar.json(); } catch { /* tomt */ }
  if (svar.status === 429) {
    // demoen oppretter åtte kontoer, og registrering er begrenset til 20 per
    // time per IP — tredje kjøring på rad treffer taket
    console.error(
      'Rate-demperen har slått inn: demoen oppretter åtte kontoer, og'
      + ' registrering\ner begrenset til 20 per time per IP.\n\n'
      + 'Telleren ligger i minnet, så en omstart av tjenesten nullstiller den'
      + ' (i Render:\nManual Deploy → Restart service). Ellers: vent en time.');
    process.exit(1);
  }
  if (!svar.ok) throw new Error(`${metode} ${sti} → ${svar.status} ${JSON.stringify(data)}`);
  return data;
}
async function nyEier(navn, epost) {
  const j = jar();
  await api(j, 'POST', '/api/auth/registrer', { navn, epost, passord: PASSORD });
  await api(j, 'POST', '/api/auth/logg-inn', { epost, passord: PASSORD });
  return j;
}
async function nyAdmin(navn, epost) {
  const totp = nyTotpHemmelighet();
  await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet)
     VALUES ($1, $2, 'admin', $3, $4)`, [navn, epost, await hashPassord(PASSORD), totp]);
  const j = jar();
  await api(j, 'POST', '/api/auth/logg-inn', { epost, passord: PASSORD, totp: totpKode(totp) });
  return { jar: j, totp };
}
async function kobleKontakt(eierJar, kontaktId, epost) {
  // eieren inviterer; vi kobler den eksisterende kontoen til kontaktraden
  await api(eierJar, 'POST', `/api/kontakter/${kontaktId}/invitasjon`);
  const bruker = (await eier.query(
    'SELECT id FROM brukere WHERE epost = $1', [epost])).rows[0];
  await eier.query('UPDATE kontakter SET bruker_id = $2 WHERE id = $1', [kontaktId, bruker.id]);
}
async function meldOgAttest(kontaktJar, hvelvId) {
  const meldt = await api(kontaktJar, 'POST', '/api/hendelser', { hvelvId });
  await api(kontaktJar, 'POST', `/api/hendelser/${meldt.hendelseId}/attest`,
    { filnavn: 'dodsattest.pdf', mime: 'application/pdf',
      innholdBase64: Buffer.from('%PDF-1.4 Folkeregisteret — dødsattest (demo)').toString('base64') });
  return meldt.hendelseId;
}

const e = (navn) => `${navn}@demo.livsarkivet.no`;

// ── saksbehandlere ──
const astrid = await nyAdmin('Astrid Halvorsen', e('astrid'));
const arne = await nyAdmin('Arne Dahl', e('arne'));

// ── HVELV 1: Kari Nordbø — fullt hvelv, karenstid løper ──
const kari = await nyEier('Kari Nordbø', e('kari'));
for (const [kategori, tittel, innhold] of [
  ['praktisk', 'Nøkler og alarmkode', 'Reservenøkkel hos nabo Solveig (2. etg). Alarmkode 4471. Katten Mons skal til Solveig.'],
  ['praktisk', 'Strøm og internett', 'Fjordkraft, kundenr 88123. Telenor bredbånd står på min e-post.'],
  ['juridisk', 'Testament', 'Originalen hos advokat Berg, Storgata 12, Oslo. Kopi i blå mappe i skrivebordsskuffen.'],
  ['forsikring', 'Livsforsikring', 'Gjensidige, polise 553-2291. Dekker også gjelden på hytta.'],
  ['eiendeler', 'Hytta på Nesodden', 'Gnr/bnr 44/12. Delt eierskap med broren min Bjørn — se avtalen i den blå mappen.'],
  ['digitale_kontoer', 'Facebook og Google', 'Facebook: gjør om til minneside. Google: se tilgangsinfo.'],
  ['helsedirektiv', 'Mine ønsker om behandling', 'Jeg ønsker ikke gjenoppliving ved alvorlig hjerneskade. Snakket med fastlege Aud Rimmen i mars.'],
]) {
  await api(kari, 'POST', '/api/elementer', { kategori, tittel, innhold });
}
const kariKontakter = {};
for (const [navn, epost, relasjon, erBetrodd] of [
  ['Bjørn Nordbø', e('bjorn'), 'bror', true],
  ['Mona Nordbø', e('mona'), 'datter', true],
  ['Solveig Aas', e('solveig'), 'nabo', false],
]) {
  const k = await api(kari, 'POST', '/api/kontakter', { navn, epost, relasjon, erBetrodd });
  kariKontakter[navn] = k.kontakt.id;
}
const kariHvelv = await api(kari, 'GET', '/api/hvelv');
const kariElement = (tittel) => kariHvelv.elementer.find((x) => x.tittel === tittel).id;
for (const [tittel, navn] of [
  ['Nøkler og alarmkode', 'Solveig Aas'], ['Nøkler og alarmkode', 'Bjørn Nordbø'],
  ['Strøm og internett', 'Mona Nordbø'], ['Testament', 'Mona Nordbø'],
  ['Livsforsikring', 'Mona Nordbø'], ['Hytta på Nesodden', 'Bjørn Nordbø'],
  ['Facebook og Google', 'Mona Nordbø'], ['Mine ønsker om behandling', 'Mona Nordbø'],
]) {
  await api(kari, 'POST', '/api/matrise',
    { elementId: kariElement(tittel), kontaktId: kariKontakter[navn] });
}
const bjorn = await nyEier('Bjørn Nordbø', e('bjorn'));
const mona = await nyEier('Mona Nordbø', e('mona'));
await kobleKontakt(kari, kariKontakter['Bjørn Nordbø'], e('bjorn'));
await kobleKontakt(kari, kariKontakter['Mona Nordbø'], e('mona'));

const kariHendelse = await meldOgAttest(bjorn, kariHvelv.hvelv.id);
await api(mona, 'POST', `/api/hendelser/${kariHendelse}/bekreft`);
let koe = await api(astrid.jar, 'GET', '/api/admin/koe');
const kariSak = koe.saker.find((s) => s.hendelse_id === kariHendelse);
await api(astrid.jar, 'POST', `/api/admin/frigivelser/${kariSak.id}/godkjenn`);
await api(arne.jar, 'POST', `/api/admin/frigivelser/${kariSak.id}/godkjenn`);

// ── HVELV 2: Odd Solheim — sak til verifisering (fyller saksbehandlerkøen) ──
const odd = await nyEier('Odd Solheim', e('odd'));
await api(odd, 'POST', '/api/elementer', { kategori: 'praktisk', tittel: 'Gravferdsønsker',
  innhold: 'Begravelse fra Ris kirke. Ingen blomster — gi til Kirkens Bymisjon.' });
const oddKontakt = await api(odd, 'POST', '/api/kontakter',
  { navn: 'Siri Solheim', epost: e('siri'), relasjon: 'søster', erBetrodd: true });
const siri = await nyEier('Siri Solheim', e('siri'));
await kobleKontakt(odd, oddKontakt.kontakt.id, e('siri'));
const oddHvelv = (await api(siri, 'GET', '/api/melding/hvelv')).hvelv
  .find((h) => h.eier_navn === 'Odd Solheim');
await meldOgAttest(siri, oddHvelv.hvelv_id);

// ── HVELV 3: Ingrid Berg — frigitt, Mona er mottaker (etterlattevisning) ──
const ingrid = await nyEier('Ingrid Berg', e('ingrid'));
for (const [kategori, tittel, innhold] of [
  ['praktisk', 'Det viktigste først', 'Begravelsesbyrå Jølstad, tlf 22 12 34 56 — alt er avtalt og betalt. Nøkkel til leiligheten hos vaktmester.'],
  ['praktisk', 'Regninger som løper', 'Husleie trekkes den 20. Strøm hos Elvia. Si opp Netflix og treningssenteret.'],
  ['juridisk', 'Testament og skifte', 'Testament hos advokat Lie. Kontakt henne før dere gjør noe med leiligheten.'],
  ['siste_hilsen', 'Til Mona', 'Kjære Mona. Leser du dette, er jeg ikke her lenger — og det går sikkert helt fint med deg likevel. Du har alltid vært sterkere enn du tror. Ta vare på hagen. Klem fra tante Ingrid.'],
]) {
  await api(ingrid, 'POST', '/api/elementer', { kategori, tittel, innhold });
}
const ingridKontakt = await api(ingrid, 'POST', '/api/kontakter',
  { navn: 'Mona Nordbø', epost: e('mona'), relasjon: 'niese', erBetrodd: true });
await kobleKontakt(ingrid, ingridKontakt.kontakt.id, e('mona'));
const ingridHvelv = await api(ingrid, 'GET', '/api/hvelv');
for (const el of ingridHvelv.elementer) {
  await api(ingrid, 'POST', '/api/matrise',
    { elementId: el.id, kontaktId: ingridKontakt.kontakt.id });
}
const ingridHendelse = await meldOgAttest(mona, ingridHvelv.hvelv.id);
koe = await api(astrid.jar, 'GET', '/api/admin/koe');
const ingridSak = koe.saker.find((s) => s.hendelse_id === ingridHendelse);
await api(astrid.jar, 'POST', `/api/admin/frigivelser/${ingridSak.id}/godkjenn`);
await api(arne.jar, 'POST', `/api/admin/frigivelser/${ingridSak.id}/godkjenn`);
// spol karenstiden fram, slik at etterlattevisningen har noe å vise NÅ
await eier.query(
  `UPDATE frigivelser SET karenstid_slutt = now() - interval '1 minute' WHERE id = $1`,
  [ingridSak.id]);
await api(mona, 'GET', '/api/etterlatt');   // lat feiing frigir saken

// ── HVELV 4: Åse Lind — urørt, så «Meld dødsfall» kan prøves ──
const aase = await nyEier('Åse Lind', e('aase'));
await api(aase, 'POST', '/api/elementer',
  { kategori: 'praktisk', tittel: 'Katten Pusur', innhold: 'Pusur skal til søsteren min i Bergen.' });
const aaseKontakt = await api(aase, 'POST', '/api/kontakter',
  { navn: 'Bjørn Nordbø', epost: e('bjorn'), relasjon: 'venn', erBetrodd: true });
await kobleKontakt(aase, aaseKontakt.kontakt.id, e('bjorn'));

// ── gjør tidsstemplene troverdige ──
//
// Vaktagentens flagg er tidsbaserte: melder registrert siste 14 dager, matrisen
// endret siste 7, attest lastet opp under 30 sekunder etter meldingen. Demoen
// bygger ALT på ett sekund, så alle tre slo ut på hver eneste sak — og en
// risikoagent som flagger alt, sier ingenting. Verre: den ser ut som den roper
// ulv, foran den som skal vurdere om vi kan noe.
//
// Vi flytter derfor historikken bakover for de hvelvene som skal se normale ut,
// og lar Odds sak beholde flaggene. Da viser køen det den skal vise: agenten
// varsler på én sak, ikke på alle, og et menneske bestemmer uansett.
// Merk rekkefølgen: attesten må ligge ETTER meldingen, ellers er differansen
// negativ og «påfallende rask»-flagget slår ut likevel. Meldingen flyttes åtte
// timer tilbake, attesten seks — altså to timer mellom dem, som er hvordan det
// faktisk går til når noen skal skaffe en dødsattest.
const rolige = [kariHvelv.hvelv.id, ingridHvelv.hvelv.id];
await eier.query(
  `UPDATE kontakter SET opprettet = opprettet - interval '8 months'
    WHERE hvelv_id = ANY($1)`, [rolige]);
await eier.query(
  `UPDATE revisjon SET tid = tid - interval '5 months'
    WHERE hvelv_id = ANY($1)
      AND hendelse IN ('matrise_lagt_til','matrise_fjernet','kontakt_opprettet','kontakt_endret')`,
  [rolige]);
await eier.query(
  `UPDATE hendelser SET opprettet = opprettet - interval '8 hours'
    WHERE hvelv_id = ANY($1)`, [rolige]);
await eier.query(
  `UPDATE frigivelser SET opprettet = opprettet - interval '8 hours'
    WHERE hvelv_id = ANY($1)`, [rolige]);
await eier.query(
  `UPDATE attester SET opprettet = opprettet - interval '6 hours'
     WHERE hendelse_id IN (SELECT id FROM hendelser WHERE hvelv_id = ANY($1))`,
  [rolige]);

// Flaggene LAGRES når saken opprettes, så det holder ikke å flytte
// tidsstemplene. Vi lar vaktagenten vurdere på nytt — det er den ekte koden
// som gir det nye svaret, ikke en håndredigert JSON-rad.
const { vurder } = await import('../agenter/vakt.js');
const paaNytt = (await eier.query(
  `SELECT id FROM frigivelser WHERE hvelv_id = ANY($1)`, [rolige])).rows;
for (const { id } of paaNytt) {
  const ny = await vurder(id);
  if (!ny) continue;
  await eier.query(
    `UPDATE agent_vurderinger SET vurdering = $2
      WHERE frigivelse_id = $1 AND agent = 'vakt'`, [id, ny]);
}

await eier.end();

console.log(`
Demo-data lagt inn. Alle passord: ${PASSORD}

  EIER (fullt hvelv, karenstid løper — se «Status» for nedtelling og stopp-knapp)
    ${e('kari')}

  BETRODD KONTAKT (kan melde dødsfall for Åse, ser Karis sak i karenstid)
    ${e('bjorn')}

  MOTTAKER (har fått frigitt arkiv fra Ingrid — se fanen «Til deg»)
    ${e('mona')}

  SAKSBEHANDLERE (fire øyne — Odds sak venter i køen)
    ${e('astrid')}   engangskode nå: ${totpKode(astrid.totp)}
    ${e('arne')}     engangskode nå: ${totpKode(arne.totp)}

  TOTP-hemmeligheter (legg i autentiseringsapp for nye koder):
    Astrid: ${astrid.totp}
    Arne:   ${arne.totp}

Tips: prøv å godkjenne Odds sak som Astrid, og deretter som Astrid igjen —
fire-øyne-sperren stopper deg. Godkjenn som Arne for å starte karenstiden.
`);
process.exit(0);
