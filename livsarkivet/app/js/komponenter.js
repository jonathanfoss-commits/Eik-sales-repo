// Komponentlaget. Kontrakten står i docs/designsystem.md.
//
// Hvorfor ikke et rammeverk: appen er en offline-først PWA uten byggesteg og med
// én produksjonsavhengighet. Designgjelden lå ikke i mangelen på React — den lå i
// at det ikke fantes noe system. Det er dette laget, og det koster null kilobyte
// i nettleseren.
import { el } from './dom.js';
import { ikon } from './ikoner.js';

// ── Kort ────────────────────────────────────────────────────────────────────
// Tone er TILSTAND, aldri dekor: nøytral · varsel · fare · ok
export function kort({ tittel, meta, tone = 'noytral', merke } = {}, ...barn) {
  const hode = tittel || merke
    ? el('div', { class: 'kort-hode' },
      el('div', {},
        tittel ? el('h3', {}, tittel) : null,
        meta ? el('p', { class: 'kort-meta' }, meta) : null),
      merke || null)
    : null;
  return el('section', { class: `kort tone-${tone}` }, hode, ...barn);
}

// ── Knapp ───────────────────────────────────────────────────────────────────
// Én primær per skjerm. Er alt uthevet, er ingenting det.
export function knapp({ tekst, rolle = 'primaer', storrelse = 'normal',
  ikonNavn, onclick, type = 'button', full = false, tittel } = {}) {
  const k = el('button', {
    class: `knapp k-${rolle}${storrelse === 'liten' ? ' k-liten' : ''}${full ? ' k-full' : ''}`,
    type, onclick, title: tittel,
  }, ikonNavn ? ikon(ikonNavn) : null, el('span', {}, tekst));
  return k;
}

// ── Skjemafelt ──────────────────────────────────────────────────────────────
// Etiketten er ALLTID synlig. En placeholder som eneste etikett forsvinner i det
// øyeblikket brukeren begynner å skrive — nettopp når man trenger den mest.
let feltTeller = 0;
export function felt({ etikett, hjelp, type = 'text', verdi = '', flerlinje = false,
  plassholder, autocomplete, inputmode, krav } = {}) {
  const id = `f${++feltTeller}`;
  const hjelpId = hjelp ? `${id}h` : undefined;
  const inn = flerlinje
    ? el('textarea', { id, placeholder: plassholder, 'aria-describedby': hjelpId })
    : el('input', { id, type, placeholder: plassholder, autocomplete, inputmode,
      'aria-describedby': hjelpId, required: krav || undefined });
  inn.value = verdi;
  const rot = el('div', { class: 'felt' },
    el('label', { for: id }, etikett),
    hjelp ? el('p', { class: 'felt-hjelp', id: hjelpId }, hjelp) : null,
    inn);
  rot.inn = inn;                       // kalleren trenger verdien
  return rot;
}

// ── Merkelapp ───────────────────────────────────────────────────────────────
export function merkelapp({ tekst, tone = 'noytral' } = {}) {
  return el('span', { class: `merkelapp m-${tone}` }, tekst);
}

// ── Tomtilstand ─────────────────────────────────────────────────────────────
// En setning et menneske ville sagt. Aldri «ingen data».
export function tomtilstand({ tittel, tekst, handling } = {}) {
  return el('div', { class: 'tomt' },
    el('strong', {}, tittel),
    tekst ? el('p', {}, tekst) : null,
    handling || null);
}

// ── Skjelett ────────────────────────────────────────────────────────────────
// Vises MENS data hentes. Den gamle appen viste ingenting til svaret kom, og
// på treg linje så det ut som en ødelagt side.
export function skjelett({ linjer = 3, kort: somKort = true } = {}) {
  const striper = Array.from({ length: linjer }, (_, i) => el('div', {
    class: 'skj-linje', style: `width:${[100, 82, 64, 91, 73][i % 5]}%` }));
  const rot = el('div', { class: 'skjelett', 'aria-hidden': 'true' }, ...striper);
  return somKort ? el('div', { class: 'kort' }, rot) : rot;
}

// ── Feil ────────────────────────────────────────────────────────────────────
// Hva gikk galt, og hva gjør jeg nå. Aldri bare «noe gikk galt».
export function feilboks({ tekst, prov } = {}) {
  return el('div', { class: 'feilboks', role: 'alert' },
    el('p', {}, tekst),
    prov ? knapp({ tekst: 'Prøv igjen', rolle: 'sekundaer', storrelse: 'liten', onclick: prov }) : null);
}
export function okboks(tekst) {
  return el('div', { class: 'okboks', role: 'status' }, tekst);
}

// ── Sideoverskrift ──────────────────────────────────────────────────────────
export function sidetopp({ tittel, undertekst, handling } = {}) {
  return el('header', { class: 'sidetopp' },
    el('div', {},
      el('h1', {}, tittel),
      undertekst ? el('p', { class: 'undertekst' }, undertekst) : null),
    handling || null);
}

// ── Panel: gruppering som får mening når det finnes bredde ──────────────────
export function panel({ tittel, verktoy } = {}, ...barn) {
  return el('section', { class: 'panel' },
    tittel ? el('div', { class: 'panel-hode' },
      el('h2', {}, tittel), verktoy || null) : null,
    el('div', { class: 'panel-kropp' }, ...barn));
}

// ── Rutenett som bruker bredden når den finnes ──────────────────────────────
export function rutenett(...barn) {
  return el('div', { class: 'rutenett' }, ...barn);
}

// ── Last inn med tilstand ───────────────────────────────────────────────────
// Samler mønsteret hver flate ellers ville gjentatt: vis skjelett, hent, vis
// feil med «prøv igjen» hvis det ryker. Ingen flate skal stå tom og stum.
export async function medTilstand(rot, hent, tegn, { linjer = 4 } = {}) {
  const plass = el('div', {});
  rot.append(plass);
  const kjor = async () => {
    plass.replaceChildren(skjelett({ linjer }));
    try {
      const data = await hent();
      plass.replaceChildren();
      await tegn(plass, data);
    } catch (f) {
      plass.replaceChildren(feilboks({
        tekst: f?.message || 'Vi fikk ikke kontakt med tjenesten. Innholdet ditt er trygt.',
        prov: kjor }));
    }
  };
  await kjor();
  return plass;
}
