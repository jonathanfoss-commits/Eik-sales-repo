# Til godkjenning — kveldsteamets leveranser som venter

<!-- Kveldsteamet fører inn: versjon, dato, hva som er endret og hvorfor.
     Jonathan/Ole Fabian godkjenner i TEST-appen; Jonathan flytter til STABIL. -->

## ÉN SAMLET LEVERANSE VENTER: v0.9.4–v0.12.0 — godkjennes under ett

Delversjonene under er bygget samme dag og testes kumulativt (fulltesten dekker alt
sammen). En Godkjenn-stemme på v0.12.0 i testappen godkjenner hele pakken — dette teller
som ÉN leveranse mot køregelen.

## v0.12.0 — 17. juli 2026 (stor kvalitetsrunde — 8 agenter + designgjennomgang)

**Hva (utdrag):** Tilgjengelighet: zoom tillatt igjen, grafkontrast fikset, Escape lukker
alle ark, dikter-arket fikk lukkeknapp, foto-knappen tastaturtilgjengelig, aria-status på
toasts, større trykkflater. Sikkerhet: service worker cacher aldri serverfunksjons-/API-svar,
funksjonen filtrerer hendelser server-side, paginerer (innspill forsvinner ikke etter 100
hendelser), 60 s svar-cache mot spam, kode flyttet til header, valgfri PILOT_API_KODE-
miljøvariabel for ekte hemmelighet. Kodefeil: timer-nulling ved prosjektbytte fikset,
fristvakt-månedsberegning klampet, foto-input kan gjenbrukes, listener-stabling fjernet.
Design/ærlighet: demo-tall merket «EKSEMPEL», varemottak-duplikat fjernet fra forsiden,
kompaktere stemmeknapper. Full funnliste i sikkerhets-/tilgjengelighets-/kodeagentenes
rapporter (se commit).

## v0.11.1 — 17. juli 2026 (bestilt av Jonathan)

**Hva:** Prøverommet utvidet: (1) «Innkomne idéer fra appen» — alle 💡-innspill hentes
live via serverfunksjonen og kan stemmes 👍/👎 på samme sted som de 11 prototypene;
(2) tilgang for hele pilotteamet: adgangsport med pilotkoden (samme som kommandosentralen),
lenker fra kommandosentralens verktøykasse og ledelsen-siden. Ansatte-appen på STABIL er
uendret synlig-messig.

**Testet:** Fulltest 141/141 grønne (port, idéhenting m/filtrering, idéstemme til
pilotloggen, lenker fra admin).

## v0.11.0 — 17. juli 2026 (Prøverommet — bestilt av Jonathan)

**Hva:** 🧪 Prøverommet (`app/lab.html`, kun synlig i testkanalen): alle 11 forslag fra
bransjeresearchen som fungerende lokale prototyper — purretrapp, Varselvakta (NS 8407),
tilleggsfanger, bildeknagg, dagbok-autopilot (henter ekte timer fra appen), fristvakt,
varemottak-historikk, byggemøtereferat, KS-sjekkliste, prisbank og overtakelsesprotokoll.
Hvert kort har «Prøv den» + 👍/👎-stemming: stemmer logges som innspill i pilotloggen
(vises i kommandosentralen) og styrer hva panelet bygger inn permanent. Inngang: egen rad
på forsiden i testkanalen.

**Testet:** Full systemtest inkl. nytt Prøverom-scenario — se testlogg i commit.

## v0.10.1 — 17. juli 2026 (styringsendring besluttet av Jonathan)

**Hva:** Admin-overstyring formalisert: Jonathan kan hastepublisere alene («publiser som
admin» til Claude) — alltid åpent logget i publiseringsloggen her, og opplyst i både
ledelsen-siden og kommandosentralens flytkort. Køregelen (maks 3 i kø, samlet godkjenning)
dokumentert i samarbeid/godkjenning.md og aktiv i kveldsrutinen fra i kveld.

**Testet:** Fulltest 118/118 grønne.

## v0.10.0 — 17. juli 2026 (panelkjøring — live-demo bestilt av Jonathan)

