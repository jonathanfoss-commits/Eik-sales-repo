# Til godkjenning — kveldsteamets leveranser som venter

<!-- Kveldsteamet fører inn: versjon, dato, hva som er endret og hvorfor.
     Jonathan/Ole Fabian godkjenner i TEST-appen; Jonathan flytter til STABIL. -->

## v0.23.0 — 31. juli 2026 (dyp gransking: maskinlesbar profil, to nye spørsmål, robusthetspakke)

**Hva (bestilt av Jonathan — «alt må undersøkes grundig, verifiseres, forbedres og testes»):**
To research-spor kjørt: (A) arkitekt-kartlegging av HVERT profilfelt mot kildekoden
(`samarbeid/profil-integrasjon.md` — nå kan en innsendt profil integreres direkte:
PROFIL/PROMPTER/purretrapp/tenant-config, prosessen portvoktes av Jonathan), og
(B) adversariell gransking som fant 3 kritiske + 6 bør-feil. Alt rettet:

- **Maskinlesbar profil:** intervjueren leverer nå PROFILJSON (20 normaliserte nøkler)
  sammen med profilblokken — innsendingen inneholder begge. Kveldsteam-rutinen oppdatert
  til å integrere etter kartleggingen (kun etter Jonathans klarsignal).
- **To nye spørsmål** som tetter konfigurasjonshull: kontraktspraksis (NS/forbruker-
  kontrakt/bare tilbudet) og rapporteringsrutine.
- **Kritisk fikset:** innlimt tilbud >7500 tegn låste hele samtalen (meldingen ble
  liggende og forgiftet alle senere turer) — nå vennlig lengdevern FØR lagring;
  diktering mistet siste del av talen ved stopp på iOS — nå brukes feltets innhold;
  lange samtaler traff 40 000-taket uten utvei — nå tegn-basert trimming klientside.
- **Bør fikset:** utsnitt starter alltid med kundemelding (API-krav), feilet tur ruller
  kundens melding tilbake til feltet (aldri to kunde-meldinger på rad), reserve som
  oppdager ferdig profilblokk selv om modellen glemmer klar-flagget, forslags-kort
  bygges med textContent (XSS-vern før research-genererte forslag), tastatur-håndtering
  med visualViewport på iOS.

**Testbevis:** FULL intervjusimulering mot EKTE API (7 turer, fiktivt malerfirma,
innlimt tilbud på 2400 tegn): PROFILJSON komplett og korrekt — kundemiks 80 %,
kontraktspraksis «Tilbud + aksept på e-post, Byggblankett på store jobber», Fiken,
iphone, drømmen ordrett. Playwright begge viewporter: PROFILJSON i innsendingen men
aldri i chatten, lengdevernet avviser 9000 tegn uten å røre samtalen, full flyt grønn.
Versjonstriade 0.23.0.

## v0.22.0 — 31. juli 2026 («Bli kjent» med research og forslag — pluss gjenopptaks-fiks)

**Hva (bestilt av Jonathan):** (1) Etter innsendt profil får kunden et ærlig ventekort:
«Lærlingen jobber for dere nå 🔍 — kom innom igjen i morgen etter kl. 10. Store grep
kvalitetssikres av et menneske først.» Ved neste besøk henter siden forslagene (GET på
intervju-funksjonen med invitasjonskode — dataene bor i koden, aldri i offentlig fil) og
viser dem som kort; «UNDER VURDERING»-merke på det som venter på Jonathan. (2) Kveldsteam-
rutinen er utvidet: leser nå BEGGE kanalenes skjema (oppfølgingen fra bifangsten — stemmer
og profiler avgis i TEST), og ved ny bedriftsprofil kjøres research med agenter →
forslags-utkast til Jonathan → **forslagene blir synlige for kunden KUN etter Jonathans
klarsignal** (avansert/kostbart alltid via ham). (3) OP Bygg har fått startsettet:
vær-i-dagbok, gnr/bnr-oppslag, UE-sjekken, push-varsler (klare) + regnskapskobling
(«under vurdering» — venter på systemsvar). (4) Fiks: gjenopptaket skjulte den skredder-
sydde oppstarten — ny samtale starter nå automatisk når firma-lenka er en annen enn den
lagrede, og `&ny=1` tvinger frisk start.

**Testbevis:** Playwright begge viewporter: full flyt → kvittering → forslags-kortet
rendres med under-vurdering-merke → `&ny=1` gir frisk start. Null pageerror.
Versjonstriade 0.22.0.

## v0.21.0 — 31. juli 2026 («Bli kjent» skreddersydd for OP Bygg: kjent info, klikkbare svar, Drømmen)

