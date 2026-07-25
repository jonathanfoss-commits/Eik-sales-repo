// Liten DOM-hjelper: el('div', {class: 'kort'}, barn...) — ingen innerHTML
// med brukerdata, alt settes som tekstnoder.
export function el(tag, attrs = {}, ...barn) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  for (const b of barn.flat()) {
    if (b === null || b === undefined || b === false) continue;
    node.append(b.nodeType ? b : document.createTextNode(String(b)));
  }
  return node;
}

export function tom(node) { while (node.firstChild) node.firstChild.remove(); }

export function feilboks(tekst) { return el('div', { class: 'melding-feil' }, tekst); }
export function okboks(tekst) { return el('div', { class: 'melding-ok' }, tekst); }

export const KATEGORI_NAVN = {
  juridisk: 'Juridisk', forsikring: 'Forsikring', eiendeler: 'Eiendeler',
  digitale_kontoer: 'Digitale kontoer', tilgangsinfo: 'Tilgangsinfo',
  praktisk: 'Praktisk', helsedirektiv: 'Helsedirektiv', siste_hilsen: 'Siste hilsen',
};

// Vaktagentens flagg i lesbar bokmål (kodene i basen er ASCII-trygge)
export const VAKT_FLAGG_NAVN = {
  kontakt_nylig_registrert: 'melderen ble kontakt nylig',
  nylige_mottakerendringer: 'mottakerne ble endret rett før',
  tidligere_stoppede_saker: 'tidligere stoppede saker',
  attest_paafallende_rask: 'attesten kom påfallende raskt',
};

// Filstørrelse: små filer skal ikke vises som «0 kB»
export function filstorrelse(byte) {
  const n = Number(byte) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} kB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const STATUS_NAVN = {
  meldt: 'Meldt', attest_lastet_opp: 'Attest mottatt', under_verifisering: 'Til verifisering',
  godkjent_1: 'Én godkjenning', karenstid: 'Karenstid', frigitt: 'Frigitt',
  avvist: 'Avvist', blokkert: 'Stoppet av eier', tilbakekalt: 'Tilbakekalt',
};
