# Livsarkivet — CLAUDE.md

Dette er Livsarkivet (del av Etterpå) — IKKE Lærling. Reglene i repo-rotens
CLAUDE.md om Lærling-distribusjon (versjonstriade, kveldsteam-branch,
to-nøkkel-regelen for OP Bygg-appen) gjelder ikke her. Karpathy-retningslinjene
og arbeidsformen (les først, planlegg, små leveranser, norsk bokmål) gjelder.

## Kommandoer
- `npm run migrate` — forward-only SQL-migrasjoner (kjøres som `livsarkiv_eier`)
- `npm test` — nivå 1–3, 5 og 6 (krever Postgres, hopper ellers over)
- `npm run e2e` — nivå 4: Playwright 390×844, null JS-feil
- `npm run lasttest` — nivå 6: innlogging + frigivelsesflytens lesninger
- `node server/verktoy/ny-tenant.js <slug> "Navn" [vertsnavn]` — nytt selskap
- `node server/verktoy/ny-admin.js "Navn" epost [slug]` — ny saksbehandler (TOTP)
- `node server/verktoy/ny-integrasjon.js <slug> "Navn" [webhook-url]` — API-nøkkel
- `node server/verktoy/ny-oidc.js <slug> <issuer> <klient-id> [hemmelighet]` — selskapets IdP
- `node server/verktoy/prospekt-demo.js <slug> "Navn" <vertsnavn> [#farge]` — merkevaret demo
- Nivå 7 (manuell akseptansetest): `docs/akseptansetest.md`

## Ufravikelig
1. Ingen frigivelse uten verifisert hendelse + karenstid. Aldri AI alene.
2. Fire øyne på frigivelse (to ULIKE admin-er i SAMME tenant) — også som
   CHECK i basen.
3. Admin skal ALDRI kunne lese hvelvinnhold. Det finnes ingen policy som gir
   det — ikke lag en. Gjelder også plattformdrift.
3b. Nye admin-policyer bruker `er_admin_for(hvelv_id)`, aldri `er_admin()`
   alene (ADR-005). Et ubetinget `er_admin()` lar ett selskaps saksbehandler
   se et annets kunder.
3c. En ekstern innlogging (OIDC) gir ALLTID rolle 'person'. Selskapets IdP skal
   aldri kunne utnevne saksbehandlere hos oss (ADR-009).
4. Revisjonsloggen er append-only (ingen UPDATE/DELETE-grant). Logg og varsler
   bærer aldri innhold.
5. Sensitiv-tier krypteres i nettleseren (ADR-001, godkjent og implementert).
   Serveren skal ALDRI ta imot klartekst på dette nivået — API-et avviser
   `nivaa='sensitiv'` uten `kryptert` + `nokkelRef`.
6. Ny tabell = ENABLE RLS (aldri FORCE) + eksplisitte grants + RLS-test i
   samme PR. Husk: en UPDATE med WHERE på kolonner krever også SELECT-policy.
7. Beslutninger som binder juss, sikkerhet eller penger: spør Jonathan.
8. Varsling skjer ALLTID i samme transaksjon som tilstandsendringen
   (`koVarsler`/`ko_webhooks`, aldri etter commit) — ellers kan en frigivelse
   skje uten at noen ble varslet. Utsending er den gjentakbare delen.
8b. Selskapet varsles KUN ved `frigitt`, aldri ved karenstidens start: eieren
   kan fortsatt stoppe alt, og en for tidlig utbetaling kan ikke ringes
   tilbake. Webhook-nyttelasten bærer aldri personopplysninger (ADR-007).
9. Testfilene kjører parallelt: aldri assert på globale radtall — skop
   assertions til testens egne fiksturer. Gjelder også RETURVERDIER fra
   globale operasjoner: `feiKarenstid()` og `sendUtestaaende()` teller alt i
   basen, ikke bare ditt. Tester som eier global oppførsel (`drift.test.js`)
   kjører mot EGEN database — se toppen av filen for hvorfor lappverk ikke
   holdt.

## Arkitektur (kort)
Node uten rammeverk + Postgres m. person-skopet RLS. To DB-roller
(`livsarkiv_app`, `livsarkiv_auth`), GUC-er `app.bruker_id`/`app.rolle`
(`person`/`admin`/`system`), relasjoner avgjøres per rad. Tilstandsmaskinen i
`server/frigivelse.js` er ren og 100 % testet — endrer du en overgang, endre
fasitlisten i `tests/frigivelse.test.js` bevisst. ADR-er i `docs/adr/`.
