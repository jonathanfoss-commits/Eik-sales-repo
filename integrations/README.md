# Integrasjoner

Hvordan Eik Sales OS kobler seg til omverdenen. Hvert tilkoblet verktøy er et **kildesystem**
for noe; denne modulen dokumenterer hva hver integrasjon er til, hva den *får lov til*, og dataene
den eksponerer — slik at agenter handler trygt og forutsigbart. Jf.
[ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

> Tilkoblinger konfigureres i kjøreflatene (Claude, n8n, Zapier), **ikke** i dette repoet.
> Hemmeligheter bor aldri her (se [`docs/CODING_STANDARDS.md`](../docs/CODING_STANDARDS.md#secrets--privacy)).

## Tilkoblede verktøy
| Verktøy | Kildesystem for | Standard tilgang |
| --- | --- | --- |
| **Airtable** | CRM (avtaler, lokaler, partnere, kampanjer, agentlogg) | Les / opprett / oppdater (ingen sletting) |
| **Gmail** | E-postkommunikasjon | Les, etikett, **utkast** (ingen autonom sending) |
| **Google Kalender** | Tilgjengelighet & møter | Les, opprett reservasjoner (bekreft eksterne invitasjoner) |
| **Google Drive / Docs** | Dokumenter & tilbud | Les / opprett (ingen destruktiv sletting) |
| **n8n** | Automasjonsmotor (AI-agentene) | Kjører [arbeidsflyter](../workflows/) |
| **Apollo / Clay** | Lead-generering & berikelse | Prospektering inn i Avtaler |
| **Notion** | ⚠️ Arkivert (gammelt salgssystem) | Ikke skriv — kun historikk |

> Andre tilkoblede verktøy finnes (Slack, Todoist, HubSpot, Canva, Zapier m.fl.) og dokumenteres
> her når de tas i aktiv bruk i salgsflyten.

## Standard sikkerhetsgjerder (gjelder alle integrasjoner)
1. **Menneske-i-løkken for utadrettede handlinger.** Sende e-post, melde en partner eller publisere
   gjøres som utkast for gjennomgang, med mindre en arbeidsflyt er eksplisitt godkjent for automatikk.
2. **Ingen destruktive handlinger** (slette, masseoverskrive) uten eksplisitt bekreftelse.
3. **Minste privilegium.** En agent får kun tilgangen jobben krever.
4. **Personvern.** Ikke eksporter kundedata ut av kildesystemene.

## Per-verktøy dokumentasjon
| Doc | Verktøy | Status |
| --- | --- | --- |
| [`airtable-integration.md`](airtable-integration.md) | Airtable (CRM) | **Live** — kildesystem for CRM |
| [`gmail-integration.md`](gmail-integration.md) | Gmail | Live — utkast/etiketter |
| [`calendar-integration.md`](calendar-integration.md) | Google Kalender | Live — lese/reservasjoner |
| [`notion-integration.md`](notion-integration.md) | Notion | ⚠️ Arkivert — kun historikk |

## Når noe feiler
Feil-, fallback- og backup-strategi for alle integrasjonene er samlet i
[`resilience.md`](resilience.md): hva hver agent gjør per feilkode, hvem som eier dataene, hva
fallbacken er, og hvordan vi tar backup. Grunnregel: **fail safe, ikke fail silent.**

## Legge til en ny integrasjon
1. Bekreft at den fortjener plassen (et reelt, gjentakende behov).
2. Dokumenter den her før den kobles til.
3. Bruk minste privilegium og standard sikkerhetsgjerder.
4. Noter den i [veikartet](../docs/ROADMAP.md) hvis den endrer arkitekturen.
