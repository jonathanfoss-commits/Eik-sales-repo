# Til godkjenning — kveldsteamets leveranser som venter

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
