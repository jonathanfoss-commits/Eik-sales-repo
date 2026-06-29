# Workflows

Automations that run in **n8n** or **Zapier**. They execute outside this repository, but we
document them here so they're understandable, reproducible, and reviewable — automation you can't
read is a liability.

## Why document workflows here
- A workflow's logic should be legible without logging into n8n/Zapier.
- Changes are reviewable in Git.
- Agents and humans can see what runs automatically and where the approval gates are.

## Documentation template
Each workflow gets a `<name>.md` describing:

```markdown
# Workflow: <name>

- **Engine:** n8n | Zapier
- **Status:** active | draft | disabled
- **Trigger:** what starts it (schedule, webhook, new email…)
- **Approval gate:** where a human must confirm (or "none — fully automated")

## Steps
1. ...
2. ...

## Prompts / agents used
- links into prompts/ and agents/

## Side effects
What it reads and writes (which systems of record).

## Failure handling
What happens if a step fails.
```

If a workflow's JSON is exported, commit it next to its doc as `<name>.json`.

## Conventions
- **Human-in-the-loop by default.** A workflow may *draft* outward actions, but sending/posting
  needs an approval gate unless explicitly approved for full automation.
- **Idempotent where possible.** Re-running shouldn't double-send or duplicate records.
- **Least privilege** on every connection (see [`integrations/`](../integrations/)).

## Workflows
| Workflow | Status | Summary |
| --- | --- | --- |
| [`inbound-lead-triage`](inbound-lead-triage.md) | Draft (Phase 1) | Gmail trigger → classify → label + propose CRM record + draft reply (approval gate). |
| [`weekly-pipeline-digest`](weekly-pipeline-digest.md) | Draft (Phase 2) | Monday schedule → read CRM → generate Norwegian pipeline summary → deliver to Jonathan. |
| [`crm-hygiene-automation`](crm-hygiene-automation.md) | ✅ Flag live | Daily auto-flag (deployed) + auto-flip Bekreftet→Gjennomført rule for the n8n agent. |
| [`agentlogg-maaleloop`](agentlogg-maaleloop.md) | Draft (Phase 4) | Skriver Agentlogg/Utfall/Eskaleringer per handling + modner utfall — lukker måle-loopen (L4). Eksakte felt-ID-er. |
| [`airtable-backup`](airtable-backup.md) | Draft (spec klar) | Ukentlig uavhengig eksport av hele basen (CSV+JSON) til Drive m/ manifest, rotasjon og gjenopprettings-runbook. |

See [Phase 1–2 of the roadmap](../docs/ROADMAP.md) for what's next.
