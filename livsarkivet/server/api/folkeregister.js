// Kundens kobling mot Folkeregisteret. Kunden oppgir fødselsnummeret sitt én
// gang; serveren hasher det med pepperen og lagrer KUN hashen. Nummeret
// finnes aldri i en tabell, en logg eller et varsel.
//
// At serveren ser nummeret i det sekundet det sendes inn, er uunngåelig —
// pepperen kan ikke ligge i nettleseren, for da kunne hvem som helst regne ut
// hasher og prøve seg fram mot en dump. Vi holder det derfor så kort som mulig:
// hashes i samme funksjon, aldri logget, aldri returnert.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { fnrHash, folkeregisterTilgjengelig } from '../folkeregister.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/folkeregister', ({ ctx }) => medBruker(ctx, async (c) => {
    // Vi svarer OM det er koblet, aldri MED hva: app-rollen kan ikke lese
    // fnr_hash (kolonnegranten fra 001), så dette går via en egen ja/nei-funksjon.
    const koblet = (await c.query('SELECT har_fnr_kobling() AS ja')).rows[0].ja;
    return { tilgjengelig: folkeregisterTilgjengelig(), koblet };
  }));

  ruter.add('POST', '/api/folkeregister', ({ ctx, body }) => medBruker(ctx, async (c) => {
    if (!folkeregisterTilgjengelig()) {
      throw new ApiFeil(503, 'Folkeregister-varsling er ikke satt opp ennå');
    }
    const hash = fnrHash(body.fnr);
    if (!hash) throw new ApiFeil(400, 'Fødselsnummeret må ha 11 siffer');
    try {
      await c.query('UPDATE brukere SET fnr_hash = $2 WHERE id = $1', [ctx.brukerId, hash]);
    } catch (e) {
      // UNIQUE: samme nummer er alt koblet til en annen konto
      if (e.code === '23505') throw new ApiFeil(409, 'Fødselsnummeret er alt i bruk');
      throw e;
    }
    await loggRevisjon(c, ctx, null, 'folkeregister_koblet', {});
    return { ok: true };
  }));

  ruter.add('DELETE', '/api/folkeregister', ({ ctx }) => medBruker(ctx, async (c) => {
    await c.query('UPDATE brukere SET fnr_hash = NULL WHERE id = $1', [ctx.brukerId]);
    await loggRevisjon(c, ctx, null, 'folkeregister_frakoblet', {});
    return { ok: true };
  }));
}
