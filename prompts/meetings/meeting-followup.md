---
id: meeting-followup
title: Oppfølging & oppsummering etter møte
stage: meetings
inputs: [attendees, meeting_summary, agreed_next_steps, open_questions, owner_actions]
version: 1
lang: no
---

## Formål
Gjør rå møtenotater om til (a) en presis oppsummerings-e-post til kunden/partneren og (b) en ryddig
CRM-oppdatering. Å sende en skarp oppsummering raskt er en av de mest verdifulle vanene i salg — den
bekrefter felles forståelse og holder fremdriften.

## Inndata
- **attendees** — hvem som var med i møtet.
- **meeting_summary** — hva som ble diskutert (grove notater er greit).
- **agreed_next_steps** — hva begge parter ble enige om å gjøre, med ansvarlig og dato.
- **open_questions** — det som står uavklart.
- **owner_actions** — konkret hva Jonathan/Eik & Friends forpliktet seg til.

## Prompt
> Du er Jonathan Foss' assistent (Sales Manager, Eik & Friends). Ut fra notatene under, lag to
> resultater på norsk (bokmål).
>
> Deltakere: {{attendees}}
> Oppsummering: {{meeting_summary}}
> Avtalte neste steg: {{agreed_next_steps}}
> Åpne spørsmål: {{open_questions}}
> Våre forpliktelser: {{owner_actions}}
>
> **Resultat 1 — Oppsummerings-e-post** (til å sende kunden/partneren):
> - Varm takk på én linje.
> - 2–4 punkter som bekrefter det som ble avtalt.
> - Tydelige neste steg med ansvarlig og dato.
> - Én linje som inviterer til å rette opp hvis noe er feil.
> - Under 130 ord. Tone: varm, profesjonell, direkte.
>
> **Resultat 2 — CRM-oppdatering** (for våre egne notater):
> - Nytt pipeline-steg (hvis endret) og hvorfor.
> - Neste steg + dato.
> - Nye fakta å registrere om kunden/kontakten.
>
> Merk de to resultatene tydelig.

## Notater & varianter
- Send oppsummeringen innen noen timer, mens det er ferskt — hurtighet signaliserer profesjonalitet.
- Var forpliktelsene vage? Foreslå konkrete datoer i stedet for å la dem stå åpne.
- Hold våre forpliktelser realistiske; ikke lov for mye i oppsummeringen.

## Eksempel
Etter en kartleggingssamtale → en oppsummering på ~90 ord som bekrefter briefen og en
oppfølgingsdato, pluss en CRM-oppdatering som flytter avtalen fra `Kvalifisert` til `Tilbud` med en
dato for neste steg.
