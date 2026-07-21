// Vaktagenten: misbruksvern på meldte hendelser. BEVISST regelbasert —
// anomaliflagg skal være deterministiske, forklarbare og testbare, ikke
// modellvurderinger. (Musk steg 3: ikke bruk AI der regler holder.)
import { medBruker } from '../db.js';

// Vurderer en sak og returnerer { flagg: [...], risiko } — råd, aldri vedtak.
export async function vurder(frigivelseId) {
  return medBruker({ rolle: 'system' }, async (c) => {
    const sak = (await c.query(
      `SELECT f.id, f.hvelv_id, f.opprettet AS meldt_tid, h.id AS hendelse_id,
              h.meldt_av_kontakt_id, k.opprettet AS kontakt_registrert
         FROM frigivelser f
         JOIN hendelser h ON h.id = f.hendelse_id
         LEFT JOIN kontakter k ON k.id = h.meldt_av_kontakt_id
        WHERE f.id = $1`, [frigivelseId])).rows[0];
    if (!sak) return null;

    const flagg = [];

    // 1. Melderen ble registrert som kontakt like før meldingen
    if (sak.kontakt_registrert
        && new Date(sak.meldt_tid) - new Date(sak.kontakt_registrert) < 14 * 86400_000) {
      flagg.push('kontakt_nylig_registrert');
    }

    // 2. Mottakermatrisen eller kontaktene ble endret like før meldingen
    const endringer = Number((await c.query(
      `SELECT count(*) AS n FROM revisjon
        WHERE hvelv_id = $1
          AND hendelse IN ('matrise_lagt_til', 'matrise_fjernet', 'kontakt_opprettet', 'kontakt_endret')
          AND tid BETWEEN $2::timestamptz - interval '7 days' AND $2::timestamptz`,
      [sak.hvelv_id, sak.meldt_tid])).rows[0].n);
    if (endringer > 0) flagg.push('nylige_mottakerendringer');

    // 3. Tidligere avviste/stoppede saker for samme hvelv siste 30 dager
    const tidligere = Number((await c.query(
      `SELECT count(*) AS n FROM frigivelser
        WHERE hvelv_id = $1 AND id <> $2
          AND status IN ('avvist', 'tilbakekalt', 'blokkert')
          AND opprettet > now() - interval '30 days'`,
      [sak.hvelv_id, frigivelseId])).rows[0].n);
    if (tidligere > 0) flagg.push('tidligere_stoppede_saker');

    // 4. Attest lastet opp påfallende raskt etter meldingen (automatikk?)
    const raskAttest = (await c.query(
      `SELECT 1 FROM attester
        WHERE hendelse_id = $1 AND opprettet - $2::timestamptz < interval '30 seconds'
        LIMIT 1`, [sak.hendelse_id, sak.meldt_tid])).rows[0];
    if (raskAttest) flagg.push('attest_paafallende_rask');

    return { flagg, risiko: flagg.length ? 'forhoyet' : 'lav' };
  });
}
