// Modul: Kommandosentralen — nøkkeltall for ledelsen. AI-kost er SENSITIVT
// (kun admin [JONATHAN]) — RLS håndhever det; når admin henter kost, føres
// revisjonslogg (hendelsestype, aldri innhold).
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { config } from '../config.js';

export function registrer(ruter) {
  // Oversikt for ledelsen: aktivitet, innspill, godkjenninger. (Pilotloggen
  // er ledelse-lesbar via RLS.)
  ruter.add('GET', '/api/sentral', ({ ctx }) => medOrg(ctx, async (c) => {
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) {
      throw new ApiFeil(403, 'Kommandosentralen er for ledelsen');
    }
    const [hendelser, innspill, stemmer, dagbok] = await Promise.all([
      c.query(`SELECT hendelse, count(*)::int AS antall FROM pilotlogg
                WHERE tid >= now() - interval '14 days'
                GROUP BY hendelse ORDER BY antall DESC LIMIT 20`),
      c.query(`SELECT count(*)::int AS antall, status FROM innspill GROUP BY status`),
      c.query(`SELECT g.versjon, g.stemme, b.navn, g.tid FROM godkjenninger g
                 JOIN brukere b ON b.id = g.bruker_id ORDER BY g.tid DESC LIMIT 10`),
      c.query(`SELECT count(*)::int AS antall FROM dagbok
                WHERE dato >= CURRENT_DATE - 7`),
    ]);
    return {
      hendelser: hendelser.rows,
      innspillStatus: innspill.rows,
      stemmer: stemmer.rows,
      dagbokSisteUke: dagbok.rows[0].antall,
    };
  }));

  // AI-kost — kun admin (RLS gir tom liste for andre; vi svarer 403 eksplisitt
  // for ærlighetens skyld) + revisjonslogg.
  ruter.add('GET', '/api/sentral/ai-kost', ({ ctx }) => medOrg(ctx, async (c) => {
    if (ctx.rolle !== 'admin') throw new ApiFeil(403, 'AI-kostnader er kun for administrator');
    await c.query(`INSERT INTO revisjon (bruker_id, hendelse) VALUES ($1, 'ai-kost-lest')`,
      [ctx.brukerId]);
    const [mnd, perEvne] = await Promise.all([
      c.query(`SELECT COALESCE(SUM(kost_ore), 0) AS ore, count(*)::int AS kall
                 FROM ai_logg WHERE tid >= date_trunc('month', now())`),
      c.query(`SELECT evne, modell, count(*)::int AS kall, COALESCE(SUM(kost_ore), 0) AS ore
                 FROM ai_logg WHERE tid >= date_trunc('month', now())
                GROUP BY evne, modell ORDER BY ore DESC`),
    ]);
    return {
      mndOre: Number(mnd.rows[0].ore),
      mndKall: mnd.rows[0].kall,
      budsjettOre: config.aiMndBudsjettOre,
      perEvne: perEvne.rows,
    };
  }));

  // Nullstillingskode for en ansatt (ledelsen) — reserven når e-post ikke er
  // satt opp, og hjelpen når noen står fast. Koden vises ÉN gang.
  ruter.add('POST', '/api/sentral/nullstill', async ({ ctx, body }) => {
    const { lagNullstilling } = await import('../auth.js');
    return medOrg(ctx, async (c) => {
      if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Kun ledelsen');
      const bruker = (await c.query(
        'SELECT id, navn FROM brukere WHERE id = $1 AND aktiv', [body.brukerId])).rows[0];
      if (!bruker) throw new ApiFeil(404, 'Fant ikke brukeren');
      const kode = await lagNullstilling(bruker.id, 24);
      await c.query(`INSERT INTO pilotlogg (bruker_id, hendelse) VALUES ($1, 'nullstilling-laget')`,
        [ctx.brukerId]);
      return { kode, navn: bruker.navn, gyldigTimer: 24 };
    });
  });

  ruter.add('GET', '/api/sentral/brukere', ({ ctx }) => medOrg(ctx, async (c) => {
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Kun ledelsen');
    const res = await c.query(
      'SELECT id, navn, rolle, aktiv FROM brukere ORDER BY navn');
    return { brukere: res.rows.filter((b) => b.aktiv) };
  }));

  // Invitasjoner (ledelsen): lag kode for ny ansatt. Koden vises ÉN gang.
  ruter.add('POST', '/api/sentral/invitasjon', async ({ ctx, body }) => {
    const { lagInvitasjonskode, hashInvitasjonskode } = await import('../auth.js');
    return medOrg(ctx, async (c) => {
      if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Kun ledelsen inviterer');
      const rolle = ['admin', 'pilotleder', 'ansatt'].includes(body.rolle) ? body.rolle : 'ansatt';
      const kode = lagInvitasjonskode();
      await c.query(
        `INSERT INTO invitasjoner (org_id, kode_hash, rolle, utloper)
         VALUES ($1, $2, $3, now() + interval '14 days')`,
        [ctx.orgId, hashInvitasjonskode(kode), rolle]);
      return { kode, rolle, gyldigDager: 14 };
    });
  });
}
