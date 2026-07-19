# Plattformkjernen

Multi-tenant kjerne for AI-medarbeidere til små byggefirmaer. «Lærling»
(OP Bygg AS) er første tenant; «Malermester Demo» beviser at neste kunde er
konfig, ikke kode.

- **Dokumentasjon:** `docs/leveranse.md` (hva og hvorfor), `docs/avklaringer.md`
  (alle beslutninger), `docs/cutover-plan.md` (veien fra Netlify-piloten),
  `docs/ny-kunde.md` (ny kunde på under én time)
- **Kjøre lokalt:** Postgres opp → `cp .env.example .env` → `npm install` →
  `npm run migrate` → `node server/verktoy/ny-tenant.js laerling` → `npm start`
- **Tester:** `npm test` (krever Postgres; RLS-/API-testene hopper ellers over seg selv)
- **Deploy:** `render.yaml` (Blueprint — to tjenester, to databaser, EU/Frankfurt)
  eller `docker-compose.yml` («egen boks»)

Huskeregler: FORCE RLS på hver ny tabell. Datanivå (DELT/PRIVAT/SENSITIVT)
besluttes FØR tabellen lages. Hendelser på bussen bærer aldri innhold.
Versjonstriaden (app.js / versjon.json / sw.js) håndheves av tests/versjon.test.js.
CSP-en mykes aldri opp for bekvemmelighet.
