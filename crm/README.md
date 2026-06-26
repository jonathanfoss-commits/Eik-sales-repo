# CRM

The customer & deal **data model** for Eik Sales OS. This module defines *the shape of the data* —
what a Contact, Account, and Deal are — and how those map onto the tools that actually store the
live records (Notion primarily, Google Sheets as a lightweight alternative).

> **Important:** No live customer data lives in this repo. This is the schema and the conventions.
> The records themselves live in the connected systems of record (see
> [`integrations/`](../integrations/)). One source of truth per concern
> ([`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).

## Contents
| File | What it defines |
| --- | --- |
| [`schema.md`](schema.md) | The entities (Contact, Account, Deal, Activity) and their fields. |
| [`pipeline-stages.md`](pipeline-stages.md) | The deal pipeline stages and their meaning. |

## Entities at a glance
- **Account** — a company we sell to or partner with (incl. partner venues).
- **Contact** — a person at an account.
- **Deal** — a potential piece of business, moving through the pipeline.
- **Activity** — a logged interaction (email, call, meeting, note).

```
Account 1───* Contact
   │              │
   *              *
   └──── Deal ────┘
          │
          *
       Activity
```

## How agents use this
- Before creating or updating a record, follow `schema.md` for field names and types.
- Use the exact pipeline stage values from `pipeline-stages.md`.
- Propose CRM changes for human review (default) rather than writing silently.

## Implementation note
Phase 1 of the [roadmap](../docs/ROADMAP.md) creates the actual Notion databases mirroring this
schema. Until then, this is the contract agents and humans should follow.
