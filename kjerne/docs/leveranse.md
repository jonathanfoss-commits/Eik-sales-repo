# Leveranse — plattformkjernen (grunnpilaren)

*18. juli 2026 · ULTRACODE-oppdraget: kjernen som produkt, Lærling som første
kunde, Malermester Demo som plattformbevis. Bygget på Anlegg-arkitekturen
(grenen claude/walan-maskin-app-s5lu93), generalisert til tenant-agnostisk kjerne.*

## Hva som er bygget

**Kjernen (`kjerne/server/` + `kjerne/app/`):** Node uten rammeverk + PostgreSQL
med FORCE RLS på samtlige tabeller. Transaksjonslokal org/bruker/rolle-kontekst
(`medOrg`) gjør at datanivåene håndheves I DATABASEN, aldri i klienten:
DELT (dagbok, varsler, innspill — hele laget, live), PRIVAT+LEDELSE (timer
[JONATHAN]), SENSITIVT (AI-kost — kun admin [JONATHAN], med revisjonslogg).
Auth: scrypt, hashede sesjonstoken, HttpOnly/SameSite-cookies, invitasjonskode-
innrullering (ingen selvregistrering), TOTP-støtte for admin. Live-laget: SSE
per org med rollefiltrering og polling-reserve — hendelser bærer ALDRI innhold,
klienten henter alt bak RLS (dobbelt vern). Offline-kø med klient-id-idempotens
og versjonsvern (409 ved samtidig redigering). AI-gateway: evner fra
tenant-konfig, kvalitetsmodell (opus-4-8) for alt skrivearbeid (D6), prompt
caching, kostnadslogg i øre (aldri innhold), hard budsjettsperre (500 kr/mnd
[JONATHAN]). Streng CSP, HSTS, rate-demping, GDPR-slette-endepunkt.

**Lærling som tenant-konfig (`tenants/laerling.js`):** midnatt-temaet,
modulene (hjem, timer, dagbok, varsler, skrivemotor, innspill, sentral,
innflytting) og hele PROFIL/fagreglene fra piloten — kjernen har null
hardkodet OP Bygg. **Malermester Demo (`tenants/malermester-demo.js`):**
plattformbeviset — eget navn («Mesterhjelpen»), eget tema, færre moduler,
opprettet med ett skript. Oppskrift: `docs/ny-kunde.md`.

**Innflyttingen:** `app/eksport.html` i den gamle appen (eneste fredningsunntak,
v0.15.0) pakker localStorage til JSON; ny app importerer med forhåndsvisning,
idempotens og kvittering.

## Verifisert (alt grønt)

- **21/21** server-/databasetester: RLS-isolasjon mellom to EKTE tenanter,
  rollenivåene (kollega ser ikke timer; pilotleder ser timer, ikke kost; admin
  ser kost), WITH CHECK (kan ikke føre timer i andres navn), tom kontekst = null
  rader, AI-kjeden mot lokal mock (opus-ruting, cachet profil, kostlogg i øre,
  budsjettsperre 429), idempotens, autentiserte godkjenningsstemmer,
  rate-demping, versjonstriaden.
- **22/22** e2e i Chromium (iPhone 390×844, null JS-feil, skjermbilder):
  **LIVE-beviset** — Ole Fabian fører dagboklinje i én nettleser, Jonathan ser
  den umiddelbart i en annen, uten omlasting, med «Ole Fabian · skrev i
  dagboka»-markering. **Isolasjonsbeviset** — Malermester-admin ser null
  OP Bygg-data (RLS), eget tema/navn. Invitasjonsflyt, rollegrenser i UI OG
  rett mot API, 503-reserven uten AI-nøkkel, innflytting med kvittering.
- Testene FANT og FIKSET en reell feil: budsjettsperren leste kostnadsloggen
  gjennom brukerens RLS og så alltid 0 for ansatte — løst med SECURITY
  DEFINER-aggregat (migrasjon 003). Beviset på at negative tester betaler seg.
