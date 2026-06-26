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
   │  EXECUTION SURFACES               │   │  AUTOMATION ENGINES     │
   │  Claude · ChatGPT                 │   │  n8n · Zapier           │
   └───────────────┬───────────────────┘   └───────────┬────────────┘
                   │                                    │
                   ▼                                    ▼
   ┌────────────────────────────────────────────────────────────────┐
   │  SYSTEMS OF RECORD                                              │
   │  Gmail · Google Calendar · Notion · Google Drive/Docs/Sheets   │
   └────────────────────────────────────────────────────────────────┘
```

Key insight: **this repository is the source of truth for *how the work is done*. The external
tools remain the source of truth for *the live data* (emails, events, documents).** We do not
duplicate live data here; we describe the model, the process, and the instructions.

## 2. The layers

The repository is organized into clear layers, each with a single responsibility.

### Knowledge layer — *what we know*
- **`sales/`** — Ideal Customer Profile, sales methodology, playbooks for B2B deals, corporate
  events, restaurant partnerships, and marketing collaborations.
- **`crm/`** — the data model: what a contact, account, and deal look like; pipeline stages;
  how records map onto Notion / Google Sheets.

### Instruction layer — *how to act*
- **`prompts/`** — a versioned library of reusable prompts for concrete sales tasks.
- **`agents/`** — composed roles that bundle a purpose, instructions, the prompts they use, the
  tools they may call, and guardrails.

### Connection layer — *how we reach the world*
- **`integrations/`** — conventions and notes for each connected tool (Gmail, Calendar, Notion,
  Drive). Describes *what each integration is allowed to do* and the data it exposes.
- **`workflows/`** — automations that run in n8n or Zapier, documented so they are
  understandable and reproducible even though they execute outside this repo.

### Foundation layer — *how everything is governed*
- **`config/`** — shared settings, environment conventions, and non-secret configuration.
- **`docs/`** — architecture, principles, standards, and roadmap.

## 3. Data flow examples

**Outbound prospecting**
1. A prospect/account is defined per the `crm/` model.
2. The `sales-development-agent` (`agents/`) selects an outreach prompt from `prompts/outreach/`.
3. It drafts a personalized email using the `sales/` ICP and messaging.
4. The draft is created in Gmail via an `integrations/` connection (human reviews before send).
5. The activity and next step are logged to the CRM (Notion/Sheets).

**Inbound triage**
1. An n8n `workflow` watches the Gmail inbox.
2. New messages are classified using a `prompts/` triage prompt.
3. Hot leads create a CRM record and a calendar hold; routine messages get a draft reply.

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
