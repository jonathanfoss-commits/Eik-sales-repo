-- Livsarkivet, grunnmur: roller, tenanter, brukere, sesjoner, invitasjoner,
-- revisjonslogg.
--
-- Person-skopet Row Level Security fra FØRSTE tabell:
--   * appen kobler til som livsarkiv_app (eier ingen tabeller, kan ikke omgå RLS)
--   * hver spørring kjører med transaksjonslokal app.bruker_id + app.rolle
--   * om brukeren er eier, betrodd kontakt eller mottaker avgjøres per rad av
--     relasjonspredikater — aldri av klienten
--   * ENABLE (ikke FORCE) RLS: eieren brukes kun av migrasjoner/seeding, appen
--     kobler alltid til som livsarkiv_app/livsarkiv_auth (lærdom fra kjerne)

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'livsarkiv_app') THEN
    CREATE ROLE livsarkiv_app LOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'livsarkiv_auth') THEN
    CREATE ROLE livsarkiv_auth LOGIN;
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NULLIF: en aldri-satt app.bruker_id kan være tom streng — da skal policyen
-- evaluere til NULL (ingen rader), ikke kaste uuid-feil.
CREATE OR REPLACE FUNCTION gjeldende_bruker() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.bruker_id', true), '')::uuid $$;
CREATE OR REPLACE FUNCTION gjeldende_rolle() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT NULLIF(current_setting('app.rolle', true), '') $$;
CREATE OR REPLACE FUNCTION er_admin() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT gjeldende_rolle() = 'admin' $$;

-- Multi-tenant forberedt, ikke aktivert (ADR-003): én seedet tenant, og
-- tenant_id KUN på brukere. Aktivering senere er én migrasjon uten backfill.
CREATE TABLE tenanter (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text NOT NULL UNIQUE,
  navn       text NOT NULL,
  konfig     jsonb NOT NULL DEFAULT '{}'::jsonb,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tenanter ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenanter_les ON tenanter FOR SELECT TO livsarkiv_app USING (true);
GRANT SELECT ON tenanter TO livsarkiv_app;
INSERT INTO tenanter (slug, navn) VALUES ('livsarkivet', 'Livsarkivet');

-- SECURITY DEFINER: kjøres som DEFAULT ved INSERT i brukere — også fra
-- livsarkiv_auth, som ikke har (og ikke skal ha) lesetilgang til tenanter.
CREATE OR REPLACE FUNCTION standard_tenant() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT id FROM tenanter WHERE slug = 'livsarkivet' $$;

CREATE TABLE brukere (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL DEFAULT standard_tenant() REFERENCES tenanter(id),
  navn              text NOT NULL,
  epost             text NOT NULL UNIQUE,
  telefon           text,
  rolle             text NOT NULL DEFAULT 'person' CHECK (rolle IN ('person', 'admin')),
  passord_hash      text NOT NULL,
  totp_hemmelighet  text,          -- satt = TOTP kreves ved innlogging (admin-krav)
  aktiv             boolean NOT NULL DEFAULT true,
  opprettet         timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE brukere ENABLE ROW LEVEL SECURITY;
-- Appen ser kun egen rad. (Migrasjon 002 utvider: betrodd kontakt ser navnet
-- på eiere hvis hvelv de er betrodd i.) Admin har INGEN policy — admin
-- saksbehandler frigivelser, blar aldri i brukere.
CREATE POLICY brukere_selv ON brukere FOR SELECT TO livsarkiv_app
  USING (id = gjeldende_bruker());
-- livsarkiv_auth finner brukeren på e-post FØR identiteten er etablert
-- (innlogging + registrering + invitasjonsinnløsning).
CREATE POLICY brukere_auth ON brukere FOR ALL TO livsarkiv_auth USING (true) WITH CHECK (true);
-- Kolonnenivå-grant: app-laget trenger aldri passord_hash/totp_hemmelighet —
-- de kolonnene er kun for auth-laget. Policyen brukere_eiernavn (migrasjon 002)
-- ville ellers gitt kontakter radtilgang til eierens hash.
GRANT SELECT (id, tenant_id, navn, epost, telefon, rolle, aktiv, opprettet)
  ON brukere TO livsarkiv_app;
GRANT SELECT, INSERT, UPDATE ON brukere TO livsarkiv_auth;

-- Sesjoner eies av auth-laget. Kun livsarkiv_auth — appen kan ikke røre dem.
CREATE TABLE sesjoner (
  token_hash text PRIMARY KEY,
  bruker_id  uuid NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  utloper    timestamptz NOT NULL,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON sesjoner TO livsarkiv_auth;

-- Invitasjoner: eier inviterer kontaktene sine inn. Koden lagres kun hashet.
-- (kontakt_id kobles i migrasjon 002 når kontakter-tabellen finnes.)
CREATE TABLE invitasjoner (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kontakt_id uuid,                 -- FK legges på i migrasjon 002
  epost      text NOT NULL,
  kode_hash  text NOT NULL UNIQUE,
  brukt_av   uuid REFERENCES brukere(id),
  brukt_tid  timestamptz,
  utloper    timestamptz NOT NULL,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE invitasjoner ENABLE ROW LEVEL SECURITY;
-- Eier-policy legges på i migrasjon 002 (krever kontakter/hvelv).
CREATE POLICY invitasjoner_auth ON invitasjoner FOR ALL TO livsarkiv_auth USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE ON invitasjoner TO livsarkiv_app;
GRANT SELECT, INSERT, UPDATE ON invitasjoner TO livsarkiv_auth;

-- Immutabel revisjonslogg: hendelsestyper og referanser — ALDRI innhold.
-- Immutabiliteten håndheves i GRANT-ene: ingen app-rolle får UPDATE/DELETE,
-- så endring feiler med «permission denied» uansett policy. (Databaseeieren
-- kan teknisk sett endre — kun migrasjoner kobler til som eier.)
CREATE TABLE revisjon (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tid        timestamptz NOT NULL DEFAULT now(),
  bruker_id  uuid,                 -- NULL ved systemhendelser (karenstid-utløp)
  rolle      text,
  hvelv_id   uuid,                 -- bevisst uten FK: loggen skal overleve alt annet
  hendelse   text NOT NULL,
  detaljer   jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE revisjon ENABLE ROW LEVEL SECURITY;
CREATE POLICY revisjon_skriv ON revisjon FOR INSERT TO livsarkiv_app
  WITH CHECK (bruker_id IS NOT DISTINCT FROM gjeldende_bruker()
              OR gjeldende_rolle() IN ('admin', 'system'));
-- Admin leser alt (tilsyn). Eier-lesing av eget hvelvs logg legges på i 002.
CREATE POLICY revisjon_les_admin ON revisjon FOR SELECT TO livsarkiv_app
  USING (er_admin());
GRANT SELECT, INSERT ON revisjon TO livsarkiv_app;
