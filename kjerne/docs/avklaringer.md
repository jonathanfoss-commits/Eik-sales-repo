# Avklaringer og beslutninger — plattformkjernen

*18. juli 2026 · Alle beslutninger tatt autonomt under ULTRACODE-oppdraget dokumenteres
her med alternativer og begrunnelse. Beslutninger merket **[JONATHAN]** er svar gitt av
Jonathan før kjøringen startet.*

## Rammene (fra oppdraget)

- Kjernen er bedrifts-agnostisk; alt kundespesifikt bor i tenant-konfig. Moduler slås
  på per kunde. Én delt deployering, multi-tenant Postgres med RLS.
- Piloten på Netlify er fredet. Alt nytt bor i `kjerne/`. Cutover skjer aldri autonomt.
- Sikkerhet: enkel, men reell — kjedelig og velprøvd, ingenting eksotisk.

## Beslutninger fra Jonathan (før kjøring) **[JONATHAN]**

1. **Timeføring = PRIVAT + ledelse:** den ansatte ser egne timer; pilotleder og admin
   ser alle. Kollegaer ser ikke hverandres timer.
2. **Pilotleder-rollen ser alt SENSITIVT unntatt kostnader:** AI-kost/økonomi er kun
   for admin (Jonathan). Godkjenninger og varsellogger: også pilotleder.
3. **Prioritet: begge deler** — full paritet OG plattformbevis; ingen nedskjæringer.
4. **AI-månedsbudsjett: 500 kr per organisasjon** (miljøvariabel, kan endres).

## D1: Kjerne / modul / tenant-grensesnittet

**Beslutning:** Tre lag.
- **Kjernen** (`kjerne/server/` + `kjerne/app/js/{api,app}.js` + `kjerne/app/stil.css`):
  auth, sesjoner, RLS-database, AI-gateway, hendelsesbuss/SSE, offline-kø, modul-lasting,
  temasystem. Null kundenavn, null bransjelogikk.
- **Moduler** (`kjerne/server/api/*.js` + `kjerne/app/js/moduler/*.js`): én funksjon per
  fil-par (timer, dagbok, varsler, innspill, skrivemotor, sentral, innflytting). En modul
  vet ikke hvilke andre moduler som finnes.
- **Tenant-konfig** (rad i `organisasjoner.konfig` jsonb, seedet fra
  `kjerne/tenants/<slug>.js`): appnavn, temafarger, modulliste, AI-evner (instrukser +
  modellvalg + firmaprofil). Frontenden får konfigurasjonen fra `/api/meg` etter
  innlogging og setter CSS-variabler + laster kun aktiverte moduler.

*Alternativ vurdert:* konfig som filer på disk per kunde (ikke i databasen). Valgt bort:
databasen er sannhetskilden i drift, og «ny kunde uten deploy» krever det. Seed-skriptet
(`kjerne/server/verktoy/ny-tenant.js`) leser tenants-filen og skriver til databasen —
filene er altså oppskrift, databasen er fasit.

*Motvekt mot overabstraksjon:* ingen tenant-adminflate bygges. Kunde nr. 2 opprettes med
skript av oss. Adminflate for tenants er en fase-2-beslutning når kunde nr. 3 finnes.

## D2: Entitetene fra dagens app — nivå og synk

| Entitet (localStorage i dag) | Nivå | Synk-strategi |
|---|---|---|
| Timeføring (`lager.timer`) | **PRIVAT+LEDELSE** [JONATHAN] | Server-hjem, offline-kø |
| Byggedagbok/dagsnotater | **DELT** | Server-hjem, live |
| Varemottak/avviksmeldinger | **DELT** | Server-hjem, live |
| Innspill (💡) | **DELT** (innhold aktivt sendt) | Server-hjem, live |
| Pilotlogg (hendelsestyper) | **DELT** (aldri innhold) | Server-hjem |
| Godkjenningsstemmer | **DELT** lesing; skriving autentisert | Server-hjem (audit-rader) |
| AI-kost/økonomi | **SENSITIVT (kun admin)** [JONATHAN] | Kun server |
| Veiviser-fremdrift, brukervalg | **PRIVAT** | Server-hjem (lav prioritet) |
| Skrivemotor-utkast (tekst) | **PRIVAT** — lagres IKKE på server | Kun lokalt; sendes kun til AI ved knappetrykk |
| Bilder (bildeknagg-prototyp) | **PRIVAT** | Forblir lokale i v1 (dokumentert begrensning) |

