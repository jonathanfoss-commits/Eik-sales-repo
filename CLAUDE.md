# CLAUDE.md — Operating guide for AI agents

This file orients any AI agent (Claude Code or otherwise) working in this repository. Read it first.
It is intentionally short; the linked documents are the source of truth.

## What this repo is
**Eik Sales OS** — an AI operating system for the B2B sales work of Jonathan Foss, Sales Manager at
Eik & Friends (Norway). It is a *knowledge-and-automation layer*, not a runnable app: structured
Markdown that agents and automation tools (n8n, Zapier) read from and write to. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## The one rule you must not get wrong: language
**Norwegian (Bokmål) is the default.** Everything business- and user-facing — prompts, templates,
reports, AI outputs, CRM field labels, and documentation Jonathan reads — is written in natural
Norwegian. English is kept *only* for technical identifiers (code, `snake_case` field names, stable
`id`s, enum keys, filenames) and deep developer-internal docs. Full policy:
[`docs/decisions/0001-sprakpolicy.md`](docs/decisions/0001-sprakpolicy.md).

When you generate sales output (emails, proposals, summaries), write it in Norwegian unless the
recipient is explicitly international.

## Where things live
| Need | Go to |
| --- | --- |
| How it all fits together | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| How we build (values) | [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) |
| What's next | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Reusable sales prompts | [`prompts/`](prompts/) |
| Document templates (tilbud, signatur) | [`templates/`](templates/) |
| AI agent definitions | [`agents/`](agents/) |
| Sales strategy (ICP, method, playbooks) | [`sales/`](sales/) |
| Data model & pipeline stages | [`crm/`](crm/) |
| Tool connections | [`integrations/`](integrations/) |
| Automations | [`workflows/`](workflows/) |
| Key decisions & why | [`docs/decisions/`](docs/decisions/) |

Every module has a `README.md` documenting its own conventions — read it before working in that module.

## Guardrails (non-negotiable)
- **Human-in-the-loop for outward actions.** Drafting email, messaging a partner, creating CRM
  records, booking calendar invites → propose for review, never send/commit autonomously.
- **No secrets in the repo.** API keys/tokens live in the execution environment, referenced by name
  only. Live customer data stays in the connected tools, never committed here.
- **Don't invent facts** about prospects, prices, or history. Mark unknowns `[avklares]`.
- **Respect `do_not_contact`** and opt-out flags in the CRM.

## Working conventions
- **One focused change per commit.** Update docs in the same change. Use Conventional Commits
  (see [`docs/NAMING_CONVENTIONS.md`](docs/NAMING_CONVENTIONS.md#git-commits)).
- **No empty scaffolding.** Create a folder only when it has real content.
- **Don't duplicate facts.** Process lives here; live data lives in the tools. Link, don't copy.
- **Significant decision?** Record it as an ADR in [`docs/decisions/`](docs/decisions/).
- **Before committing,** verify internal Markdown links resolve. Quick check:
  ```bash
  python3 - <<'PY'
  import os,re,glob
  bad=[f"{p} -> {m.group(1)}" for p in glob.glob('**/*.md',recursive=True)
       for m in re.finditer(r'\]\(([^)]+\.md)(#[^)]*)?\)',open(p,encoding='utf-8').read())
       if not m.group(1).startswith('http')
       and not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(p),m.group(1))))]
  print("OK" if not bad else "BROKEN:"); [print(" ",b) for b in bad]
  PY
  ```

## Adding common assets
- **A prompt:** add `prompts/<category>/<task>.md` using the template in
  [`prompts/README.md`](prompts/README.md). Norwegian content; `{{plassholdere}}` match `inputs`.
- **A template:** add to [`templates/`](templates/) with `{{plassholdere}}`.
- **A workflow:** document it in [`workflows/`](workflows/) (trigger, steps, approval gate, side
  effects) even though it runs in n8n/Zapier.

## End-of-session habit
At a milestone: review your work, update docs, commit logically, then continue with the next
highest-value task. When wrapping up, summarize: what was built, why it matters, current
architecture, remaining debt, recommended next milestone.
