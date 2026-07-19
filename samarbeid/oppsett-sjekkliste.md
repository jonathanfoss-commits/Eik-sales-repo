# Oppsett-sjekklisten — det bare Jonathan kan gjøre (klikk for klikk)

*Alle punktene er engangsjobber. Alt annet (publisering, versjonsvakt, testing,
seeding) gjør kveldsteamet. Variabelnavnene under er verifisert mot koden —
kopiér dem nøyaktig.*

---

## Steg 1 — PILOTLOGG_TOKEN på STABIL-siten *(2 min)*

**Hva det gjør:** Kommandosentralen på STABIL henter pilotlogg-feeden via
serverfunksjonen i stedet for at du taster token hver gang.

1. Logg inn på **app.netlify.com**.
2. Åpne **TEST-siten** (den med «test» i navnet) → **Site configuration** →
   **Environment variables** → finn `PILOTLOGG_TOKEN` → trykk på den →
   **kopiér verdien** (øye-ikonet viser den).
3. Gå til **STABIL-siten** → **Site configuration** → **Environment variables**
   → **Add a variable** → Key: `PILOTLOGG_TOKEN` → Value: lim inn → **Create**.
4. Samme site → **Deploys** → **Trigger deploy** → **Deploy site**.

**Sjekk:** Åpne kommandosentralen på STABIL — feeden laster uten å spørre om token.

---

## Steg 2 — ANTHROPIC_API_KEY på begge Netlify-siter *(3 min)*

**Hva det gjør:** Skrur på Skrivemotoren (tilbud, endringsmeldinger, purringer
fra diktering).

1. Gå til **console.anthropic.com** → logg inn → **API keys** →
   **Create key** → navn f.eks. `laerling-netlify` → **kopiér nøkkelen NÅ**
   (den vises bare én gang).
2. Anbefalt samtidig: **Settings → Limits** → sett en månedsgrense
   (f.eks. 50 USD) så en feil aldri kan bli dyr.
3. Netlify → **TEST-siten** → **Site configuration** → **Environment variables**
   → **Add a variable** → Key: `ANTHROPIC_API_KEY` → Value: lim inn → **Create**.
4. Gjenta punkt 3 på **STABIL-siten** (samme nøkkel er greit).
5. **Trigger deploy** på begge siter (Deploys → Trigger deploy).

**Sjekk:** Diktér noe i Skrivemotoren på TEST — du får ferdig tekst, ikke
«ikke koblet til»-beskjeden.

---

## Steg 3 — Render-kontoen (plattformkjernen ut i verden) *(5–10 min)*

**Hva det gjør:** Setter opp hele plattformen (TEST + STABIL med hver sin
database) fra `kjerne/render.yaml` — Blueprint gjør alt.

1. Gå til **render.com** → **Sign up** med GitHub-kontoen din → godkjenn
   tilgang til repoet `jonathanfoss-commits/Eik-sales-repo`.
2. Dashboard → **New +** → **Blueprint** → velg repoet → Render finner
   `kjerne/render.yaml` automatisk → **Apply**.
3. Render spør nå om de hemmelige verdiene (de med `sync: false`). Fyll inn:
   - `PLATTFORM_APP_PASSORD` — finn på et langt tilfeldig passord (lagre i
     passordhåndtereren din)
   - `PLATTFORM_AUTH_PASSORD` — et annet langt tilfeldig passord
   - `ANTHROPIC_API_KEY` — samme nøkkel som i steg 2 (eller en egen)
   - (spørres per tjeneste: `laerling` og `laerling-test` — samme verdier er OK)
4. Vent til begge tjenestene bygger grønt (~5 min).
5. **Si fra til Claude at Render er oppe** — da verifiserer jeg helse-endepunktet,
   at migrasjonene kjørte og at tenantene er seedet, og følger
   `kjerne/docs/cutover-plan.md` for resten.

**Sjekk:** `https://laerling-test.onrender.com/api/helse` svarer `{"ok":true}`.

---

## Steg 4 — Branch protection på `main` *(2 min)*

**Hva det gjør:** Ingenting når STABIL uten at publiseringsvakta er grønn —
selv ikke ved uhell.

1. GitHub → repoet **Eik-sales-repo** → **Settings** (fanen øverst) →
   **Branches** (venstremeny).
2. **Add branch protection rule** (heter «Add rule» eller ligger under
   Rules → Rulesets → New branch ruleset i nyere UI).
3. Branch name pattern: `main`.
4. Huk av **Require status checks to pass before merging** → søk opp og velg
   **`triade`** (publiseringsvaktas jobb — dukker opp i lista etter at vakta
   har kjørt minst én gang, som den alt har).
