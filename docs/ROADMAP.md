# Veikart

En levende, faseinndelt plan for Eik Sales OS. Hver fase leverer selvstendig verdi; vi starter ikke
en fase før den forrige er reelt nyttig. Punkter beveger seg fra **Planlagt → Pågår → Ferdig**.
Teknisk gjeld og muligheter som oppdages underveis fanges nederst.

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

- [ ] **CRM-hygiene-regel:** auto-flytt `Bekreftet → Gjennomført` når «Dato for selskap» passerer
  (fjerner 86-rad-problemet permanent — se [helsesjekk](../analytics/crm-helsesjekk-2026-06-26.md))
- [ ] **Håndhev «Neste oppfølging»:** ingen åpen avtale uten dato; varsle ved forfall
- [ ] Automatisert oppfølgingssekvensering med godkjenningsporter
- [ ] Møteforberedelses-brief auto-generert før hvert kalendermøte
- [x] Dokumentere ukentlig pipeline-sammendrag (prompt + arbeidsflyt) — se `workflows/weekly-pipeline-digest.md`
- [ ] Bygge & validere ukentlig pipeline-sammendrag + helsesjekk i n8n

## Fase 3 — Innsikt & research
Skjerpe målretting og personalisering.

- [ ] Research-agent for konto & kontakt (selskapsnyheter, treff-scoring)
- [ ] ICP-scoringsmodell for innkommende og utgående leads
- [ ] Skanner for restaurantpartnerskap-muligheter

## Fase 4 — Analyse & kontinuerlig forbedring
Måle og forbedre hele systemet.

- [ ] Pipeline- og konverteringsanalyse fra CRM
- [ ] Sporing og iterasjon av prompt-/agentytelse
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

> Når du oppdager gjeld eller en mulighet, legg den til her i samme endring fremfor å utvide den
> nåværende oppgavens omfang.
