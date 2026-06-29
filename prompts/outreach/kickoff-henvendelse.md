---
id: kickoff-henvendelse
title: Kickoff-henvendelse (sesong)
stage: outreach
inputs: [prospect_name, prospect_company, prospect_role, antall_ansatte, personalization_hook, call_to_action]
version: 1
lang: no
---

## Formål
Sesongbasert henvendelse for kickoff-/oppstartsarrangementer (typisk jan og aug, ved årsstart og
oppstart etter ferie, jf. [sesongkalenderen](../../sales/sesongkalender.md)). Mål: posisjonere oss
som stedet som sparker i gang halvåret — samle laget, sette retning, feire starten.

## Inndata
- **prospect_name** — fornavn. _f.eks._ `Marit`
- **prospect_company** — selskap. _f.eks._ `Nordic Tech AS`
- **prospect_role** — tittel. _f.eks._ `HR-sjef` / `CEO`
- **antall_ansatte** — omtrentlig antall som skal med. _f.eks._ `45`
- **personalization_hook** — en ekte grunn/kobling, om noen. _f.eks._
  `dere går inn i et nytt år med ny strategi` eller `dere har vokst og skal samle laget`
- **call_to_action** — den ene forespørselen. _f.eks._ `en kjapp prat om opplegg og dato`

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends (norsk hospitality:
> bedriftsarrangementer, restaurantopplevelser, partnerskap). Tone: varm, profesjonell, direkte —
> energisk uten å være pågående.
>
> Skriv en kickoff-henvendelse på norsk (bokmål) til {{prospect_name}}, {{prospect_role}} i
> {{prospect_company}} (ca. {{antall_ansatte}} ansatte).
>
> Krav:
> - Hvis det finnes en vinkel, åpne med den (ekte, ikke oppdiktet): {{personalization_hook}}.
> - Hovedbudskap: en god kickoff samler laget og setter tonen for halvåret — vi kombinerer
>   møterom/arena for det faglige med en sosial ramme (mat, opplevelse) i ett lokale.
> - Antyd at vi tar hele jobben (lokale, mat, opplegg, plass til både program og fest) så de slipper
>   logistikken.
> - Én tydelig, lavterskel forespørsel: {{call_to_action}}.
> - Under 110 ord. Lett å svare på fra mobilen.
> - Emnelinje under 6 ord, konkret og sesongaktuell.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
>
> Output: emnelinje, deretter e-postteksten.

## Notater & varianter
- **Timing:** send i god tid før jan- og aug-oppstart. Kickoff planlegges ofte raskt — vær konkret
  på at vi kan løse både program og sosialt i ett.
- Vinkelen er «fag + fest i ett» — skiller seg fra ren julebord/sommerfest (kun sosialt).
- Pek på lokaler som tar både møte/plenum og bespisning ([Venues](../../crm/schema.md#venues--tblgmdhwepcy4596a),
  f.eks. `Konferanse` + `Stort event 150+`).
- Følg opp med [`follow-up-sequence`](../follow-up/follow-up-sequence.md) dersom det blir stille.

## Eksempel
Selskap (~45 ansatte) med ny strategi for året → en kort, energisk e-post som leder med årsstarten,
foreslår fag + sosialt i ett lokale, og ber om en kjapp prat om opplegg og dato.
