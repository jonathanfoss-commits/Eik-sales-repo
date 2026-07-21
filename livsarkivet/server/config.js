// Konfigurasjon: leser .env selv (ingen dotenv-avhengighet) og eksponerer typede verdier.
import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(import.meta.dirname, '..');

function lesEnvFil() {
  const sti = path.join(ROT, '.env');
  if (!fs.existsSync(sti)) return;
  for (const linje of fs.readFileSync(sti, 'utf8').split('\n')) {
    const m = linje.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
lesEnvFil();

// Forenklet deploy: er DATABASE_URL/_AUTH ikke satt, utledes de fra
// MIGRATE_DATABASE_URL (eier-tilkoblingen) + rollepassordene — samme vert og
// database, bare annen bruker.
function utledRolleUrl(bruker, passord) {
  if (!process.env.MIGRATE_DATABASE_URL || !passord) return '';
  try {
    const u = new URL(process.env.MIGRATE_DATABASE_URL);
    u.username = bruker;
    u.password = passord;
    return u.toString();
  } catch {
    return '';
  }
}

export const config = {
  rot: ROT,
  port: Number(process.env.PORT || 3400),
  databaseUrl: process.env.DATABASE_URL
    || utledRolleUrl('livsarkiv_app', process.env.LIVSARKIV_APP_PASSORD)
    || 'postgres://livsarkiv_app@localhost:5432/livsarkiv',
  databaseUrlAuth: process.env.DATABASE_URL_AUTH
    || utledRolleUrl('livsarkiv_auth', process.env.LIVSARKIV_AUTH_PASSORD)
    || 'postgres://livsarkiv_auth@localhost:5432/livsarkiv',
  // Karenstid: 48 timer [JONATHAN]. Settes i sekunder så testene kan krympe den.
  karenstidSekunder: Number(process.env.KARENSTID_SEKUNDER || 48 * 3600),
  // Selvregistrering for eiere — av i produksjon til DPIA/vilkår er klare [JONATHAN].
  registreringAapen: process.env.REGISTRERING_AAPEN === '1',
  // Testmodus skrur av bakgrunnsfeieren (testene styrer tiden selv).
  testmodus: process.env.LIVSARKIV_TESTMODUS === '1',
};
