// Eksportfilen: én selvstendig HTML-side som virker uten oss.
//
// Serveren bygger BARE skallet rundt det den allerede har — chiffertekst og
// frasepakkede nøkler. Dekrypteringen skjer i mottakerens egen nettleser, med
// koden nedenfor, som er kopiert uendret fra app/js/krypto.js (PBKDF2-SHA-256
// 310 000 runder → frasenøkkel → hvelvnøkkel → elementnøkkel → AES-GCM).
// Endres krypto.js, må denne kopien endres i samme slengen — ellers slutter
// gamle eksportfiler og appen å være enige.
//
// Ingen eksterne ressurser: ingen fonter, ingen bilder, ingen nettverkskall.
// Fila skal kunne åpnes fra en minnepinne om ti år, uten oss og uten nett.

const STIL = `
:root {
  --bakgrunn: #0E1B25; --flate: #16283A; --flate-hev: #1D3348; --kant: #27405A;
  --tekst: #EDF2F0; --tekst-demp: #9FB3AD; --aksent: #7FB7A3;
  --aksent-mork: #4E8271; --fare: #D9777B;
}
* { box-sizing: border-box; margin: 0; }
body { background: var(--bakgrunn); color: var(--tekst);
  font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding: 24px 16px 64px; }
main { max-width: 720px; margin: 0 auto; }
h1 { font-size: 24px; margin-bottom: 6px; }
h2 { font-size: 18px; margin: 28px 0 8px; }
h3 { font-size: 16px; margin-bottom: 2px; }
p { margin: 8px 0; }
a { color: var(--aksent); }
.mono { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 11px;
  letter-spacing: .08em; text-transform: uppercase; color: var(--tekst-demp); }
.undertekst { color: var(--tekst-demp); font-size: 14px; }
.kort { background: var(--flate); border: 1px solid var(--kant); border-radius: 14px;
  padding: 14px; margin: 10px 0; }
.innhold { white-space: pre-wrap; word-break: break-word; margin-top: 8px; }
.laast { color: var(--tekst-demp); font-style: italic; margin-top: 8px; }
.aapnet { border-left: 3px solid var(--aksent-mork); padding-left: 10px; }
input { width: 100%; background: var(--bakgrunn); color: var(--tekst);
  border: 1px solid var(--kant); border-radius: 10px; padding: 13px 12px;
  font: inherit; margin: 6px 0 10px; }
button { border: 0; border-radius: 12px; cursor: pointer; font: 600 16px/1 inherit;
  padding: 14px 18px; min-height: 48px; background: var(--aksent); color: #0B1720;
  width: 100%; }
.melding-feil { background: #3A2226; border: 1px solid var(--fare); border-radius: 10px;
  padding: 12px; margin-top: 10px; color: #F1C3C5; }
.melding-ok { background: #1D3A30; border: 1px solid var(--aksent-mork);
  border-radius: 10px; padding: 12px; margin-top: 10px; color: #CFE7DC; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 7px 10px 7px 0; border-bottom: 1px solid var(--kant);
  vertical-align: top; word-break: break-word; }
th { color: var(--tekst-demp); font-weight: 600; font-size: 12px;
  text-transform: uppercase; letter-spacing: .06em; }
.tabellramme { overflow-x: auto; }
details { margin-top: 28px; }
summary { cursor: pointer; color: var(--tekst-demp); }
pre { background: var(--flate); border: 1px solid var(--kant); border-radius: 10px;
  padding: 12px; overflow-x: auto; font-size: 12px; margin-top: 10px; }
`;

