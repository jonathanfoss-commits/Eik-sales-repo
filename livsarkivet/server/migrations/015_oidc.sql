-- Innlogging via selskapets egen identitetsleverandør (BankID gjennom deres
-- OIDC-tilbyder, Entra ID, hva de nå bruker).
--
-- Poenget er ikke bekvemmelighet. Et forsikringsselskaps kunder har allerede
-- en identitet hos selskapet, og et ekstra passord til «enda en tjeneste» er
-- både en terskel ved registrering og en risiko ved dødsfall — etterlatte
-- leter ikke etter et passord de aldri visste om.

CREATE TABLE oidc_konfig (
  tenant_id          uuid PRIMARY KEY REFERENCES tenanter(id) ON DELETE CASCADE,
  -- issuer brukes både til oppslag av /.well-known og til å verifisere `iss`
  -- i id_token. Den ene verdien er derfor tillitsankeret.
  issuer             text NOT NULL,
  klient_id          text NOT NULL,
  klient_hemmelighet text,          -- NULL = offentlig klient (kun PKCE)
  aktiv              boolean NOT NULL DEFAULT true,
  opprettet          timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE oidc_konfig ENABLE ROW LEVEL SECURITY;   -- kun drift, via eier

-- Innloggingsflyten trenger konfigurasjonen FØR noen er autentisert.
-- SECURITY DEFINER gir ut nøyaktig det flyten trenger, aldri hele tabellen.
CREATE OR REPLACE FUNCTION oidc_for_tenant(tenantid uuid)
  RETURNS TABLE (issuer text, klient_id text, klient_hemmelighet text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.issuer, o.klient_id, o.klient_hemmelighet
    FROM oidc_konfig o WHERE o.tenant_id = tenantid AND o.aktiv
$$;
GRANT EXECUTE ON FUNCTION oidc_for_tenant(uuid) TO livsarkiv_app;

-- ── Kobling til ekstern identitet ──
-- Vi kobler på `sub` fra utstederen, ALDRI på e-post alene. E-post er
-- foranderlig og hos flere tilbydere noe brukeren selv kan sette; en kobling
-- på e-post ville latt en angriper med rett adresse hos feil IdP overta en
-- konto. `sub` er stabil og utstederens eget ansvar.
ALTER TABLE brukere
  ADD COLUMN ekstern_utsteder text,
  ADD COLUMN ekstern_id       text;
CREATE UNIQUE INDEX brukere_ekstern ON brukere (ekstern_utsteder, ekstern_id)
  WHERE ekstern_id IS NOT NULL;

CREATE OR REPLACE FUNCTION bruker_for_ekstern(utsteder text, eksternid text)
  RETURNS TABLE (id uuid, navn text, rolle text, aktiv boolean)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.id, b.navn, b.rolle, b.aktiv FROM brukere b
   WHERE b.ekstern_utsteder = utsteder AND b.ekstern_id = eksternid
$$;
GRANT EXECUTE ON FUNCTION bruker_for_ekstern(text, text) TO livsarkiv_app;

-- Opprett eller koble. Kjøres av innloggingsflyten (auth-rollen har ikke
-- tilgang til brukere-tabellen på annen måte).
--
-- To vaktposter som IKKE kan fjernes uten å gjøre dette til en bakdør:
--   * rollen settes alltid til 'person'. En saksbehandler kan ALDRI oppstå
--     via en ekstern innlogging — fire-øyne-regelen er verdt lite hvis
--     selskapets egen IdP kan utnevne godkjennere hos oss.
--   * finnes e-posten allerede uten ekstern kobling, KOBLES den ikke
--     automatisk. Da må eieren av kontoen logge inn og koble selv.
CREATE OR REPLACE FUNCTION oidc_koble_bruker(
    tenantid uuid, utsteder text, eksternid text, epostinn text, navninn text)
  RETURNS TABLE (id uuid, navn text, rolle text, status text)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE funnet record;
BEGIN
  SELECT b.id, b.navn, b.rolle, b.aktiv INTO funnet FROM brukere b
   WHERE b.ekstern_utsteder = utsteder AND b.ekstern_id = eksternid;
  IF FOUND THEN
    IF NOT funnet.aktiv THEN
      RETURN QUERY SELECT funnet.id, funnet.navn, funnet.rolle, 'deaktivert'::text;
    ELSE
      RETURN QUERY SELECT funnet.id, funnet.navn, funnet.rolle, 'innlogget'::text;
    END IF;
    RETURN;
  END IF;

  -- eksisterende konto på samme e-post: ikke overta den automatisk
  IF EXISTS (SELECT 1 FROM brukere WHERE lower(epost) = lower(epostinn)) THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::text, 'epost_finnes'::text;
    RETURN;
  END IF;

  INSERT INTO brukere (navn, epost, rolle, passord_hash, tenant_id,
                       ekstern_utsteder, ekstern_id)
    -- ingen brukbar passord-hash: kontoen har ingen lokal innlogging
    VALUES (navninn, lower(epostinn), 'person', 'ekstern:ingen', tenantid,
            utsteder, eksternid)
    RETURNING brukere.id, brukere.navn, brukere.rolle INTO funnet;
  RETURN QUERY SELECT funnet.id, funnet.navn, funnet.rolle, 'opprettet'::text;
END $$;
GRANT EXECUTE ON FUNCTION oidc_koble_bruker(uuid, text, text, text, text) TO livsarkiv_app;

-- ── state/nonce: engangs, kortlevd, tenant-bundet ──
-- I databasen og ikke i en cookie, fordi den må kunne SLETTES ved innløsning.
-- En state som kan brukes to ganger, er en state som kan spilles av på nytt.
CREATE TABLE oidc_forsok (
  state          text PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES tenanter(id) ON DELETE CASCADE,
  nonce          text NOT NULL,
  kode_verifier  text NOT NULL,       -- PKCE
  utloper        timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
ALTER TABLE oidc_forsok ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION oidc_start_forsok(
    statein text, tenantid uuid, noncein text, verifierin text) RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO oidc_forsok (state, tenant_id, nonce, kode_verifier)
  VALUES (statein, tenantid, noncein, verifierin)
$$;
GRANT EXECUTE ON FUNCTION oidc_start_forsok(text, uuid, text, text) TO livsarkiv_app;

-- Innløsning SLETTER raden og returnerer den. Én runde, aldri to.
CREATE OR REPLACE FUNCTION oidc_los_inn_forsok(statein text)
  RETURNS TABLE (tenant_id uuid, nonce text, kode_verifier text)
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM oidc_forsok f
   WHERE f.state = statein AND f.utloper > now()
  RETURNING f.tenant_id, f.nonce, f.kode_verifier
$$;
GRANT EXECUTE ON FUNCTION oidc_los_inn_forsok(text) TO livsarkiv_app;

-- Rydding av forsøk ingen fullførte.
CREATE OR REPLACE FUNCTION oidc_rydd() RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE antall integer;
BEGIN
  DELETE FROM oidc_forsok WHERE utloper <= now();
  GET DIAGNOSTICS antall = ROW_COUNT;
  RETURN antall;
END $$;
GRANT EXECUTE ON FUNCTION oidc_rydd() TO livsarkiv_app;
