# Workflow: agentlogg-maaleloop (logging + måle-loop i n8n)

- **Engine:** n8n
- **Status:** Draft (Fase 4) — tabeller/felt er live i Airtable; denne flyten er det som faktisk
  *skriver* dem.
- **Trigger:** Kalles av de eksisterende agent-flytene (digital-jonathan, gavekort-selger) etter hver
  handling — pluss én planlagt jobb som modner utfall.
- **Approval gate:** Ingen — ren intern logging (ikke utadrettet). All utadrettet handling beholder
  sine egne godkjenningsporter.

> Formål: lukke L4-sløyfen. Definisjonen finnes i [`observability/`](../observability/); dette er den
> node-for-node-oppskriften som gjør den levende. Eksakte felt-ID-er er tatt med så mapping ikke kan
> bli feil. Base: `appzIFWfzob6WEhnq`.

## Del 1 — «Logg handling» (gjenbrukbar sub-workflow)
Lag én sub-workflow `Logg handling` som alle agent-flyter kaller via **Execute Workflow**. Den tar
imot ett objekt og skriver én rad i **Agentlogg** (`tblvJbS3hvhC1C4cY`).

### Input til sub-flyten (sett av den kallende agenten)
```json
{
  "handling": "Svarutkast laget – Nordlys sommerfest",
  "agent": "Digital Jonathan (AI)",
  "kategori": "Outreach-utkast",
  "resultat": "Utkast lagret i Gmail, ikke sendt",
  "relatert": "Nordlys Consulting",
  "trenger_vurdering": false,
  "modell": "claude-opus-4-8",
  "tokens_inn": 1840, "tokens_ut": 420,
  "latens_ms": 2300,
  "konfidens": "Høy",
  "beslutning": "Varm lead: budsjett >100k og dato <30 dager (ICP-regel).",
  "prompt_id": "cold-outreach-v1",
  "feilkode": null
}
```

### Node: Airtable → Create record → Agentlogg
Felt-mapping (**bruk feltnavn**; ID-ene står for utvetydighet):

| Agentlogg-felt | Felt-ID | Kilde / uttrykk |
| --- | --- | --- |
| Handling | `fldT3tFovMTsqCeY0` | `{{$json.handling}}` |
| Tidspunkt | `fldANvw0E954W2X6r` | `{{$now}}` (Europe/Oslo) |
| Agent | `fldwGI79jnFuhRT9T` | `{{$json.agent}}` |
| Kategori | `fld1vefwZUQ6pi6Dh` | `{{$json.kategori}}` |
| Resultat | `fldDPOQj86wKnZVpc` | `{{$json.resultat}}` |
| Trenger menneskelig vurdering | `fldoSiDZoY4ZqDy5w` | `{{$json.trenger_vurdering}}` |
| Relatert avtale/bedrift | `fld1SCYf05P90h5Xi` | `{{$json.relatert}}` |
| Modell | `fldS5K7pizy2kkAY3` | `{{$json.modell}}` |
| Tokens inn | `fldq6HiSq2QasKDRn` | `{{$json.tokens_inn}}` |
| Tokens ut | `fldYbK6g24i6CGhYi` | `{{$json.tokens_ut}}` |
| Estimert kostnad | `fldcSFM1aemcgTT0Q` | beregnet — se under |
| Latens (ms) | `fldk61cICs0I804gZ` | `{{$json.latens_ms}}` |
| Konfidens | `fld9IQ0evk1DIqW13` | `{{$json.konfidens}}` |
| Beslutning | `fldSwdQoacQq0MFdz` | `{{$json.beslutning}}` |
| Prompt-ID | `fldVeA3p0VsLOof3o` | `{{$json.prompt_id}}` |
| Feilkode | `fldZP5JCGI61b52SF` | `{{$json.feilkode}}` (tom hvis OK) |

