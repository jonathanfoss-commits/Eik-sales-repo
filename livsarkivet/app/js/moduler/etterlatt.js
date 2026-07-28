// Etterlattevisningen: rolig, praktisk først. Ingen dashbord-støy.
import { kall } from '../api.js';
import { el, tom, KATEGORI_NAVN } from '../dom.js';
import { sidetopp, kort as lagKort, knapp, tomtilstand, feilboks,
  medTilstand } from '../komponenter.js';
import { aapneSomMottaker } from '../krypto.js';

export async function vis(rot) {
  tom(rot);
  await medTilstand(rot,
    async () => {
      const svar = await kall('GET', '/api/etterlatt');
      if (!svar.ok) throw new Error('Vi fikk ikke hentet det som er frigitt til deg.');
      return svar.data.elementer || [];
    },
    (plass, elementer) => {
      const eiere = [...new Set(elementer.map((e) => e.eier_navn))];
      plass.append(sidetopp({
        tittel: 'Til deg',
        undertekst: eiere.length
          ? `${eiere.join(' og ')} har sørget for at du skulle få dette. Ta det i ditt tempo.`
          : null }));

      if (!elementer.length) {
        plass.append(tomtilstand({
          tittel: 'Ingenting er frigitt til deg ennå',
          tekst: 'Når noe blir frigitt, finner du det her. Du trenger ikke gjøre '
            + 'noe i mellomtiden.' }));
        return;
      }

      plass.append(forstSteg());
      let forrigeKategori = null;
      for (const e of elementer) {
        if (e.kategori !== forrigeKategori) {
          plass.append(el('h2', {}, KATEGORI_NAVN[e.kategori] || e.kategori));
          forrigeKategori = e.kategori;
        }
        plass.append(tegnElement(e));
      }
      plass.append(offentligHjelp());
    }, { linjer: 4 });
}

function tegnElement(e) {
  const tekstRom = el('p', { class: 'frigitt-tekst' });
  const detalj = el('div', { hidden: true }, tekstRom);
  const aapne = knapp({ tekst: 'Åpne', rolle: 'stille', storrelse: 'liten',
    onclick: async () => {
      if (!detalj.hidden) {
        detalj.hidden = true;
        aapne.querySelector('span').textContent = 'Åpne';
        aapne.setAttribute('aria-expanded', 'false');
        return;
      }
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
      tekstRom.textContent = tekst;
      detalj.hidden = false;
      aapne.querySelector('span').textContent = 'Lukk';
      aapne.setAttribute('aria-expanded', 'true');
    } });
  aapne.setAttribute('aria-expanded', 'false');
  const kort = lagKort({ tittel: e.tittel, meta: `Fra ${e.eier_navn}`, merke: aapne });
  kort.append(detalj);
  return kort;
}

// Én ting om gangen.
//
// Konkurrentene viser hele lista. For et menneske i de første ukene er 40
// punkter en grunn til å lukke appen, ikke en plan. Vi viser den ene tingen som
// haster nå, og holder resten skjult til den er gjort. Rekkefølgen er det
// vanskelige her — den er redaksjonell kunnskap om norsk dødsbo, ikke kode.
//
// Merk hva som IKKE står her: alt staten allerede gjør. Bank, eiendom, gjeld og
// pensjon kommer gjennom Digitalt dødsbo, og står i kortet lenger nede.
const FORST = [
  ['Det første døgnet', 'Varsle de nærmeste. Sjekk om det er kjæledyr som må tas hånd om, og lås boligen.'],
  ['Begravelsesbyrå', 'De tar seg av det meste av det formelle de første dagene, og kan vente med det økonomiske.'],
  ['Skifteattest fra tingretten', 'Den trenger du før banker og offentlige instanser vil snakke med deg. Søk tidlig — den tar tid.'],
  ['Faste trekk og abonnementer', 'Se etter det under «Praktisk» nedenfor. Ikke hastverk, men de fortsetter å trekke.'],
  ['Digitale kontoer', 'Se instruksene nedenfor. Noe må gjøres innen en frist, annet kan vente.'],
];

function forstSteg() {
  const nokkel = 'livsarkivet:etterlatt-steg';
  const naa = () => Math.min(Number(localStorage.getItem(nokkel) || 0), FORST.length);
  const boks = el('div', { class: 'forst' });

  const tegn = () => {
    tom(boks);
    const i = naa();
    if (i >= FORST.length) {
      boks.append(
        el('div', { class: 'mono' }, 'Det som haster'),
        el('p', { class: 'forst-tekst' }, 'Du har vært gjennom det som haster. '
          + 'Resten kan du ta når du orker.'),
        el('button', { class: 'liten stille', onclick: () => {
          localStorage.removeItem(nokkel); tegn();
        } }, 'Vis fra begynnelsen igjen'));
      return;
    }
    const [tittel, tekst] = FORST[i];
    boks.append(
      el('div', { class: 'mono' }, `Det som haster · ${i + 1} av ${FORST.length}`),
      el('h2', { class: 'forst-tittel' }, tittel),
      el('p', { class: 'forst-tekst' }, tekst),
      el('button', { class: 'liten stille', onclick: () => {
        localStorage.setItem(nokkel, String(i + 1)); tegn();
      } }, 'Dette er gjort'));
  };

  tegn();
  return boks;
}

// Staten har allerede bygget den økonomiske oversikten: Digitalt dødsbo
// (Digdir/Kartverket, juni 2025) henter bank, eiendom, kjøretøy, gjeld,
// forsikring og pensjon automatisk fra autoritative kilder. Vi har ikke de
// kildene og får dem ikke. Å tie om det ville latt en etterlatt lete etter
// noe de kunne fått utlevert gratis samme dag.
function offentligHjelp() {
  const k = lagKort({ tittel: 'Dette trenger du ikke lete etter' },
    el('p', { class: 'kort-meta' },
      'Bankkontoer, eiendom, kjøretøy, gjeld, forsikring og pensjon kommer '
      + 'automatisk gjennom Digitalt dødsbo når tingretten har gitt deg tilgang '
      + 'som arving. Du får varsel, og finner oversikten i Altinn.'),
    el('a', { class: 'lenke-ut', href: 'https://www.altinn.no', target: '_blank',
      rel: 'noopener noreferrer' }, 'Åpne Altinn ↗'));
  k.classList.add('stiplet');
  return k;
}
