# Til godkjenning — kveldsteamets leveranser som venter

<!-- Kveldsteamet fører inn: versjon, dato, hva som er endret og hvorfor.
     Jonathan/Ole Fabian godkjenner i TEST-appen; Jonathan flytter til STABIL. -->

## INGEN LEVERANSER VENTER

Pakken v0.9.4–v0.17.1 ble publisert til STABIL 19. juli 2026 på admin-overstyring
fra Jonathan (se publiseringsloggen nederst). Delversjonene under står som
historikk over hva pakken inneholdt.

## v0.17.1 — 18. juli 2026 (nattens gransking — to funn rettet i piloten)

**Hva:** Den adversarielle gjennomgangen av nattens leveranse fant to ting i piloten,
begge rettet: (1) i dagslys-modus fikk også de svake knappene og motor-merket hvit
tekst på lys flate (uleselig) — nå får bare de mørke knappene hvit tekst; (2) purringens
trinnknapper brukte alltid den sist lagrede fakturaen — nå velger du fakturaen i lista
(markeres VALGT), og forslag og purretekst følger valget. Fulltest 183/183 grønne.

## v0.17.0 — 18. juli 2026 (NATTSKIFTET, pilotdelen — purring + dagslys)

**Hva:** (1) 💸 Purring med norsk purretrapp rett i appen (backlog #1): registrér faktura
med forfall på Verktøy-fanen — appen følger den, foreslår riktig trinn ut fra dagene over
forfall (vennlig → forsinkelsesrente → inkassovarsel etter inkassoloven § 9), og gir
ferdig melding med Kopier og Åpne i Mail. «Betalt»-knapp kvitterer ut. Alt lagres kun
lokalt; loggen får bare hendelsestyper. (2) ☀️ Dagslys-modus (godkjent av Jonathan):
én-trykks bytte på Verktøy-fanen, mørkt forblir standard, kontrastsjekkede farger begge
veier, husker valget.

## v0.16.0 — 18. juli 2026 (panel-konstellasjonen — bestilt av Jonathan)

**Hva:** Ekspertpanelet i kommandosentralen har fått en visuelt slående fremstilling:
en konstellasjon med teamet som nav i midten og de 12 ekspertene rundt. Når panelet
jobber (kveldskjøring, lunsjtriage eller «⚡ Behandle nå»), våkner den: pulser vandrer
langs eikene, ekspertene gløder etter tur, navet puster — og statuslinjen ruller
gjennom fasene panelet faktisk går gjennom. I ro: dempet konstellasjon med nedtelling
til neste kjøring. Ærlig fremstilling av nav-og-eiker-modellen (slik panelet reelt
jobber), og hele animasjonen skrur seg av ved «reduser bevegelse» på telefonen.

## v0.15.0 — 18. juli 2026 (eksport-siden + PLATTFORMKJERNEN — ULTRACODE-oppdrag fra Jonathan)

**I den gamle appen (eneste endring):** 📦 `eksport.html` — pakker alt telefonen har
lagret til én tekst for innflytting i den nye plattformen. Ingenting sendes noe sted.
Testet: fulltest 173/173 grønne.

**Det store: `kjerne/` — plattformen som grunnpilar.** Bedrifts-agnostisk kjerne
(Node + Postgres med FORCE RLS, ekte innlogging, live-lag med SSE, offline-kø,
AI-gateway med kostnadslogg og 500 kr-budsjettsperre) der Lærling er FØRSTE tenant-konfig
og «Malermester Demo» beviser at kunde nr. 2 er konfig, ikke kode. LIVE: det laget
registrerer, ser alle umiddelbart — mens timer er privat + ledelse og økonomi kun for
admin (Jonathans beslutninger), håndhevet i databasen. Verifisert: 21/21 servertester +
22/22 e2e-bevis i nettleser (live-beviset med to samtidige brukere, tenant-isolasjon,
rollegrenser, 503-reserve, innflytting) — pluss at testene fant og fikset en reell feil
i budsjettsperren. Kjører IKKE i produksjon ennå — parallellkjøring og cutover-plan i
`kjerne/docs/cutover-plan.md`; cutover krever to nøkler. Full leveranse:
`kjerne/docs/leveranse.md`.

## v0.14.1 — 18. juli 2026 (pilotkoden ut av klartekst — fra tjenestegjennomgangen, bestilt av Jonathan)

**Hvorfor:** koden `opbygg2026` lå i klartekst i kildekoden på offentlig hostede sider
(admin.html, lab.html, index.html) — alle med URL-en kunne lese den og dermed åpne
kommandosentralen og hente pilotloggdata via innspill-funksjonen.

**Hva:** kodene er splittet i to, siden de gjør to ulike jobber:
- **Sentralkoden** (kommandosentralen + Prøverommet + pilotloggdata): ny, sterkere kode
  — `gerikt-laft-beslag-30` — som ikke finnes i noen offentlig fil. Sidene sjekker den
  mot et PBKDF2-avtrykk (150 000 runder) og husker den lokalt i nettleseren; serverfunksjonen
  `innspill.js` krever den i header (kan overstyres med miljøvariabelen PILOT_API_KODE).
- **Ansattkoden** (kun Skrivemotoren): `opb-skriv-95` — må ligge åpent i appen alle
  laster, og er derfor bare bot-demping, ikke en hemmelighet. Kan overstyres med
  miljøvariabelen SKRIV_KODE i Netlify.

**Konsekvens for pilotteamet:** den gamle koden slutter å virke ved publisering.
Jonathan gir Ole Fabian og ledelsen den nye sentralkoden direkte (SMS/muntlig, ikke
e-post med lenken i samme melding). Nettlesere som var låst opp med gammel kode blir
bedt om den nye én gang.

**Ellers:** analyserapporten (SaaS-vurderingen av begge produkter) er sjekket inn i
`analyse/` — den fantes før kun som midlertidig fil i byggemiljøet.

## v0.14.0 — 18. juli 2026 (Møtehjelperen — «kjør den» fra Jonathan, 4 research-agenter)

**Hva:** 🤝 Møtehjelperen som verktøy 12 i Prøverommet: velg møtetype (byggemøte, befaring,
telefonavtale, UE-avklaring, sluttoppgjørsmøte), noter/dikter underveis, og få etterpå:
referat via Skrivemotoren (ny «referat»-oppgavetype i skriv.mjs, lokal mal som reserve),
kalenderavtaler som .ics-fil med påminnelse (delt via delingsarket — iOS-vennlig),
«som avtalt i dag»-oppfølgings-e-post, og ⚠-hint om Varselvakta når notatene inneholder
endringsord. Åpenhets-avkryssing før referat («jeg har sagt i møtet at det tas notater»).
Bevisst valgt bort etter jus-research: lydopptak (krever samtykkeapparat + aml.-drøfting
for ansatte), vernerunder (byggherrens plikt) og overtakelse (hører til protokoll-verktøyet
som skal signeres og låses). Full research: `innspill/research-rapport.md` runde 3.

**Testet:** fulltest inkl. nye Møtehjelper-scenarier + enhetstester av referat-oppgaven.
## v0.13.0 — 18. juli 2026 (Skrivemotoren Fase 1 — bestilt av Jonathan, «full tillatelse»)

**Hva:** ⚡ Skrivemotoren: de tre mest brukte promptene (Befaring → tilbud,
Endringsmelding, Purring til UE) har fått en «⚡ Utkast»-knapp i promptbiblioteket.
Brukeren dikterer/skriver rått i et eget ark, trykker «Lag utkast», og ferdig tekst
strømmes rett inn i appen — ingen Claude-konto, ingen kopiering av prompter. Kopier- og
Åpne-i-Mail-knapper på resultatet. Serverfunksjonen (`netlify/functions/skriv.mjs`) kaller
Anthropic-API-et med vår nøkkel (miljøvariabel ANTHROPIC_API_KEY), er ren gjennomstrømming
(lagrer aldri innhold), krever pilotkoden, og har enkel misbruksdemper. Uten nøkkel svarer
den 503 og appen viser reserven: «kopier prompten og bruk Claude som før».

**Samtykke/ærlighet:** arket sier eksplisitt at teksten sendes kryptert kun ved knappetrykk,
aldri lagres og aldri brukes til trening. Loggen får kun hendelsestyper
(«skrivemotor-åpnet», «utkast-laget») — aldri innholdet. Full arkitektur og
beslutningsliste: `konsept/skrivemotor-og-innflytting.md`.

**Rydding:** duplisert Escape-lytter som ble registrert på nytt ved hver timer-lagring
er fjernet; Escape lukker nå også skrivemotor-arket.

**Venter på Jonathan:** ANTHROPIC_API_KEY må legges inn som miljøvariabel i Netlify
(begge siter) før knappen gir ekte utkast — se sjekklisten i siste Claude-svar.

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

- **19. juli 2026 — v0.9.4–v0.17.1 publisert til STABIL.** Innhold: Skrivemotoren
  serverless, sikkerhetspakken (pilotkode-splitten v0.14.1), panel-konstellasjonen,
  purring med norsk purretrapp, dagslys-modus og granskingsrettelsene (v0.17.1).
  Testet: fulltest 183/183 grønne før merge.
  **Avvik fra to-nøkkel-regelen:** publisert på direkte ordre fra Jonathan alene
  («publiser versjon 17 — det gjør du nå, ikke vent på to nøkler»). Ole Fabian
  hadde ikke stemt i testappen da publiseringen skjedde. Utført av kveldsteamet
  (Claude) med merge kveldsteam-forslag → main. Kun Jonathan har denne retten.

- **17. juli 2026 — v0.9.0–v0.9.3 publisert til STABIL.** Innhold: kommandosentral med
  live innspill fra begge kanaler («testapp»-merke), «⚡ Behandle nå» med panelvarsling,
  «Svar fra panelet» (første svar: timeregistrering), selvutfyllende oppsett, ekspertpanel-
  visning og Claude gjort valgfritt for ansatte. Testet: full systemtest 95/95 grønne.
  **Avvik fra to-nøkkel-regelen:** publisert på direkte beslutning fra Jonathan
  (produkteier) alene — Ole Fabian hadde ikke stemt ennå. Engangsavvik i oppstartsfasen;
  fremtidige leveranser følger vanlig flyt med begge nøkler.