### Node: Function → beregn `Estimert kostnad`
Les priser fra [`config/README.md`](../config/README.md#modellpriser-for-kostnadsestimat-i-agentlogg)
(ikke hardkod). Pseudokode:
```js
const P = { /* fra config: USD per 1M */
  "claude-opus-4-8":  { inn: PRIS_INN, ut: PRIS_UT },
  // … øvrige modeller
};
const USD_NOK = KURS;            // fra config
const p = P[$json.modell] || { inn: 0, ut: 0 };
const usd = ($json.tokens_inn/1e6)*p.inn + ($json.tokens_ut/1e6)*p.ut;
return [{ json: { estimert_kostnad: +(usd * USD_NOK).toFixed(2) } }];
```

## Del 2 — «Skriv Utfall» (for hvert utadrettet utkast)
Når en agent lager et utkast (svar/outreach/tilbud), opprett samtidig én rad i **Utfall**
(`tbl19725pjhkGu7LT`) med `Sendt-beslutning` tom (modnes i Del 4).

| Utfall-felt | Felt-ID | Kilde |
| --- | --- | --- |
| Handling | `fldGEeby678PLKcaS` | f.eks. «Outreach – julebord Nordlys» |
| Agentlogg-ref | `fldfNHh9yJLh2w27c` | record-ID fra Del 1 (link) |
| Avtale | `fldgKMFZ68UNTALq6` | Avtaler-record-ID (link) |
| Prompt-ID | `fldSUc497Ajl14kik` | `{id}-v{version}` |
| Segment | `fldjpVyU6QNI8mgax` | fra Bedrifter.Segment om kjent |
| Sendt-beslutning | `fldFGbf90qkX2TGo6` | *(tom — settes i Del 4)* |
| Respons | `fld5O9Sr3dxruK1rG` | *(tom)* |
| Resultat | `fldNGjpiaDoGnEzln` | `Pågår` |
| Tapsårsak | `fldiAJl3vMZ6ubuWv` | *(tom)* |
| Notat | `flds1mWTwgEuRQs8L` | valgfritt |

## Del 3 — «Eskalér» (lav konfidens / guardrail / feil)
Hvis `konfidens = Lav`, et guardrail-treff, eller `feilkode` satt → opprett rad i **Eskaleringer**
(`tblWOneeFROVhtCmS`). Logg fortsatt i Agentlogg (Del 1) i tillegg.

| Eskaleringer-felt | Felt-ID | Kilde |
| --- | --- | --- |
| Sak | `fldNFr0seP1535SIW` | kort beskrivelse |
| Opprettet | `fldA9CQNbF3xi7nBw` | `{{$now}}` |
| Agent | `fld4WBcMR6iJ9ddfw` | agentnavn |
| Årsak | `fldfpn0oW7PWkD7Ty` | `Lav konfidens`/`Guardrail`/`Feil`/`Datakonflikt`/`VIP/strategisk` |
| Alvorlighet | `fldlplNuILxby0QRn` | `Kritisk`/`Høy`/`Normal` (SLA-regel under) |
| Relatert avtale | `fldfJ8ZIp3eS3bSk8` | Avtaler-record-ID (link) |
| Status | `fldZmtkuFkIyftOc3` | `Åpen` |
| Løsning | `fldin0yTxhZCO8TZU` | *(tom — fylles av Jonathan)* |

**Alvorlighet-regel:** `API_AUTH`, feil sendt, eller dobbeltbooking → `Kritisk` (+ Slack/e-post-varsel).
do_not_contact / lav konfidens → `Normal`. VIP/strategisk → `Høy`. Se
[`observability/logging-standard.md`](../observability/logging-standard.md#eskaleringskø-eskaleringer).

## Del 4 — «Modne utfall» (planlagt jobb, daglig)
Egen Schedule-trigger (f.eks. 21:00, sammen med digital-jonathans kveldsrytme) som oppdaterer åpne
**Utfall**-rader fra det vi kan utlede automatisk — så Jonathan slipper å registrere manuelt:

1. **Sendt-beslutning:** finn Gmail-utkastet. Sendt → `Sendt`; fortsatt utkast etter N dager →
   vurder `Forkastet`. (Manuelt redigert før sending kan ikke alltid utledes — be Jonathan flagge de
   få tilfellene.)
2. **Respons:** kom det svar i tråden etter sending? `Svar` / `Ikke svar` / `For tidlig` (< terskel).
3. **Resultat:** slå opp koblet Avtale-status (`fldz9idAhodgCEKGU`): `Gjennomført` → `Vunnet`;
   `Tapt` → `Tapt` (be om `Tapsårsak`); ellers `Pågår`.

Det som ikke kan utledes (særlig `Tapsårsak`), be Jonathan om i mandagsbriefen.

## Prompts / agents used
- [`agents/digital-jonathan.md`](../agents/digital-jonathan.md) og
  [`agents/gavekort-selger.md`](../agents/gavekort-selger.md) (kaller Del 1–3).
- [`agents/orchestrator.md`](../agents/orchestrator.md) (eier eskaleringslogikken i Del 3).
- Prompt-ID = `{id}-v{version}` fra [`prompts/`](../prompts/).

## Side effects
- **Skriver:** Agentlogg, Utfall, Eskaleringer (alle i `appzIFWfzob6WEhnq`). Oppdaterer Utfall-rader
  i Del 4.
- **Leser:** Gmail (utkast/svar-status), Avtaler (status, kobling), Bedrifter (segment), config
  (priser).
- **Ingen** utadrettede handlinger — sender ingenting.

## Failure handling
- Logg-skriving må **aldri** blokkere selve salgshandlingen. Feiler Del 1, fanges det i flytens
  feilgren: køes for ny skriving, men utkastet/CRM-raden står. (Logg er sekundært til arbeidet.)
- Airtable-skrivefeil → retry m/ backoff per [`integrations/resilience.md`](../integrations/resilience.md);
  vedvarende → én `Kritisk`-eskalering (ikke per rad, for å unngå støy).
- Idempotens: bruk Agentlogg-record-ID som nøkkel i Utfall (`Agentlogg-ref`) så re-kjøring ikke
  dupliserer.
