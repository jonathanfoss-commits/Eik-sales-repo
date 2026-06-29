# KPI-dashboard (L5) — spesifikasjon

Et **byggeklart** oppsett for KPI-dashboardet som Airtable-interface — det menneskelige
grensesnittet (L5) oppå måle-laget (L4). Bygges som et **Airtable-interface** på basen
`appzIFWfzob6WEhnq`, ikke et nytt verktøy (jf. [`metrics.md`](metrics.md) og prinsipp 1: enkelhet).
KPI-definisjonene er kanoniske i [`metrics.md`](metrics.md) — denne filen sier *hvordan de vises*.

> Bygg seksjonene i rekkefølge etter datatilgjengelighet: **Drift + Pipeline** kan bygges i dag;
> **Måle-loop** når `Utfall` har data; **Kontoer** når Bedrifter-rollups er satt opp (ADR 0003).

## Side 1 — «Daglig drift» (helse, bygg nå)
| Element | Type | Kilde / filter |
| --- | --- | --- |
| Forfalte oppfølginger | Stort tall (mål 0) | Avtaler, `Forfalt oppfølging` = sann |
| Pipeline-hygiene-flagg | Tall | Avtaler, `Pipeline-hygiene` ≠ tom |
| Åpne eskaleringer over SLA | Tall (rødt >0) | Eskaleringer, `Status`=Åpen og over SLA per `Alvorlighet` |
| Eskaleringer etter alvorlighet | Søylediagram | Eskaleringer gruppert på `Alvorlighet` |
| «Står fast»-liste | Filtrert grid | Avtaler m/ flagg, sortert på `Vektet verdi` |

## Side 2 — «Pipeline & omsetning» (bygg nå)
| Element | Type | Kilde / filter |
| --- | --- | --- |
| Vektet pipeline-verdi | Stort tall | Avtaler (åpne), SUM(`Vektet verdi`) |
| Pipeline per steg | Søylediagram | Avtaler gruppert på `Status` (live-verdier) |
| Vunnet-rate per linje | Diagram | Avtaler gruppert på `Type`, andel `Gjennomført` |
| Omsetning hittil | Tall | Avtaler `Gjennomført`, SUM(`Totalbudsjett`) i periode |
| Forventet signert denne uken | Filtrert grid | Avtaler m/ `Dato for selskap` denne uken |

## Side 3 — «Måle-loop & kvalitet» (når `Utfall` har data)
| Element | Type | Kilde / filter |
| --- | --- | --- |
| AI-utkast → sendt-rate | Tall | Utfall, `Sendt`/alle |
| Endret-før-sending-rate | Tall (↓ er bra) | Utfall, `Endret før sending`/sendte |
| Svarrate per Prompt-ID | Søylediagram | Utfall gruppert på `Prompt-ID` |
| Svarrate per segment | Diagram | Utfall gruppert på `Segment` |
| Tilbud→vunnet-rate | Tall | Avtaler/Utfall |

## Side 4 — «Kostnad & modell» (når Agentlogg fôres)
| Element | Type | Kilde / filter |
| --- | --- | --- |
| Systemkostnad siste 7 d | Tall | Agentlogg, SUM(`Estimert kostnad`) |
| Kostnad per agent | Diagram | Agentlogg gruppert på `Agent` |
| Modellmiks | Kakediagram | Agentlogg gruppert på `Modell` |
| Agent-feilrate | Tall | Agentlogg, rader m/ `Feilkode`/alle |
| Kostnad per vunnet avtale | Tall | Agentlogg-kostnad / antall `Gjennomført` |

## Side 5 — «Kontoer» (når Bedrifter-rollups finnes, ADR 0003)
| Element | Type | Kilde / filter |
| --- | --- | --- |
| Strategiske kontoer | Filtrert grid | Bedrifter, `Segment`=Strategisk, sortert på samlet verdi |
| Andel gjentakende bedrifter | Tall | Bedrifter, ≥2 `Gjennomført` / aktive |
| Kryss-salgsgrad | Tall | Bedrifter m/ ≥2 linjer / totalt |
| Kalde strategiske kontoer | Filtrert grid | Bedrifter, `Segment`=Strategisk, siste kontakt > 90 d |

## Hvem leser hva
- **Jonathan, daglig:** Side 1 (drift) + mandagsbriefen fra [`analyse-rapportagent`](../agents/analyse-rapportagent.md).
- **Jonathan, ukentlig/månedlig:** Side 2–3 (pipeline + måle-loop).
- **CTO-hatt, kvartal:** Side 4–5 (kostnad + kontoer) for strategiske valg.

## Bygg-rekkefølge
1. Side 1 + 2 (krever bare eksisterende felt). 2. Side 4 når Agentlogg fôres ([`agentlogg-maaleloop`](../workflows/agentlogg-maaleloop.md)).
3. Side 3 når `Utfall` har data. 4. Side 5 når rollups er satt opp.

> Når én side er bygd, oppdater statustabellen i [`README.md`](README.md).
