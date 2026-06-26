# CRM-helsesjekk — 26.06.2026

Øyeblikksbilde av Airtable-tabellen **Avtaler** (127 rader) per 26.06.2026. Lesebasert — ingen data
er endret. Tallene er hentet via Airtable-API og kan reproduseres. Anbefalingene nederst er forslag
til godkjenning.

## Sammendrag (det viktigste)
1. **86 avtaler står som `Bekreftet` med en arrangementsdato som er passert.** De er etter all
   sannsynlighet gjennomført og bør flyttes til `Gjennomført`. Dette er den største kilden til støy
   i pipelinen akkurat nå — «bekreftet» blandes med «levert», og forecasten blir misvisende.
2. **13 åpne avtaler har forfalt oppfølging** (Neste oppfølging passert). Flere er
   gavekort-/sommergave-leads med oppfølging satt til 18.06 — de er ~8 dager på overtid og i ferd
   med å bli kalde.
3. **3 `Pending`-avtaler mangler oppfølgingsdato** — og de er store (500 000 kr hver):
   Autopay (Heldagsevent TAKET, 01.09), ABG Sundal Collier (Sommerfest 2027) og ABG Sundal Collier
   (Julebord 2027). Til sammen **1,5 MNOK** uten en planlagt neste handling.

## Pipeline-hygiene: Bekreftet vs. Gjennomført
| Tilstand | Antall |
| --- | --- |
| `Bekreftet` med **passert** arrangementsdato (bør bli `Gjennomført`) | **86** |
| `Bekreftet` med **fremtidig** arrangementsdato (reelt kommende) | 9 |

De 86 strekker seg tilbake til januar (bl.a. «Dining by Amex jan»-events og 17. mai-bookinger) og
gjør det umulig å lese reell kommende omsetning rett fra Status. **Anbefaling:** flytt disse til
`Gjennomført`, og innfør en regel (n8n eller Airtable-automasjon) som automatisk flytter
`Bekreftet → Gjennomført` når «Dato for selskap» passerer. Da holder pipelinen seg ren av seg selv.

## Reelt kommende, bekreftet omsetning (forecast)
9 bekreftede avtaler med fremtidig dato — til sammen **≈ 1,82 MNOK**:

| Avtale | Dato | Verdi (kr) |
| --- | --- | --- |
| Accenture – Sommerfest Amazonia | 26.06 | 300 000 |
| Summer Closing Party (privat) | 27.06 | 100 000 |
| Summerparty lørdager – juli (privat) | 04.07 | 250 000 |
| Artic – Sommerfest Amazonia | 20.08 | 150 000 |
| Viaplay PL-lansering (ESS) | 21.08 | 300 000 |
| Klubbkveld VTS (privat) | 29.08 | 250 000 |
| Folketrygdfondet – Julebord Kastellet | 27.11 | 150 000 |
| AkerBP – Kafe Republik (julebord) | 27.11 | 80 000 |
| Føyen Advokater – Kastellet (julebord) | 04.12 | 240 000 |

## Åpne avtaler med forfalt oppfølging (handle nå)
13 avtaler. De største/mest tidskritiske:

| Avtale | Status | Forfalt siden | Merknad |
| --- | --- | --- | --- |
| **Janteloppet – Afterparty 500+** | I dialog | 13.06 | **600 000 kr**, lokale søkes, event 22.08 — stor mulighet som glir |
| DNB – VM-event Heim Gjøvik | I dialog | 16.06 | Bedriftsevent |
| Plus Arkitektur – Lunsj Brød & Sirkus | Ny lead | 13.06 | 45 000 kr, event 27.08 |
| 10× gavekort-/månedsavtale-leads | I dialog | 18.06 | Kvale, Arntzen Grette, BAHR, SANDS, Codex, Haavind, Conscia, Arkwright, CatalystOne, Worldwiders |

De 10 gavekort-leadene er «sommergaver»/månedsavtaler — lavt estimat hver, men en samlet,
gjentakende inntektsstrøm. En felles oppfølgingsrunde denne uken er sannsynligvis høy avkastning for
lav innsats.

## Anbefalinger (forslag — krever din godkjenning)
1. **Rydd statusene:** flytt de 86 passerte `Bekreftet` til `Gjennomført`. Kan gjøres som en
   engangsoppdatering + en varig automasjonsregel. *(Jeg gjorde dette ikke automatisk — 86 rader er
   en stor endring som bør godkjennes først.)*
2. **Tøm forfalt-listen:** ta en oppfølgingsrunde på de 13. Prioriter Janteloppet (600k) og DNB.
   AI-agenten kan lage svarutkast for alle på minutter.
3. **Sett oppfølgingsdato på de 3 Pending-avtalene** (1,5 MNOK) — ingen stor avtale bør stå uten en
   planlagt neste handling.
4. **Regel fremover:** ingen åpen avtale uten «Neste oppfølging»; ingen `Bekreftet` med passert dato.
   Begge kan håndheves automatisk i n8n.

## Metode
Tall hentet 26.06.2026 via Airtable-API mot basen `appzIFWfzob6WEhnq`, tabell Avtaler. «Passert» =
Dato for selskap < 26.06.2026. «Forfalt oppfølging» = Neste oppfølging < 26.06.2026 og Status i
{Ny lead, I dialog, Tilbud sendt, Pending}. Ingen rader ble endret under analysen.
