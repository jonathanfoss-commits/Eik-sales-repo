# Måle-loopen

Motoren for **komponerende kvalitet**: hver utadrettet AI-handling kobles til et **utfall**, så
prompter og agenter forbedres systematisk i stedet for å platåe. STRATEGY tese 4; forankret i
[ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md).

> Uten denne loopen er hver e-post og hvert tilbud en engangshendelse vi ikke lærer av. Med den blir
> systemet litt bedre hver uke — og det er i seg selv en konkurransefordel konkurrenter uten
> data-loopen ikke kan kopiere.

## Loopen i fire steg
```
1. HANDLING      Agent lager utkast (svar/outreach/tilbud) → logges i Agentlogg m/ Prompt-ID
        │
        ▼
2. UTFALL        Hva skjedde? sendt/forkastet → svar/ikke → møte → vunnet/tapt
        │        (registreres i Utfall, koblet til Agentlogg-raden + avtalen)
        ▼
3. AGGREGERING   Svarrate & vunnet-rate per Prompt-ID, segment, sesong, modell
        │
        ▼
4. FORBEDRING    Svake prompter revideres; vinnere blir mal. Ny versjon → ny Prompt-ID → mål igjen
        └────────────────────────────────────────────────────────────────────┘  (tilbake til 1)
```

## Utfallsmodellen
Hver utadrettet handling har en livssyklus av utfall. Vi registrerer det **siste kjente** utfallet
og lar det modnes:

| Utfallssteg | Verdi | Kilde |
| --- | --- | --- |
| Lagd | utkast finnes | Agentlogg |
| **Sendt-beslutning** | `Sendt` / `Forkastet` / `Endret før sending` | Jonathan (Gmail) |
| **Respons** | `Svar` / `Ikke svar` (etter X dager) | Gmail-tråd |
| **Progresjon** | `Møte booket` / `Tilbud sendt` | CRM-status |
| **Resultat** | `Vunnet` / `Tapt` (+ årsak) | Avtaler.Status |

«Endret før sending» er gull: diffen mellom AI-utkast og det Jonathan faktisk sendte er det sterkeste
forbedringssignalet vi har.

## `Utfall`-tabell (forslag)
| Felt | Type | Beskrivelse |
| --- | --- | --- |
| `Handling` | singleLineText | Hva slags (primærfelt), f.eks. «Outreach – julebord PwC». |
| `Agentlogg-ref` | link → Agentlogg | Hvilken AI-handling. |
| `Avtale` | link → Avtaler | Hvilken avtale. |
| `Prompt-ID` | singleLineText | Hvilken prompt/versjon ga utkastet. |
| `Segment` | singleSelect | `Strategisk`/`Vekst`/`Standard` (fra Bedrifter) — for utfall per segment. |
| `Sendt-beslutning` | singleSelect | `Sendt`/`Forkastet`/`Endret før sending`. |
| `Respons` | singleSelect | `Svar`/`Ikke svar`/`For tidlig`. |
| `Resultat` | singleSelect | `Vunnet`/`Tapt`/`Pågår`. |
| `Tapsårsak` | singleSelect | `Pris`/`Timing`/`Valgte konkurrent`/`Ikke svar`/`Annet`. |
| `Notat` | multilineText | Kontekst, f.eks. hva Jonathan endret. |

> Mange utfall kan **utledes** av eksisterende data (Avtaler.Status, Gmail-svar) i stedet for manuell
> registrering. Start med det automatiske; be bare Jonathan om det som ikke kan utledes (f.eks.
> tapsårsak).

## Forbedringskadens
| Kadens | Hva | Eier |
| --- | --- | --- |
| **Ukentlig (mandag)** | Topp/bunn-prompter på svarrate siste uke → flagg én å forbedre. | Analyseagent (→ Digital Jonathan mandagsbrief) |
| **Månedlig** | Vunnet-rate per segment/linje; tapsårsaker; revider playbook. | Jonathan + Analyseagent |
| **Kvartalsvis** | Gjennomgang av hele prompt-/agentbiblioteket mot utfall. | Jonathan (CTO-hatt) |

`Prompt-ID` utledes av promptens eksisterende front-matter som `{id}-v{version}` (f.eks.
`cold-outreach-v1`) — vi dupliserer den ikke som eget felt (prinsipp 5). Når en prompt revideres
vesentlig, **bump `version`** så gammelt og nytt kan måles mot hverandre. Se
[`prompts/README.md`](../prompts/README.md).

## Hvorfor dette er en moat
- Konkurrenter (enkeltlokaler, generiske eventbyråer) sender også e-post — men de **måler ikke
  utfall per formulering per segment**. Vårt system gjør hver uke det de gjør på magefølelse.
- Loopen komponerer: jo lengre den kjører, jo større forspranget. Data-fordelen er kumulativ.

## Airtable-oppsett
1. ✅ `Utfall`-tabellen (`tbl19725pjhkGu7LT`) er live i basen `appzIFWfzob6WEhnq`.
2. ✅ Ingen ny front-matter nødvendig — `Prompt-ID` = `{id}-v{version}` fra promptfilenes
   eksisterende front-matter (se [`prompts/README.md`](../prompts/README.md)).
3. ⏳ Bygg n8n-jobben som skriver/modner radene — node-for-node-guide m/ eksakte felt-ID-er i
   [`workflows/agentlogg-maaleloop.md`](../workflows/agentlogg-maaleloop.md).
4. Mandagsbriefen (Digital Jonathan) leser `Utfall` og rapporterer ukens svake/sterke prompter.
5. ✅ [`crm/schema.md`](../crm/schema.md) og statustabellen i [`README.md`](README.md) oppdatert.
