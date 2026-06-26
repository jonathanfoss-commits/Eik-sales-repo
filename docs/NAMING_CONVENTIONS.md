# Naming Conventions

Consistency makes the repository navigable for humans and predictable for AI agents.

## Files & folders
- **Folders:** lowercase, singular or plural by meaning, no spaces. Use the established module
  names (`agents`, `prompts`, `sales`, `crm`, `integrations`, `workflows`, `config`, `docs`).
- **Files:** `kebab-case.md` (lowercase words joined by hyphens). E.g. `cold-outreach.md`,
  `meeting-prep.md`, `sales-development-agent.md`.
- **Documentation constants:** top-level docs use `UPPER_SNAKE_CASE.md` by convention
  (`ARCHITECTURE.md`, `ROADMAP.md`). Module content files use `kebab-case.md`.
- **Language variants:** Norwegian (Bokmål) is the default with **no suffix** (see
  [ADR 0001](decisions/0001-sprakpolicy.md)). An English variant, where genuinely needed, appends
  `.en` before the extension (`cold-outreach.en.md`).
- **READMEs:** every module folder has exactly one `README.md`.

## Agents
- File: `<role>-agent.md` (e.g. `sales-development-agent.md`).
- Internal `name`: kebab-case matching the file (`sales-development-agent`).

## Prompts
- File: `<task>.md` describing the task, grouped in a subfolder by stage
  (`outreach/`, `follow-up/`, `meetings/`, `negotiation/`).
- Each prompt has a `title` and a stable `id` in its front-matter (see prompt template).

## Data model (CRM)
- **Entities:** singular PascalCase in prose (Contact, Account, Deal), `snake_case` for field
  identifiers (`first_name`, `deal_stage`, `expected_close_date`).
- **Field types:** use a small, fixed vocabulary — `text`, `long_text`, `email`, `url`, `phone`,
  `number`, `currency`, `date`, `datetime`, `boolean`, `select`, `multi_select`, `relation`.
- **Select values:** Title Case, human-readable (`In Negotiation`, `Closed Won`).

## Git commits
Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

- **Types:** `feat`, `fix`, `docs`, `refactor`, `chore`, `content`.
  - `content` is for new sales material (prompts, playbooks) that isn't code.
- **Scope:** the module touched (`prompts`, `crm`, `docs`, `agents`, …).
- **Examples:**
  - `content(prompts): add restaurant partnership pitch prompt`
  - `docs(architecture): clarify data-flow for inbound triage`
  - `feat(crm): define deal pipeline stages`

## Branches
- Feature work: `claude/<topic>-<id>` for AI sessions; `feature/<topic>` for manual work.
- Never commit directly to `main` without review.

## IDs & dates
- **IDs:** kebab-case, stable, never reused (`deal-acme-2026-spring-event`).
- **Dates:** ISO 8601 (`YYYY-MM-DD`). Datetimes include timezone where it matters (Europe/Oslo).