// Kopi fra app/js/krypto.js — kun det som trengs for å LESE (aldri skrive).
const KRYPTO = `
var subtle = globalThis.crypto.subtle;
var fraB64 = function (s) { return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); }); };
var PBKDF2_ITERASJONER = 310000;

async function fraseNokkel(frase, salt) {
  var materiale = await subtle.importKey('raw', new TextEncoder().encode(frase),
    'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: salt, iterations: PBKDF2_ITERASJONER, hash: 'SHA-256' },
    materiale, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function utpakkMed(nokkel, pakke) {
  return new Uint8Array(await subtle.decrypt(
    { name: 'AES-GCM', iv: fraB64(pakke.iv) }, nokkel, fraB64(pakke.ct)));
}

function somAes(raa) {
  return subtle.importKey('raw', raa, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function laasOppHvelvnokkel(frase, lagret) {
  var fn = await fraseNokkel(frase, fraB64(lagret.salt));
  return somAes(await utpakkMed(fn, lagret.hvelvnokkel_pakket));
}

async function dekrypterElement(hvelvnokkel, innhold, nokkelRef) {
  var en = await somAes(await utpakkMed(hvelvnokkel, JSON.parse(nokkelRef)));
  return new TextDecoder().decode(await utpakkMed(en, JSON.parse(innhold)));
}
`;

