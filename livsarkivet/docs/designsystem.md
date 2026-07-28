# Designsystem — Livsarkivet

**Status:** implementert · **Erstatter:** ad hoc-CSS i `app/stil.css` fra første leveranse

Dette dokumentet er kontrakten. Bygger du en ny flate, bruker du tokenene og
komponentene her. Trenger du noe som ikke finnes, legg det til her først.

---

## Hva som var galt

Målt i nettleser, ikke lest ut av koden:

| Funn | Konsekvens |
|---|---|
| `#innhold { max-width: 640px }` på **alle** bredder | Appen var en mobilkolonne strukket over 1440 px. Matrisen — den tetteste dataflaten — lå i 640 px mens 800 px sto tomme. |
| Fanelinjen festet i bunnen også på desktop | Fire elementer med 400 px mellomrom. Mønsteret er riktig på mobil og feil på alt annet. |
| Ingen tokens | Farger, avstander og størrelser var skrevet direkte i hver regel. 201 linjer CSS med 14 ulike verdier for det som skulle vært fire. |
| Ingen laste- eller feiltilstander | Hver flate viste ingenting til dataene kom, og hvit skjerm hvis kallet feilet. |
| `.kort` brukt til alt | Samme boks rundt et hvelvelement, en advarsel, et skjema og en score. Ingen visuell rangering. |
| Fokusmarkering bare på lenker | Tastaturbruk var i praksis umulig i skjemaene. |

---

## Retningen: «rolig presisjon»

Tre retninger ble vurdert:

**A. «Arkivet»** — papirhvitt, serif, tynne linjer, som et advokatdokument.
Verdig, men leser som gammelt. Oppdraget krever at det føles teknologisk ledende.

**B. «Kommandosentral»** — tett, mørk, monospace, tastaturdrevet, i Linear/Raycast-
slekt. Vakkert, og feil for dette produktet: halvparten av brukerne møter systemet
for første gang på den verste dagen i livet sitt. Tetthet er en fiendtlig egenskap
overfor et menneske i sorg.

**C. «Rolig presisjon»** — **valgt.** Ett skjelett, to temperaturer. Eieren og
saksbehandleren jobber i mørk skifer: konsentrert, presist, tastaturvennlig. Den
etterlatte møter en lys, varm flate med mer luft og større type. Samme system,
ulik temperatur — fordi det er to ulike mennesker i to ulike tilstander.

