# Prompts

A versioned, reusable library of prompts for concrete sales tasks. Prompts are the building blocks
that [agents](../agents/) compose. Keep them sharp, specific, and tool-agnostic so they work in
Claude or ChatGPT alike.

## Organization
Prompts are grouped by sales stage:

| Folder | Stage |
| --- | --- |
| [`outreach/`](outreach/) | First contact — cold and warm outbound. |
| [`follow-up/`](follow-up/) | Advancing or reviving conversations. |
| [`meetings/`](meetings/) | Preparing for and following up on meetings. |
| [`negotiation/`](negotiation/) | Working terms toward a close. |

## Prompt file template
Every prompt follows this structure:

```markdown
---
id: <stable-kebab-id>
title: <Human Title>
stage: outreach | follow-up | meetings | negotiation
inputs: [list, of, required, inputs]
version: 1
---

## Purpose
What this prompt is for and when to use it.

## Inputs
Each input explained, with example values.

## Prompt
> The actual prompt text, with {{placeholders}} for inputs.

## Notes & variations
Tips, common adjustments, and when *not* to use it.

## Example
A short filled-in example of input → output.
```

## Conventions
- **Placeholders** use `{{double_braces}}` and match the `inputs` list exactly.
- **Tool-agnostic** by default. If a prompt is tied to a surface, say so in Notes.
- **Honest and concise.** Eik & Friends' voice is warm, professional, and direct — no hype, no
  pressure. Short messages with one clear call to action.
- **Localize when needed.** Norwegian variants use the `.no.md` suffix.
- Bump `version` on meaningful edits; keep the `id` stable.

## Index
- Outreach: [`cold-outreach`](outreach/cold-outreach.md) ([🇳🇴](outreach/cold-outreach.no.md)),
  [`partnership-pitch`](outreach/partnership-pitch.md) ([🇳🇴](outreach/partnership-pitch.no.md))
- Follow-up: [`follow-up-sequence`](follow-up/follow-up-sequence.md) ([🇳🇴](follow-up/follow-up-sequence.no.md))
- Meetings: [`meeting-prep`](meetings/meeting-prep.md), [`meeting-followup`](meetings/meeting-followup.md)
- Negotiation: [`negotiation-prep`](negotiation/negotiation-prep.md)

🇳🇴 = Norwegian (Bokmål) variant available. English is the default; keep variants in sync when
editing the source prompt.
