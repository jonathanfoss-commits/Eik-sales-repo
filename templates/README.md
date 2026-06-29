# Maler (templates)

Gjenbrukbare dokumentmaler for tilbakevendende leveranser — tilbud, e-postsignatur, oppsummeringer.
Maler skiller seg fra [prompter](../prompts/): en prompt *instruerer en AI* til å lage noe; en mal er
*selve strukturen* som fylles ut (av et menneske eller en AI).

## Innhold
| Fil | Hva den er |
| --- | --- |
| [`tilbud-bedriftsarrangement.md`](tilbud-bedriftsarrangement.md) | Tilbudsmal for bedriftsarrangementer. |
| [`epost-signatur.md`](epost-signatur.md) | Standard e-postsignatur for Jonathan / Eik & Friends. |

## Konvensjoner
- **Norsk som standard** (jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md)).
- **Plassholdere** bruker `{{doble_klammer}}`, likt promptene, så maler og prompter spiller sammen.
- Hold malene **rene og lette å fylle ut** — ingen unødvendige seksjoner.
- En mal kan ha en tilhørende prompt som genererer den (f.eks. genererer
  [`prompts/proposals/tilbud.md`](../prompts/proposals/tilbud.md) et utkast basert på
  tilbudsmalen).

## Slik brukes en mal
1. Kopier malen.
2. Fyll ut `{{plassholderne}}` — manuelt, eller la den tilhørende prompten gjøre førsteutkastet.
3. Gjennomgå og tilpass før den sendes / limes inn i Google Docs.
