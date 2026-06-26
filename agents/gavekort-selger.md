---
name: gavekort-selger
purpose: AI-agent dedikert til gavekortsalg — prospektering og oppfølging av gavekort- og månedsavtaler.
owner: Jonathan Foss
status: active (kjører i n8n)
---

## Oppdrag
«Gavekort-selger» er en spesialisert AI-agent i n8n som jobber med **gavekortforretningen**:
bedrifter som kjøper gavekort til ansatte/kunder (sommergaver, julegaver, månedlige avtaler).
Gavekort er en egen, gjentakende inntektsstrøm med mange, mindre avtaler — godt egnet for
automatisert prospektering og oppfølging.

> Beskriver den virkelige agenten i n8n, som logger til **Agentlogg** (Agent =
> «Gavekort-selger (AI)»). Jf. [ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

## Hva den gjør
1. **Prospektering:** identifiserer bedrifter som er gode gavekort-kandidater (typisk
   profesjonelle tjenester — advokat, konsulent, eiendom — med sesong- eller
   anledningsgaver).
2. **Outreach-utkast:** lager forslag til gavekort-henvendelser, tilpasset anledning (sommergaver,
   julegaver, kundegaver) og bedrift.
3. **Lead-/avtalefangst:** oppretter rader i **Avtaler** med Type `Gavekort`, Restaurant `Gavekort`,
   Status `Ny lead` / `I dialog`.
4. **Oppfølging:** holder gavekort-pipelinen varm — gjentakende avtaler bør følges opp i sesong.
5. **Logging:** handlinger logges i **Agentlogg**.

## Verktøy & integrasjoner
- **Airtable** — Avtaler (Type = Gavekort) + Agentlogg.
- **Gmail** — utkast (ingen autonom sending).
- **Apollo / Clay** — prospektering av nye gavekort-kandidater.

## Prompter som brukes
- [`prompts/outreach/cold-outreach.md`](../prompts/outreach/cold-outreach.md) (tilpasset gavekort)
- [`prompts/follow-up/follow-up-sequence.md`](../prompts/follow-up/follow-up-sequence.md)

## Sikkerhetsgjerder
- **Sender aldri** autonomt — kun utkast.
- **Dikter aldri opp** beløp eller vilkår.
- **Ingen sletting/masseoverskriving** i Airtable uten godkjenning.

## Mulighet (jf. helsesjekk 26.06.2026)
Gavekort-/sommergave-leads har en tendens til å bli liggende (10 sto med forfalt oppfølging
26.06.2026). En tettere, sesongstyrt oppfølgingskadens er sannsynligvis høy avkastning for lav
innsats. Se [`analytics/crm-helsesjekk-2026-06-26.md`](../analytics/crm-helsesjekk-2026-06-26.md) og
[`sales/sesongkalender.md`](../sales/sesongkalender.md).
