# Airtable-integrasjon

Airtable er **kildesystemet (system of record) for CRM-et**. Basen «Salgspipeline – Restaurant CRM»
(`appzIFWfzob6WEhnq`) holder alle avtaler, lokaler, partneravtaler, kampanjer og AI-aktivitetslogg.
Skjemaet er dokumentert i [`crm/schema.md`](../crm/schema.md). Jf.
[ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

## Formål
- Gi agenter og mennesker ett felles, strukturert sted for salgsdata.
- La n8n-agentene fange leads, oppdatere status, generere tilbudsutkast og logge aktivitet.
- Drive mandagsbrief, forecast og oppfølgingsvarsler fra ekte data.

## Base og tabeller
| Tabell | ID | Rolle |
| --- | --- | --- |
| Avtaler | `tblIrsWlPYO3K4AXz` | Kjernen — leads, tilbud, bookinger. |
| Venues | `tblgMDhWEPCY4596A` | Lokaleregister for venueforslag og tilbud. |
| Partneravtaler | `tbl2rul6qnsOselDY` | Partnerskap med fornyelsessyklus. |
| Kampanjer | `tblCSWGuK6JyZsIyG` | Salgs-/markedskampanjer. |
| Agentlogg | `tblvJbS3hvhC1C4cY` | AI-aktivitetslogg + flagg for menneskelig vurdering. |

## Tilganger (minste privilegium)
| Handling | Tillatt | Notat |
| --- | --- | --- |
| Lese poster | ✅ | For kontekst, brief og forecast. |
| Opprette poster | ✅ | Nye leads → Avtaler; logg → Agentlogg. |
| Oppdatere poster | ✅ | Status, neste oppfølging, tilbudsflagg. |
| Slette poster | ❌ | Aldri av en agent. |

Permission-nivå på basen: `create`. Hemmeligheter (API-nøkkel) bor i kjøremiljøet, refereres ved
navn (se [`config/README.md`](../config/README.md)).

## Konvensjoner for agenter
- **Les skjemaet før skriving.** Bruk eksakte feltnavn og utvalgsverdier fra
  [`crm/schema.md`](../crm/schema.md) — Airtable er strengt på navn.
- **Avtaler er navet.** En ny lead = én rad i Avtaler, med Selger, Type, Status (`Ny lead`),
  Restaurant og helst `Neste oppfølging`.
- **Respekter n8n-eide felter.** `Gmail-tråd`, `Tilbudsutkast laget` og formelfelter
  (`Vektet verdi`, `Forfalt oppfølging`, `Dager til selskap`) settes av automatikken.
- **Logg AI-handlinger** i Agentlogg, og sett «Trenger menneskelig vurdering» når noe bør sjekkes.
- **Ikke dupliser** — sjekk om en avtale/bedrift finnes før du oppretter en ny rad.

## Sikkerhetsgjerder
- **Ingen sletting.** Ingen masseoverskriving av eksisterende data uten eksplisitt bekreftelse.
- **Utadrettede handlinger** (e-post, kundekontakt) lages som utkast og godkjennes av menneske —
  CRM-oppdateringer i seg selv er interne og kan gjøres av agentene.
- **Personvern:** ikke eksporter kundedata ut av Airtable/Gmail.

## Knyttede systemer
- **Gmail** — `Gmail-tråd`-feltet lenker en avtale til kilde-eposten.
- **n8n** — agentene «Digital Jonathan» og «Gavekort-selger» leser/skriver basen (se
  [`workflows/`](../workflows/)).
- **Apollo / Clay** — kan mate nye leads inn i Avtaler (prospektering).
