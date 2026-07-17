# Godkjenningsflyt — to nøkler før noe går live

Regelen: **ingen endring når OP Byggs ansatte før både Jonathan og Ole Fabian har godkjent.**
Ole Fabian godkjenner i appen (uten GitHub); Jonathan godkjenner ved å publisere.

## De to kanalene

| Kanal | URL (Netlify-site) | Hvem | Hva |
|---|---|---|---|
| **TEST** | site med «test» i navnet, f.eks. `laerling-app-test.netlify.app` | Kun Jonathan + Ole Fabian | Kveldsteamets siste forslag |
| **STABIL** | `laerling-app.netlify.app` (senere app.dittdomene.no) | Alle ansatte i OP Bygg | Godkjent versjon |

Appen oppdager selv kanalen (vertsnavn som inneholder «test») og viser da et gult
**TESTVERSJON**-banner med «✓ Godkjenn / ✗ Avvis»-knapper. Stemmen logges i pilotloggen
med navn og versjonsnummer. Versjonsnummeret vises nederst på Verktøy-fanen i begge kanaler.

## Flyten, steg for steg

1. **Kveldsteamet** (hver kveld kl. 21) implementerer fra inbox/backlog på branchen
   `kveldsteam-forslag`, bumper versjonsnummeret i appen, oppsummerer i
   `innspill/til-godkjenning.md`, og pusher. **Rører aldri hovedbranchen.**
2. **Automatisk:** test-siten deployes i det panelet pusher (krever Git-kobling —
   se `netlify-github.md`; frem til den er gjort: Jonathan publiserer ZIP manuelt).
3. **Begge godkjenner:** Jonathan og Ole Fabian åpner TEST-URL-en, prøver endringen,
   trykker «Godkjenn». To GODKJENT-stemmer i pilotloggen = klart.
4. **Jonathan publiserer til STABIL** (= hans godkjenning i praksis): merger
   `kveldsteam-forslag` inn i hovedbranchen og publiserer. Alle ansatte har ny versjon.
   Ved AVVIST: Jonathan noterer hvorfor i `innspill/inbox.md`, og teamet tar det neste kveld.

## Køregel (justert 17. juli, besluttet av Jonathan)

- Panelet **stopper ikke** selv om en leveranse venter på godkjenning — det bygger videre
  så lenge **færre enn tre** leveranser står i kø i `innspill/til-godkjenning.md`.
- **Godkjenning skjer samlet:** en stemme på nyeste testversjon godkjenner alt til og med
  den (fulltesten kjøres kumulativt hver natt, så alt i køen er testet sammen).
- Ved tre eller flere i kø: panelet står over natten og minner om at dere må godkjenne
  eller avvise. **Hastesaker (⚠ HASTER) behandles alltid**, uansett kø.

## Ansatte i OP Bygg

- Alle ansatte får **STABIL-lenken** (og legger den på hjemskjermen). De ser aldri
  testversjoner og merker aldri eksperimenter.
- Første gang appen åpnes skriver de inn **fornavnet sitt** — alle innspill og
  godkjenninger merkes da med navn i pilotloggen, så teamet vet hvem som melder hva.
- Alle ansatte kan sende innspill (👍/🐞/💡) fra Rapport-fanen — men bare stemmer fra
  Jonathan og Ole Fabian teller som godkjenning (håndheves av at kun dere to får TEST-lenken).

## Hvorfor dette er riktig nivå nå

Ordentlig pålogging/roller krever backend og brukeradministrasjon — feil pengebruk i pilot.
Denne modellen gir det samme i praksis: separate kanaler, navngitte stemmer, full logg, og
null endringer hos ansatte uten to godkjenninger. Når fullversjonen bygges, arver den
flyten med ekte innlogging.
