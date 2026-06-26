# Agents

AI agent definitions. An **agent** is a defined role that bundles a purpose, operating
instructions, the prompts it relies on, the tools it may use, and its guardrails. Agents are how
we compose the reusable pieces in this repo into a worker that can do a real job.

## What an agent is (and isn't)
- An agent **is** a clear, portable specification you can give to Claude or ChatGPT (or wire into
  n8n) so it behaves consistently.
- An agent **is not** running code. The execution surface (Claude/ChatGPT/n8n) runs it; this file
  defines it.

## File format
Each agent lives in `<role>-agent.md` and follows this structure:

```markdown
---
name: <kebab-case-id>
purpose: <one sentence>
owner: Jonathan Foss
status: active | draft
---

## Mission
What this agent is responsible for.

## Operating instructions
How it should behave, step by step.

## Tools & integrations
Which integrations/tools it may use, and any limits.

## Prompts used
Links to the prompt files it relies on.

## Guardrails
What it must never do; where a human must approve.

## Inputs / Outputs
What it needs to start, and what it produces.
```

## Conventions
- Keep agents **focused** — one clear job each. Compose, don't bloat.
- Reuse prompts from [`prompts/`](../prompts/) rather than inlining instructions.
- Default to **human-in-the-loop** for anything outward-facing (see
  [`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).

## Current agents
| Agent | Purpose |
| --- | --- |
| [`sales-development-agent`](sales-development-agent.md) | Prospect, personalize, and draft outbound outreach + follow-ups. |
| [`inbox-triage-agent`](inbox-triage-agent.md) | Triage the Gmail inbox, classify messages, draft replies, flag hot leads. |
| [`meeting-prep-agent`](meeting-prep-agent.md) | Produce a concise prep brief before each meeting. |
