# 0002 — Faktisk systemarkitektur: Airtable-CRM + n8n-agenter

- **Status:** Vedtatt
- **Dato:** 2026-06-26
- **Besluttet av:** CTO-agenten, etter kartlegging av Jonathans faktiske arbeidsområde

## Kontekst
De første versjonene av dette repoet beskrev et idealisert CRM bygget i Notion, med oppdiktede
pipeline-steg og en generisk «bedriftsarrangement»-modell. En kartlegging av de faktiske,
tilkoblede systemene (Notion, Airtable, Gmail, Kalender, Drive) avdekket en helt annen virkelighet:

1. **Notion-salgssystemet er arkivert** (12.06.2026). Forsiden er merket «🗄️ ARKIV — erstattet av
   Airtable» med eksplisitt beskjed: *«Ikke oppdater noe her.»*
2. **Det levende CRM-et er en Airtable-base:** «Salgspipeline – Restaurant CRM»
   (`appzIFWfzob6WEhnq`), med 127 aktive avtaler.
3. **Eik & Friends er et restaurantkollektiv** med ~22 spisesteder (TAKET, Sawan, Amazonia,
   Kastellet, Honolulu, Bar Vulkan, Brød & Sirkus m.fl.). Salget er bedriftsevent, private
   selskaper, gavekort og Amex-avtaler **på tvers av disse lokalene** — ikke et abstrakt
   «event-byrå».
4. **Automatisering kjøres i n8n** av AI-agentene «Digital Jonathan» og «Gavekort-selger», som
   logger til en Agentlogg-tabell og lager e-postutkast (aldri auto-send).
5. **To selgere:** Jonathan Foss og Christopher Erstad.

Repoet beskrev altså et system som ikke finnes, og ignorerte systemet som faktisk brukes.

## Beslutning
**GitHub-repoet er dokumentasjons- og «hjerne»-laget for det faktiske økosystemet — ikke et
parallelt system.** Konkret:

- **Airtable** er kildesystemet (system of record) for CRM. Repoet *dokumenterer* basens skjema og
  konvensjoner og holder dem synkronisert, men dupliserer ikke levende data.
- **n8n** er automasjonsmotoren. Repoet dokumenterer hva agentene gjør, slik at logikken er
  lesbar og versjonert.
- **Notion** behandles som **arkivert**. Vi skriver ikke til det gamle salgssystemet.
- Repoets `crm/`, `integrations/`, `agents/` og `workflows/` skal speile de **virkelige**
  tabellene, feltene, statusene, lokalene og agentene.
- Salgsstrategi (`sales/`) og prompter (`prompts/`) tilpasses restaurantkollektiv-virkeligheten:
  ekte lokaler, ekte avtaletyper (Bedriftsevent, Privat, Gavekort, Amex) og ekte pipeline.

## Alternativer vurdert
1. **Beholde den idealiserte Notion-modellen i repoet.** Forkastet: den beskriver et arkivert,
   ubrukt system og skaper forvirring og dobbeltarbeid — nøyaktig anti-mønsteret eieren advarte mot.
2. **Migrere CRM-et tilbake til Notion for å matche repoet.** Forkastet: ville rive ned et fungerende
   Airtable-system med 127 avtaler og en n8n-automasjon rundt seg. Vi tilpasser dokumentasjonen til
   virkeligheten, ikke omvendt.
3. **La repoet og det levende systemet leve hver for seg.** Forkastet: «hjernen» må reflektere
   virkeligheten for å ha verdi for AI-agenter og mennesker.

## Konsekvenser
- **Positivt:** repoet blir en sann, nyttig kilde for både Jonathan og AI-agentene; automatisering
  kan trygt forankres i dokumentert virkelighet.
- **Positivt:** ett system, ingen parallelle spor (jf. eierens instruks: utvid eksisterende,
  unngå dobbeltarbeid).
- **Kostnad (engangs):** `crm/`, `integrations/`, deler av `agents/`, `sales/` og `prompts/`
  skrives om for å matche Airtable + n8n. Utføres i kjølvannet av denne ADR-en.
- **Vedlikehold:** endres Airtable-skjemaet, oppdateres `crm/`-dokumentasjonen i samme ånd. ADR 0001
  (norsk som standard) gjelder fortsatt fullt ut.
- **Historikk:** den tidligere Notion-modellen beholdes ikke som «sannhet»; `integrations/`
  markerer Notion-salgssystemet som arkivert med en kort historikk.
