// Databasetilgang med person-skopet Row Level Security.
//
// Livsarkivet er B2C: grensen går mellom PERSONER, ikke organisasjoner.
// To roller (ingen eier tabeller, så RLS kan aldri omgås):
//  - livsarkiv_app:  all datatilgang. Hver spørring kjører i en transaksjon
//                    der app.bruker_id + app.rolle er satt; policyene avgjør
//                    per rad om brukeren er eier, betrodd kontakt eller
//                    mottaker — samme person kan være alle tre i ulike hvelv.
//  - livsarkiv_auth: kun innlogging/sesjoner/invitasjonsinnløsning
//                    (oppslag før identiteten er etablert).
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// 'system' brukes KUN av karenstid-feieren i serverprosessen — settes aldri
// fra en HTTP-forespørsel.
const ROLLER = new Set(['person', 'admin', 'system']);

// Kjør fn(client) i en transaksjon der RLS er låst til brukeren og rollen.
// set_config(..., true) er transaksjonslokal, så innstillingene kan aldri
// lekke til andre forespørsler som gjenbruker samme pool-tilkobling.
export async function medBruker(ctx, fn) {
  const { brukerId, rolle } = ctx || {};
  if (rolle !== 'system' && !UUID_RE.test(String(brukerId))) throw new Error('Ugyldig bruker-id');
  if (!ROLLER.has(rolle)) throw new Error('Ugyldig rolle');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (brukerId) await client.query("SELECT set_config('app.bruker_id', $1, true)", [brukerId]);
    await client.query("SELECT set_config('app.rolle', $1, true)", [rolle]);
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
