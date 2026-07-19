// Modul: Fristvakta — overtakelsesdato per prosjekt gir nedtelling mot de
// preklusive fristene i NS 8407: sluttoppstilling 2 mnd. etter overtakelse,
// søksmål 8 mnd. Oversittes de, er kravet tapt uansett kvalitet. DELT.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';
import { osloDato } from '../dato.js';

// månedsklampet datoberegning (31.12 + 2 mnd skal bli 28./29.2, aldri 3.3 —
// lærdommen fra pilotens fristvakt-feil)
export function leggTilMnd(isoDato, mnd) {
  const [aar, m, dag] = isoDato.split('-').map(Number);
  const mål = new Date(Date.UTC(aar, m - 1 + mnd, 1));
  const sisteDag = new Date(Date.UTC(mål.getUTCFullYear(), mål.getUTCMonth() + 1, 0)).getUTCDate();
  mål.setUTCDate(Math.min(dag, sisteDag));
  return mål.toISOString().slice(0, 10);
}

export function registrer(ruter) {
  ruter.add('GET', '/api/frister', ({ ctx }) => medOrg(ctx, async (c) => {
    const res = await c.query(
      `SELECT f.*, b.navn AS bruker_navn FROM prosjektfrister f
         JOIN brukere b ON b.id = f.bruker_id ORDER BY f.overtakelse DESC LIMIT 100`);
    const iDag = osloDato();
    return {
      frister: res.rows.map((f) => {
        const slutt2 = leggTilMnd(f.overtakelse, 2);
        const slutt8 = leggTilMnd(f.overtakelse, 8);
        const dager = (til) => Math.ceil((new Date(til) - new Date(iDag)) / 86400000);
        return { ...f, sluttoppstilling: slutt2, soksmaal: slutt8,
          dagerTilSluttoppstilling: dager(slutt2), dagerTilSoksmaal: dager(slutt8) };
      }),
    };
  }));

  ruter.add('POST', '/api/frister', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { prosjekt, overtakelse, klient_id } = body;
    if (!prosjekt || !overtakelse) throw new ApiFeil(400, 'Prosjekt og overtakelsesdato må med');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM prosjektfrister WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { frist: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO prosjektfrister (bruker_id, prosjekt, overtakelse, klient_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (org_id, prosjekt) DO UPDATE
         SET overtakelse = EXCLUDED.overtakelse, versjon = prosjektfrister.versjon + 1
       RETURNING *`,
      [ctx.brukerId, String(prosjekt).trim(), overtakelse, klient_id || null])).rows[0];
    publiser(ctx.orgId, { modul: 'frister', type: 'ny', radId: rad.id, av: ctx.navn });
    return { frist: rad };
  }));

  ruter.add('DELETE', '/api/frister/:id', ({ ctx, params }) => medOrg(ctx, async (c) => {
    const rad = (await c.query('DELETE FROM prosjektfrister WHERE id = $1 RETURNING id', [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke prosjektet (eller mangler rettighet)');
    publiser(ctx.orgId, { modul: 'frister', type: 'slettet', radId: params.id, av: ctx.navn });
    return { ok: true };
  }));
}
