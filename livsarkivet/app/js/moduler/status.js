// Eierens statusside: aktive saker, karenstid-nedtelling og nødbremsen.
import { kall } from '../api.js';
import { el, tom, feilboks, STATUS_NAVN } from '../dom.js';

let nedtellingsUr = null;

export async function vis(rot) {
  tom(rot);
  clearInterval(nedtellingsUr);
  rot.append(el('h1', {}, 'Status'),
    el('p', { class: 'undertekst' },
      'Her ser du om noen har meldt en hendelse for arkivet ditt — og kan stoppe en frigivelse.'));

  const svar = await kall('GET', '/api/status');
  const saker = svar.data.saker || [];
  if (!saker.length) {
    rot.append(el('div', { class: 'kort' },
      el('h3', {}, 'Alt er stille'),
      el('p', { class: 'meta' }, 'Ingen har meldt noen hendelse. Arkivet ditt er lukket.')));
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
      kort.append(
        el('p', {}, 'To saksbehandlere har godkjent meldingen. Arkivet frigis når tiden under når null — med mindre du stopper det.'),
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
        teller.textContent = `${t} t ${String(m).padStart(2, '0')} m ${String(s).padStart(2, '0')} s`;
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
    rot.append(kort);
  }
}
