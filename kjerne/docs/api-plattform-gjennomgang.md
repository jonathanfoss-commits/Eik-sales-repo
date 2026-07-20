# API-plattform-gjennomgang — kjernen som grunnlag for Walan Maskin

*20. juli 2026 · Rolle: API Platform Engineer · Bestilt av Jonathan («gjennomgå Walan Maskin»).*

## Omfang og premiss

Walan Maskin har ingen egen kodebase i repoet: Anlegg-arkitekturen fra grenen
`claude/walan-maskin-app-s5lu93` ble generalisert til plattformkjernen (`kjerne/`),
og grenen er siden slettet på origin. Denne gjennomgangen dekker derfor det
Walan Maskin faktisk skal kjøre på: `kjerne/server/` (HTTP, auth, RLS, AI-gateway,
SSE, modul-API-ene), migrasjonene og `render.yaml` — lest i sin helhet (~1 900
linjer), vurdert mot planene for Walan i
`analyse/saas-analyse-op-bygg-og-walan-maskin.md` (Business-planen lover
«Telematikk-integrasjon … API»; eksportambisjon engelsk/svensk).

## Helhetsvurdering

Kjernen er en uvanlig solid liten plattform for stadiet den er på: FORCE RLS på
alle tabeller med transaksjonslokal kontekst (`db.js`), datanivåene håndhevet i
databasen, hashede sesjonstoken, idempotens via `klient_id`-indekser,
versjonsvern med 409, AI bak én gateway med budsjettsperre og kostlogg uten
innhold, og en ærlig dokumentert begrensningsliste. De tidligere adversarielle
gjennomgangene har tettet de fleste klassiske hullene. Ingen funn her er
pilotblokkerende. Funnene under er sortert etter det som faktisk står mellom
dagens kjerne og «plattform for kunde nr. 2+ med integrasjoner» — som er
Walan Maskins virkelighet.

## Strategiske gap (før Walan Maskin kan selges som planlagt)

### S1 — Det finnes ingen programmatisk API-flate, men planene selger én
Auth er utelukkende sesjonscookie (`plattform_sesjon`, SameSite=Lax) satt via
innloggingsskjemaet. Det er riktig for PWA-en, men Business-planene for både
OP Bygg og Walan lover «API-tilgang», og Walans differensiator er
telematikk-integrasjon (Volvo/Cat/Komatsu) + regnskapsintegrasjon. Ingenting av
det kan bygges på cookie-auth: en maskinintegrasjon trenger API-nøkler eller
tokens per tenant, med egne scopes og egen rate-grense. Anbefaling: definer
kontrakten nå (f.eks. `Authorization: Bearer <tenant-nøkkel>`-sti ved siden av
cookie-stien, nøkler hashet i egen tabell à la sesjoner), men bygg den først
når første integrasjonskunde finnes — poenget er å ikke selge Business-planen
før stien er prislagt i tid.

### S2 — AI-kvoten er global, men prismodellen er per plan
`sjekkKvote` (`ai/gateway.js:69`) måler mot `config.aiMndBudsjettOre` — én
miljøvariabel for hele deployeringen. Prismodellen selger differensierte kvoter
(300/1 500/5 000 samtaler per plan), og Walan-planene har egne trinn. Kvoten
hører hjemme i tenant-konfigen (`organisasjoner.konfig`), med miljøvariabelen
som tak/reserve. Liten endring nå, vond å ettermontere når kunde nr. 2 og 3
har ulike planer på samme instans.

### S3 — All brukervendt tekst er hardkodet norsk i serveren
Feilmeldinger, purretekstene (`api/faktura.js:12`), bevisdokumentet og
ukesrapport-instruksene ligger som norske strenger i kjernen. For Lærling er
det riktig. Men analysen posisjonerer Walan for eksport (engelsk/svensk UI)
fordi hjemmemarkedet er lite — og da er serverstrenger i kjernen feil sted.
Ingen handling nå; men regelen «ny brukervendt streng i kjernen skal kunne
overstyres fra tenant-konfig» bør gjelde fra neste modul, så eksportkostnaden
ikke vokser for hver leveranse.

### S4 — Ingen API-kontrakt som artefakt
Rutene finnes kun som `ruter.add(...)`-kall spredt over tolv moduler. Uten en
maskinlesbar kontrakt (OpenAPI eller bare en generert rutetabell i docs/) blir
klient, tester og fremtidige integrasjoner håndsynkronisert. Lavthengende:
et lite skript som itererer `ruter.ruter` og skriver metode + sti + modul til
`docs/api-ruter.md` i CI — null avhengigheter, alltid à jour.

