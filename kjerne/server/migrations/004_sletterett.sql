-- Funn fra sikkerhetsgjennomgangen: GDPR-slettingen av en ANNEN bruker
-- (admin sletter sluttet/avdød ansatt) traff 0 timerader — timer_slett-policyen
-- krever eierskap, så slettingen ble stille no-op og de private dataene besto.
--
-- Løsning: SECURITY DEFINER-funksjon låst til gjeldende org. Den sletter kun
-- den angitte brukerens private data i egen organisasjon — og bare når kallet
-- kommer fra brukeren selv eller en admin (sjekket i funksjonen, i tillegg til
-- API-laget). Returnerer antall slettede rader så kvitteringen kan være ærlig.
CREATE OR REPLACE FUNCTION slett_brukerdata(maal_bruker uuid) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  antall integer;
BEGIN
  IF gjeldende_org() IS NULL THEN
    RAISE EXCEPTION 'slett_brukerdata krever org-kontekst';
  END IF;
  IF maal_bruker <> gjeldende_bruker() AND gjeldende_rolle() <> 'admin' THEN
    RAISE EXCEPTION 'kun administrator kan slette andres data';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM brukere
                  WHERE id = maal_bruker AND org_id = gjeldende_org()) THEN
    RAISE EXCEPTION 'brukeren finnes ikke i denne organisasjonen';
  END IF;
  DELETE FROM timeforinger WHERE bruker_id = maal_bruker AND org_id = gjeldende_org();
  GET DIAGNOSTICS antall = ROW_COUNT;
  UPDATE innspill SET bruker_id = NULL WHERE bruker_id = maal_bruker AND org_id = gjeldende_org();
  RETURN antall;
END $$;
REVOKE ALL ON FUNCTION slett_brukerdata(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION slett_brukerdata(uuid) TO plattform_app;
