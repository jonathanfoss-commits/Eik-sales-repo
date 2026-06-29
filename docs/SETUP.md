# Setup

How to start using and contributing to the Eik Sales OS. This repository has no build step — it
is a knowledge base — so "setup" means getting oriented and connecting your tools.

## 1. Get the repository
```bash
git clone <repo-url>
cd Eik-sales-repo
```

Open it in your editor of choice, or browse on GitHub. Everything is Markdown.

## 2. Orient yourself
Read, in order:
1. [`README.md`](../README.md) — what this is.
2. [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — how it fits together.
3. [`docs/PRINCIPLES.md`](PRINCIPLES.md) — how we build.
4. The `README.md` of whichever module you'll work in.

## 3. Connect your tools (for live operation)
The system acts through Jonathan's daily tools. Connections are made in the surfaces that execute
the work (Claude, ChatGPT, n8n, Zapier), **not** stored in this repo. See
[`integrations/README.md`](../integrations/README.md) for the per-tool conventions and what each
integration is permitted to do.

Tools in scope:
- **Airtable** — the live CRM (base `appzIFWfzob6WEhnq`): read/create/update, no deletes. See
  [ADR 0002](decisions/0002-faktisk-systemarkitektur.md).
- **Gmail** — read, draft, label (sending is human-approved by default).
- **Google Calendar** — read availability, create holds and events.
- **Google Drive / Docs** — documents and proposals (and backup exports).
- **Apollo / Clay** — lead generation and enrichment.
- **n8n / Zapier** — automation engines that trigger workflows.
- **Notion** — ⚠️ archived old CRM; read-only history, never written to.

## 4. Secrets
- Secrets (API keys, OAuth tokens) live in the execution environment, never in this repo.
- `config/` holds only non-secret configuration and references secrets by name.
- See [`docs/CODING_STANDARDS.md`](CODING_STANDARDS.md#secrets--privacy).

## 5. Make a change
1. Create a branch (`feature/<topic>` or use the AI session branch).
2. Make one focused change; update the relevant docs in the same change.
3. Commit with a [Conventional Commit](NAMING_CONVENTIONS.md#git-commits) message.
4. Open a pull request for review before merging to `main`.

## 6. Using the assets day-to-day
- Need to write outreach? Open [`prompts/outreach/`](../prompts/outreach/).
- Prepping for a meeting? Use [`prompts/meetings/meeting-prep.md`](../prompts/meetings/meeting-prep.md).
- Setting up an agent? Start from [`agents/README.md`](../agents/README.md).

No installation required — copy a prompt into Claude or ChatGPT, fill in the inputs, and go.
