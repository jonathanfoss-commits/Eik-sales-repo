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
   - **Hot Lead →** propose a new Account/Contact/Deal in Notion (stage `Prospekt`/`I dialog`),
     propose a calendar hold, and draft a reply.
   - **Active Deal →** link to the existing deal, draft the next-step reply, propose a CRM update.
   - **Routine →** draft a short reply or propose the calendar action.
   - **Low Priority →** label and stop.
6. **Approval:** collect drafts + proposed CRM/calendar changes into a review queue (e.g. a daily
   digest or notification) for the human to confirm.
7. **On confirm:** send the draft / commit the CRM change. (Until approved, nothing leaves.)

## Prompts / agents used
- Agent: [`inbox-triage-agent`](../agents/inbox-triage-agent.md)
- Prompt: [`follow-up-sequence`](../prompts/follow-up/follow-up-sequence.md) for next-step replies
- Reference: [`sales/icp.md`](../sales/icp.md) for "hot" judgment

## Side effects
- **Reads:** Gmail threads, Notion CRM, Calendar availability.
- **Writes (after approval):** Gmail labels (immediate, safe); Gmail sends, Notion records, and
  Calendar holds (only on human confirm).

## Failure handling
- If classification is low-confidence, default to `Routine` and flag for human review rather than
  guessing `Hot Lead`/`Low Priority`.
- If a downstream tool (Notion/Calendar) is unavailable, still apply the Gmail label and queue the
  action for retry — never drop a hot lead silently.
- Idempotency: key on the Gmail thread id so re-runs don't duplicate records or drafts.

## Build checklist (Phase 1)
- [ ] Gmail trigger connected (read/label/draft scopes only).
- [ ] Classification step validated on a sample of real threads.
- [ ] Notion create/update wired to the [schema](../crm/schema.md).
- [ ] Approval/review step in place before any send or deal creation.
- [ ] Idempotency verified (no duplicates on re-run).