Personvernregelen består ordrett: automatisk logging lagrer KUN hendelsestyper — aldri
innhold; unntak kun for innspill brukeren aktivt sender.

## D3: Sanntidsdesign

- **SSE** (`GET /api/hendelser`) per innlogget bruker; serveren holder én in-process
  hendelsesbuss per org (Node EventEmitter). Hendelser er alltid bare
  `{modul, type, radId, versjon, av, tid}` — aldri innholdet; klienten henter selv
  raden via vanlig API (som håndhever RLS/nivå). Dermed kan SSE-laget aldri lekke data
  rollen ikke skal se, selv ved feil i filtreringen — dobbelt vern: hendelser
  rollefiltreres OG innhold hentes bak RLS.
- **Polling-reserve:** klienten faller til 30 s-polling hvis SSE feiler to ganger.
- **Skaleringssti (dokumentert, ikke bygget):** ved flere serverinstanser byttes
  EventEmitter mot Postgres LISTEN/NOTIFY — samme buss-grensesnitt.
- **Konfliktregel:** hver rad har `versjon` (heltall) + `klient_id` (idempotens).
  Skriving med foreldet versjon vinner IKKE — serveren svarer 409 med gjeldende rad,
  klienten viser «endret av Ola imens» og lar brukeren velge. Offline-køen replayes
  i rekkefølge med klient-id, så dobbeltsending er umulig.

## D4: Sikkerhetsbaselinen (sjekkliste — verifiseres i fase 5)

- [x] TLS (Render håndterer), HSTS-header fra appen
- [x] scrypt-passord, timing-safe sammenlikning, hashede sesjonstoken, HttpOnly/SameSite=Lax-cookies
- [x] Innrullering kun med invitasjonskode satt av admin — ingen selvregistrering
- [x] FORCE RLS på alle tabeller + negative tester mellom to ekte tenanter
- [x] Rollenivå i RLS-policyer (timer, sensitivt) — aldri kun i klienten
- [x] Hemmeligheter kun i miljøvariabler; `.env.example`; hemmelighetsskann før commit
- [x] EU/Frankfurt-region; kryptering hvilende (Render Postgres standard)
- [x] Daglig backup (Render) + dokumentert prøve-gjenoppretting
- [x] Rate-limiting på innlogging og AI-endepunkter
- [x] Revisjonslogg på SENSITIVT-tilgang (hendelsestyper, aldri innhold)
- [x] Sletterett som endepunkt (bruker og org)
- [x] TOTP kun for admin-rollen (node:crypto, RFC 6238 — ingen avhengigheter)
- [x] CSP-header, ingen innerHTML med brukerdata (sentral `esc()`), eksplisitt CORS
- [ ] Feltnivå-kryptering, passkeys: BEVISST IKKE bygget — dokumentert oppgraderingssti

## D5: Suksesskriterier

1. Kunde nr. 2 («Malermester Demo AS») opprettes med ett skript på under én time,
   uten kodeendring utenfor tenants-filen — bevist i fase 3.
2. Live-beviset: to samtidige nettlesere, A fører dagboklinje, B ser den uten omlasting.
3. Isolasjonsbeviset: OP Bygg-bruker ser aldri Malermester-data (og omvendt), ansatt
   ser aldri SENSITIVT — negativt testet i UI og direkte mot API/RLS.
4. Hele pilotflyten grønn i Chromium 390×844 uten ufangede JS-feil, med skjermbilder.
5. AI-kjeden verifisert mot mock: ruting (opus-4-8 for skrivearbeid, Haiku for småjobber),
   caching-markør, kostnadslogg i øre, budsjettsperre ved 500 kr, 503-reserve uten nøkkel.
6. Innflyttingen flytter ekte pilotdata tapsfritt med kvittering.
7. Ingen endring i `app/`/`netlify/` utover fredningsunntaket `app/eksport.html`.

## D6: Modellruting (overstyrer Anleggs standard)

