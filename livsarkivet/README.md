# Livsarkivet

Norges digitale beredskapsarkiv: et sikkert hvelv der alt dine nærmeste
trenger frigis KONTROLLERT ved død — aldri før, aldri av AI alene. Del av
Etterpå (etterpaa.no). Dette er MVP-kjerneloopen:

**hvelv → mottakermatrise → trigger → verifisering → karenstid → frigivelse → etterlattevisning**

## Herding før lansering (funn i egen sikkerhetsgjennomgang)
- **Attester:** kun PDF/JPEG/PNG/HEIC (CHECK i basen), serveres med
  `sandbox`-CSP og aldri inline for utrygge typer. Før dette kunne en betrodd
  kontakt laste opp HTML som kjørte som en side på vårt domene, foran øynene
  til saksbehandleren som skulle godkjenne en frigivelse.
- **Saksbehandlere MÅ ha tofaktor:** en admin-konto uten TOTP blir nektet
  innlogging (før slapp den inn på passord alene — og da er fire-øyne-regelen
  verdt lite).
- **Lengdegrenser** på tittel (200) og innhold (200 000 tegn), både i API og som
  CHECK. **Rate-demping** på attestopplasting og eksport. **`X-Robots-Tag:
  noindex`** på alt — ingen flate her hører hjemme i et søkeresultat.
- **Passordbytte** for innlogget bruker rykker alle andre sesjoner.
- **Oppstartsvarsel** i produksjonsmodus hvis demoinnlogging, åpen registrering
  eller for kort karenstid er slått på — og med demoinnlogging på viser appen et
  synlig «Testmiljø»-banner over innloggingen, så ingen legger inn ekte
  opplysninger i et miljø uten vilkår og e-postvarsler.

## Flere selskaper på samme plattform (ADR-005)
Et forsikringsselskap kan tilby Livsarkivet til sine kunder under egen
merkevare. Vertsnavnet avgjør hvilket selskap en adresse svarer for, og
merkevaren (navn, aksentfarge) hentes før innlogging. **En saksbehandler ser
kun sitt eget selskaps saker** — `er_admin_for(hvelv_id)` i stedet for et
ubetinget `er_admin()`, og fire øyne kreves innenfor samme selskap.
Plattformdriften ser saksmetadata på tvers for support; ingen av dem ser
hvelvinnhold. `tests/tenant.test.js` prøver å bryte hver av disse grensene.

```
node server/verktoy/ny-tenant.js storebrand "Storebrand" livsarkiv.storebrand.no
node server/verktoy/ny-admin.js "Navn" navn@storebrand.no storebrand
```

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
Med flagget av skjules «Opprett ditt livsarkiv» helt — knappen skal ikke føre til
et skjema som avvises etterpå. Inviterte kontakter kommer inn på koden sin uansett.

**Vil du bare se produktet?** Med serveren i gang:
```
node server/verktoy/demo-data.js
```
Fyller basen med fire hvelv i ulike stadier — ett med karenstid som løper (så du
ser nedtellingen og stopp-knappen), ett til verifisering (så saksbehandlerkøen
har noe å vise), ett frigitt (så etterlattevisningen har innhold) og ett urørt
(så «Meld dødsfall» kan prøves). Alle innlogginger skrives ut. Nekter å kjøre
mot produksjon. Skjermbilder av alle flatene ligger i `testbevis/visning/`.

## Agenter (råd — aldri vedtak)
Orkestratoren kjører agentene når en sak når verifisering, og rådene vises i
saksbehandlerkøen: **Vakt** (regelbasert misbruksvern: fersk kontakt, ferske
mottakerendringer, tidligere stoppede saker, påfallende rask attest),
**Frigivelse** (AI-assistert attestkontroll — anbefalingen er hardkodet til
menneskelig vurdering uansett modellsvar) og **Kvalitet** (sorgsensitiv QA på
avvisningsgrunner, med bevisst overstyring). All modellbruk går gjennom
`server/ai/gateway.js`: månedsbudsjett, kostlogg uten innhold
(`agent_logg`), promptinjeksjonsvern (<dokument>-innramming), og rent
«utilgjengelig»-svar uten API-nøkkel — ingen agent står på kritisk sti.

