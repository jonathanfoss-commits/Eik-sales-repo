# Agenter

Definisjoner av AI-agenter. En **agent** er en definert rolle som samler et formål,
driftsinstruksjoner, promptene den støtter seg på, verktøyene den kan bruke, og sikkerhetsgjerdene
sine. Agenter er måten vi setter sammen de gjenbrukbare delene i dette repoet til en arbeider som
kan gjøre en ekte jobb.

## Hva en agent er (og ikke er)
- En agent **er** en tydelig, portabel spesifikasjon du kan gi til Claude eller ChatGPT (eller koble
  inn i n8n) slik at den oppfører seg konsistent.
- En agent **er ikke** kjørende kode. Kjøreflaten (Claude/ChatGPT/n8n) kjører den; denne filen
  definerer den.

## Filformat
Hver agent ligger i `<rolle>-agent.md` og følger denne strukturen:

```markdown
---
name: <kebab-case-id>
purpose: <én setning>
owner: Jonathan Foss
status: active | draft
---

## Oppdrag
Hva agenten har ansvar for.

## Driftsinstruksjoner
Hvordan den skal oppføre seg, steg for steg.

## Verktøy & integrasjoner
Hvilke integrasjoner/verktøy den kan bruke, og eventuelle grenser.

## Prompter som brukes
Lenker til promptfilene den støtter seg på.

## Sikkerhetsgjerder
Hva den aldri skal gjøre; hvor et menneske må godkjenne.

## Inndata / Output
Hva den trenger for å starte, og hva den produserer.
```

> Felt-*navnene* i front-matter (`name`, `purpose`, `status`) holdes på engelsk som tekniske
> identifikatorer (jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md)); innholdet er norsk.

## Konvensjoner
- Hold agenter **fokuserte** — én tydelig jobb hver. Sett sammen, ikke blås opp.
- Gjenbruk prompter fra [`prompts/`](../prompts/) fremfor å skrive instruksjoner rett inn.
- Standard er **menneske-i-løkken** for alt utadrettet (se
  [`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).

## Nåværende agenter
| Agent | Formål |
| --- | --- |
| [`sales-development-agent`](sales-development-agent.md) | Prospektere, personalisere og skrive utgående henvendelser + oppfølginger. |
| [`inbox-triage-agent`](inbox-triage-agent.md) | Triagere Gmail-innboksen, klassifisere meldinger, skrive svar, flagge varme leads. |
| [`meeting-prep-agent`](meeting-prep-agent.md) | Lage en kort forberedelses-brief før hvert møte. |
