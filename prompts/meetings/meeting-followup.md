---
id: meeting-followup
title: Post-Meeting Follow-up & Recap
stage: meetings
inputs: [attendees, meeting_summary, agreed_next_steps, open_questions, owner_actions]
version: 1
---

## Purpose
Turn raw meeting notes into (a) a crisp recap email to the prospect/partner and (b) a clean CRM
update. Sending a sharp recap fast is one of the highest-leverage habits in sales — it confirms
alignment and keeps momentum.

## Inputs
- **attendees** — who was in the meeting.
- **meeting_summary** — what was discussed (rough notes are fine).
- **agreed_next_steps** — what both sides agreed to do, with owners and dates.
- **open_questions** — anything left unresolved.
- **owner_actions** — specifically what Jonathan/Eik & Friends committed to.

## Prompt
> You are Jonathan Foss's assistant (Sales Manager, Eik & Friends). From the notes below, produce
> two outputs.
>
> Attendees: {{attendees}}
> Summary: {{meeting_summary}}
> Agreed next steps: {{agreed_next_steps}}
> Open questions: {{open_questions}}
> Our commitments: {{owner_actions}}
>
> **Output 1 — Recap email** (to send to the prospect/partner):
> - Warm one-line thanks.
> - 2–4 bullets confirming what was agreed.
> - Clear next steps with owners and dates.
> - One line inviting correction if anything's off.
> - Under 130 words. Voice: warm, professional, direct.
>
> **Output 2 — CRM update** (for our records):
> - New deal stage (if it changed) and why.
> - Next step + date.
> - Any new facts to record about the account/contact.
>
> Label the two outputs clearly.

## Notes & variations
- Send the recap within a few hours while it's fresh — speed signals professionalism.
- If commitments were vague, propose specific dates rather than leaving them open.
- Keep our commitments realistic; don't over-promise in the recap.

## Example
After a discovery call → a 90-word recap confirming the brief and a follow-up date, plus a CRM
update moving the deal from `Qualified` to `Proposal` with a next-step date.
