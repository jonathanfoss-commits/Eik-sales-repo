---
id: cold-outreach-no
title: Kald Henvendelse (e-post)
stage: outreach
inputs: [prospect_name, prospect_company, prospect_role, personalization_hook, offering, call_to_action]
version: 1
lang: no
source: cold-outreach.md
---

## Formål
Skriv en kort, personlig førstegangshenvendelse til en potensiell kunde som ikke kjenner oss ennå.
Mål: få et svar, ikke lande en avtale. Brukes når kontakten passer ICP-en
([`../../sales/icp.md`](../../sales/icp.md)). Norsk variant av
[`cold-outreach.md`](cold-outreach.md).

## Inndata
- **prospect_name** — fornavn. _f.eks._ `Marit`
- **prospect_company** — selskap. _f.eks._ `Nordic Tech AS`
- **prospect_role** — tittel. _f.eks._ `HR-sjef`
- **personalization_hook** — én konkret, sann grunn til at du tar kontakt nå. _f.eks._
  `de har akkurat annonsert et nytt kontor i Oslo med 40 ansatte`
- **offering** — hva Eik & Friends kan gjøre for dem. _f.eks._ `arrangere lanseringsmiddagen deres`
- **call_to_action** — den ene forespørselen. _f.eks._ `en kort prat på 15 minutter neste uke`

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends — et norsk
> hospitality-selskap som spesialiserer seg på bedriftsarrangementer, restaurantopplevelser og
> partnerskap. Tone: varm, profesjonell og direkte. Ingen svulstige ord, ingen press, ingen
> stammespråk.
>
> Skriv en kald henvendelse på norsk (bokmål) til {{prospect_name}}, {{prospect_role}} i
> {{prospect_company}}.
>
> Krav:
> - Åpne med en konkret, ekte referanse til: {{personalization_hook}}. Ikke smigre, ikke dikt opp.
> - Knytt det i én–to setninger til hvordan vi kan hjelpe: {{offering}}.
> - Ha nøyaktig én tydelig, lavterskel forespørsel: {{call_to_action}}.
> - Hold den under 120 ord. Korte setninger. Lett å svare på fra mobilen.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
> - Lag en emnelinje på under 6 ord som er konkret, ikke selgersk.
>
> Output: emnelinje, deretter e-postteksten. Ingenting annet.

## Notater & varianter
- Hvis vinkelen er svak eller oppdiktet, **stopp** og finn en ekte først — en generisk e-post er
  verre enn ingen.
- Varmere intro (felles kontakt/anbefaling)? Led med koblingen i stedet for vinkelen.
- Bruk «du/dere»-form; norsk forretningstone er mindre formell enn engelsk.

## Eksempel
**Inndata:** prospect_name=`Marit`, prospect_company=`Nordic Tech AS`, prospect_role=`HR-sjef`,
personalization_hook=`det nye Oslo-kontoret deres`, offering=`arrangere lanseringsmiddagen`,
call_to_action=`en kjapp prat på 15 min neste uke`.

**Output (illustrasjon):**
> **Emne:** Det nye Oslo-kontoret
>
> Hei Marit,
>
> Så at Nordic Tech åpner kontor i Oslo — gratulerer med veksten. Slike øyeblikk er verdt å
> markere, og det er akkurat det vi gjør: vi lager lanseringsmiddager og samlinger som faktisk
> føles personlige, ikke korporative.
>
> Hadde en kjapp prat på 15 minutter neste uke vært verdt det, for å se om vi passer sammen?
>
> Beste hilsen,
> Jonathan — Eik & Friends
