# Pipeline-steg

De ordnede stegene en avtale beveger seg gjennom. Disse speiler [salgsmetodikken](../sales/methodology.md)
nøyaktig, og er de tillatte verdiene for `stage`-feltet på avtaler i [`schema.md`](schema.md).

De norske stegnavnene under er de **synlige verdiene** (slik de vises i Notion). Den engelske
nøkkelen i parentes er en stabil teknisk identifikator for integrasjoner (jf.
[ADR 0001](../docs/decisions/0001-sprakpolicy.md)) — bruk den norske verdien i alt brukervendt.

| Rekkefølge | Steg (verdi) | Teknisk nøkkel | Betydning | Gå videre når … |
| --- | --- | --- | --- | --- |
| 1 | `Prospekt` | `prospect` | Identifisert, passer ICP, har en trigger. Ikke kontaktet, eller intet svar. | Første meningsfulle svar / interesse. |
| 2 | `I dialog` | `engaged` | I samtale; interesse vist. | En kartleggingssamtale er avtalt/holdt. |
| 3 | `Kvalifisert` | `qualified` | Behov, budsjett, timing og prosess validert. | En reell mulighet bekreftet begge veier. |
| 4 | `Tilbud` | `proposal` | Skreddersydd tilbud levert. | Tilbud bekreftet mottatt; går mot betingelser. |
| 5 | `Forhandling` | `negotiation` | Jobber mot enighet om betingelser. | Betingelser muntlig avtalt. |
| 6 | `Vunnet` | `won` | Avtale bekreftet. | — (terminal; overlever til leveranse + pleie). |
| 7 | `Tapt` | `lost` | Går ikke videre. | — (terminal; registrer `lost_reason`). |
| 8 | `Pleie` | `nurture` | Tidligere kunde / lang horisont; holdes varm for gjentakelse eller anbefaling. | Går inn på nytt i `I dialog`/`Kvalifisert` ved ny mulighet. |

## Regler
- **Hver åpen avtale** (steg 1–5) må ha et `next_step` og en `next_step_date`. En avtale uten neste
  steg står fast — handle på den, eller flytt den til `Tapt`.
- **Gå kun videre på ekte vilkår.** Ikke blås opp pipelinen med optimisme.
- **`Tapt` registrerer alltid en årsak** — ærlige årsaker er det som skjerper [ICP-en](../sales/icp.md).
- **`Pleie`** er der vunne avtaler og «ikke nå»-prospekter lever, så de aldri glemmes. Den beste
  pipelinen er en varm tidligere kunde.

## Sannsynlighet (valgfritt)
En grov standardmapping for prognoser; juster per avtale:

| Steg | Standard sannsynlighet |
| --- | --- |
| Prospekt | 5 % |
| I dialog | 15 % |
| Kvalifisert | 35 % |
| Tilbud | 55 % |
| Forhandling | 75 % |
| Vunnet | 100 % |
| Tapt | 0 % |
