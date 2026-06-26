---
id: julebord-henvendelse
title: Julebord-henvendelse (sesong)
stage: outreach
inputs: [prospect_name, prospect_company, prospect_role, antall_ansatte, personalization_hook, call_to_action]
version: 1
lang: no
---

## Formål
Sesongbasert henvendelse for å sikre julebord-bookinger tidlig (start aug–sep, jf.
[sesongkalenderen](../../sales/sesongkalender.md)). Mål: få kunden til å starte planleggingen med oss
mens de beste datoene og lokalene fortsatt er ledige.

## Inndata
- **prospect_name** — fornavn. _f.eks._ `Marit`
- **prospect_company** — selskap. _f.eks._ `Nordic Tech AS`
- **prospect_role** — tittel. _f.eks._ `HR-sjef`
- **antall_ansatte** — omtrentlig antall som skal med. _f.eks._ `45`
- **personalization_hook** — en ekte grunn/kobling, om noen. _f.eks._
  `dere vokste mye i år` eller `vi hjalp dere med sommerfesten`
- **call_to_action** — den ene forespørselen. _f.eks._ `en kjapp prat for å sikre en dato`

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends (norsk hospitality:
> bedriftsarrangementer, restaurantopplevelser, partnerskap). Tone: varm, profesjonell, direkte —
> festlig uten å være pågående.
>
> Skriv en julebord-henvendelse på norsk (bokmål) til {{prospect_name}}, {{prospect_role}} i
> {{prospect_company}} (ca. {{antall_ansatte}} ansatte).
>
> Krav:
> - Hvis det finnes en vinkel, åpne med den (ekte, ikke oppdiktet): {{personalization_hook}}.
> - Hovedbudskap: de beste julebord-datoene og lokalene fylles tidlig — ta grep nå for å sikre seg.
>   Dette er et ekte, ærlig argument, ikke kunstig hastverk.
> - Antyd at vi tar hele jobben (lokale, mat, opplegg) så de slipper logistikken.
> - Én tydelig, lavterskel forespørsel: {{call_to_action}}.
> - Under 110 ord. Lett å svare på fra mobilen.
> - Emnelinje under 6 ord, konkret og sesongaktuell.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
>
> Output: emnelinje, deretter e-postteksten.

## Notater & varianter
- **Timing er alt:** send i aug–sep. I oktober er de beste datoene ofte borte — da bør vinkelen
  endres til «vi har fortsatt noen ledige datoer».
- Er det en eksisterende kunde (f.eks. tidligere sommerfest), led med relasjonen, ikke med hastverk.
- Hold det festlig og varmt — julebord er en glede, ikke en plikt.
- Følg opp med [`follow-up-sequence`](../follow-up/follow-up-sequence.md) dersom det blir stille.

## Eksempel
Eksisterende kunde (~45 ansatte) vi hjalp med sommerfesten → en kort, varm e-post som leder med
relasjonen, minner om at julebord-datoene fylles, og foreslår en kjapp prat for å sikre en dato.
