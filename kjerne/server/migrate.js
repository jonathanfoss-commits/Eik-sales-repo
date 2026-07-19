// Kjører migrasjonene i server/migrations/ i rekkefølge, én gang hver.
// Kjøres som databaseeier (ikke plattform_app): node server/migrate.js
// Tilkobling styres av MIGRATE_DATABASE_URL (fallback: DATABASE_URL uten rolle-bytte).
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { config } from './config.js';

const url = process.env.MIGRATE_DATABASE_URL || config.databaseUrl;
const klient = new pg.Client({ connectionString: url });
await klient.connect();
// To instanser kan boote samtidig (dobbel-deploy) — advisory-låsen gjør at
// den ene venter i stedet for å krasje på «already exists».
await klient.query('SELECT pg_advisory_lock(714201)');

await klient.query(`CREATE TABLE IF NOT EXISTS migrasjoner (
  navn text PRIMARY KEY, kjort timestamptz NOT NULL DEFAULT now())`);

const katalog = path.join(config.rot, 'server', 'migrations');
const filer = fs.readdirSync(katalog).filter((f) => f.endsWith('.sql')).sort();
const kjorte = new Set((await klient.query('SELECT navn FROM migrasjoner')).rows.map((r) => r.navn));

for (const fil of filer) {
  if (kjorte.has(fil)) continue;
  const sql = fs.readFileSync(path.join(katalog, fil), 'utf8');
  console.log('Kjører', fil);
  await klient.query('BEGIN');
  try {
    await klient.query(sql);
    await klient.query('INSERT INTO migrasjoner (navn) VALUES ($1)', [fil]);
    await klient.query('COMMIT');
  } catch (feil) {
    await klient.query('ROLLBACK');
    console.error('Migrasjon feilet:', fil, feil.message);
    process.exit(1);
  }
}

// Managed Postgres (Supabase m.fl.) krever passord på app-rollene. Settes de
// som miljøvariabler her, slipper man det manuelle ALTER ROLE-steget.
for (const [rolle, passord] of [
  ['plattform_app', process.env.PLATTFORM_APP_PASSORD],
  ['plattform_auth', process.env.PLATTFORM_AUTH_PASSORD],
]) {
  if (!passord) continue;
  await klient.query(`ALTER ROLE ${rolle} LOGIN PASSWORD '${passord.replaceAll("'", "''")}'`);
  console.log(`Passord satt for rollen ${rolle}.`);
}

console.log('Databasen er à jour.');
await klient.query('SELECT pg_advisory_unlock(714201)');
await klient.end();
