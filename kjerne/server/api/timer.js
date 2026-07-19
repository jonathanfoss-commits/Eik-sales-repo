// Modul: Timeføring — PRIVAT + LEDELSE [JONATHAN]. RLS-policyene avgjør hvem
// som ser hva (eier + admin/pilotleder); API-et filtrerer aldri selv.
// Én føring per bruker/prosjekt/dato — ny lagring retter den gamle (pilotens
// mønster). Offline-kø: klient_id gjør resending idempotent.
import { medOrg } from '../db.js';
import { ApiFeil } from '../http.js';
import { publiser } from '../buss.js';

// Oslo-dato — serveren kjører i UTC, og «i dag»/«denne uka» skal følge norsk
// kalender (kodegjennomgang funn 6: UTC ga feil dag 00:00–02:00 norsk tid)
const iDag = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(new Date());
const ukestart = (d) => {
  const dato = new Date(d + 'T12:00:00Z');
  dato.setUTCDate(dato.getUTCDate() - ((dato.getUTCDay() + 6) % 7));
  return dato.toISOString().slice(0, 10);
};

export function registrer(ruter) {
  // Egne timer (RLS gir ledelsen alle; ?alle=1 er kun en visningsbryter)
  ruter.add('GET', '/api/timer', ({ ctx, sok }) => medOrg(ctx, async (c) => {
    const fra = sok.get('fra') || ukestart(iDag());
    const til = sok.get('til') || iDag();
    const kunEgne = sok.get('alle') !== '1';
    const res = await c.query(
      `SELECT t.*, b.navn AS bruker_navn FROM timeforinger t
         JOIN brukere b ON b.id = t.bruker_id
        WHERE t.dato BETWEEN $1 AND $2 ${kunEgne ? 'AND t.bruker_id = $3' : ''}
        ORDER BY t.dato DESC, t.endret DESC`,
      kunEgne ? [fra, til, ctx.brukerId] : [fra, til]);
    const sum = res.rows.reduce((s, r) => s + Number(r.timer), 0);
    return { foringer: res.rows, sum, fra, til };
  }));

  ruter.add('POST', '/api/timer', ({ ctx, body }) => medOrg(ctx, async (c) => {
    const { dato, prosjekt, timer, notat, klient_id } = body;
    if (!dato || !prosjekt || timer == null) throw new ApiFeil(400, 'Dato, prosjekt og timer må fylles ut');
    const t = Number(timer);
    if (!(Number.isFinite(t) && t > 0 && t <= 24)) throw new ApiFeil(400, 'Timer må være 0–24');

    if (klient_id) {
      const finnes = (await c.query(
        'SELECT * FROM timeforinger WHERE klient_id = $1', [klient_id])).rows[0];
      if (finnes) return { foring: finnes };
    }
    // Én føring per prosjekt/dag: ny lagring RETTER den gamle (versjon++).
    const rad = (await c.query(
      `INSERT INTO timeforinger (bruker_id, dato, prosjekt, timer, notat, klient_id)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (org_id, bruker_id, dato, prosjekt) DO UPDATE
         SET timer = EXCLUDED.timer, notat = EXCLUDED.notat,
             versjon = timeforinger.versjon + 1, endret = now()
       RETURNING *`,
      [ctx.brukerId, dato, String(prosjekt).trim(), t, notat || null, klient_id || null])).rows[0];
    // Live-hendelse — merket sensitiv: timer er PRIVAT+ledelse, så kun
    // ledelses-strømmer får den (og innholdet hentes uansett bak RLS).
    publiser(ctx.orgId, { modul: 'timer', type: 'endret', radId: rad.id,
      versjon: rad.versjon, av: ctx.navn, sensitiv: true });
    return { foring: rad };
  }));

  ruter.add('DELETE', '/api/timer/:id', ({ ctx, params }) => medOrg(ctx, async (c) => {
    const rad = (await c.query(
      'DELETE FROM timeforinger WHERE id = $1 RETURNING id', [params.id])).rows[0];
    if (!rad) throw new ApiFeil(404, 'Fant ikke føringen');
    publiser(ctx.orgId, { modul: 'timer', type: 'slettet', radId: params.id,
      av: ctx.navn, sensitiv: true });
    return { ok: true };
  }));
}
