# ADR-004: Lagring av dødsattester

**Status:** Vedtatt (implementert i migrasjon 003).

## Kontekst
Attester (PDF/foto, typisk < 2 MB) lastes opp av betrodde kontakter og
vurderes av saksbehandlere. De er bevismateriale i frigivelsessaken.

## Beslutning
`bytea` i Postgres (`attester.innhold`, tak 10 MB via API-et):
- RLS-vernet med samme policyer som resten av saken (opplaster + admin + system).
- Transaksjonelt med saksdataene — ingen halvferdige opplastinger.
- Én backup- og gjenopprettingshistorie (databasen), viktig for
  «tilstand skal aldri gå tapt»-kravet.
- Åpning logges i revisjonsloggen (`attest_aapnet`).

## Avviste alternativer
- **Lokal disk:** tilstand på flyktige verter (Render/containere) — nei.
- **Objektlagring (S3-kompatibel):** riktig ved volum, men ny avhengighet,
  egen tilgangsstyring og egen backuphistorie nå. Revurderes når
  attestvolumet eller databasestørrelsen krever det; byttet er isolert til
  attest-API-et.
