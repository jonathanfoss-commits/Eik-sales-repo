// Modul: Skrivemotoren — evnene kommer fra tenant-konfigen (organisasjoner.konfig),
// gatewayen håndhever budsjett og logger kost (aldri innhold).
// Personvern (ufravikelig, fra piloten): teksten sendes KUN når brukeren aktivt
// trykker — ren gjennomstrømming, lagres aldri på serveren.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { kallEvne, sjekkKvote, loggKost, aiTilgjengelig } from '../ai/gateway.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/skriv/evner', ({ ctx }) => medOrg(ctx, async (c) => {
    const org = (await c.query('SELECT konfig FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
    const evner = org?.konfig?.evner || {};
    // Klienten trenger kun navnene — aldri instrukser eller modellvalg.
    return {
      tilgjengelig: aiTilgjengelig(),
      evner: Object.fromEntries(Object.entries(evner).map(([id, e]) => [id, { navn: e.navn || id }])),
    };
  }));

  ruter.add('POST', '/api/skriv', async ({ ctx, body }) => {
    const { evne, tekst } = body;
    // 1) Kort transaksjon: hent tenant-evnen + sjekk budsjettet.
    const oppsett = await medOrg(ctx, async (c) => {
      const org = (await c.query('SELECT konfig FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
      const e = org?.konfig?.evner?.[evne];
      if (!e) throw new ApiFeil(400, `Ukjent AI-evne: ${evne}`);
      await sjekkKvote(c);
      return { e, profil: org.konfig.profil || '' };
    });
    // 2) Modellkallet UTENFOR transaksjon.
    const resultat = await kallEvne({ navn: evne, evne: oppsett.e, profil: oppsett.profil, tekst });
    // 3) Kostnadslogg i egen transaksjon (aldri innhold).
    await medOrg(ctx, (c) => loggKost(c, {
      orgId: ctx.orgId, brukerId: ctx.brukerId, evne,
      modell: resultat.modell, usage: resultat.usage, kostOre: resultat.kostOre,
    }));
    return { tekst: resultat.tekst };
  });
}
