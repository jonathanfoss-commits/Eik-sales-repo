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

- [x] Dokumentere Gmail-integrasjonen (utkast, etiketter, triage) — se `integrations/gmail-integration.md`
- [ ] Validere Gmail-integrasjonen mot den ekte kontoen
- [x] Dokumentere Google Kalender-integrasjonen (reservasjoner, planlegging) — se `integrations/calendar-integration.md`
- [ ] Validere Kalender-integrasjonen mot den ekte kontoen
- [x] Dokumentere Notion-CRM-databasestrukturen — se `integrations/notion-integration.md`
- [ ] Notion-CRM: opprette de faktiske databasene som speiler `crm/schema.md`
- [x] Definere miljø-/hemmelighetshåndtering i `config/`
- [x] Dokumentere arbeidsflyten for innkommende lead-triage — se `workflows/inbound-lead-triage.md`
- [ ] Bygge & validere lead-triage-arbeidsflyten i n8n

## Fase 2 — Automatisere det repeterende
Redusere manuelt arbeid på gjentakende salgsbevegelser.

- [ ] Automatisert oppfølgingssekvensering med godkjenningsporter
- [ ] Møteforberedelses-brief auto-generert før hvert kalendermøte
- [ ] Oppsummering etter møte + uttrekk av neste steg
- [ ] Ukentlig pipeline-sammendrag fra CRM-data

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
- Maler for tilbud & prisoppsett generert inn i Google Docs.
- Partner-/lokaledatabase med sesongbasert arrangementskalender.
- Sesongkampanjer (sommerfest, julebord, kickoff) som ferdige ressurser.
- LinkedIn-henvendelses-playbook (hvis/når den kanalen tas i bruk).

## Kjent teknisk gjeld
Ærlig oversikt over snarveier og hull å se på igjen.

- Integrasjonene er dokumentert, men ennå ikke validert mot ekte kontoer (Fase 1).
- ICP og playbooks er startutkast som trenger ekte vunnet/tapt-data.

> Når du oppdager gjeld eller en mulighet, legg den til her i samme endring fremfor å utvide den
> nåværende oppgavens omfang.
