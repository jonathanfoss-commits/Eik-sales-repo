# CRM

Dokumentasjon av det **levende CRM-et** for Eik & Friends. Det faktiske systemet er en
**Airtable-base** — «Salgspipeline – Restaurant CRM» (`appzIFWfzob6WEhnq`) — ikke noe som bor i
dette repoet. Denne modulen *beskriver* basens tabeller, felter og konvensjoner så mennesker og
AI-agenter jobber konsistent mot den. Se [ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

> **Viktig:** Levende kundedata ligger i Airtable, ikke her. Dette er skjemaet og konvensjonene.
> Endres Airtable-skjemaet, oppdater denne dokumentasjonen. Én sannhetskilde per område
> ([`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).

> **Historikk:** Et tidligere Notion-salgssystem ble arkivert 12.06.2026 og erstattet av Airtable.
> Vi skriver ikke til Notion-arkivet. Se [`integrations/notion-integration.md`](../integrations/notion-integration.md).

> **Språk:** Synlige feltnavn og utvalgsverdier er på norsk (slik de er i Airtable);
> tabell-/felt-id-er er Airtables tekniske id-er. Jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md).

## Eik & Friends i korthet
Eik & Friends er et **restaurantkollektiv** med ~22 spisesteder i Oslo-området (TAKET Steen &
Strøm, Sawan, Amazonia by BAR, Kastellet, Honolulu, Bar Vulkan, Brød & Sirkus m.fl.). Salget er
**bedriftsevent, private selskaper, gavekort og Amex-avtaler** på tvers av disse lokalene. To
selgere: **Jonathan Foss** og **Christopher Erstad**.

## Basens tabeller
| Tabell | Hva den holder |
| --- | --- |
| **Avtaler** | Alle leads, tilbud og bekreftede bestillinger. Én rad per avtale/event. Kjernen. |
| **Bedrifter** | Kjerneentitet for kunderelasjoner (ADR 0003): kontooversikt, livstidsverdi, kryss-salg. |
| **Venues** | Register over de ~22 spisestedene (kapasitet, konsept, egnethet, kontakt). |
| **Partneravtaler** | Samarbeids-/partneravtaler med fornyelsessyklus (medlemsfordeler, sponsor, gavekort-distribusjon). |
| **Kampanjer** | Salgs- og markedskampanjer (julebord, sommer, gavekort, Amex, events). |
| **Agentlogg** | AI-aktivitetslogg (L4): hva agentene gjorde, hvorfor, kostnad, og hva som trenger menneske. |
| **Utfall** | Måle-loopen (L4): kobler hver AI-handling til et resultat (sendt→svar→vunnet/tapt). |
| **Eskaleringer** | Kø (L4) for saker som krever menneske, med alvorlighet og SLA. |

Detaljerte felter og utvalgsverdier: [`schema.md`](schema.md). Pipeline (Avtaler.Status):
[`pipeline-stages.md`](pipeline-stages.md). L4-tabellene (Agentlogg/Utfall/Eskaleringer) er forankret
i [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md) og [`observability/`](../observability/).

## Bygge et CRM-grensesnitt
Vil du ha et visuelt CRM-cockpit (L5) som speiler dette skjemaet? Lim
[`crm-artifact-prompt.md`](crm-artifact-prompt.md) inn i Claude (med Artifacts på) — den genererer et
fungerende grensesnitt med samme tabeller, pipeline og agent-/måle-lag, klart til å koble på Airtable
senere.

## Slik bruker agentene dette
- **Les skjemaet** i `schema.md` før du oppretter eller oppdaterer en rad — bruk eksakte feltnavn
  og utvalgsverdier.
- **Avtaler er navet:** nye leads blir rader i Avtaler, knyttet til en Venue og en Selger.
- **Foreslå endringer for gjennomgang** der det er utadrettet konsekvens; rene CRM-oppdateringer
  (status, neste oppfølging) gjøres av n8n-agentene og logges i Agentlogg.
- **Aldri skriv til det arkiverte Notion-systemet.**

## Tilkobling
Airtable nås via Airtable-integrasjonen (se
[`integrations/airtable-integration.md`](../integrations/airtable-integration.md)). n8n-agentene
leser og skriver til basen som en del av sine arbeidsflyter
([`workflows/`](../workflows/)).