Det som ble beholdt fordi det objektivt fortjener det: **salviegrønn aksent**
(#7FB7A3 — den er dempet, den er ikke tech-blå, og den fungerer på begge flater),
og **etterlattemodusens lyse temperatur**, som var det ene stedet den gamle
appen hadde en reell idé.

### Prinsipper

1. **Tilbakeholdenhet er designet.** Dette er en tjeneste om død. Ingen
   gradienter, ingen glass, ingen glød, ingen emoji som ikoner.
2. **Én ting skal være tyngst per skjerm.** Er alt uthevet, er ingenting det.
3. **Flaten skal aldri lyve om tilstand.** Laster den, vis at den laster. Feiler
   den, si hva som gikk galt og hva man gjør.
4. **Bredden skal brukes.** En tabell med åtte rader og tre kolonner skal ikke
   ligge i en telefonkolonne på en 27-tommer.
5. **Alt skal nås med tastatur**, med synlig fokus hele veien.

---

## Tokens

Alle i `app/tokens.css`. Bruk aldri en rå verdi i en komponent.

### Farge

Semantiske navn, ikke navn på farger. `--flate-hev` sier hva den gjør;
`--blaa-700` gjør ikke.

| Token | Mørk | Lys | Brukes til |
|---|---|---|---|
| `--grunn` | `#0B1620` | `#F4F2ED` | Sidens bunn |
| `--flate` | `#132433` | `#FFFFFF` | Kort, paneler |
| `--flate-hev` | `#1B3043` | `#EAE7DF` | Hevet flate, valgt rad |
| `--kant` | `#24405A` | `#DAD5CA` | Skiller |
| `--kant-sterk` | `#365A78` | `#BDB6A8` | Kant som skal ses |
| `--tekst` | `#EDF2F0` | `#17242C` | Brødtekst |
| `--tekst-demp` | `#A6BAB4` | `#5A6A64` | Sekundær (≥4.5:1 på grunn) |
| `--tekst-svak` | `#7E948E` | `#7B8781` | Etiketter (≥3:1, kun ≥14 px halvfet) |
| `--aksent` | `#7FB7A3` | `#2E6A55` | Handling, valgt tilstand |
| `--aksent-dyp` | `#4E8271` | `#1F5140` | Aksent på fylt flate |
| `--fare` | `#E08A8E` | `#9B3138` | Destruktivt, stopp |
| `--varsel` | `#E0BC79` | `#7A5B15` | Venter, karenstid |
| `--ok` | `#7FB7A3` | `#2E6A55` | Bekreftet |

Semantiske farger (`--fare`, `--varsel`, `--ok`) er **ikke** aksenten. De brukes
kun til tilstand, aldri til dekor.

### Type

Systemstacker. Ingen nedlastet font: dette er en offline-først PWA, og en font
som ikke kommer er verre enn ingen font.

- `--font-display`: `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`
- `--font-tekst`: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- `--font-mono`: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`

Skala (1.25, avrundet til hele piksler):

| Token | Størrelse | Bruk |
|---|---|---|
| `--t-xs` | 12 px | Etiketter, mono-versaler |
| `--t-s` | 14 px | Meta, hjelpetekst |
| `--t-m` | 16 px | Brødtekst |
| `--t-l` | 19 px | Korttittel |
| `--t-xl` | 24 px | Seksjon (display) |
| `--t-2xl` | 30 px | Sidetittel (display) |
| `--t-3xl` | 44 px | Nedtelling, tall som bærer skjermen |

Overskrifter i display-serif, brødtekst i sans, tall i tabeller med
`font-variant-numeric: tabular-nums`.

### Avstand

Én skala, 4 px-basert. `--r-1` … `--r-9` = 4, 8, 12, 16, 20, 24, 32, 40, 56.
Layout settes med `gap` på flex/grid, aldri med marginer som kan kollapse.

### Radius og dybde

`--radius-s` 8 px (felt, små knapper) · `--radius-m` 12 px (kort) ·
`--radius-l` 16 px (paneler, modaler) · `--radius-full` 999px (merkelapper).

Dybde skapes med **flate og kant**, ikke skygge. Én skygge finnes,
`--skygge-loft`, kun til modal og popover.

---

## Layoutmodell

| Bredde | Navigasjon | Innhold |
|---|---|---|
| < 720 px | Fanelinje i bunnen (tommelen) | Én kolonne, 100 % |
| 720–1099 px | Fanelinje i bunnen | Én kolonne, maks 680 px, sentrert |
| ≥ 1100 px | **Sidestolpe til venstre**, 244 px | Arbeidsflate opptil 1180 px, egen grid per flate |

Sidestolpen er ikke en ny navigasjon — det er de samme fanene, flyttet dit de
hører hjemme når det finnes plass. Innholdet får da bruke bredden: matrisen
går fra tvungen 640 px til full tabell, hvelvet fra én kolonne til to.

---

## Komponenter

I `app/js/komponenter.js`. Alle tar norsk-navngitte felt og returnerer DOM-noder.

| Komponent | Når |
|---|---|
| `kort({tittel, meta, tone})` | Standard innholdsboks. `tone`: `nøytral`, `varsel`, `fare`, `ok` |
| `knapp({tekst, rolle, størrelse, ikon})` | `rolle`: `primær`, `sekundær`, `stille`, `fare`. **Én primær per skjerm.** |
| `felt({etikett, hjelp, feil, type})` | Etikett alltid synlig, aldri bare placeholder |
| `merkelapp({tekst, tone})` | Tilstand, ikke dekor |
| `tomtilstand({tittel, tekst, handling})` | En setning et menneske ville sagt |
| `skjelett({linjer})` | Vises mens data hentes. Aldri tom skjerm. |
| `feilboks({tekst, prøvIgjen})` | Hva gikk galt + hva gjør jeg nå |
| `panel({tittel, barn})` | Gruppering på desktop |
| `tidslinje({steg, nå})` | Frigivelsens gang |

### Regler

- Aldri `innerHTML` med brukerdata. `el()` setter tekstnoder.
- Hver interaktiv node har synlig `:focus-visible`.
- Ikoner er inline SVG i én strektykkelse som arver `currentColor`. Aldri emoji.
- Knapper som utfører noe irreversibelt har `rolle: 'fare'` **og** bekreftelse.

---

## Bevegelse

Kun to: 120 ms toning ved tilstandsskifte, og 160 ms glidning når en drawer
åpnes. Ingenting animerer inn ved sidelast — det forsinker brukeren og er den
sikreste måten å få et produkt til å se AI-generert ut.

`prefers-reduced-motion: reduce` slår av begge.

---

## Tilgjengelighet

- Kontrast: brødtekst ≥ 7:1, sekundærtekst ≥ 4.5:1, etiketter ≥ 3:1 målt mot
  sin egen flate i begge temaer.
- Fokus: 2 px aksentring med 2 px avstand, på alt som kan nås med tastatur.
- Fanelinjen og sidestolpen er `<nav>` med `aria-current` på valgt fane.
- Skjemafelt har `<label>`, ikke bare placeholder.
- Modaler fanger fokus og lukkes med Escape.
