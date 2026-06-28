---
id: gavekort-aarsavtale
title: Gavekort — oppgrader til årsavtale
stage: outreach
inputs: [kontaktnavn, bedrift, forrige_kjop, anledninger, antall_ansatte, rabatt]
version: 1
lang: no
---

## Formål
Foreslå en **årsavtale** til en bedrift som allerede har kjøpt gavekort (typisk etter et vellykket
sesongkjøp). Mål: løfte en engangstransaksjon til gjentakende inntekt — én beslutning som dekker
årets anledninger. Del av gavekort-produktifiseringen ([ADR 0004](../../docs/decisions/0004-gavekort-gjentakende-inntekt.md),
[playbook](../../sales/playbook-gavekort.md)).

## Inndata
- **kontaktnavn** — fornavn.
- **bedrift** — selskap.
- **forrige_kjop** — hva de kjøpte sist. _f.eks._ `sommergaver til 45 ansatte`
- **anledninger** — anledninger en årsavtale kan dekke. _f.eks._ `sommer, jul, bursdager, kundegaver`
- **antall_ansatte** — omtrentlig, for å dimensjonere.
- **rabatt** — volumrabatt vi kan tilby på årsavtale. _f.eks._ `10 %`

## Prompt
> Du skriver på vegne av Jonathan Foss, Sales Manager i Eik & Friends. Tone: varm, profesjonell,
> konkret. Dette er en oppfølging til en kunde som allerede har kjøpt gavekort.
>
> Skriv en kort e-post på norsk (bokmål) til {{kontaktnavn}} i {{bedrift}} som foreslår en
> **årsavtale** på gavekort.
>
> Krav:
> - Anerkjenn det forrige kjøpet kort og positivt: {{forrige_kjop}}.
> - Hovedpoeng: én årsavtale dekker årets anledninger ({{anledninger}}) — én beslutning i stedet for
>   fire mas i året, med {{rabatt}} rabatt. Vi minner om hver anledning.
> - Understrek at det er fleksibelt: start lavt, juster underveis, betal for det som brukes.
> - Én tydelig, lavterskel forespørsel (et kort forslag tilpasset {{antall_ansatte}} ansatte).
> - Under 120 ord.
> - Avslutt med hilsen fra Jonathan, Eik & Friends.
>
> Output: emnelinje, deretter e-postteksten.

## Notater & varianter
- Best timing: rett etter et vellykket sesongkjøp, mens opplevelsen er fersk.
- For «fast månedlig avtale»-leads: vri til løpende ansattgode i stedet for årsavtale.
- Fang resultatet som en `Gavekortavtale` med `Fornyelsesdato`, ikke bare en `Avtale`.

## Eksempel
Kunde kjøpte sommergaver til 45 ansatte → e-post som foreslår en årsavtale som også dekker jul,
bursdager og kundegaver, med 10 % rabatt og en påminnelse-tjeneste, og ber om å få sende et forslag.
