# Til godkjenning — kveldsteamets leveranser som venter

## v0.9.2 — 17. juli 2026 (levert av Claude på direkte bestilling fra Jonathan)

**Hva:**
1. «⚡ Behandle nå»-knapp på hvert innspill i kommandosentralen: virker med ett trykk uten
   GitHub eller konto — logger en panel-bestilling, viser panelet «varslet» (pulserende
   agenter + statuslinje med når forslaget kommer), og tilstanden huskes.
2. «Svar fra panelet»: panelets forslag publiseres i app/panelsvar.json og vises rett i
   kommandosentralen (network-first i service worker, synlig også uten token — ledelsen
   ser svarene).
3. Første ekte panelsvar levert: Ole Fabians timeregistrering-innspill er besvart
   (lokal timelogg uten AI/konto) og lagt øverst i backloggen for kveldens kjøring.
   Loggført i innspill/behandlet.md.
4. GitHub-knappen («Åpne inbox.md») degradert til liten Jonathan-lenke — OP Bygg-brukere
   trenger den aldri.

**Hvorfor:** Jonathan: knappen må virke med en gang for Ole Fabian og OP Bygg, vise at
agenten jobber, og et forslag må komme.

**Testet:** Full systemtest, 92/92 grønne: statiske kontroller (JSON, versjonssamsvar,
SW-syntaks og precache-filer, alle interne lenker), hele app-flyten på mobil (velkomst,
veiviser, faner, varemottak m/generering, idé-innsending, innspill-portal), testkanal med
godkjenningsstemme, kommandosentralen (Behandle nå-flyt inkl. omlasting, svar fra panelet,
håndtert-toggle, uten-token-visning), rapport/bli-med/ansatte/ledelsen/landing — null
JS-feil, ingen sidelengs scrolling. Skjermbilder tatt.

## v0.9.1 — 17. juli 2026 (levert av Claude på direkte bestilling fra Jonathan)

**Hva:** Kommandosentralen starter aldri tom igjen: STABIL-/TEST-URL og pilotstart ligger nå
som standardverdier i koden (de er ikke hemmeligheter), og adminen gjenkjenner i tillegg sin
egen Netlify-adresse automatisk. Egne lagrede verdier vinner alltid over standardene.
Netlify-tokenet er bevisst fortsatt per nettleser — det er en ekte hemmelighet og skal aldri
ligge i koden. Oppsett-boksen forklarer dette.

**Hvorfor:** Jonathan åpnet kommandosentralen i en ny nettleser og møtte tomme kanalbokser
selv om tokenet var limt inn — localStorage er per nettleser, og oppsettet var borte.

**Testet:** 17/17 Playwright-sjekker (fersk nettleser får alt utfylt, lagrede verdier vinner,
selv-gjenkjenning av vertsnavn, mobil 390×844, null JS-feil).

## v0.9.0 — 17. juli 2026 (levert av Claude på direkte bestilling fra Jonathan)

**Hva:**
1. Kommandosentralen: «Innspill fra appen — live» (Netlify-token i Oppsett, lagres kun i
   nettleseren) med Kopier- og Marker håndtert-knapper + «Åpne inbox.md»-hurtigknapp;
   godkjenningsstemmer vises; «Ekspertpanelet» med 12 agenter, arbeidsvindu-animasjon og
   kjøreplan; «Siste leveranser» fra changelog; auto-oppdatering hvert 60. sekund.
2. Claude gjort valgfritt: veiviseren og ansatte-siden presiserer at varemottak, idéer og
   sjekklister virker uten Claude — kun skriveverktøyene trenger den.
3. Backlog: lokale purring- og byggedagbok-generatorer (uten AI) lagt øverst.

**Hvorfor:** Jonathan ba om synlige innspill, synlige agenter og umiddelbar håndtering —
og at ansatte ikke skal måtte laste ned Claude.

**Testet:** 8/8 sjekker med mocket Netlify-API (innspill-filtrering, stemmer, panel,
leveranser, håndtert-toggle) — ingen JS-feil. NB: ekte token-flyt mot api.netlify.com må
verifiseres av Jonathan i testkanalen (sandkassen når ikke Netlify).

**Godkjenning:** Jonathan + Ole Fabian trykker Godkjenn i testappen → si «merge og
publiser» til Claude.
