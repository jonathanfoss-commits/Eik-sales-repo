# SAGA-migrering – manuelle steg utenfor repoet

Alt i repoet er migrert automatisk. Dette må/kan gjøres manuelt:

## Må gjøres

1. **Ingenting haster.** Redirects og nøkkel-fallbacks gjør at alt gammelt
   fortsetter å virke: gamle bokmerker/PWA-er sendes til nye adresser, og
   lagrede nøkler/data leses som før (samme origin).

## Bør gjøres (når det passer)

2. **GitHub repo-navn:** `Eik-sales-repo` → f.eks. `saga`. GitHub redirecter
   gamle repo-URL-er automatisk, MEN GitHub Pages-domenet endres til
   `https://<bruker>.github.io/saga/` → da må:
   - Fabrikkens *Pages-repo*-felt (System → Synk & publisering) oppdateres
   - PAT-ens repo-tilgang oppdateres til nytt navn (fine-grained PAT-er
     følger repoet, sjekk likevel)
   - Bokmerker/PWA-installasjoner legges inn på nytt
   - Publiserte falske dører får ny base-URL (gamle lenker i annonser dør!)
   Anbefaling: vent med repo-rename til ingen aktive tester er live.
3. **iOS-appen:** åpne `ios/Jarvis` i Xcode → Project Navigator → marker
   prosjektet → endre navn til `Saga` (Xcode håndterer referansene) →
   oppdater Display Name og bundle-id. Brukersynlige strenger («JARVIS»)
   ligger i Swift-filene og kan søkes/erstattes i Xcode etterpå.
4. **Design-assets:** arc reactor-ikonene (`/icons/*.png`, iOS-appikoner)
   er eksterne bilder og kan ikke om-farges i kode. Lag nye i Tiffany Blue
   (#0ABAB5) ved anledning; SVG-favicon i appene er allerede oppdatert.
5. **PWA-reinstallasjon:** installerte «JARVIS»-apper på hjemskjerm peker på
   gammel rot. De redirectes automatisk, men for riktig navn/ikon: slett og
   legg til på nytt fra `…/saga/modules/assistant/`.

## Ikke aktuelt i denne stacken (nevnt i oppgaven)

- **Vercel-prosjekter, n8n-webhooks, databaser, cron-jobber i prod,
  env-variabler i prod, egne domener:** finnes ikke – systemet er statisk
  GitHub Pages + localStorage. Skulle noe av dette komme til senere, er
  `saga/docs/automation.md` stedet å starte.

## Verifisering etter merge

- `…/` → redirecter til `…/saga/modules/assistant/`
- `…/aeis/` og `…/factory/` → redirecter til nye moduler
- Fabrikken: data, PAT og synk intakt (samme origin) – sjekk System-fanen
- Kjør en synk (⇡) og se at `factory-data`-repoet får ny commit
