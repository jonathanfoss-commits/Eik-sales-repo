# Workflow: Inbound Lead Triage

- **Engine:** n8n
- **Status:** draft (target: Phase 1)
- **Trigger:** new email arrives in the Gmail inbox (Gmail trigger / polling)
- **Approval gate:** yes — replies are drafted and CRM creates are proposed; a human confirms
  before anything is sent or a deal is created.

## Goal
Make sure no inbound sales opportunity is missed, and turn a noisy inbox into a prioritized,
actionable queue — automatically, but with a human in the loop for outward actions.

## Steps
1. **Trigger:** a new message lands in Gmail.
2. **Pre-filter:** skip obvious noise (newsletters, automated notifications) via simple rules.
3. **Classify:** run the triage logic from
   [`inbox-triage-agent`](../agents/inbox-triage-agent.md) to label the thread:
   `Hot Lead` · `Active Deal` · `Routine` · `Low Priority`. Judge "hot" against the
   [ICP](../sales/icp.md).
4. **Label:** apply the matching `Sales/*` label in Gmail
   (see [`gmail-integration.md`](../integrations/gmail-integration.md)).
5. **Branch by class:**
   - **Hot Lead →** create a row in the Airtable **Avtaler** table (Status `Ny lead`) with the
     `Gmail-tråd` link, propose a calendar hold, and draft a reply.
   - **Active Deal →** link to the existing Avtaler row, draft the next-step reply, propose a CRM update.
   - **Routine →** draft a short reply or propose the calendar action.
   - **Low Priority →** label and stop.
6. **Approval:** collect drafts + proposed CRM/calendar changes into a review queue (e.g. a daily
   digest or notification) for the human to confirm.
7. **On confirm:** send the draft / commit the CRM change. (Until approved, nothing leaves.)

> **Realized by** the [`digital-jonathan`](../agents/digital-jonathan.md) agent — this is the
> lead-intake part of its daily run, not a separate flow.

## Prompts / agents used
- Agent: [`digital-jonathan`](../agents/digital-jonathan.md) (lead intake)
- Prompt: [`follow-up-sequence`](../prompts/follow-up/follow-up-sequence.md) for next-step replies
- Reference: [`sales/icp.md`](../sales/icp.md) for "hot" judgment

## Side effects
- **Reads:** Gmail threads, Airtable CRM (Avtaler), Calendar availability.
- **Writes:** Gmail labels (immediate, safe) and Avtaler rows (Status `Ny lead` + `Gmail-tråd`);
  email replies are **drafts only** until Jonathan confirms.

## Failure handling
- If classification is low-confidence, default to `Routine` and flag for human review rather than
  guessing `Hot Lead`/`Low Priority`.
- If a downstream tool (Airtable/Calendar) is unavailable, still apply the Gmail label and queue the
  action for retry — never drop a hot lead silently.
- Idempotency: key on the Gmail thread id so re-runs don't duplicate rows or drafts.

## Build checklist
- [ ] Gmail trigger connected (read/label/draft scopes only).
- [ ] Classification step validated on a sample of real threads.
- [ ] Airtable Avtaler create/update wired to the [schema](../crm/schema.md).
- [ ] `Gmail-tråd` populated on each new lead row.
- [ ] Idempotency verified (no duplicates on re-run).