- Multi-agent kodegjennomgang (sikkerhet + korrekthet/offline): funn og
  utbedringer i `avklaringer.md`.

## Suksesskriteriene (D5)

1. ✅ Kunde nr. 2 uten kodeendring utenfor konfig — Malermester Demo, ett skript
2. ✅ Live-beviset i to nettlesere
3. ✅ Isolasjonsbeviset (UI + API/RLS)
4. ✅ Pilotflyten i Chromium 390×844 uten JS-feil
5. ✅ AI-kjeden mot mock (ruting/caching/kost/sperre/503)
6. ✅ Innflytting med kvittering (e2e)
7. ✅ Fredningen holdt — kun `app/eksport.html` (+versjonstriade) i den gamle appen

## Drift og økonomi (CFO-blikket)

| Post | Kost/mnd |
|---|---|
| Render: 2 web-tjenester (starter) | ~$14 (~150 kr) |
| Render: 2 Postgres basic-256mb | ~$12 (~130 kr) |
| AI-forbruk OP Bygg (est., tak 500 kr) | 100–300 kr |
| **Sum drift TEST+STABIL** | **~400–600 kr/mnd** |
| **Marginalkost per NY kunde** | **kun AI-forbruket (~100–300 kr)** — server/DB deles |

Mot anbefalt pris 2 990–3 990 kr/mnd per bedrift er bruttomarginen på kunde
nr. 2+ over 90 %. (Netlify-piloten var gratis; dette er prisen for ekte
flerbruker-plattform med live og sikkerhet.)

## Salgsargumentet (CMO-blikket)

«Alt laget gjør — timer, dagbok, avvik — samlet i sanntid. Kollegaen fører
dagboka på plassen, kontoret ser det i samme sekund. Og det som er sensitivt,
ser bare de som skal: dine timer er dine og sjefens, økonomien er eierens.
Norsk, bygget for hansker og dårlig dekning, data i EU, aldri trening på
innholdet ditt.» Live + nivåene er differensieringen ingen av skjema-konkurrentene har.

## Beste praksis-runden (etter Jonathans fire beslutninger)

CI i GitHub Actions håndhever nå hele testsuiten + e2e + hemmelighetsskann på
hver push (D16). Passordflyt komplett: bytte innlogget, selvbetjent nullstilling
på e-post (leverandør-uavhengig, D17) og ledelse-kode i Sentral som alltid-
virkende reserve. Ingen passord i deploy-logger lenger (D20). Strukturert
driftslogg uten innhold (D21). Pentest planlagt etter pilot/før kunde 2 (D18).

## Kjente begrensninger (ærlig liste)

- SSE-bussen er in-process — riktig for én instans; LISTEN/NOTIFY-stien er
  dokumentert for skalering (D3).
- Bilder/foto er ikke med i v1 (forblir lokale i piloten — egen beslutning).
- Prøverommet forblir i Netlify-piloten (D7).
- TOTP er støttet, men håndheves først når hemmelighet settes på admin-brukerne.
- To samtidige AI-kall kan passere like under budsjettaket (dokumentert).
- E-postutsending må konfigureres av Jonathan (leverandørvalg + DPA) før
  selvbetjent «Glemt passord?» virker — Sentral-koden er reserven imens.

## Filkart

`server/` index (HTTP+SSE+CSP), db (RLS-kontekst), auth (scrypt/TOTP/invitasjon),
buss (live), ai/gateway (modeller/kost/kvote), api/ (timer, dagbok, varsler,
innspill, skriv, sentral, innflytting, personvern), migrations/ (001 grunnmur,
002 moduler, 003 kvotefiks), verktoy/ny-tenant. `app/` index + stil (nøytrale
tokens) + js/app (skall/tema/live) + js/api (offline-kø) + js/moduler/*.
`tenants/` laerling, malermester-demo. `tests/` rls, api, ai-kost, versjon, e2e (CI kjører alt).
`render.yaml` (to tjenester, to databaser), `Dockerfile`, `docker-compose.yml`
(«egen boks»), `.env.example`.
