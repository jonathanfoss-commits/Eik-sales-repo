// Etterlattevisningen: rolig, praktisk først. Ingen dashbord-støy.
import { kall } from '../api.js';
import { el, tom, KATEGORI_NAVN } from '../dom.js';
import { aapneSomMottaker } from '../krypto.js';

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
        el('button', { class: 'liten stille', onclick: async (hendelse) => {
          if (detalj.hidden) {
            const en = await kall('GET', `/api/etterlatt/elementer/${e.id}`);
            let tekst = en.data.element?.innhold || '';
            // sensitivt: dekrypter her, med mottakerens egen frase
            if (en.data.element?.kryptert) {
              const min = await kall('GET', '/api/krypto/min-nokkel');
              const frase = min.data.finnes ? prompt('Sikkerhetsfrasen din:') : null;
              if (!frase) { tekst = 'Krever sikkerhetsfrasen din for å åpnes.'; }
              else {
                try {
                  tekst = await aapneSomMottaker(frase, min.data.nokkel,
                    en.data.element.nokkel_deponi, en.data.element.innhold);
                } catch { tekst = 'Kunne ikke låse opp — feil frase?'; }
              }
            }
            detalj.querySelector('p').textContent = tekst;
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

  if (elementer.length) rot.append(offentligHjelp());
}

// Staten har allerede bygget den økonomiske oversikten: Digitalt dødsbo
// (Digdir/Kartverket, juni 2025) henter bank, eiendom, kjøretøy, gjeld,
// forsikring og pensjon automatisk fra autoritative kilder. Vi har ikke de
// kildene og får dem ikke. Å tie om det ville latt en etterlatt lete etter
// noe de kunne fått utlevert gratis samme dag.
function offentligHjelp() {
  return el('div', { class: 'kort offentlig' },
    el('h3', {}, 'Dette trenger du ikke lete etter'),
    el('p', { class: 'meta' },
      'Bankkontoer, eiendom, kjøretøy, gjeld, forsikring og pensjon kommer '
      + 'automatisk gjennom Digitalt dødsbo når tingretten har gitt deg tilgang '
      + 'som arving. Du får varsel, og finner oversikten i Altinn.'),
    el('a', { class: 'lenke-ut', href: 'https://www.altinn.no', target: '_blank',
      rel: 'noopener noreferrer' }, 'Åpne Altinn'));
}
