-- Passordnullstilling: e-postbaserte engangskoder (kjerne-mønster D17).
-- Koden lagres kun hashet. Tabellen eies av auth-laget — appen har ingen grants.
CREATE TABLE nullstillinger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id  uuid NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  kode_hash  text NOT NULL UNIQUE,
  brukt_tid  timestamptz,
  utloper    timestamptz NOT NULL,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON nullstillinger TO livsarkiv_auth;