**Hva:** ⏱ Timeregistrering — Ole Fabians innspill fra i dag, bygget av panelet:
egen Timer-rad på forsiden med dagens status, ark med prosjekt-hurtigvalg (siste tre
prosjekter), store timer-knapper (−0,5/+0,5/+1/7,5 t dag), valgfritt notat til fakturering,
én føring per prosjekt per dag (ny lagring retter den gamle), «Timene dine denne uka» med
sum og Kopier-knapp formatert for timelisten. Alt lagres kun lokalt på telefonen.

**Panelets innstillinger:** Byggdomene JA (dato per føring, retting, notatfelt),
Personvernvakt JA (logging kun hendelsestypen «timer-åpnet» — aldri timetall, prosjekt
eller dato; «lagres kun på denne telefonen» i arket), UX JA (egen rad, chips i stedet for
tastatur, stoppeklokke utsatt), Tekst JA, Innsikt JA (daglig-bruk-anker — valider bruken
mot pilotloggen etter to uker), Forretning ENDRE (bygget som «prosjektleders kladdeblokk»,
aldri lønn/satser). Ingen veto. Bevisst utsatt: overtidskryss, historikk-redigering.

**Testet:** Full systemtest 117/117 grønne — inkl. hele timer-flyten (føring, retting uten
dobbeltføring, ukesum, kopiert timeliste-tekst, varighet etter omlasting). Skjermbilder tatt.

**Godkjenning:** Jonathan + Ole Fabian trykker Godkjenn i testappen → si «merge og
publiser» til Claude. (v0.9.4-leveransen under inngår — godkjennes samlet som v0.10.0.)

## v0.9.4 — 17. juli 2026 (levert av Claude på direkte bestilling fra Jonathan)

**Hva:** Innspill-feeden i kommandosentralen trenger ikke lenger token i nettleseren.
Ny serverfunksjon på siten (netlify/functions/innspill.js) henter pilotloggen fra begge
kanaler med et token som bor som miljøvariabel PILOTLOGG_TOKEN i Netlify — settes ÉN gang
per site, virker deretter i alle nettlesere på alle maskiner. Funksjonen krever pilotkoden,
svarer kun med feltene kommandosentralen trenger, og token-feltet i Oppsett består som
reserve. Sikkerhetsgevinst: kontotokenet ligger ikke lenger i noen nettlesers lagring.

**Hvorfor:** Jonathan måtte lime inn tokenet på nytt per nettleser OG per site — «dette må
kunne unngås å gjøre hver gang».

**Engangsoppsett (Jonathan):** i Netlify, på BEGGE sitene: Site configuration →
Environment variables → Add variable → nøkkel PILOTLOGG_TOKEN, verdi = tokenet →
Deploys → Trigger deploy.

**Testet:** Full systemtest 101/101 grønne (nytt: feed uten token via funksjon,
token-reserve når funksjonen mangler, tydelig engangsinstruks når ingenting er satt opp)
+ 7/7 enhetstester av selve funksjonen (kode-krav, manglende/ugyldig token, sammenslåing,
sortering, ingen datalekkasje av ekstra felter).

**Godkjenning:** Jonathan + Ole Fabian trykker Godkjenn i testappen → si «merge og
publiser» til Claude.

---

## Publiseringslogg

- **17. juli 2026 — v0.9.0–v0.9.3 publisert til STABIL.** Innhold: kommandosentral med
  live innspill fra begge kanaler («testapp»-merke), «⚡ Behandle nå» med panelvarsling,
  «Svar fra panelet» (første svar: timeregistrering), selvutfyllende oppsett, ekspertpanel-
  visning og Claude gjort valgfritt for ansatte. Testet: full systemtest 95/95 grønne.
  **Avvik fra to-nøkkel-regelen:** publisert på direkte beslutning fra Jonathan
  (produkteier) alene — Ole Fabian hadde ikke stemt ennå. Engangsavvik i oppstartsfasen;
  fremtidige leveranser følger vanlig flyt med begge nøkler.
