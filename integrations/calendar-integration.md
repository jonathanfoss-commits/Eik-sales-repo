# Google Calendar Integration

How the Eik Sales OS works with Google Calendar. Calendar is the **system of record for
availability and meetings**. The system reads availability for scheduling and prep, and creates
holds/events — confirming attendees before inviting people.

## Purpose
- Surface availability when proposing meeting times.
- Create holds and events for confirmed meetings.
- Feed the [`meeting-prep-agent`](../agents/meeting-prep-agent.md) with upcoming meeting context.

## Permissions (least privilege)
| Action | Allowed | Notes |
| --- | --- | --- |
| Read events & availability | ✅ | For scheduling and prep. |
| Create events / holds | ✅ | Holds without invites by default. |
| Invite external attendees | ⚠️ | Human-confirmed before sending invites. |
| Update events | ✅ | For reschedules. |
| Delete events | ❌ | Human-only. |

Credential reference: `GCAL_OAUTH` (supplied by the execution environment).

## Conventions
- **Timezone:** `Europe/Oslo` always (see [`config/README.md`](../config/README.md)).
- **Holds vs meetings:** create a *hold* (no external invite) when a time is proposed but not
  confirmed; convert to a full event once both sides agree.
- **Naming:** event titles follow `Eik & Friends × <Company> — <purpose>` for easy scanning.
- **Buffers:** prefer not to stack meetings back-to-back; leave prep/travel buffer where possible.

## How agents use it
- **Scheduling:** read availability, propose 2–3 concrete slots, create a hold on agreement.
- **Prep:** the `meeting-prep-agent` reads upcoming events to build the pre-meeting brief.
- **Follow-up:** after a meeting, the next step's date can become a hold/reminder.

## Guardrails
- **Don't invite external people without human confirmation** — a wrong invite is public and
  hard to undo.
- No deletions by an agent.
- Keep personal/private events out of scope where calendars are shared.

## Validation checklist (Phase 1)
- [ ] OAuth connected with read + event-create scopes.
- [ ] Timezone confirmed as Europe/Oslo.
- [ ] Hold-vs-event behavior verified (no accidental external invites).
- [ ] Meeting-prep agent reads upcoming events correctly.
