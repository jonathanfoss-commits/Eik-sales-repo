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

export const STATUS_NAVN = {
  meldt: 'Meldt', attest_lastet_opp: 'Attest mottatt', under_verifisering: 'Til verifisering',
  godkjent_1: 'Én godkjenning', karenstid: 'Karenstid', frigitt: 'Frigitt',
  avvist: 'Avvist', blokkert: 'Stoppet av eier', tilbakekalt: 'Tilbakekalt',
};
