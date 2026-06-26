---
id: ukentlig-pipeline-sammendrag
title: Ukentlig pipeline-sammendrag
stage: reports
inputs: [dato, avtaler, vunnet_tapt_siste_uke]
version: 1
lang: no
---

## Formål
Lag et kort, handlingsorientert ukentlig sammendrag av salgspipelinen, slik at Jonathan starter uken
med oversikt og tydelige prioriteringer. Drives av [arbeidsflyten for ukentlig pipeline-sammendrag](../../workflows/weekly-pipeline-digest.md).

## Inndata
- **dato** — mandagens dato. _f.eks._ `2026-06-29`
- **avtaler** — gjeldende åpne avtaler fra CRM-et, hver med: navn, konto, steg, verdi,
  `next_step`, `next_step_date`, `expected_close_date`. (Hentes av arbeidsflyten.)
- **vunnet_tapt_siste_uke** — avtaler som ble `Vunnet` eller `Tapt` forrige uke, med verdi og ev.
  tapsårsak.

## Prompt
> Du er salgsassistenten til Jonathan Foss (Sales Manager, Eik & Friends). Lag et ukentlig
> pipeline-sammendrag på norsk (bokmål). Vær konsis og prioritert — dette leses mandag morgen.
>
> Dato: {{dato}}
> Åpne avtaler: {{avtaler}}
> Vunnet/tapt forrige uke: {{vunnet_tapt_siste_uke}}
>
> Lag sammendraget med disse seksjonene:
> 1. **Overskrift** — «Pipeline uke {{dato}}» og én linje med totalen (antall åpne avtaler og samlet
>    verdi i NOK).
> 2. **Pipeline per steg** — en kort tabell: steg, antall avtaler, samlet verdi. Bruk de norske
>    stegnavnene (Prospekt, I dialog, Kvalifisert, Tilbud, Forhandling).
> 3. **Forventet signert denne uken** — avtaler med `expected_close_date` denne uken; navn, verdi,
>    neste steg.
> 4. **⚠️ Står fast** — avtaler uten `next_step`, eller med `next_step_date` som er passert. Disse
>    trenger handling nå.
> 5. **Topp 3 prioriteringer** — de tre avtalene/handlingene med størst inntektspåvirkning denne
>    uken, med en kort begrunnelse hver.
> 6. **Forrige uke** — kort: hva ble vunnet (verdi) og tapt (med årsak), og én læring hvis tapene
>    peker på et mønster.
>
> Vær ærlig og konkret. Ikke pynt på tall. Pek på det som krever handling, ikke bare status.

## Notater & varianter
- Kjøres ukentlig (mandag morgen) via arbeidsflyten; kan også kjøres manuelt ved behov.
- «Står fast»-seksjonen er den viktigste — den fanger avtaler som er i ferd med å gli ut.
- Hold hele sammendraget på lengde med én skjerm; detaljene ligger i CRM-et.

## Eksempel
12 åpne avtaler til 1,8 MNOK → et sammendrag som viser fordelingen per steg, flagger to avtaler med
forfalt neste-steg-dato, og foreslår tre konkrete prioriteringer for uken.