## Funn i koden (prioritert)

### MIDDELS

1. **Klient-IP-en fra `X-Forwarded-For` er klientstyrt** (`index.js:47–50`).
   Koden tar *første* ledd i XFF. Bak Render **appender** proxyen klientens
   ekte IP — en angriper som selv sender `X-Forwarded-For: 1.2.3.4` får det
   leddet lest som sin IP og kan rulle gjennom vilkårlige «IP-er». Dermed er
   IP-grensene på login/registrer/glemt/nullstill omgåelige; per-e-post-grensen
   (10/15 min) er reell beskyttelse. Riktig grep bak én kjent proxy: ta *siste*
   ledd (leddet proxyen selv la på), ikke første.
2. **Opprydningen i rate-demperen nullstiller alle tellere** (`index.js:41`).
   `teller.clear()` når kartet passerer 10 000 nøkler sletter også aktive
   per-e-post-tellere — og sammen med funn 1 kan en angriper *fylle* kartet med
   spoofede nøkler og få brute-force-telleren nullstilt hvert 10. minutt.
   Billig fiks: rydd per nøkkel (fjern nøkler uten treff i vinduet) i stedet
   for `clear()`, og la per-e-post-nøklene overleve.
3. **Passordbytte dreper ikke andre sesjoner** (`auth.js:154–164`).
   `fullforNullstilling` sletter alle sesjoner (riktig), men `byttPassord` lar
   dem leve. Scenarioet passordbytte skal løse — «noen andre har passordet
   mitt» — etterlater da angriperens sesjon gyldig i inntil 14 dager. Slett
   alle brukerens sesjoner unntatt den aktive ved bytte.

### LAV

4. **Ugyldig UUID i `:id`-ruter gir 500, ikke 400/404.** `WHERE id = $1` med
   ikke-UUID kaster Postgres-feil 22P02 → «Uventet feil på serveren» i alle
   modulene med `:id` (dagbok, varsler, faktura, tillegg, frister, timer).
   Én UUID-sjekk i ruteren (eller i `medOrg`-laget) rydder hele flaten.
5. **Ødelagt cookie gir 500 på alt.** `lesCookies` (`http.js:20`) kjører
   `decodeURIComponent` uverifisert — en klient med f.eks. `%E0` i cookien får
   URIError → 500 på hver forespørsel til den sletter cookien. Pakk i try/catch.
6. **`POST /api/godkjenninger` fra ansatt-rollen gir 500, ikke 403.**
   RLS-policyen krever `er_ledelse()` (migrasjon 002:153) og tetter reelt, men
   API-et mangler den eksplisitte rollesjekken som faktura/tillegg fikk etter
   forrige gransking (samme funnklasse: «LAV, faktura-rollesjekk»).
7. **Utløpte sesjoner og nullstillingskoder ryddes aldri.** `sesjoner`/
   `nullstillinger` vokser evig; oppslag filtrerer på `utloper`, så det er
   hygiene, ikke sikkerhet. En liten DELETE ved oppstart eller døgnintervall
   holder.
8. **Sti-sjekken for statiske filer mangler skilletegn** (`index.js:165`).
   `full.startsWith(APP_DIR)` godtar i teorien en søskenkatalog `app-x/`.
   Ufarlig i dag (stien bygges under `APP_DIR`), men
   `startsWith(APP_DIR + path.sep)` er gratis robusthet.
9. **`sendEpost` har ingen tidsavbrudd** (`epost.js:22`). Node-`fetch` uten
   `AbortSignal.timeout()` kan henge /api/glemt-forespørselen til leverandøren
   svarer. Rate-grensen (10/t) begrenser skaden; et 10 s-avbrudd fjerner den.
10. **AI-ruternes rate-grense er en håndvedlikeholdt sti-liste**
    (`index.js:214`). `['/api/skriv', '/api/prosjekter/ukesrapport']` må
    huskes utvidet for hver ny AI-rute — tredje stedet glemmes. Bedre: la
    modulen merke ruten (`ruter.add(..., { ai: true })`) og la serveren lese
    flagget.
11. **15 MB JSON-grense på alle POST-ruter** (`http.js:25`). Bare innflytting
    trenger den; skjemaruter klarer seg med brøkdelen. Differensier per rute
    når det passer — lavere angrepsflate for minne-press.

