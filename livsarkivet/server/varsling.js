// Varsling ved ethvert frigivelsesforsøk (ufravikelig prinsipp): eieren OG
// alle registrerte kontakter varsles.
//
// Holdbarhet (nivå 6): radene legges i kø INNENFOR tilstandsendringens
// transaksjon via ko_varsler() — enten skjer begge, eller ingen. Utsending er
// en separat, gjentakbar passering over rader med sendt_tid IS NULL, så en
// krasj under e-postsending aldri mister et varsel. Radene i varslinger er
// fasit; e-post er best effort.
import { medBruker } from './db.js';
import { sendEpost, epostTilgjengelig } from './epost.js';

const TEKSTER = {
  hendelse_meldt: 'Et dødsfall er meldt for et livsarkiv du er tilknyttet. Er dette feil, logg inn og si fra umiddelbart.',
  karenstid_startet: 'En frigivelse er godkjent og karenstiden løper. Eieren kan stoppe den ved å logge inn.',
  frigivelse_frigitt: 'Et livsarkiv du er mottaker i, er frigitt. Logg inn for å se det som er delt med deg.',
  frigivelse_avvist: 'Meldingen om dødsfall ble avvist av saksbehandler.',
  frigivelse_blokkert: 'Eieren har stoppet frigivelsen. Arkivet forblir lukket.',
  frigivelse_tilbakekalt: 'Meldingen om dødsfall er trukket tilbake av melderen.',
};

// Kalles med kallerens klient, inne i tilstandsendringens transaksjon.
export async function koVarsler(c, hvelvId, hendelseId, type) {
  const rad = (await c.query('SELECT ko_varsler($1, $2, $3) AS antall',
    [hvelvId, hendelseId, type])).rows[0];
  return Number(rad.antall);
}

// Best-effort utsending av alt som ligger i kø. Trygg å kalle når som helst og
// så ofte man vil — den plukker bare opp usendte rader.
export async function sendUtestaaende(maks = 200) {
  // Er transporten ikke satt opp (eller nede), lar vi køen ligge urørt —
  // radene er fasit og sendes ved en senere passering.
  if (!epostTilgjengelig()) return 0;
  const koe = await medBruker({ rolle: 'system' }, async (c) =>
    (await c.query('SELECT * FROM usendte_varsler($1)', [maks])).rows);
  let sendt = 0;
  for (const varsel of koe) {
    const ok = await sendEpost({
      til: varsel.epost,
      emne: 'Varsel fra Livsarkivet',
      tekst: TEKSTER[varsel.type]
        || 'Det har skjedd noe i et livsarkiv du er tilknyttet. Logg inn for detaljer.',
    });
    if (!ok) continue;   // blir liggende i kø til neste passering
    await medBruker({ rolle: 'system' }, (c) => c.query(
      'UPDATE varslinger SET sendt_tid = now() WHERE id = $1', [varsel.id]));
    sendt++;
  }
  return sendt;
}
