// Eierens statusside: aktive saker, karenstid-nedtelling og nødbremsen.
import { kall } from '../api.js';
import { el, tom, feilboks, STATUS_NAVN } from '../dom.js';

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
  rot.append(el('h1', {}, 'Status'),
    el('p', { class: 'undertekst' },
      'Her ser du om noen har meldt en hendelse for arkivet ditt — og kan stoppe en frigivelse.'));

  const svar = await kall('GET', '/api/status');
  const saker = svar.data.saker || [];
  if (!saker.length) {
    rot.append(el('div', { class: 'tomt' },
      el('strong', {}, 'Alt er stille'),
      'Ingen har meldt noen hendelse. Arkivet ditt er lukket, og ingen '
      + 'har sett noe av det du har lagt inn.'));
    return;
  }

  for (const sak of saker) {
    const kort = el('div', { class: 'kort' });
    const lapp = sak.status === 'karenstid' ? 'varsel'
      : sak.status === 'frigitt' ? 'aktiv'
      : ['avvist', 'blokkert', 'tilbakekalt'].includes(sak.status) ? 'stoppet' : 'aktiv';
    kort.append(el('div', { class: 'rad' },
      el('h3', {}, 'Melding om dødsfall'),
      el('span', { class: `merkelapp ${lapp}` }, STATUS_NAVN[sak.status] || sak.status)));
    kort.append(el('div', { class: 'meta' },
      `Meldt ${new Date(sak.opprettet).toLocaleString('nb-NO')}`));

    if (sak.status === 'karenstid') {
      const teller = el('div', { class: 'nedtelling' }, '…');
      const feilRom = el('div', {});
      // Nedtellingen og nødbremsen står FØRST. Tidslinjen forklarer, men
      // forklaringen skjøv knappen under skjermkanten på 390×844 — og en
      // nødbrems du må bla for å finne, er ingen nødbrems.
      kort.append(
        el('p', {}, 'Arkivet frigis når tiden under når null — med mindre du stopper det.'),
        teller, feilRom,
        el('button', { class: 'fare', onclick: async () => {
          const stopp = await kall('POST', `/api/hendelser/${sak.hendelse_id}/blokker`,
            { grunn: 'Eier stoppet frigivelsen fra appen' });
          if (!stopp.ok) { tom(feilRom); feilRom.append(feilboks(stopp.data.feil || 'Kunne ikke stoppe')); return; }
          vis(rot);
        } }, 'STOPP FRIGIVELSEN — JEG LEVER'));
      const slutt = new Date(sak.karenstid_slutt).getTime();
      const tikk = () => {
        const igjen = slutt - Date.now();
        if (igjen <= 0) { teller.textContent = 'Frigitt'; clearInterval(nedtellingsUr); return; }
        const t = Math.floor(igjen / 3600_000), m = Math.floor(igjen / 60_000) % 60,
          s = Math.floor(igjen / 1000) % 60;
        tom(teller);
        teller.append(
          String(t), el('span', { class: 'enhet' }, 't'),
          String(m).padStart(2, '0'), el('span', { class: 'enhet' }, 'm'),
          String(s).padStart(2, '0'), el('span', { class: 'enhet' }, 's'));
      };
      tikk();
      nedtellingsUr = setInterval(tikk, 1000);
    }
    if (sak.status === 'blokkert') {
      kort.append(el('p', { class: 'meta' }, sak.blokkert_grunn || ''));
    }
    if (sak.status === 'avvist') {
      kort.append(el('p', { class: 'meta' }, `Avvist: ${sak.avvist_grunn || ''}`));
    }
    kort.append(el('div', { class: 'gang' },
      el('div', { class: 'mono' }, 'Frigivelsens gang'), tidslinje(sak.status)));
    rot.append(kort);
  }
}
