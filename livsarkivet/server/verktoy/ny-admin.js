// Opprett en saksbehandler (admin) med TOTP — kjøres av drift, aldri via API:
//   node server/verktoy/ny-admin.js "Navn" epost@livsarkivet.no
// Skriver et engangspassord og TOTP-hemmeligheten til stdout ÉN gang.
import pg from 'pg';
import { hashPassord, nyTotpHemmelighet, lagInvitasjonskode } from '../auth.js';

const [navn, epost] = process.argv.slice(2);
if (!navn || !epost) {
  console.error('Bruk: node server/verktoy/ny-admin.js "Navn" epost');
  process.exit(1);
}

const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
const klient = new pg.Client({ connectionString: url });
await klient.connect();

const passord = lagInvitasjonskode() + lagInvitasjonskode(); // 24 tegn
const totp = nyTotpHemmelighet();
await klient.query(
  `INSERT INTO brukere (navn, epost, rolle, passord_hash, totp_hemmelighet)
   VALUES ($1, $2, 'admin', $3, $4)`,
  [navn, epost.toLowerCase(), await hashPassord(passord), totp]);

console.log('Saksbehandler opprettet.');
console.log('Engangspassord (vises kun nå):', passord);
console.log('TOTP-hemmelighet (legg i autentiseringsapp):', totp);
await klient.end();
