# Plattform-notat — fra OP Bygg-pilot til gjenbrukbar grunnbase

Skrevet 17. juli 2026, etter full gjennomgang av repoet (branch `kveldsteam-forslag`).
Mål: én ny kunde (rørlegger, elektriker, maler …) skal kunne pakkes ut på under én dag —
uten å røre pilotens drift.

## 1. Konfig vs. kode — hva som i dag er hardkodet, og hvor

Alt under må bli konfigurasjon per kunde. Fil + sted for hver:

| Hva | Hvor det er hardkodet i dag |
|---|---|
| Firmanavn/tittel | `app/index.html` (tittel l.6, topp l.299, velkomst l.704–705, versjonslinje l.808), `app/manifest.webmanifest` (name/description) |
| Bedriftsprofil (PROFIL) | `app/index.html` l.786 — hele OP Bygg-profilen med Ole Fabian, NS 8407-fagregler og signatur |
| Prompter (PROMPTER) | `app/index.html` l.787–802 — sju byggeprompter med NS-referanser |
| Demo-utkast | `app/index.html` l.346–415 og l.1390–1405 — fire kort + dikteringsdemo, alle signert «Mvh Ole Fabian, OP Bygg AS» |
| Varemottak-mal | `app/index.html` l.1334–1342 — «3 virkedager»-frist og «OP Bygg AS» i signaturen |
| Pilotkoder | To koder siden v0.13.1: sentralkoden som PBKDF2-avtrykk i `app/admin.html` + `app/lab.html` og klartekst kun server-side i `netlify/functions/innspill.js` (overstyrbar med PILOT_API_KODE); ansattkoden for Skrivemotoren i `app/index.html` (PILOTKODE) + `netlify/functions/skriv.mjs` (overstyrbar med SKRIV_KODE) — parene må holdes i synk |
| Kanal-URL-er | `netlify/functions/innspill.js` (`VERTER`, l.7–10), `app/admin.html` (`STANDARD`, l.323–325, inkl. pilotstart-dato) |
| Logo | `op-bygg-logo.png` referert i `app/index.html` l.301 og l.700 (med `onerror`-fallback — bra mønster) |
| Kontakt/eskalering | `mailto:jonathan.foss@eikandfriends.no` i `app/index.html` l.557 og `app/bli-med.html` |
| To-nøkkel-navn | Testbanneret i `app/index.html` l.290 nevner «Jonathan og Ole Fabian» ved navn |
| Kundevendte sider | `app/rapport.html` (mulighetsrapport skreddersydd OP Bygg), `app/bli-med.html` (personlig invitasjon til Ole Fabian), `app/ansatte.html`, `app/ledelsen.html` |
| Changelog-tone | `app/changelog.json` og `app/panelsvar.json` — jordnære setninger med innmelders fornavn |

**Forslag: én fil, `app/kunde.js`**, lastet før hovedskriptet og cachet i SW:

```js
window.KUNDE = {
  firma: "OP Bygg AS", type: "totalentreprenør", sted: "Oslo", ansatte: 11,
  kontaktperson: "Ole Fabian Foss", rolle: "prosjektleder",
  eier: { navn: "Jonathan", epost: "jonathan.foss@eikandfriends.no" },
  pilotkodeAvtrykk: "<PBKDF2-hex>", ansattkode: "<per kunde>", pilotstart: "2026-07-17",
  kanaler: { stabil: "https://…-app.netlify.app", test: "https://…-app-test.netlify.app" },
  logo: "kunde-logo.png",
  bransjelag: "bygg-totalentreprise",   // peker til faglaget (se pkt. 3)
  profil: "…", prompter: [ … ], demoUtkast: [ … ], varemottakMal: { frist: "3 virkedager" }
};
```

Netlify-funksjonen kan ikke lese `kunde.js` fra nettleseren — den får `KODE` og `VERTER`
som miljøvariabler per site i stedet (samme sted som `PILOTLOGG_TOKEN` bor i dag).

## 2. Allerede generisk (skal IKKE røres, bare beholdes)

Designsystemet (CSS-variabler, mørk «midnatt», aurora-grønn), ark-mønsteret (bunnark for
diktering/varemottak/idé/timer), localStorage-lageret `laerling`, service worker-en med
alltid-ferske JSON-filer, kanaldeteksjonen (`/(^|[.-])test([.-]|$)/` på vertsnavn),
to-kanals-deployen, pilotlogg-buffringen offline, veiviseren, timerføringen,
«Nytt siden sist»-maskineriet, Prøverommet-avstemmingen og kommandosentral-maskineriet er
alle kundenøytrale i logikken — kun tekstene og konstantene er OP Bygg.

## 3. Bransjelag — hva et «faglag» består av

Et faglag er en datapakke (del av `kunde.js`, eller egen `fag/<bransje>.js`) med fire deler:
prompter, sjekklistemaler, lovreferanser og varsel-maler. Eksempel **rørlegger**:

- **Prompter:** «Befaring → tilbud våtrom», «Avvik → varsel til hovedentreprenør»
  (rørleggeren er oftest UE — NS 8415/8417, ikke NS 8407 som hos totalentreprenøren),
  «Trykktest → dokumentasjon», «FDV-dokumentasjon ved overlevering».
