# Livsarkivet — CLAUDE.md

Dette er Livsarkivet (del av Etterpå) — IKKE Lærling. Reglene i repo-rotens
CLAUDE.md om Lærling-distribusjon (versjonstriade, kveldsteam-branch,
to-nøkkel-regelen for OP Bygg-appen) gjelder ikke her. Karpathy-retningslinjene
og arbeidsformen (les først, planlegg, små leveranser, norsk bokmål) gjelder.

## Kommandoer
- `npm run migrate` — forward-only SQL-migrasjoner (kjøres som `livsarkiv_eier`)
- `npm test` — unit + RLS + API (krever Postgres, hopper ellers over)
- `npm run e2e` — Playwright 390×844, hele frigivelsesløpet, null JS-feil
- `node server/verktoy/ny-admin.js "Navn" epost` — ny saksbehandler (TOTP)

## Ufravikelig
1. Ingen frigivelse uten verifisert hendelse + karenstid. Aldri AI alene.
2. Fire øyne på frigivelse (to ULIKE admin-er) — også som CHECK i basen.
3. Admin skal ALDRI kunne lese hvelvinnhold. Det finnes ingen policy som gir
   det — ikke lag en.
4. Revisjonsloggen er append-only (ingen UPDATE/DELETE-grant). Logg og varsler
   bærer aldri innhold.
5. Sensitiv-tier er stengt (501) til ADR-001 er godkjent av Jonathan.
6. Ny tabell = ENABLE RLS (aldri FORCE) + eksplisitte grants + RLS-test i
   samme PR. Husk: en UPDATE med WHERE på kolonner krever også SELECT-policy.
7. Beslutninger som binder juss, sikkerhet eller penger: spør Jonathan.

## Arkitektur (kort)
Node uten rammeverk + Postgres m. person-skopet RLS. To DB-roller
(`livsarkiv_app`, `livsarkiv_auth`), GUC-er `app.bruker_id`/`app.rolle`
(`person`/`admin`/`system`), relasjoner avgjøres per rad. Tilstandsmaskinen i
`server/frigivelse.js` er ren og 100 % testet — endrer du en overgang, endre
fasitlisten i `tests/frigivelse.test.js` bevisst. ADR-er i `docs/adr/`.
