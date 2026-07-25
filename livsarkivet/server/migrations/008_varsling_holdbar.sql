-- Holdbar varsling (funn i nivå 6-feilinjeksjon): varslingsradene MÅ skrives i
-- samme transaksjon som tilstandsendringen.
--
-- Før: tilstanden ble committet, og varsleAlle kjørte etterpå i egen
-- transaksjon. Døde prosessen i mellomtiden, ble INGEN varslet — og ingenting
-- prøvde på nytt, siden frigivelsen alt sto i en terminal tilstand. Det bryter
-- det ufravikelige kravet om varsel ved ethvert frigivelsesforsøk.
--
-- Nå: ko_varsler() legger radene i kø innenfor kallerens transaksjon (SECURITY
-- DEFINER, fordi en betrodd kontakt bare ser sin egen kontaktrad gjennom RLS,
-- men varselet skal nå eieren og ALLE kontaktene). Utsending er en separat,
-- gjentakbar passering over rader med sendt_tid IS NULL — krasj under
-- e-postsending mister derfor ingenting.

CREATE OR REPLACE FUNCTION ko_varsler(hvelvid uuid, hendelseid uuid, vtype text)
  RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE antall integer;
BEGIN
  -- Vaktpost: bare de som hører til saken (eller admin/system) kan legge
  -- varsler i kø — funksjonen omgår RLS, så tilgangen sjekkes eksplisitt.
  IF NOT (gjeldende_rolle() IN ('system', 'admin')
          OR eier_av(hvelvid) = gjeldende_bruker()
          OR er_kontakt_i(hvelvid)) THEN
    RAISE EXCEPTION 'ingen tilgang til å varsle for dette hvelvet';
  END IF;

  INSERT INTO varslinger (hvelv_id, hendelse_id, kontakt_id, bruker_id, kanal, type)
    SELECT hvelvid, hendelseid, NULL, h.eier_id, 'epost', vtype
      FROM hvelv h WHERE h.id = hvelvid
    UNION ALL
    SELECT hvelvid, hendelseid, k.id, NULL, 'epost', vtype
      FROM kontakter k WHERE k.hvelv_id = hvelvid;
  GET DIAGNOSTICS antall = ROW_COUNT;
  RETURN antall;
END $$;

GRANT EXECUTE ON FUNCTION ko_varsler(uuid, uuid, text) TO livsarkiv_app;

-- Utsendingspasseringen trenger e-postadressene til køede varsler.
CREATE OR REPLACE FUNCTION usendte_varsler(maks integer)
  RETURNS TABLE (id uuid, epost text, type text)
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, COALESCE(k.epost, b.epost) AS epost, v.type
    FROM varslinger v
    LEFT JOIN kontakter k ON k.id = v.kontakt_id
    LEFT JOIN brukere b ON b.id = v.bruker_id
   WHERE v.sendt_tid IS NULL AND gjeldende_rolle() = 'system'
     AND COALESCE(k.epost, b.epost) IS NOT NULL
   ORDER BY v.opprettet
   LIMIT maks
$$;

GRANT EXECUTE ON FUNCTION usendte_varsler(integer) TO livsarkiv_app;

-- Indeks for utsendingskøen (den spørres ved hver feiing).
CREATE INDEX varslinger_usendte ON varslinger (opprettet) WHERE sendt_tid IS NULL;
