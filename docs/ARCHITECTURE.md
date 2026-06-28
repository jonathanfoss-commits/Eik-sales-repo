# Architecture

This document describes how the Eik Sales OS is structured and how information flows through it.

## 1. Mental model

The system is a **knowledge-and-automation layer** that sits between Jonathan and his tools.

```
                ┌─────────────────────────────────────────────┐
                │                  HUMAN                       │
                │              (Jonathan Foss)                 │
                └───────────────────┬─────────────────────────┘
                                    │ intent / review
                                    ▼
       ┌────────────────────────────────────────────────────────────┐
       │                   EIK SALES OS (this repo)                  │
       │                                                            │
       │   agents/      prompts/      sales/      crm/   config/    │
       │   (who acts)   (how to act)  (playbooks) (data) (settings) │
       │                                                            │
       │             integrations/        workflows/                │
       │             (how we connect)     (what runs automatically) │
       └───────────────────┬───────────────────────┬───────────────┘
                           │                        │
              reads/writes │                        │ triggers
                           ▼                        ▼
   ┌───────────────────────────────────┐   ┌────────────────────────┐
   │  EXECUTION SURFACES               │   │  AUTOMATION ENGINE      │
   │  Claude · ChatGPT                 │   │  n8n (AI-agents)        │
   └───────────────┬───────────────────┘   └───────────┬────────────┘
                   │                                    │
                   ▼                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  SYSTEMS OF RECORD                                              │
   │  Airtable (CRM) · Gmail · Google Calendar · Drive/Docs         │
   │  (Notion = archived old CRM)                                   │
   └────────────────────────────────────────────────────────────────┘
```

Key insight: **this repository is the source of truth for *how the work is done*. The external
tools remain the source of truth for *the live data*** — the **Airtable** CRM holds deals/venues,
Gmail holds conversations, Calendar holds meetings. We do not duplicate live data here; we describe
the model, the process, and the instructions. See
[ADR 0002](decisions/0002-faktisk-systemarkitektur.md) for why Airtable (not Notion) is the CRM.

## 2. The layers

The repository is organized into clear layers, each with a single responsibility.

### Knowledge layer — *what we know*
- **`sales/`** — Ideal Customer Profile, sales methodology, the seasonal calendar, and playbooks
  for corporate events and venue/restaurant partnerships. Eik & Friends is a **restaurant
  collective** (~22 venues) selling event/private/gavekort/Amex bookings.
- **`crm/`** — documentation of the live **Airtable** CRM: the tables (Avtaler, Venues,
  Partneravtaler, Kampanjer, Agentlogg), their fields, and the real status pipeline.

### Instruction layer — *how to act*
- **`prompts/`** — a versioned library of reusable prompts for concrete sales tasks.
- **`agents/`** — composed roles that bundle a purpose, instructions, the prompts they use, the
  tools they may call, and guardrails.

### Connection layer — *how we reach the world*
- **`integrations/`** — conventions and notes for each connected tool (Airtable, Gmail, Calendar,
  Drive). Describes *what each integration is allowed to do* and the data it exposes.
- **`workflows/`** — the n8n automations and AI-agents (Digital Jonathan, Gavekort-selger),
  documented so they are understandable and reproducible even though they execute outside this repo.

### Governance & measurement layer (L4) — *how the system watches and improves itself*
- **`observability/`** — the nervous system: a logging standard (every agent logs what it did, why,
  and what it cost), a **measurement loop** that links each outward action to an outcome, a KPI
  catalog, and an escalation queue. This is what turns a pile of automations into an OS that learns.
  See [ADR 0005](decisions/0005-styrings-og-maalelag.md).
- **`agents/` (orchestrator + kvalitetssikrer)** — the governance agents that route work, enforce
  guardrails, and quality-gate drafts before they reach Jonathan.

### Foundation layer — *how everything is governed*
- **`config/`** — shared settings, environment conventions, and non-secret configuration.
- **`tests/`** — scenario-based test library (with synthetic fixtures) so agent behaviour can be
  verified without production data.
- **`integrations/resilience.md`** — failure, fallback and backup strategy: how the system behaves
  when a tool is down (fail safe, never fail silent).
- **`docs/`** — architecture, principles, standards, strategy, and roadmap.

## 3. Data flow examples

**Inbound lead (the real flow)**
1. An n8n agent ("Digital Jonathan") watches the Gmail inbox.
2. A new enquiry is captured as a row in the **Avtaler** table (status `Ny lead`), with the
   `Gmail-tråd` link back to the source email.
3. A reply is drafted in Gmail (never auto-sent) using the `prompts/` library and `sales/` context.
4. The action is logged in the **Agentlogg** table; anything uncertain is flagged for Jonathan.

**Proposal (tilbud)**
1. For a qualified deal, the n8n Tilbud-agent generates a proposal draft (see
   `prompts/proposals/tilbud.md`) and sets `Tilbudsutkast laget` so it isn't done twice.
2. Jonathan reviews and sends; the deal moves to `Tilbud sendt`.

**Weekly rhythm**
- 08:00 morning briefing (draft replies + auto-leads); Monday adds a pipeline review; Tuesday adds
  Apollo lead-fetch. 12:00/15:00 inbox triage. 21:00 meeting follow-up + next-day task list.

## 4. Design rules

- **Single source of truth per concern.** Process lives in this repo; live data lives in the tools.
- **Human-in-the-loop by default.** Anything outward-facing (sending email, booking time,
  messaging a partner) is drafted for review unless explicitly automated and approved.
- **Composability.** Agents are built from prompts; prompts reference playbooks; playbooks
  reference the data model. Small pieces, clearly wired.
- **Tool-agnostic where possible.** Prompts and playbooks should work whether executed by Claude
  or ChatGPT. Tool-specific details live in `integrations/` and `workflows/`.

See [`PRINCIPLES.md`](PRINCIPLES.md) for the values behind these rules and
[`ROADMAP.md`](ROADMAP.md) for where the architecture is heading.
