// Modul: Innspillsløkka (💡 idé / 🐞 skurrer / 👍 funker) + pilotlogg +
// godkjenninger (to-nøkkel som autentiserte audit-rader).
// Personvernregelen (ufravikelig): pilotloggen lagrer KUN hendelsestyper —
// aldri innhold. Innspill-tabellen er unntaket: innhold brukeren aktivt sender.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/innspill', ({ ctx }) => medOrg(ctx, async (c) => {
    const res = await c.query(
      `SELECT i.*, b.navn AS bruker_navn FROM innspill i
         LEFT JOIN brukere b ON b.id = i.bruker_id
        ORDER BY i.opprettet DESC LIMIT 200`);
    return { innspill: res.rows };
  }));

  ruter.add('POST', '/api/innspill', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { type, tekst, klient_id } = body;
    if (!['ide', 'skurrer', 'funker'].includes(type)) throw new ApiFeil(400, 'Ukjent innspillstype');
    if (!tekst || !String(tekst).trim()) throw new ApiFeil(400, 'Skriv innspillet først');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM innspill WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { innspill: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO innspill (bruker_id, type, tekst, klient_id) VALUES ($1,$2,$3,$4)
       ON CONFLICT (org_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [ctx.brukerId, type, String(tekst).trim(), klient_id || null])).rows[0]
      || (await c.query('SELECT * FROM innspill WHERE klient_id = $1', [klient_id])).rows[0];
    publiser(ctx.orgId, { modul: 'innspill', type: 'ny', radId: rad.id, av: ctx.navn });
    return { innspill: rad };
  }));

  // Panelsvar (ledelsen skriver — RLS håndhever)
  ruter.add('POST', '/api/innspill/:id/svar', ({ ctx, params, body }) => medOrg(ctx, async (c) => {
    const { svar, status } = body;
    const rad = (await c.query(
      `UPDATE innspill SET svar = $2, svar_av = $3,
              status = COALESCE($4, 'besvart'), versjon = versjon + 1
        WHERE id = $1 RETURNING *`,
      [params.id, svar || null, ctx.navn, status || null])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke innspillet (eller mangler rettighet)');
    publiser(ctx.orgId, { modul: 'innspill', type: 'svar', radId: rad.id, av: ctx.navn });
    return { innspill: rad };
  }));

  // Pilotlogg: hendelsestyper, aldri innhold. Klienten sender kun en kort kode.
  ruter.add('POST', '/api/pilotlogg', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const hendelse = String(body.hendelse || '').slice(0, 60);
    if (!hendelse) throw new ApiFeil(400, 'Mangler hendelse');
    await c.query('INSERT INTO pilotlogg (bruker_id, hendelse) VALUES ($1, $2)',
      [ctx.brukerId, hendelse]);
    return { ok: true };
  }));

  // Godkjenninger — én autentisert stemme per bruker per versjon.
  ruter.add('GET', '/api/godkjenninger', ({ ctx }) => medOrg(ctx, async (c) => {
    const res = await c.query(
      `SELECT g.*, b.navn AS bruker_navn, b.rolle AS bruker_rolle FROM godkjenninger g
         JOIN brukere b ON b.id = g.bruker_id ORDER BY g.tid DESC LIMIT 50`);
    return { stemmer: res.rows };
  }));

  ruter.add('POST', '/api/godkjenninger', ({ ctx, body }) => medOrg(ctx, async (c) => {
    // RLS (godkjenninger_skriv krever er_ledelse) tetter uansett — sjekken her
    // gir ryddig 403 i stedet for 500 ved RLS-brudd (samme mønster som faktura).
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) {
      throw new ApiFeil(403, 'Godkjenningsstemmer er for ledelsen');
    }
    const { versjon, stemme } = body;
    if (!versjon || !['godkjent', 'avvist'].includes(stemme)) {
      throw new ApiFeil(400, 'Versjon og stemme (godkjent/avvist) må med');
    }
    const rad = (await c.query(
      `INSERT INTO godkjenninger (bruker_id, versjon, stemme) VALUES ($1,$2,$3)
       ON CONFLICT (org_id, bruker_id, versjon) DO UPDATE SET stemme = EXCLUDED.stemme, tid = now()
       RETURNING *`, [ctx.brukerId, String(versjon), stemme])).rows[0];
    publiser(ctx.orgId, { modul: 'godkjenninger', type: 'stemme', radId: rad.id, av: ctx.navn });
    return { stemme: rad };
  }));
}
