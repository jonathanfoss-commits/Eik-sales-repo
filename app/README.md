# Lærling-appen (iPhone)

Kundens daglige flate: godkjenn utkast, se timer spart, styr verktøyene, dikter nye oppgaver.
Bygget som **installerbar web-app (PWA)** — den legges på hjemskjermen og kjører i fullskjerm
som en vanlig app, uten App Store, Xcode eller utviklerkonto. Perfekt for pilotfasen.

## Appen er online nå

Stabil demo-URL (hostet hos Anthropic, uavhengig av din maskin):
**https://claude.ai/code/artifact/607d9464-bcb7-439c-9478-94d93b6efcb0**

Den er privat til deg som standard. For å sende til Ole Fabian: åpne lenken →
del-menyen på siden → slå på deling → send ham delingslenken. Han åpner den i
Safari på iPhonen — funker med en gang.

For «Legg til på Hjem-skjerm» med fullskjerm, eget ikon og **offline-modus**
(appen virker uten dekning — viktig på byggeplass) trenger den egen hosting —
se under. Det tar 5 minutter og kan gjøres fra hvilken som helst maskin.

## Slik får Ole Fabian den på iPhonen (2 minutter)

1. **Legg appen på en nettadresse.** Enkleste vei: dra `app/`-mappen inn på
   [Netlify Drop](https://app.netlify.com/drop) (gratis, ingen konto for test) —
   eller bruk GitHub Pages/Vercel. Du får en URL, f.eks. `laerling.netlify.app`.
2. Åpne URL-en i **Safari** på iPhonen.
3. Trykk **Del-knappen** (firkanten med pil opp) → **«Legg til på Hjem-skjerm»**.
4. Ferdig: Lærling-ikonet ligger på hjemskjermen og åpner i fullskjerm, uten Safari-rammer.

## Hva som er ekte og hva som er demo

Dette er en **klikkbar prototype** med demodata fra OP Bygg-piloten. All interaksjon virker
(godkjenn, moduser, diktering-simulering, graf), men ingenting sendes noe sted. Den brukes til:

- å vise pilotkunder nøyaktig hvordan tjenesten kjennes i hånden,
- å teste om godkjenn-flyten er riktig FØR backend bygges,
- salgsmøter: «dette er appen du får».

## Veien til ekte app

| Steg | Hva | Når |
|---|---|---|
| 1 | Denne prototypen på hjemskjerm hos pilotkunder | Nå |
| 2 | Koble til backend (ekte utkast inn, godkjenning = faktisk sending) — fortsatt PWA | Ved 5+ kunder |
| 3 | Pakk samme kodebase med **Capacitor** → ekte App Store-app med push-varsler («2 utkast venter») | Når produktet er bevist |

Push-varsler er hovedgrunnen til steg 3 — «Lærling har gjort klar dagens utkast» kl. 07:30
er en vane-maskin. (iOS støtter web-push for PWA-er også, men native er mer pålitelig.)

## Filer

- `index.html` — hele appen, selvforsynt (ingen avhengigheter)
- `sw.js` — service worker: appen caches og virker offline etter første åpning
- `manifest.webmanifest` + `icon-180.png` / `icon-512.png` — hjemskjerm-ikon og fullskjermoppsett

## Testet (automatisert, i nettleser)

- Godkjenn-flyt, diktering → nytt utkast, fanebytte, modusbrytere, graf-tooltip
- Service worker installeres og **appen laster uten nettverk** etter første besøk
- Tom-tilstand når alle utkast er godkjent, levende status i toppen
- Ingen JavaScript-feil, ingen sidescroll i iPhone-størrelse (390×844)
