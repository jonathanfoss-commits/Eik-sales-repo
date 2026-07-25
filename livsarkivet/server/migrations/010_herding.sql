-- Herding før lansering (funn i sikkerhetsgjennomgangen).
--
-- 1. Attester kunne lastes opp med VILKÅRLIG MIME-type, og ble servert til
--    saksbehandleren med «Content-Disposition: inline» og den typen. En betrodd
--    kontakt — en halvt betrodd utenforstående — kunne dermed få HTML til å
--    kjøre som en side på vårt eget domene, foran øynene til den som skal
--    godkjenne en frigivelse. Nå er tillatte typer en CHECK i databasen, slik
--    at grensen holder også om applikasjonslaget skulle svikte.
-- 2. Lengdegrenser på hvelvinnhold: uten dem kunne én bruker fylle basen.

ALTER TABLE attester ADD CONSTRAINT attest_mime_tillatt
  CHECK (mime IN ('application/pdf', 'image/jpeg', 'image/png', 'image/heic'));

ALTER TABLE hvelv_elementer
  ADD CONSTRAINT element_tittel_lengde CHECK (length(tittel) <= 200),
  -- 200 000 tegn er rikelig for et hvelvelement, og chiffertekst er ~1,4x
  -- klartekst, så grensen rammer ikke sensitivt innhold i praksis
  ADD CONSTRAINT element_innhold_lengde CHECK (length(innhold) <= 200000);
