// Tilstandsmaskinen for frigivelse — hjertet i Livsarkivet.
//
//  meldt → attest_lastet_opp → under_verifisering ─┬→ avvist
//                                                  └→ godkjent_1 → karenstid ─┬→ blokkert
//  meldt/attest_lastet_opp/under_verifisering → tilbakekalt                   └→ frigitt
//
// Den rene delen (overgangstabell, vakter, utløp) tar tiden som parameter og
// rører aldri databasen — 100 % dekket av tests/frigivelse.test.js.
// Persistensdelen (utfoerOvergang) skriver med optimistisk lås og logger til
// revisjon i samme transaksjon.
//
// Ufravikelig prinsipp 1: ingen frigivelse uten verifisert hendelse + karenstid.
// Fire-øyne: to ULIKE admin-er må godkjenne (app-sjekk her + CHECK i databasen).
import { ApiFeil } from './http.js';
import { loggRevisjon } from './revisjon.js';

// Aktører: 'kontakt' = betrodd kontakt i hvelvet, 'melder' = kontakten som
// meldte hendelsen, 'admin' = saksbehandler, 'eier' = hvelveieren,
// 'system' = serverens egne overganger (autoframdrift og karenstid-utløp).
export const AKTORER = ['kontakt', 'melder', 'admin', 'eier', 'system'];

export const OVERGANGER = {
  meldt:              { attest_lastet_opp: ['kontakt'], tilbakekalt: ['melder'] },
  attest_lastet_opp:  { under_verifisering: ['system'], tilbakekalt: ['melder'] },
  under_verifisering: { godkjent_1: ['admin'], avvist: ['admin'], tilbakekalt: ['melder'] },
  godkjent_1:         { karenstid: ['admin'], avvist: ['admin'] },
  karenstid:          { blokkert: ['eier'], frigitt: ['system'] },
  frigitt:            {},   // terminal
  avvist:             {},   // terminal
  blokkert:           {},   // terminal
  tilbakekalt:        {},   // terminal
};

export const TILSTANDER = Object.keys(OVERGANGER);
export const TERMINALE = TILSTANDER.filter((t) => !Object.keys(OVERGANGER[t]).length);

export function kanGaa(fra, til, aktor) {
  return Boolean(OVERGANGER[fra]?.[til]?.includes(aktor));
}

// Fire-øyne: annen godkjenner må være en ANNEN admin enn den første.
export function fireOyneOk(godkjent1Av, godkjent2Av) {
  return Boolean(godkjent1Av && godkjent2Av) && godkjent1Av !== godkjent2Av;
}

// To-kilde-regelen [JONATHAN]: attest kreves alltid. Har hvelvet to eller
// flere betrodde kontakter, kreves i tillegg bekreftelse fra en annen enn
// melderen. Med bare én betrodd kontakt er attesten + menneskelig fire-øyne-
// kontroll den uavhengige kilden.
export function klarForVerifisering({ harAttest, antallBetrodde, harUavhengigBekreftelse }) {
  if (!harAttest) return false;
  return antallBetrodde < 2 || Boolean(harUavhengigBekreftelse);
}

// Karenstid-utløp. `naa` injiseres — funksjonen leser aldri klokka selv.
export function erUtlopt(frigivelse, naa) {
  return frigivelse.status === 'karenstid'
    && Boolean(frigivelse.karenstid_slutt)
    && naa.getTime() >= new Date(frigivelse.karenstid_slutt).getTime();
}

// ── Persistens: én overgang = én betinget UPDATE + revisjonsrad, samme
// transaksjon. WHERE på status + versjon gjør kappløp umulige (0 rader → 409).
export async function utfoerOvergang(c, ctx, frigivelse, til, aktor, felter = {}) {
  if (!kanGaa(frigivelse.status, til, aktor)) {
    throw new ApiFeil(409, `Kan ikke gå fra ${frigivelse.status} til ${til}`);
  }
  const kolonner = ['status = $3', 'versjon = versjon + 1'];
  const verdier = [frigivelse.id, frigivelse.versjon, til];
  for (const [kolonne, verdi] of Object.entries(felter)) {
    verdier.push(verdi);
    kolonner.push(`${kolonne} = $${verdier.length}`);
  }
  const oppdatert = (await c.query(
    `UPDATE frigivelser SET ${kolonner.join(', ')}
      WHERE id = $1 AND versjon = $2 AND status = '${frigivelse.status}'
      RETURNING *`, verdier)).rows[0];
  if (!oppdatert) throw new ApiFeil(409, 'Frigivelsen er endret i mellomtiden — prøv igjen');
  await loggRevisjon(c, ctx, frigivelse.hvelv_id, 'frigivelse_' + til,
    { frigivelse_id: frigivelse.id, fra: frigivelse.status, aktor });
  return oppdatert;
}
