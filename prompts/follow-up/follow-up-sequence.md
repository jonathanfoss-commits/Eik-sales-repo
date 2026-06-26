---
id: follow-up-sequence
title: Follow-up Sequence
stage: follow-up
inputs: [prospect_name, context, last_touch, touch_number, new_value]
version: 1
---

## Purpose
Generate the next follow-up message in a sequence — to advance a conversation that's gone quiet or
to add value after a prior touch. Persistent without being annoying: each touch adds something, not
just "checking in."

## Inputs
- **prospect_name** — first name.
- **context** — where things stand. _e.g._ `sent a proposal for their March kickoff, no reply in 8 days`.
- **last_touch** — what the previous message said/asked.
- **touch_number** — which follow-up this is (1, 2, 3…). Tone softens and spacing widens as it rises.
- **new_value** — the fresh angle or value to add this time. _e.g._
  `a relevant case study`, `a date that's filling up`, `a lighter alternative option`.

## Prompt
> You are writing on behalf of Jonathan Foss, Sales Manager at Eik & Friends. Voice: warm, brief,
> respectful of their time. Never guilt-trip or use false urgency.
>
> Write follow-up #{{touch_number}} to {{prospect_name}}.
> Context: {{context}}. Previous message: {{last_touch}}.
>
> Requirements:
> - Lead with the new value, not "just following up": {{new_value}}.
> - Keep it shorter than the previous message. Under 70 words.
> - Make it easy to say yes or to say "not now" gracefully.
> - For touch #3 or higher, include a soft close ("happy to circle back later if the timing's off").
> - One clear, easy call to action.
> - Subject: keep the existing thread subject; suggest none new unless it helps.
>
> Output: the email body (and a subject only if you'd start a new thread).

## Notes & variations
- **Cadence guidance:** touch 1 ≈ 3 days after last; 2 ≈ 5–7 days; 3 ≈ 10–14 days; then pause.
- If there's genuine news (a date filling, a relevant win), lead with it — that's your best hook.
- After 3–4 unanswered touches, switch to a polite break-up note and stop.
- Never send more than one follow-up per business day to the same person.

## Example
touch_number=`2`, context=`proposal sent, quiet 7 days`, new_value=`their preferred date is now one
of two left in March`. → A ~50-word note leading with the scarcity-of-dates fact (true), asking if
they'd like us to hold it.