**Hva (bestilt av Jonathan):** (1) `?firma=opbygg` gir OP Bygg-tilpasset intervju:
velkomstkortet hilser firmaet, og alt vi VET fra piloten (firma, fag, Ole Fabians rolle,
skrivestil, verktøyene de alt bruker) legges som KJENT INFO i første melding — Lærlingen
**bekrefter i stedet for å spørre på nytt** og bruker tiden på hullene (kundemiks i %,
UE-bruk, purrerutiner, regnskapssystem, brukere, mobiltype). (2) Klikkbare svarvalg:
modellen foreslår 2–4 knapper via skjult VALG-spor der korte svar er naturlige — ett
trykk i stedet for tasting. (3) Nytt fast avslutningstema «Drømmen ✨» («hvis alt
papirarbeidet forsvant i morgen …» / «hva ville vært drømmen at Lærlingen kunne gjøre?»),
eget felt i Byggeplassen og ordrett i profilblokken.

**Personvernvakta (hurtigsjekk):** JA — KJENT INFO er nøyaktig samme opplysninger som
PROFIL-konstanten alt sender API-et i hver Skrivemotor-forespørsel; chips/Drømmen logges
aldri som innhold; sending fortsatt kun ved aktivt trykk.

**Testbevis:** Motor mot EKTE API med KJENT INFO: Lærlingen bekrefter («Stemmer dette
fortsatt?»), spør IKKE om kjente ting, setter firma+skrivestil true i maskinsporet og
tilbyr chips («Ja, stemmer» / «Delvis» / «Nei»). Playwright begge viewporter: OP Bygg-
velkomst, KJENT INFO i første melding, chips rendres og er klikkbare, Drømmen-feltet i
Byggeplassen, maskinsporene lekker aldri, full flyt til kvittering. Null pageerror.
Versjonstriade 0.21.0.

**OP Bygg-lenken (TEST):**
`https://op-bygg-laerling-app-test.netlify.app/bli-kjent.html?invitasjon=bli-kjent-26&firma=opbygg`

## v0.20.0 — 31. juli 2026 («Bli kjent»-siden — AI-onboarding av nye kundefirma)

**Hva:** Ny side `app/bli-kjent.html` (+ serverfunksjon `intervju.mjs`): nye kundefirma
åpner en personlig lenke (`…/bli-kjent.html?invitasjon=…`), prater med Lærlingen i
10–15 min (diktering eller tekst, «hopp over» alltid synlig), og ser bedriftsprofilen
bygge seg felt for felt i «Byggeplassen»-panelet (kollapsbar fremdriftslinje på mobil).
Til slutt: Send-knapp → profilen (kun profilblokken, aldri rå samtale) går som
Forms-hendelse `bedriftsprofil` rett inn i pilotlogg-røret kveldsteamet leser.
Intervjuet følger super-prompten i `samarbeid/onboarding-superprompt.md`.

**Personvern (vaktas krav, alle innfridd):** ren gjennomstrømming som Skrivemotoren
(samtalen bor i nettleseren, lagres aldri på server, aldri trening — kontrakt i
funksjonskommentaren); «Slett samtalen»-knapp; Send-kortet ber brukeren fjerne kunders
personopplysninger fra innlimt tilbud og opplyser om lagring i pilotloggen + sletterett;
invitasjonskoden er eksplisitt ikke-hemmelighet (bot-demping) + IP-tak (60/10 min).
Profilen eksponeres IKKE i innspill.js-API-et (RELEVANTE urørt).

**Panelets vedtak:** UX JA (maks to setninger + ett spørsmål per tur, mik-knapp 76 px i
tommelsonen, haker som belønning, gjenopptak fra localStorage — alle inne), Personvernvakt
ENDRE (kravene over — innfridd), Frontend JA (PROFIL-spor parses på full buffer etter
stream-slutt, historikk-tak server + klient, kompakt innsending, versjonsbump pga.
runtime-cache — alle inne).

**Testbevis (ende-til-ende, 31. juli):**
- *Motor mot EKTE API* (fiktivt «Malerfirma Strøket AS»): 401 ved feil invitasjon, 400 ved
  tom samtale, intervjuspørsmål med maskinspor, ferdig profilblokk med riktige felter og
  klar-flagg. (Kjent svakhet, tolerert: modellen kan droppe maskinsporet i enkeltturer —
  klienten tåler det, feltene oppdateres neste tur.)
- *UI i Playwright* (390×844 + 1440×900, mocket funksjon): velkomstkort med personvern-
  tekst → samtale → firma-haken tenner → maskinsporet lekker aldri i chatten → Send-kort
  med personvernkrav → innsending inneholder profilblokk men ikke rå samtale →
  kvittering → historikken gjenopptas etter reload. Null pageerror.
