// Meldingsflyten for betrodde kontakter: meld dødsfall, bekreft, last opp
// attest, tilbakekall — og eierens nødbrems (blokker i karenstid).
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { utfoerOvergang, klarForVerifisering } from '../frigivelse.js';
import { varsleAlle } from '../varsling.js';
import { mittHvelv } from './hvelv.js';

export const AAPNE_STATUSER = ['meldt', 'attest_lastet_opp', 'under_verifisering', 'godkjent_1', 'karenstid'];
const MAKS_ATTEST_BYTES = 10 * 1024 * 1024;

async function minBetroddKontakt(c, ctx, hvelvId) {
  return (await c.query(
    'SELECT id FROM kontakter WHERE hvelv_id = $1 AND bruker_id = $2 AND er_betrodd',
    [hvelvId, ctx.brukerId])).rows[0];
}

async function hentFrigivelse(c, hendelseId) {
  let f;
  try {
    f = (await c.query('SELECT * FROM frigivelser WHERE hendelse_id = $1', [hendelseId])).rows[0];
  } catch (feil) {
    if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke meldingen');
    throw feil;
  }
  if (!f) throw new ApiFeil(404, 'Fant ikke meldingen');
  return f;
}

// Autoframdrift (system): attest + to-kilde-regelen avgjør om saken går til
// verifisering. Kjøres i egen transaksjon etter bekreft/attest.
export async function forsokAutoFramdrift(hendelseId) {
  await medBruker({ rolle: 'system' }, async (c) => {
    const f = (await c.query(
      'SELECT * FROM frigivelser WHERE hendelse_id = $1', [hendelseId])).rows[0];
    if (!f || f.status !== 'attest_lastet_opp') return;
    const hendelse = (await c.query(
      'SELECT * FROM hendelser WHERE id = $1', [hendelseId])).rows[0];
    const antallBetrodde = Number((await c.query(
      'SELECT count(*) AS n FROM kontakter WHERE hvelv_id = $1 AND er_betrodd',
      [hendelse.hvelv_id])).rows[0].n);
    const harAttest = (await c.query(
      `SELECT 1 FROM attester WHERE hendelse_id = $1 AND status <> 'avvist' LIMIT 1`,
      [hendelseId])).rows.length > 0;
    const harUavhengigBekreftelse = (await c.query(
      `SELECT 1 FROM hendelse_bekreftelser
        WHERE hendelse_id = $1 AND kontakt_id IS DISTINCT FROM $2 LIMIT 1`,
      [hendelseId, hendelse.meldt_av_kontakt_id])).rows.length > 0;
    if (klarForVerifisering({ harAttest, antallBetrodde, harUavhengigBekreftelse })) {
      await utfoerOvergang(c, { rolle: 'system' }, f, 'under_verifisering', 'system');
    }
  });
}

