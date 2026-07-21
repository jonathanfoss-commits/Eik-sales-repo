// Etterlattevisningen: mottakeren ser KUN elementer som er frigitt til hen —
// porten er RLS-policyen elementer_mottaker (frigitt + matrise + ikke sensitiv).
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { feiKarenstid } from '../feier.js';

// praktisk-akutt først — rekkefølgen etterlatte trenger, ikke arkivets
const REKKEFOLGE = ['praktisk', 'siste_hilsen', 'helsedirektiv', 'juridisk',
  'forsikring', 'eiendeler', 'digitale_kontoer', 'tilgangsinfo'];

export function registrer(ruter) {
  ruter.add('GET', '/api/etterlatt', async ({ ctx }) => {
    await feiKarenstid(); // lat feiing: utløpt karenstid blir synlig ved første besøk
    return medBruker(ctx, async (c) => {
      const elementer = (await c.query(
        `SELECT e.id, e.kategori, e.nivaa, e.tittel, e.innhold, e.kryptert, e.opprettet,
                b.navn AS eier_navn
           FROM hvelv_elementer e
           JOIN hvelv h ON h.id = e.hvelv_id
           JOIN brukere b ON b.id = h.eier_id
          WHERE element_frigitt_for_meg(e.id)
          ORDER BY array_position($1::text[], e.kategori), e.opprettet`,
        [REKKEFOLGE])).rows;
      return { elementer };
    });
  });

  ruter.add('GET', '/api/etterlatt/elementer/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    let element;
    try {
      element = (await c.query(
        `SELECT e.id, e.hvelv_id, e.kategori, e.nivaa, e.tittel, e.innhold, e.kryptert, e.opprettet,
                b.navn AS eier_navn
           FROM hvelv_elementer e
           JOIN hvelv h ON h.id = e.hvelv_id
           JOIN brukere b ON b.id = h.eier_id
          WHERE e.id = $1 AND element_frigitt_for_meg(e.id)`, [params.id])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke elementet');
      throw feil;
    }
    if (!element) throw new ApiFeil(404, 'Fant ikke elementet');
    // sensitivt: nøkkeldeponiet mitt følger med — porten (frigitt + min
    // matriserad) ligger inne i deponi_for_meg
    if (element.kryptert) {
      element.nokkel_deponi = (await c.query(
        'SELECT deponi_for_meg($1) AS pakket', [element.id])).rows[0]?.pakket || null;
    }
    // lesing av frigitt innhold er en revisjonshendelse
    await loggRevisjon(c, ctx, element.hvelv_id, 'etterlatt_lest', { element_id: element.id });
    delete element.hvelv_id;
    return { element };
  }));
}
