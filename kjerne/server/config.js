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
// database, bare annen bruker. Da holder det å sette tre variabler i skyen.
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
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL
    || utledRolleUrl('plattform_app', process.env.PLATTFORM_APP_PASSORD)
    || 'postgres://plattform_app@localhost:5432/plattform',
  databaseUrlAuth: process.env.DATABASE_URL_AUTH
    || utledRolleUrl('plattform_auth', process.env.PLATTFORM_AUTH_PASSORD)
    || 'postgres://plattform_auth@localhost:5432/plattform',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  // 500 kr/mnd per organisasjon [JONATHAN] — overstyres med miljøvariabel.
  aiMndBudsjettOre: Number(process.env.AI_MND_BUDSJETT_ORE || 50000),
};
