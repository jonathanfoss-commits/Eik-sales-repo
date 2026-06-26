# Architecture Decision Records (ADR)

Korte, daterte notater om viktige beslutninger i Eik Sales OS — hvorfor vi valgte som vi gjorde,
og hvilke alternativer vi vurderte. ADR-er gjør at fremtidige bidragsytere (mennesker og
AI-agenter) forstår *begrunnelsen*, ikke bare resultatet.

## Hvorfor ADR-er
Et system som skal leve i mange år samler opp beslutninger. Uten et spor blir «hvorfor gjorde vi
det slik?» umulig å svare på. ADR-er er billige å skrive og uvurderlige å lese senere.

## Format
Hver beslutning er én fil: `NNNN-kort-tittel.md` (løpende nummer). Bruk malen under.

```markdown
# NNNN — Tittel

- **Status:** Foreslått | Vedtatt | Erstattet av NNNN
- **Dato:** ÅÅÅÅ-MM-DD
- **Besluttet av:** (rolle/person)

## Kontekst
Hva er problemet eller valget?

## Beslutning
Hva bestemte vi?

## Alternativer vurdert
Hvilke andre veier fantes, og hvorfor valgte vi dem bort?

## Konsekvenser
Hva betyr dette fremover (positivt og negativt)?
```

## Register
| Nr | Tittel | Status |
| --- | --- | --- |
| [0001](0001-sprakpolicy.md) | Norsk (bokmål) som standardspråk | Vedtatt |
| [0002](0002-faktisk-systemarkitektur.md) | Faktisk systemarkitektur: Airtable-CRM + n8n-agenter | Vedtatt |
