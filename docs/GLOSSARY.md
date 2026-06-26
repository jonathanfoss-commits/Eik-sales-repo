# Glossary

Shared vocabulary for the Eik Sales OS. Consistent terms keep humans and AI agents aligned.

## Sales terms
- **ICP (Ideal Customer Profile)** — the precise definition of the customers worth pursuing.
  See [`sales/icp.md`](../sales/icp.md).
- **Lead** — a person or company that may become a customer but is not yet qualified.
- **Prospect** — a qualified lead actively being worked.
- **Account** — a company/organization we sell to or partner with.
- **Contact** — an individual person associated with an account.
- **Deal / Opportunity** — a potential piece of business with a value and a pipeline stage.
- **Pipeline** — the ordered set of stages a deal moves through. See
  [`crm/pipeline-stages.md`](../crm/pipeline-stages.md).
- **Outreach** — proactive first contact (cold or warm).
- **Follow-up** — subsequent touches to advance or revive a conversation.
- **Discovery** — the meeting/conversation where we learn the prospect's needs.
- **Qualification** — assessing whether a lead fits the ICP and is worth pursuing.

## Eik & Friends context
- **Corporate event** — a booked event for a business client (dinners, launches, gatherings).
- **Restaurant partnership** — an ongoing commercial relationship with a venue/restaurant.
- **Marketing collaboration** — a joint campaign or co-marketing arrangement with a partner.

## System terms
- **Agent** — a defined AI role (purpose + instructions + tools + guardrails). See
  [`agents/`](../agents/).
- **Prompt** — a reusable instruction for a specific task. See [`prompts/`](../prompts/).
- **Playbook** — a documented sales process or method. See [`sales/`](../sales/).
- **Workflow** — an automation that runs in n8n or Zapier. See [`workflows/`](../workflows/).
- **Integration** — a connection to an external tool (Gmail, Calendar, Notion…). See
  [`integrations/`](../integrations/).
- **System of record** — the external tool that holds the live, authoritative data for a concern.
- **Human-in-the-loop** — a step where a person reviews/approves before an action goes out.
- **Execution surface** — where work actually runs (Claude, ChatGPT, n8n, Zapier).

## Conventions
- **Source of truth** — the single authoritative place for a given fact. Process → this repo;
  live data → the connected tools.
