---
id: tilbud-bedriftsarrangement
title: Generer tilbud — bedriftsarrangement
stage: proposal
inputs: [kundeselskap, kontaktnavn, anledning, antall_gjester, ønsket_dato, behov_og_ønsker, budsjettramme, hva_inngår, pris, gyldig_til]
version: 1
lang: no
---

## Formål
Lag et førsteutkast til et tilbud på et bedriftsarrangement, basert på
[`templates/tilbud-bedriftsarrangement.md`](../../templates/tilbud-bedriftsarrangement.md). Brukes i
`Tilbud`-steget etter kartlegging, når behovet er forstått.

## Inndata
- **kundeselskap** — kundens selskap. _f.eks._ `Nordic Tech AS`
- **kontaktnavn** — kontaktpersonen. _f.eks._ `Marit Hansen`
- **anledning** — hva som skal feires/oppnås. _f.eks._ `lansering av nytt Oslo-kontor`
- **antall_gjester** — omtrentlig antall. _f.eks._ `45`
- **ønsket_dato** — dato eller tidsrom. _f.eks._ `fredag 18. september`
- **behov_og_ønsker** — det vi lærte i kartleggingen (stemning, må-haver, hensyn).
- **budsjettramme** — kjent ramme, om noen. _f.eks._ `~150 000 NOK`
- **hva_inngår** — leveransepunktene vi tilbyr.
- **pris** — prislinjer (post, beskrivelse, beløp).
- **gyldig_til** — tilbudets gyldighetsdato.

## Prompt
> Du skriver et tilbud på vegne av Jonathan Foss, Sales Manager i Eik & Friends (norsk hospitality:
> bedriftsarrangementer, restaurantopplevelser, partnerskap). Tone: varm, profesjonell, konkret og
> trygg — uten svulst.
>
> Bruk strukturen i malen `templates/tilbud-bedriftsarrangement.md`. Fyll ut alle seksjoner på norsk
> (bokmål) basert på inndataene under. Skriv naturlig forretningsnorsk.
>
> - Kunde: {{kontaktnavn}}, {{kundeselskap}}
> - Anledning: {{anledning}}
> - Gjester: ca. {{antall_gjester}}
> - Ønsket dato: {{ønsket_dato}}
> - Behov og ønsker: {{behov_og_ønsker}}
> - Budsjettramme: {{budsjettramme}}
> - Dette inngår: {{hva_inngår}}
> - Pris: {{pris}}
> - Gyldig til: {{gyldig_til}}
>
> Krav:
> - **Vår forståelse**: 1–3 setninger som speiler {{behov_og_ønsker}} — vis at vi har lyttet.
> - **Forslag til opplevelse**: et tydelig konsept tilpasset anledningen og gjestegruppen.
> - **Dette inngår**: konkrete punkter fra {{hva_inngår}}.
> - **Pris**: presenter prislinjene ryddig; sum til slutt; nevn at priser er eks. mva.
> - **Neste steg**: konkret og lavterskel, med henvisning til {{gyldig_til}}.
> - Ikke dikt opp leveranser eller priser utover det som er oppgitt. Mangler noe, marker det med
>   `[avklares]` i stedet for å finne på.
>
> Output: hele tilbudet som ferdig tekst, klart til gjennomgang og innliming i Google Docs.

## Notater & varianter
- Dette er et **førsteutkast** — Jonathan gjennomgår og justerer før sending.
- For enklere arrangementer: be modellen droppe program-seksjonen.
- Marker alltid usikre tall som `[avklares]` fremfor å gjette — et tilbud må være etterrettelig.
- Etter at tilbudet er sendt: logg aktivitet og sett avtalen til `Tilbud` med neste steg + dato.

## Eksempel
Lanseringsmiddag for 45 gjester, ramme ~150 000 NOK → et tilbud som speiler ønsket om noe personlig
og ikke-korporativt, foreslår et konsept, lister leveransene, viser prisoppsett med sum, og avslutter
med en konkret oppfordring om å holde av datoen innen gyldighetsfristen.
