// Kontakter og mottakere: eierens register, betrodd-flagg og invitasjoner.
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';
import { loggRevisjon } from '../revisjon.js';
import { krevAktivtAbonnement } from './abonnement.js';
import { lagInvitasjonskode, hashInvitasjonskode } from '../auth.js';
import { sendEpost } from '../epost.js';
import { mittHvelv } from './hvelv.js';

const FELTER = 'id, navn, epost, telefon, relasjon, er_betrodd, bruker_id IS NOT NULL AS koblet, versjon, opprettet';

export function registrer(ruter) {
  ruter.add('GET', '/api/kontakter', ({ ctx }) => medBruker(ctx, async (c) => {
    const hvelv = await mittHvelv(c, ctx);
    const kontakter = (await c.query(
      `SELECT ${FELTER} FROM kontakter WHERE hvelv_id = $1 ORDER BY opprettet`, [hvelv.id])).rows;
    return { kontakter };
  }));

  ruter.add('POST', '/api/kontakter', ({ ctx, body }) => medBruker(ctx, async (c) => {
    const { navn, epost, telefon = null, relasjon = null, erBetrodd = false } = body;
    if (!navn || !epost) throw new ApiFeil(400, 'Navn og e-post må fylles ut');
    await krevAktivtAbonnement(c, ctx);
    const hvelv = await mittHvelv(c, ctx);
    let rad;
    try {
      rad = (await c.query(
        `INSERT INTO kontakter (hvelv_id, navn, epost, telefon, relasjon, er_betrodd)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${FELTER}`,
        [hvelv.id, String(navn).trim(), String(epost).trim().toLowerCase(),
          telefon, relasjon, Boolean(erBetrodd)])).rows[0];
    } catch (feil) {
      if (feil.code === '23505') throw new ApiFeil(400, 'Kontakten er alt registrert');
      throw feil;
    }
    await loggRevisjon(c, ctx, hvelv.id, 'kontakt_opprettet',
      { kontakt_id: rad.id, er_betrodd: rad.er_betrodd });
    return { kontakt: rad };
  }));

  ruter.add('PUT', '/api/kontakter/:id', ({ ctx, body, params }) => medBruker(ctx, async (c) => {
    const { navn, epost, telefon, relasjon, erBetrodd, versjon } = body;
    await krevAktivtAbonnement(c, ctx);
    let rad;
    try {
      rad = (await c.query(
        `UPDATE kontakter
            SET navn = COALESCE($3, navn), epost = COALESCE(lower($4), epost),
                telefon = COALESCE($5, telefon), relasjon = COALESCE($6, relasjon),
                er_betrodd = COALESCE($7, er_betrodd), versjon = versjon + 1
          WHERE id = $1 AND versjon = $2 RETURNING ${FELTER}, hvelv_id`,
        [params.id, Number(versjon), navn, epost, telefon, relasjon,
          typeof erBetrodd === 'boolean' ? erBetrodd : null])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke kontakten');
      throw feil;
    }
    if (!rad) {
      const gjeldende = (await c.query(
        `SELECT ${FELTER} FROM kontakter WHERE id = $1`, [params.id])).rows[0];
      if (!gjeldende) throw new ApiFeil(404, 'Fant ikke kontakten');
      const feil = new ApiFeil(409, 'Kontakten er endret i mellomtiden');
      feil.data = { kontakt: gjeldende };
      throw feil;
    }
    await loggRevisjon(c, ctx, rad.hvelv_id, 'kontakt_endret',
      { kontakt_id: rad.id, er_betrodd: rad.er_betrodd });
    delete rad.hvelv_id;
    return { kontakt: rad };
  }));

  ruter.add('DELETE', '/api/kontakter/:id', ({ ctx, params }) => medBruker(ctx, async (c) => {
    await krevAktivtAbonnement(c, ctx);
    let slettet;
    try {
      slettet = (await c.query(
        'DELETE FROM kontakter WHERE id = $1 RETURNING id, hvelv_id', [params.id])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke kontakten');
      throw feil;
    }
    if (!slettet) throw new ApiFeil(404, 'Fant ikke kontakten');
    await loggRevisjon(c, ctx, slettet.hvelv_id, 'kontakt_slettet', { kontakt_id: slettet.id });
    return { ok: true };
  }));

  // Invitasjon: koden vises ÉN gang (og sendes best-effort på e-post) — kun
  // hashen lagres. Kontakten bruker den til å koble seg til hvelvet.
  ruter.add('POST', '/api/kontakter/:id/invitasjon', ({ ctx, params }) => medBruker(ctx, async (c) => {
    await krevAktivtAbonnement(c, ctx);
    let kontakt;
    try {
      kontakt = (await c.query(
        'SELECT id, hvelv_id, navn, epost FROM kontakter WHERE id = $1', [params.id])).rows[0];
    } catch (feil) {
      if (feil.code === '22P02') throw new ApiFeil(404, 'Fant ikke kontakten');
      throw feil;
    }
    if (!kontakt) throw new ApiFeil(404, 'Fant ikke kontakten');
    const kode = lagInvitasjonskode();
    await c.query(
      `INSERT INTO invitasjoner (kontakt_id, epost, kode_hash, utloper)
       VALUES ($1, $2, $3, now() + interval '14 days')`,
      [kontakt.id, kontakt.epost, hashInvitasjonskode(kode)]);
    await loggRevisjon(c, ctx, kontakt.hvelv_id, 'kontakt_invitert', { kontakt_id: kontakt.id });
    await sendEpost({
      til: kontakt.epost,
      emne: 'Du er lagt til som kontakt i Livsarkivet',
      tekst: `Hei ${kontakt.navn}!\n\nDu er lagt til som kontakt i et livsarkiv.\n` +
        `Kode: ${kode}\n\nÅpne Livsarkivet → «Har du fått en kode?» og skriv den inn.\n` +
        `Koden varer i 14 dager.`,
    });
    return { kode };
  }));
}
