# KPI-katalog

STRATEGY definerer *hva* vi styrer etter; her gjøres det **operativt** — hver KPI med definisjon,
kilde, formel, mål og kadens. Dette er kontrakten et fremtidig KPI-dashboard (L5) bygges på.
Forankret i [ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md) og KPI-rammeverket i
[STRATEGY.md](../docs/STRATEGY.md).

> **Prinsipp:** En KPI uten en definert kilde og et mål er pynt. Hver rad under skal kunne beregnes
> fra felt som faktisk finnes (eller er planlagt) i Airtable.

## Omsetning
| KPI | Definisjon | Kilde | Mål | Kadens |
| --- | --- | --- | --- | --- |
| Vektet pipeline-verdi | SUM(`Vektet verdi`) for åpne avtaler | Avtaler | Trend ↑ | Ukentlig |
| Vunnet-rate per linje | `Gjennomført` / (alle avlsluttede) per `Type` | Avtaler | event ≥30 % | Månedlig |
| Snittavtale (NOK) | AVG(`Totalbudsjett`) for `Gjennomført` | Avtaler | Trend ↑ | Månedlig |
| Omsetning hittil | SUM(`Totalbudsjett`) `Gjennomført` i periode | Avtaler | Mot budsjett | Månedlig |

## Gjentakelse (svinghjulet)
| KPI | Definisjon | Kilde | Mål | Kadens |
| --- | --- | --- | --- | --- |
| Andel gjentakende bedrifter | Bedrifter m/ ≥2 `Gjennomført` / aktive bedrifter | Bedrifter (rollup) | ↑ | Kvartal |
| Gavekort ARR | SUM(årsverdi aktive gavekortavtaler) | Gavekortavtaler (ADR 0004) | ↑ | Månedlig |
| Kontoens livstidsverdi | SUM(`Totalbudsjett`) per Bedrift | Bedrifter (rollup) | — (segmentering) | Kvartal |
| Kryss-salgsgrad | Bedrifter m/ ≥2 linjer (event+gavekort+Amex) / totalt | Bedrifter | ↑ | Kvartal |

## Effektivitet (her måle-loopen + logging møtes)
| KPI | Definisjon | Kilde | Mål | Kadens |
| --- | --- | --- | --- | --- |
| AI-utkast → sendt-rate | `Sendt` / (alle utkast) | Utfall | ≥70 % | Ukentlig |
| Endret-før-sending-rate | `Endret før sending` / sendte | Utfall | ↓ over tid | Ukentlig |
| Ledetid lead→tilbud | dager fra `Ny lead` til `Tilbud sendt` | Avtaler (datofelt) | ↓ | Månedlig |
| Kostnad per vunnet avtale | SUM(`Estimert kostnad`) / antall `Gjennomført` | Agentlogg + Avtaler | ↓ | Månedlig |
| Spart tid (est.) | antall auto-utkast × snitt manuell tid | Agentlogg | ↑ | Månedlig |

## Kvalitet
| KPI | Definisjon | Kilde | Mål | Kadens |
| --- | --- | --- | --- | --- |
| Svarrate per prompt | `Svar` / sendte, per `Prompt-ID` | Utfall | identifiser topp/bunn | Ukentlig |
| Svarrate per segment | samme, gruppert på `Segment` | Utfall | — (innsikt) | Månedlig |
| Tilbud→vunnet-rate | `Vunnet` / (avtaler m/ tilbud sendt) | Avtaler/Utfall | ↑ | Månedlig |
| Andel avtaler m/ fersk oppfølging | avtaler u/ forfalt `Neste oppfølging` / åpne | Avtaler (`Forfalt oppfølging`) | ≥90 % | Ukentlig |

## Drift (helse)
| KPI | Definisjon | Kilde | Mål | Kadens |
| --- | --- | --- | --- | --- |
| Forfalte oppfølginger | COUNT(`Forfalt oppfølging` = sant) | Avtaler | **→ 0** | Daglig |
| Pipeline-hygiene-flagg | COUNT(`Pipeline-hygiene` ≠ tom) | Avtaler | → 0 | Daglig |
| Agent-feilrate | rader m/ `Feilkode` / alle handlinger | Agentlogg | <2 % | Ukentlig |
| Åpne eskaleringer over SLA | `Eskaleringer` der nå − `Opprettet` > SLA | Eskaleringer | 0 | Daglig |
| Systemkostnad/uke | SUM(`Estimert kostnad`) siste 7 d | Agentlogg | innenfor budsjett | Ukentlig |

## Fra katalog til dashboard
1. KPI-ene over som **ikke** krever nye felt (omsetning, drift) kan vises i et Airtable-interface i
   dag.
2. Effektivitet/kvalitet venter på `Utfall`-tabellen (se [`maaleloop.md`](maaleloop.md)).
3. Gjentakelse venter på Bedrifter-rollups (ADR 0003, fase 5).
4. Bygg dashboardet som et **Airtable-interface** (L5) — ikke et nytt verktøy — så lenge det holder.
   Vurder eksport til Google Sheets/Looker først når kryss-base-rapportering trengs.

> Hold denne katalogen og [STRATEGY-KPI-tabellen](../docs/STRATEGY.md) i sync. Endrer du en
> definisjon, oppdater begge.
