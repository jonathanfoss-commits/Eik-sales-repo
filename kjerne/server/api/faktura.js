// Modul: Purretrappa — fakturaer med forfall og riktig purretrinn til riktig
// tid (vennlig → forsinkelsesrente → inkassovarsel, inkassoloven § 9).
// KUN LEDELSE (D22): økonomi er ledelsens domene. RLS håndhever.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

const dagerOver = (forfall) =>
  Math.floor((Date.now() - new Date(forfall + 'T12:00:00').getTime()) / 86400000);
export const foreslaattTrinn = (dager) => (dager >= 42 ? 3 : dager >= 14 ? 2 : 1);

export function purretekst({ trinn, kunde, referanse, dager, avsender, firma }) {
  const d = Math.max(dager, 0);
  if (trinn === 1) {
    return `Hei!\n\nEn liten påminnelse om ${referanse}, som forfalt for ${d} dager siden. ` +
      `Sikkert bare glemt i farta — fint om dere får ordnet den.\n\nSi fra hvis noe er uklart!\n\nMvh ${avsender}, ${firma}`;
  }
  if (trinn === 2) {
    return `Hei,\n\nVi viser til ${referanse}, forfalt for ${d} dager siden, og vår tidligere påminnelse.\n\n` +
      `Ved fortsatt manglende betaling beregnes forsinkelsesrente etter forsinkelsesrenteloven fra forfallsdato. ` +
      `Vennligst betal omgående, eller ta kontakt hvis dere mener noe er feil.\n\nMvh ${avsender}, ${firma}`;
  }
  return `INKASSOVARSEL\n\nDet vises til ${referanse} til ${kunde}, forfalt for ${d} dager siden, ` +
    `samt tidligere purringer.\n\nDersom betaling ikke er mottatt innen 14 dager fra dette varselet, ` +
    `oversendes kravet til inkasso uten ytterligere varsel, jf. inkassoloven § 9. ` +
    `Forsinkelsesrente og omkostninger tilkommer.\n\n${firma}`;
}

export function registrer(ruter) {
  ruter.add('GET', '/api/fakturaer', ({ ctx }) => medOrg(ctx, async (c) => {
    if (!['admin', 'pilotleder'].includes(ctx.rolle)) throw new ApiFeil(403, 'Purretrappa er for ledelsen');
    const res = await c.query(
      `SELECT * FROM fakturaer WHERE status <> 'betalt' ORDER BY forfall ASC LIMIT 200`);
    return {
      fakturaer: res.rows.map((f) => ({
        ...f, dagerOver: dagerOver(f.forfall), foreslaatt: foreslaattTrinn(dagerOver(f.forfall)),
      })),
    };
  }));

  ruter.add('POST', '/api/fakturaer', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { kunde, referanse, forfall, klient_id } = body;
    if (!kunde || !referanse || !forfall) throw new ApiFeil(400, 'Kunde, referanse og forfall må med');
    if (klient_id) {
      const finnes = (await c.query('SELECT * FROM fakturaer WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { faktura: finnes };
    }
    const rad = (await c.query(
      `INSERT INTO fakturaer (bruker_id, kunde, referanse, forfall, klient_id)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (org_id, klient_id) WHERE klient_id IS NOT NULL DO NOTHING
       RETURNING *`,
      [ctx.brukerId, String(kunde).trim(), String(referanse).trim(), forfall, klient_id || null])).rows[0]
      || (await c.query('SELECT * FROM fakturaer WHERE klient_id = $1', [klient_id])).rows[0];
    publiser(ctx.orgId, { modul: 'faktura', type: 'ny', radId: rad.id, av: ctx.navn, sensitiv: true });
    return { faktura: rad };
  }));

  // Purremelding for et gitt trinn — teksten genereres på serveren så malene
  // er felles for alle klienter; purringen registreres i statusløpet.
  ruter.add('POST', '/api/fakturaer/:id/purring', ({ ctx, params, body }) => medOrg(ctx, async (c) => {
    const trinn = Number(body.trinn);
    if (![1, 2, 3].includes(trinn)) throw new ApiFeil(400, 'Trinn må være 1, 2 eller 3');
    const f = (await c.query('SELECT * FROM fakturaer WHERE id = $1', [params.id])).rows[0];
    if (!f) throw new ApiFeil(404, 'Fant ikke fakturaen');
    const org = (await c.query('SELECT navn FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
    const tekst = purretekst({
      trinn, kunde: f.kunde, referanse: f.referanse,
      dager: dagerOver(f.forfall), avsender: ctx.navn, firma: org?.navn || '',
    });
    const nyStatus = trinn === 3 ? 'varslet' : trinn === 2 ? 'purret2' : 'purret1';
    const rad = (await c.query(
      `UPDATE fakturaer SET status = $2, versjon = versjon + 1, endret = now()
        WHERE id = $1 RETURNING *`, [params.id, nyStatus])).rows[0];
    publiser(ctx.orgId, { modul: 'faktura', type: 'purret', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn, sensitiv: true });
    return { tekst, faktura: rad };
  }));

  ruter.add('POST', '/api/fakturaer/:id/betalt', ({ ctx, params }) => medOrg(ctx, async (c) => {
    const rad = (await c.query(
      `UPDATE fakturaer SET status = 'betalt', versjon = versjon + 1, endret = now()
        WHERE id = $1 RETURNING *`, [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke fakturaen');
    publiser(ctx.orgId, { modul: 'faktura', type: 'betalt', radId: rad.id, av: ctx.navn, sensitiv: true });
    return { faktura: rad };
  }));
}
