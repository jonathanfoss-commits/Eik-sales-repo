---
id: follow-up-sequence
title: Oppfølgingssekvens
stage: follow-up
inputs: [prospect_name, context, last_touch, touch_number, new_value]
version: 1
lang: no
variants: [follow-up-sequence.en.md]
---

## Formål
Lag den neste oppfølgingsmeldingen i en sekvens — for å bevege en samtale som har stilnet, eller
tilføre verdi etter en tidligere kontakt. Iherdig uten å være masete: hver kontakt tilfører noe,
ikke bare «sjekker inn». Engelsk variant for internasjonale mottakere:
[`follow-up-sequence.en.md`](follow-up-sequence.en.md).

## Inndata
- **prospect_name** — fornavn.
- **context** — hvor saken står. _f.eks._ `sendte tilbud på marskickoffen deres, ingen svar på 8 dager`.
- **last_touch** — hva forrige melding sa/spurte om.
- **touch_number** — hvilken oppfølging dette er (1, 2, 3 …). Tonen mykner og mellomrommet øker.
- **new_value** — den nye vinkelen eller verdien denne gangen. _f.eks._
  `en relevant referansecase`, `en dato som snart er fullbooket`, `et lettere alternativ`.

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends. Tone: varm, kort,
> respektfull for tiden deres. Aldri skyldfølelse eller falsk hastverk.
>
> Skriv oppfølging nr. {{touch_number}} på norsk (bokmål) til {{prospect_name}}.
> Kontekst: {{context}}. Forrige melding: {{last_touch}}.
>
> Krav:
> - Led med den nye verdien, ikke «bare følger opp»: {{new_value}}.
> - Hold den kortere enn forrige melding. Under 70 ord.
> - Gjør det lett å si ja — eller å si «ikke nå» med god samvittighet.
> - Ved oppfølging nr. 3 eller mer: ta med en myk avslutning («tar gjerne en ny runde senere hvis
>   timingen ikke passer nå»).
> - Én tydelig, enkel forespørsel.
> - Emne: behold trådens eksisterende emne; foreslå ikke et nytt med mindre det hjelper.
>
> Output: e-postteksten (og en emnelinje kun hvis du ville startet en ny tråd).

## Notater & varianter
- **Kadens:** kontakt 1 ≈ 3 dager etter forrige; 2 ≈ 5–7 dager; 3 ≈ 10–14 dager; deretter pause.
- Finnes ekte nyheter (en dato fylles opp, en relevant seier)? Led med det — det er den beste kroken.
- Etter 3–4 ubesvarte kontakter: bytt til en høflig avslutningsmelding og stopp.
- Aldri mer enn én oppfølging per virkedag til samme person.

## Eksempel
touch_number=`2`, context=`tilbud sendt, stille i 7 dager`, new_value=`ønsket dato er nå én av to
ledige i mars`. → En tekst på ca. 50 ord som leder med at datoene er i ferd med å fylles opp
(sant), og spør om de vil at vi holder den av.
