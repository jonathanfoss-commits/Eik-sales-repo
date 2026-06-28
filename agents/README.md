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

## Agent-kontrakt (filformat)
Hver agent ligger i `<rolle>.md` og er en **kontrakt**: en maskinlesbar definisjon av myndighet,
grenser, inn-/utdata og samarbeid. Det rikere formatet (innført i
[ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md)) gjør mesh-et trygt å utvide og
automatisere videre.

```markdown
---
name: <kebab-case-id>
purpose: <én setning>
owner: Jonathan Foss
status: active | draft | spec        # spec = definert i registeret, ikke bygget ennå
autonomy: draft-only | auto-safe | auto-with-approval
authority: <hva agenten SELV kan beslutte uten å spørre>
limits: <hva den ALDRI gjør / hvor den må stoppe>
inputs: [<hva som trigger/mater den>]
outputs: [<hva den produserer>]
tools: [<integrasjoner den kan bruke>]
collaborators: [<andre agenter den gir arbeid til / får fra>]
escalation: <når og hvordan den eskalerer til menneske>
metrics: [<KPI-er den måles på — se observability/metrics.md>]
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

## Logging & måling
Hva den logger til Agentlogg (se [loggstandarden](../observability/logging-standard.md)) og
hvilke utfall den kobles til ([måle-loopen](../observability/maaleloop.md)).

## Inndata / Output
Hva den trenger for å starte, og hva den produserer.
```

> Front-matter-*nøklene* holdes på engelsk som tekniske identifikatorer (jf.
> [ADR 0001](../docs/decisions/0001-sprakpolicy.md)); innholdet er norsk. De eksisterende
> operative agentene migreres til full kontrakt trinnvis — `authority`/`limits`/`metrics` legges til
> uten å endre adferd.

## Konvensjoner
- Hold agenter **fokuserte** — én tydelig jobb hver. Sett sammen, ikke blås opp.
- Gjenbruk prompter fra [`prompts/`](../prompts/) fremfor å skrive instruksjoner rett inn.
- Standard er **menneske-i-løkken** for alt utadrettet (se
  [`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).
- **Hver agent logger** etter [loggstandarden](../observability/logging-standard.md). Ingen handling
  uten spor.
- **Ingen tomme agentfiler.** En agent får sin egen fil når den har reelt arbeid. Inntil da lever den
  som en rad i [mesh-registeret](#agent-mesh-registeret) under — eksplisitt mål, ingen stillas
  (prinsipp 9).

## Operative agenter (kjører i n8n)
Dette er de **faktiske** AI-agentene som kjører i produksjon og logger til Airtable-tabellen
Agentlogg (jf. [ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md)):

| Agent | Formål |
| --- | --- |
| [`digital-jonathan`](digital-jonathan.md) | Primær AI-selger: lead-fangst, svar-/tilbudsutkast, CRM-oppdatering, daglig rytme. |
| [`gavekort-selger`](gavekort-selger.md) | Spesialisert på gavekortsalg: prospektering og oppfølging av gavekort-/månedsavtaler. |

## Konseptuelle agenter (byggeklosser / spesifikasjoner)
Beskriver enkeltevner. Digital Jonathan er den operative sammenstillingen som faktisk utfører dem.

| Agent | Formål |
| --- | --- |
| [`sales-development-agent`](sales-development-agent.md) | Prospektere, personalisere og skrive utgående henvendelser + oppfølginger. |
| [`inbox-triage-agent`](inbox-triage-agent.md) | Triagere Gmail-innboksen, klassifisere meldinger, skrive svar, flagge varme leads. |
| [`meeting-prep-agent`](meeting-prep-agent.md) | Lage en kort forberedelses-brief før hvert møte. |

## Styringsagenter (L4)
Disse styrer mesh-et i stedet for å selge. De er nye i [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md).

| Agent | Formål |
| --- | --- |
| [`orchestrator`](orchestrator.md) | Ruter arbeid til riktig agent, eier eskaleringskøen, håndhever guardrails og sekvens. |
| [`kvalitetssikrer`](kvalitetssikrer.md) | Kvalitetsport: scorer utadrettede utkast mot en rubrikk før de når Jonathan. |

## Agent-mesh-registeret
Én kilde til sannhet for **hele** organisasjonen av agenter — også de som ennå ikke er bygget.
Dette er det eksplisitte målbildet (STRATEGY tese 5) uten tomt stillas: en `spec`-agent er en
kontrakt, ikke en tom fil. Vi materialiserer den til egen fil når det finnes reelt arbeid å gi den.
Status: **active** (kjører) · **draft** (fil finnes, ikke i drift) · **spec** (kun definert her).

| Agent | Ansvar (kort kontrakt) | Autonomi | Status |
| --- | --- | --- | --- |
| **Orkestrering** | Ruter arbeid, eskaleringskø, guardrails | auto-safe | [draft](orchestrator.md) |
| **Kvalitetssikrer** | Scorer utkast før menneske | draft-only | [draft](kvalitetssikrer.md) |
| **Digital Jonathan** | Operativ paraply: intake→utkast→CRM→rytme | auto-with-approval | [active](digital-jonathan.md) |
| **Gavekort-selger** | Gavekort: prospekt + oppfølging | draft-only | [active](gavekort-selger.md) |
| Lead/Intake-agent | Fange + kvalifisere + ICP-score nye leads | auto-safe (CRM), draft (svar) | spec → utført av Digital Jonathan |
| Research/Berikelse | Berike konto/kontakt (Apollo/Clay/nyheter) | auto-safe | spec |
| Outreach-agent | Personaliserte førstegangshenvendelser | draft-only | spec → Digital Jonathan |
| Tilbudsagent | Generere tilbudsutkast fra avtale + lokaler | draft-only | spec → Digital Jonathan |
| Oppfølgingsagent | Sekvensert oppfølging m/ godkjenningsport | draft-only | spec |
| Kalender-/Bookingagent | Foreslå tider, reservere lokale, unngå dobbeltbooking | auto-with-approval | spec |
| Account-/Partneragent | Pleie strategiske kontoer + partneravtaler, fornyelse | draft-only | spec |
| Analyse-/Rapportagent | KPI-er, måle-loop-rapport, ukentlig digest | auto-safe (les) | spec → weekly-digest workflow |
| CRM-/Datakvalitetsagent | Hygiene, dedup, flagg, backfill | auto-safe | [active](../workflows/crm-hygiene-automation.md) (workflow) |

**Hvorfor ikke alle som egne filer nå:** Digital Jonathan utfører i praksis intake/outreach/tilbud i
dag. Å splitte dem i separate kjørende agenter er en **refaktor vi gjør når volum krever det** (jf.
STRATEGY tese 5 og Q4-planen) — ikke før. Registeret holder målbildet skarpt i mellomtiden.

### Migreringsvei (monolitt → mesh)
1. **Nå:** Digital Jonathan = monolitt; styringsagentene (orchestrator, kvalitetssikrer) legges
   *rundt* den uten å splitte den.
2. **Q4 (ved volum):** løft ut de tyngste evnene til egne agenter (research, oppfølging,
   tilbud) — én om gangen, hver med kontrakt + utfallsmåling før den settes i drift (skala-prinsipp 3).
3. **År 2:** prediktive agenter (lead-scoring, gavekort-fornyelse/churn) på toppen av måledataene.
