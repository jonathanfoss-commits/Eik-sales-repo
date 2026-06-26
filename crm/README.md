# CRM

**Datamodellen** for kunder og avtaler i Eik Sales OS. Denne modulen definerer *formen på dataene* —
hva en kontakt, konto og avtale er — og hvordan de mappes mot verktøyene som faktisk lagrer de
levende postene (primært Notion, Google Sheets som et lett alternativ).

> **Viktig:** Ingen levende kundedata ligger i dette repoet. Dette er skjemaet og konvensjonene.
> Selve postene ligger i de tilkoblede kildesystemene (se [`integrations/`](../integrations/)). Én
> sannhetskilde per område ([`docs/PRINCIPLES.md`](../docs/PRINCIPLES.md)).

> **Språk:** Synlige feltnavn og utvalgsverdier er på norsk; felt-*identifikatorer* (`snake_case`)
> holdes på engelsk for robuste integrasjoner (jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md)).

## Innhold
| Fil | Hva den definerer |
| --- | --- |
| [`schema.md`](schema.md) | Entitetene (Konto, Kontakt, Avtale, Aktivitet) og feltene deres. |
| [`pipeline-stages.md`](pipeline-stages.md) | Pipeline-stegene for avtaler og betydningen deres. |

## Entitetene i korthet
- **Konto (Account)** — en virksomhet vi selger til eller samarbeider med (inkl. partnerlokaler).
- **Kontakt (Contact)** — en person hos en konto.
- **Avtale (Deal)** — en potensiell forretning som beveger seg gjennom pipelinen.
- **Aktivitet (Activity)** — en logget interaksjon (e-post, samtale, møte, notat).

```
Konto 1───* Kontakt
   │              │
   *              *
   └──── Avtale ──┘
          │
          *
      Aktivitet
```

## Slik bruker agentene dette
- Før du oppretter eller oppdaterer en post, følg `schema.md` for feltnavn og typer.
- Bruk de eksakte pipeline-stegverdiene fra `pipeline-stages.md`.
- Foreslå CRM-endringer for menneskelig gjennomgang (standard) fremfor å skrive stille.

## Implementasjonsnotat
Fase 1 i [veikartet](../docs/ROADMAP.md) oppretter de faktiske Notion-databasene som speiler dette
skjemaet. Inntil da er dette kontrakten agenter og mennesker skal følge.
