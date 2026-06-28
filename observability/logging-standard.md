# Loggstandard

Hva **hver** AI-agent skal logge, hver gang den gjør noe. Målet: full sporbarhet uten å gjøre
agentene trege. Forankret i [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md).

> **Regelen:** Hvis en agent utfører en handling som endrer noe (CRM-rad, utkast, klassifisering,
> eskalering), **skal** den skrive én `Agentlogg`-rad. Rene lesninger logges ikke.

## Kjernefelt (logges alltid)
Disse finnes i `Agentlogg` i dag eller legges til (se [oppsett](#airtable-oppsett)). De er obligatoriske.

| Felt | Eksempel | Hvorfor |
| --- | --- | --- |
| `Handling` | «Svarutkast laget for Pareto sommerfest» | Hva skjedde (primærfelt). |
| `Tidspunkt` | 2026-06-28 08:03 | Når. |
| `Agent` | `Digital Jonathan (AI)` | Hvem handlet. |
| `Kategori` | `Outreach-utkast` | Grovsortering for aggregering. |
| `Resultat` | «Utkast lagret i Gmail, ikke sendt» | Utfall av handlingen. |
| `Relatert avtale/bedrift` | rec… / «Pareto» | Kobling for sporbarhet. |
| `Trenger menneskelig vurdering` | ☑/☐ | Trigger for eskaleringskø. |

## Utvidelsesfelt (logges når relevant)
Gir «hvorfor», kostnad og kvalitet. Valgfrie så de ikke bremser enkle handlinger.

| Felt | Type | Hvorfor |
| --- | --- | --- |
| `Modell` | singleSelect (`claude-opus-4-8`, `gpt-4o`, …) | Hvilken modell — for kost/kvalitet per modell og fremtidig modellbytte. |
| `Tokens inn` / `Tokens ut` | number | Ressursforbruk. |
| `Estimert kostnad` | currency (NOK) | Hva handlingen kostet. |
| `Latens (ms)` | number | Ytelse; fanger trege steg. |
| `Konfidens` | singleSelect (`Høy`, `Middels`, `Lav`) | Agentens egen sikkerhet → ruter lav-konfidens til menneske. |
| `Beslutning` | multilineText | Kort *hvorfor* (hvilken regel/kontekst som styrte valget). |
| `Prompt-ID` | singleLineText | Hvilken prompt/versjon ble brukt → kobling til [måle-loopen](maaleloop.md). |
| `Feilkode` | singleSelect (se taksonomi) | Hvis handlingen feilet. |

### Beslutning-feltet (det viktigste for tillit)
Én–to setninger: *hvilken regel eller kontekst styrte valget.* Eksempler:
- «Flagget som varm lead: budsjett >100k og dato <30 dager (ICP-regel).»
- «Forkastet auto-svar: avsender på `do_not_contact`. Eskalert.»
- «Valgte TAKET som lokale: 80 pax + ønske om utsikt, matchet Egnet for=Stort event.»

Dette er kontrakten bak kjerneprinsippet *«Jonathan skal alltid forstå hvorfor.»*

## Feiltaksonomi
Hver feil får en `Feilkode` så feilrate kan måles per type. Se
[`integrations/resilience.md`](../integrations/resilience.md) for hva agenten *gjør* ved hver.

| Kode | Betydning | Standard håndtering |
| --- | --- | --- |
| `API_TIMEOUT` | Verktøy svarte ikke i tide | Retry m/ backoff (3x); så eskalér. |
| `API_AUTH` | Token utløpt/avvist | Stopp, eskalér umiddelbart (ingen retry). |
| `RATE_LIMIT` | For mange kall | Backoff + køes; ikke dropp. |
| `DATA_INVALID` | Ugyldig/manglende påkrevd data | Ikke skriv; logg + flagg for menneske. |
| `DATA_CONFLICT` | Konflikt (f.eks. dobbeltbooking) | Ikke overskriv; eskalér med begge versjoner. |
| `LOW_CONFIDENCE` | Agent under konfidensterskel | Lag utkast, men flagg `Trenger menneskelig vurdering`. |
| `GUARDRAIL_BLOCK` | Handling stoppet av sikkerhetsgjerde | Logg hva som ble stoppet + hvorfor; eskalér ved tvil. |
| `UNKNOWN` | Uklassifisert | Eskalér; klassifiser i etterkant og utvid taksonomien. |

## Eskaleringskø (`Eskaleringer`)
Saker som krever menneske skal ikke drukne i `Agentlogg`. Egen tabell med **SLA**, så ingenting blir
liggende.

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| `Sak` | singleLineText | Kort beskrivelse (primærfelt). |
| `Opprettet` | dateTime | Når eskalert. |
| `Agent` | singleSelect | Hvem eskalerte. |
| `Årsak` | singleSelect | `Lav konfidens`, `Feil`, `Guardrail`, `Datakonflikt`, `VIP/strategisk`, `Annet`. |
| `Alvorlighet` | singleSelect | `Kritisk` (SLA 1t), `Høy` (4t), `Normal` (1 arb.dag). |
| `Relatert avtale/bedrift` | link | Kobling. |
| `Status` | singleSelect | `Åpen`, `Under arbeid`, `Løst`, `Avvist`. |
| `Løsning` | multilineText | Hva Jonathan gjorde → mat til måle-loopen. |

**SLA-prinsipp:** `Kritisk` = noe utadrettet eller dataintegritet står på spill (f.eks. feil sendt,
dobbeltbooking, auth-feil som stopper intake). En kritisk sak skal også varsle på Slack/e-post, ikke
bare ligge i tabellen.

## Kostnad & ressurs
Med `Modell` + `Tokens` + `Estimert kostnad` per rad kan vi aggregere:
- Kostnad per agent, per kategori, per uke.
- Kostnad per **vunnet avtale** (den egentlige effektivitets-KPI-en — se [`metrics.md`](metrics.md)).
- Modellmiks over tid (grunnlag for å bytte modell når en billigere er god nok).

Kostnad estimeres fra tokens × gjeldende pris for modellen. Prisene holdes i
[`config/`](../config/README.md) (ikke hardkodet i agentene), så et prisbytte er ett sted.

## Airtable-oppsett ✅ (live 28.06.2026)
Hele standarden er nå i basen:
1. ✅ Alle utvidelsesfelt lagt til i `Agentlogg` (`tblvJbS3hvhC1C4cY`): `Modell`, `Tokens inn/ut`,
   `Estimert kostnad`, `Latens (ms)`, `Konfidens`, `Beslutning`, `Prompt-ID`, `Feilkode`.
2. ✅ Tabellen `Eskaleringer` (`tblWOneeFROVhtCmS`) opprettet.
3. ✅ Tabellen `Utfall` (`tbl19725pjhkGu7LT`) opprettet — se [`maaleloop.md`](maaleloop.md).
4. ✅ [`crm/schema.md`](../crm/schema.md) oppdatert med live felt og tabeller.

> **Gjenstår (UI, valgfritt):** ev. formel-/rollup-felt for aggregering (kostnad per uke o.l.) og
> et automatisk varsel ved `Alvorlighet = Kritisk`. Selve loggingen kan starte nå.