export function registrer(ruter) {
  // Eierens status: aktive og historiske saker for eget hvelv — grunnlaget for
  // karenstid-nedtellingen og «Stopp frigivelsen»-knappen.
  ruter.add('GET', '/api/status', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const saker = (await c.query(
      `SELECT f.id, f.hendelse_id, f.status, f.karenstid_start, f.karenstid_slutt,
              f.avvist_grunn, f.blokkert_grunn, f.opprettet, h.type, h.kilde
         FROM frigivelser f JOIN hendelser h ON h.id = f.hendelse_id
        WHERE f.hvelv_id = $1 ORDER BY f.opprettet DESC LIMIT 10`, [hvelv.id])).rows;
    return { saker };
  }));

  // Hvelv der jeg er betrodd kontakt — med eventuell aktiv sak.
  ruter.add('GET', '/api/melding/hvelv', ({ ctx }) => medBruker(ctx, async (c) => {
    // siste sak per hvelv — åpen sak foretrekkes, ellers siste avsluttede
    // (melderen skal se utfallet, f.eks. en avvisning)
    const rader = (await c.query(
      `SELECT h.id AS hvelv_id, b.navn AS eier_navn, k.id AS kontakt_id,
              f.hendelse_id, f.status
         FROM kontakter k
         JOIN hvelv h ON h.id = k.hvelv_id
         JOIN brukere b ON b.id = h.eier_id
         LEFT JOIN LATERAL (
           SELECT hendelse_id, status FROM frigivelser
            WHERE hvelv_id = h.id
            ORDER BY (status <> ALL($2)), opprettet DESC LIMIT 1
         ) f ON true
        WHERE k.bruker_id = $1 AND k.er_betrodd
        ORDER BY b.navn`, [ctx.brukerId, AAPNE_STATUSER])).rows;
    return { hvelv: rader };
  }));

  // Meld dødsfall. Alvorlig handling: oppretter hendelse + frigivelse (meldt)
  // og varsler eier + ALLE kontakter.
  ruter.add('POST', '/api/hendelser', async ({ ctx, body }) => {
    const { hvelvId, type = 'dodsfall' } = body;
    if (!hvelvId) throw new ApiFeil(400, 'Hvelv må velges');
    if (type !== 'dodsfall') throw new ApiFeil(400, 'Kun dødsfall kan meldes i denne versjonen');
    const resultat = await medBruker(ctx, async (c) => {
      const kontakt = await minBetroddKontakt(c, ctx, hvelvId);
      if (!kontakt) throw new ApiFeil(403, 'Du er ikke betrodd kontakt i dette hvelvet');
      const aapen = (await c.query(
        'SELECT 1 FROM frigivelser WHERE hvelv_id = $1 AND status = ANY($2) LIMIT 1',
        [hvelvId, AAPNE_STATUSER])).rows[0];
      if (aapen) throw new ApiFeil(409, 'Det er alt en aktiv melding for dette hvelvet');
      const hendelse = (await c.query(
        `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
         VALUES ($1, $2, 'manuell', $3) RETURNING id`, [hvelvId, type, kontakt.id])).rows[0];
      const frigivelse = (await c.query(
        `INSERT INTO frigivelser (hendelse_id, hvelv_id) VALUES ($1, $2)
         RETURNING id, status`, [hendelse.id, hvelvId])).rows[0];
      await loggRevisjon(c, ctx, hvelvId, 'hendelse_meldt',
        { hendelse_id: hendelse.id, kilde: 'manuell', kontakt_id: kontakt.id });
      return { hendelseId: hendelse.id, frigivelse };
    });
    await varsleAlle(hvelvId, resultat.hendelseId, 'hendelse_meldt');
    return resultat;
  });

  // Last opp dødsattest (base64-JSON, ≤10 MB). Fører saken fra meldt til
  // attest_lastet_opp — og videre til under_verifisering hvis kildekravet er møtt.
  ruter.add('POST', '/api/hendelser/:id/attest', async ({ ctx, body, params }) => {
    const { filnavn, mime = 'application/pdf', innholdBase64 } = body;
    if (!filnavn || !innholdBase64) throw new ApiFeil(400, 'Filnavn og innhold må med');
    const innhold = Buffer.from(String(innholdBase64), 'base64');
    if (!innhold.length) throw new ApiFeil(400, 'Tom fil');
    if (innhold.length > MAKS_ATTEST_BYTES) throw new ApiFeil(413, 'Attesten er for stor (maks 10 MB)');
    await medBruker(ctx, async (c) => {
      const f = await hentFrigivelse(c, params.id);
      const kontakt = await minBetroddKontakt(c, ctx, f.hvelv_id);
      if (!kontakt) throw new ApiFeil(403, 'Du er ikke betrodd kontakt i dette hvelvet');
      const attest = (await c.query(
        `INSERT INTO attester (hendelse_id, filnavn, mime, storrelse, innhold, lastet_opp_av)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [params.id, String(filnavn), String(mime), innhold.length, innhold, kontakt.id])).rows[0];
      await loggRevisjon(c, ctx, f.hvelv_id, 'attest_mottatt',
        { hendelse_id: params.id, attest_id: attest.id, storrelse: innhold.length });
      if (f.status === 'meldt') {
        await utfoerOvergang(c, ctx, f, 'attest_lastet_opp', 'kontakt');
      }
    });
    await forsokAutoFramdrift(params.id);
    return { ok: true };
  });

  // Bekreft en annens melding (to-kilde-regelen).
  ruter.add('POST', '/api/hendelser/:id/bekreft', async ({ ctx, params }) => {
    await medBruker(ctx, async (c) => {
      const f = await hentFrigivelse(c, params.id);
      const hendelse = (await c.query(
        'SELECT meldt_av_kontakt_id FROM hendelser WHERE id = $1', [params.id])).rows[0];
      const kontakt = await minBetroddKontakt(c, ctx, f.hvelv_id);
      if (!kontakt) throw new ApiFeil(403, 'Du er ikke betrodd kontakt i dette hvelvet');
      if (kontakt.id === hendelse.meldt_av_kontakt_id) {
        throw new ApiFeil(400, 'Melderen kan ikke bekrefte sin egen melding');
      }
      await c.query(
        `INSERT INTO hendelse_bekreftelser (hendelse_id, kontakt_id) VALUES ($1, $2)
         ON CONFLICT (hendelse_id, kontakt_id) DO NOTHING`, [params.id, kontakt.id]);
      await loggRevisjon(c, ctx, f.hvelv_id, 'hendelse_bekreftet',
        { hendelse_id: params.id, kontakt_id: kontakt.id });
    });
    await forsokAutoFramdrift(params.id);
    return { ok: true };
  });

  // Tilbakekall — kun melderen, kun før første godkjenning.
  ruter.add('POST', '/api/hendelser/:id/tilbakekall', async ({ ctx, params }) => {
    const f = await medBruker(ctx, async (c) => {
      const frigivelse = await hentFrigivelse(c, params.id);
      const erMelder = (await c.query(
        `SELECT 1 FROM hendelser h JOIN kontakter k ON k.id = h.meldt_av_kontakt_id
          WHERE h.id = $1 AND k.bruker_id = $2`, [params.id, ctx.brukerId])).rows[0];
      if (!erMelder) throw new ApiFeil(403, 'Bare melderen kan tilbakekalle');
      return utfoerOvergang(c, ctx, frigivelse, 'tilbakekalt', 'melder');
    });
    await varsleAlle(f.hvelv_id, params.id, 'frigivelse_tilbakekalt');
    return { status: f.status };
  });

  // Eierens nødbrems: «Stopp frigivelsen — jeg lever». Kun i karenstid.
  ruter.add('POST', '/api/hendelser/:id/blokker', async ({ ctx, body, params }) => {
    const f = await medBruker(ctx, async (c) => {
      const frigivelse = await hentFrigivelse(c, params.id);
      return utfoerOvergang(c, ctx, frigivelse, 'blokkert', 'eier',
        { blokkert_av: ctx.brukerId, blokkert_grunn: String(body.grunn || 'Eier stoppet frigivelsen') });
    });
    await varsleAlle(f.hvelv_id, params.id, 'frigivelse_blokkert');
    return { status: f.status };
  });

  // Status og tidslinje for involverte (RLS avgjør hvem som ser).
  ruter.add('GET', '/api/hendelser/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    const f = await hentFrigivelse(c, params.id);
    const hendelse = (await c.query(
      'SELECT id, hvelv_id, type, kilde, opprettet FROM hendelser WHERE id = $1', [params.id])).rows[0];
    const attester = (await c.query(
      'SELECT id, filnavn, status, avvist_grunn, opprettet FROM attester WHERE hendelse_id = $1',
      [params.id])).rows;
    const bekreftelser = Number((await c.query(
      'SELECT count(*) AS n FROM hendelse_bekreftelser WHERE hendelse_id = $1', [params.id])).rows[0].n);
    return {
      hendelse,
      frigivelse: {
        id: f.id, status: f.status, versjon: f.versjon,
        karenstidStart: f.karenstid_start, karenstidSlutt: f.karenstid_slutt,
        avvistGrunn: f.avvist_grunn, blokkertGrunn: f.blokkert_grunn,
      },
      attester, bekreftelser,
    };
  }));
}
