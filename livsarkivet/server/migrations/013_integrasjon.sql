-- Integrasjonsflaten: API-nøkler og webhooks per selskap.
--
-- Dette er det IT-arkitekten hos et forsikringsselskap spør om i første møte:
-- «hvordan får systemene våre vite at en kunde er død, og hvordan henter vi
-- polisenummeret?»
--
-- To designvalg som gjennomsyrer filen:
--
-- 1. WEBHOOKEN BÆRER INGEN PERSONOPPLYSNINGER. Den sier «sak <id> er frigitt»,
--    og selskapet henter feltene med nøkkelen sin. Grunnen er ikke pedanteri:
--    henter de dem, sjekkes `trukket_tid` på nytt hver gang. Hadde vi sendt
--    verdiene i nyttelasten, ville et tilbaketrekk vært virkningsløst mot en
--    kopi som allerede lå i selskapets kø.
--
-- 2. VI VARSLER FØRST VED FRIGITT — aldri når karenstiden STARTER. I karenstiden
--    kan eieren fortsatt stoppe alt (hen lever). Varsler vi selskapet da, kan
--    en utbetaling være i gang før nødbremsen er brukt, og da må vi «avvarsle».
--    Et dødsbudskap er ikke noe man trekker tilbake med en PATCH.

-- ── API-nøkler ──
-- Tabellen har INGEN policy og ingen grant til app-rollen: oppslaget skjer før
-- vi vet hvem den som ringer er, så det kan ikke gå gjennom person-skopet RLS.
-- I stedet én SECURITY DEFINER-funksjon som tar imot en hash og gir tilbake
-- nøyaktig det autentiseringen trenger.
CREATE TABLE api_nokler (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES tenanter(id) ON DELETE CASCADE,
  navn             text NOT NULL,
  -- kun hashen lagres, som for sesjonstokener og invitasjonskoder
  nokkel_hash      text NOT NULL UNIQUE,
  -- de første tegnene i klartekst, så drift kan se HVILKEN nøkkel uten å ha den
  prefiks          text NOT NULL,
  omfang           text[] NOT NULL DEFAULT ARRAY['saker:les'],
  sist_brukt       timestamptz,
  opprettet        timestamptz NOT NULL DEFAULT now(),
  tilbaketrukket   timestamptz
);
ALTER TABLE api_nokler ENABLE ROW LEVEL SECURITY;   -- ingen policy = ingen tilgang

CREATE OR REPLACE FUNCTION finn_api_nokkel(hash text)
  RETURNS TABLE (nokkel_id uuid, tenant_id uuid, omfang text[])
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT n.id, n.tenant_id, n.omfang FROM api_nokler n
   WHERE n.nokkel_hash = hash AND n.tilbaketrukket IS NULL
$$;
GRANT EXECUTE ON FUNCTION finn_api_nokkel(text) TO livsarkiv_app;

CREATE OR REPLACE FUNCTION merk_nokkel_brukt(nokkelid uuid) RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE api_nokler SET sist_brukt = now() WHERE id = nokkelid
$$;
GRANT EXECUTE ON FUNCTION merk_nokkel_brukt(uuid) TO livsarkiv_app;

