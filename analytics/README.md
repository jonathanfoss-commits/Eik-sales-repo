# Analyse (analytics)

Datadrevne analyser og helsesjekker av CRM-et (Airtable). Rapportene her er **lesebaserte
øyeblikksbilder** — de endrer ikke data, men peker på hva som bør handles på. De er versjonert slik
at vi kan se utviklingen over tid.

## Innhold
| Fil | Hva det er |
| --- | --- |
| [`crm-helsesjekk-2026-06-26.md`](crm-helsesjekk-2026-06-26.md) | Første helsesjekk av Avtaler-pipelinen: datakvalitet, forfalte oppfølginger, forecast. |

## Konvensjoner
- **Daterte øyeblikksbilder:** filnavn `crm-helsesjekk-ÅÅÅÅ-MM-DD.md`. Lag en ny fremfor å overskrive
  — historikken er verdifull.
- **Kun lesing av levende data.** Anbefalinger som krever endring i Airtable beskrives som forslag
  til godkjenning, ikke utført automatisk (jf. [ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md)).
- **Norsk** (jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md)).

## Idé: automatiser dette
Helsesjekken egner seg som en n8n-arbeidsflyt (ukentlig), tett koblet til mandagsbriefen. Se
[`workflows/`](../workflows/).
