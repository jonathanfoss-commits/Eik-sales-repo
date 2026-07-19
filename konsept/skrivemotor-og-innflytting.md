# Skrivemotoren og Innflyttingen — kunden trenger aldri Claude

*18. juli 2026 · Bestilt av Jonathan: «Finn en løsning hvor det ikke er nødvendig for
OP Bygg å bruke Claude eller andre ting. På sikt skal de jo kun abonnere på vårt system
laget til de.» Dette er beslutningsgrunnlag — ingenting bygges før Jonathan har godkjent
punktene i beslutningslisten nederst.*

## Målbildet i én setning

OP Bygg åpner appen, trykker «Lag utkast», og ferdig norsk tekst kommer tilbake —
uten Claude-konto, uten kopiering av prompter, uten annen programvare. AI-en er en
usynlig del av abonnementet, som strømmen i veggen.

## Slik henger det sammen i dag (og hva som må endres)

I dag har appen to spor:

1. **Lokale generatorer** (purretrapp, varselvakta, fristvakta m.fl. i Prøverommet) —
   ren kode, ingen AI, virker offline. Disse består uendret og er alltid reserven.
2. **Promptbiblioteket** — brukeren kopierer en ferdig prompt og limer den inn i Claude
   selv. Det er dette sporet som krever at kunden «bruker Claude», og det er dette
   Skrivemotoren erstatter.

## Del 1: Skrivemotoren

En serverfunksjon på vår Netlify-site (samme mønster som `innspill.js`, som allerede
virker) tar imot dikteringen og kaller Anthropic-API-et **på serversiden, med vår nøkkel**:

```
Bruker dikterer → app sender tekst til /.netlify/functions/skriv
→ funksjonen kaller Anthropic Messages API (vår ANTHROPIC_API_KEY, miljøvariabel)
→ ferdig utkast rett tilbake i appen → brukeren redigerer/kopierer som før
```

**Tekniske valg (klare til bygging):**

- **Modell:** `claude-opus-4-8` (5 USD/25 USD per mill. tokens). Kvalitet på norsk
  fagtekst er produktet — vi bytter ikke ned for å spare øre.
- **Prompt-caching:** bedriftsprofilen (PROFIL/kunde.js — tone, satser, standardtekster)
  ligger som cachet systemprompt. Da betaler vi brøkdeler for gjentatte kall, og hver
  bedrift får «sin» Lærling uten egen modell.
- **Tilgangskontroll:** samme mønster som i dag — pilotkoden i header, og funksjonen
  svarer kun appens egne kanaler. Ved flere kunder senere: én nøkkel per bedrift.
- **Ingen lagring hos oss:** funksjonen er ren gjennomstrømming. Dikteringen lagres
  aldri i noen database — svaret går tilbake til telefonen, og der bor det (lokal-først
  som før).

**Kostnad (må godkjennes av Jonathan — dette koster penger):**

Et typisk utkast er ~500 ord inn og ~400 ord ut. Med cachet profil koster det
grovt regnet **10–30 øre per utkast**. Selv med 11 ansatte som lager 30 utkast om
dagen blir det i størrelsesorden **100–300 kr/mnd per bedrift** — godt innenfor et
abonnement på 2 990–3 990 kr/mnd. API-nøkkelen ligger som miljøvariabel i Netlify
(vårt Anthropic-kontonivå), aldri i appen eller nettleseren.

**Ærlighetskravet (Personvernvakten, ufravikelig):**

- Diktert innhold passerer vår funksjon og Anthropics API **kun når brukeren aktivt
  trykker «Lag utkast»** — aldri automatisk, aldri i bakgrunnen.
- API-bruk trenes det ikke på, og med vår innstilling lagres det ikke — men vi kan
  **ikke** si «ingen data forlater telefonen» om denne knappen. Riktig formulering i
  appen: *«Teksten du dikterer sendes kryptert til skrivemotoren for å lage utkastet,
  lagres ingen steder, og brukes aldri til trening. Alt du lagrer, lagres kun på din
  telefon.»*
