# Gmail Integration

How the Eik Sales OS works with Gmail. Gmail is the **system of record for email conversations**.
The system reads context, organizes the inbox with labels, and **drafts** replies — but never sends
autonomously in the current phase.

## Purpose
- Give agents the email context they need (threads, history) for outreach, follow-up, and triage.
- Keep the inbox organized and prioritized.
- Draft replies and outreach for human review.

## Permissions (least privilege)
| Action | Allowed | Notes |
| --- | --- | --- |
| Read messages & threads | ✅ | For context and triage. |
| Search | ✅ | To find related history. |
| Create drafts | ✅ | All outward email starts as a draft. |
| Apply / remove labels | ✅ | For triage and organization. |
| **Send** | ❌ | **Human-approved only.** No autonomous send in Phase 1. |
| Delete / trash | ❌ | Never. |

Credential reference: `GMAIL_OAUTH` (value supplied by the execution environment — see
[`config/README.md`](../config/README.md)).

## Label scheme
A small, consistent label set drives triage (see [`inbox-triage-agent`](../agents/inbox-triage-agent.md)):

| Label | Meaning |
| --- | --- |
| `Sales/Hot Lead` | Buying or partnership signal — act fast. |
| `Sales/Active Deal` | Belongs to a deal in the pipeline. |
| `Sales/Follow-up` | Awaiting our next touch. |
| `Sales/Routine` | Scheduling/logistics/FYI. |
| `Sales/Partner` | Partner/venue correspondence. |

## How agents use it
- **Triage:** read unread → classify → apply a `Sales/*` label → draft where useful.
- **Outreach/follow-up:** the `sales-development-agent` creates a draft; a human reviews and sends.
- **Context:** read the relevant thread before drafting; never invent prior history.

## Guardrails
- **Drafts only** — sending is a human decision in this phase.
- Honor `do_not_contact` from the [CRM](../crm/schema.md) before drafting anything outbound.
- One follow-up per recipient per business day (see the follow-up prompt cadence).
- Never export contact data out of Gmail/CRM.

## Validation checklist (Phase 1)
- [ ] OAuth connected with read/label/draft scopes (no send/delete).
- [ ] Label set created in the account.
- [ ] Triage prompt produces correct classifications on a sample.
- [ ] Drafts appear correctly and are never auto-sent.
