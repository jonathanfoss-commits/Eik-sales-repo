# CRM-skjema (Airtable)

Dokumentasjon av det faktiske skjemaet i Airtable-basen «Salgspipeline – Restaurant CRM»
(`appzIFWfzob6WEhnq`). Feltnavn og utvalgsverdier er gjengitt nøyaktig slik de er i basen (norsk).
Endres basen, oppdater denne filen. Jf. [ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

---

## Avtaler  `tblIrsWlPYO3K4AXz`
Alle leads, tilbud og bekreftede bestillinger. Én rad per avtale/event. **Kjernetabellen.**

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Tittel | singleLineText | Kort navn, f.eks. «Pareto – Sommerfest Amazonia». (Primærfelt.) |
| Bedrift | singleLineText | Kundens firma (fritekst — beholdes under overgangen). |
| Bedrift (lenke) | multipleRecordLinks | Relasjon til **Bedrifter** (ADR 0003). Dual-write sammen med fritekstfeltet. |
| Kontaktperson | singleLineText | Navn på kontakt. |
| Telefon | phoneNumber | Telefon. |
| Epost | email | E-post. |
| Selger | singleSelect | `Jonathan Foss`, `Christopher Erstad`. |
| Restaurant | singleSelect | Lokalet (22 venues) + `Gavekort`, `Amex`, `Flere/Annet`. Se [Venues](#venues--tblgmdhwepcy4596a). |
| Type | singleSelect | `Bedriftsevent`, `Privat`, `Gavekort`, `Amex`, `Annet`. |
| Status | singleSelect | Pipeline — se [`pipeline-stages.md`](pipeline-stages.md). |
| Totalbudsjett | currency (NOK) | Samlet verdi. |
| Spend per pax | currency (NOK) | Forbruk per gjest. |
| Antall pax | number | Antall gjester. |
| Dato for selskap | date | Når arrangementet avholdes. |
| Booket dato | date | Når avtalen ble booket. |
| Neste oppfølging | date | Når lead/kunde skal følges opp neste gang. Brukes i mandagsbriefen. |
| Notater | multilineText | Fri kontekst. |
| Dager til selskap | formula | Antall dager til «Dato for selskap». |
| Forfalt oppfølging | formula | Flagger om «Neste oppfølging» er passert. |
| Vektet verdi | formula | Totalbudsjett × sannsynlighet (avledet av Status). |
| Pipeline-hygiene | formula | Auto-flagg (oppdateres daglig): «⚠️ Sett til Gjennomført» eller «🔔 Oppfølging mangler/forfalt». Se [`workflows/crm-hygiene-automation.md`](../workflows/crm-hygiene-automation.md). |
| Gmail-tråd | url | Lenke til kilde-eposten. **Settes automatisk av n8n** ved lead-intake. |
| Tilbudsutkast laget | checkbox | **Settes av n8n Tilbud-agenten** når et utkast er generert (hindrer dobbeltbehandling). |

## Bedrifter  `tblta9yg4zK7Uzzxi`
**Kjerneentitet for kunderelasjoner** (ADR 0003). Én rad per bedrift; avtaler (og senere kontakter,
gavekortavtaler, interaksjoner) kobles hit for kontooversikt, livstidsverdi og kryss-salg.
Privatkunder trenger ikke rad her.

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Navn | singleLineText | Bedriftens kanoniske navn. (Primærfelt.) |
| Org.nr | singleLineText | Organisasjonsnummer (offentlig). |
| Bransje | singleLineText | Bransje/sektor. |
| Segment | singleSelect | `Strategisk` (høy verdi/gjentakende), `Vekst`, `Standard`. |
| Relasjonseier | singleSelect | `Jonathan Foss`, `Christopher Erstad`. |
| Notater | multilineText | Fri kontekst. |
| Avtaler | multipleRecordLinks | Omvendt lenke fra Avtaler.`Bedrift (lenke)`. |

> **Planlagt (ADR 0003):** rollup-felter for samlet verdi, antall avtaler, vunnet-rate, siste
> kontakt og «gjentakende?» — samt nye entiteter `Interaksjoner` og `Gavekortavtaler`.

## Venues  `tblgMDhWEPCY4596A`
Register over spisestedene i porteføljen. Brukes av AI-agenten til venueforslag og tilbud.

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Navn | singleLineText | Lokalets navn. (Primærfelt.) |
| Sted | singleLineText | By/område. |
| Konsept | singleLineText | Kjøkken/konsept kort. |
| Nettside | url | Lokalets nettside. |
| Kontaktperson | singleLineText | Kontakt på lokalet. |
| Kontakt-epost | email | E-post. |
| Maks pax | number | Maks kapasitet. |
| Egnet for | multipleSelects | `Julebord`, `Sommerfest`, `Konferanse`, `Stort event 150+`, `Mindre grupper`, `Privatfest`, `Uteservering`, `Nattklubb/fest`, `Matkurs`. |
| Priser og vilkår | multilineText | Pris/vilkår. |
| Notater | multilineText | Fri kontekst. |
| Verifisert | checkbox | Avhuket når Jonathan har kvalitetssikret raden. |

**Lokaler (Restaurant-valg i Avtaler):** TAKET Steen & Strøm, FYR Bistronomi & Bar, Sawan,
Amazonia by BAR, Brød & Sirkus, Kafe Republik, Kastellet, Honolulu, Girotondo, Bar Vulkan,
Hitchhiker, LULU, Rugantino, Der Peppern Gror Rådhusplassen, Delicatessen Aker Brygge,
Delicatessen Stavanger, Vineria Ventidue, Smalhans, Katla, HEIM Gastropub St. Hanshaugen, Folkvang,
The Golden Chimp.

## Partneravtaler  `tbl2rul6qnsOselDY`
Samarbeids- og partneravtaler med fornyelsessyklus (ulikt enkeltbookinger i Avtaler).

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Avtalenavn | singleLineText | Kort navn, f.eks. «Glede – medlemsfordel 2026». (Primærfelt.) |
| Partner | singleLineText | Partnerens navn. |
| Type | singleSelect | `Medlemsfordel`, `Sponsor`, `Gjensidig henvisning`, `Gavekort-distribusjon`, `Annet`. |
| Status | singleSelect | `Prospekt`, `I dialog`, `Aktiv`, `Pauset`, `Avsluttet`. |
| Verdi per år | currency (NOK) | Årlig verdi. |
| Rabatt | percent | Eventuell rabatt. |
| Startdato | date | Start. |
| Fornyelsesdato | date | Når avtalen fornyes. |
| Kontaktperson | singleLineText | Kontakt. |
| Kontakt-epost | email | E-post. |
| Ansvarlig | singleSelect | `Jonathan Foss`, `Christopher Erstad`. |
| Notater | multilineText | Fri kontekst. |
| Fornyelsesvarsel | formula | Flagger avtaler som nærmer seg eller har passert fornyelse. |

## Kampanjer  `tblCSWGuK6JyZsIyG`
Salgs- og markedskampanjer for planlegging og resultatoppfølging.

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Kampanjenavn | singleLineText | Navn. (Primærfelt.) |
| Type | singleSelect | `Julebord`, `Sommer`, `Gavekort`, `Amex`, `Event`, `Medlemsfordel`, `Annet`. |
| Status | singleSelect | `Idé`, `Planlagt`, `Aktiv`, `Avsluttet`. |
| Startdato / Sluttdato | date | Kampanjeperiode. |
| Målgruppe | singleLineText | Hvem kampanjen retter seg mot. |
| Kanal | multipleSelects | `E-post`, `LinkedIn`, `Telefon`, `Partner`, `Nettside`, `Sosiale medier`, `Annet`. |
| Mål | multilineText | Kampanjemål. |
| Resultat omsetning | currency (NOK) | Oppnådd omsetning. |
| Ansvarlig | singleSelect | Selger. |
| Notater | multilineText | Fri kontekst. |

## Agentlogg  `tblvJbS3hvhC1C4cY`
AI-aktivitetslogg: hva n8n-agentene har gjort, besluttet og trenger hjelp til.

| Felt | Type | Beskrivelse |
| --- | --- | --- |
| Handling | singleLineText | Kort hva agenten gjorde. (Primærfelt.) |
| Tidspunkt | dateTime | Når. |
| Agent | singleSelect | `Digital Jonathan (AI)`, `Gavekort-selger (AI)`, `Annen agent`. |
| Kategori | singleSelect | `Prospektering`, `Outreach-utkast`, `CRM-oppdatering`, `Tilbud`, `Oppfølging`, `Analyse/rapport`, `Annet`. |
| Resultat | multilineText | Hva som kom ut av handlingen. |
| Trenger menneskelig vurdering | checkbox | Flagg for at Jonathan bør se på det. |
| Relatert avtale/bedrift | singleLineText | Kobling til avtale/bedrift. |

---

## Konvensjoner
- **Bruk eksakte feltnavn og utvalgsverdier** slik de står her — Airtable er strengt på navn.
- **Datoer** er ISO 8601; valuta er NOK.
- **n8n-eide felter** (`Gmail-tråd`, `Tilbudsutkast laget`, formelfelter) settes av automatikken —
  ikke overstyr dem manuelt uten grunn.
- **Regler for nye avtaler:** hver avtale skal ha Selger, Type, Status og — for åpne avtaler — en
  `Neste oppfølging`. Tapte avtaler bør ha en kort årsak i Notater.
- Endringer i basens struktur skal reflekteres her og noteres i [veikartet](../docs/ROADMAP.md).
