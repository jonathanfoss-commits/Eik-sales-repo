// API-nøkkel og webhook-endepunkt for et selskap — kjøres av drift:
//   node server/verktoy/ny-integrasjon.js <slug> "Navn på nøkkel" [webhook-url]
//
// Nøkkelen skrives ÉN gang og lagres kun som hash. Mistes den, lag en ny og
// trekk den gamle tilbake — det finnes ingen vei tilbake til klarteksten.
import pg from 'pg';
import crypto from 'node:crypto';
import { config } from '../config.js';
import { nyApiNokkel } from '../api/selskap.js';

const [slug, navn, webhookUrl] = process.argv.slice(2);
if (!slug || !navn) {
  console.error('Bruk: node server/verktoy/ny-integrasjon.js <slug> "Navn" [https://…]');
  process.exit(1);
}
if (webhookUrl && !webhookUrl.startsWith('https://')) {
  console.error('Webhook-URL må være https.');
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

const nokkel = nyApiNokkel();
await klient.query(
  `INSERT INTO api_nokler (tenant_id, navn, nokkel_hash, prefiks) VALUES ($1, $2, $3, $4)`,
  [tenant.id, navn, nokkel.hash, nokkel.prefiks]);

console.log(`API-nøkkel for ${tenant.navn}:`);
console.log('  ' + nokkel.raa);
console.log('  (vises kun nå — lagres kun som hash)');

if (webhookUrl) {
  const hemmelighet = crypto.randomBytes(32).toString('base64url');
  await klient.query(
    `INSERT INTO webhook_endepunkter (tenant_id, url, hemmelighet) VALUES ($1, $2, $3)`,
    [tenant.id, webhookUrl, hemmelighet]);
  console.log('\nWebhook:', webhookUrl);
  console.log('  Signaturhemmelighet:', hemmelighet);
  console.log('  Selskapet verifiserer: HMAC-SHA256 over "<tidsstempel>.<kropp>"');
  console.log('  Headere: X-Livsarkivet-Signatur, X-Livsarkivet-Tidsstempel');
  console.log('  Avvis tidsstempler eldre enn 5 minutter.');
}
await klient.end();
