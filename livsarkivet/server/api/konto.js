// Dataportabilitet og sletterett (GDPR art. 15, 17 og 20).
//
// Eksporten inneholder ALT eieren har lagt inn — også sensitivt innhold som
// chiffertekst SAMMEN MED de frasepakkede nøklene. Dermed er eksporten
// virkelig portabel: eieren kan dekryptere den utenfor tjenesten med sin egen
// sikkerhetsfrase. Vi kan fortsatt ikke lese den.
import { ApiFeil } from '../http.js';
import { medBruker, authPool } from '../db.js';
import { sjekkPassord } from '../auth.js';
import { sendEpost } from '../epost.js';
import { mittHvelv } from './hvelv.js';

export function registrer(ruter) {
  ruter.add('GET', '/api/eksport', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const en = async (sql, params = []) => (await c.query(sql, params)).rows;

    const eksport = {
      format: 'livsarkivet-eksport/1',
      tidspunkt: new Date().toISOString(),
      om: 'Alt du har lagt inn i Livsarkivet. Sensitivt innhold er kryptert; '
        + 'nøklene under er pakket med din sikkerhetsfrase, slik at du kan '
        + 'dekryptere innholdet selv — uten oss.',
      bruker: (await en(
        'SELECT id, navn, epost, telefon, opprettet FROM brukere WHERE id = $1',
        [ctx.brukerId]))[0],
      elementer: await en(
        `SELECT id, kategori, nivaa, tittel, innhold, kryptert, nokkel_ref,
                opprettet, endret
           FROM hvelv_elementer WHERE hvelv_id = $1 ORDER BY kategori, opprettet`,
        [hvelv.id]),
      kontakter: await en(
        `SELECT id, navn, epost, telefon, relasjon, er_betrodd, opprettet
           FROM kontakter WHERE hvelv_id = $1 ORDER BY opprettet`, [hvelv.id]),
      mottakermatrise: await en(
        `SELECT m.id, m.element_id, m.kontakt_id, m.hendelse_type, m.opprettet
           FROM mottakermatrise m
           JOIN hvelv_elementer e ON e.id = m.element_id
          WHERE e.hvelv_id = $1`, [hvelv.id]),
      hendelser: await en(
        `SELECT id, type, kilde, opprettet FROM hendelser
          WHERE hvelv_id = $1 ORDER BY opprettet`, [hvelv.id]),
      frigivelser: await en(
        `SELECT id, hendelse_id, status, karenstid_start, karenstid_slutt,
                avvist_grunn, blokkert_grunn, frigitt_tid, opprettet
           FROM frigivelser WHERE hvelv_id = $1 ORDER BY opprettet`, [hvelv.id]),
      // nøkkelmateriale: frasepakket, aldri i klartekst
      kryptonokler: (await en(
        `SELECT salt, iterasjoner, hvelvnokkel_pakket, gjenoppretting_pakket,
                gjenoppretting_del_b
           FROM hvelv_kryptonokler WHERE hvelv_id = $1`, [hvelv.id]))[0] || null,
      mitt_nokkelpar: (await en(
        `SELECT offentlig, salt, iterasjoner, privat_pakket
           FROM bruker_nokler WHERE bruker_id = $1`, [ctx.brukerId]))[0] || null,
      revisjonslogg: await en(
        `SELECT tid, rolle, hendelse, detaljer FROM revisjon
          WHERE hvelv_id = $1 ORDER BY id`, [hvelv.id]),
      abonnement: (await en(
        `SELECT status, proveperiode_slutt, periode_slutt FROM abonnementer
          WHERE bruker_id = $1`, [ctx.brukerId]))[0] || null,
    };

    return { _fil: {
      filnavn: 'livsarkivet-eksport.json',
      mime: 'application/json; charset=utf-8',
      nedlasting: true,
      innhold: Buffer.from(JSON.stringify(eksport, null, 2), 'utf8'),
    } };
  }));

  // Sletting krever passordet på nytt: den er uopprettelig, og fjerner også
  // det de etterlatte skulle fått.
  ruter.add('POST', '/api/konto/slett', async ({ ctx, body }) => {
    const rad = (await authPool.query(
      'SELECT passord_hash FROM brukere WHERE id = $1', [ctx.brukerId])).rows[0];
    if (!rad || !(await sjekkPassord(String(body.passord || ''), rad.passord_hash))) {
      throw new ApiFeil(401, 'Feil passord — kontoen er ikke slettet');
    }

    // hent adressene FØR slettingen; varslingsradene forsvinner med hvelvet
    const mottakere = await medBruker(ctx, async (c) => {
      const hvelv = (await c.query(
        'SELECT id FROM hvelv WHERE eier_id = $1', [ctx.brukerId])).rows[0];
      if (!hvelv) return [];
      return (await c.query(
        'SELECT navn, epost FROM kontakter WHERE hvelv_id = $1', [hvelv.id])).rows;
    });

    await medBruker(ctx, (c) => c.query('SELECT slett_konto()'));

    // best effort, etter slettingen: de som var registrert bør vite at arkivet
    // er borte, slik at ingen venter på noe som ikke finnes
    for (const m of mottakere) {
      await sendEpost({
        til: m.epost,
        emne: 'Et livsarkiv du var tilknyttet, er slettet',
        tekst: `Hei ${m.navn}!\n\nEt livsarkiv du var registrert som kontakt i, `
          + `er slettet av eieren. Du har ikke lenger noen oppgave eller tilgang der.\n\n`
          + `Du trenger ikke gjøre noe.`,
      });
    }
    return { ok: true };
  });
}
