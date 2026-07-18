# Cutover-plan — fra Netlify-piloten til plattformkjernen

*Cutover utføres ALDRI autonomt: den skjer først etter at Jonathan og Ole
Fabian har godkjent i TEST (to nøkler), og hvert steg under er manuelt og
reverserbart. Til da kjører begge løsningene i parallell.*

## Fase A — parallellkjøring (nå)

- Netlify-piloten kjører uendret (STABIL + TEST) — den er fasiten for de ansatte.
- Plattformen settes opp på Render fra `render.yaml` (Blueprint): tjenestene
  `laerling-test` (autodeploy fra grenen) og `laerling` (manuell deploy), hver
  med egen database. Kun Jonathan gjør dette (krever Render-konto).
- Pilotteamet prøver plattformen på `laerling-test` — uten forpliktelse.
  De ansatte merker ingenting.

## Fase B — innflytting (når TEST er godkjent med to nøkler)

1. Frys ny funksjonalitet i Netlify-appen (kveldsteamet informeres).
2. Hver bruker: gamle appen → `eksport.html` → kopier → nye appen → + →
   📦 Innflytting → lim inn → Importer → kontroller kvitteringen.
   Telefonen beholdes urørt til kvitteringen stemmer (tap av pilotdata er
   ikke akseptabelt; eksporten er idempotent og kan kjøres igjen).
3. Jonathan verifiserer i Sentral at timer/data er på plass.

## Fase C — lenkebyttet

- `bli-med.html` i Netlify-appen endres til å peke på Render-STABIL
  (én-linjes endring gjennom vanlig godkjenningsflyt).
- Ansatte legger den nye appen på hjemskjermen (samme veiviser-mønster).
- Netlify-siten består som frossen arkivkopi i minst 30 dager.

## Rollback (minutter, når som helst i B/C)

Netlify-appen er urørt og alle ansattes localStorage består → å gå tilbake er
å åpne den gamle hjemskjerm-appen igjen. Ingen sletting av Netlify-oppsettet
før 30 dager etter vellykket cutover og eksplisitt beslutning fra Jonathan.

## Netlify Forms-historikken (pilotloggen)

Beholdes i Netlify i 90 dager som referanse (les-tilgang via kommandosentralen
består i arkivkopien). Verdifulle innsikter er alt destillert inn i
backlog/rapporter. Deretter: eksporter CSV fra Netlify-panelet til
`pilot/arkiv/` og slett skjemaene (dataminimering). Beslutning: Jonathan.

## Prøverommet og kveldsteamet etter cutover

- Prøverommet (D7) forblir i Netlify-testkanalen til vinnerne er bygget som
  moduler på kjernen; deretter pensjoneres det.
- Kveldsteam-rutinen fortsetter mot dette repoet; leveranser til plattformen
  går til `kjerne/` med `laerling-test` som testkanal og samme to-nøkkel-regel
  (godkjenning skjer nå autentisert i selve appen — Sentral-fanen).

## Sjekkliste før cutover erklæres ferdig

- [ ] To nøkler på plattform-versjonen i TEST (autentiserte stemmer i Sentral)
- [ ] Alle pilotbrukere har importert med grønn kvittering
- [ ] ANTHROPIC_API_KEY satt på begge Render-tjenestene (Skrivemotoren virker)
- [ ] Backup verifisert i Render (gjenopprettingsprøve mot test-databasen)
- [ ] TOTP aktivert for admin-brukeren (Jonathan)
- [ ] Engangspassord byttet for alle brukere
- [ ] bli-med-lenken peker på ny STABIL
