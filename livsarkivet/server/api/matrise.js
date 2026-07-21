// Mottakermatrisen: hvem får hva, ved hvilken hendelse. Kun eier.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { mittHvelv } from './hvelv.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/matrise', ({ ctx }) => medBruker(ctx, async (c) => {
    await mittHvelv(c, ctx);
    const rader = (await c.query(
      'SELECT id, element_id, kontakt_id, hendelse_type FROM mottakermatrise ORDER BY opprettet')).rows;
    return { matrise: rader };
  }));

  ruter.add('POST', '/api/matrise', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const { elementId, kontaktId, hendelseType = 'dodsfall' } = body;
    if (!elementId || !kontaktId) throw new ApiFeil(400, 'Element og kontakt må velges');
    const hvelv = await mittHvelv(c, ctx);
    let rad;
    try {
      rad = (await c.query(
        `INSERT INTO mottakermatrise (element_id, kontakt_id, hendelse_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (element_id, kontakt_id, hendelse_type) DO NOTHING
         RETURNING id, element_id, kontakt_id, hendelse_type`,
        [elementId, kontaktId, hendelseType])).rows[0];
    } catch (feil) {
      // 42501: WITH CHECK avviste (fremmed element/kontakt eller kryss-hvelv)
      if (feil.code === '42501' || feil.code === '23503' || feil.code === '22P02') {
        throw new ApiFeil(400, 'Element og kontakt må høre til ditt hvelv');
      }
      if (feil.code === '23514') throw new ApiFeil(400, 'Ugyldig hendelsestype');
      throw feil;
    }
    if (!rad) return { ok: true, gjenbruk: true }; // alt registrert — idempotent
    await loggRevisjon(c, ctx, hvelv.id, 'matrise_lagt_til',
      { element_id: rad.element_id, kontakt_id: rad.kontakt_id, hendelse_type: rad.hendelse_type });
    return { rad };
  }));

  ruter.add('DELETE', '/api/matrise/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    let slettet;
    try {
      slettet = (await c.query(
        'DELETE FROM mottakermatrise WHERE id = $1 RETURNING id, element_id, kontakt_id',
        [params.id])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke raden');
      throw feil;
    }
    if (!slettet) throw new ApiFeil(404, 'Fant ikke raden');
    await loggRevisjon(c, ctx, hvelv.id, 'matrise_fjernet',
      { element_id: slettet.element_id, kontakt_id: slettet.kontakt_id });
    return { ok: true };
  }));
}
