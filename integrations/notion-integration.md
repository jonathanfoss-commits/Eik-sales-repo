# Notion Integration

How the Eik Sales OS works with Notion. Notion is the primary **system of record for the CRM and
knowledge base**. The databases mirror the model defined in [`crm/schema.md`](../crm/schema.md).

## Purpose
- Store the live CRM: Accounts, Contacts, Deals, Activities.
- Let agents read records for context and propose updates (stage moves, next steps, logged
  activities).

## Database structure
Create four linked databases mirroring [`crm/schema.md`](../crm/schema.md):

| Database | Source entity | Key relations |
| --- | --- | --- |
| **Accounts** | Account | ← Contacts, ← Deals |
| **Contacts** | Contact | → Account |
| **Deals** | Deal | → Account, → Contact, ← Activities |
| **Activities** | Activity | → Deal, → Contact |

Property names and types follow the **Maps to** column in the schema. Use Notion `Select` for the
`select` fields and `Relation` for the `relation` fields. The Deal `Stage` select uses exactly the
values in [`crm/pipeline-stages.md`](../crm/pipeline-stages.md).

## Permissions (least privilege)
| Action | Allowed | Notes |
| --- | --- | --- |
| Read databases/pages | ✅ | For context. |
| Create records | ✅ | New leads, deals, activities. |
| Update records | ✅ | Stage moves, next steps — proposed for review by default. |
| Delete | ❌ | Human-only. |

Credential reference: `NOTION_TOKEN` (supplied by the execution environment).

## How agents use it
- **Read before write:** load the relevant record for context first.
- **Propose, don't silently change:** surface the intended update (e.g. "move to `Proposal`, next
  step: send tailored offer, due Fri") for human confirmation by default.
- **Stage hygiene:** never leave an open deal without `next_step` + `next_step_date`.

## Guardrails
- Use exact field names, types, and select values from the schema — no ad-hoc fields.
- No deletions by an agent.
- Respect `do_not_contact` and privacy; don't export data out of Notion.

## Validation checklist (Phase 1)
- [ ] Four databases created with correct properties, types, and relations.
- [ ] Deal `Stage` select matches `pipeline-stages.md` exactly.
- [ ] Integration token connected with read/write (no delete) scope.
- [ ] A sample Account→Contact→Deal→Activity chain round-trips correctly.
