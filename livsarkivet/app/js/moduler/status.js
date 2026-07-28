// Eierens statusside: aktive saker, karenstid-nedtelling og nødbremsen.
import { kall } from '../api.js';
import { el, tom, STATUS_NAVN } from '../dom.js';
import { sidetopp, kort as lagKort, knapp, merkelapp, tomtilstand, feilboks,
  medTilstand } from '../komponenter.js';

let nedtellingsUr = null;

// Frigivelsens gang, vist for eieren. Poenget er ikke å pynte: en eier som
// får vite at noen har meldt dødsfallet hennes, trenger å se nøyaktig hvor
// langt det har kommet og hva som skjer videre — ellers er varselet bare
// skremmende. Rekkefølgen speiler tilstandsmaskinen i server/frigivelse.js.
const STEG = [
  ['meldt', 'Meldt', 'En betrodd kontakt har meldt fra.'],
  ['under_verifisering', 'Dødsattest og kontroll', 'Attest lastet opp og kontrollert mot en uavhengig kilde.'],
  ['godkjent_2', 'To saksbehandlere', 'Fire øyne: to ulike mennesker må godkjenne hver for seg.'],
  ['karenstid', 'Karenstid', '48 timer der du kan stoppe alt selv.'],
  ['frigitt', 'Frigivelse', 'Bare de du har pekt ut får se det du har valgt til dem.'],
];
// Hvor langt saken faktisk er kommet. Terminaltilstandene (avvist, blokkert,
// tilbakekalt) har ingen «neste steg» — da vises tidslinjen uten aktivt punkt.
const NAADD = {
  meldt: 0, attest_lastet_opp: 1, under_verifisering: 1, godkjent_1: 2,
  godkjent_2: 3, karenstid: 3, frigitt: 4,
};

function tidslinje(status) {
  const naa = NAADD[status];
  const liste = el('ol', { class: 'tidslinje' });
  STEG.forEach(([, navn, om], i) => {
    const klasse = naa === undefined ? '' : i < naa ? 'ferdig' : i === naa ? 'naa' : '';
    liste.append(el('li', { class: klasse },
      el('span', { class: 'prikk' }),
      el('div', {},
        el('div', { class: 'steg-navn' }, navn),
        el('div', { class: 'steg-om' }, om))));
  });
  return liste;
}

export async function vis(rot) {
  tom(rot);
  clearInterval(nedtellingsUr);
  rot.append(sidetopp({ tittel: 'Status',
    undertekst: 'Her ser du om noen har meldt en hendelse for arkivet ditt — '
      + 'og kan stoppe en frigivelse.' }));

  await medTilstand(rot,
    async () => {
      const svar = await kall('GET', '/api/status');
      if (!svar.ok) throw new Error(svar.data?.feil || 'Vi fikk ikke hentet statusen din.');
      return svar.data.saker || [];
    },
    (plass, saker) => {
      if (!saker.length) {
        plass.append(tomtilstand({
          tittel: 'Alt er stille',
          tekst: 'Ingen har meldt noen hendelse. Arkivet ditt er lukket, og '
            + 'ingen har sett noe av det du har lagt inn.' }));
        return;
      }
      const rutenett = el('div', { class: 'rutenett' });
      for (const sak of saker) rutenett.append(tegnSak(sak, rot));
      plass.append(rutenett);
    }, { linjer: 5 });
}

// Tone er tilstand, ikke pynt: en sak i karenstid krever oppmerksomhet nå,
// en stoppet sak gjør det ikke.
function tone(status) {
  if (status === 'karenstid') return 'varsel';
  if (['avvist', 'blokkert', 'tilbakekalt'].includes(status)) return 'fare';
  if (status === 'frigitt') return 'ok';
  return 'noytral';
}

function tegnSak(sak, rot) {
  const t = tone(sak.status);
  const kort = lagKort({
    tittel: 'Melding om dødsfall',
    meta: `Meldt ${new Date(sak.opprettet).toLocaleString('nb-NO')}`,
    tone: t,
    merke: merkelapp({ tekst: STATUS_NAVN[sak.status] || sak.status,
      tone: t === 'noytral' ? 'ok' : t }),
  });
  kort.classList.add('bred');

  if (sak.status === 'karenstid') {
    const teller = el('div', { class: 'nedtelling' }, '…');
    const feilRom = el('div', {});
    // Nedtellingen og nødbremsen står FØRST. Tidslinjen forklarer, men
    // forklaringen skjøv knappen under skjermkanten på 390×844 — og en
    // nødbrems du må bla for å finne, er ingen nødbrems.
    kort.append(
      el('p', {}, 'Arkivet frigis når tiden under når null — med mindre du stopper det.'),
      teller, feilRom,
      knapp({ tekst: 'STOPP FRIGIVELSEN — JEG LEVER', rolle: 'fare', full: true,
        onclick: async () => {
          const stopp = await kall('POST', `/api/hendelser/${sak.hendelse_id}/blokker`,
            { grunn: 'Eier stoppet frigivelsen fra appen' });
          if (!stopp.ok) {
            feilRom.replaceChildren(feilboks({ tekst: stopp.data.feil || 'Kunne ikke stoppe' }));
            return;
          }
          vis(rot);
        } }));
    const slutt = new Date(sak.karenstid_slutt).getTime();
    const tikk = () => {
      const igjen = slutt - Date.now();
      if (igjen <= 0) { teller.textContent = 'Frigitt'; clearInterval(nedtellingsUr); return; }
      const t2 = Math.floor(igjen / 3600_000), m = Math.floor(igjen / 60_000) % 60,
        s2 = Math.floor(igjen / 1000) % 60;
      tom(teller);
      teller.append(
        String(t2), el('span', { class: 'enhet' }, 't'),
        String(m).padStart(2, '0'), el('span', { class: 'enhet' }, 'm'),
        String(s2).padStart(2, '0'), el('span', { class: 'enhet' }, 's'));
    };
    tikk();
    nedtellingsUr = setInterval(tikk, 1000);
  }
  if (sak.status === 'blokkert') kort.append(el('p', { class: 'kort-meta' }, sak.blokkert_grunn || ''));
  if (sak.status === 'avvist') kort.append(el('p', { class: 'kort-meta' }, `Avvist: ${sak.avvist_grunn || ''}`));

  kort.append(el('div', { class: 'gang' },
    el('div', { class: 'mono' }, 'Frigivelsens gang'), tidslinje(sak.status)));
  return kort;
}
