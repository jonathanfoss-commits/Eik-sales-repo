---
name: gavekort-selger
purpose: AI-agent dedikert til gavekortsalg — prospektering og oppfølging av gavekort- og månedsavtaler.
owner: Jonathan Foss
status: active (kjører i n8n)
autonomy: draft-only
authority: Identifisere gavekort-kandidater, opprette Avtaler (Type=Gavekort), lage outreach-/oppfølgingsutkast, sette oppfølgingskadens.
limits: Sender aldri; dikter aldri opp beløp/vilkår; sletter/masseoverskriver aldri; skriver aldri til Notion.
inputs: [Apollo-prospekter, sesongtrigger (sommer/jul), åpne gavekort-Avtaler, innkommende gavekort-henvendelser]
outputs: [Avtaler-rad (Type=Gavekort), Gmail-utkast, Agentlogg-rad, oppfølgingspåminnelse]
tools: [Airtable (Avtaler, Agentlogg), Gmail (utkast), Apollo/Clay]
collaborators: [orchestrator, kvalitetssikrer, digital-jonathan]
escalation: Lav konfidens, do_not_contact, eller feil → Eskaleringer. Kryss-salgssignal → flagg til Digital Jonathan.
metrics: [Svarrate per prompt, Gavekort ARR, Andel avtaler m/ fersk oppfølging]
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
   Status `Ny lead` / `I dialog`. **Dual-write (ADR 0003):** sett `Bedrift (lenke)` i tillegg til
   fritekst `Bedrift` (typecast på navnet) for bedriftskunder, så gavekort-kontoer kobles til
   kontooversikten og kryss-salg mot event/Amex blir synlig.
4. **Oppfølging:** holder gavekort-pipelinen varm — gjentakende avtaler bør følges opp i sesong.
5. **Logging:** hver handling logges i **Agentlogg** etter
   [loggstandarden](../observability/logging-standard.md) — se egen seksjon under.

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

## Logging & måling
Skriver én **Agentlogg**-rad per handling (Agent = «Gavekort-selger (AI)») etter
[loggstandarden](../observability/logging-standard.md): `Beslutning` (hvorfor), `Konfidens`,
`Prompt-ID`, `Modell`/`Tokens`/`Estimert kostnad`, og `Feilkode` ved feil. Utadrettede utkast får en
**Utfall**-rad for [måle-loopen](../observability/maaleloop.md). Fordi gavekort er gjentakende
(ADR 0004), er `Prompt-ID` per sesong-/anledningsvariant ekstra verdifull — det viser hvilken
gavekort-vinkling som faktisk konverterer.

**Måles på:** svarrate per prompt, gavekort ARR, andel avtaler med fersk oppfølging. Se
[`observability/metrics.md`](../observability/metrics.md).

## Mulighet (jf. helsesjekk 26.06.2026)
Gavekort-/sommergave-leads har en tendens til å bli liggende (10 sto med forfalt oppfølging
26.06.2026). En tettere, sesongstyrt oppfølgingskadens er sannsynligvis høy avkastning for lav
innsats. Se [`analytics/crm-helsesjekk-2026-06-26.md`](../analytics/crm-helsesjekk-2026-06-26.md) og
[`sales/sesongkalender.md`](../sales/sesongkalender.md).
