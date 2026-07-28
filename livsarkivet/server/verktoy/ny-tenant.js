// Opprett et selskap (tenant) på plattformen — kjøres av drift, aldri via API:
//   node server/verktoy/ny-tenant.js storebrand "Storebrand" livsarkiv.storebrand.no
//
// Vertsnavnet er det som avgjør hvilken merkevare appen viser, og hvilken
// tenant en ny kunde havner i. Flere vertsnavn: skill med komma.
import pg from 'pg';
// config.js leser .env — uten den feiler verktøyet med «no PostgreSQL user
// name specified» så snart det kjøres uten eksporterte miljøvariabler.
import { config } from '../config.js';

const [slug, navn, vertsnavn, aksent] = process.argv.slice(2);
if (!slug || !navn) {
  console.error('Bruk: node server/verktoy/ny-tenant.js <slug> "Navn" [vertsnavn,vertsnavn] [#aksent]');
  process.exit(1);
}
if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
  console.error('Slug må være små bokstaver, tall og bindestrek (2–40 tegn).');
  process.exit(1);
}

const klient = new pg.Client({
  connectionString: process.env.MIGRATE_DATABASE_URL || config.databaseUrl });
await klient.connect();

const konfig = {
  vertsnavn: (vertsnavn || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean),
  visningsnavn: navn,
  ...(aksent ? { aksent } : {}),
};

const rad = (await klient.query(
  `INSERT INTO tenanter (slug, navn, konfig) VALUES ($1, $2, $3)
   ON CONFLICT (slug) DO UPDATE SET navn = EXCLUDED.navn, konfig = EXCLUDED.konfig
   RETURNING id, slug, navn, konfig`,
  [slug, navn, JSON.stringify(konfig)])).rows[0];

console.log('Selskap lagret:', rad.slug, '—', rad.navn);
console.log('Vertsnavn:', rad.konfig.vertsnavn.join(', ') || '(ingen — kun via plattformadressen)');
console.log('\nNeste: opprett saksbehandlere i selskapet. Fire-øyne-regelen krever TO:');
console.log(`  node server/verktoy/ny-admin.js "Navn" epost@${slug}.no ${slug}`);
await klient.end();
