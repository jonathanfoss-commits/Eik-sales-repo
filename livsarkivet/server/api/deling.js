// Kunden deler utvalgte felt med sitt eget forsikringsselskap — og kan trekke
// dem tilbake. Se ADR-006 for hvorfor akkurat disse feltene, og hvorfor de
// ligger i klartekst når resten av hvelvet ikke gjør det.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { mittHvelv } from './hvelv.js';

// Feltene et livsforsikringsselskap faktisk trenger for å komme i gang med en
// utbetaling. Ikke én til: hvert felt her er noe kunden gir fra seg.
export const FELTTYPER = {
  polisenummer: 'Polisenummer',
  kundenummer: 'Kundenummer',
  begunstiget: 'Hvem som skal motta utbetalingen',
  kontaktperson: 'Hvem selskapet skal kontakte ved dødsfall',
};

export function registrer(ruter) {
  ruter.add('GET', '/api/deling', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const delinger = (await c.query(
      `SELECT id, felttype, verdi, delt_tid FROM selskapsdeling
        WHERE hvelv_id = $1 AND trukket_tid IS NULL ORDER BY felttype`,
      [hvelv.id])).rows;
    // Hvilket selskap dette faktisk deles MED — uten det er avkryssingen blind.
    const selskap = (await c.query(
      `SELECT t.navn FROM tenanter t JOIN brukere b ON b.tenant_id = t.id
        WHERE b.id = $1 AND t.slug <> 'livsarkivet'`, [ctx.brukerId])).rows[0] || null;
    return { delinger, felttyper: FELTTYPER, selskap };
  }));

  ruter.add('POST', '/api/deling', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const felttype = String(body.felttype || '');
    const verdi = String(body.verdi || '').trim();
    if (!FELTTYPER[felttype]) throw new ApiFeil(400, 'Ukjent felttype');
    if (!verdi || verdi.length > 200) throw new ApiFeil(400, 'Verdien må ha 1–200 tegn');
    const hvelv = await mittHvelv(c, ctx);
    // Ny verdi på et felt som alt er delt: trekk den gamle først, så
    // historikken viser hva som var delt når. Det partielle unike indekset
    // ville ellers avvist innsettingen.
    await c.query(
      `UPDATE selskapsdeling SET trukket_tid = now()
        WHERE hvelv_id = $1 AND felttype = $2 AND trukket_tid IS NULL`,
      [hvelv.id, felttype]);
    const rad = (await c.query(
      `INSERT INTO selskapsdeling (hvelv_id, felttype, verdi)
       VALUES ($1, $2, $3) RETURNING id, felttype, verdi, delt_tid`,
      [hvelv.id, felttype, verdi])).rows[0];
    // Loggen bærer felttypen, ALDRI verdien.
    await loggRevisjon(c, ctx, hvelv.id, 'deling_startet', { felttype });
    return { deling: rad };
  }));

  // Tilbaketrekk er ALDRI portet bak abonnement. Ingen skal kunne bli låst
  // fast i en deling fordi et kort gikk ut — samme prinsipp som at eierens
  // nødbrems i frigivelsesløpet alltid virker.
  ruter.add('DELETE', '/api/deling/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const rad = (await c.query(
      `UPDATE selskapsdeling SET trukket_tid = now()
        WHERE id = $1 AND hvelv_id = $2 AND trukket_tid IS NULL
        RETURNING felttype`, [params.id, hvelv.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ingen aktiv deling');
    await loggRevisjon(c, ctx, hvelv.id, 'deling_trukket', { felttype: rad.felttype });
    return { ok: true };
  }));
}
