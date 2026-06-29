# Prompter

Et versjonert, gjenbrukbart bibliotek av prompter for konkrete salgsoppgaver. Prompter er
byggeklossene som [agentene](../agents/) settes sammen av. Hold dem skarpe, konkrete og
verktøy-uavhengige, slik at de fungerer i både Claude og ChatGPT.

> **Språk:** Norsk (bokmål) er standard, jf. [ADR 0001](../docs/decisions/0001-sprakpolicy.md).
> Standardfilen (uten suffiks) er norsk. Engelsk variant, der den trengs for internasjonale
> mottakere, ligger som `<navn>.en.md`.

## Organisering
Prompter er gruppert etter salgsfase:

| Mappe | Fase |
| --- | --- |
| [`outreach/`](outreach/) | Førstegangskontakt — kald og varm utgående. |
| [`follow-up/`](follow-up/) | Bevege eller gjenopplive samtaler. |
| [`meetings/`](meetings/) | Forberede og følge opp møter. |
| [`proposals/`](proposals/) | Generere tilbud. |
| [`negotiation/`](negotiation/) | Jobbe mot betingelser og signering. |
| [`reports/`](reports/) | Sammendrag og rapporter (f.eks. ukentlig pipeline). |

## Mal for promptfil
Hver prompt følger denne strukturen:

```markdown
---
id: <stabil-kebab-id>
title: <Tittel>
stage: outreach | follow-up | meetings | proposals | negotiation | reports
inputs: [liste, over, inndata]
version: 1
lang: no
---

## Formål
Hva prompten er til og når den brukes.

## Inndata
Hver inndata forklart, med eksempelverdier.

## Prompt
> Selve prompteksten, med {{plassholdere}} for inndata.

## Notater & varianter
Tips, vanlige justeringer, og når den *ikke* bør brukes.

## Eksempel
Et kort, utfylt eksempel på inndata → output.
```

## Konvensjoner
- **Plassholdere** bruker `{{doble_klammer}}` og matcher `inputs`-listen nøyaktig.
- **Verktøy-uavhengig** som standard. Er en prompt knyttet til én flate, si det i Notater.
- **Ærlig og konsis.** Eik & Friends' stemme er varm, profesjonell og direkte — ingen svulst, intet
  press. Korte meldinger med én tydelig oppfordring.
- **Engelsk variant** lages kun ved reelt behov (internasjonale mottakere), som `<navn>.en.md`.
- **Identifikatorer på engelsk:** `id`, `stage` og `inputs`-nøkler holdes på engelsk (teknisk
  standard, jf. ADR 0001). Selve innholdet er norsk.
- Øk `version` ved meningsfulle endringer; hold `id` stabil.
- **Prompt-ID for måling:** måle-loopen identifiserer en prompt som `{id}-v{version}` (f.eks.
  `cold-outreach-v1`). Den utledes av front-matteren — vi dupliserer den *ikke* som eget felt. Når du
  bumper `version`, får den nye varianten automatisk ny Prompt-ID, så gammel og ny kan måles mot
  hverandre i [`Utfall`](../observability/maaleloop.md).

## Register
| Prompt | Fase | Norsk (standard) | Engelsk variant |
| --- | --- | --- | --- |
| Kald henvendelse | outreach | [`cold-outreach.md`](outreach/cold-outreach.md) | [`.en`](outreach/cold-outreach.en.md) |
| Julebord-henvendelse (sesong) | outreach | [`julebord-henvendelse.md`](outreach/julebord-henvendelse.md) | — |
| Sommerfest-henvendelse (sesong) | outreach | [`sommerfest-henvendelse.md`](outreach/sommerfest-henvendelse.md) | — |
| Kickoff-henvendelse (sesong) | outreach | [`kickoff-henvendelse.md`](outreach/kickoff-henvendelse.md) | — |
| Gavekort — årsavtale | outreach | [`gavekort-aarsavtale.md`](outreach/gavekort-aarsavtale.md) | — |
| Partnerskap / samarbeid | outreach | [`partnership-pitch.md`](outreach/partnership-pitch.md) | [`.en`](outreach/partnership-pitch.en.md) |
| Oppfølgingssekvens | follow-up | [`follow-up-sequence.md`](follow-up/follow-up-sequence.md) | [`.en`](follow-up/follow-up-sequence.en.md) |
| Møteforberedelse | meetings | [`meeting-prep.md`](meetings/meeting-prep.md) | — |
| Oppfølging etter møte | meetings | [`meeting-followup.md`](meetings/meeting-followup.md) | — |
| Generer tilbud | proposals | [`tilbud.md`](proposals/tilbud.md) | — |
| Forhandlingsforberedelse | negotiation | [`negotiation-prep.md`](negotiation/negotiation-prep.md) | — |
| Ukentlig pipeline-sammendrag | reports | [`ukentlig-pipeline-sammendrag.md`](reports/ukentlig-pipeline-sammendrag.md) | — |