-- ── Webhooks ──
CREATE TABLE webhook_endepunkter (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL REFERENCES tenanter(id) ON DELETE CASCADE,
  -- https ut av maskinen, alltid. Loopback er unntatt fordi det aldri forlater
  -- verten (integrasjonstester, og et eventuelt lokalt mellomledd hos drift) —
  -- og fordi nyttelasten uansett ikke bærer personopplysninger.
  url        text NOT NULL CHECK (url LIKE 'https://%'
               OR url LIKE 'http://127.0.0.1:%' OR url LIKE 'http://localhost:%'),
  -- HMAC-nøkkel: selskapet verifiserer at kallet kom fra oss
  hemmelighet text NOT NULL,
  aktiv      boolean NOT NULL DEFAULT true,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE webhook_endepunkter ENABLE ROW LEVEL SECURITY;  -- kun drift, via eier

-- Utsendingskø med samme holdbarhet som varslinger (CLAUDE.md punkt 8):
-- raden legges i kø i SAMME transaksjon som tilstandsendringen. Rulles
-- frigivelsen tilbake, forsvinner webhooken — det finnes aldri en utsending
-- om noe som ikke skjedde.
CREATE TABLE webhook_utsendinger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endepunkt_id  uuid NOT NULL REFERENCES webhook_endepunkter(id) ON DELETE CASCADE,
  hendelse      text NOT NULL,
  -- ALDRI personopplysninger: kun sak-id og tidspunkt. Se toppen av filen.
  nyttelast     jsonb NOT NULL,
  forsok        integer NOT NULL DEFAULT 0,
  neste_forsok  timestamptz NOT NULL DEFAULT now(),
  sendt_tid     timestamptz,
  siste_feil    text,
  opprettet     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE webhook_utsendinger ENABLE ROW LEVEL SECURITY;
CREATE INDEX webhook_utsendinger_koe ON webhook_utsendinger (neste_forsok)
  WHERE sendt_tid IS NULL;

-- Legg i kø. Kalles fra frigivelsestransaksjonen, som ko_varsler.
CREATE OR REPLACE FUNCTION ko_webhooks(hvelvid uuid, frigivelseid uuid, htype text)
  RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE antall integer;
BEGIN
  IF gjeldende_rolle() NOT IN ('system', 'admin') THEN
    RAISE EXCEPTION 'kun system eller saksbehandler kan utløse webhooks';
  END IF;
  INSERT INTO webhook_utsendinger (endepunkt_id, hendelse, nyttelast)
    SELECT e.id, htype,
           jsonb_build_object('hendelse', htype, 'sak_id', frigivelseid,
                              'tidspunkt', to_char(now() AT TIME ZONE 'UTC',
                                'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      FROM webhook_endepunkter e
     WHERE e.aktiv AND e.tenant_id = tenant_av_hvelv(hvelvid);
  GET DIAGNOSTICS antall = ROW_COUNT;
  RETURN antall;
END $$;
GRANT EXECUTE ON FUNCTION ko_webhooks(uuid, uuid, text) TO livsarkiv_app;

-- Utsendingspasseringen: klar til forsøk, med det den trenger for å signere.
CREATE OR REPLACE FUNCTION utestaaende_webhooks(maks integer)
  RETURNS TABLE (id uuid, url text, hemmelighet text, nyttelast jsonb, forsok integer)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, e.url, e.hemmelighet, u.nyttelast, u.forsok
    FROM webhook_utsendinger u JOIN webhook_endepunkter e ON e.id = u.endepunkt_id
   WHERE u.sendt_tid IS NULL AND u.neste_forsok <= now() AND e.aktiv
     AND gjeldende_rolle() = 'system'
   ORDER BY u.neste_forsok
   LIMIT maks
$$;
GRANT EXECUTE ON FUNCTION utestaaende_webhooks(integer) TO livsarkiv_app;

-- Resultatet av et forsøk. Eksponentiell tilbaketrekning: 1, 2, 4 … minutter,
-- taket er ~4 timer. Etter 12 forsøk (godt over et døgn) blir raden liggende
-- usendt som spor — den slettes ikke, for da mister drift beviset på at
-- selskapets endepunkt var nede.
CREATE OR REPLACE FUNCTION webhook_resultat(utsendingid uuid, vellykket boolean, feil text)
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF gjeldende_rolle() <> 'system' THEN
    RAISE EXCEPTION 'kun system kan kvittere for webhook-utsending';
  END IF;
  IF vellykket THEN
    UPDATE webhook_utsendinger SET sendt_tid = now(), siste_feil = NULL
     WHERE id = utsendingid;
  ELSE
    UPDATE webhook_utsendinger
       SET forsok = forsok + 1, siste_feil = left(feil, 500),
           neste_forsok = now() + (LEAST(power(2, forsok), 240) || ' minutes')::interval
     WHERE id = utsendingid AND forsok < 12;
  END IF;
END $$;
GRANT EXECUTE ON FUNCTION webhook_resultat(uuid, boolean, text) TO livsarkiv_app;

-- ── Selskapets lesetilgang ──
-- Nøkkelen gir ikke en bruker-identitet, så person-skopet RLS har ingenting å
-- gripe fatt i. Én funksjon som tar tenant_id fra den autentiserte nøkkelen og
-- gir nøyaktig det selskapet skal se: sine EGNE frigitte saker, og kun de
-- feltene kunden AKTIVT deler og ikke har trukket.
CREATE OR REPLACE FUNCTION selskapssak(tenantid uuid, frigivelseid uuid)
  RETURNS TABLE (sak_id uuid, status text, frigitt_tid timestamptz,
                 felttype text, verdi text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.status, f.frigitt_tid, d.felttype, d.verdi
    FROM frigivelser f
    JOIN hvelv h ON h.id = f.hvelv_id
    JOIN brukere b ON b.id = h.eier_id
    LEFT JOIN selskapsdeling d ON d.hvelv_id = f.hvelv_id AND d.trukket_tid IS NULL
   WHERE f.id = frigivelseid
     AND b.tenant_id = tenantid
     AND f.status = 'frigitt'
$$;
GRANT EXECUTE ON FUNCTION selskapssak(uuid, uuid) TO livsarkiv_app;

CREATE OR REPLACE FUNCTION selskapssaker(tenantid uuid, maks integer)
  RETURNS TABLE (sak_id uuid, frigitt_tid timestamptz)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.frigitt_tid
    FROM frigivelser f
    JOIN hvelv h ON h.id = f.hvelv_id
    JOIN brukere b ON b.id = h.eier_id
   WHERE b.tenant_id = tenantid AND f.status = 'frigitt'
   ORDER BY f.frigitt_tid DESC NULLS LAST
   LIMIT maks
$$;
GRANT EXECUTE ON FUNCTION selskapssaker(uuid, integer) TO livsarkiv_app;