- *Forms-røret:* POST verifisert 200 på begge kanalene.

**⚠ Viktig bifangst (fikset):** TEST-siten hadde ALDRI skjemadeteksjon aktivert — alle
Forms-innsendinger fra TEST-kanalen (inkl. godkjenn-stemmer!) har gått tapt i det stille
(404). Aktivert via API + rebuild, verifisert 200. Oppfølging: kveldsteamet bør også lese
TEST-sitens skjema (godkjenninger avgis i TEST-appen).

**Versjonstriade:** 0.20.0 (cache «laerling-0.20.0»). Siden er bevisst IKKE i sw-precachen.

## Historikk

v0.19.0 ble publisert til STABIL 28. juli kl. ~21 (ordre fra Jonathan, se
publiseringsloggen). Seksjonene under er historikk.

## v0.19.0 — 28. juli 2026 (EKTE diktering + kalenderfrist — PUBLISERT til STABIL)

**Hva:** (1) 🎙 Mikrofonknappen er ekte: dikter rett i appen via nettleserens taletjeneste
(nb-NO, live-tekst, håndterer iOS-auto-stopp med omstart), stopp → velg hva Lærling skal
lage (tilbud/endringsmelding/purring/referat/lov og regel) → teksten står klar i
Skrivemotoren. Demoteksten og det falske demo-utkastet er slettet. Personvern opplyst i
arket: «Talen din gjøres om til tekst av nettleseren din (Apple/Google), ikke av Lærling»;
aldri auto-start; logges kun som hendelsestype. Uten støtte/dekning: tydelig beskjed +
Skrivemotoren med tastatur-mikrofon. (2) 🗓 Purringa kan legge oppfølgingsfristen i
kalenderen (7 dager, 14 ved inkassovarsel) — .ics laget helt lokalt, deles via delearket
på iOS med nedlastings-fallback. (3) «Byggemøte → referat» fikk ⚡ UTKAST-knappen
(m-feltet manglet — pilotplanens verktøy 2 hadde ingen Skrivemotor-vei).

**Panelets vedtak:** 3 × ENDRE (Personvernvakt: opplysningstekst + aldri auto-start —
innarbeidet; UX: snakk først, velg type etterpå, stor stoppknapp, tydelig dekningsfeil —
innarbeidet; Frontend: onend-omstart på iOS, not-allowed-håndtering, Web Share for .ics —
innarbeidet). Ingen veto.

**QA:** Playwright 390×844 + 1440×900: dikter-ark med personverntekst og startknapp,
chips → Skrivemotor verifisert, faktura → trinn 1 → kalenderknapp med dato, null
pageerror. Versjonstriade 0.19.0 (cache «laerling-0.19.0»).

---

Pakken under (v0.18.0 + Musk-tiltak + v0.18.1) ble publisert til STABIL 28. juli 2026
på admin-overstyring fra Jonathan (se publiseringsloggen nederst) — kun v0.19.0 over
venter på godkjenning.

## v0.18.1 — 21. juli 2026 (sentralkoden ut av alle filer — ⚠ HASTER fra Musk-reviewen)

**Hvorfor:** sentralkoden var eksponert offentlig via GitHub Pages (klartekst i
`innspill.js`, PBKDF2-avtrykk i admin/lab) og må anses brent.

**Hva:** Kommandosentralen og Prøverommet prøver nå koden mot innspill-funksjonen
(lås opp kun på 200, «feil kode» kun på 401, alt annet meldes som serverfeil — aldri
falsk «feil kode»). PBKDF2-maskineriet er slettet. Serverfunksjonen godtar kun
miljøvariabelen PILOT_API_KODE (mangler den: 503 uten detaljer). Variabelen er alt
satt til dagens kode på BEGGE sitene, så ingenting knekker ved deploy.
**Rotasjon etter merge (Jonathans steg 4):** bytt PILOT_API_KODE i Netlify på begge
sitene til en ny selvvalgt kode → SMS til Ole Fabian → gammel kode er død.

**Panelets vedtak:** Personvernvakt JA (krav: rotér straks etter utrulling; kun koden i
header; 503 uten detaljer — alle innfridd), Frontend ENDRE (statuskode-disiplin —
innarbeidet). **QA:** Playwright 390×844 + 1440×900 på admin/lab/index: låst ved start,
feil kode avvist, riktig kode låser opp, null pageerror. Versjonstriaden 0.18.1 med
cache «laerling-0.18.1» (én kilde).

## Musk-tiltak — 20. juli 2026 (infrastruktur, bestilt av Jonathan: «alt du kan gjøre auto»)

