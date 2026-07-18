// Modul: Byggedagbok — DELT, live. Tidsnære bevis (HAB-dommen): linjer kan
// rettes av forfatteren (med versjonsvern), aldri slettes.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

export function registrer(ruter) {
  // Autopiloten: dagsutkast sydd av dagens egne timer (PRIVAT — kun dine går
  // inn) + lagets varsler og tillegg (DELT). Brukeren godkjenner med én tommel
  // — utkastet blir først dagbok når det POSTes.
  ruter.add('GET', '/api/dagbok/autopilot', ({ ctx }) => medOrg(ctx, async (c) => {
    const [timer, varsler, tillegg] = await Promise.all([
      c.query(`SELECT prosjekt, timer, notat FROM timeforinger
                WHERE dato = CURRENT_DATE AND bruker_id = $1`, [ctx.brukerId]),
      c.query(`SELECT type, prosjekt, tekst FROM varsler
                WHERE opprettet::date = CURRENT_DATE`),
      c.query(`SELECT prosjekt, tekst FROM tillegg WHERE dato = CURRENT_DATE`),
    ]);
    const deler = [];
    for (const t of timer.rows) {
      deler.push(`Utført: ${t.prosjekt} — ${t.timer} t${t.notat ? ` (${t.notat})` : ''}`);
    }
    for (const v of varsler.rows) {
      deler.push(`${v.type === 'endringsvarsel' ? 'Endringsvarsel' : 'Varemottak/avvik'}: ${v.prosjekt} — ${v.tekst.slice(0, 120)}`);
    }
    for (const t of tillegg.rows) {
      deler.push(`Tilleggsarbeid avtalt: ${t.prosjekt} — ${t.tekst.slice(0, 120)}`);
    }
    const prosjekt = timer.rows[0]?.prosjekt || varsler.rows[0]?.prosjekt || tillegg.rows[0]?.prosjekt || '';
    return { prosjekt, utkast: deler.join('\n'), antallKilder: deler.length };
  }));

  ruter.add('GET', '/api/dagbok', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    const dager = Math.min(Number(sok.get('dager') || 14), 90);
    const res = await c.query(
      `SELECT d.*, b.navn AS bruker_navn FROM dagbok d
         JOIN brukere b ON b.id = d.bruker_id
        WHERE d.dato >= (CURRENT_DATE - $1::int)
        ORDER BY d.dato DESC, d.opprettet DESC`, [dager]);
    return { linjer: res.rows };
  }));

  ruter.add('GET', '/api/dagbok/:id', ({ ctx, params }) => medOrg(ctx, async (c) => {
    const rad = (await c.query(
      `SELECT d.*, b.navn AS bruker_navn FROM dagbok d
         JOIN brukere b ON b.id = d.bruker_id WHERE d.id = $1`, [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke dagboklinjen');
    return { linje: rad };
  }));

  ruter.add('POST', '/api/dagbok', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { dato, prosjekt, tekst, klient_id } = body;
    if (!prosjekt || !tekst) throw new ApiFeil(400, 'Prosjekt og tekst må fylles ut');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM dagbok WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { linje: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO dagbok (bruker_id, dato, prosjekt, tekst, klient_id)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5)
       ON CONFLICT (org_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [ctx.brukerId, dato || null, String(prosjekt).trim(), String(tekst).trim(),
        klient_id || null])).rows[0]
      // kapp i racet mellom idempotens-oppslaget og insert
      || (await c.query('SELECT * FROM dagbok WHERE klient_id = $1', [klient_id])).rows[0];
    publiser(ctx.orgId, { modul: 'dagbok', type: 'ny', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn });
    return { linje: rad };
  }));

  // Retting med versjonsvern (D3): foreldet versjon → 409 med gjeldende rad.
  ruter.add('PUT', '/api/dagbok/:id', ({ ctx, params, body }) => medOrg(ctx, async (c) => {
    const { tekst, versjon } = body;
    if (!tekst || versjon == null) throw new ApiFeil(400, 'Tekst og versjon må med');
    const rad = (await c.query(
      `UPDATE dagbok SET tekst = $2, versjon = versjon + 1, endret = now()
        WHERE id = $1 AND versjon = $3 RETURNING *`,
      [params.id, String(tekst).trim(), Number(versjon)])).rows[0];
    if (!rad) {
      const gjeldende = (await c.query('SELECT * FROM dagbok WHERE id = $1', [params.id])).rows[0];
      if (!gjeldende) throw new ApiFeil(404, 'Fant ikke dagboklinjen');
      const feil = new ApiFeil(409, 'Linjen er endret av noen andre imens');
      feil.data = { linje: gjeldende };
      throw feil;
    }
    publiser(ctx.orgId, { modul: 'dagbok', type: 'endret', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn });
    return { linje: rad };
  }));
}
