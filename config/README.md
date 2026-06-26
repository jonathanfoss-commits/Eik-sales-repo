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
| Default language | English (Norwegian variants suffixed `.no`) |
| Date format | ISO 8601 (`YYYY-MM-DD`) |
| Owner (default) | Jonathan Foss |

## Secret references (names only)
When integrations are wired in Phase 1, list the credential *names* the system expects, e.g.:

| Reference name | Used by | Provided via |
| --- | --- | --- |
| `GMAIL_OAUTH` | Gmail integration | Execution environment |
| `GCAL_OAUTH` | Calendar integration | Execution environment |
| `NOTION_TOKEN` | Notion CRM | Execution environment |

(Names are illustrative — fill in as integrations are added. Values never appear here.)

## Adding config
Keep it minimal. Add a setting only when more than one place needs to agree on it. Don't build
configuration ahead of need ([`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md) — don't overengineer).
