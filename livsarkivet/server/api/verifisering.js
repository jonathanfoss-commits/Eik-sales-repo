// Admin: verifiseringskø, attestvurdering og fire-øyne-godkjenning.
// Admin ser sakens metadata — aldri hvelvinnhold (ingen policy gir det).
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { utfoerOvergang, fireOyneOk } from '../frigivelse.js';
import { varsleAlle } from '../varsling.js';
import { feiKarenstid } from '../feier.js';
import { config } from '../config.js';
import { naa } from '../klokke.js';

function krevAdmin(ctx) {
  if (ctx.rolle !== 'admin') throw new ApiFeil(403, 'Kun for saksbehandlere');
}

async function hentSak(c, frigivelseId) {
  let f;
  try {
    f = (await c.query('SELECT * FROM frigivelser WHERE id = $1', [frigivelseId])).rows[0];
  } catch (feil) {
    if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke saken');
    throw feil;
  }
  if (!f) throw new ApiFeil(404, 'Fant ikke saken');
  return f;
}

export function registrer(ruter) {
  ruter.add('GET', '/api/admin/koe', async ({ ctx }) => {
    krevAdmin(ctx);
    await feiKarenstid(); // lat feiing: køen viser alltid ferskt bilde
    return medBruker(ctx, async (c) => {
      const saker = (await c.query(
        `SELECT f.id, f.status, f.versjon, f.opprettet, f.godkjent_1_av,
                f.karenstid_start, f.karenstid_slutt,
                h.id AS hendelse_id, h.type, h.kilde,
                k.navn AS melder_navn, k.epost AS melder_epost, k.relasjon AS melder_relasjon,
                (SELECT count(*) FROM hendelse_bekreftelser b WHERE b.hendelse_id = h.id) AS bekreftelser,
                (SELECT count(*) FROM kontakter kb WHERE kb.hvelv_id = f.hvelv_id AND kb.er_betrodd) AS betrodde
           FROM frigivelser f
           JOIN hendelser h ON h.id = f.hendelse_id
           LEFT JOIN kontakter k ON k.id = h.meldt_av_kontakt_id
          WHERE f.status IN ('under_verifisering', 'godkjent_1', 'karenstid')
          ORDER BY f.opprettet`)).rows;
      const attester = (await c.query(
        `SELECT id, hendelse_id, filnavn, mime, storrelse, status, avvist_grunn, opprettet
           FROM attester WHERE hendelse_id = ANY($1)`,
        [saker.map((s) => s.hendelse_id)])).rows;
      for (const sak of saker) {
        sak.attester = attester.filter((a) => a.hendelse_id === sak.hendelse_id);
        sak.fire_oyne_venter = sak.status === 'godkjent_1';
      }
      return { saker };
    });
  });

  ruter.add('GET', '/api/admin/attester/:id', ({ ctx, params }) => {
    krevAdmin(ctx);
    return medBruker(ctx, async (c) => {
      let attest;
      try {
        attest = (await c.query(
          `SELECT id, hendelse_id, filnavn, mime, storrelse, status, innhold
             FROM attester WHERE id = $1`, [params.id])).rows[0];
      } catch (feil) {
        if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke attesten');
        throw feil;
      }
      if (!attest) throw new ApiFeil(404, 'Fant ikke attesten');
      await loggRevisjon(c, ctx, null, 'attest_aapnet', { attest_id: attest.id });
      return { attest: { ...attest, innhold: undefined,
        innholdBase64: attest.innhold.toString('base64') } };
    });
  });

  // Rå fil for nettleservisning (PDF/foto) — samme tilgang, samme revisjon.
  ruter.add('GET', '/api/admin/attester/:id/fil', ({ ctx, params }) => {
    krevAdmin(ctx);
    return medBruker(ctx, async (c) => {
      let attest;
      try {
        attest = (await c.query(
          'SELECT id, filnavn, mime, innhold FROM attester WHERE id = $1', [params.id])).rows[0];
      } catch (feil) {
        if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke attesten');
        throw feil;
      }
      if (!attest) throw new ApiFeil(404, 'Fant ikke attesten');
      await loggRevisjon(c, ctx, null, 'attest_aapnet', { attest_id: attest.id });
      return { _fil: { filnavn: attest.filnavn, mime: attest.mime, innhold: attest.innhold } };
    });
  });

  // Godkjenning: første admin fører saken til godkjent_1; en ANNEN admin må
  // ta den videre — da settes karenstiden i samme overgang (fire øyne).
  ruter.add('POST', '/api/admin/frigivelser/:id/godkjenn', async ({ ctx, params }) => {
    const resultat = await medBruker(ctx, async (c) => {
      krevAdmin(ctx);
      const f = await hentSak(c, params.id);
      if (f.status === 'under_verifisering') {
        const harAttest = (await c.query(
          `SELECT 1 FROM attester WHERE hendelse_id = $1 AND status <> 'avvist' LIMIT 1`,
          [f.hendelse_id])).rows[0];
        if (!harAttest) throw new ApiFeil(409, 'Saken mangler gyldig attest');
        await c.query(
          `UPDATE attester SET status = 'godkjent', vurdert_av = $2, vurdert_tid = now()
            WHERE hendelse_id = $1 AND status = 'mottatt'`, [f.hendelse_id, ctx.brukerId]);
        const oppdatert = await utfoerOvergang(c, ctx, f, 'godkjent_1', 'admin',
          { godkjent_1_av: ctx.brukerId, godkjent_1_tid: naa() });
        return { frigivelse: oppdatert, varsle: null };
      }
      if (f.status === 'godkjent_1') {
        if (!fireOyneOk(f.godkjent_1_av, ctx.brukerId)) {
          throw new ApiFeil(409, 'Fire øyne: en annen saksbehandler må ta den andre godkjenningen');
        }
        const start = naa();
        const slutt = new Date(start.getTime() + config.karenstidSekunder * 1000);
        const oppdatert = await utfoerOvergang(c, ctx, f, 'karenstid', 'admin',
          { godkjent_2_av: ctx.brukerId, godkjent_2_tid: start,
            karenstid_start: start, karenstid_slutt: slutt });
        return { frigivelse: oppdatert, varsle: 'karenstid_startet' };
      }
      throw new ApiFeil(409, `Saken kan ikke godkjennes fra ${f.status}`);
    });
    if (resultat.varsle) {
      await varsleAlle(resultat.frigivelse.hvelv_id, resultat.frigivelse.hendelse_id, resultat.varsle);
    }
    return { status: resultat.frigivelse.status };
  });

  ruter.add('POST', '/api/admin/frigivelser/:id/avvis', async ({ ctx, body, params }) => {
    const grunn = String(body.grunn || '').trim();
    if (!grunn) throw new ApiFeil(400, 'Avvisning krever en grunn');
    const f = await medBruker(ctx, async (c) => {
      krevAdmin(ctx);
      const sak = await hentSak(c, params.id);
      await c.query(
        `UPDATE attester SET status = 'avvist', vurdert_av = $2, vurdert_tid = now(), avvist_grunn = $3
          WHERE hendelse_id = $1 AND status = 'mottatt'`, [sak.hendelse_id, ctx.brukerId, grunn]);
      return utfoerOvergang(c, ctx, sak, 'avvist', 'admin', { avvist_grunn: grunn });
    });
    await varsleAlle(f.hvelv_id, f.hendelse_id, 'frigivelse_avvist');
    return { status: f.status };
  });

  ruter.add('GET', '/api/admin/logg', ({ ctx }) => {
    krevAdmin(ctx);
    return medBruker(ctx, async (c) => {
      const rader = (await c.query(
        `SELECT id, tid, bruker_id, rolle, hvelv_id, hendelse, detaljer
           FROM revisjon ORDER BY id DESC LIMIT 200`)).rows;
      return { logg: rader };
    });
  });
}
