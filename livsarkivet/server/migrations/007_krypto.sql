-- Zero-knowledge sensitiv-tier (ADR-001, godkjent): serveren lagrer KUN
-- pakkede nøkler og chiffertekst. Ingen tabell her inneholder noe som kan
-- dekrypteres uten eierens sikkerhetsfrase, eierens gjenopprettingskode
-- (del A — finnes aldri på serveren) eller mottakerens frase.

-- Eierens hvelvnøkkel, frasepakket + gjenopprettingspakket (del B av
-- gjenopprettingsnøkkelen ligger her; del A vises eieren én gang).
CREATE TABLE hvelv_kryptonokler (
  hvelv_id              uuid PRIMARY KEY REFERENCES hvelv(id) ON DELETE CASCADE,
  salt                  text NOT NULL,
  iterasjoner           integer NOT NULL,
  hvelvnokkel_pakket    jsonb NOT NULL,
  gjenoppretting_pakket jsonb NOT NULL,
  gjenoppretting_del_b  text NOT NULL,
  opprettet             timestamptz NOT NULL DEFAULT now(),
  oppdatert             timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hvelv_kryptonokler ENABLE ROW LEVEL SECURITY;
CREATE POLICY hvelv_kryptonokler_eier ON hvelv_kryptonokler FOR ALL TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker())
  WITH CHECK (eier_av(hvelv_id) = gjeldende_bruker());
GRANT SELECT, INSERT, UPDATE ON hvelv_kryptonokler TO livsarkiv_app;

-- Mottakernes nøkkelpar: offentlig del + frasepakket privat del.
CREATE TABLE bruker_nokler (
  bruker_id     uuid PRIMARY KEY REFERENCES brukere(id) ON DELETE CASCADE,
  offentlig     jsonb NOT NULL,
  salt          text NOT NULL,
  iterasjoner   integer NOT NULL,
  privat_pakket jsonb NOT NULL,
  opprettet     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bruker_nokler ENABLE ROW LEVEL SECURITY;
-- egen rad: alt; andres rad: alle innloggede kan lese (offentlig del er
-- offentlig; privat del er frasepakket og ubrukelig uten frasen)
CREATE POLICY bruker_nokler_selv ON bruker_nokler FOR ALL TO livsarkiv_app
  USING (bruker_id = gjeldende_bruker())
  WITH CHECK (bruker_id = gjeldende_bruker());
CREATE POLICY bruker_nokler_les ON bruker_nokler FOR SELECT TO livsarkiv_app
  USING (true);
GRANT SELECT, INSERT, UPDATE ON bruker_nokler TO livsarkiv_app;

-- Nøkkeldeponiet: elementnøkkelen pakket til mottakerens offentlige nøkkel.
-- Følger matriseraden (kaskade) og frigis gjennom SAMME port som innholdet.
CREATE TABLE element_nokkeldeponi (
  matrise_id  uuid PRIMARY KEY REFERENCES mottakermatrise(id) ON DELETE CASCADE,
  pakket      text NOT NULL,
  opprettet   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE element_nokkeldeponi ENABLE ROW LEVEL SECURITY;
CREATE POLICY nokkeldeponi_eier ON element_nokkeldeponi FOR ALL TO livsarkiv_app
  USING (EXISTS (SELECT 1 FROM mottakermatrise m
           WHERE m.id = matrise_id AND eier_av(hvelv_av_element(m.element_id)) = gjeldende_bruker()))
  WITH CHECK (EXISTS (SELECT 1 FROM mottakermatrise m
           WHERE m.id = matrise_id AND eier_av(hvelv_av_element(m.element_id)) = gjeldende_bruker()));
GRANT SELECT, INSERT, UPDATE, DELETE ON element_nokkeldeponi TO livsarkiv_app;

-- Mottakerens vei til deponiet: SECURITY DEFINER med frigivelsesporten
-- INNEBYGD (mottakere har ingen egen SELECT-policy — matriseradene er
-- eierens, og nestet RLS ville uansett stengt et policy-uttrykk).
CREATE OR REPLACE FUNCTION deponi_for_meg(elementid uuid) RETURNS text
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT d.pakket FROM element_nokkeldeponi d
          JOIN mottakermatrise m ON m.id = d.matrise_id
          JOIN kontakter k ON k.id = m.kontakt_id
         WHERE m.element_id = elementid AND k.bruker_id = gjeldende_bruker()
           AND element_frigitt_for_meg(elementid)
         LIMIT 1 $$;

-- Sensitivt innhold SKAL være kryptert — også om applikasjonslaget skulle feile.
ALTER TABLE hvelv_elementer
  ADD CONSTRAINT sensitiv_krever_kryptering CHECK (nivaa <> 'sensitiv' OR kryptert);

-- Mottaker-policyen fra 003 ekskluderer sensitiv — nå som sensitiv frigis
-- kryptert gjennom deponiet, byttes den: mottaker ser frigitte elementer,
-- sensitive inkludert (innholdet er chiffertekst uten deponinøkkelen).
DROP POLICY elementer_mottaker ON hvelv_elementer;
CREATE POLICY elementer_mottaker ON hvelv_elementer FOR SELECT TO livsarkiv_app
  USING (element_frigitt_for_meg(id));
