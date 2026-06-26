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

## Eik & Friends-kontekst
- **Bedriftsarrangement** — et booket arrangement for en bedriftskunde (middager, lanseringer, samlinger).
- **Restaurantpartnerskap** — et løpende kommersielt forhold til et lokale/en restaurant.
- **Markedssamarbeid** — en felles kampanje eller co-marketing-ordning med en partner.

## Systembegreper
- **Agent** — en definert AI-rolle (formål + instruksjoner + verktøy + sikkerhetsgjerder). Se
  [`agents/`](../agents/).
- **Prompt** — en gjenbrukbar instruksjon for en bestemt oppgave. Se [`prompts/`](../prompts/).
- **Playbook** — en dokumentert salgsprosess eller -metode. Se [`sales/`](../sales/).
- **Workflow (arbeidsflyt)** — en automatisering som kjører i n8n eller Zapier. Se [`workflows/`](../workflows/).
- **Integrasjon** — en kobling til et eksternt verktøy (Gmail, Kalender, Notion …). Se
  [`integrations/`](../integrations/).
- **Kildesystem (system of record)** — det eksterne verktøyet som holder de levende, autoritative
  dataene for et område.
- **Menneske-i-løkken (human-in-the-loop)** — et steg der en person gjennomgår/godkjenner før en
  handling går ut.
- **Kjøreflate (execution surface)** — der arbeidet faktisk kjører (Claude, ChatGPT, n8n, Zapier).

## Konvensjoner
- **Sannhetskilde (source of truth)** — det ene autoritative stedet for et gitt faktum. Prosess →
  dette repoet; levende data → de tilkoblede verktøyene.
