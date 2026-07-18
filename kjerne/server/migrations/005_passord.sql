-- Passordflyt [JONATHAN: e-postbasert nullstilling]: koder for nullstilling
-- (både selvbetjent via e-post og ledelse-generert i Sentral). Koden lagres
-- kun hashet; engangs; kort levetid. Eies av auth-laget (oppslag skjer uten
-- innlogget sesjon) — plattform_app ser dem aldri.
CREATE TABLE nullstillinger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id  uuid NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  kode_hash  text NOT NULL UNIQUE,
  utloper    timestamptz NOT NULL,
  brukt_tid  timestamptz,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON nullstillinger TO plattform_auth;
