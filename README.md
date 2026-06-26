# Eik Sales OS

> The central brain for the AI ecosystem of **Jonathan Foss**, Sales Manager at **Eik & Friends** (Norway).

This repository is an **AI operating system** for high-performance B2B sales. It is not an
application you run — it is a structured, version-controlled knowledge base that AI agents
(Claude, ChatGPT) and automation tools (n8n, Zapier) read from and write to in order to do
real sales work: prospecting, outreach, follow-up, meeting prep, negotiation, partnership
development, and reporting.

The guiding idea: **everything that makes Jonathan effective at sales should live here as
reusable, composable, documented building blocks** — so that both humans and AI agents can
understand the work, repeat it, and improve it over time.

---

## What this repository contains

| Module | Purpose |
| --- | --- |
| [`agents/`](agents/) | Definitions for AI agents (role, instructions, tools, guardrails). |
| [`prompts/`](prompts/) | Reusable, battle-tested prompt library for sales tasks. |
| [`sales/`](sales/) | Sales playbooks: ICP, methodology, event & partnership processes. |
| [`crm/`](crm/) | The customer & deal data model, pipeline stages, and sync conventions. |
| [`integrations/`](integrations/) | How the system connects to Gmail, Calendar, Notion, Drive, etc. |
| [`workflows/`](workflows/) | Automation definitions (n8n, Zapier) and their documentation. |
| [`config/`](config/) | Configuration conventions, environment, and shared settings. |
| [`docs/`](docs/) | Architecture, roadmap, principles, and contributor standards. |

> Folders are only created when they hold real, useful content. We grow the structure as the
> work demands it — never empty scaffolding.

---

## Quick start

1. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) to understand how the pieces fit together.
2. Read [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) to understand *how* we build here.
3. Browse [`prompts/`](prompts/) for ready-to-use sales prompts.
4. See [`docs/SETUP.md`](docs/SETUP.md) to connect your tools.

## For AI agents

If you are an AI agent operating in this repository, start with
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md),
then load the relevant module's `README.md` before acting. Every module documents its own
conventions.

---

## Status

**Phase 0 — Foundation.** Core structure, documentation, and the first high-value sales assets
are in place. See [`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next.
