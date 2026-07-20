// Databasetilgang med multi-tenant Row Level Security.
//
// To roller:
//  - plattform_app:  all datatilgang. RLS håndheves — hver spørring kjører i en
//                    transaksjon der app.org_id (+ bruker/rolle) er satt, og
//                    policyene slipper kun gjennom rader forespørselen skal se.
//  - plattform_auth: kun innlogging/sesjoner/innrullering (oppslag før org er kjent).
import pg from 'pg';
import { config } from './config.js';

// date-kolonner skal være 'YYYY-MM-DD'-strenger, ikke JS Date-objekter.
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 });
export const authPool = new pg.Pool({ connectionString: config.databaseUrlAuth, max: 3 });

// En databaserestart sender 'error' på ledige tilkoblinger — uhåndtert ville
// det veltet hele prosessen. Poolen kobler opp igjen ved neste spørring.
pool.on('error', (feil) => console.error('pg-pool:', feil.message));
authPool.on('error', (feil) => console.error('pg-authpool:', feil.message));

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLLER = new Set(['admin', 'pilotleder', 'ansatt']);

// Kjør fn(client) i en transaksjon der RLS er låst til organisasjonen — og,
// når ctx er en innlogget bruker, til bruker-id og rolle (datanivå-policyene
// bruker dem). set_config(..., true) er transaksjonslokal, så innstillingene
// kan aldri lekke til andre forespørsler som gjenbruker samme pool-tilkobling.
// Kalles enten medOrg(orgId, fn) eller medOrg({orgId, brukerId, rolle}, fn).
export async function medOrg(ctxEllerOrgId, fn) {
  const ctx = typeof ctxEllerOrgId === 'string' ? { orgId: ctxEllerOrgId } : (ctxEllerOrgId || {});
  if (!UUID_RE.test(String(ctx.orgId))) throw new Error('Ugyldig org-id');
  if (ctx.brukerId && !UUID_RE.test(String(ctx.brukerId))) throw new Error('Ugyldig bruker-id');
  if (ctx.rolle && !ROLLER.has(ctx.rolle)) throw new Error('Ugyldig rolle');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.org_id', $1, true)", [ctx.orgId]);
    if (ctx.brukerId) await client.query("SELECT set_config('app.bruker_id', $1, true)", [ctx.brukerId]);
    if (ctx.rolle) await client.query("SELECT set_config('app.rolle', $1, true)", [ctx.rolle]);
    const resultat = await fn(client);
    await client.query('COMMIT');
    return resultat;
  } catch (feil) {
    await client.query('ROLLBACK').catch(() => {});
    throw feil;
  } finally {
    client.release();
  }
}

export async function lukkPools() {
  await Promise.allSettled([pool.end(), authPool.end()]);
}
