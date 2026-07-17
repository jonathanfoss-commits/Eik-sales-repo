# Til godkjenning — kveldsteamets leveranser som venter

<!-- Kveldsteamet fører inn: versjon, dato, hva som er endret og hvorfor.
     Jonathan/Ole Fabian godkjenner i TEST-appen; Jonathan flytter til STABIL. -->

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
