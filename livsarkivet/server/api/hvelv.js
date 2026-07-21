// Hvelvet: eierens elementer, kategorisert og nivåmerket.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';

// Hvelvet opprettes lat ved første bruk — auth-laget rører aldri domenetabellene.
export async function mittHvelv(c, ctx) {
  const rad = (await c.query('SELECT id, versjon FROM hvelv WHERE eier_id = $1', [ctx.brukerId])).rows[0];
  if (rad) return rad;
  return (await c.query(
    'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id, versjon', [ctx.brukerId])).rows[0];
}

const ELEMENT_FELTER = 'id, kategori, nivaa, tittel, innhold, kryptert, versjon, opprettet, endret';

export function registrer(ruter) {
  ruter.add('GET', '/api/hvelv', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const elementer = (await c.query(
      `SELECT ${ELEMENT_FELTER} FROM hvelv_elementer WHERE hvelv_id = $1
        ORDER BY kategori, opprettet`, [hvelv.id])).rows;
    return { hvelv: { id: hvelv.id }, elementer };
  }));

  ruter.add('POST', '/api/elementer', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const { kategori, nivaa = 'privat', tittel, innhold = '', klientId = null } = body;
    if (!tittel || !kategori) throw new ApiFeil(400, 'Kategori og tittel må fylles ut');
    if (nivaa === 'sensitiv') throw new ApiFeil(501, 'Sensitiv-nivået åpner når krypteringen er på plass');
    const hvelv = await mittHvelv(c, ctx);
    let rad;
    try {
      rad = (await c.query(
        `INSERT INTO hvelv_elementer (hvelv_id, kategori, nivaa, tittel, innhold, klient_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (hvelv_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
         RETURNING ${ELEMENT_FELTER}`,
        [hvelv.id, kategori, nivaa, String(tittel).trim(), String(innhold), klientId])).rows[0];
    } catch (feil) {
      if (feil.code === '23514') throw new ApiFeil(400, 'Ugyldig kategori eller nivå');
      throw feil;
    }
    if (!rad) { // klient_id alt registrert — idempotent gjenbruk
      rad = (await c.query(
        `SELECT ${ELEMENT_FELTER} FROM hvelv_elementer WHERE hvelv_id = $1 AND klient_id = $2`,
        [hvelv.id, klientId])).rows[0];
      return { element: rad, gjenbruk: true };
    }
    await loggRevisjon(c, ctx, hvelv.id, 'element_opprettet', { element_id: rad.id, kategori });
    return { element: rad };
  }));

  ruter.add('PUT', '/api/elementer/:id', ({ ctx, body, params }) => medBruker(ctx, async (c) => {
    const { tittel, innhold, kategori, nivaa, versjon } = body;
    if (nivaa === 'sensitiv') throw new ApiFeil(501, 'Sensitiv-nivået åpner når krypteringen er på plass');
    let oppdatert;
    try {
      oppdatert = (await c.query(
        `UPDATE hvelv_elementer
            SET tittel = COALESCE($3, tittel), innhold = COALESCE($4, innhold),
                kategori = COALESCE($5, kategori), nivaa = COALESCE($6, nivaa),
                versjon = versjon + 1, endret = now()
          WHERE id = $1 AND versjon = $2
          RETURNING ${ELEMENT_FELTER}, hvelv_id`,
        [params.id, Number(versjon), tittel, innhold, kategori, nivaa])).rows[0];
    } catch (feil) {
      if (feil.code === '23514') throw new ApiFeil(400, 'Ugyldig kategori eller nivå');
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke elementet');
      throw feil;
    }
    if (!oppdatert) {
      const gjeldende = (await c.query(
        `SELECT ${ELEMENT_FELTER} FROM hvelv_elementer WHERE id = $1`, [params.id])).rows[0];
      if (!gjeldende) throw new ApiFeil(404, 'Fant ikke elementet');
      const feil = new ApiFeil(409, 'Elementet er endret i mellomtiden');
      feil.data = { element: gjeldende };
      throw feil;
    }
    await loggRevisjon(c, ctx, oppdatert.hvelv_id, 'element_endret', { element_id: oppdatert.id });
    delete oppdatert.hvelv_id;
    return { element: oppdatert };
  }));

  ruter.add('DELETE', '/api/elementer/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    let slettet;
    try {
      slettet = (await c.query(
        'DELETE FROM hvelv_elementer WHERE id = $1 RETURNING id, hvelv_id, kategori',
        [params.id])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke elementet');
      throw feil;
    }
    if (!slettet) throw new ApiFeil(404, 'Fant ikke elementet');
    await loggRevisjon(c, ctx, slettet.hvelv_id, 'element_slettet',
      { element_id: slettet.id, kategori: slettet.kategori });
    return { ok: true };
  }));
}
