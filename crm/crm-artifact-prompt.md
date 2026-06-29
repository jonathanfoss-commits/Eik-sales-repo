# CRM-artifact-prompt

En **ferdig prompt** du limer inn i Claude (med Artifacts på) for å generere et fungerende CRM-grensesnitt
som speiler dette systemet: samme skjema som Airtable-basen, samme pipeline-verdier, og det menneskelige
cockpit-laget (L5) oppå agent-mesh-et og måle-laget (L4).

**Slik bruker du den:** åpne en ny Claude-samtale, kopier alt i kodeblokken under, lim inn, send. Be om
endringer i samme samtale etterpå («legg til X», «endre Y»).

**Hvorfor den «samarbeider med alt annet»:**
- Speiler Airtable-skjemaet ([`schema.md`](schema.md)) tabell-for-tabell og felt-for-felt → data er
  utvekselbare (JSON import/eksport i samme form som [`workflows/airtable-backup.md`](../workflows/airtable-backup.md)).
- Bruker de **eksakte** pipeline-statusene og utvalgsverdiene → ingen oversettelsestap.
- Viser agentenes arbeid (Agentlogg, Utfall, Eskaleringer) → blir det menneskelige laget over
  [agent-mesh-et](../agents/README.md#agent-mesh-registeret) og [måle-loopen](../observability/maaleloop.md).
- Bygget med et `dataSource`-lag, så det senere kan peke på den ekte Airtable-basen uten ombygging.

---

```
Du er en senior frontend-utvikler. Bygg et komplett CRM-grensesnitt som en enkelt-fil React-artifact
(Claude Artifact). Dette er det menneskelige «cockpit»-laget for et AI-drevet salgssystem for Eik &
Friends (et norsk restaurantkollektiv, ~22 lokaler). Følg spesifikasjonen nøyaktig.

== SPRÅK ==
Hele grensesnittet på NORSK (bokmål). Feltnavn og utvalgsverdier brukes EKSAKT som oppgitt under
(de matcher et ekte Airtable-CRM, så stavemåten må stemme).

== TEKNISK ==
- Én fil, React + Tailwind. Bruk lucide-react til ikoner og recharts til grafer.
- Ingen eksterne API-kall / ingen nøkler. All data i React-state, seedet med syntetiske eksempeldata
  (se under). Ingen ekte kundedata.
- Lag et tynt datalag `dataSource` (CRUD-funksjoner mot state) som er ISOLERT i én modul, slik at man
  senere kan bytte det ut med Airtable REST API (base appzIFWfzob6WEhnq) uten å røre UI-et. Kommentér
  hvor byttet skjer.
- JSON «Importer/Eksporter»-knapper: eksporter alle tabeller som ett JSON-objekt {tabellnavn: [rader]},
  og kunne importere samme form. Dette er backup-/utvekslingsformatet.
- Pent, tett, profesjonelt design. Venstre sidebar-navigasjon. Responsivt. Norske datoformat (ISO),
  valuta NOK, tidssone Europe/Oslo.

== DATAMODELL (speiler Airtable — bruk disse tabellene, feltene og utvalgsverdiene eksakt) ==

Avtaler (kjernetabell, én rad per lead/event):
  Tittel, Bedrift, Kontaktperson, Telefon, Epost,
  Selger [Jonathan Foss | Christopher Erstad],
  Restaurant [ett av lokalene under, eller Gavekort | Amex | Flere/Annet],
  Type [Bedriftsevent | Privat | Gavekort | Amex | Annet],
  Status [Ny lead | I dialog | Tilbud sendt | Pending | Bekreftet | Gjennomført | Tapt],
  Totalbudsjett (NOK), Spend per pax (NOK), Antall pax (tall),
  Dato for selskap (dato), Booket dato (dato), Neste oppfølging (dato), Notater,
  Gmail-tråd (url), Tilbudsutkast laget (avkrysning).
  Avledet (beregn i UI, ikke lagre): Dager til selskap, Forfalt oppfølging (Neste oppfølging < i dag),
  Vektet verdi (Totalbudsjett × sannsynlighet fra Status: Ny lead 10%, I dialog 25%, Tilbud sendt 40%,
  Pending 60%, Bekreftet 100%, Gjennomført 100%, Tapt 0%),
  Pipeline-hygiene (flagg: «⚠️ Sett til Gjennomført» hvis Status=Bekreftet og Dato for selskap passert;
  «🔔 Oppfølging mangler/forfalt» hvis åpen avtale uten/forfalt Neste oppfølging).

Bedrifter (kjerneentitet for kunderelasjoner):
  Navn, Org.nr, Bransje, Segment [Strategisk | Vekst | Standard], Relasjonseier
  [Jonathan Foss | Christopher Erstad], Notater, + lenke til Avtaler.
  Vis konto-360: rollups beregnet i UI (samlet verdi, antall avtaler, vunnet-verdi, siste kontakt,
  gjentakende ja/nei = ≥2 Gjennomført).

Venues (lokaler):
  Navn, Sted, Konsept, Nettside, Kontaktperson, Kontakt-epost, Maks pax,
  Egnet for (flervalg) [Julebord | Sommerfest | Konferanse | Stort event 150+ | Mindre grupper |
  Privatfest | Uteservering | Nattklubb/fest | Matkurs], Priser og vilkår, Notater, Verifisert (avkr.).

Partneravtaler:
  Avtalenavn, Partner, Type [Medlemsfordel | Sponsor | Gjensidig henvisning | Gavekort-distribusjon |
  Annet], Status [Prospekt | I dialog | Aktiv | Pauset | Avsluttet], Verdi per år (NOK),
  Rabatt (%), Startdato, Fornyelsesdato, Kontaktperson, Kontakt-epost, Ansvarlig, Notater.
  Avledet: Fornyelsesvarsel (flagg når Fornyelsesdato nær/passert).

Kampanjer:
  Kampanjenavn, Type [Julebord | Sommer | Gavekort | Amex | Event | Medlemsfordel | Annet],
  Status [Idé | Planlagt | Aktiv | Avsluttet], Startdato, Sluttdato, Målgruppe,
  Kanal (flervalg) [E-post | LinkedIn | Telefon | Partner | Nettside | Sosiale medier | Annet],
  Mål, Resultat omsetning (NOK), Ansvarlig, Notater.

Agentlogg (hva AI-agentene har gjort — revisjonsspor):
  Handling, Tidspunkt, Agent [Digital Jonathan (AI) | Gavekort-selger (AI) | Orkestrator (AI) |
  Kvalitetssikrer (AI) | Annen agent], Kategori [Prospektering | Outreach-utkast | CRM-oppdatering |
  Tilbud | Oppfølging | Analyse/rapport | Annet], Resultat, Trenger menneskelig vurdering (avkr.),
  Relatert avtale/bedrift, Modell, Tokens inn, Tokens ut, Estimert kostnad (NOK), Latens (ms),
  Konfidens [Høy | Middels | Lav], Beslutning (hvorfor), Prompt-ID, Feilkode [tom | API_TIMEOUT |
  API_AUTH | RATE_LIMIT | DATA_INVALID | DATA_CONFLICT | LOW_CONFIDENCE | GUARDRAIL_BLOCK | UNKNOWN].

Utfall (måle-loopen — kobler AI-handling til resultat):
  Handling, Agentlogg-ref, Avtale, Prompt-ID, Segment, Sendt-beslutning [Sendt | Forkastet |
  Endret før sending], Respons [Svar | Ikke svar | For tidlig], Resultat [Vunnet | Tapt | Pågår],
  Tapsårsak [Pris | Timing | Valgte konkurrent | Ikke svar | Annet], Notat.

Eskaleringer (saker som krever menneske, m/ SLA):
  Sak, Opprettet, Agent, Årsak [Lav konfidens | Feil | Guardrail | Datakonflikt | VIP/strategisk |
  Annet], Alvorlighet [Kritisk (SLA 1t) | Høy (4t) | Normal (1 arb.dag)], Relatert avtale,
  Status [Åpen | Under arbeid | Løst | Avvist], Løsning.

Lokaler (gyldige Restaurant-verdier i Avtaler): TAKET Steen & Strøm, FYR Bistronomi & Bar, Sawan,
Amazonia by BAR, Brød & Sirkus, Kafe Republik, Kastellet, Honolulu, Girotondo, Bar Vulkan,
Hitchhiker, LULU, Rugantino, Der Peppern Gror Rådhusplassen, Delicatessen Aker Brygge,
Delicatessen Stavanger, Vineria Ventidue, Smalhans, Katla, HEIM Gastropub St. Hanshaugen, Folkvang,
The Golden Chimp.

== SKJERMER (venstre meny) ==
1. Dashboard — KPI-kort + grafer:
   - Forfalte oppfølginger (stort tall, mål 0), Pipeline-hygiene-flagg (tall),
     Åpne eskaleringer over SLA (rødt hvis >0).
   - Vektet pipeline-verdi (NOK), Omsetning hittil (sum Gjennomført).
   - Søylegraf: pipeline per Status (antall + verdi). Søylegraf: vunnet-rate per Type.
   - Måle-loop (hvis Utfall har data): AI-utkast→sendt-rate, svarrate per Prompt-ID.
   - Liste «⚠️ Krever handling nå» fra Pipeline-hygiene, sortert på Vektet verdi.
2. Pipeline — kanban med kolonner = Status-verdiene (Ny lead → … → Gjennomført, + Tapt). Kort viser
   Tittel, Bedrift, verdi, Neste oppfølging (rød hvis forfalt). Dra-og-slipp for å endre Status.
3. Avtaler — sorterbar/filtrerbar tabell + opprett/rediger i et panel. Vis avledede felt.
4. Bedrifter — liste + konto-360-visning (rollups + tilknyttede avtaler + kryss-salgsmuligheter:
   linjer kunden IKKE har ennå av event/gavekort/Amex).
5. Venues — kort/tabell; filtrer på «Egnet for» og Maks pax (lokale-match-hjelper).
6. Kampanjer og Partneravtaler — tabeller m/ status og fornyelses-/resultatflagg.
7. AI-aktivitet — Agentlogg (revisjonsspor m/ Beslutning, Konfidens, kostnad) + en
   «Godkjenningsinnboks» som filtrerer rader med Trenger menneskelig vurdering = sann.
8. Måle-loop — Utfall-tabell + svarrate per Prompt-ID/segment.
9. Eskaleringer — kø sortert på Alvorlighet, med SLA-nedtelling og status.

== VIKTIGE REGLER (gjenspeil i UI) ==
- Menneske-i-løkken: AI lager UTKAST og forslag; ingenting «sendes» fra dette grensesnittet — vis
  «Godkjenn»/«Avvis» der det er relevant (særlig Godkjenningsinnboksen).
- Ikke dikt opp data; ukjent vises som «[avklares]».
- Bruk de eksakte utvalgsverdiene over, med fargekoding (f.eks. Status og Alvorlighet).
- Seed med ~12 syntetiske Avtaler (blandet Status, et par forfalte oppfølginger, 1–2 Bekreftet med
  passert dato), ~5 Bedrifter (én Strategisk gjentakende), noen Venues, 1–2 Kampanjer/Partneravtaler,
  noen Agentlogg- og Utfall-rader og 1–2 Eskaleringer — alt åpenbart fiktivt (@example.no).

Lag det produksjonskvalitet, ryddig og umiddelbart brukbart. Etter at du har bygd det, gi meg en kort
liste over hva jeg enkelt kan be deg endre videre.
```

---

## Videreutvikling (når du vil)
- **Koble til ekte data:** be Claude bytte `dataSource`-modulen til Airtable REST API mot base
  `appzIFWfzob6WEhnq` (nøkkel limes inn lokalt, aldri i repoet). Feltnavnene matcher allerede.
- **Hold skjemaet i sync:** endrer du Airtable, oppdater [`schema.md`](schema.md) og be Claude
  speile endringen i artifact-en.
- Denne prompten er versjonert her; oppdater den når datamodellen eller KPI-ene endres.
