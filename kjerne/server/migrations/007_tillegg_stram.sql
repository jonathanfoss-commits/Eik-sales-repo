-- Nattens gransking: tillegg_endre stolte på app-laget. WITH CHECK var kun
-- org-sjekk, så eieren (ansatt) kunne via direkte UPDATE sette
-- status = 'fakturert' eller flytte raden til en annen bruker_id.
-- Nå håndhever databasen selv at «kun ledelsen fakturerer»: en ansatt kan
-- bare endre egne rader, og bare så lenge raden forblir 'registrert'.
DROP POLICY tillegg_endre ON tillegg;
CREATE POLICY tillegg_endre ON tillegg FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND (bruker_id = gjeldende_bruker() OR er_ledelse()))
  WITH CHECK (org_id = gjeldende_org()
    AND (er_ledelse()
      OR (bruker_id = gjeldende_bruker() AND status = 'registrert')));
