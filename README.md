# J.A.R.V.I.S. 🤖⚡

En personlig stemmeassistent i Iron Man-stil som fungerer på **både Mac og iPhone** – som en app.

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

## Filstruktur

| Fil | Hva |
|---|---|
| `index.html` | Hele appen – UI, tale inn/ut, Claude-integrasjon (streaming) |
| `manifest.webmanifest` | PWA-manifest (gjør at den kan installeres som app) |
| `sw.js` | Service worker – cacher appskallet for offline-oppstart |
| `icons/` | Arc reactor-ikoner (192/512 px + apple-touch-icon) |

## Vær oppmerksom på

- **API-nøkkelen er din egen** og gir tilgang til å bruke Claude for din regning. Ikke del app-URL-en
  med nøkkel ferdig utfylt, og ikke sjekk nøkkelen inn i repoet – den ligger kun i `localStorage`.
- Talegjenkjenning krever Safari (iOS/macOS) eller Chrome/Edge. Firefox støtter det ikke enda.
- Våkneord-modus holder mikrofonen åpen kontinuerlig og kan trekke litt batteri på iPhone.
