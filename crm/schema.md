# CRM Schema

The canonical data model. Field identifiers use `snake_case`; types come from the fixed vocabulary
in [`docs/NAMING_CONVENTIONS.md`](../docs/NAMING_CONVENTIONS.md). The **Maps to** column shows the
intended Notion property / Sheet column so implementations stay consistent.

---

## Account
A company we sell to or partner with.

| Field | Type | Required | Description | Maps to |
| --- | --- | --- | --- | --- |
| `account_id` | text | yes | Stable unique id (kebab-case). | Title/key |
| `name` | text | yes | Company name. | Name |
| `account_type` | select | yes | `Client`, `Prospect`, `Partner`. | Type |
| `industry` | text | no | Industry/sector. | Industry |
| `size` | select | no | `1-19`, `20-49`, `50-199`, `200-499`, `500+`. | Size |
| `location` | text | no | City / region. | Location |
| `website` | url | no | Company website. | Website |
| `icp_fit` | select | no | `Strong`, `Moderate`, `Weak`. | ICP Fit |
| `owner` | text | yes | Internal owner (default: Jonathan). | Owner |
| `notes` | long_text | no | Freeform context. | Notes |
| `created_at` | date | yes | Record created. | Created |

## Contact
A person at an account.

| Field | Type | Required | Description | Maps to |
| --- | --- | --- | --- | --- |
| `contact_id` | text | yes | Stable unique id. | Title/key |
| `account_id` | relation | yes | Parent Account. | Account (relation) |
| `first_name` | text | yes | First name. | First Name |
| `last_name` | text | no | Last name. | Last Name |
| `role` | text | no | Job title. | Role |
| `email` | email | no | Primary email. | Email |
| `phone` | phone | no | Phone. | Phone |
| `is_decision_maker` | boolean | no | Economic/decision authority. | Decision Maker |
| `do_not_contact` | boolean | no | Opt-out flag — respect always. | Do Not Contact |
| `preferred_language` | select | no | `Norwegian`, `English`. | Language |
| `notes` | long_text | no | Context about the person. | Notes |

## Deal
A potential piece of business.

| Field | Type | Required | Description | Maps to |
| --- | --- | --- | --- | --- |
| `deal_id` | text | yes | Stable unique id. | Title/key |
| `name` | text | yes | Human deal name. | Name |
| `account_id` | relation | yes | Related Account. | Account (relation) |
| `primary_contact_id` | relation | no | Main contact. | Contact (relation) |
| `deal_type` | select | yes | `Corporate Event`, `Restaurant Partnership`, `Marketing Collaboration`, `Other`. | Type |
| `stage` | select | yes | See [`pipeline-stages.md`](pipeline-stages.md). | Stage |
| `value` | currency | no | Expected value (NOK). | Value |
| `expected_close_date` | date | no | Best estimate of close. | Close Date |
| `next_step` | text | yes* | The next action. *(required while open)* | Next Step |
| `next_step_date` | date | yes* | When the next action is due. | Next Step Date |
| `probability` | number | no | 0–100 % likelihood. | Probability |
| `source` | select | no | `Outbound`, `Inbound`, `Referral`, `Partner`. | Source |
| `lost_reason` | text | no | If lost, why (honest). | Lost Reason |
| `owner` | text | yes | Deal owner. | Owner |
| `created_at` | date | yes | Record created. | Created |

\* `next_step` and `next_step_date` are required for any deal not in a `Closed` stage — see stage
hygiene in [`sales/methodology.md`](../sales/methodology.md).

## Activity
A logged interaction.

| Field | Type | Required | Description | Maps to |
| --- | --- | --- | --- | --- |
| `activity_id` | text | yes | Stable unique id. | Title/key |
| `deal_id` | relation | no | Related Deal (if any). | Deal (relation) |
| `contact_id` | relation | no | Related Contact. | Contact (relation) |
| `type` | select | yes | `Email`, `Call`, `Meeting`, `Note`, `Task`. | Type |
| `summary` | long_text | yes | What happened / was said. | Summary |
| `occurred_at` | datetime | yes | When it happened (Europe/Oslo). | When |
| `created_by` | text | yes | Human or agent name. | Created By |

---

## Conventions
- **IDs are stable and never reused.** Use descriptive kebab-case
  (`deal-acme-2026-spring-launch`).
- **Dates** are ISO 8601; datetimes carry the Europe/Oslo context.
- **Relations** reference the related entity's id.
- Changes to this schema must be reflected in the Notion/Sheets implementation and noted in the
  [roadmap](../docs/ROADMAP.md) if they're structural.
