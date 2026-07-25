-- Herding før lansering (funn i sikkerhetsgjennomgangen).
--
-- 1. Attester kunne lastes opp med VILKÅRLIG MIME-type, og ble servert til
--    saksbehandleren med «Content-Disposition: inline» og den typen. En betrodd
--    kontakt — en halvt betrodd utenforstående — kunne dermed få HTML til å
--    kjøre som en side på vårt eget domene, foran øynene til den som skal
--    godkjenne en frigivelse. Nå er tillatte typer en CHECK i databasen, slik
--    at grensen holder også om applikasjonslaget skulle svikte.
-- 2. Lengdegrenser på hvelvinnhold: uten dem kunne én bruker fylle basen.

-- Miljøer som har kjørt med hullet kan ALLEREDE ha ugyldige attester (det hadde
-- testmiljøet vårt). Uten opprydding først ville ALTER TABLE feilet midt i en
-- deploy. Radene fjernes — en HTML-fil er ikke bevis for et dødsfall, og at en
-- attest ble mottatt står uansett varig i revisjonsloggen.
DO $$
DECLARE antall integer;
BEGIN
  DELETE FROM attester
   WHERE mime NOT IN ('application/pdf', 'image/jpeg', 'image/png', 'image/heic');
  GET DIAGNOSTICS antall = ROW_COUNT;
  IF antall > 0 THEN
    RAISE NOTICE 'Fjernet % attest(er) med ulovlig MIME-type før innstramming', antall;
  END IF;
END $$;

ALTER TABLE attester ADD CONSTRAINT attest_mime_tillatt
  CHECK (mime IN ('application/pdf', 'image/jpeg', 'image/png', 'image/heic'));

-- Samme forsiktighet for lengdegrensene: kutt det som alt er for langt, slik at
-- innstrammingen ikke stopper en deploy. (I praksis finnes ikke slike rader —
-- men en migrasjon skal ikke ANTA noe om dataene den møter.)
UPDATE hvelv_elementer SET tittel = left(tittel, 200) WHERE length(tittel) > 200;
UPDATE hvelv_elementer SET innhold = left(innhold, 200000) WHERE length(innhold) > 200000;

ALTER TABLE hvelv_elementer
  ADD CONSTRAINT element_tittel_lengde CHECK (length(tittel) <= 200),
  -- 200 000 tegn er rikelig for et hvelvelement, og chiffertekst er ~1,4x
  -- klartekst, så grensen rammer ikke sensitivt innhold i praksis
  ADD CONSTRAINT element_innhold_lengde CHECK (length(innhold) <= 200000);
