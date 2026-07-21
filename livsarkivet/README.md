# Livsarkivet

Norges digitale beredskapsarkiv: et sikkert hvelv der alt dine nærmeste
trenger frigis KONTROLLERT ved død — aldri før, aldri av AI alene. Del av
Etterpå (etterpaa.no). Dette er MVP-kjerneloopen:

**hvelv → mottakermatrise → trigger → verifisering → karenstid → frigivelse → etterlattevisning**

## Ufravikelige prinsipper (håndhevet i kode og tester)
1. Ingen frigivelse uten verifisert hendelse + karenstid (48 t).
2. Fire øyne: to ULIKE saksbehandlere må godkjenne (app-sjekk + CHECK i basen).
3. Admin kan ALDRI lese hvelvinnhold (ingen RLS-policy finnes — testet som null rader).
4. Varsel til eier + ALLE kontakter ved ethvert frigivelsesforsøk.
5. Immutabel revisjonslogg (ingen UPDATE/DELETE-grant) — hendelsestyper, aldri innhold.
6. To uavhengige kilder ved manuell trigger (attest + uavhengig bekreftelse,
   eller attest + fire-øyne når hvelvet kun har én betrodd kontakt).
7. Zero-knowledge sensitiv-tier: skjema er klart, implementering venter på
   godkjent ADR-001 (API-et svarer 501 inntil da).

## Arkitektur
Selvforsynt Node ≥ 20 + Postgres 16. Avhengigheter: `pg` (+ Playwright i dev).
Person-skopet Row Level Security etter kjerne-mønsteret i dette repoet:
appen kobler til som `livsarkiv_app`/`livsarkiv_auth` (eier ingen tabeller),
hver spørring kjører i en transaksjon med `app.bruker_id` + `app.rolle`, og
relasjonene (eier/betrodd/mottaker) avgjøres per rad av policyene. Se
`docs/adr/` for beslutningene (krypto, trigger, tenant, attestlagring).

## Kjøre lokalt
```
docker compose up -d          # Postgres 16
cp .env.example .env
npm install
npm run migrate
npm start                     # http://localhost:3400
```
Saksbehandler opprettes av drift: `node server/verktoy/ny-admin.js "Navn" epost`
(skriver engangspassord + TOTP-hemmelighet én gang).
Selvregistrering for eiere er bak `REGISTRERING_AAPEN=1` til DPIA/vilkår er klare.

## Tester
```
npm test        # unit (tilstandsmaskin 100 %), RLS-suiten, API-kjeden
npm run e2e     # Playwright: hele frigivelsesløpet i UI + negativløp
```
Testene krever Postgres (hopper ellers pent over). Karenstiden manipuleres i
test via `KARENSTID_SEKUNDER`. CI: `.github/workflows/livsarkivet-ci.yml`
kjører alt mot postgres:16-service + Chromium; skjermbilder som testbevis
legges i `testbevis/` av e2e-kjøringen.

## Bevisste avgrensninger i denne leveransen
Stripe, AI-agenter, dead man's switch, Folkeregisteret-integrasjon, SMS,
etterlattemodus-sjekkliste og krypto-implementering kommer i egne PR-er
(se /goal-fasene). Passordnullstilling er heller ikke med ennå.

Huskeregler: datanivå (delt/privat/sensitiv) besluttes FØR elementet lages.
Varsler og logg bærer aldri innhold. CSP-en mykes aldri opp for bekvemmelighet.
Nye tabeller: ENABLE RLS + eksplisitte grants — og RLS-test i samme PR.
