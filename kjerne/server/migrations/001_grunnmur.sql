-- Plattformkjernen, grunnmur: roller, organisasjoner (tenants), brukere,
-- sesjoner, invitasjoner, revisjonslogg.
--
-- Multi-tenant med Row Level Security fra FØRSTE tabell:
--   * appen kobler til som plattform_app (eier ingen tabeller, kan ikke omgå RLS)
--   * hver spørring kjører med transaksjonslokal app.org_id + app.bruker_id + app.rolle
--   * org_isolasjon slipper kun gjennom rader i egen organisasjon
--   * datanivåene (DELT/PRIVAT/SENSITIVT) håndheves i policyene, aldri i klienten

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'plattform_app') THEN
    CREATE ROLE plattform_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'plattform_auth') THEN
    CREATE ROLE plattform_auth LOGIN;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NULLIF: en aldri-satt app.org_id kan være tom streng — da skal policyen
-- evaluere til NULL (ingen rader), ikke kaste uuid-feil.
CREATE OR REPLACE FUNCTION gjeldende_org() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.org_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION gjeldende_bruker() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.bruker_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION gjeldende_rolle() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.rolle', true), '') $$;
CREATE OR REPLACE FUNCTION er_ledelse() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT gjeldende_rolle() IN ('admin', 'pilotleder') $$;

-- Tenants. All kundespesifikk oppførsel (navn, tema, moduler, AI-evner) bor i
-- konfig-jsonb — kjernen har null hardkodet kunde.
CREATE TABLE organisasjoner (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  navn       text NOT NULL,
  orgnr      text UNIQUE,
  konfig     jsonb NOT NULL DEFAULT '{}'::jsonb,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE organisasjoner ENABLE ROW LEVEL SECURITY;
ALTER TABLE organisasjoner FORCE ROW LEVEL SECURITY;
CREATE POLICY org_egen ON organisasjoner FOR SELECT TO plattform_app
  USING (id = gjeldende_org());
GRANT SELECT ON organisasjoner TO plattform_app;

CREATE TABLE brukere (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organisasjoner(id),
  navn              text NOT NULL,
  epost             text NOT NULL UNIQUE,
  rolle             text NOT NULL DEFAULT 'ansatt' CHECK (rolle IN ('admin', 'pilotleder', 'ansatt')),
  passord_hash      text NOT NULL,
  totp_hemmelighet  text,          -- satt = TOTP kreves ved innlogging (admin-krav i prod)
  aktiv             boolean NOT NULL DEFAULT true,
  opprettet         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE brukere ENABLE ROW LEVEL SECURITY;
ALTER TABLE brukere FORCE ROW LEVEL SECURITY;
CREATE POLICY brukere_org ON brukere FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
-- Skriving på brukere (roller, deaktivering) er kun for ledelsen.
CREATE POLICY brukere_skriv ON brukere FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse())
  WITH CHECK (org_id = gjeldende_org());
-- plattform_auth finner brukeren på e-post FØR org er kjent (innlogging + registrering).
CREATE POLICY brukere_auth ON brukere FOR ALL TO plattform_auth USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE ON brukere TO plattform_app;
GRANT SELECT, INSERT, UPDATE ON brukere TO plattform_auth;

-- Sesjoner eies av auth-laget (oppslag skjer før org er kjent). Kun plattform_auth.
CREATE TABLE sesjoner (
  token_hash text PRIMARY KEY,
  bruker_id  uuid NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  org_id     uuid NOT NULL REFERENCES organisasjoner(id),
  utloper    timestamptz NOT NULL,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON sesjoner TO plattform_auth;

-- Innrullering: kun med invitasjonskode satt av ledelsen — ingen selvregistrering.
-- Koden lagres hashet (den sendes til den ansatte utenfor systemet).
CREATE TABLE invitasjoner (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organisasjoner(id),
  kode_hash  text NOT NULL UNIQUE,
  rolle      text NOT NULL DEFAULT 'ansatt' CHECK (rolle IN ('admin', 'pilotleder', 'ansatt')),
  brukt_av   uuid REFERENCES brukere(id),
  brukt_tid  timestamptz,
  utloper    timestamptz NOT NULL,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invitasjoner ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitasjoner FORCE ROW LEVEL SECURITY;
CREATE POLICY invitasjoner_ledelse ON invitasjoner FOR ALL TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse())
  WITH CHECK (org_id = gjeldende_org() AND er_ledelse());
CREATE POLICY invitasjoner_auth ON invitasjoner FOR ALL TO plattform_auth USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON invitasjoner TO plattform_app;
GRANT SELECT, INSERT, UPDATE ON invitasjoner TO plattform_auth;

-- Revisjonslogg for tilgang til SENSITIVT-nivået: hendelsestyper, aldri innhold.
CREATE TABLE revisjon (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid REFERENCES brukere(id),
  hendelse   text NOT NULL,
  tid        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE revisjon ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisjon FORCE ROW LEVEL SECURITY;
CREATE POLICY revisjon_les ON revisjon FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org() AND gjeldende_rolle() = 'admin');
CREATE POLICY revisjon_skriv ON revisjon FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT ON revisjon TO plattform_app;
