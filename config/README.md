# Config

Shared, **non-secret** configuration and conventions for the Eik Sales OS. This module answers
"what are the shared settings everything should agree on?" — without ever holding a secret.

## Hard rule: no secrets
- **Never** commit API keys, tokens, passwords, or OAuth credentials.
- Secrets live in the execution environment (Claude/ChatGPT/n8n/Zapier) and are referenced **by
  name** here, never by value.
- See [`docs/CODING_STANDARDS.md`](../docs/CODING_STANDARDS.md#secrets--privacy).

## What lives here
- Shared constants and conventions (timezone, currency, language defaults).
- Non-secret references to integrations (the *names* of credentials, not the values).
- Example/template config files (`*.example.*`) showing structure without real data —
  see [`settings.example.yaml`](settings.example.yaml). Copy it to `settings.local.yaml`
  (git-ignored) and adapt.

## Shared defaults
| Setting | Value |
| --- | --- |
| Timezone | `Europe/Oslo` |
| Currency | `NOK` |
| Default language | Norwegian (Bokmål); English variants suffixed `.en` (ADR 0001) |
| Date format | ISO 8601 (`YYYY-MM-DD`) |
| Owner (default) | Jonathan Foss |

## Modellpriser (for kostnadsestimat i Agentlogg)
Én kilde til sannhet for `Estimert kostnad` i måle-laget — så et prisbytte gjøres **ett** sted, ikke
hardkodet i agenter/workflows (jf. [`observability/logging-standard.md`](../observability/logging-standard.md#kostnad--ressurs)).
Priser oppgis i USD per 1M tokens; `Estimert kostnad` lagres i NOK.

| Modell | USD / 1M inn | USD / 1M ut |
| --- | --- | --- |
| `claude-opus-4-8` | `[bekreft mot gjeldende prisliste]` | `[bekreft]` |
| `claude-sonnet-4-6` | `[bekreft]` | `[bekreft]` |
| `claude-haiku-4-5` | `[bekreft]` | `[bekreft]` |
| `gpt-4o` | `[bekreft]` | `[bekreft]` |

| Konstant | Verdi |
| --- | --- |
| `USD_NOK` (vekslingskurs) | `[bekreft, f.eks. ~10.7]` |

**Formel:** `Estimert kostnad (NOK) = ((tokens_inn / 1e6) × pris_inn + (tokens_ut / 1e6) × pris_ut) × USD_NOK`

> Verdiene er bevisst `[bekreft]` — vi dikter ikke opp priser (guardrail). Fyll inn fra gjeldende
> prislister når loggingen settes opp, og hold dette som det eneste stedet de bor.

## Secret references (names only)
When integrations are wired in Phase 1, list the credential *names* the system expects, e.g.:

| Reference name | Used by | Provided via |
| --- | --- | --- |
| `AIRTABLE_API_KEY` | Airtable CRM (`appzIFWfzob6WEhnq`) | Execution environment |
| `GMAIL_OAUTH` | Gmail integration | Execution environment |
| `GCAL_OAUTH` | Calendar integration | Execution environment |

(Names are illustrative — fill in as integrations are added. Values never appear here.)

## Adding config
Keep it minimal. Add a setting only when more than one place needs to agree on it. Don't build
configuration ahead of need ([`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md) — don't overengineer).
