// Varsling ved frigivelsesforsøk (ufravikelig prinsipp: ved ENHVER hendelse i
// frigivelsesløpet varsles eieren og ALLE registrerte kontakter).
//
// Kjøres i egen system-transaksjon ETTER at hovedtransaksjonen er committet:
// den som melder ser bare sin egen kontaktrad, men varselet skal nå alle.
// Radene i varslinger er fasit; e-post er best effort.
import { medBruker } from './db.js';
import { sendEpost } from './epost.js';

const TEKSTER = {
  hendelse_meldt: 'Et dødsfall er meldt for et livsarkiv du er tilknyttet. Er dette feil, logg inn og si fra umiddelbart.',
  karenstid_startet: 'En frigivelse er godkjent og karenstiden løper. Eieren kan stoppe den ved å logge inn.',
  frigivelse_frigitt: 'Et livsarkiv du er mottaker i, er frigitt. Logg inn for å se det som er delt med deg.',
  frigivelse_avvist: 'Meldingen om dødsfall ble avvist av saksbehandler.',
  frigivelse_blokkert: 'Eieren har stoppet frigivelsen. Arkivet forblir lukket.',
  frigivelse_tilbakekalt: 'Meldingen om dødsfall er trukket tilbake av melderen.',
};

export async function varsleAlle(hvelvId, hendelseId, type) {
  await medBruker({ rolle: 'system' }, async (c) => {
    const eier = (await c.query(
      `SELECT b.id, b.epost FROM hvelv h JOIN brukere b ON b.id = h.eier_id WHERE h.id = $1`,
      [hvelvId])).rows[0];
    const kontakter = (await c.query(
      'SELECT id, epost FROM kontakter WHERE hvelv_id = $1', [hvelvId])).rows;

    const mottakere = [
      ...(eier ? [{ brukerId: eier.id, kontaktId: null, epost: eier.epost }] : []),
      ...kontakter.map((k) => ({ brukerId: null, kontaktId: k.id, epost: k.epost })),
    ];
    for (const m of mottakere) {
      await c.query(
        `INSERT INTO varslinger (hvelv_id, hendelse_id, kontakt_id, bruker_id, kanal, type)
         VALUES ($1, $2, $3, $4, 'epost', $5)`,
        [hvelvId, hendelseId, m.kontaktId, m.brukerId, type]);
    }
    // e-post best effort — utenfor fasiten, aldri innhold utover standardtekst
    for (const m of mottakere) {
      const ok = await sendEpost({ til: m.epost, emne: 'Varsel fra Livsarkivet',
        tekst: TEKSTER[type] || 'Det har skjedd noe i et livsarkiv du er tilknyttet. Logg inn for detaljer.' });
      if (ok) {
        await c.query(
          `UPDATE varslinger SET sendt_tid = now()
            WHERE hendelse_id = $1 AND type = $2
              AND kontakt_id IS NOT DISTINCT FROM $3 AND bruker_id IS NOT DISTINCT FROM $4`,
          [hendelseId, type, m.kontaktId, m.brukerId]);
      }
    }
  });
}
