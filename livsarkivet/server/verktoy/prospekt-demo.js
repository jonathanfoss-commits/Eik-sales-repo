// Sett opp et merkevaret demomiljø for ett prospekt, med én kommando:
//   node server/verktoy/prospekt-demo.js <slug> "Selskapsnavn" <vertsnavn> [#aksent]
//
// Et salgsmøte som starter med at de ser SITT eget navn og SIN egen farge, er
// en annen samtale enn en som starter med vår logo. Alt som opprettes er
// demokontoer på @demo.livsarkivet.no — verktøyet kan ikke røre ekte kunder.
import pg from 'pg';
import { config } from '../config.js';
import { hashPassord, nyTotpHemmelighet } from '../auth.js';

const [slug, navn, vertsnavn, aksent] = process.argv.slice(2);
if (!slug || !navn || !vertsnavn) {
  console.error('Bruk: node server/verktoy/prospekt-demo.js <slug> "Navn" <vertsnavn> [#aksent]');
  process.exit(1);
}
if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
  console.error('Slug må være små bokstaver, tall og bindestrek.');
  process.exit(1);
}

const klient = new pg.Client({
  connectionString: process.env.MIGRATE_DATABASE_URL || config.databaseUrl });
await klient.connect();

const e = (kort) => `${slug}-${kort}@demo.livsarkivet.no`;

// Strukturell grense: vi rører KUN demokontoer. Finnes det en ekte bruker i
// denne tenanten, stopper vi — et salgsverktøy skal ikke kunne skade en kunde.
const tenantFinnes = (await klient.query(
  'SELECT id FROM tenanter WHERE slug = $1', [slug])).rows[0];
if (tenantFinnes) {
  const ekte = (await klient.query(
    `SELECT count(*)::int AS n FROM brukere
      WHERE tenant_id = $1 AND epost NOT LIKE '%@demo.livsarkivet.no'`,
    [tenantFinnes.id])).rows[0].n;
  if (ekte > 0) {
    console.error(`«${slug}» har ${ekte} ekte konto(er). Verktøyet rører bare `
      + 'demomiljøer — velg en annen slug.');
    await klient.end();
    process.exit(1);
  }
  await klient.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE tenant_id = $1)`, [tenantFinnes.id]);
  await klient.query('DELETE FROM brukere WHERE tenant_id = $1', [tenantFinnes.id]);
}

const konfig = { vertsnavn: [vertsnavn.toLowerCase()], visningsnavn: navn,
  ...(aksent ? { aksent } : {}) };
const tenant = (await klient.query(
  `INSERT INTO tenanter (slug, navn, konfig) VALUES ($1, $2, $3)
   ON CONFLICT (slug) DO UPDATE SET navn = EXCLUDED.navn, konfig = EXCLUDED.konfig,
     aktiv = true
   RETURNING id`, [slug, navn, JSON.stringify(konfig)])).rows[0].id;

async function nyBruker(kort, visningsnavn, rolle = 'person') {
  const totp = rolle === 'admin' ? nyTotpHemmelighet() : null;
  const id = (await klient.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet, tenant_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [visningsnavn, e(kort), rolle, await hashPassord('demo-passord-1234'), totp, tenant]
  )).rows[0].id;
  return { id, kort };
}

// To saksbehandlere hos prospektet — fireøyneprinsippet må kunne VISES, ikke
// bare forklares. Det er ofte det som gjør inntrykk i møtet.
await nyBruker('saksbehandler1', `${navn} saksbehandler 1`, 'admin');
await nyBruker('saksbehandler2', `${navn} saksbehandler 2`, 'admin');

// Én kunde med et fylt hvelv og en aktiv deling, så både kundeflaten og
// selskapsflaten har noe å vise.
const kunde = await nyBruker('kunde', 'Kari Nordbø');
const hvelv = (await klient.query(
  'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [kunde.id])).rows[0].id;
for (const [kategori, tittel, innhold] of [
  ['praktisk', 'Nøkler og alarmkode', 'Reservenøkkel hos nabo. Katten skal til Solveig.'],
  ['juridisk', 'Testament', 'Originalen hos advokat Berg, Storgata 12.'],
  ['forsikring', 'Livsforsikring', `Polise hos ${navn}. Dekker gjelden på hytta.`],
  ['siste_hilsen', 'Til Mona', 'Kjære Mona. Ta vare på hagen. Klem fra mamma.'],
]) {
  await klient.query(
    `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel, innhold)
     VALUES ($1, $2, $3, $4)`, [hvelv, kategori, tittel, innhold]);
}
await klient.query(
  `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi) VALUES
     ($1, 'polisenummer', 'POL-553-2291'),
     ($1, 'begunstiget', 'Mona Nordbø, datter')`, [hvelv]);

console.log(`Demomiljø klart for ${navn}.`);
console.log(`  Adresse:   https://${vertsnavn}/`);
console.log(`  Merkevare: ${navn}${aksent ? ` (${aksent})` : ''}`);
console.log('\nDemokontoer (passord: demo-passord-1234):');
console.log(`  Kunde:          ${e('kunde')}`);
console.log(`  Saksbehandler:  ${e('saksbehandler1')} og ${e('saksbehandler2')}`);
console.log('\nSaksbehandlerne har TOTP. Bruk ny-admin.js hvis du trenger koden,');
console.log('eller vis dem kundeflaten — det er den som selger.');
console.log('\nVil du vise innlogging med deres egen IdP:');
console.log(`  node server/verktoy/ny-oidc.js ${slug} <issuer> <klient-id>`);
await klient.end();
