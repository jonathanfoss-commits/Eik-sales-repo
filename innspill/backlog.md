# Backlog — forbedringer kveldsteamet kan ta når inbox er tom

Prioritert liste. Teamet tar ØVERSTE punkt, aldri flere enn ett per kveld fra backloggen.

1. **Timeregistrering (brukerinnspill 17. juli — hastebehandlet, se app/panelsvar.json):**
   enkel timelogg i appen — velg prosjekt, start/stopp eller skriv timer rett inn, lagres
   kun lokalt (IndexedDB/localStorage), ukesoppsummering med Kopier-knapp rett inn i
   ukesrapport/timeliste. Uten AI, uten konto. Brukerinnspill går alltid foran backloggen.
2. Lokal purring-generator (som varemottaket): skjema (til hvem, hva det gjelder, frist,
   konsekvens) → ferdig purremelding generert i appen, uten AI — Kopier + Åpne i Mail.
3. Lokal byggedagbok-generator: skjema (mannskap, utført, vær, leveranser, hindringer) →
   strukturert dagboknotat lagret lokalt (IndexedDB) med eksport — uten AI.
4. Varemottak-historikk: lagre avviksmeldinger lokalt (IndexedDB) med status
   (meldt/rettet/kreditert) og påminnelse hvis leverandør ikke har svart innen fristen.
5. Byggedagbok-historikk: lagre dagboknotater lokalt (IndexedDB) med enkel liste-visning
   og eksport-knapp (del/e-post) — lokal-først, ingen server.
6. «Dagens fokus» på I dag-fanen: vis ett smart tips per dag basert på ukedag
   (fredag: «husk ukesrapporten», mandag: «planlegg befaringer»).
7. Prompt-teller: vis i promptbiblioteket hvilke prompter som er mest brukt (lokalt).
8. Mørk/lys-modus-bryter (behold mørk som standard).
9. Forbedre tom-tilstanden med ukens tall («I dag: 4 oppgaver unnagjort»).
