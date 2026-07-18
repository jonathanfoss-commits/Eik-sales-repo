// Modul: Tilleggsfangeren — «vi tar det på regning» fanget på 20 sekunder,
// før det glemmes. DELT (hele laget ser hva som er avtalt); fakturagrunnlaget
// hentes av ledelsen. Konkursdriveren fra researchen: muntlige tillegg som
// aldri faktureres.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/tillegg', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    const kunAapne = sok.get('alle') !== '1';
    const res = await c.query(
      `SELECT t.*, b.navn AS bruker_navn FROM tillegg t
         JOIN brukere b ON b.id = t.bruker_id
        ${kunAapne ? `WHERE t.status = 'registrert'` : ''}
        ORDER BY t.opprettet DESC LIMIT 200`);
    return { tillegg: res.rows };
  }));

  ruter.add('POST', '/api/tillegg', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { prosjekt, avtalt_med, tekst, klient_id } = body;
    if (!prosjekt || !tekst) throw new ApiFeil(400, 'Prosjekt og hva som ble avtalt må med');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM tillegg WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { tillegg: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO tillegg (bruker_id, prosjekt, avtalt_med, tekst, klient_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (org_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [ctx.brukerId, String(prosjekt).trim(), avtalt_med || null, String(tekst).trim(),
        klient_id || null])).rows[0]
      || (await c.query('SELECT * FROM tillegg WHERE klient_id = $1', [klient_id])).rows[0];
    publiser(ctx.orgId, { modul: 'tillegg', type: 'ny', radId: rad.id, av: ctx.navn });
    return { tillegg: rad };
  }));

  // Fakturagrunnlag: åpne tillegg per prosjekt som ferdig tekst (ledelsen).
  ruter.add('GET', '/api/tillegg/fakturagrunnlag', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Fakturagrunnlag er for ledelsen');
    const prosjekt = sok.get('prosjekt');
    if (!prosjekt) throw new ApiFeil(400, 'Angi prosjekt');
    const res = await c.query(
      `SELECT t.*, b.navn AS bruker_navn FROM tillegg t
         JOIN brukere b ON b.id = t.bruker_id
        WHERE t.prosjekt = $1 AND t.status = 'registrert' ORDER BY t.dato`, [prosjekt]);
    const linjer = res.rows.map((t) =>
      `- ${t.dato}: ${t.tekst}${t.avtalt_med ? ` (avtalt med ${t.avtalt_med})` : ''} — registrert av ${t.bruker_navn}`);
    return {
      antall: res.rows.length,
      tekst: `FAKTURAGRUNNLAG — TILLEGGSARBEID\nProsjekt: ${prosjekt}\n\n` +
        (linjer.join('\n') || '(ingen åpne tillegg)') +
        `\n\nSamtlige tillegg avtalt før utførelse. Beløp settes ved fakturering.`,
    };
  }));

  ruter.add('POST', '/api/tillegg/:id/fakturert', ({ ctx, params }) => medOrg(ctx, async (c) => {
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Kun ledelsen');
    const rad = (await c.query(
      `UPDATE tillegg SET status = 'fakturert', versjon = versjon + 1
        WHERE id = $1 RETURNING *`, [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke tillegget');
    publiser(ctx.orgId, { modul: 'tillegg', type: 'fakturert', radId: rad.id, av: ctx.navn });
    return { tillegg: rad };
  }));
}
