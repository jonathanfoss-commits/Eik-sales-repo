// Opprett en saksbehandler (admin) med TOTP — kjøres av drift, aldri via API:
//   node server/verktoy/ny-admin.js "Navn" epost@livsarkivet.no [tenant-slug]
// Uten slug havner hen hos plattformen og ser saker på tvers (drift/support).
// Med slug ser hen KUN det selskapets saker.
// Skriver et engangspassord og TOTP-hemmeligheten til stdout ÉN gang.
import pg from 'pg';
import { hashPassord, nyTotpHemmelighet, lagInvitasjonskode } from '../auth.js';

const [navn, epost, slug] = process.argv.slice(2);
if (!navn || !epost) {
  console.error('Bruk: node server/verktoy/ny-admin.js "Navn" epost [tenant-slug]');
  process.exit(1);
}

const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
const klient = new pg.Client({ connectionString: url });
await klient.connect();

let tenantId = null;
if (slug) {
  tenantId = (await klient.query('SELECT id FROM tenanter WHERE slug = $1', [slug])).rows[0]?.id;
  if (!tenantId) {
    console.error(`Fant ingen tenant «${slug}». Opprett den først med ny-tenant.js.`);
    await klient.end();
    process.exit(1);
  }
}

const passord = lagInvitasjonskode() + lagInvitasjonskode(); // 24 tegn
const totp = nyTotpHemmelighet();
await klient.query(
  `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet, tenant_id)
   VALUES ($1, $2, 'admin', $3, $4, COALESCE($5::uuid, standard_tenant()))`,
  [navn, epost.toLowerCase(), await hashPassord(passord), totp, tenantId]);

console.log('Saksbehandler opprettet' + (slug ? ` i selskapet «${slug}».` : ' hos plattformen.'));
console.log('Engangspassord (vises kun nå):', passord);
console.log('TOTP-hemmelighet (legg i autentiseringsapp):', totp);
await klient.end();
