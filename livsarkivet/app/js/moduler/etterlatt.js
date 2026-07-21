// Etterlattevisningen: rolig, praktisk først. Ingen dashbord-støy.
import { kall } from '../api.js';
import { el, tom, KATEGORI_NAVN } from '../dom.js';

export async function vis(rot) {
  tom(rot);
  const svar = await kall('GET', '/api/etterlatt');
  const elementer = svar.data.elementer || [];

  const eiere = [...new Set(elementer.map((e) => e.eier_navn))];
  rot.append(
    el('h1', {}, 'Til deg'),
    el('p', { class: 'undertekst' }, eiere.length
      ? `${eiere.join(' og ')} har sørget for at du skulle få dette. Ta det i ditt tempo.`
      : 'Ingenting er frigitt til deg.'));

  let forrigeKategori = null;
  for (const e of elementer) {
    if (e.kategori !== forrigeKategori) {
      rot.append(el('h2', {}, KATEGORI_NAVN[e.kategori] || e.kategori));
      forrigeKategori = e.kategori;
    }
    const detalj = el('div', { hidden: true },
      el('p', { style: 'white-space:pre-wrap; margin-top:8px' }, ''));
    const kort = el('div', { class: 'kort' },
      el('div', { class: 'rad' },
        el('div', {}, el('h3', {}, e.tittel), el('div', { class: 'meta' }, `Fra ${e.eier_navn}`)),
        el('button', { class: 'liten sekundaer', onclick: async (hendelse) => {
          if (detalj.hidden) {
            const en = await kall('GET', `/api/etterlatt/elementer/${e.id}`);
            detalj.querySelector('p').textContent = en.data.element?.innhold || '';
            detalj.hidden = false;
            hendelse.target.textContent = 'Lukk';
          } else {
            detalj.hidden = true;
            hendelse.target.textContent = 'Åpne';
          }
        } }, 'Åpne')),
      detalj);
    rot.append(kort);
  }
}
