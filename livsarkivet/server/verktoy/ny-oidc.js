// Koble et selskaps identitetsleverandør — kjøres av drift:
//   node server/verktoy/ny-oidc.js <slug> <issuer> <klient-id> [klient-hemmelighet]
//
// Verifiserer at issueren faktisk svarer på discovery FØR den lagres. En
// feilstavet issuer som først oppdages av en kunde midt i innloggingen, er en
// unødvendig dårlig første dag.
import pg from 'pg';
import { config } from '../config.js';
import { oppdag } from '../oidc.js';

const [slug, issuer, klientId, hemmelighet] = process.argv.slice(2);
if (!slug || !issuer || !klientId) {
  console.error('Bruk: node server/verktoy/ny-oidc.js <slug> <issuer> <klient-id> [hemmelighet]');
  process.exit(1);
}
if (!/^https?:\/\//.test(issuer)) {
  console.error('Issuer må være en full URL.');
  process.exit(1);
}

let oppdaget;
try {
  oppdaget = await oppdag(issuer);
} catch (e) {
  console.error(`Fikk ikke tak i ${issuer}/.well-known/openid-configuration: ${e.message}`);
  process.exit(1);
}
if (oppdaget.issuer !== issuer) {
  console.error(`Discovery melder issuer «${oppdaget.issuer}», ikke «${issuer}». `
    + 'Bruk verdien discovery oppgir — den må stemme med `iss` i tokenet.');
  process.exit(1);
}

const klient = new pg.Client({
  connectionString: process.env.MIGRATE_DATABASE_URL || config.databaseUrl });
await klient.connect();

const tenant = (await klient.query('SELECT id, navn FROM tenanter WHERE slug = $1', [slug])).rows[0];
if (!tenant) {
  console.error(`Fant ingen tenant «${slug}». Opprett den først med ny-tenant.js.`);
  await klient.end();
  process.exit(1);
}

await klient.query(
  `INSERT INTO oidc_konfig (tenant_id, issuer, klient_id, klient_hemmelighet)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (tenant_id) DO UPDATE SET issuer = EXCLUDED.issuer,
     klient_id = EXCLUDED.klient_id, klient_hemmelighet = EXCLUDED.klient_hemmelighet,
     aktiv = true`,
  [tenant.id, issuer, klientId, hemmelighet || null]);

const vertsnavn = (await klient.query(
  `SELECT konfig->'vertsnavn' AS v FROM tenanter WHERE id = $1`, [tenant.id])).rows[0].v || [];
console.log(`Innlogging koblet for ${tenant.navn}.`);
console.log('  Autorisering:', oppdaget.authorization_endpoint);
console.log('  Klient:', klientId, hemmelighet ? '(konfidensiell)' : '(offentlig, kun PKCE)');
console.log('\nRegistrer disse redirect-URI-ene hos tilbyderen:');
for (const v of vertsnavn.length ? vertsnavn : ['<selskapets vertsnavn>']) {
  console.log(`  https://${v}/api/auth/oidc/tilbake`);
}
await klient.end();
