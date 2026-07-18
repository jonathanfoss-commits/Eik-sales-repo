// Modul: Personvern — sletterett som faktisk endepunkt (GDPR, D4).
// Brukersletting: egne persondata anonymiseres/slettes; dagbok består
// anonymisert (bevismateriale for organisasjonen — dokumentert avveining,
// berettiget interesse). Org-sletting er admin + skriftlig bekreftelse.
import { medOrg, authPool } from '../db.js';
import { ApiFeil } from '../http.js';

export function registrer(ruter) {
  // Bruker sletter seg selv (eller admin sletter en ansatt).
  ruter.add('POST', '/api/personvern/slett-bruker', async ({ ctx, body }) => {
    const maalId = body.brukerId || ctx.brukerId;
    if (maalId !== ctx.brukerId && ctx.rolle !== 'admin') {
      throw new ApiFeil(403, 'Kun administrator kan slette andre brukere');
    }
    if (body.bekreft !== 'SLETT') throw new ApiFeil(400, 'Skriv SLETT i bekreftelsesfeltet');

    let slettet = 0;
    await medOrg(ctx, async (c) => {
      // Private data slettes helt via SECURITY DEFINER-funksjonen (migrasjon 004)
      // — admin sletter andres data, og RLS-eierkravet på timer skal ikke gjøre
      // slettingen til en stille no-op (funn fra sikkerhetsgjennomgangen).
      // Delte bevisdata (dagbok/varsler) består anonymisert.
      const res = await c.query('SELECT slett_brukerdata($1) AS antall', [maalId]);
      slettet = res.rows[0].antall;
      await c.query(`INSERT INTO pilotlogg (bruker_id, hendelse) VALUES ($1, 'bruker-slettet')`,
        [ctx.brukerId]);
    });
    // Deaktiver + anonymiser kontoen (auth-laget eier brukere-skriving utenfor org-RLS).
    await authPool.query(
      `UPDATE brukere SET aktiv = false, navn = 'Slettet bruker',
              epost = 'slettet-' || id || '@ugyldig.local', passord_hash = 'slettet',
              totp_hemmelighet = NULL
        WHERE id = $1 AND org_id = $2`, [maalId, ctx.orgId]);
    // org-scopet — en admin skal aldri kunne logge ut brukere i andre tenants
    await authPool.query('DELETE FROM sesjoner WHERE bruker_id = $1 AND org_id = $2',
      [maalId, ctx.orgId]);
    return { ok: true, slettet,
      merknad: `${slettet} private timeføring(er) slettet. Dagboklinjer består anonymisert (bevismateriale).` };
  });
}
