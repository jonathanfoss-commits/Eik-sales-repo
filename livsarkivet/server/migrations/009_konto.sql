-- Dataportabilitet og sletterett (GDPR art. 15, 17 og 20).
--
-- To ting måtte til:
-- 1. Fremmednøkler som pekte på brukere UTEN slettehandling blokkerte sletting
--    av en konto som var kontakt i et annet hvelv, eller saksbehandler på en
--    sak. De løsnes til SET NULL (saken beholder historikken, personen løsnes)
--    eller CASCADE (eierens eget hvelv følger kontoen).
-- 2. App-rollen har bevisst ingen DELETE på brukere eller hvelv — slettingen
--    skjer i slett_konto(), som er SECURITY DEFINER og bare kan slette DEN
--    innloggede brukeren.
--
-- Revisjonsloggen har med hensikt ingen fremmednøkler: den overlever
-- slettingen, og inneholder aldri innhold — bare at kontoen ble slettet.

ALTER TABLE hvelv DROP CONSTRAINT hvelv_eier_id_fkey;
ALTER TABLE hvelv ADD CONSTRAINT hvelv_eier_id_fkey
  FOREIGN KEY (eier_id) REFERENCES brukere(id) ON DELETE CASCADE;

ALTER TABLE kontakter DROP CONSTRAINT kontakter_bruker_id_fkey;
ALTER TABLE kontakter ADD CONSTRAINT kontakter_bruker_id_fkey
  FOREIGN KEY (bruker_id) REFERENCES brukere(id) ON DELETE SET NULL;

ALTER TABLE invitasjoner DROP CONSTRAINT invitasjoner_brukt_av_fkey;
ALTER TABLE invitasjoner ADD CONSTRAINT invitasjoner_brukt_av_fkey
  FOREIGN KEY (brukt_av) REFERENCES brukere(id) ON DELETE SET NULL;

ALTER TABLE attester DROP CONSTRAINT attester_vurdert_av_fkey;
ALTER TABLE attester ADD CONSTRAINT attester_vurdert_av_fkey
  FOREIGN KEY (vurdert_av) REFERENCES brukere(id) ON DELETE SET NULL;

-- Saksbehandlerne kan slettes uten å rive sakshistorikken. Fire-øyne-vakten
-- tåler NULL (CHECK-en evaluerer til NULL, ikke usant), og hvem som godkjente
-- står varig i revisjonsloggen.
ALTER TABLE frigivelser DROP CONSTRAINT frigivelser_godkjent_1_av_fkey;
ALTER TABLE frigivelser ADD CONSTRAINT frigivelser_godkjent_1_av_fkey
  FOREIGN KEY (godkjent_1_av) REFERENCES brukere(id) ON DELETE SET NULL;
ALTER TABLE frigivelser DROP CONSTRAINT frigivelser_godkjent_2_av_fkey;
ALTER TABLE frigivelser ADD CONSTRAINT frigivelser_godkjent_2_av_fkey
  FOREIGN KEY (godkjent_2_av) REFERENCES brukere(id) ON DELETE SET NULL;
ALTER TABLE frigivelser DROP CONSTRAINT frigivelser_blokkert_av_fkey;
ALTER TABLE frigivelser ADD CONSTRAINT frigivelser_blokkert_av_fkey
  FOREIGN KEY (blokkert_av) REFERENCES brukere(id) ON DELETE SET NULL;

-- Sletter kontoen til den INNLOGGEDE brukeren og alt hen eier. Kaskadene tar
-- hvelvet med elementer, kontakter, matrise, hendelser, frigivelser,
-- varslinger, kryptonøkler og nøkkeldeponi — pluss sesjoner, abonnement,
-- eget nøkkelpar og nullstillingskoder.
CREATE OR REPLACE FUNCTION slett_konto() RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE meg uuid;
BEGIN
  meg := gjeldende_bruker();
  IF meg IS NULL THEN
    RAISE EXCEPTION 'ingen innlogget bruker å slette';
  END IF;
  -- siste spor: overlever slettingen, bærer ingen personopplysninger utover id
  INSERT INTO revisjon (bruker_id, rolle, hvelv_id, hendelse, detaljer)
    SELECT meg, gjeldende_rolle(), h.id, 'konto_slettet', '{}'::jsonb
      FROM hvelv h WHERE h.eier_id = meg
    UNION ALL
    SELECT meg, gjeldende_rolle(), NULL, 'konto_slettet', '{}'::jsonb
      WHERE NOT EXISTS (SELECT 1 FROM hvelv WHERE eier_id = meg);
  DELETE FROM hvelv WHERE eier_id = meg;
  DELETE FROM brukere WHERE id = meg;
END $$;

GRANT EXECUTE ON FUNCTION slett_konto() TO livsarkiv_app;
