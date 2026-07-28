// Ingest fra Folkeregisteret. Ingen plugin-rammeverk (ADR-002 avviste det):
// én kilde-funksjon som kan byttes, og én løkke som gjør det samme uansett.
//
// Det denne modulen IKKE gjør, er like viktig som det den gjør:
//   * Den frigir ingenting. Den oppretter en sak i `under_verifisering`.
//   * Fire øyne gjenstår. To saksbehandlere må fortsatt godkjenne.
//   * Karenstiden på 48 timer gjenstår, og eierens nødbrems virker som før —
//     nettopp fordi et register kan ta feil om at noen er død.
import crypto from 'node:crypto';
import { medBruker } from './db.js';
import { loggRevisjon } from './revisjon.js';
import { koVarsler, sendUtestaaende } from './varsling.js';

// Pepperen bor i miljøet, ikke i databasen: en dump alene skal ikke være nok
// til å regne seg tilbake til et fødselsnummer (tallrommet er lite).
export function fnrHash(fnr) {
  const pepper = process.env.FNR_PEPPER || '';
  const rent = String(fnr || '').replace(/\D/g, '');
  if (rent.length !== 11) return null;
  if (!pepper) return null;   // uten pepper skal ingenting kunne matches
  return crypto.createHmac('sha256', pepper).update(rent).digest('hex');
}

export function folkeregisterTilgjengelig() {
  return Boolean(process.env.FOLKEREGISTER_URL && process.env.FNR_PEPPER);
}

// Kilden. Ekte oppslag mot Folkeregisteret krever Maskinporten-avtale og
// hjemmel; inntil den er på plass kan den samme løkken mates fra en fil, slik
// at hele nedstrømsløpet er testet den dagen avtalen kommer.
async function hentDodsfall(siden) {
  const url = process.env.FOLKEREGISTER_URL;
  const svar = await fetch(`${url}?siden=${encodeURIComponent(siden.toISOString())}`, {
    headers: { Authorization: `Bearer ${process.env.FOLKEREGISTER_TOKEN || ''}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!svar.ok) throw new Error(`Folkeregisteret svarte ${svar.status}`);
  const data = await svar.json();
  // Forventet form: [{fnr, dodsdato}] — fødselsnummeret hashes med én gang og
  // holdes aldri lenger enn denne funksjonen.
  return (data.dodsfall || []).map((d) => ({
    hash: fnrHash(d.fnr),
    dodsdato: d.dodsdato || null,
  })).filter((d) => d.hash);
}

// Én runde. Trygg å kalle så ofte man vil: idempotent per hvelv.
export async function ingestDodsfall(siden = new Date(Date.now() - 24 * 3600_000),
  hent = hentDodsfall) {
  if (!folkeregisterTilgjengelig()) return { hentet: 0, opprettet: 0 };
  const dodsfall = await hent(siden);
  let opprettet = 0;

  for (const d of dodsfall) {
    await medBruker({ rolle: 'system' }, async (c) => {
      const hvelvId = (await c.query(
        'SELECT hvelv_for_fnr_hash($1) AS id', [d.hash])).rows[0].id;
      if (!hvelvId) {
        await c.query(
          `INSERT INTO folkeregister_hendelser (fnr_hash, dodsdato, utfall)
           VALUES ($1, $2, 'ukjent_person')`, [d.hash, d.dodsdato]);
        return;
      }
      const apen = (await c.query('SELECT har_apen_sak($1) AS ja', [hvelvId])).rows[0].ja;
      if (apen) {
        await c.query(
          `INSERT INTO folkeregister_hendelser (fnr_hash, dodsdato, utfall, hvelv_id)
           VALUES ($1, $2, 'alt_apen_sak', $3)`, [d.hash, d.dodsdato, hvelvId]);
        return;
      }

      // Hendelse, sak og varsler i ÉN transaksjon (CLAUDE.md punkt 8): finnes
      // saken, er eieren varslet — og eieren er den eneste som kan si «jeg lever».
      const hendelseId = (await c.query(
        `INSERT INTO hendelser (hvelv_id, type, kilde) VALUES ($1, 'dodsfall', 'folkeregisteret')
         RETURNING id`, [hvelvId])).rows[0].id;
      await c.query(
        `INSERT INTO frigivelser (hendelse_id, hvelv_id, status)
         VALUES ($1, $2, 'under_verifisering')`, [hendelseId, hvelvId]);
      await c.query(
        `INSERT INTO folkeregister_hendelser (fnr_hash, dodsdato, utfall, hvelv_id)
         VALUES ($1, $2, 'sak_opprettet', $3)`, [d.hash, d.dodsdato, hvelvId]);
      await loggRevisjon(c, { rolle: 'system' }, hvelvId, 'hendelse_meldt',
        { kilde: 'folkeregisteret', hendelse_id: hendelseId });
      await koVarsler(c, hvelvId, hendelseId, 'hendelse_meldt');
      opprettet++;
    });
  }
  if (opprettet) await sendUtestaaende();
  return { hentet: dodsfall.length, opprettet };
}
