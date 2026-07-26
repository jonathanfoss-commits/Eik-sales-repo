// Karenstid-feieren: fører frigivelser der karenstiden er utløpt til
// 'frigitt'. Kjøres både lat (ved lesing av status/kø/etterlatt) og av et
// intervall i serveren.
//
// Holdbarhet (nivå 6): tilstandsendring, revisjonsrad og varslingskø skjer i
// ÉN transaksjon. Er databasen nede, skjer ingenting — karenstiden står, og
// neste feiing plukker den opp (også etter lang nedetid, siden vilkåret er
// «karenstid_slutt har passert», ikke «passerte nå»). Utsending av e-post er
// en separat, gjentakbar passering.
import { medBruker } from './db.js';
import { loggRevisjon } from './revisjon.js';
import { koVarsler, sendUtestaaende } from './varsling.js';

export async function feiKarenstid() {
  const frigitte = await medBruker({ rolle: 'system' }, async (c) => {
    // FOR UPDATE SKIP LOCKED: to samtidige feiinger (intervall + lat kall)
    // kan aldri frigi samme sak to ganger eller vente på hverandre.
    const kandidater = (await c.query(
      `SELECT id FROM frigivelser
        WHERE status = 'karenstid' AND karenstid_slutt <= now()
        FOR UPDATE SKIP LOCKED`)).rows;
    if (!kandidater.length) return [];
    const rader = (await c.query(
      `UPDATE frigivelser
          SET status = 'frigitt', frigitt_tid = now(), versjon = versjon + 1
        WHERE id = ANY($1) AND status = 'karenstid'
        RETURNING id, hvelv_id, hendelse_id`,
      [kandidater.map((k) => k.id)])).rows;
    for (const f of rader) {
      await loggRevisjon(c, { rolle: 'system' }, f.hvelv_id, 'frigivelse_frigitt',
        { frigivelse_id: f.id, fra: 'karenstid', aktor: 'system' });
      await koVarsler(c, f.hvelv_id, f.hendelse_id, 'frigivelse_frigitt');
    }
    return rader;
  });
  if (frigitte.length) await sendUtestaaende();
  return frigitte.length;
}
