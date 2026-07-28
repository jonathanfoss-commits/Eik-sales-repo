# Lansering — ledelsen + Ole Fabian (28. juli 2026)

*Mål: OP Bygg bruker Lærling som verktøyet til «alt». Publisert på admin-overstyring
28. juli (logget i til-godkjenning.md). Denne siden er Jonathans huskeliste.*

## Status i natt

- **STABIL kjører v0.18.1** (Lov- og regelsjekk, sikkerhetsherdingen, Musk-tiltakene) —
  publisert og verifisert.
- **v0.19.0 ligger klar i TEST:** ekte diktering (mikrofonknappen er ikke lenger demo)
  + kalenderfrist i purringa. Venter på godkjenning.

## Jonathans lanseringssteg (i rekkefølge)

1. **Prøv v0.19.0 i TEST-appen** — dikter et ekte tilbud i bilen. Godkjenn (helst med
   Ole Fabian — to nøkler; admin-overstyring er ditt kall).
2. **Si «publiser v0.19»** til Claude → merge → STABIL.
3. **Rotér sentralkoden:** Netlify → begge sitene → Environment variables →
   sett PILOT_API_KODE til ny selvvalgt kode → SMS til Ole Fabian.
4. **Skru av GitHub Pages** (Settings → Pages) — fortsatt åpent, fortsatt viktigst.
5. **Send lenkene:** Ole Fabian + daglig leder + driftsleder får
   `https://op-bygg-laerling-app.netlify.app/bli-med.html` (legg på hjemskjerm) —
   og `samarbeid/datasikkerhet.md`-kortversjonen som svar på sikkerhetsspørsmålet.
6. **Vis dem tre ting** (5 min): 🎙 dikter → utkast, ⚖️ Lov- og regelsjekk, ⏱ Timer.

## Integrasjoner (fullt utredet — se konsept/integrasjoner.md)

Elleve tjenester utredet med pris/innsats/personvern. Kortversjon: gratis-trioen push-varsler + vær i byggedagboken + Kartverket-adresseoppslag anbefales bygget først; regnskapsoppslag (Tripletex/Fiken) når du vet hvilket system OP Bygg har; SMS (Sveve) og e-post-sending (Brevo) ligger klare som beslutninger. To spørsmål til lanseringsmøtet: hvilket regnskapssystem bruker dere, og hvor ofte kontraherer dere UE-er?

## Etter lansering

- Pilotloggen viser nå reell bruk per verktøy (`innspill/pilotlogg-innsikt.md`
  oppdateres av kveldsteamet) — den avgjør hva som bygges videre.
- DPA hos Anthropic + senket kontogrense (~$20) står fortsatt på listen din.
