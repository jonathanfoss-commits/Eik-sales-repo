---
id: partnership-pitch
title: Partnerskap / Samarbeid (henvendelse)
stage: outreach
inputs: [partner_name, partner_company, partner_type, shared_value, proposed_collaboration, call_to_action]
version: 1
lang: no
variants: [partnership-pitch.en.md]
---

## Formål
Åpne en samtale om et løpende partnerskap eller markedssamarbeid — for eksempel med en restaurant,
et lokale, en leverandør eller en komplementær merkevare. I motsetning til kald henvendelse (som
selger en tjeneste), rammer dette inn en **gjensidig mulighet**. Engelsk variant for
internasjonale mottakere: [`partnership-pitch.en.md`](partnership-pitch.en.md).

## Inndata
- **partner_name** — fornavn på kontaktpersonen.
- **partner_company** — virksomheten deres.
- **partner_type** — _f.eks._ `restaurant`, `lokale/venue`, `drikkevaremerke`, `arrangementspartner`.
- **shared_value** — overlappet som gjør dette logisk. _f.eks._
  `vi betjener begge premium bedriftskunder i Oslo`.
- **proposed_collaboration** — den konkrete idéen. _f.eks._
  `henvise bedriftsbookinger til hverandre`.
- **call_to_action** — forespørselen. _f.eks._ `en kaffe for å utforske det`.

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends (norsk hospitality:
> bedriftsarrangementer, restaurantopplevelser, partnerskap). Tone: varm, profesjonell, direkte og
> samarbeidsorientert — likeverdig, aldri selgersk.
>
> Skriv en partnerskapshenvendelse på norsk (bokmål) til {{partner_name}} i {{partner_company}}, en
> {{partner_type}}.
>
> Krav:
> - Ram det inn som en gjensidig mulighet, ikke som et salg av våre tjenester.
> - Nevn det felles grunnlaget tydelig: {{shared_value}}.
> - Foreslå samarbeidet konkret og uforpliktende: {{proposed_collaboration}}.
> - Én tydelig, lavterskel forespørsel: {{call_to_action}}.
> - Under 130 ord. Trygg, men ydmyk; anta at de er travle og dyktige.
> - Lag en kort, konkret emnelinje.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
>
> Output: emnelinje, deretter e-postteksten.

## Notater & varianter
- Vektlegg **hva de får ut av det** først; partnere sier ja til gjensidig oppside, ikke tjenester.
- Ved et varmt/eksisterende forhold: dropp innrammingen og gå rett på idéen.
- Hold den første forespørselen liten (en prat), ikke en signert avtale.

## Eksempel
partner=`Lars` i `Bryggen Bistro` (restaurant); shared_value=`vi betjener begge premium
bedriftskunder i sentrum`; proposed_collaboration=`sende overflow-bookinger til hverandre`;
call_to_action=`en kaffe neste uke`. → En tekst på ca. 110 ord som foreslår en enkel
henvisningsordning og en kaffe for å snakke om det.
