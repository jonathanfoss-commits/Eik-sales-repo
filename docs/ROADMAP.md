# Roadmap

A living, phased plan for the Eik Sales OS. Each phase delivers standalone value; we do not start
a phase before the previous one is genuinely useful. Items move from **Planned → In progress →
Done**. Technical debt and opportunities discovered along the way are captured at the bottom.

---

## Phase 0 — Foundation ✅ (current)
Establish a professional, well-documented structure and the first high-value sales assets.

- [x] Repository structure and module READMEs
- [x] Core documentation (architecture, principles, standards, naming, setup, glossary)
- [x] First agent definitions (sales development, inbox triage)
- [x] Core prompt library (outreach, follow-up, meeting prep, negotiation)
- [x] CRM data model and pipeline definition
- [x] Sales playbook foundation (ICP, methodology, partnerships, events)

## Phase 1 — Connect the tools
Make the system act on real data through Jonathan's daily tools.

- [x] Document Gmail integration (drafting, labeling, triage) — see `integrations/gmail-integration.md`
- [ ] Validate Gmail integration against the live account
- [x] Document Google Calendar integration (holds, scheduling) — see `integrations/calendar-integration.md`
- [ ] Validate Calendar integration against the live account
- [x] Document Notion CRM database structure — see `integrations/notion-integration.md`
- [ ] Notion CRM: create the actual databases mirroring `crm/schema.md`
- [x] Define environment/secret handling conventions in `config/`
- [x] Document the inbound lead triage workflow — see `workflows/inbound-lead-triage.md`
- [ ] Build & validate the inbound lead triage workflow in n8n

## Phase 2 — Automate the repetitive
Reduce manual effort on recurring sales motions.

- [ ] Automated follow-up sequencing with human approval gates
- [ ] Meeting prep brief auto-generated before each calendar meeting
- [ ] Post-meeting summary + next-step extraction
- [ ] Weekly pipeline digest from CRM data

## Phase 3 — Intelligence & research
Sharpen targeting and personalization.

- [ ] Account & contact research agent (company news, fit scoring)
- [ ] ICP scoring model for inbound and outbound leads
- [ ] Restaurant-partnership opportunity scanner

## Phase 4 — Analytics & continuous improvement
Measure and improve the whole system.

- [ ] Pipeline and conversion analytics from CRM
- [ ] Prompt/agent performance tracking and iteration loop
- [ ] Quarterly review playbook

---

## Backlog / opportunities
Ideas worth doing when they rise to the top. Not yet scheduled.

- Bilingual (Norwegian/English) prompt variants — *started:* outreach + follow-up localized;
  extend to meetings/negotiation as needed.
- Templated proposal & quote generation into Google Docs.
- Partner/venue database with seasonal event calendar.
- LinkedIn outreach playbook (if/when that channel is added).

## Known technical debt
Honest record of shortcuts and gaps to revisit.

- *(none yet — repository is new)*

> When you discover debt or an opportunity, add it here in the same change rather than expanding
> the current task's scope.
