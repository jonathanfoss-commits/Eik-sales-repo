# ADR-003: Tenantmodell — forberedt, ikke aktivert

**Status:** Vedtatt (implementert i migrasjon 001).

## Kontekst
/goal krever multi-tenant i datamodellen (partnere/white-label, B2B2C mot
bank/forsikring) men IKKE aktivert i MVP. Kjerne-plattformen i dette repoet
er org-skopet; Livsarkivet er B2C der grensen går mellom personer.

## Beslutning
- Én `tenanter`-tabell med én seedet rad (`livsarkivet`), og `tenant_id`
  KUN på `brukere` (NOT NULL DEFAULT standard_tenant()).
- All RLS er person-skopet (`app.bruker_id` + relasjonspredikater), ikke
  org-skopet: en person kan samtidig være eier av eget hvelv og kontakt/
  mottaker i andres — GUC-rollen kan derfor ikke bære relasjonen, det må
  radpredikatene gjøre.
- Aktivering av multi-tenant senere = én migrasjon: tenant-predikat inn i
  policy-hjelpefunksjonene + eventuelle partner-kolonner. Ingen backfill på
  barnetabeller (de når tenant via `hvelv.eier_id → brukere`).

## Avvist alternativ
`org_id`/`tenant_id` på alle tabeller nå: spekulativt (Musk steg 2), og
farlig — det frister policyer til å skopere på tenant der den riktige
B2C-grensen er personen.
