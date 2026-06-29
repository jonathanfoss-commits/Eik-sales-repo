# Ordliste

Felles vokabular for Eik Sales OS. Konsistente begreper holder mennesker og AI-agenter samkjørte.

## Salgsbegreper
- **ICP (ideell kundeprofil)** — den presise definisjonen av kundene som er verdt å forfølge.
  Se [`sales/icp.md`](../sales/icp.md).
- **Lead** — en person eller virksomhet som kan bli kunde, men som ennå ikke er kvalifisert.
- **Prospekt** — et kvalifisert lead det jobbes aktivt med.
- **Konto (account)** — en virksomhet vi selger til eller samarbeider med.
- **Kontakt** — en enkeltperson knyttet til en konto.
- **Avtale / mulighet (deal)** — en potensiell forretning med en verdi og et pipeline-steg.
- **Pipeline** — den ordnede rekken av steg en avtale beveger seg gjennom. Se
  [`crm/pipeline-stages.md`](../crm/pipeline-stages.md).
- **Henvendelse (outreach)** — proaktiv førstekontakt (kald eller varm).
- **Oppfølging** — påfølgende kontaktpunkter for å bevege eller gjenopplive en samtale.
- **Kartlegging (discovery)** — møtet/samtalen der vi lærer prospektets behov.
- **Kvalifisering** — å vurdere om et lead passer ICP-en og er verdt å forfølge.
- **ICP-score** — en lett scoring av et prospekt mot ICP-en (firmografi + trigger + gjentakelse →
  Høy/Middels/Lav). Se [`research-berikelsesagent`](../agents/research-berikelsesagent.md).
- **Kryss-salg** — å selge en kunde en ny forretningslinje (event → gavekort → Amex). Drives av
  [`account-partneragent`](../agents/account-partneragent.md).
- **Berikelse (enrichment)** — å legge offentlig kontekst (bransje, org.nr, triggere) på en konto.

## Eik & Friends-kontekst
- **Bedriftsarrangement** — et booket arrangement for en bedriftskunde (middager, lanseringer, samlinger).
- **Restaurantpartnerskap** — et løpende kommersielt forhold til et lokale/en restaurant.
- **Markedssamarbeid** — en felles kampanje eller co-marketing-ordning med en partner.

## Systembegreper
- **Agent** — en definert AI-rolle (formål + instruksjoner + verktøy + sikkerhetsgjerder). Se
  [`agents/`](../agents/).
- **Agent-kontrakt** — den maskinlesbare spesifikasjonen av en agent: myndighet, grenser,
  inn-/utdata, verktøy, samarbeidspartnere, eskalering og metrikker (ADR 0005).
- **Agent-mesh** — organisasjonen av spesialiserte agenter (styring → handler → måler) som deler
  CRM-tilstand. Se [registeret](../agents/README.md#agent-mesh-registeret).
- **Orkestrator** — styringsagenten som ruter arbeid og eier eskaleringskøen.
- **Autonominivå** — hvor selvstendig en agent handler: `draft-only`, `auto-safe`,
  `auto-with-approval`.
- **Prompt** — en gjenbrukbar instruksjon for en bestemt oppgave. Se [`prompts/`](../prompts/).
- **Playbook** — en dokumentert salgsprosess eller -metode. Se [`sales/`](../sales/).
- **Workflow (arbeidsflyt)** — en automatisering som kjører i n8n eller Zapier. Se [`workflows/`](../workflows/).
- **Integrasjon** — en kobling til et eksternt verktøy (Airtable, Gmail, Kalender …). Se
  [`integrations/`](../integrations/).
- **Kildesystem (system of record)** — det eksterne verktøyet som holder de levende, autoritative
  dataene for et område.
- **Menneske-i-løkken (human-in-the-loop)** — et steg der en person gjennomgår/godkjenner før en
  handling går ut.
- **Kjøreflate (execution surface)** — der arbeidet faktisk kjører (Claude, ChatGPT, n8n, Zapier).

## Observabilitet & måling (L4)
- **Måle-loop** — kjeden handling → utfall → forbedring som gjør at prompter/agenter blir bedre over
  tid. Se [`observability/maaleloop.md`](../observability/maaleloop.md).
- **Utfall (outcome)** — resultatet av en utadrettet AI-handling (sendt/forkastet → svar →
  vunnet/tapt), koblet til handlingen i Agentlogg.
- **Loggstandard** — hva hver agent skal logge per handling (modell, kostnad, konfidens, beslutning).
  Se [`observability/logging-standard.md`](../observability/logging-standard.md).
- **Eskaleringskø** — tabellen for saker som krever menneske, med alvorlighet og SLA.
- **Feiltaksonomi** — det faste settet feilkoder (`API_TIMEOUT`, `DATA_CONFLICT` …) som gjør
  feilrate målbar.
- **Prompt-ID** — identiteten til en prompt-versjon (`{id}-v{version}`) som utfall måles mot.
- **KPI** — et styringstall med definert kilde, formel og mål. Se [`observability/metrics.md`](../observability/metrics.md).

## Konvensjoner
- **Sannhetskilde (source of truth)** — det ene autoritative stedet for et gitt faktum. Prosess →
  dette repoet; levende data → de tilkoblede verktøyene.
