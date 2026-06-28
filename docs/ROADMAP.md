# Veikart

En levende, faseinndelt plan for Eik Sales OS. Hver fase leverer selvstendig verdi; vi starter ikke
en fase før den forrige er reelt nyttig. Punkter beveger seg fra **Planlagt → Pågår → Ferdig**.
Teknisk gjeld og muligheter som oppdages underveis fanges nederst.

> **Strategisk retning:** se [`docs/STRATEGY.md`](STRATEGY.md) (10x/5-års-visjon). De strategiske
> initiativene under er forankret der og i ADR-ene.

## Strategiske initiativer (fra STRATEGY.md)
- [x] **Relasjonell CRM-kjerne** (Bedrifter som navet) — [ADR 0003](decisions/0003-relasjonell-crm-kjerne.md).
  Struktur + backfill ✅ (57 bedrifter, 93 avtaler lenket). *Gjenstår:* rollups (samlet verdi/gjentakelse) + «Strategiske kontoer»-visning.
- [ ] **Gavekort-produktifisering** (årsavtaler + sesongtriggere) — [ADR 0004](decisions/0004-gavekort-gjentakende-inntekt.md).
  *Pågår:* playbook + årsavtale-prompt levert; gjenstår `Gavekortavtaler`-tabell + n8n-triggere.
- [~] **Måle-loop** (utfall per AI-handling → forbedring) — komponerende kvalitet. *Definert*
  ([ADR 0005](decisions/0005-styrings-og-maalelag.md), [`observability/maaleloop.md`](../observability/maaleloop.md));
  gjenstår: `Utfall`-tabell i Airtable + n8n-utledning + `Prompt-ID` i promptfiler.
- [~] **Agent-mesh + kunnskapslag** — fra én monolitt til spesialiserte, styrte agenter. *Styringslag
  startet:* kontraktsformat + mesh-register + orkestrator + kvalitetssikrer ([ADR 0005](decisions/0005-styrings-og-maalelag.md));
  gjenstår: splitte ut spesialiserte agenter ved volum (Q4).
- [ ] **Venue-matchemodell** — anbefal lokale automatisk fra gjestetall/type/sesong.

---

## Fase 0 — Grunnmur ✅
Etablere en profesjonell, godt dokumentert struktur og de første verdifulle salgsressursene.

- [x] Repostruktur og modul-README-er
- [x] Kjernedokumentasjon (arkitektur, prinsipper, veikart, kodestandard, navnekonvensjoner, oppsett, ordliste)
- [x] Første agentdefinisjoner (salgsutvikling, innboks-triage, møteforberedelse)
- [x] Kjerne-promptbibliotek (henvendelser, oppfølging, møteforberedelse, forhandling)
- [x] CRM-datamodell og pipeline-definisjon
- [x] Grunnmur for salgs-playbook (ICP, metodikk, partnerskap, arrangementer)
- [x] Norsk (bokmål) satt som standardspråk ([ADR 0001](decisions/0001-sprakpolicy.md))

## Fase 1 — Koble til verktøyene
Få systemet til å handle på ekte data gjennom Jonathans daglige verktøy.

- [x] Kartlegge de faktiske, tilkoblede systemene (Airtable, Gmail, Kalender, Drive, Notion-arkiv)
- [x] Dokumentere det levende **Airtable-CRM-et** (skjema, pipeline) — se `crm/` + `integrations/airtable-integration.md`
- [x] Dokumentere Gmail-integrasjonen (utkast, etiketter, triage) — se `integrations/gmail-integration.md`
- [x] Dokumentere Google Kalender-integrasjonen — se `integrations/calendar-integration.md`
- [x] Markere det gamle Notion-salgssystemet som arkivert (ADR 0002)
- [x] Dokumentere de virkelige n8n-agentene (Digital Jonathan, Gavekort-selger) — se `agents/`
- [x] Definere miljø-/hemmelighetshåndtering i `config/`
- [ ] Validere Gmail-/Kalender-utkast mot ekte kontoer i drift

## Fase 2 — Automatisere det repeterende
Redusere manuelt arbeid på gjentakende salgsbevegelser.

- [x] **CRM-hygiene-flagg live:** `Pipeline-hygiene`-formelfelt deployet i Avtaler (oppdateres
  daglig) — flagger både `Bekreftet`-med-passert-dato og manglende/forfalt oppfølging. Se
  [`workflows/crm-hygiene-automation.md`](../workflows/crm-hygiene-automation.md).
- [ ] **Aktiver auto-flip** `Bekreftet → Gjennomført` (regel lagt til Digital Jonathan; alternativt
  Airtable-script — 2 min i UI)
- [ ] Automatisert oppfølgingssekvensering med godkjenningsporter
- [ ] Møteforberedelses-brief auto-generert før hvert kalendermøte
- [x] Dokumentere ukentlig pipeline-sammendrag (prompt + arbeidsflyt) — se `workflows/weekly-pipeline-digest.md`
- [ ] Bygge & validere ukentlig pipeline-sammendrag + helsesjekk i n8n

