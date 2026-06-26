# Pipeline Stages

The ordered stages a Deal moves through. These mirror the [sales methodology](../sales/methodology.md)
exactly and are the allowed values for the Deal `stage` field in
[`schema.md`](schema.md).

| Order | Stage value | Meaning | Exit criteria (advance when…) |
| --- | --- | --- | --- |
| 1 | `Prospect` | Identified, fits ICP, has a trigger. Not yet contacted or no reply. | First meaningful reply / interest. |
| 2 | `Engaged` | In conversation; interest shown. | A discovery conversation is agreed/held. |
| 3 | `Qualified` | Need, budget, timing, and process validated. | A real opportunity confirmed both ways. |
| 4 | `Proposal` | Tailored offer delivered. | Proposal acknowledged; moving to terms. |
| 5 | `Negotiation` | Working terms toward agreement. | Terms verbally agreed. |
| 6 | `Closed Won` | Agreement confirmed. | — (terminal; hand off to delivery + nurture). |
| 7 | `Closed Lost` | Not proceeding. | — (terminal; record `lost_reason`). |
| 8 | `Nurture` | Past client / long-horizon; staying warm for repeat or referral. | Re-enters at `Engaged`/`Qualified` on a new opportunity. |

## Rules
- **Every open deal** (stages 1–5) must have a `next_step` and `next_step_date`. A deal without a
  next step is stuck — act on it or move it to `Closed Lost`.
- **Advance only on genuine exit criteria.** Don't inflate the pipeline with optimism.
- **`Closed Lost` always records a reason** — honest reasons are what sharpen the [ICP](../sales/icp.md).
- **`Nurture`** is where won deals and "not now" prospects live so they're never forgotten. The
  best pipeline is a warm past client.

## Probability guidance (optional)
A rough default mapping for forecasting; adjust per deal:

| Stage | Default probability |
| --- | --- |
| Prospect | 5% |
| Engaged | 15% |
| Qualified | 35% |
| Proposal | 55% |
| Negotiation | 75% |
| Closed Won | 100% |
| Closed Lost | 0% |