const VISNING = `
var data = JSON.parse(document.getElementById('eksport-data').textContent);

var KATEGORI_NAVN = {
  juridisk: 'Juridisk', forsikring: 'Forsikring', eiendeler: 'Eiendeler',
  digitale_kontoer: 'Digitale kontoer', tilgangsinfo: 'Tilgangsinfo',
  praktisk: 'Praktisk', helsedirektiv: 'Helsedirektiv', siste_hilsen: 'Siste hilsen'
};
var NIVAA_NAVN = { delt: 'Delt', privat: 'Privat', sensitiv: 'Sensitiv' };

function el(tag, klasse, tekst) {
  var n = document.createElement(tag);
  if (klasse) n.className = klasse;
  if (tekst !== undefined && tekst !== null) n.textContent = String(tekst);
  return n;
}
function tid(v) { return v ? String(v).replace('T', ' ').slice(0, 19) : '–'; }

function seksjon(tittel, node) {
  var rot = document.getElementById('seksjoner');
  rot.append(el('h2', null, tittel));
  rot.append(node);
}

// Generisk tabell — viser ALLE feltene som ligger i eksporten, uten å tolke dem.
function tabell(rader, kolonner) {
  if (!rader || !rader.length) return el('p', 'undertekst', 'Ingenting registrert.');
  var ramme = el('div', 'tabellramme');
  var t = document.createElement('table');
  var hodeRad = document.createElement('tr');
  kolonner.forEach(function (k) { hodeRad.append(el('th', null, k[0])); });
  t.append(hodeRad);
  rader.forEach(function (r) {
    var rad = document.createElement('tr');
    kolonner.forEach(function (k) { rad.append(el('td', null, k[1](r))); });
    t.append(rad);
  });
  ramme.append(t);
  return ramme;
}

// ── Arkivet ──
var elementNoder = {};       // element-id → noden innholdet skal inn i
var krypterte = data.elementer.filter(function (e) { return e.kryptert; });

function tegnElementer() {
  var rot = document.getElementById('elementer');
  if (!data.elementer.length) {
    rot.append(el('p', 'undertekst', 'Arkivet er tomt.'));
    return;
  }
  var sisteKategori = null;
  data.elementer.forEach(function (e) {
    if (e.kategori !== sisteKategori) {
      sisteKategori = e.kategori;
      rot.append(el('h2', null, KATEGORI_NAVN[e.kategori] || e.kategori));
    }
    var kort = el('div', 'kort');
    kort.setAttribute('data-element', e.id);
    kort.append(el('h3', null, e.tittel));
    kort.append(el('div', 'mono', (NIVAA_NAVN[e.nivaa] || e.nivaa) + ' · lagt inn ' + tid(e.opprettet)));
    if (e.kryptert) {
      var laast = el('div', 'laast', 'Kryptert. Skriv sikkerhetsfrasen øverst for å åpne.');
      kort.append(laast);
      elementNoder[e.id] = laast;
    } else {
      kort.append(el('div', 'innhold', e.innhold));
    }
    rot.append(kort);
  });
}

// ── Opplåsing ──
async function laasOpp() {
  var frase = document.getElementById('frase').value;
  var melding = document.getElementById('frase-melding');
  var knapp = document.getElementById('laas-opp');
  melding.className = 'undertekst';
  melding.textContent = 'Låser opp … (nøkkelutledningen tar noen sekunder med vilje)';
  knapp.disabled = true;
  // la nettleseren tegne meldingen før PBKDF2 låser tråden
  await new Promise(function (r) { setTimeout(r, 30); });
  var hvelvnokkel;
  try {
    hvelvnokkel = await laasOppHvelvnokkel(frase, data.kryptonokler);
  } catch (e) {
    knapp.disabled = false;
    melding.className = 'melding-feil';
    melding.textContent = 'Feil sikkerhetsfrase. Ingenting ble åpnet — prøv igjen. '
      + 'Frasen finnes bare hos deg; verken denne fila eller vi kan gjenskape den.';
    return;
  }
  var apnet = 0;
  var feilet = 0;
  for (var i = 0; i < krypterte.length; i++) {
    var e = krypterte[i];
    var node = elementNoder[e.id];
    try {
      var klartekst = await dekrypterElement(hvelvnokkel, e.innhold, e.nokkel_ref);
      node.className = 'innhold aapnet';
      node.textContent = klartekst;
      apnet++;
    } catch (feil) {
      node.className = 'laast';
      node.textContent = 'Kunne ikke åpnes. Innholdet er kryptert med en annen '
        + 'nøkkel enn den frasen din låser opp.';
      feilet++;
    }
  }
  knapp.disabled = false;
  melding.className = 'melding-ok';
  melding.textContent = apnet + ' av ' + krypterte.length + ' krypterte elementer er åpnet'
    + (feilet ? ', ' + feilet + ' lot seg ikke åpne' : '') + '.';
}

function tegnOpplasing() {
  var boks = document.getElementById('opplasing');
  if (!krypterte.length || !data.kryptonokler) { boks.remove(); return; }
  document.getElementById('antall-krypterte').textContent = krypterte.length === 1
    ? 'Ett element i denne fila er kryptert.'
    : krypterte.length + ' elementer i denne fila er krypterte.';
  document.getElementById('laas-opp').addEventListener('click', laasOpp);
  document.getElementById('frase').addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') laasOpp();
  });
}

// ── Resten av arkivet ──
function tegnResten() {
  var navnPaaKontakt = {};
  data.kontakter.forEach(function (k) { navnPaaKontakt[k.id] = k.navn; });
  var tittelPaaElement = {};
  data.elementer.forEach(function (e) { tittelPaaElement[e.id] = e.tittel; });

  seksjon('Kontakter', tabell(data.kontakter, [
    ['Navn', function (r) { return r.navn; }],
    ['E-post', function (r) { return r.epost || '–'; }],
    ['Telefon', function (r) { return r.telefon || '–'; }],
    ['Relasjon', function (r) { return r.relasjon || '–'; }],
    ['Betrodd', function (r) { return r.er_betrodd ? 'ja' : 'nei'; }],
    ['Lagt inn', function (r) { return tid(r.opprettet); }]
  ]));

  seksjon('Hvem skulle få hva', tabell(data.mottakermatrise, [
    ['Element', function (r) { return tittelPaaElement[r.element_id] || r.element_id; }],
    ['Mottaker', function (r) { return navnPaaKontakt[r.kontakt_id] || r.kontakt_id; }],
    ['Ved hendelse', function (r) { return r.hendelse_type; }]
  ]));

  seksjon('Hendelser', tabell(data.hendelser, [
    ['Type', function (r) { return r.type; }],
    ['Kilde', function (r) { return r.kilde; }],
    ['Tid', function (r) { return tid(r.opprettet); }]
  ]));

  seksjon('Frigivelser', tabell(data.frigivelser, [
    ['Status', function (r) { return r.status; }],
    ['Karenstid', function (r) { return tid(r.karenstid_start) + ' → ' + tid(r.karenstid_slutt); }],
    ['Frigitt', function (r) { return tid(r.frigitt_tid); }],
    ['Grunn', function (r) { return r.avvist_grunn || r.blokkert_grunn || '–'; }]
  ]));

  seksjon('Revisjonslogg', tabell(data.revisjonslogg, [
    ['Tid', function (r) { return tid(r.tid); }],
    ['Rolle', function (r) { return r.rolle || '–'; }],
    ['Hendelse', function (r) { return r.hendelse; }],
    ['Detaljer', function (r) { return r.detaljer ? JSON.stringify(r.detaljer) : '–'; }]
  ]));

  var konto = el('div', 'kort');
  konto.append(el('h3', null, data.bruker.navn));
  konto.append(el('div', 'undertekst',
    data.bruker.epost + (data.bruker.telefon ? ' · ' + data.bruker.telefon : '')));
  konto.append(el('div', 'undertekst', 'Konto opprettet ' + tid(data.bruker.opprettet)));
  if (data.abonnement) {
    konto.append(el('div', 'undertekst', 'Abonnement: ' + data.abonnement.status
      + (data.abonnement.periode_slutt ? ' til ' + tid(data.abonnement.periode_slutt) : '')));
  }
  seksjon('Kontoen din', konto);
}

tegnElementer();
tegnOpplasing();
tegnResten();
document.getElementById('raadata').textContent = JSON.stringify(data, null, 2);
`;

