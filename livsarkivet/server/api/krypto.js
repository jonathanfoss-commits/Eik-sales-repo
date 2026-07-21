// Nøkkellageret for zero-knowledge-tieret: serveren oppbevarer KUN pakkede
// nøkler (frasepakket/gjenopprettingspakket) og offentlige nøkler — aldri noe
// som kan dekrypteres her.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { mittHvelv } from './hvelv.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/krypto/hvelvnokler', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const rad = (await c.query(
      `SELECT salt, iterasjoner, hvelvnokkel_pakket, gjenoppretting_pakket, gjenoppretting_del_b
         FROM hvelv_kryptonokler WHERE hvelv_id = $1`, [hvelv.id])).rows[0];
    return rad ? { finnes: true, nokler: rad } : { finnes: false };
  }));

  ruter.add('PUT', '/api/krypto/hvelvnokler', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const { salt, iterasjoner, hvelvnokkel_pakket, gjenoppretting_pakket, gjenoppretting_del_b } = body;
    if (!salt || !iterasjoner || !hvelvnokkel_pakket || !gjenoppretting_pakket || !gjenoppretting_del_b) {
      throw new ApiFeil(400, 'Ufullstendig nøkkelmateriale');
    }
    const hvelv = await mittHvelv(c, ctx);
    await c.query(
      `INSERT INTO hvelv_kryptonokler
         (hvelv_id, salt, iterasjoner, hvelvnokkel_pakket, gjenoppretting_pakket, gjenoppretting_del_b)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (hvelv_id) DO UPDATE SET salt = EXCLUDED.salt,
         iterasjoner = EXCLUDED.iterasjoner, hvelvnokkel_pakket = EXCLUDED.hvelvnokkel_pakket,
         gjenoppretting_pakket = EXCLUDED.gjenoppretting_pakket,
         gjenoppretting_del_b = EXCLUDED.gjenoppretting_del_b, oppdatert = now()`,
      [hvelv.id, salt, Number(iterasjoner), hvelvnokkel_pakket, gjenoppretting_pakket, gjenoppretting_del_b]);
    await loggRevisjon(c, ctx, hvelv.id, 'kryptonokler_oppdatert', {});
    return { ok: true };
  }));

  ruter.add('GET', '/api/krypto/min-nokkel', ({ ctx }) => medBruker(ctx, async (c) => {
    const rad = (await c.query(
      `SELECT offentlig, salt, iterasjoner, privat_pakket
         FROM bruker_nokler WHERE bruker_id = $1`, [ctx.brukerId])).rows[0];
    return rad ? { finnes: true, nokkel: rad } : { finnes: false };
  }));

  ruter.add('PUT', '/api/krypto/min-nokkel', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const { offentlig, salt, iterasjoner, privat_pakket } = body;
    if (!offentlig || !salt || !iterasjoner || !privat_pakket) {
      throw new ApiFeil(400, 'Ufullstendig nøkkelmateriale');
    }
    await c.query(
      `INSERT INTO bruker_nokler (bruker_id, offentlig, salt, iterasjoner, privat_pakket)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (bruker_id) DO UPDATE SET offentlig = EXCLUDED.offentlig,
         salt = EXCLUDED.salt, iterasjoner = EXCLUDED.iterasjoner,
         privat_pakket = EXCLUDED.privat_pakket`,
      [ctx.brukerId, offentlig, salt, Number(iterasjoner), privat_pakket]);
    return { ok: true };
  }));

  // Eieren henter en kontakts offentlige nøkkel for å pakke deponiet.
  ruter.add('GET', '/api/krypto/offentlig/:kontaktId', ({ ctx, params }) => medBruker(ctx, async (c) => {
    let rad;
    try {
      rad = (await c.query(
        `SELECT bn.offentlig FROM kontakter k
           JOIN bruker_nokler bn ON bn.bruker_id = k.bruker_id
          WHERE k.id = $1`, [params.kontaktId])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke kontakten');
      throw feil;
    }
    if (!rad) throw new ApiFeil(404, 'Kontakten har ikke satt sikkerhetsfrase ennå');
    return { offentlig: rad.offentlig };
  }));
}
