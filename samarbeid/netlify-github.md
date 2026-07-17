# Koble Netlify til GitHub — så publisering skjer helt av seg selv

Når dette er gjort, forsvinner all ZIP-opplasting: kveldsteamets forslag lander automatisk
på test-siten, og godkjente endringer går automatisk til alle ansatte når Jonathan merger.
`netlify.toml` i repo-roten forteller Netlify at appen ligger i `app/` — resten er fem
klikk per site.

## Én gang: gi Netlify tilgang til repoet

1. Netlify → siten **op-bygg-laerling-app** → **Project configuration → Build & deploy →
   Continuous deployment → Link repository** (eller «Set up continuous deployment»)
2. Velg **GitHub** → autoriser → velg repoet **jonathanfoss-commits/Eik-sales-repo**
3. **Branch to deploy:** `claude/ai-automation-subscription-concept-647y35` (hovedbranchen)
4. Publish directory skal fylles automatisk fra `netlify.toml` (`app`) — sjekk at det står `app`
5. Deploy site ✔

## Samme for test-siten

6. Siten **op-bygg-laerling-app-test** → samme flyt, samme repo — men
   **Branch to deploy: `kveldsteam-forslag`**
7. Nå deployes hvert kveldsteam-forslag automatisk til testkanalen i det sekundet
   panelet pusher.

*(Nettside-siten `op-bygg-laerling-nett` kan forbli manuell — den endres sjelden.
Vil du koble den også: samme flyt, men sett publish directory manuelt til `pitch`
og legg til en redirect fra `/` til `/landing.html`, eller si fra så ordner jeg
en indeks-side.)*

## Flyten etterpå (helautomatisk)

| Hendelse | Hva skjer — uten at noen laster opp noe |
|---|---|
| Kveldsteamet pusher til `kveldsteam-forslag` | Test-siten oppdateres automatisk |
| Jonathan + Ole Fabian godkjenner i testappen | (logges i pilotloggen) |
| Jonathan merger forslaget inn i hovedbranchen | Stabil-siten oppdateres automatisk — alle ansatte har ny versjon |

Merge-kommandoen Jonathan (eller en Claude Code-økt) kjører etter to godkjenninger:

```
git checkout claude/ai-automation-subscription-concept-647y35
git merge origin/kveldsteam-forslag
git push origin claude/ai-automation-subscription-concept-647y35
```

— eller be Claude: «to godkjenninger er inne — merge og publiser».
