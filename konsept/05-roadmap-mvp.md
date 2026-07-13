# 05 — Roadmap og MVP (12 uker til betalende kunder)

## Prinsipp

Bygg minst mulig teknologi før verdien er bevist. Alt som kan gjøres manuelt bak kulissene i pilot, gjøres manuelt («concierge-MVP»). Automatiser i den rekkefølgen manuelt arbeid gjør mest vondt.

## Uke 1–2: Fundament

- [ ] Velg 2 pilot-vertikaler (anbefalt: håndverk + klinikk/salong).
- [ ] Definér 4 verktøysmaler per vertikal (de med høyest timer-spart-potensial).
- [ ] Sett opp kjerne: Postgres + pgvector, Claude API, enkel web-app med Magic Link-innlogging.
- [ ] Databehandleravtale-mal og personvernerklæring (jurist-time).

## Uke 3–4: Oppdageren v1

- [ ] Nettside-crawl + Brønnøysund-oppslag → utkast til bedriftsprofil.
- [ ] Intervju-agent (samtale på norsk, 15–20 min) som fyller hullene.
- [ ] **Mulighetsrapport-generator** — den 72-timers wow-leveransen. Dette er MVP-ens viktigste artefakt.

## Uke 5–6: Første verktøy i drift

- [ ] Gmail/Outlook-integrasjon (les + utkast, aldri auto-send i v1).
- [ ] Verktøy #1 per vertikal live: tilbudsgenerator (håndverk), booking-svar (klinikk).
- [ ] Godkjenningsflyt på e-post: Lærling sender utkast, kunden svarer «ok» eller redigerer.

## Uke 7–8: Pilot-start

- [ ] 10 pilotkunder onboardet (fra Eiks nettverk).
- [ ] Læringslogg: hver korrigering lagres og brukes i neste utkast.
- [ ] Ukesrapport v1 (kan være halvmanuell).

## Uke 9–10: Driftsmotor

- [ ] Kø-basert kjøring med revisjonslogg.
- [ ] Verktøy #2–3 aktiveres per pilotkunde basert på mulighetsrapporten.
- [ ] Kvalitetsscore + automatisk varsling ved avvik.

## Uke 11–12: Kommersialisering

- [ ] Betaling (Stripe), prisnivåene fra dok. 02.
- [ ] Konvertér piloter til betalende (mål: ≥7/10).
- [ ] Landingsside live med pilot-case og tall.
- [ ] Beslutningspunkt: hvilke vertikaler og maler skaleres i fase 2?

## Hva som bevisst IKKE er med i MVP

- Full-auto-modus (alt går via godkjenning — bygger tillit og reduserer risiko).
- White label og partner-portal.
- Egendefinerte verktøy utenfor malbiblioteket.
- Mobilapp (e-post/web er nok — målgruppen lever i innboksen).

## Risikoer og mottrekk

| Risiko | Mottrekk |
|---|---|
| Undersøkelsen finner for lite → svak mulighetsrapport | Intervju-agenten er obligatorisk; rapporten kvalitetssjekkes av menneske i pilot |
| LLM-kostnad spiser margin | Modell-ruting + caching fra dag 1; budsjettak per kunde |
| Kunden godkjenner aldri → ingen opplevd verdi | Aktiveringsmål (verktøy i drift ≤7 dager) med menneskelig oppfølging |
| Integrasjonsbredde blir for stor | Kun Gmail/Outlook + ett fagsystem per vertikal i MVP |
| Tillitsbrist ved én synlig feil | Godkjenningsporter som standard; feil når aldri kunden av kunden selv |