## Fase 3 — Innsikt & research
Skjerpe målretting og personalisering.

- [ ] Research-agent for konto & kontakt (selskapsnyheter, treff-scoring)
- [ ] ICP-scoringsmodell for innkommende og utgående leads
- [ ] Skanner for restaurantpartnerskap-muligheter

## Fase 4 — Analyse & kontinuerlig forbedring (styrings- & målelag, L4)
Måle og forbedre hele systemet. Rammeverket er definert i [`observability/`](../observability/)
([ADR 0005](decisions/0005-styrings-og-maalelag.md)); her gjøres det levende i Airtable.

- [x] **Loggstandard, KPI-katalog, måle-loop & feiltaksonomi definert** — [`observability/`](../observability/).
- [x] **Agent-kontraktsformat + mesh-register + styringsagenter** (orkestrator, kvalitetssikrer).
- [x] **Scenario-basert testbibliotek** med syntetiske fixtures — [`tests/`](../tests/).
- [x] **Feil-, fallback- og backup-strategi** dokumentert — [`integrations/resilience.md`](../integrations/resilience.md).
- [x] **`Utfall`- og `Eskaleringer`-tabeller live + `Agentlogg` utvidet** med modell/tokens/kostnad/latens/konfidens/beslutning/prompt-id/feilkode (28.06.2026).
- [x] **Operative agenter koblet til loggstandarden** — digital-jonathan + gavekort-selger oppgradert til full kontrakt og skriver Agentlogg/Utfall/Eskaleringer.
- [x] **Prompt-ID-konvensjon** = `{id}-v{version}` (utledet, ingen duplisering) — se [`prompts/README.md`](../prompts/README.md).
- [ ] n8n-jobb som faktisk skriver de nye feltene + utleder utfall (sendt/svar/vunnet) fra Gmail + Avtaler.
- [ ] UI-finesser: kostnadsrollup per uke + varsel ved `Alvorlighet = Kritisk`.
- [ ] KPI-dashboard som Airtable-interface (L5) når `Utfall` har data.
- [ ] Pipeline- og konverteringsanalyse fra CRM
- [ ] Sporing og iterasjon av prompt-/agentytelse (mandagsbrief leser `Utfall`)
- [ ] Kvartalsvis gjennomgangs-playbook

---

## Idébank / muligheter
Ideer verdt å gjøre når de stiger til topps. Ennå ikke planlagt.

- ~~Tospråklige (norsk/engelsk) promptvarianter~~ → erstattet av ADR 0001: norsk er standard,
  engelsk variant kun ved behov.
- ~~Tilbudsmal~~ → levert: [`templates/tilbud-bedriftsarrangement.md`](../templates/tilbud-bedriftsarrangement.md)
  + generator [`prompts/proposals/tilbud.md`](../prompts/proposals/tilbud.md). Neste: auto-generering
  rett inn i Google Docs.
- Partner-/lokaledatabase med sesongbasert arrangementskalender.
- ~~Sesongkampanjer~~ → startet: [sesongkalender](../sales/sesongkalender.md) +
  [julebord-henvendelse](../prompts/outreach/julebord-henvendelse.md). Neste: sommerfest- og
  kickoff-varianter når de sesongene nærmer seg.
- LinkedIn-henvendelses-playbook (hvis/når den kanalen tas i bruk).

## Kjent teknisk gjeld
Ærlig oversikt over snarveier og hull å se på igjen.

- **CRM-datahygiene:** ✅ ryddet 26.06 (86 avtaler `Bekreftet → Gjennomført`; 10 oppfølgingsutkast
  laget; 3 Pending fikk oppfølgingsdato). Se
  [analytics/crm-helsesjekk-2026-06-26.md](../analytics/crm-helsesjekk-2026-06-26.md). **Gjenstår:**
  automatisere med en n8n-/Airtable-regel så det ikke gjentar seg (lagt i Fase 2).
- `sales/`-playbooks og ICP er under tilpasning til restaurantkollektiv-virkeligheten (ADR 0002).
- **Observabilitet er materialisert (28.06.2026), men ikke fôret ennå:** tabeller/felt er live og
  agentene er spesifisert til å logge — men en n8n-jobb må faktisk skrive radene før måle-loopen gir
  innsikt. Det er det siste leddet (Fase 4).
- **Backup delvis dekket:** Airtable-snapshots + Git er aktivt; ukentlig CSV-eksport og kvartalsvis
  Google Takeout er fortsatt *spec* — se [`integrations/resilience.md`](../integrations/resilience.md).
- **Testdekning har hull:** booking-agent (happy path) og research/berikelse mangler scenarier til de
  agentene materialiseres — se [`tests/scenarios.md`](../tests/scenarios.md).

> Når du oppdager gjeld eller en mulighet, legg den til her i samme endring fremfor å utvide den
> nåværende oppgavens omfang.