5. La resten stå som standard → **Create/Save**.

**Sjekk:** Settings → Branches viser regelen på `main`.

---

## Steg 5 — E-postleverandør + DPA («Glemt passord?») *(15 min, når det passer)*

**Hva det gjør:** Selvbetjent passord-nullstilling på e-post i plattformen.
Frem til da er reserven i drift: ledelsen lager kode i Sentral.

1. Velg leverandør — anbefalt **Resend** (enkel, EU-region mulig) eller
   **Postmark**. Opprett konto.
2. Verifiser domenet du vil sende fra (leverandøren viser DNS-postene du må
   legge inn hos domeneleverandøren din).
3. Signer **DPA** (Data Processing Agreement): hos Resend under
   Settings → Legal/DPA; hos Postmark under Account → DPA. Velg EU-datalagring
   der det tilbys.
4. Lag en API-nøkkel hos leverandøren, og gi Claude/legg inn i Render
   (Environment → begge tjenestene) disse tre — nøyaktige navn:
   - `EPOST_API_URL` — f.eks. `https://api.resend.com/emails`
   - `EPOST_API_NOKKEL` — API-nøkkelen (Bearer)
   - `EPOST_FRA` — f.eks. `Lærling <ikke-svar@dittdomene.no>`

**Sjekk:** «Glemt passord?» i plattform-appen sender faktisk e-post med kode.

---

## Steg 6 (valgfritt, men anbefalt) — gi Claude nøkler så steg 1–3 aldri skjer igjen

**Hva det gjør:** Med disse i Claude-miljøet kan kveldsteamet selv sette
miljøvariabler, trigge deploys og verifisere — listen din krymper til
leverandøravtaler.

1. **Netlify:** app.netlify.com → avataren din → **User settings** →
   **Applications** → **Personal access tokens** → **New access token** →
   navn `claude-kveldsteam` → kopiér.
2. **Render:** Dashboard → **Account settings** → **API Keys** →
   **Create API key** → kopiér.
3. Legg dem inn i Claude Code-miljøet: **claude.ai/code** → **Environments** →
   velg miljøet for dette repoet → **Environment variables** →
   `NETLIFY_AUTH_TOKEN` = Netlify-tokenet, `RENDER_API_KEY` = Render-nøkkelen.
4. Si fra i neste økt — da tester jeg begge og overtar driftspunktene.

### Arbeidsordre for Claude-økten som ser nøklene («nøklene er inne»)

*Status 19. juli 2026: Jonathan har lagt inn alle tre nøklene + Netlify-domenene
i miljøet. Publisert: pilot v0.17.1 ligger på `main` og STABIL-siten
(`op-bygg-laerling-app`, production branch = `main`). TEST = `op-bygg-laerling-app-test`
(bygger fra `kveldsteam-forslag`). PILOTLOGG_TOKEN ligger alt på begge siter.*

1. **Verifiser nøklene skånsomt (kun les-kall):**
   `NETLIFY_AUTH_TOKEN` → `GET https://api.netlify.com/api/v1/sites` (Bearer);
   `RENDER_API_KEY` → `GET https://api.render.com/v1/services` (Bearer);
   `KUNDE_ANTHROPIC_KEY` → `GET https://api.anthropic.com/v1/models` (x-api-key).
   ALDRI skriv nøkkelverdier til logg/terminal/repo.
2. **Skrivemotoren på Netlify:** sett miljøvariabelen `ANTHROPIC_API_KEY` =
   verdien av `KUNDE_ANTHROPIC_KEY` på BEGGE sitene (`op-bygg-laerling-app` og
   `op-bygg-laerling-app-test`) via API-et, trigg deploy på begge, og verifiser
   etterpå at `/versjon.json` svarer riktig versjon på begge.
3. **Render:** opprett tjenestene fra `kjerne/render.yaml` (Blueprint via API,
   eller tjenester + databaser enkeltvis hvis Blueprint-API-et ikke strekker til).
   Generer sterke `PLATTFORM_APP_PASSORD`/`PLATTFORM_AUTH_PASSORD` (lagres KUN
   som Render-miljøvariabler — gi dem aldri til noen, heller ikke i chat),
   sett `ANTHROPIC_API_KEY` fra `KUNDE_ANTHROPIC_KEY`, vent på grønt bygg,
   verifiser `GET /api/helse`, kjør/verifiser migrasjoner og tenant-seeding
   (`laerling` + `malermester-demo`), og følg `kjerne/docs/cutover-plan.md`.
4. **Rapportér** til Jonathan med kvitteringer (statuskoder/versjoner — aldri
   hemmeligheter), og oppdater denne filen: kryss av det som nå er automatisert.

