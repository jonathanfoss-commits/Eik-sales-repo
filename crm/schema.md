# CRM-skjema

Den kanoniske datamodellen. Felt-*identifikatorer* bruker `snake_case` og holdes på engelsk (teknisk
standard, jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md)); typene kommer fra det faste
vokabularet i [`docs/NAMING_CONVENTIONS.md`](../docs/NAMING_CONVENTIONS.md). Kolonnen **Synlig navn**
viser den norske Notion-egenskapen / Sheet-kolonnen — det brukervendte navnet.

---

## Konto (Account)
En virksomhet vi selger til eller samarbeider med.

| Felt (id) | Type | Påkrevd | Beskrivelse | Synlig navn |
| --- | --- | --- | --- | --- |
| `account_id` | text | ja | Stabil unik id (kebab-case). | Tittel/nøkkel |
| `name` | text | ja | Selskapsnavn. | Navn |
| `account_type` | select | ja | `Kunde`, `Prospekt`, `Partner`. | Type |
| `industry` | text | nei | Bransje/sektor. | Bransje |
| `size` | select | nei | `1-19`, `20-49`, `50-199`, `200-499`, `500+`. | Størrelse |
| `location` | text | nei | By / region. | Sted |
| `website` | url | nei | Nettside. | Nettside |
| `icp_fit` | select | nei | `Sterk`, `Moderat`, `Svak`. | ICP-treff |
| `owner` | text | ja | Intern eier (standard: Jonathan). | Eier |
| `notes` | long_text | nei | Fri kontekst. | Notater |
| `created_at` | date | ja | Post opprettet. | Opprettet |

## Kontakt (Contact)
En person hos en konto.

| Felt (id) | Type | Påkrevd | Beskrivelse | Synlig navn |
| --- | --- | --- | --- | --- |
| `contact_id` | text | ja | Stabil unik id. | Tittel/nøkkel |
| `account_id` | relation | ja | Tilhørende konto. | Konto (relasjon) |
| `first_name` | text | ja | Fornavn. | Fornavn |
| `last_name` | text | nei | Etternavn. | Etternavn |
| `role` | text | nei | Stillingstittel. | Rolle |
| `email` | email | nei | Primær e-post. | E-post |
| `phone` | phone | nei | Telefon. | Telefon |
| `is_decision_maker` | boolean | nei | Økonomisk/beslutningsmyndighet. | Beslutningstaker |
| `do_not_contact` | boolean | nei | Reservasjonsflagg — respekteres alltid. | Ikke kontakt |
| `preferred_language` | select | nei | `Norsk`, `Engelsk`. | Språk |
| `notes` | long_text | nei | Kontekst om personen. | Notater |

## Avtale (Deal)
En potensiell forretning.

| Felt (id) | Type | Påkrevd | Beskrivelse | Synlig navn |
| --- | --- | --- | --- | --- |
| `deal_id` | text | ja | Stabil unik id. | Tittel/nøkkel |
| `name` | text | ja | Forståelig avtalenavn. | Navn |
| `account_id` | relation | ja | Tilknyttet konto. | Konto (relasjon) |
| `primary_contact_id` | relation | nei | Hovedkontakt. | Kontakt (relasjon) |
| `deal_type` | select | ja | `Bedriftsarrangement`, `Restaurantpartnerskap`, `Markedssamarbeid`, `Annet`. | Type |
| `stage` | select | ja | Se [`pipeline-stages.md`](pipeline-stages.md). | Steg |
| `value` | currency | nei | Forventet verdi (NOK). | Verdi |
| `expected_close_date` | date | nei | Beste estimat for signering. | Sluttdato |
| `next_step` | text | ja* | Neste handling. *(påkrevd mens åpen)* | Neste steg |
| `next_step_date` | date | ja* | Når neste handling forfaller. | Dato neste steg |
| `probability` | number | nei | 0–100 % sannsynlighet. | Sannsynlighet |
| `source` | select | nei | `Utgående`, `Innkommende`, `Anbefaling`, `Partner`. | Kilde |
| `lost_reason` | text | nei | Hvis tapt, hvorfor (ærlig). | Tapsårsak |
| `owner` | text | ja | Avtaleeier. | Eier |
| `created_at` | date | ja | Post opprettet. | Opprettet |

\* `next_step` og `next_step_date` er påkrevd for enhver avtale som ikke er i et avsluttet steg
(`Vunnet`/`Tapt`) — se steghygiene i [`sales/methodology.md`](../sales/methodology.md).

## Aktivitet (Activity)
En logget interaksjon.

| Felt (id) | Type | Påkrevd | Beskrivelse | Synlig navn |
| --- | --- | --- | --- | --- |
| `activity_id` | text | ja | Stabil unik id. | Tittel/nøkkel |
| `deal_id` | relation | nei | Tilknyttet avtale (om noen). | Avtale (relasjon) |
| `contact_id` | relation | nei | Tilknyttet kontakt. | Kontakt (relasjon) |
| `type` | select | ja | `E-post`, `Samtale`, `Møte`, `Notat`, `Oppgave`. | Type |
| `summary` | long_text | ja | Hva som skjedde / ble sagt. | Sammendrag |
| `occurred_at` | datetime | ja | Når det skjedde (Europe/Oslo). | Tidspunkt |
| `created_by` | text | ja | Menneske- eller agentnavn. | Opprettet av |

---

## Konvensjoner
- **Id-er er stabile og gjenbrukes aldri.** Bruk beskrivende kebab-case
  (`deal-acme-2026-vaarlansering`).
- **Datoer** er ISO 8601; datotid bærer Europe/Oslo-konteksten.
- **Relasjoner** refererer til den tilknyttede entitetens id.
- **Synlige navn og utvalgsverdier er norske; identifikatorer er engelske.** Endrer du skjemaet, må
  det reflekteres i Notion/Sheets-implementasjonen og noteres i [veikartet](../docs/ROADMAP.md) hvis
  det er strukturelt.
