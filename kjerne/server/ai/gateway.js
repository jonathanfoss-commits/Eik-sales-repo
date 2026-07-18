// AI-gateway — all modellbruk går gjennom dette ene punktet: modellvalg,
// caching, kvoter og kostnadslogging styres ett sted.
//
//  * EVNENE ER TENANT-KONFIG: hver organisasjon har sine AI-evner (firmaprofil,
//    instruks, modell, maks output) i organisasjoner.konfig.evner. Kjernen
//    kjenner ingen kunde — bare kontrakten {profil, instruks, modell, maxTokens}.
//  * Modellruting per evne. Skrivearbeid bruker kvalitetsmodellen (opus-4-8) —
//    norsk fagtekst er produktet og nedgraderes aldri i det stille (D6).
//  * Fast kontekst (firmaprofil) er merket med cache_control.
//  * Hvert kall logges i ai_logg med tokenbruk og kostnad i øre. Aldri innhold.
//  * Månedsbudsjett per organisasjon (AI_MND_BUDSJETT_ORE, 500 kr [JONATHAN])
//    håndheves FØR kallet.
//  * Modellkallet skjer UTENFOR databasetransaksjoner.
//  * Uten ANTHROPIC_API_KEY: 503 med tydelig melding — appen viser reserven.
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { ApiFeil } from '../http.js';

// USD per million tokens (Anthropic-prisliste juli 2026), kurs 10,5.
// Cache-lesing ~0,1×, cache-skriving ~1,25× av input-pris.
const PRIS_USD_PER_MTOK = {
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-haiku-4-5': { input: 1, output: 5 },
};
const NOK_PER_USD = 10.5;
export const TILLATTE_MODELLER = Object.keys(PRIS_USD_PER_MTOK);

export function beregnKostOre(modell, usage) {
  const pris = PRIS_USD_PER_MTOK[modell];
  if (!pris) return 0;
  const usd =
    (usage.input_tokens / 1e6) * pris.input +
    ((usage.cache_read_input_tokens || 0) / 1e6) * pris.input * 0.1 +
    ((usage.cache_creation_input_tokens || 0) / 1e6) * pris.input * 1.25 +
    (usage.output_tokens / 1e6) * pris.output;
  return Math.round(usd * NOK_PER_USD * 100 * 100) / 100; // øre, to desimaler
}

let klient = null;
export function aiTilgjengelig() { return Boolean(config.anthropicApiKey); }
function hentKlient() {
  if (!aiTilgjengelig()) {
    throw new ApiFeil(503,
      'Skrivemotoren er ikke koblet til ennå (ANTHROPIC_API_KEY mangler på serveren). ' +
      'Alt annet i appen virker som normalt.');
  }
  klient ??= new Anthropic({ apiKey: config.anthropicApiKey });
  return klient;
}

// Vaktpost: en evne med modell uten prisoppføring ville logget 0 øre i det
// stille og uthulet budsjettet — da nekter vi heller å bruke evnen.
export function validerEvne(navn, evne) {
  if (!evne || !evne.instruks || !evne.modell) {
    throw new ApiFeil(400, `Ukjent AI-evne: ${navn}`);
  }
  if (!PRIS_USD_PER_MTOK[evne.modell]) {
    throw new ApiFeil(500, `AI-evnen «${navn}» bruker modellen ${evne.modell} uten prisoppføring i gatewayen`);
  }
  return evne;
}

// Kvotesjekk — kjøres i en kort medOrg-transaksjon FØR modellkallet.
// Bruker SECURITY DEFINER-funksjonen ai_kost_denne_mnd(): radene i ai_logg er
// SENSITIVT (kun admin), men summen for egen org må sperren kunne lese uansett
// hvem som spør (funnet av integrasjonstesten — se migrasjon 003).
// Kjent begrensning (dokumentert): to samtidige kall kan begge passere like
// under taket; måneden regnes i servertid.
export async function sjekkKvote(client) {
  const brukt = await client.query('SELECT ai_kost_denne_mnd() AS sum');
  if (Number(brukt.rows[0].sum) >= config.aiMndBudsjettOre) {
    throw new ApiFeil(429,
      'Månedens AI-budsjett er brukt opp. Ta kontakt med administrator for påfyll.');
  }
}

// Selve modellkallet — ren nettverks-I/O, ingen database. profil kommer fra
// tenant-konfigen og er stabil per organisasjon (cache-prefiks).
export async function kallEvne({ navn, evne, profil, tekst }) {
  validerEvne(navn, evne);
  if (!tekst || !String(tekst).trim()) throw new ApiFeil(400, 'Skriv inn tekst først');

  const anthropic = hentKlient();
  const svar = await anthropic.messages.create({
    model: evne.modell,
    max_tokens: evne.maxTokens || 2000,
    system: [
      { type: 'text', text: String(profil || ''), cache_control: { type: 'ephemeral' } },
      { type: 'text', text: evne.instruks },
    ],
    messages: [{ role: 'user', content: String(tekst).slice(0, 20000) }],
  });

  const tekstUt = svar.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
  return { tekst: tekstUt, modell: evne.modell, usage: svar.usage,
    kostOre: beregnKostOre(evne.modell, svar.usage) };
}

// Kostnadslogging — egen transaksjon ETTER kallet. Aldri innhold.
export async function loggKost(client, { orgId, brukerId, evne, modell, usage, kostOre }) {
  await client.query(
    `INSERT INTO ai_logg (org_id, bruker_id, evne, modell, input_tokens, output_tokens, cache_les, cache_skriv, kost_ore)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [orgId, brukerId, evne, modell, usage.input_tokens, usage.output_tokens,
      usage.cache_read_input_tokens || 0, usage.cache_creation_input_tokens || 0, kostOre]
  );
}
