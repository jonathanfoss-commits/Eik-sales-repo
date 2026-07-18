// Modul: Varsler — varemottak/avviksmeldinger og endringsvarsler. DELT, live,
// med statusløp (meldt → sendt → svart → rettet/kreditert).
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

const STATUSER = ['meldt', 'sendt', 'svart', 'rettet', 'kreditert'];

export function registrer(ruter) {
  ruter.add('GET', '/api/varsler', ({ ctx }) => medOrg(ctx, async (c) => {
    const res = await c.query(
      `SELECT v.*, b.navn AS bruker_navn FROM varsler v
         JOIN brukere b ON b.id = v.bruker_id
        ORDER BY v.opprettet DESC LIMIT 200`);
    return { varsler: res.rows };
  }));

  ruter.add('GET', '/api/varsler/:id', ({ ctx, params }) => medOrg(ctx, async (c) => {
    const rad = (await c.query(
      `SELECT v.*, b.navn AS bruker_navn FROM varsler v
         JOIN brukere b ON b.id = v.bruker_id WHERE v.id = $1`, [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke varselet');
    return { varsel: rad };
  }));

  ruter.add('POST', '/api/varsler', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { type, prosjekt, leverandor, tekst, klient_id } = body;
    if (!['varemottak', 'endringsvarsel'].includes(type)) throw new ApiFeil(400, 'Ukjent varseltype');
    if (!prosjekt || !tekst) throw new ApiFeil(400, 'Prosjekt og tekst må fylles ut');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM varsler WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { varsel: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO varsler (bruker_id, type, prosjekt, leverandor, tekst, klient_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (org_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [ctx.brukerId, type, String(prosjekt).trim(), leverandor || null,
        String(tekst).trim(), klient_id || null])).rows[0]
      || (await c.query('SELECT * FROM varsler WHERE klient_id = $1', [klient_id])).rows[0];
    publiser(ctx.orgId, { modul: 'varsler', type: 'ny', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn });
    return { varsel: rad };
  }));

  ruter.add('POST', '/api/varsler/:id/status', ({ ctx, params, body }) => medOrg(ctx, async (c) => {
    if (!STATUSER.includes(body.status)) throw new ApiFeil(400, 'Ukjent status');
    const rad = (await c.query(
      `UPDATE varsler SET status = $2, versjon = versjon + 1, endret = now()
        WHERE id = $1 RETURNING *`, [params.id, body.status])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke varselet');
    publiser(ctx.orgId, { modul: 'varsler', type: 'status', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn });
    return { varsel: rad };
  }));
}