## Verifisert uten funn (det som holder)

- **RLS-modellen:** FORCE RLS + transaksjonslokal `set_config` med
  UUID/rollevalidering i `medOrg` (`db.js:30–50`); nivåene DELT/PRIVAT/SENSITIVT
  ligger i policyene, ikke i API-kode. Godkjenninger krever ledelse i WITH
  CHECK; ai_logg er admin-kun med SECURITY DEFINER-sum for kvoten.
- **Auth-hygiene:** scrypt (async), timing-safe sammenlikning, dummy-hash mot
  e-post-enumerering, hashede token og invitasjons-/nullstillingskoder,
  engangsbruk med `FOR UPDATE`, sesjonssletting ved nullstilling.
- **Idempotens og konfliktvern:** partielle unike indekser på
  `(org_id, klient_id)` + fallback-SELECT i racet; versjon + 409 med gjeldende
  rad.
- **AI-gatewayen:** modellkall utenfor transaksjon, prisvaktposten som nekter
  ukjente modeller, inputkapp 20 000 tegn, kostlogg uten innhold, 503-reserve.
- **SSE-kontrakten:** hendelser uten innhold + rollefiltrering, klienten henter
  bak RLS — dobbelt vern; skaleringsstien (LISTEN/NOTIFY) er dokumentert. Merk
  at rate-demperen deler samme én-instans-forutsetning som bussen — bør stå på
  samme linje i skaleringsnotatet.
- **Drift:** advisory-lås i migrering (dobbel-deploy), strukturert logg uten
  kropp, helse-endepunkt, CSP/HSTS/nosniff, egne databaser for TEST/STABIL i
  Frankfurt.

## Anbefalt rekkefølge

1. Funn 1–3 (én kveldsleveranse — de hører sammen og er små).
2. S2 (kvote til tenant-konfig) før kunde nr. 2 settes på samme instans.
3. Funn 4–6 som del av neste ordinære runde; 7–11 når man er borti filene.
4. S1/S4 som beslutningspunkter når første integrasjons-/API-kunde er reell —
   ikke bygg dem på forskudd, men ikke lov dem bort i salg før stien er valgt.

## Utbedret (20. juli 2026, samme gren)

Alle kodefunnene (1–11) og S2 er utbedret:

- **Funn 1:** `klientIp` leser nå *siste* ledd i `X-Forwarded-For` (leddet
  proxyen selv appender) — spoofing av rate-grensene er tettet.
- **Funn 2:** rate-demperen rydder per nøkkel (inaktive > 1 t) i stedet for
  `teller.clear()` — brute-force-tellerne kan ikke lenger nullstilles utenfra.
- **Funn 3:** `byttPassord` sletter alle brukerens andre sesjoner; egen sesjon
  består. Regresjonstest med to samtidige sesjoner.
- **Funn 4:** sentral UUID-vakt i ruteren — ugyldig `:id` gir 400 i alle moduler.
- **Funn 5:** `lesCookies` dropper verdier med ødelagt %-koding i stedet for 500.
- **Funn 6:** eksplisitt 403 på `POST /api/godkjenninger` for ansatte (RLS
  tettet allerede); testen som forventet 500 er oppdatert til 403.
- **Funn 7:** utløpte sesjoner og nullstillingskoder slettes ved oppstart og
  hvert døgn.
- **Funn 8:** stivakten for statiske filer krever nå `APP_DIR + path.sep`.
- **Funn 9:** `sendEpost` har 10 s tidsavbrudd (`AbortSignal.timeout`).
- **Funn 10:** AI-rutene merker seg selv med `{ ai: true }` i rutetabellen —
  sti-listen i serveren er borte.
- **Funn 11:** JSON-grensen er 1 MB som standard; kun innflyttingen ber om
  15 MB via rute-opsjonen `maksKropp`.
- **S2:** `sjekkKvote` leser `aiMndBudsjettOre` fra tenant-konfigen først;
  miljøvariabelen er reserven. Regresjonstest: tenant-kvote 1 øre sperrer,
  fjernet verdi faller tilbake til miljøvariabelen.

Verifisert: 34/34 servertester (fire nye regresjonstester for funn 3/4/5/6 og
S2), 27/27 e2e-sjekker i Chromium (390×844, null JS-feil), hemmelighetsskann
rent. S1, S3 og S4 står som beslutningspunkter — ingenting av det er bygget.
