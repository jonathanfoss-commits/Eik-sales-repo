# J.A.R.V.I.S. 🤖⚡

En personlig stemmeassistent i Iron Man-stil som fungerer på **både Mac og iPhone** – som en app.

> 📱 **Vil du ha den som ekte native iPhone-app?** Se [`ios/README.md`](ios/README.md) —
> et komplett SwiftUI/Xcode-prosjekt med iOS-varsler for timere, Keychain-lagret nøkkel,
> native talegjenkjenning og haptikk. Webversjonen under fungerer uansett på begge plattformer.

Bygget som en **PWA (Progressive Web App)**: én kodebase, ingen App Store, ingen Xcode. Hjernen er
[Claude](https://www.anthropic.com) (modellen `claude-opus-4-8`), stemmen og ørene er nettleserens
innebygde talegjenkjenning og talesyntese.

## Funksjoner

- 🎙️ **Snakk til Jarvis** – trykk på arc-reactoren og snakk (norsk eller engelsk)
- 🔊 **Jarvis svarer høyt** – svar leses opp setning for setning mens de strømmes inn
- 🧠 **Claude som hjerne** – Jarvis-personlighet («God dag, sir»), valgfri modell i oppsettet
- 🛠️ **Ekte verktøy (tool use):**
  - 🌐 **Websøk** – Jarvis søker på nettet etter ferske nyheter, priser og fakta
  - 🌤️ **Vær** – værmelding for din GPS-posisjon eller et hvilket som helst sted (Open-Meteo, gratis)
  - 🕐 **Klokke/dato** – vet alltid hva klokka er
  - ⏲️ **Timere** – «Jarvis, sett en timer på 10 minutter» → appen piper og sier ifra
  - 🔗 **Åpne nettsider** – «Jarvis, åpne YouTube»
  - 💾 **Langtidshukommelse** – «husk at …» → Jarvis husker det i alle fremtidige samtaler
- 💬 **Samtalen overlever omstart** – historikken lagres lokalt på enheten
- 🗣️ **Våkneord** – valgfri «Jarvis …»-modus med kontinuerlig lytting
- 👂 **Live-transkripsjon** – se ordene dine mens du snakker, radar-ringer rundt reaktoren
- ⌨️ Tekstfelt som alternativ til tale
- 🚀 **Boot-sekvens** – kinematisk oppstartsanimasjon à la Iron Man (én gang per økt, trykk for å hoppe over)
- 📰 **Hurtigknapper** – «Dagens briefing» (dato + vær + nyheter opplest), været, timer, hjelp
- 💸 **Kostnadsteller** – se tokens og estimert kostnad under ⚙ OPPSETT, med nullstilling
- 🎚️ **Talehastighet** – juster hvor fort Jarvis snakker
- 🔁 **Auto-retry** – prøver automatisk på nytt ved overbelastet API (429/5xx)
- 📄 **Eksporter samtalen** som tekstfil; lenker i svar er klikkbare
- 📵 Appskallet fungerer offline (API-kall krever selvsagt nett)
- 🔐 API-nøkkelen lagres kun lokalt på enheten din

## Kom i gang

### 1. Publiser appen (én gang)

Mikrofon-tilgang krever HTTPS, så enklest er **GitHub Pages**:

1. Gå til repoet på GitHub → **Settings** → **Pages**
2. Under *Build and deployment*: velg **Deploy from a branch**, velg branchen og `/ (root)`, og lagre
3. Etter et minutt er appen live på `https://<brukernavn>.github.io/<repo-navn>/`

(Alternativt: `python3 -m http.server` lokalt på Mac-en – `http://localhost:8000` regnes som sikker kontekst.)

### 2. Skaff en API-nøkkel

1. Logg inn på [platform.claude.com](https://platform.claude.com)
2. Gå til **API keys** → **Create key**
3. Åpne appen, trykk **⚙ OPPSETT** og lim inn nøkkelen (den lagres bare i nettleseren på enheten)

### 3. Installer som app

**iPhone (Safari):**
1. Åpne app-URL-en i Safari
2. Trykk **Del-knappen** (firkant med pil opp)
3. Velg **«Legg til på Hjem-skjerm»**
4. Jarvis ligger nå som egen app med arc reactor-ikon 🎉

**Mac (Chrome/Edge):**
1. Åpne app-URL-en
2. Klikk **installer-ikonet** i adressefeltet (skjerm med pil), eller meny → *Cast, lagre og del* → *Installer side som app*

**Mac (Safari):**
1. Åpne app-URL-en
2. **Arkiv → Legg til i Dock**

### 4. Snakk med Jarvis

- Trykk på **reaktoren** og snakk – Jarvis svarer med tale
- Eller aktiver **våkneord** i oppsettet og si «Jarvis, hva er klokka i Tokyo?»
- Bytt språk og stemme under ⚙ OPPSETT (tips: stemmen «Daniel (English UK)» gir klassisk Jarvis-følelse)

## 🌍 Styr «alt» — uten mellomledd

Jarvis har fire veier til den virkelige verden. Ingen av dem krever Zapier eller andre
betal-mellomledd:

**1. 🍎 Apple Snarveier (`run_shortcut`) — den kraftigste.** Lag en snarvei i
Snarveier-appen (iPhone/Mac) — snarveier kan styre HomeKit-lys og -varme, sende meldinger,
spille musikk, starte apper, kalle URL-er … Jarvis kjører dem på navn:
1. Lag f.eks. snarveien «Lys av» som slår av HomeKit-lysene
2. Si: *«Jarvis, kjør snarveien Lys av»* — eller bare *«slå av lysene»* (Jarvis spør/husker navnet)
3. Bonus: be Jarvis *huske* snarvei-navnene dine («husk at snarveien for leggetid heter God natt»)

**2. 🪝 Egne webhooks — dine kommandoer.** Under ⚙ OPPSETT → «Webhooks» legger du inn
navn + URL + beskrivelse; hver blir et eget verktøy Jarvis bruker når det passer:
- **Home Assistant**: lag en automatisering med utløser «Webhook» → styr hva som helst i huset
- **n8n** (selvhostet, åpen kildekode): bygg vilkårlige arbeidsflyter Jarvis kan utløse
- **IFTTT** webhooks fungerer også

**3. 📅 Native Apple-integrasjon (iPhone-appen):** `add_calendar_event` og `add_reminder`
legger avtaler og påminnelser rett i Apple Kalender/Påminnelser — ingen konto, ingen sky:
*«Jarvis, legg inn tannlege torsdag klokka 14»*

**4. 🔌 MCP-servere — direktekobling.** Under ⚙ OPPSETT → «Integrasjoner» kan du koble
til tjenester som har egen MCP-server (kjøres på Anthropic sin serverside):
Home Assistant MCP, GitHub (`api.githubcopilot.com/mcp/` + PAT som token), Todoist, Linear …

Jarvis er instruert til å bekrefte før handlinger som er vanskelige å angre (sende e-post o.l.).

## Filstruktur

| Fil | Hva |
|---|---|
| `index.html` | Hele appen – UI, tale inn/ut, Claude-integrasjon (streaming) |
| `manifest.webmanifest` | PWA-manifest (gjør at den kan installeres som app) |
| `sw.js` | Service worker – cacher appskallet for offline-oppstart |
| `icons/` | Arc reactor-ikoner (192/512 px + apple-touch-icon) |

## 🏛 AEIS – Adaptive Executive Intelligence System

I [`aeis/`](aeis/) ligger noe større enn en assistent: et **digitalt styrerom** som fungerer
som strategisk partner for selskapsbygging, investeringer og store beslutninger.
Nås fra JARVIS-appen (🏛 AEIS-knappen) eller direkte på `…/aeis/`.

- **Executive Board med 13 roller** (CEO, CFO, CSO, Devil's Advocate m.fl.) — hver rolle er
  en uavhengig Claude-agent med eget mandat. Dynamisk organisasjon: roller kan opprettes,
  avvikles og spesialiseres; systemet oppretter selv midlertidige eksperter når en sak krever det.
- **14-stegs beslutningsmodell**: problemdefinisjon → uavhengige analyser (agentene ser ikke
  hverandres svar) → Devil's Advocate med **vetorett** (tvinger ny analyserunde) → **pre-mortem**
  («om to år var dette en katastrofe») → scenarier med sannsynligheter → forventet verdi →
  CEO-syntese → handlingsplan med falsifiserbare antakelser.
- **Fortjent autoritet**: agentenes sannsynlighetsestimater kalibreres (Brier-score) mot faktiske
  utfall du registrerer i hovedboken — treffsikre agenter får større vekt over tid. Ingen har
  permanent autoritet.
- **Læringssløyfe**: hvert utfall utløser automatisk post-mortem; lærdommene injiseres i alle
  fremtidige beslutninger. Systemet blir smartere uten nye instrukser.
- **Radar**: proaktiv skanning (websøk) etter muligheter, risiko og markedsendringer.
- **Selvforbedring**: systemet leser sin egen [arkitektur](aeis/ARCHITECTURE.md) og foreslår
  migreringsplaner. Grunnloven i hvert kall: *ha rett, ikke vær hyggelig* — aldri gjett, aldri
  bekreft en idé fordi eieren liker den, aldri uttrykk mer sikkerhet enn dataene tilsier.

Arkitektur, modulkontrakter og utvidelsesregler: [`aeis/ARCHITECTURE.md`](aeis/ARCHITECTURE.md).
Testet i `tests/aeis.e2e.js` (mocket API): hele pipelinen, veto-runden, kalibrering av vekter
og læringssløyfen.

## 🏭 Company Factory – AI-drevet startup-studio

I [`factory/`](factory/) ligger fabrikken som tar en enkel idé og driver den mot et
lanseringsklart digitalt selskap. Nås fra JARVIS-appen (🏭 FACTORY-knappen) eller på `…/factory/`.

- **Idé → beslutning på minutter**: inntak (Fase 0) strukturerer idéen og skiller fakta,
  påstander, antakelser og ukjente; idévurderingen (Fase 1) innkaller kun de 3–6 relevante
  fagrollene (gjenbruker AEIS-styret med fortjent autoritet + 9 fabrikkroller), scorer på
  10 vektede kriterier og konkluderer: `stopp | parker | valider_mer | endre_konsept |
  prototype | mvp | lansering`.
- **Kritisk, ikke hyggelig**: fabrikken forsøker å avkrefte idéen før den anbefaler bygging —
  svake idéer får svakheter, forbedringer og alternative idéer, ikke en byggeplan.
- **Valider billig først – og faktisk**: hver kritisk antakelse blir et eksperiment med
  terskel definert før resultatet finnes; fabrikken genererer en **deploybar falsk-dør-
  landingsside** (selvstendig HTML, pris synlig, ærlig venteliste), og valideringsporten
  konkluderer på resultatene — bestått slipper prosjektet videre til MVP, stryk stopper det.
- **Leveranser per prosjekt**: tilpasset faseplan (17 standardfaser, små idéer får små planer),
  MVP-brief med eksplisitt «bygges ikke»-liste, antakelseslogg og full beslutningslogg.
- **Byggekjeden**: ved byggebeslutning produserer fabrikken automatisk **forretningsmodell**
  (LLM setter begrunnede antakelser, koden beregner 24-mnd MRR, break-even, LTV/CAC og
  kapitalbehov i tre scenarier – rekalkuler gratis når du justerer tallene) og et **komplett
  nettsted** (forside, pris fra planene, FAQ, om oss, vilkår/personvern som merkede utkast,
  deploy-README) – lastes ned som ZIP, klart for GitHub Pages/Netlify. Betalingsknapper er
  Stripe-plassholdere bak eier-porten.
- **Læringssløyfe**: 🔁 Retro per prosjekt trekker ut én generaliserbar lærdom som injiseres
  i alle fremtidige vurderinger, og høster gjenbrukskandidater til fellesbiblioteket –
  fabrikken blir bedre for hvert prosjekt.
- **Kvalitetsporter**: modenhetsstigen prototype → MVP → beta → produksjonsklart →
  lanseringsklart har sjekklister per nivå – ingenting erklæres ferdig før eieren har huket
  av alle punkter, og «lansert» er en egen eierhandling.
- **Måling og markedsføring**: registrer faktiske månedstall og se dem mot prognosen;
  porteføljen viser samlet MRR. Fase 11 bygger prioritert kanalstrategi med eksperimentkø.
- **Portefølje**: flere parallelle prosjekter, isolert lagring per prosjekt (`cf_project_*`),
  per-prosjekt eksport for utspinning/avvikling, og enkel kill-disiplin.
- **Eier-porter**: betalinger, publisering, domener, juss, masseutsendelser og offentlig
  lansering auto-godkjennes aldri — de krever ditt eksplisitte klikk og logges.

I tillegg: strategi med ikke-gjøre-liste (Fase 4), juridisk kartlegging der alt som
krever advokat/regnskapsfører merkes eksplisitt (Fase 10, veiledning – ikke rådgivning),
nedlastbar prosjektrapport (Markdown), og kill-disiplin: parker/avslutt/reaktiver som
loggede eierbeslutninger.

Arkitektur (systemrevisjon, arkitekturbeslutning, målarkitektur, plan):
[`factory/ARCHITECTURE.md`](factory/ARCHITECTURE.md). Testet i `tests/factory.e2e.js`
(mocket API, 67 sjekker i 7 scenarier): full pipeline med byggekjede, svak idé → stopp,
eksempelprosjekt (isolert TEST), valideringssløyfen, håndverifisert økonomimatte,
python-verifisert ZIP, læringssløyfe, modenhetsporter, eier-porter, navneromsisolasjon
og AEIS-gjenbruk. Kjør: `node tests/factory.e2e.js` (server på :8130 som beskrevet over).

## Testing 🧪

`tests/e2e.js` er en full ende-til-ende-suite (Playwright) som mocker Claude API-strømmen
og verifiserer hele den agentiske løkka uten API-nøkkel — 10 scenarier: tekststrømming,
verktøykall med tool_result-runder, pause_turn-gjenopptak, feilhåndtering med rollback,
historikk-trimming, auto-retry, kostnadsmåling, hurtigknapper, lenke-rendering og boot-sekvens.

```bash
python3 -m http.server 8130 &        # server appen
npm i playwright                     # + nettlesere: npx playwright install chromium
node tests/e2e.js                    # ALL TESTS PASSED
```

## Vær oppmerksom på

- **API-nøkkelen er din egen** og gir tilgang til å bruke Claude for din regning. Ikke del app-URL-en
  med nøkkel ferdig utfylt, og ikke sjekk nøkkelen inn i repoet – den ligger kun i `localStorage`.
- Talegjenkjenning krever Safari (iOS/macOS) eller Chrome/Edge. Firefox støtter det ikke enda.
- Våkneord-modus holder mikrofonen åpen kontinuerlig og kan trekke litt batteri på iPhone.
