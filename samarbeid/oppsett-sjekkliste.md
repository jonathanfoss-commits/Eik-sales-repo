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

---

## Påminnelse til slutt

- **Ny sentralkode** deles kun muntlig/SMS til Ole Fabian — aldri skriftlig i
  repo eller e-post.
- Publisering bestiller du med én setning til Claude: «publiser» (etter to
  nøkler) eller «publiser som admin» (logges åpent). Du merger aldri selv.