Skrivearbeid (tilbud, endringsmelding, purring, referat) = `claude-opus-4-8` — norsk
fagtekst er produktet; kvaliteten nedgraderes aldri i det stille. Haiku 4.5 kun for
billige småjobber (idé-oppsummering i sentralen). Ruting ligger per evne i
tenant-konfigen; prisene ligger i gatewayens pristabell (opus-4-8: $5/$25 per MTok).

## D7: Prøverommet

**Beslutning:** Prøverommet forblir i Netlify-piloten (det ER testkanalens natur) og
flyttes ikke i denne runden. Vinnerne derfra bygges som moduler på kjernen etter
godkjenning. Dokumentert i cutover-planen.

## Løpende beslutninger under byggingen

- **D8 — DB-roller heter `plattform_app`/`plattform_auth`** (ikke walan_*): kjernen er
  produktet; rollenavn skal ikke bære kundenavn.
- **D9 — Anthropic-SDK beholdes som eneste npm-avhengighet** (pluss `pg`): samme
  avveining som Anlegg tok; færre avhengigheter = mindre angrepsflate.
- **D10 — Sesjonscookie heter `plattform_sesjon`**, Secure settes når `NODE_ENV=production`
  (lokal utvikling på http trenger den av).
- **D11 — Ingen inline-script:** CSP-en (`script-src 'self'`) blokkerte appens eget
  oppstartsscript under e2e — riktig svar var å flytte oppstarten til DOMContentLoaded
  i app.js, ikke å myke opp CSP-en. Regel videre: CSP-en endres aldri for bekvemmelighet.
- **D12 — Budsjettsperre-funnet (fra integrasjonstesten):** sjekkKvote leste ai_logg
  gjennom brukerens RLS — ansatte så alltid 0 øre, sperren virket ikke. Løsning:
  SECURITY DEFINER-funksjonen `ai_kost_denne_mnd()` (migrasjon 003) — gir SUMMEN for
  egen org uten å åpne radene. Alternativ vurdert (åpne SELECT for alle i org): forkastet,
  ville lekket kostnadsdetaljer til ansatte.
- **D13 — Godkjenningsstemmer kan ombestemmes** (ON CONFLICT DO UPDATE på egen rad) —
  krevde egen UPDATE-policy (migrasjon 003). Én stemme per bruker per versjon består.
- **D14 — AI-kall skjer ikke-strømmende i v1:** på Render (persistent server) er det
  ingen 10-sekunders funksjonsgrense, så strømming er UX-forbedring, ikke nødvendighet.
  Står på forbedringslisten.
- **D15 — Engangspassord fra ny-tenant-verktøyet:** passordbytte-UI er ikke bygget i v1;
  byttes av Jonathan via verktøy/psql inntil videre. På forbedringslisten før cutover.

## Kodegjennomgangens funn (to adversarielle agenter) — rettet og akseptert

**RETTET:**
- GDPR-slettehullet: admin-sletting av en annen bruker traff 0 timerader (RLS-eierkrav
  gjorde slettingen til stille no-op) → SECURITY DEFINER `slett_brukerdata()`
  (migrasjon 004) med ærlig kvittering + regresjonstest.
- Rate-demperen var global bak Renders proxy (samme socket-IP for alle — 10 feilforsøk
  ville låst hele OP Bygg ute) → klient-IP fra X-Forwarded-For + egen grense per e-post.
- Kryss-tenant sesjonssletting i personvern-flyten → org-scopet.
- Budsjettsperren og godkjennings-UPDATE (D12/D13, funnet av egne tester før agentene).

**AKSEPTERT/BEVISST (med begrunnelse):**
- `migrate.js` ALTER ROLE med interpolert passord: rollen er hardkodet whitelist,
  passordet er admin-satt miljøvariabel, escaping korrekt — dynamisk DDL kan ikke
  parametriseres. Står.
- TOTP håndheves ikke teknisk ved opprettelse — aktivering av admin-TOTP står som
  eksplisitt punkt i cutover-sjekklisten (før reelle data).
- `scryptSync` blokkerer event-loopen per innlogging: akseptabelt på pilotens volum
  (11 brukere); async-scrypt står på forbedringslisten før kunde nr. 3.
