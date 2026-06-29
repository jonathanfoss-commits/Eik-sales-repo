# Workflow: airtable-backup (ukentlig eksport)

- **Engine:** n8n
- **Status:** Draft (spec klar) — Airtable-snapshots er på fra før; denne flyten legger til en
  uavhengig, eksporterbar kopi.
- **Trigger:** Tidsplan — hver søndag 23:00 (Europe/Oslo).
- **Approval gate:** Ingen — ren intern backup (ingen kundekontakt, ingen endring i kildedata).

> Hvorfor: levende data bor i tredjeparts­verktøy vi ikke eier serverne til. Airtables egne snapshots
> dekker «angre i Airtable», men ikke «kontoen er sperret» eller «basen ble feilkonfigurert». Denne
> flyten gir en **uavhengig kopi** vi kontrollerer. Forankret i
> [`integrations/resilience.md`](../integrations/resilience.md#backup-strategi).

## Steg
1. **Trigger:** søndag 23:00.
2. **For hver tabell** i basen `appzIFWfzob6WEhnq` (Avtaler, Bedrifter, Venues, Partneravtaler,
   Kampanjer, Agentlogg, Utfall, Eskaleringer): hent alle rader (paginer; håndter rate-limit med
   backoff).
3. **Serialiser** hver tabell til **både** CSV (lesbart) og JSON (full troskap, inkl. lenker/typer).
4. **Lagre** til Google Drive under `/backups/airtable/ÅÅÅÅ-Uke<NN>/<tabell>.{csv,json}`. Én mappe
   per uke.
5. **Skriv et manifest** (`_manifest.json`) med tidsstempel, radtelling per tabell, og hvilke felt
   som fantes (skjema-øyeblikksbilde — utfyller [`crm/schema.md`](../crm/schema.md)).
6. **Roter:** behold ukentlige i 8 uker, deretter månedlig (1. i måneden) i 12 måneder. Slett eldre.
7. **Bekreft:** logg én linje i Agentlogg (`Kategori = Annet`, `Resultat` = radtelling per tabell).

## Prompts / agents used
- Ingen — ren ETL. (Hører funksjonelt til CRM-/datakvalitetsagenten i mesh-registeret.)

## Side effects
- **Leser:** alle tabeller i Airtable-basen.
- **Skriver:** filer til Google Drive (`/backups/...`) + én Agentlogg-linje. **Ingen** endring i
  kildedata, ingen kundekontakt.

## Failure handling
- Tabell-henting feiler → retry m/ backoff ([resilience](../integrations/resilience.md)); fortsett med
  øvrige tabeller, men marker manifestet som **delvis** og eskalér `Høy` (en ufullstendig backup må
  oppdages).
- Drive-skriv feiler → behold i minne/retry; vedvarende → eskalér `Kritisk` (en backup som ikke lagres
  er ingen backup).
- Tom tabell er gyldig — skriv tom fil + 0 i manifestet (ikke hopp over).

## Gjenoppretting (runbook)
1. Finn nyeste komplette ukemappe i `/backups/airtable/`.
2. Gjenskap tabellstruktur fra [`crm/schema.md`](../crm/schema.md) (skjemaet er «som-bygd»-tegningen).
3. Importer JSON (full troskap) per tabell; gjenopprett lenker sist (Bedrift↔Avtaler, Utfall↔Agentlogg).
4. Maks forventet tap: **én uke** (siden siste eksport). Verifiser radtelling mot manifestet.

## Byggesjekkliste
- [ ] Drive-mappe `/backups/airtable/` opprettet + skrivetilgang (`GCAL_OAUTH`/Drive-cred).
- [ ] Tidsplan søndag 23:00 Europe/Oslo.
- [ ] Paginering + rate-limit-backoff testet mot største tabell (Avtaler).
- [ ] Rotasjonslogikk verifisert (8 uker + 12 måneder).
- [ ] Gjenopprettings-runbook tørrkjørt én gang.