**Hva:** (1) `.github/workflows/pages.yml` slettet — den publiserte HELE repoet (pilotdata,
forretningsdokumenter) offentlig på GitHub Pages; Jonathan må i tillegg skru av Pages i
repo-innstillingene. (2) Query-string-veien for sentralkoden fjernet i `innspill.js` (kun
header; alle klientene brukte allerede header). (3) Cache-navnet i `sw.js` bundet til
versjonsnummeret («laerling-0.18.0») — ny regel: alltid «laerling-» + VERSJON, én kilde.
(4) `samarbeid/datasikkerhet.md` presisert med Skrivemotorens gjennomstrømming + DPA-punkt.
(5) `innspill/pilotlogg-innsikt.md` opprettet med faktiske brukstall (17 hendelser, null
verktøybruk målt). (6) Rutinesanering utenfor repoet: lunsjtriage og kostnadssjekk slettet,
kveldsteamet gjenskapt med behovsstyrt panel (maks 3 eksperter), tidlig-slutt-regel og
automatisk innspill-henting fra Netlify Forms. Sentralkode-rotasjon lagt som HASTER i
prioritering.md.

## v0.18.0 — 20. juli 2026 (Lov- og regelsjekk — brukerinnspill fra pilotloggen)

**Hva:** Ny rad i prompt-biblioteket på Verktøy-fanen: «Lov- og regelsjekk» (undertekst
«Veileder — erstatter ikke rådgiver»). Spør rett fram — «må vi ha rekkverk ved to
meter?» — og Skrivemotoren svarer med hva regelverket sier og hvilken forskrift og
paragraf som gjelder (TEK17, arbeidsplassforskriften, byggherreforskriften, SAK10 m.fl.).
Instruksen er avgrenset etter jurist-vilkårene: aldri konklusjon i den konkrete saken,
aldri «dette er lov/ulovlig», «dette må sjekkes» ved usikker hjemmel, stans-arbeidet-svar
ved pågående farlige situasjoner, og fast ansvarsfraskrivelse nederst i hvert svar.
KOPIER-fallbacken (Claude-appen ved dårlig dekning) har samme avgrensning bakt inn i
prompten. Ingen ny dataflyt: samme rene gjennomstrømming som resten av Skrivemotoren,
loggen får kun hendelsestypen.

**Panelets vedtak:** 5 × JA, 1 × ENDRE (tekst). Ingen personvern-veto.

**Sjekkpunkt til Jonathan (fra Kontraktsjuristen):** databehandleravtale (DPA) med
API-leverandøren bør bekreftes/signeres — samme punkt som Musk-reviewen 20. juli flagget
for `pilot/datasikkerhet.md`.

**QA:** Playwright 390×844 + 1440×900, null JS-feil, ny rad og ark verifisert i begge.
Funn under QA (pre-eksisterende, IKKE rettet i natt): `op-bygg-logo.png` refereres to
steder i index.html men finnes ikke — 404 også på live STABIL. Bildet har alt-tekst, så
det vises bare som tomrom. Rettes ved at Jonathan legger logofilen i `app/`, eller at
referansene fjernes i en egen leveranse.

---

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

- **28. juli 2026 (natt til investormøtet) — v0.19.0 publisert til STABIL.** Innhold:
  ekte diktering (mikrofonknappen koblet til nettleserens taletjeneste, demoteateret
  slettet), kalenderfrist i purringa (.ics lokalt), referatets ⚡-knapp. Pluss
  landingsside-oppdatering og investormøte-sjekkliste.
  **Avvik fra to-nøkkel-regelen:** publisert på direkte ordre fra Jonathan
  («publiser v0.19»). Ole Fabian hadde ikke stemt i testappen da publiseringen
  skjedde. Utført av Claude med merge kveldsteam-forslag → main. Kun Jonathan
  har denne retten.

- **28. juli 2026 — v0.18.0–v0.18.1 + Musk-tiltak publisert til STABIL.** Innhold:
  «Lov- og regelsjekk» i Skrivemotoren (brukerinnspill), pages.yml-slettingen,
  sentralkode-herdingen (server-verifisert opplåsing, kode kun i miljøvariabel),
  versjonsbinding av sw-cachen, datasikkerhet-presisering og pilotlogg-innsikten.
  Bakgrunn: lanseringsforberedelse for ledelsen + Ole Fabian.
  **Avvik fra to-nøkkel-regelen:** publisert på admin-overstyring fra Jonathan
  (valgte «Admin-overstyring nå» i lanseringsplanen, 28. juli). Ole Fabian hadde
  ikke stemt i testappen da publiseringen skjedde. Utført av Claude med merge
  kveldsteam-forslag → main. Kun Jonathan har denne retten.

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