### Status etter økten 19. juli 2026 (kveldsteamet)

- [x] **Punkt 1 — nøklene verifisert:** alle tre svarte `200 OK` på les-kallene
  (`NETLIFY_AUTH_TOKEN` mot Netlify sites, `RENDER_API_KEY` mot Render services,
  `KUNDE_ANTHROPIC_KEY` mot Anthropic models). Begge Netlify-sitene funnet
  (STABIL bygger fra `main`, TEST fra `kveldsteam-forslag`), `PILOTLOGG_TOKEN`
  bekreftet på begge, og `/versjon.json` svarer `0.17.1` på begge.
  Render-kontoen har kun Walan-tjenestene fra før — ingen Lærling-tjenester ennå.
- [x] **Punkt 2 — Skrivemotoren på Netlify (fullført 19. juli, andre økt):**
  `ANTHROPIC_API_KEY` satt på begge sitene via API (tillatelsesreglene i
  `.claude/settings.json` løste sperren), deploy trigget og ferdig,
  `/versjon.json` svarer `0.17.1` på begge. Verifisert i drift: en
  test-diktering på TEST ga ferdig purringstekst tilbake, og STABIL svarer
  `400 Ukjent oppgavetype` (ikke `503`) — nøkkelen er aktiv der også.
- [x] **Punkt 3 — Render-plattformen (fullført 19. juli, andre økt):**
  databasene `laerling-db` og `laerling-test-db` (basic-256mb, Frankfurt,
  Postgres 16) og tjenestene `laerling` (autodeploy av) og `laerling-test`
  (autodeploy på) opprettet via API med genererte passord (kun lagret som
  Render-miljøvariabler). Første deploy avdekket en ekte feil:
  `FORCE ROW LEVEL SECURITY` blokkerte tenant-seedingen (lokalt skjult fordi
  docker-eieren er superbruker) — fikset i migrasjon
  `kjerne/server/migrations/008_eier_uten_force.sql` (tenant-isolasjonen er
  uendret; appen kjører fortsatt som RLS-bundne roller). Etterpå: begge bygg
  grønne, `GET /api/helse` = `{"ok":true}` på begge, migrasjoner 001–008
  kjørt, tenantene «OP Bygg AS» seedet på begge og «Malermester Demo AS» på
  TEST, og API-et avviser uautentiserte kall med `401`.
  Nullstillingskodene til de nye brukerne står i Render-oppstartsloggen
  (Dashboard → tjenesten → Logs) — deles utenfor systemet, som designet.
- [x] **Testbevis (samme økt):** hele CI-løpet kjørt lokalt mot Postgres 16
  med migrasjon 008: 30/30 servertester grønne (inkl. RLS-isolasjonstestene)
  og 27/27 e2e-bevis i Chromium (tenant-isolasjon, roller, LIVE),
  hemmelighetsskann rent. Render-backup: første døgnbackup finnes ikke ennå
  (databasene er nye) — kveldsteamet sjekker automatisk i morgen og melder
  fra; «gjenopprettingsprøve mot test-databasen» står igjen etter det.
- [x] **Alt over er fullført og verifisert 19. juli:** RLS-fiksen og
  CI-fellen-fiksen er merget til `main` (PR #16 og #18), begge Render-tjenestene
  bygger fra `main`, branch protection («main-vern»: triade + tester) er aktiv,
  og hele kjeden er kontrollert ende til ende (nøkler 200, begge Netlify-siter
  v0.17.1 med fungerende Skrivemotor, begge Render-tjenester friske med
  auth-vern, CI grønn på main).
- **Besluttet 19. juli:** Steg 5 (e-postleverandør + DPA) er UTSATT til kunde #2
  eller reelt behov — Sentral-kode-reserven dekker piloten. Steg 6 sin
  admin-nøkkel droppes (individuell Anthropic-konto har ikke Admin API);
  kostnadsvakten minner i stedet om månedlig Usage/Limits-titt.
- **Automatisert:** daglig driftsvakt, ukentlig mandagsrapport og månedlig
  kostnadssjekk kjører som rutiner (alle feiler høyt, aldri stille), og
  gjenopprettingsprøven av backup kjøres automatisk 20. juli med Jonathans
  forhåndsgodkjenning.

---

## Påminnelse til slutt

- **Ny sentralkode** deles kun muntlig/SMS til Ole Fabian — aldri skriftlig i
  repo eller e-post.
- Publisering bestiller du med én setning til Claude: «publiser» (etter to
  nøkler) eller «publiser som admin» (logges åpent). Du merger aldri selv.
