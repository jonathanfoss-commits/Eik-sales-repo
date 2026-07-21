// Eierens hvelv: elementer per kategori, opprett/endre/slett.
import { kall } from '../api.js';
import { el, tom, feilboks, KATEGORI_NAVN } from '../dom.js';

export async function vis(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Hvelvet ditt'),
    el('p', { class: 'undertekst' },
      'Det dine nærmeste vil trenge. Ingenting deles før en verifisert hendelse og karenstid.'));

  const svar = await kall('GET', '/api/hvelv');
  const elementer = svar.data.elementer || [];
  const liste = el('div', {});
  rot.append(liste);

  function tegnListe() {
    tom(liste);
    if (!elementer.length) {
      liste.append(el('div', { class: 'kort' },
        el('h3', {}, 'Tomt ennå'),
        el('p', { class: 'meta' }, 'Start med det praktiske: strøm, forsikring, hvor viktige papirer ligger.')));
    }
    let forrigeKategori = null;
    for (const e of elementer) {
      if (e.kategori !== forrigeKategori) {
        liste.append(el('h2', {}, KATEGORI_NAVN[e.kategori] || e.kategori));
        forrigeKategori = e.kategori;
      }
      liste.append(el('div', { class: 'kort' },
        el('div', { class: 'rad' },
          el('div', {}, el('h3', {}, e.tittel),
            el('div', { class: 'meta' }, `nivå: ${e.nivaa}`)),
          el('button', { class: 'liten sekundaer', onclick: () => tegnSkjema(e) }, 'Endre'))));
    }
  }

  const skjemaBoks = el('div', {});
  rot.append(skjemaBoks);

  function tegnSkjema(eksisterende) {
    tom(skjemaBoks);
    const e = eksisterende || {};
    const kategori = el('select', {},
      ...Object.entries(KATEGORI_NAVN).map(([verdi, navn]) =>
        el('option', { value: verdi, selected: e.kategori === verdi }, navn)));
    const nivaa = el('select', {},
      el('option', { value: 'privat', selected: e.nivaa !== 'delt' }, 'Privat'),
      el('option', { value: 'delt', selected: e.nivaa === 'delt' }, 'Delt'),
      el('option', { value: 'sensitiv', disabled: true }, 'Sensitiv (kommer snart — krypteres)'));
    const tittel = el('input', { type: 'text', placeholder: 'Tittel', value: e.tittel || '' });
    const innholdFelt = el('textarea', { placeholder: 'Det de trenger å vite …' });
    innholdFelt.value = e.innhold || '';
    const feilRom = el('div', {});

    skjemaBoks.append(el('div', { class: 'kort' },
      el('h3', {}, e.id ? 'Endre element' : 'Nytt element'),
      feilRom,
      el('label', {}, 'Kategori'), kategori,
      el('label', {}, 'Nivå'), nivaa,
      tittel, innholdFelt,
      el('button', { onclick: async () => {
        const kropp = { kategori: kategori.value, nivaa: nivaa.value,
          tittel: tittel.value, innhold: innholdFelt.value };
        const svar = e.id
          ? await kall('PUT', `/api/elementer/${e.id}`, { ...kropp, versjon: e.versjon })
          : await kall('POST', '/api/elementer', kropp);
        if (!svar.ok) { tom(feilRom); feilRom.append(feilboks(svar.data.feil || 'Lagring feilet')); return; }
        vis(rot);
      } }, 'Lagre'),
      e.id ? el('button', { class: 'fare', onclick: async () => {
        if (!confirm('Slette elementet?')) return;
        await kall('DELETE', `/api/elementer/${e.id}`);
        vis(rot);
      } }, 'Slett') : null,
      el('button', { class: 'sekundaer', onclick: () => { tom(skjemaBoks); tegnNyKnapp(); } }, 'Avbryt')));
  }

  const nyKnappBoks = el('div', {});
  rot.append(nyKnappBoks);
  function tegnNyKnapp() {
    tom(nyKnappBoks);
    nyKnappBoks.append(el('button', { onclick: () => { tegnSkjema(); tom(nyKnappBoks); } },
      '+ Legg til element'));
  }

  tegnListe();
  tegnNyKnapp();
}
