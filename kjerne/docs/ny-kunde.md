# Ny kunde på plattformen — under én time, uten kodeendring

*Beviset for suksesskriterium 1 (D5): kunde nr. 2 er konfig, ikke kode.
Malermester Demo AS ble opprettet nøyaktig slik.*

## Det du trenger

- Kundens navn, org.nr. og hvem som skal være admin/leder (navn + e-post)
- 30 minutter med kunden om tone og fagregler (grunnlaget for firmaprofilen)
- Tilgang til databasen (MIGRATE_DATABASE_URL) — i drift: Render-konsollen

## Steg for steg

1. **Kopier en tenants-fil** (10 min):
   `cp tenants/malermester-demo.js tenants/<kunde-slug>.js` og fyll inn:
   - `slug`, `navn`, `orgnr`
   - `konfig.appnavn` og `undertittel` (kundens produktnavn)
   - `konfig.tema` (farger — bruk kundens profil, eller behold en av standardtemaene)
   - `konfig.moduler` (slå på det kunden skal ha — start smått)
   - `konfig.profil` (firmaprofilen: hvem kunden er, skrivestil, fagregler —
     dette er produktets kjerne, bruk tid her; se laerling.js som forbilde)
   - `konfig.evner` (AI-oppgavene: behold kvalitetsmodellen for alt skrivearbeid)
   - `brukere` (admin/leder — ansatte inviteres fra appen etterpå)
2. **Opprett tenanten** (1 min):
   `node server/verktoy/ny-tenant.js <kunde-slug>`
   — skriver konfigurasjonen til databasen og oppretter brukerne med
   engangspassord (vises ÉN gang i konsollen; gi dem direkte, aldri på e-post
   sammen med lenken).
   I drift: legg slugen til i `TENANTS`-miljøvariabelen på Render, så kjøres
   samme verktøy automatisk ved neste deploy.
3. **Logg inn og se** (5 min): kundens tema, navn og moduler er aktive med én
   gang — samme deploy, samme database, full RLS-isolasjon fra alle andre kunder.
4. **Inviter ansatte** (i appen): Sentral-fanen → «Lag invitasjonskode» → gi
   koden til den ansatte (SMS/muntlig) → de registrerer seg selv.

## Før kunde nr. 2 signerer (engangsjobber)

- **Ekstern pentest** av plattformen [JONATHAN-beslutning: etter pilot, før kunde 2]
- Async scrypt (ytelse under lastspiss) — se avklaringene
- Revurder stack-linjen ved kunde nr. 3 (D19)

## Det som IKKE trengs

- Ingen ny deploy for konfig-endringer (kjør ny-tenant på nytt — idempotent)
- Ingen ny database, ingen ny Netlify-site, ingen kodeendring i kjernen
- Ingen AI-nøkkel per kunde (fase 4-beslutning når volumet krever det)

## Priser og kost (til salgsapparatet)

Marginalkost per ny kunde ≈ AI-forbruket alene (est. 100–300 kr/mnd ved normal
bruk, hardt tak på 500 kr styrt av AI_MND_BUDSJETT_ORE) — server og database
deles. Abonnementsanbefaling fra researchen: 2 990–3 990 kr/mnd per bedrift.