- **Sjekklistemaler:** trykktesting før gjenlukking, membran/sluk etter våtromsnormen,
  varemottak mot Ahlsell/Brødrene Dahl-følgeseddel.
- **Lovreferanser:** håndverkertjenesteloven (forbruker, ufravikelig), TEK17 §13-15,
  Byggebransjens våtromsnorm, samsvarserklæring. Fristlogikken «uten ugrunnet opphold»
  gjelder fortsatt, men mot hovedentreprenør i stedet for byggherre.
- **Varsel-maler:** avviksmelding leverandør (gjenbruk), endringsvarsel til
  hovedentreprenør, ferdigmelding med dokumentasjonsliste.

Verktøylisten på Verktøy-fanen og innspill-nedtrekket (`app/index.html` l.499–507) genereres
da fra faglaget i stedet for å være hardkodet HTML.

## 4. Utpakkingsoppskrift — ny kunde på under én dag

1. **Nytt repo fra grunnbasen** (GitHub template, uten `pilot/ole-fabian-op-bygg/`,
   `innspill/`-historikk og OP Bygg-logo) — *15 min*.
2. **Fyll ut `kunde.js`**: firmaprofil, kontaktperson, pilotkode, velg bransjelag,
   juster prompter med kunden på telefon — *1–2 t* (det faglige er tyngst).
3. **To Netlify-siter** (`<kunde>-laerling-app` og `…-app-test`), koble Git-branch,
   aktiver Forms («pilotlogg»), sett `PILOTLOGG_TOKEN` + `KODE` + `VERTER` — *30 min*.
4. **Logo og ikoner**: `kunde-logo.png`, tre PNG-ikoner, manifest-navn — *30 min*.
5. **Kundevendte sider**: skriv `bli-med.html` og `rapport.html` for kunden
   (mulighetsrapporten er salgsverktøyet — ikke hopp over) — *1–2 t*.
6. **Rutiner**: opprett kveldsteam-branch, `til-godkjenning.md`, avtal to-nøkkel-parene
   (hvem er kundens «Ole Fabian»?) — *30 min*.
7. **QA**: Playwright mot 390×844, null JS-feil, verifiser at pilotloggen mottar
   `åpnet`-hendelse fra begge kanaler, bump SW-cache — *1 t*.

Sum: ca. **5–7 timer**.

## 5. Må IKKE gjøres nå

- **Ikke bygg rammeverk/byggsteg (npm, bundler, templating).** Selvforsynt kode uten
  avhengigheter er lov nummer én — én `kunde.js` gir 90 % av gevinsten gratis.
- **Ikke multi-tenant på én deploy.** Lokal-først + ett repo per kunde ER isolasjonsmodellen;
  delt hosting gjenåpner hele GDPR- og datahåndteringsvurderingen.
- **Ikke flytt PROFIL/prompter til en server.** Da slutter appen å virke offline, og data
  begynner å bevege seg — krever eksplisitt beslutning fra Jonathan.
- **Ikke refaktorér index.html i moduler nå.** Én fil er grunnen til at kveldsteamet kan
  levere trygt hver natt; splitting midt i piloten gir merge-støy uten brukerverdi.
- **Ikke generalisér før kunde nummer to finnes.** Pilotloggen er fasit — vi vet ennå ikke
  hvilke mønstre som er OP Bygg-særegne og hvilke som er bransjefelles.

## 6. Risikoer ved å klippe OP Bygg-koblingen feil

- **Pilotloggen:** skjemanavnet `pilotlogg` og feltene `hendelse/detalj/tid` er kontrakten
  mellom app, Netlify Forms og kommandosentralen. Endres navnet eller `VERTER`-listen i
  `netlify/functions/innspill.js` uten samordning, blir kommandosentralen blind — og
  «pilotloggen er fasit» slutter å gjelde.
- **Kanaldeteksjonen:** hele TEST/STABIL-skillet henger på at test-siten matcher
  `/(^|[.-])test([.-]|$)/`. En ny kunde med site-navn uten «test» som eget ledd får
  testversjonen servert som stabil — uten banner og uten godkjenningsknapper.
- **To-nøkkel-flyten:** godkjenningsstemmene håndheves KUN av hvem som har TEST-lenken og
  pilotkoden. Gjenbrukes samme sentralkode hos ny kunde, kan feil personer stemme; glemmer man
  å definere kundens to nøkkelpersoner, står leveranser evig i kø (køregelen ved 3+).
- **SW-cachen:** innføres `kunde.js` uten å legge den i `FILER` og bumpe cachenavnet i
  `app/sw.js`, serveres gamle filer — kunden ser OP Bygg-innhold i ukevis.
- **Versjonstriaden:** `VERSJON` i `index.html`, `app/versjon.json` og cachenavnet i
  `sw.js` må fortsatt bumpes samlet per kunde — drifter de, lyver kommandosentralen.
- **localStorage-nøkkelen `laerling`:** testes to kunder i samme nettleser/domene,
  blandes brukerdata — nøkkelen bør inkludere kunde-slug i grunnbasen.
