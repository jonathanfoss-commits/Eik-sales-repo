// Karenstid-feieren: fører frigivelser der karenstiden er utløpt til
// 'frigitt'. Kjøres både lat (ved lesing av status/kø/etterlatt) og av et
// intervall i serveren — tilstanden går aldri tapt om serveren er nede,
// den plukkes opp ved neste kjøring.
import { medBruker } from './db.js';
import { loggRevisjon } from './revisjon.js';
import { varsleAlle } from './varsling.js';

export async function feiKarenstid() {
  const frigitte = await medBruker({ rolle: 'system' }, async (c) => {
    const rader = (await c.query(
      `UPDATE frigivelser
          SET status = 'frigitt', frigitt_tid = now(), versjon = versjon + 1
        WHERE status = 'karenstid' AND karenstid_slutt <= now()
        RETURNING id, hvelv_id, hendelse_id`)).rows;
    for (const f of rader) {
      await loggRevisjon(c, { rolle: 'system' }, f.hvelv_id, 'frigivelse_frigitt',
        { frigivelse_id: f.id, fra: 'karenstid', aktor: 'system' });
    }
    return rader;
  });
  for (const f of frigitte) {
    await varsleAlle(f.hvelv_id, f.hendelse_id, 'frigivelse_frigitt');
  }
  return frigitte.length;
}
