// Demodata for kundedemoer — fyller en tenant med realistisk innhold så en
// 3-minutters demo aldri viser tomme skjermer. KUN for demo-tenants: slugen
// må slutte på «-demo», ha en tenants/<slug>.js-fil, og orgen kan ha maks
// 3 brukere — ellers stopper verktøyet uten å røre databasen.
//
//   node server/verktoy/demodata.js malermester-demo
import pg from 'pg';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const slug = process.argv[2];
const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
if (!slug || !url) {
  console.error('Bruk: MIGRATE_DATABASE_URL=... node server/verktoy/demodata.js <slug>');
  process.exit(1);
}
// Tre uavhengige sperrer: verktøyet DELETEr i dagbok (bevistabell), så en
// ekte tenant må aldri kunne passere ved uhell.
if (!slug.endsWith('-demo')) {
  console.error('Sikkerhetsstopp: demodata legges kun i tenants med slug som slutter på «-demo».');
  process.exit(1);
}
if (!existsSync(fileURLToPath(new URL(`../../tenants/${slug}.js`, import.meta.url)))) {
  console.error(`Sikkerhetsstopp: fant ingen tenants/${slug}.js — ukjent slug kjøres ikke.`);
  process.exit(1);
}

const klient = new pg.Client({ connectionString: url });
await klient.connect();
const org = (await klient.query('SELECT id FROM organisasjoner WHERE slug = $1', [slug])).rows[0];
if (!org) { console.error('Fant ikke tenanten — kjør ny-tenant.js først.'); process.exit(1); }
const antallBrukere = Number((await klient.query(
  'SELECT count(*) FROM brukere WHERE org_id = $1', [org.id])).rows[0].count);
if (antallBrukere > 3) {
  console.error(`Sikkerhetsstopp: tenanten har ${antallBrukere} brukere — ser ut som en ekte org, ikke en demo.`);
  process.exit(1);
}
const bruker = (await klient.query(
  'SELECT id FROM brukere WHERE org_id = $1 ORDER BY opprettet LIMIT 1', [org.id])).rows[0];
if (!bruker) { console.error('Tenanten har ingen brukere.'); process.exit(1); }

const iDag = new Date();
const dato = (dagerSiden) =>
  new Date(iDag - dagerSiden * 86400000).toISOString().slice(0, 10);

// idempotent: rydd gammel demodata (klient_id-prefiks) før ny fylles inn
for (const tabell of ['dagbok', 'tillegg', 'fakturaer', 'timeforinger', 'varsler', 'prosjektfrister']) {
  await klient.query(`DELETE FROM ${tabell} WHERE org_id = $1 AND klient_id LIKE 'demo-%'`, [org.id]);
}

const dagbok = [
  [0, 'Bjerkeveien 14', 'Sparklet og grunnet stue og gang. Kunden valgte NCS S 0502-Y til tak. Lift bestilt til fasaden torsdag.'],
  [1, 'Bjerkeveien 14', 'Ferdig maskert 2. etasje. Avdekket fukt bak panel på bad — meldt kunden, avventer svar.'],
  [2, 'Storgata 8 (kontor)', 'To strøk på møterom 1–3. Kunden ønsker mørkere kulør i resepsjonen — prøveoppstrøk i morgen.'],
  [4, 'Bjerkeveien 14', 'Utvendig vask og skraping sørvegg. Godt vær, ligger foran plan.'],
];
for (const [d, prosjekt, tekst] of dagbok) {
  await klient.query(
    `INSERT INTO dagbok (org_id, bruker_id, dato, prosjekt, tekst, klient_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [org.id, bruker.id, dato(d), prosjekt, tekst, 'demo-dagbok-' + d]);
}

await klient.query(
  `INSERT INTO tillegg (org_id, bruker_id, dato, prosjekt, avtalt_med, tekst, klient_id)
   VALUES ($1,$2,$3,'Bjerkeveien 14','kunden (Sylvi)','Male innsiden av garasjen også — tas på regning, ca. én dag',$4)`,
  [org.id, bruker.id, dato(1), 'demo-tillegg-1']);

const fakturaer = [
  ['Storgata 8 AS', 'Faktura 2087 · 64 200 kr', 21],
  ['Fam. Nordmann', 'Faktura 2081 · 28 500 kr', 47],
];
for (const [kunde, ref, dagerOver] of fakturaer) {
  await klient.query(
    `INSERT INTO fakturaer (org_id, bruker_id, kunde, referanse, forfall, klient_id)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [org.id, bruker.id, kunde, ref, dato(dagerOver), 'demo-faktura-' + dagerOver]);
}

await klient.query(
  `INSERT INTO timeforinger (org_id, bruker_id, dato, prosjekt, timer, notat, klient_id)
   VALUES ($1,$2,$3,'Bjerkeveien 14',7.5,'sparkling og grunning',$4)
   ON CONFLICT (org_id, bruker_id, dato, prosjekt) DO NOTHING`,
  [org.id, bruker.id, dato(0), 'demo-timer-0']);

// konflikt-historien til demoen: et varsel med svarfrist som har gått ut, og
// en overtakelse der sluttoppstillingsfristen nærmer seg — prosjektrommet
// viser da chips som driver handling, og bevisdokumentet får en NS 8407-kjede.
await klient.query(
  `INSERT INTO varsler (org_id, bruker_id, type, prosjekt, tekst, status, svarfrist, klient_id)
   VALUES ($1,$2,'endringsvarsel','Bjerkeveien 14',
     'Byggherren ba muntlig om ekstra strøk på hele sørveggen — varslet skriftlig samme dag med konsekvens for pris og fremdrift.',
     'sendt',$3,$4)`,
  [org.id, bruker.id, dato(3), 'demo-varsel-1']);
await klient.query(
  `INSERT INTO varsler (org_id, bruker_id, type, prosjekt, tekst, status, klient_id)
   VALUES ($1,$2,'varemottak','Storgata 8 (kontor)',
     'Feil glans levert (07 i stedet for 20) på 40 liter — avvik meldt leverandøren med bilde.',
     'meldt',$3)`,
  [org.id, bruker.id, 'demo-varsel-2']);
await klient.query(
  `INSERT INTO prosjektfrister (org_id, bruker_id, prosjekt, overtakelse, klient_id)
   VALUES ($1,$2,'Storgata 8 (kontor)',$3,$4)
   ON CONFLICT (org_id, prosjekt) DO UPDATE
     SET overtakelse = EXCLUDED.overtakelse, klient_id = EXCLUDED.klient_id,
         bruker_id = EXCLUDED.bruker_id`,
  [org.id, bruker.id, dato(45), 'demo-frist-1']);

console.log(`Demodata lagt inn for «${slug}»: ${dagbok.length} dagboklinjer, 1 tillegg, ` +
  `${fakturaer.length} fakturaer, 1 timeføring, 2 varsler og 1 overtakelsesfrist ` +
  `(konflikt-historien til prosjektrommet). Kjør gjerne igjen — ryddes og fylles på nytt.`);
await klient.end();
