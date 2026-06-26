# Integrations

How the Eik Sales OS connects to the outside world. Each connected tool is a **system of record**
for some concern; this module documents what each integration is for, what it's *allowed* to do,
and the data it exposes — so agents act safely and predictably.

> Connections are configured in the execution surfaces (Claude, ChatGPT, n8n, Zapier), **not**
> stored in this repo. Secrets never live here (see
> [`docs/CODING_STANDARDS.md`](../docs/CODING_STANDARDS.md#secrets--privacy)).

## Connected tools

| Tool | System of record for | Default permission |
| --- | --- | --- |
| **Gmail** | Email conversations | Read, label, **draft** (no autonomous send) |
| **Google Calendar** | Availability & meetings | Read, create holds/events (confirm attendees) |
| **Notion** | CRM & knowledge base | Read / write per the [CRM schema](../crm/schema.md) |
| **Google Drive / Docs** | Documents & proposals | Read / create (no destructive deletes) |
| **Google Sheets** | Lightweight CRM / analytics | Read / write |
| **n8n** | Automation engine | Triggers & runs [workflows](../workflows/) |
| **Zapier** | Automation engine (9k+ apps) | Triggers & runs workflows |

## Default guardrails (apply to all integrations)
1. **Human-in-the-loop for outward actions.** Sending email, messaging a partner, or publishing is
   drafted for review unless a workflow is explicitly approved for automation.
2. **No destructive actions** (delete, overwrite) without explicit confirmation.
3. **Least privilege.** An agent gets only the access its job requires.
4. **Respect flags.** Honor `do_not_contact` and opt-outs from the [CRM](../crm/schema.md).
5. **Privacy.** Don't export contact data out of the systems of record.

## Per-tool notes
Detailed, per-tool integration docs (purpose, least-privilege permissions, conventions, and a
Phase 1 validation checklist):

| Doc | Tool | Status |
| --- | --- | --- |
| [`gmail-integration.md`](gmail-integration.md) | Gmail | Documented; pending validation |
| [`calendar-integration.md`](calendar-integration.md) | Google Calendar | Documented; pending validation |
| [`notion-integration.md`](notion-integration.md) | Notion (CRM) | Documented; pending build |

Add a new `*-integration.md` as each additional tool is brought in.

## Adding a new integration
1. Confirm it earns its place (a real, recurring need).
2. Document it here before wiring it up.
3. Apply least privilege and the default guardrails.
4. Note it in the [roadmap](../docs/ROADMAP.md) if it changes the architecture.
