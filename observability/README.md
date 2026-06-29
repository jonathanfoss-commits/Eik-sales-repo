# Observabilitet & styring (L4)

Nervesystemet i Eik Sales OS. Dette laget gjør systemet til et **operativsystem som måler seg selv,
forklarer hver handling, fanger feil og blir bedre over tid** — ikke en samling skript man må stole
blindt på. Forankret i [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md) og lag **L4** i
[STRATEGY.md](../docs/STRATEGY.md).

> **Kjerneprinsipp:** Jonathan skal *alltid* kunne forstå hvorfor en agent gjorde noe, hva det
> kostet, og om det virket. Ingen skjult logikk.

## Hva laget svarer på
| Spørsmål | Hvor |
| --- | --- |
| Hva gjorde agentene, og hvorfor? | [`logging-standard.md`](logging-standard.md) → `Agentlogg` |
| Virket det? (utfall per handling, prompt, segment) | [`maaleloop.md`](maaleloop.md) → `Utfall` |
| Hvordan står forretningen? (KPI-er) | [`metrics.md`](metrics.md) |
| Hva gikk galt, og hvem fanger det opp? | [`logging-standard.md`](logging-standard.md#feiltaksonomi) → `Eskaleringer` |
| Hva koster systemet? (tokens, API, tid) | [`logging-standard.md`](logging-standard.md#kostnad--ressurs) |
| Hvordan står det til — visuelt? (dashboard) | [`dashboard.md`](dashboard.md) |

## Hvordan det henger sammen
```
   Agent utfører handling
            │
            ▼
   ┌──────────────────┐   logger hver handling (modell, tokens, kostnad,
   │  Agentlogg (L4)  │   konfidens, beslutning) — loggstandarden
   └────────┬─────────┘
            │ utadrettet handling kobles til ↓
            ▼
   ┌──────────────────┐   sendt/forkastet → svar → vunnet/tapt
   │   Utfall (L4)    │   = måle-loopen som forbedrer prompter/agenter
   └────────┬─────────┘
            │ aggregeres til ↓
            ▼
   ┌──────────────────┐   vektet pipeline, vunnet-rate, svarrate, forfalte
   │   KPI-er (L4→L5) │   oppfølginger, kostnad — styringstall
   └──────────────────┘
   Avvik / feil / lav konfidens  ──►  Eskaleringer (kø m/ SLA)  ──►  Jonathan
```

## Designvalg (kort)
- **Data i Airtable, definisjon i repoet.** Loggrader og utfall er levende data → de bor i CRM-et,
  der de kan kobles til avtaler og bedrifter. Repoet eier *standarden*, ikke radene (prinsipp 5:
  én kilde til sannhet).
- **Verktøyuavhengig.** Loggstandarden beskriver *felter og betydning*, ikke et bestemt verktøy. Skal
  volumet kreve en dedikert stack (Langfuse o.l.) senere, er det en additiv eksport — ikke en
  ombygging (jf. [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md), alternativ 1).
- **Lett kjerne, valgfri hale.** Et lite, fast sett felt logges alltid; resten er valgfritt, så
  logging aldri gjør agentene trege.

## Status
| Komponent | Status |
| --- | --- |
| Loggstandard (definisjon) | ✅ Definert her |
| `Agentlogg`-utvidelse (nye felt i Airtable) | ✅ Live 28.06.2026 (alle 8 felt) |
| Måle-loop (`Utfall`-tabell + kadens) | ✅ Tabell live (`tbl19725pjhkGu7LT`); kadens gjenstår |
| KPI-katalog (definisjon) | ✅ Definert i [`metrics.md`](metrics.md) |
| Eskaleringskø (`Eskaleringer`-tabell) | ✅ Live (`tblWOneeFROVhtCmS`) |
| KPI-dashboard (L5, Airtable-interface) | 📋 Spesifisert ([`dashboard.md`](dashboard.md)); side 1–2 byggbar nå |

Når et felt eller en tabell er opprettet i Airtable, oppdater statusen her og i
[`crm/schema.md`](../crm/schema.md).
