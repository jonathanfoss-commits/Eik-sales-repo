---
id: sommerfest-henvendelse
title: Sommerfest-henvendelse (sesong)
stage: outreach
inputs: [prospect_name, prospect_company, prospect_role, antall_ansatte, personalization_hook, call_to_action]
version: 1
lang: no
---

## Formål
Sesongbasert henvendelse for å sikre sommerfest-bookinger tidlig (start jan–apr, jf.
[sesongkalenderen](../../sales/sesongkalender.md)). Mål: få kunden til å starte planleggingen med oss
mens uteservering, de beste datoene og lokalene fortsatt er ledige.

## Inndata
- **prospect_name** — fornavn. _f.eks._ `Marit`
- **prospect_company** — selskap. _f.eks._ `Nordic Tech AS`
- **prospect_role** — tittel. _f.eks._ `HR-sjef`
- **antall_ansatte** — omtrentlig antall som skal med. _f.eks._ `45`
- **personalization_hook** — en ekte grunn/kobling, om noen. _f.eks._
  `dere har ansatt mange i vår` eller `vi hjalp dere med julebordet`
- **call_to_action** — den ene forespørselen. _f.eks._ `en kjapp prat for å sikre en dato`

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends (norsk hospitality:
> bedriftsarrangementer, restaurantopplevelser, partnerskap). Tone: varm, profesjonell, direkte —
> lett og sommerlig uten å være pågående.
>
> Skriv en sommerfest-henvendelse på norsk (bokmål) til {{prospect_name}}, {{prospect_role}} i
> {{prospect_company}} (ca. {{antall_ansatte}} ansatte).
>
> Krav:
> - Hvis det finnes en vinkel, åpne med den (ekte, ikke oppdiktet): {{personalization_hook}}.
> - Hovedbudskap: sommerfest feirer et halvår godt jobbet og bygger lag — og de beste datoene og
>   uteserveringene fylles tidlig. Ekte, ærlig argument, ikke kunstig hastverk.
> - Antyd at vi tar hele jobben (lokale, mat, opplegg, gjerne uteservering) så de slipper logistikken.
> - Én tydelig, lavterskel forespørsel: {{call_to_action}}.
> - Under 110 ord. Lett å svare på fra mobilen.
> - Emnelinje under 6 ord, konkret og sesongaktuell.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
>
> Output: emnelinje, deretter e-postteksten.

## Notater & varianter
- **Timing:** send jan–apr. Nærmere sommeren endres vinkelen til «vi har fortsatt noen ledige
  datoer/uteserveringer».
- Er det en eksisterende kunde (f.eks. tidligere julebord), led med relasjonen, ikke med hastverk.
- Uteservering og lyse kvelder er den naturlige kroken — bruk den der lokalet tilbyr det
  ([Venues](../../crm/schema.md#venues--tblgmdhwepcy4596a) merket `Uteservering`).
- Følg opp med [`follow-up-sequence`](../follow-up/follow-up-sequence.md) dersom det blir stille.

## Eksempel
Eksisterende kunde (~45 ansatte) vi hjalp med julebordet → en kort, varm e-post som leder med
relasjonen, peker på at sommerfest-datoene med uteservering fylles, og foreslår en kjapp prat.
