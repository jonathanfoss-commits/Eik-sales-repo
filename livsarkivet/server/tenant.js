// Hvilket selskap er dette? Avgjøres av vertsnavnet i forespørselen, aldri av
// noe klienten kan sette fritt: `livsarkivet.storebrand.no` er Storebrand,
// alt ukjent er plattformen selv.
//
// Oppslaget caches i 60 sekunder. Det skjer på hver eneste sideinnlasting, og
// en tabell med en håndfull rader skal ikke koste en spørring hver gang. 60
// sekunder er også taket på hvor lenge en endret merkevare henger igjen —
// kort nok til at ingen ringer om det.
// App-rollen, ikke auth-rollen: livsarkiv_auth skal fortsatt ikke ha tilgang
// til tenanter (migrasjon 001). Spørringen kjører uten brukerkontekst med
// vilje — merkevaren er offentlig, og policyen på tabellen sier `USING (true)`.
import { pool } from './db.js';

const CACHE_MS = 60_000;
let cache = { tid: 0, etterVert: new Map(), standard: null };

async function last() {
  const rader = (await pool.query(
    `SELECT id, slug, navn, konfig FROM tenanter WHERE aktiv`)).rows;
  const etterVert = new Map();
  let standard = null;
  for (const t of rader) {
    if (t.slug === 'livsarkivet') standard = t;
    for (const vert of t.konfig?.vertsnavn || []) {
      etterVert.set(String(vert).toLowerCase(), t);
    }
  }
  cache = { tid: Date.now(), etterVert, standard };
}

function vertFra(req) {
  // Bak Renders proxy er Host riktig vert; X-Forwarded-Host settes ikke av oss
  // og skal derfor ikke stoles på. Port strippes.
  return String(req.headers.host || '').toLowerCase().split(':')[0];
}

export async function finnTenant(req) {
  if (Date.now() - cache.tid > CACHE_MS) await last();
  return cache.etterVert.get(vertFra(req)) || cache.standard;
}

// Merkevaren klienten trenger. Aldri id-en: den er en intern nøkkel, og
// innloggingssiden har ingen bruk for den.
export function merkevare(tenant) {
  const k = tenant?.konfig || {};
  return {
    navn: k.visningsnavn || tenant?.navn || 'Livsarkivet',
    aksent: k.aksent || null,
    avsender: k.avsender || null,   // «levert av X» under innloggingen
  };
}

export function tomCache() { cache = { tid: 0, etterVert: new Map(), standard: null }; }
