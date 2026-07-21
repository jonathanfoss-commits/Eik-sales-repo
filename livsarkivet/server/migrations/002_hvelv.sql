-- Hvelvdomenet: hvelv, hvelv_elementer, kontakter, mottakermatrise.
--
-- RLS-policyene på disse tabellene refererer hverandre (eier-sjekk går via
-- hvelv, betrodd-sjekk via kontakter). Direkte kryssreferanser i policyer gir
-- uendelig rekursjon i Postgres — derfor små SECURITY DEFINER-oppslag som
-- kjører som tabelleier (uten FORCE RLS er eieren unntatt policyene).

CREATE TABLE hvelv (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eier_id    uuid NOT NULL UNIQUE REFERENCES brukere(id),
  versjon    integer NOT NULL DEFAULT 1,
  opprettet  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kontakter (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hvelv_id    uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  navn        text NOT NULL,
  epost       text NOT NULL,
  telefon     text,
  relasjon    text,
  er_betrodd  boolean NOT NULL DEFAULT false,  -- betrodd = kan melde dødsfall
  bruker_id   uuid REFERENCES brukere(id),     -- kobles ved invitasjonsinnløsning
  versjon     integer NOT NULL DEFAULT 1,
  opprettet   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hvelv_id, epost)
);

CREATE TABLE hvelv_elementer (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hvelv_id   uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  kategori   text NOT NULL CHECK (kategori IN ('juridisk', 'forsikring', 'eiendeler',
               'digitale_kontoer', 'tilgangsinfo', 'praktisk', 'helsedirektiv', 'siste_hilsen')),
  nivaa      text NOT NULL DEFAULT 'privat' CHECK (nivaa IN ('delt', 'privat', 'sensitiv')),
  tittel     text NOT NULL,
  innhold    text NOT NULL DEFAULT '',
  -- Krypto-klar (ADR-001): sensitiv-tier aktiveres i egen PR uten skjemaendring.
  kryptert   boolean NOT NULL DEFAULT false,
  nokkel_ref text,
  klient_id  text,                             -- offline-idempotens
  versjon    integer NOT NULL DEFAULT 1,       -- optimistisk lås
  opprettet  timestamptz NOT NULL DEFAULT now(),
  endret     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX hvelv_elementer_klient ON hvelv_elementer (hvelv_id, klient_id)
  WHERE klient_id IS NOT NULL;

CREATE TABLE mottakermatrise (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_id     uuid NOT NULL REFERENCES hvelv_elementer(id) ON DELETE CASCADE,
  kontakt_id     uuid NOT NULL REFERENCES kontakter(id) ON DELETE CASCADE,
  hendelse_type  text NOT NULL DEFAULT 'dodsfall' CHECK (hendelse_type IN ('dodsfall', 'helsesvikt')),
  opprettet      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (element_id, kontakt_id, hendelse_type)
);

-- ── SECURITY DEFINER-oppslag (rekursjonsfrie policy-byggeklosser) ──
CREATE OR REPLACE FUNCTION eier_av(hvelvid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT eier_id FROM hvelv WHERE id = hvelvid $$;

CREATE OR REPLACE FUNCTION er_betrodd_i(hvelvid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (SELECT 1 FROM kontakter
    WHERE hvelv_id = hvelvid AND bruker_id = gjeldende_bruker() AND er_betrodd) $$;

CREATE OR REPLACE FUNCTION er_kontakt_i(hvelvid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (SELECT 1 FROM kontakter
    WHERE hvelv_id = hvelvid AND bruker_id = gjeldende_bruker()) $$;

CREATE OR REPLACE FUNCTION hvelv_av_element(elementid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT hvelv_id FROM hvelv_elementer WHERE id = elementid $$;

CREATE OR REPLACE FUNCTION hvelv_av_kontakt(kontaktid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT hvelv_id FROM kontakter WHERE id = kontaktid $$;

-- ── hvelv: eier alt; kontakter i hvelvet ser at det finnes (betrodde for å
--    kunne melde, mottakere for etterlattevisningen — aldri innholdet) ──
ALTER TABLE hvelv ENABLE ROW LEVEL SECURITY;
CREATE POLICY hvelv_les ON hvelv FOR SELECT TO livsarkiv_app
  USING (eier_id = gjeldende_bruker() OR er_kontakt_i(id));
CREATE POLICY hvelv_opprett ON hvelv FOR INSERT TO livsarkiv_app
  WITH CHECK (eier_id = gjeldende_bruker());
CREATE POLICY hvelv_endre ON hvelv FOR UPDATE TO livsarkiv_app
  USING (eier_id = gjeldende_bruker()) WITH CHECK (eier_id = gjeldende_bruker());
GRANT SELECT, INSERT, UPDATE ON hvelv TO livsarkiv_app;

-- Kontakter i et hvelv får se eierens navn (trengs i meldings- og etterlatte-
-- flatene). Admin har fortsatt ingen vei inn i brukere.
CREATE POLICY brukere_eiernavn ON brukere FOR SELECT TO livsarkiv_app
  USING (EXISTS (SELECT 1 FROM hvelv h WHERE h.eier_id = brukere.id AND er_kontakt_i(h.id)));

-- ── kontakter: eier styrer; kontakten ser sin egen rad; admin ser metadata
--    (melder-identitet i verifiseringskøen); system kobler bruker_id ved
--    invitasjonsinnløsning ──
ALTER TABLE kontakter ENABLE ROW LEVEL SECURITY;
CREATE POLICY kontakter_eier ON kontakter FOR ALL TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker())
  WITH CHECK (eier_av(hvelv_id) = gjeldende_bruker());
CREATE POLICY kontakter_selv ON kontakter FOR SELECT TO livsarkiv_app
  USING (bruker_id = gjeldende_bruker());
CREATE POLICY kontakter_admin ON kontakter FOR SELECT TO livsarkiv_app
  USING (er_admin());
-- System trenger SELECT i tillegg til UPDATE: en UPDATE med WHERE på kolonner
-- krever at radene også passerer en SELECT-policy (Postgres-regel).
CREATE POLICY kontakter_system_les ON kontakter FOR SELECT TO livsarkiv_app
  USING (gjeldende_rolle() = 'system');
CREATE POLICY kontakter_system_endre ON kontakter FOR UPDATE TO livsarkiv_app
  USING (gjeldende_rolle() = 'system') WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT, UPDATE, DELETE ON kontakter TO livsarkiv_app;

-- ── hvelv_elementer: KUN eier. Mottaker-policyen (frigivelses-portet lesing)
--    legges på i migrasjon 003 når frigivelser finnes. Admin har INGEN policy —
--    «admin kan aldri lese hvelvinnhold» er strukturelt. ──
ALTER TABLE hvelv_elementer ENABLE ROW LEVEL SECURITY;
CREATE POLICY elementer_eier ON hvelv_elementer FOR ALL TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker())
  WITH CHECK (eier_av(hvelv_id) = gjeldende_bruker());
GRANT SELECT, INSERT, UPDATE, DELETE ON hvelv_elementer TO livsarkiv_app;

-- ── mottakermatrise: kun eier. Mottakere leser aldri matrisen — de leser
--    frigitte elementer. WITH CHECK låser kontakt og element til samme hvelv. ──
ALTER TABLE mottakermatrise ENABLE ROW LEVEL SECURITY;
CREATE POLICY matrise_eier ON mottakermatrise FOR ALL TO livsarkiv_app
  USING (eier_av(hvelv_av_element(element_id)) = gjeldende_bruker())
  WITH CHECK (eier_av(hvelv_av_element(element_id)) = gjeldende_bruker()
              AND hvelv_av_element(element_id) = hvelv_av_kontakt(kontakt_id));
GRANT SELECT, INSERT, DELETE ON mottakermatrise TO livsarkiv_app;

-- ── invitasjoner: nå som kontakter finnes — FK + eier-policy ──
ALTER TABLE invitasjoner
  ADD CONSTRAINT invitasjoner_kontakt_fk
  FOREIGN KEY (kontakt_id) REFERENCES kontakter(id) ON DELETE CASCADE;
CREATE POLICY invitasjoner_eier ON invitasjoner FOR ALL TO livsarkiv_app
  USING (kontakt_id IS NOT NULL AND eier_av(hvelv_av_kontakt(kontakt_id)) = gjeldende_bruker())
  WITH CHECK (kontakt_id IS NOT NULL AND eier_av(hvelv_av_kontakt(kontakt_id)) = gjeldende_bruker());

-- ── revisjon: eier leser loggen for eget hvelv ──
CREATE POLICY revisjon_les_eier ON revisjon FOR SELECT TO livsarkiv_app
  USING (hvelv_id IS NOT NULL AND eier_av(hvelv_id) = gjeldende_bruker());
