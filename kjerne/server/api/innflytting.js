// Modul: Innflyttingen — importerer pilotdata (JSON fra app/eksport.html i den
// gamle appen). Validerer, importerer idempotent (klient_id utledes av
// innholdet, så samme eksport kan limes inn to ganger uten dobbeltføring) og
// svarer med kvittering på nøyaktig hva som kom med. Tap av pilotdata er ikke
// akseptabelt — alt som IKKE importeres, telles og rapporteres.
import crypto from 'node:crypto';
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';

const noekkel = (...deler) =>
  'innfl-' + crypto.createHash('sha256').update(deler.join('|')).digest('hex').slice(0, 24);

export function registrer(ruter) {
  ruter.add('POST', '/api/innflytting', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const data = body.data;
    if (!data || typeof data !== 'object') throw new ApiFeil(400, 'Lim inn eksporten fra den gamle appen');

    const kvittering = { timer: { inn: 0, hoppet: 0 }, hoppetOver: [] };

    // Timeføringer — PRIVAT: importeres alltid som innlogget brukers egne.
    const timer = Array.isArray(data.timer) ? data.timer : [];
    for (const f of timer) {
      if (!f || !f.dato || !f.prosjekt || !(Number(f.timer) > 0)) { kvittering.timer.hoppet++; continue; }
      const res = await c.query(
        `INSERT INTO timeforinger (bruker_id, dato, prosjekt, timer, notat, klient_id)
         VALUES ($1,$2,$3,$4,$5,$6)
         ON CONFLICT (org_id, bruker_id, dato, prosjekt) DO NOTHING RETURNING id`,
        [ctx.brukerId, f.dato, String(f.prosjekt).trim(), Math.min(Number(f.timer), 24),
          f.notat || null, noekkel('timer', ctx.brukerId, f.dato, f.prosjekt)]);
      res.rows.length ? kvittering.timer.inn++ : kvittering.timer.hoppet++;
    }

    // Andre nøkler i eksporten telles åpent så ingenting forsvinner i stillhet.
    for (const [nokkel, verdi] of Object.entries(data)) {
      if (nokkel === 'timer' || nokkel === 'eksportert' || nokkel === 'versjon') continue;
      const antall = Array.isArray(verdi) ? verdi.length : (verdi && typeof verdi === 'object' ? Object.keys(verdi).length : 1);
      if (antall) kvittering.hoppetOver.push({ felt: nokkel, antall,
        hvorfor: 'Ikke støttet i denne versjonen — behold eksporten, importstøtte kan bygges.' });
    }

    await c.query(`INSERT INTO pilotlogg (bruker_id, hendelse) VALUES ($1, 'innflytting-utfort')`,
      [ctx.brukerId]);
    return { kvittering };
  }));
}
