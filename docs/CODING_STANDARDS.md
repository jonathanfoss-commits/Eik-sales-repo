# Coding & Authoring Standards

This is primarily a knowledge repository, so "code" here means Markdown documents, prompt files,
data-model definitions, and the occasional script or workflow export. These standards keep
everything consistent and readable for both humans and AI agents.

## General
- **Language:** **Norwegian (Bokmål) is the default** for everything business- and user-facing —
  prompts, email templates, reports, AI outputs, CRM field labels, and documentation intended for
  Jonathan (README, roadmap, sales playbooks, glossary). English is kept only where it follows
  technical industry standard: code, APIs, variable names, field *identifiers* (`snake_case`),
  stable `id`s, enum keys, filenames, and deep developer-internal docs. See
  [ADR 0001](decisions/0001-sprakpolicy.md). Where an English-language variant of a prompt is
  genuinely needed (international recipients), it lives alongside the Norwegian default with an
  `.en` suffix (e.g. `cold-outreach.en.md`).
- **Format:** Markdown for all documents. Plain, standard, GitHub-flavored Markdown.
- **Line length:** Wrap prose at ~100 characters where practical. Never hard-wrap inside tables
  or code blocks.
- **Headings:** One `#` H1 per file (the title). Use sentence case for headings.
- **Links:** Use relative links between files in the repo so they work on GitHub and locally.

## Every module has a README
Each top-level folder contains a `README.md` that states:
1. The module's purpose (one sentence).
2. What lives here and how it's organized.
3. Conventions specific to the module.
4. How an agent should use it.

## Prompt files
Each prompt file follows the standard template (see [`prompts/README.md`](../prompts/README.md)):
front-matter metadata, purpose, inputs, the prompt body, and example usage. Prompts must be
**tool-agnostic** unless explicitly tied to one surface.

## Data model files
CRM and schema files define fields as tables with: field name, type, required?, description, and
how the field maps to external tools (Notion property / Sheet column). Keep types from
[`NAMING_CONVENTIONS.md`](NAMING_CONVENTIONS.md).

## Scripts (when they appear)
- Prefer small, single-purpose scripts with a header comment explaining purpose, inputs, outputs.
- Include a usage example. Fail loudly with clear messages. No secrets in code — read from env.
- Match the style of surrounding scripts in the same directory.

## Workflows
n8n/Zapier automations are documented in `workflows/` with: trigger, steps, the prompts/agents
they call, side effects, and approval gates. Exported JSON (if committed) lives next to its doc.

## Commits
See [`NAMING_CONVENTIONS.md`](NAMING_CONVENTIONS.md#git-commits) for commit message conventions.
One meaningful, self-contained change per commit. Update docs in the same commit.

## Secrets & privacy
- **Never** commit API keys, tokens, passwords, or personal data of contacts.
- Live customer data stays in the connected tools, not in this repo.
- `config/` holds **non-secret** configuration only; secrets are referenced by name and supplied
  via the environment.