- Automatisk logging sender fortsatt aldri innhold — kun hendelsestypen «utkast-laget».
- Krever databehandleravtale (DPA) med Anthropic på plass og et avsnitt i avtalen med
  kunden. EU/EØS-behandling der det er tilgjengelig.

**Reserven når nettet er borte:** de lokale generatorene og promptbiblioteket består.
Uten dekning får brukeren fortsatt purretrapp, varsler og maler — Skrivemotoren er et
lag oppå, ikke en avhengighet.

## Del 2: Innflyttingen (Læretiden produktifisert)

«Læretiden» (læring fra kundens mailer og dokumenter) skal heller ikke kreve at kunden
installerer noe:

- **Nå (pilot og de første kundene):** hvit-hanske-onboarding. Jonathan kjører
  gjennomgangen som operatør hos/for kunden, med signert samtykke og eksklusjonslisten
  (aldri personalmapper, lønn, helse, private e-poster). Kunden leverer tilganger,
  vi leverer destillatet: PROFIL/prompter/kunde.js. Rådata forlater aldri kunden.
- **Senere (skalering):** en opplastingsside i appen — kunden drar inn 10–20 typiske
  dokumenter (tilbud, e-poster de er stolte av), funksjonen destillerer i minnet via
  API-et og returnerer profilen **til kundens egen telefon/nettleser**. Ingenting
  beholdes på serveren.

## Del 3: Alternativer som er vurdert

| Alternativ | Vurdering |
|---|---|
| **Serverfunksjon + Anthropic API (valgt)** | Kunden trenger null oppsett. Vi eier nøkkel, kostnad og kvalitet. Bygger på mønster som allerede virker i produksjon (`innspill.js`). |
| **Lokal AI-modell på telefonen** | Ekte «ingen data forlater enheten» — men småmodeller skriver for dårlig norsk fagtekst i dag, og PWA-en kan ikke bære modellvekter. Riktig som fremtidsspor, ikke nå. |
| **AI-boks hos kunden («kundens egen boks»)** | Passer arkitektur-løftet, men krever maskinvare, drift og fysisk oppfølging per kunde. Aktuelt som premium-trinn for kunder med strenge krav — ikke som standard. |
| **Fortsette med kopier-til-Claude** | Gratis for oss, men det er nettopp dette Jonathan vil bort fra: kunden skal abonnere, ikke installere. Beholdes kun som reserve i promptbiblioteket. |
| **Andre API-leverandører** | Norsk skrivekvalitet og personvernvilkår (ingen trening, ingen lagring, DPA) er avgjørende — Anthropic oppfyller begge. Ingen grunn til å splitte leverandører nå. |

## Faseplan

1. **Fase 1 — ✅ BYGGET 18. juli (v0.13.0):** `netlify/functions/skriv.mjs` + «⚡ Utkast»-
   knapp på de tre mest brukte promptene (tilbud, endringsmelding, purring). Ligger i
   TEST-kanalen til to-nøkkel-godkjenning; uten API-nøkkel viser appen reserven
   (kopier prompten). Gjenstår for Jonathan: legge ANTHROPIC_API_KEY i Netlify.
2. **Fase 2:** samtykketekst i appen, DPA, og utrulling til STABIL etter to nøkler.
3. **Fase 3:** opplastingssiden for Innflyttingen (skalerbar onboarding).
4. **Fase 4 (ved behov):** per-kunde-nøkler og forbruksmåling når kunde nummer to kommer.

## Beslutningsliste for Jonathan

1. **API-kostnad og nøkkel:** Godkjenner du at vi oppretter en Anthropic API-nøkkel på
   vårt kontonivå og tar kostnaden (est. 100–300 kr/mnd for OP Bygg) inn i abonnementet?
2. **Bygge nå eller etter pilot:** Skal Fase 1 bygges i TEST-kanalen nå, eller vente til
   v0.12.0-pakken er godkjent og publisert?
3. **Samtykketekst:** Godkjenner du formuleringen over til bruk i appen (og at «ingen
   data forlater»-løftet presiseres til å gjelde lagring, ikke selve utkast-knappen)?
4. **DPA:** Vil du at vi setter opp databehandleravtalen med Anthropic før Fase 2?
