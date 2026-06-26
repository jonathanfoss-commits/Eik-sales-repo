---
id: cold-outreach
title: Cold Outreach Email
stage: outreach
inputs: [prospect_name, prospect_company, prospect_role, personalization_hook, offering, call_to_action]
version: 1
---

## Purpose
Draft a short, personalized first-contact email to a prospect who doesn't know us yet. Goal: earn
a reply, not close a deal. Use when the target fits the ICP ([`../../sales/icp.md`](../../sales/icp.md)).

## Inputs
- **prospect_name** — first name. _e.g._ `Marit`
- **prospect_company** — their company. _e.g._ `Nordic Tech AS`
- **prospect_role** — their title. _e.g._ `Head of People`
- **personalization_hook** — one specific, true reason you're reaching out now. _e.g._
  `they just announced a 40-person Oslo office opening`
- **offering** — what Eik & Friends can do for them. _e.g._ `host their team launch dinner`
- **call_to_action** — the single ask. _e.g._ `a 15-minute call next week`

## Prompt
> You are writing on behalf of Jonathan Foss, Sales Manager at Eik & Friends, a Norwegian
> hospitality company specializing in corporate events, restaurant experiences, and partnerships.
> Voice: warm, professional, direct. No hype, no pressure, no jargon.
>
> Write a cold outreach email to {{prospect_name}}, {{prospect_role}} at {{prospect_company}}.
>
> Requirements:
> - Open with a specific, genuine reference to: {{personalization_hook}}. Do not flatter or fake.
> - In one or two sentences, connect that to how we could help: {{offering}}.
> - Make exactly one clear, low-friction ask: {{call_to_action}}.
> - Keep it under 120 words. Short sentences. Easy to reply to on a phone.
> - Sign off as Jonathan, Eik & Friends.
> - Provide a subject line under 6 words that is specific, not salesy.
>
> Output: subject line, then the email body. Nothing else.

## Notes & variations
- If the hook is weak or invented, **stop** and gather a real one first — a generic email is worse
  than none.
- Warmer intro (referral/mutual contact)? Lead with the connection instead of the hook.
- Norwegian recipient? Use the `cold-outreach.no.md` variant when available.

## Example
**Input:** prospect_name=`Marit`, prospect_company=`Nordic Tech AS`, prospect_role=`Head of People`,
personalization_hook=`your new Oslo office announcement`, offering=`host the team's launch dinner`,
call_to_action=`a quick 15-min call next week`.

**Output (illustrative):**
> **Subject:** Your Oslo office launch
>
> Hi Marit,
>
> Saw Nordic Tech is opening an Oslo office — congrats on the growth. Moments like this are worth
> marking, and that's what we do: we host launch dinners and team gatherings that actually feel
> personal, not corporate.
>
> Would a quick 15-minute call next week be worth it to see if we're a fit?
>
> Best,
> Jonathan — Eik & Friends
