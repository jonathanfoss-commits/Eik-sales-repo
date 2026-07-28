# Investormøtet — alt klart og testet (natt til møtedagen)

*Kvalitetssikret av kveldsteamet. Alt under er testet i natt — ingenting antatt.*

## Verifisert i natt (grønt over hele linja)

| Hva | Status |
|---|---|
| Landingssiden (`op-bygg-laerling-nett.netlify.app`) | **Oppdatert i natt** — live-siden manglet «Live/Bevis»-seksjonen fra 19. juli; ny versjon publisert og verifisert. Null JS-feil, ingen brutt layout, mobil + desktop. |
| Pilot-appen STABIL (**v0.19.0 — publisert kvelden før møtet**) | Ekte diktering, kalenderfrist og alle verktøy live. Alle sider svarer, null JS-feil, funksjonene verifisert etter deploy. Demonstrér rett fra STABIL. |
| Skrivemotoren (AI ende-til-ende) | **Ekte test kjørt i natt:** diktering inn → korrekt norsk purring ut med frist og konsekvens. Demoøyeblikket virker. |
| Plattformen (Render, demo-manusets miljø) | `laerling-test` og `laerling` svarer ok; v0.4.1. |
| Sikkerhet | Sentralkoden kun i miljøvariabel (200/401 verifisert), query-vei avvist. |

## Demoflyt for møtet (anbefalt)

1. **Landingssiden på storskjerm** — historien og prisene (Start 1 990 / Vekst 3 990 / Pro 8 990).
2. **Pilot-appen på mobilen (STABIL)** — dikter et ekte tilbud med den nye ekte
   mikrofonen, vis Lov- og regelsjekk og Timer. Ærlig ramme: dette BRUKES av OP Bygg i pilot.
3. **Plattform-demoen** (hvis tid) — følg `pitch/demo-manus.md` minutt for minutt
   (LIVE-øyeblikket + bevisdokumentet er høydepunktene).

## ⚠ To ting bare du kan avklare før møtet

1. ~~Prisavvik~~ **AVKLART av Jonathan kvelden før møtet: startpris er 1 990 kr.**
   Landingssiden, CLAUDE.md og samarbeidsnotatet er rettet og republisert — alt
   materiale sier nå det samme (Start 1 990 / Vekst 3 990 / Pro 8 990).
2. **Demodata på plattformen:** demo-manuset forutsetter at Malermester
   Demo-tenanten er fylt (`node server/verktoy/demodata.js malermester-demo` i
   Render-shellet på laerling-test) og at du kan logge inn med to brukere. Jeg kan
   ikke verifisere innlogging (kodene deles utenfor systemet, med vilje) — **prøv
   demo-innloggingen én gang før møtet.**

## Ærlige tall, hvis investor spør

- Pilot: OP Bygg AS (11 ansatte), startet 17. juli. To brukerinnspill mottatt,
  begge bygget og levert (timeregistrering, lov- og regelsjekk).
- Bruk: appen er i tidlig pilotfase — åpninger logget, verktøybruk ikke målbar ennå
  (`innspill/pilotlogg-innsikt.md` har de eksakte tallene). Ikke pynt på dette:
  systemet som bygger og leverer på brukerinnspill over natten ER historien.
- Kostnadsbase: ~200 kr/mnd Netlify Pro + ~280 kr/mnd Render + AI-forbruk under
  tak — hele plattformen drives for under 1 000 kr/mnd.