// JSON i en <script type="application/json">: eneste vei ut av blokka er
// tegnfølgen «</script», og den fjernes ved å escape «<» som \\u003c — fortsatt
// gyldig JSON, så innholdet er uendret for den som leser rådataen.
function trygtJson(data) {
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

export function byggEksportHtml(eksport) {
  const dato = String(eksport.tidspunkt).slice(0, 10);
  return `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Livsarkivet — eksport ${dato}</title>
<style>${STIL}</style>
</head>
<body>
<main>
  <h1>Din eksport fra Livsarkivet</h1>
  <p class="mono">Hentet ${dato}</p>
  <p>Dette er alt du har lagt inn i Livsarkivet, i én fil. Den virker uten oss:
    ingen nettforbindelse, ingen konto, ingen tjeneste som må finnes. Du kan lagre
    den på en minnepinne, dobbeltklikke på den om ti år, og se innholdet i en
    hvilken som helst nettleser.</p>
  <p>Det du la inn som sensitivt, ligger fortsatt kryptert. Nøklene til det er med
    i fila, men de er låst med sikkerhetsfrasen din — den finnes bare hos deg.
    Skriv den under, så låses innholdet opp her på din egen maskin. Frasen sendes
    ingen steder.</p>

  <div class="kort" id="opplasing">
    <h3>Lås opp det krypterte</h3>
    <p class="undertekst" id="antall-krypterte"></p>
    <label class="undertekst" for="frase">Sikkerhetsfrase</label>
    <input type="password" id="frase" autocomplete="off" spellcheck="false"
      placeholder="Sikkerhetsfrasen din">
    <button id="laas-opp" type="button">Lås opp</button>
    <p class="undertekst" id="frase-melding"></p>
  </div>

  <div id="elementer"></div>
  <div id="seksjoner"></div>

  <details>
    <summary>Rådata (JSON) — for den som vil lese fila maskinelt</summary>
    <pre id="raadata"></pre>
  </details>
</main>

<script type="application/json" id="eksport-data">${trygtJson(eksport)}</script>
<script>${KRYPTO}${VISNING}</script>
</body>
</html>
`;
}
