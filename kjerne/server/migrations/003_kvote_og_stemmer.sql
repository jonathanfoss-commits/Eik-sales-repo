-- Rettelser funnet av integrasjonstestene:
--
-- (1) Budsjettsperren: sjekkKvote leste ai_logg gjennom brukerens RLS — og
--     siden kun admin ser radene (SENSITIVT), så en ansatt alltid 0 øre og
--     sperren virket ikke. Aggregatet (én sum for egen org) er ikke sensitivt
--     på radnivå — en SECURITY DEFINER-funksjon låst til gjeldende_org() gir
--     gatewayen summen uten å åpne radene for noen.
CREATE OR REPLACE FUNCTION ai_kost_denne_mnd() RETURNS numeric
  LANGUAGE sql SECURITY DEFINER STABLE
  SET search_path = public AS $$
    SELECT COALESCE(SUM(kost_ore), 0) FROM ai_logg
     WHERE org_id = gjeldende_org()
       AND tid >= date_trunc('month', now())
  $$;
REVOKE ALL ON FUNCTION ai_kost_denne_mnd() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION ai_kost_denne_mnd() TO plattform_app;

-- (2) Godkjenningsstemmer: «én stemme per bruker per versjon» bruker
--     ON CONFLICT DO UPDATE (ombestemmelse skal være lov) — det krever
--     UPDATE-rettighet på egen rad.
CREATE POLICY godkjenninger_endre ON godkjenninger FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker() AND er_ledelse())
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker() AND er_ledelse());
GRANT UPDATE ON godkjenninger TO plattform_app;