## Abonnement (Stripe, test-mode)
30 dagers prøveperiode, deretter Stripe Checkout (`STRIPE_SECRET`,
`STRIPE_PRIS_ID`, `STRIPE_WEBHOOK_HEMMELIGHET`; uten oppsett svarer API-et 503).
**Etisk gating:** utløpt tilgang stenger KUN eierens redigering — lesing,
frigivelsesløpet, eierens nødbrems og etterlattevisningen er aldri portet.

## Tester — alle syv nivåene fra /goal
```
npm test        # nivå 1 tilstandsmaskin (100 %), nivå 2 RLS + migrasjon,
                # nivå 3 krypto (zero-knowledge), nivå 5 agenter (golden +
                # red-team), nivå 6 drift (backup-gjenoppretting, feilinjeksjon),
                # pluss API-kjeden og abonnement mot Stripe-mock
npm run e2e     # nivå 4: Playwright, hele frigivelsesløpet i UI + negativløp
npm run lasttest # nivå 6: innlogging og frigivelsesflytens lesninger under last
```
Nivå 7 er den manuelle akseptansetesten — sjekkliste i `docs/akseptansetest.md`
(inkl. etterlattemodus testet av person uten forkunnskap).

Testene krever Postgres (hopper ellers pent over). Karenstiden manipuleres i
test via `KARENSTID_SEKUNDER`. CI: `.github/workflows/livsarkivet-ci.yml`
kjører alt mot postgres:16-service + Chromium; skjermbilder som testbevis
legges i `testbevis/` av e2e-kjøringen.

## Holdbarhet i frigivelsesløpet
Tilstandsendring, revisjonsrad og varslingskø skjer i ÉN transaksjon
(`ko_varsler()`): rulles noe tilbake, forsvinner alt — det finnes aldri en
frigivelse ingen ble varslet om. E-postutsending er en separat, gjentakbar
passering over `varslinger` med `sendt_tid IS NULL`, så nedetid i e-post-
transporten utsetter bare utsendingen. Karenstid-feieren bruker
`FOR UPDATE SKIP LOCKED`, så samtidige feiinger aldri frigir samme sak to
ganger, og en karenstid som utløp under nedetid plukkes opp ved neste feiing.

## Dine data (GDPR art. 15, 17, 20)
`GET /api/eksport` gir eieren alt som JSON — inkludert de frasepakkede
krypteringsnøklene, så eksporten kan dekrypteres utenfor tjenesten.
`POST /api/konto/slett` krever passordet på nytt og fjerner konto og hvelv med
alt innhold; kontakter i andres hvelv beholdes men løsnes, og revisjonssporet
(uten innhold) overlever som bevis for at frigivelser var korrekte.

## Personvern, vilkår og lansering
- `docs/dpia-utkast.md`, `docs/vilkar-utkast.md` — UTKAST fra utviklingsteamet,
  venter på Jonathans gjennomgang og juridisk kvalitetssikring.
- `docs/jurist-brief.md` — ferdig brief med de tolv spørsmålene til jurist.
- `docs/lansering-sjekkliste.md` — alt som må gjøres utenfor koden.
- `render.yaml` — Render Blueprint (EU/Frankfurt), migrasjoner ved deploy.

## Bevisste avgrensninger (fase 2/3 i /goal)
Dead man's switch, Folkeregisteret-integrasjon, SMS-kanal,
etterlattemodus-sjekkliste, Siste hilsen og krypto-implementering
(venter på godkjent ADR-001).

Huskeregler: datanivå (delt/privat/sensitiv) besluttes FØR elementet lages.
Varsler og logg bærer aldri innhold. CSP-en mykes aldri opp for bekvemmelighet.
Nye tabeller: ENABLE RLS + eksplisitte grants — og RLS-test i samme PR.
