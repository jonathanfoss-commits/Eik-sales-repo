-- Utløsningskjeden: hendelser, bekreftelser, attester, frigivelser, varslinger.
--
-- Trigger-abstraksjonen (ADR-002): en hendelse har en KILDE. Kildene skiller
-- seg kun i hvem som setter inn raden og hvilket bevis som følger med — alt
-- nedstrøms (verifisering, karenstid, frigivelse) er kildeagnostisk. MVP
-- implementerer kun 'manuell'; 'folkeregisteret' og 'dodmannsknapp' er
-- forberedt i enum-en.

CREATE TABLE hendelser (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hvelv_id             uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  type                 text NOT NULL DEFAULT 'dodsfall' CHECK (type IN ('dodsfall', 'helsesvikt')),
  kilde                text NOT NULL DEFAULT 'manuell'
                         CHECK (kilde IN ('manuell', 'folkeregisteret', 'dodmannsknapp')),
  meldt_av_kontakt_id  uuid REFERENCES kontakter(id) ON DELETE SET NULL,
  opprettet            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hendelse_bekreftelser (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hendelse_id uuid NOT NULL REFERENCES hendelser(id) ON DELETE CASCADE,
  kontakt_id  uuid NOT NULL REFERENCES kontakter(id) ON DELETE CASCADE,
  opprettet   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hendelse_id, kontakt_id)
);

-- Attester lagres som bytea i databasen (ADR-004): transaksjonelt, RLS-vernet
-- og med i samme backuphistorie. Objektlagring først når volum krever det.
CREATE TABLE attester (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hendelse_id   uuid NOT NULL REFERENCES hendelser(id) ON DELETE CASCADE,
  filnavn       text NOT NULL,
  mime          text NOT NULL,
  storrelse     integer NOT NULL,
  innhold       bytea NOT NULL,
  -- SET NULL: attesten er bevis og overlever at kontakten slettes (hvem som
  -- lastet opp, står varig i revisjonsloggen)
  lastet_opp_av uuid REFERENCES kontakter(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'mottatt' CHECK (status IN ('mottatt', 'godkjent', 'avvist')),
  vurdert_av    uuid REFERENCES brukere(id),
  vurdert_tid   timestamptz,
  avvist_grunn  text,
  opprettet     timestamptz NOT NULL DEFAULT now()
);

-- Tilstandsmaskinen. Fire-øyne-regelen står OGSÅ som CHECK i databasen:
-- to ulike admin-er, uansett hva applikasjonslaget måtte finne på.
CREATE TABLE frigivelser (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hendelse_id      uuid NOT NULL UNIQUE REFERENCES hendelser(id) ON DELETE CASCADE,
  hvelv_id         uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'meldt' CHECK (status IN
                     ('meldt', 'attest_lastet_opp', 'under_verifisering', 'godkjent_1',
                      'karenstid', 'frigitt', 'avvist', 'blokkert', 'tilbakekalt')),
  godkjent_1_av    uuid REFERENCES brukere(id),
  godkjent_1_tid   timestamptz,
  godkjent_2_av    uuid REFERENCES brukere(id),
  godkjent_2_tid   timestamptz,
  karenstid_start  timestamptz,
  karenstid_slutt  timestamptz,
  blokkert_av      uuid REFERENCES brukere(id),
  blokkert_grunn   text,
  avvist_grunn     text,
  frigitt_tid      timestamptz,
  versjon          integer NOT NULL DEFAULT 1,
  opprettet        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fire_oyne CHECK (godkjent_2_av IS NULL OR godkjent_2_av <> godkjent_1_av),
  CONSTRAINT karenstid_par CHECK ((karenstid_start IS NULL) = (karenstid_slutt IS NULL))
);

-- Varslinger: kanal + type + referanser — ALDRI innhold.
CREATE TABLE varslinger (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hvelv_id    uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  hendelse_id uuid REFERENCES hendelser(id) ON DELETE CASCADE,
  kontakt_id  uuid REFERENCES kontakter(id) ON DELETE CASCADE,
  bruker_id   uuid,                -- eieren, når varselet går til hen
  kanal       text NOT NULL DEFAULT 'epost' CHECK (kanal IN ('epost', 'sms')),
  type        text NOT NULL,
  sendt_tid   timestamptz,
  opprettet   timestamptz NOT NULL DEFAULT now()
);

-- ── SECURITY DEFINER-oppslag ──
CREATE OR REPLACE FUNCTION hvelv_av_hendelse(hendelseid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT hvelv_id FROM hendelser WHERE id = hendelseid $$;

CREATE OR REPLACE FUNCTION kontakt_tilhorer_meg(kontaktid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (SELECT 1 FROM kontakter
    WHERE id = kontaktid AND bruker_id = gjeldende_bruker()) $$;

CREATE OR REPLACE FUNCTION er_melder(hendelseid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (SELECT 1 FROM hendelser h JOIN kontakter k ON k.id = h.meldt_av_kontakt_id
    WHERE h.id = hendelseid AND k.bruker_id = gjeldende_bruker()) $$;

-- Porten i mottaker-lesingen: elementet er synlig KUN når matrisen peker på
-- meg for hendelsestypen OG frigivelsen for den hendelsen står i 'frigitt'.
CREATE OR REPLACE FUNCTION element_frigitt_for_meg(elementid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT EXISTS (
    SELECT 1
      FROM mottakermatrise m
      JOIN kontakter   k ON k.id = m.kontakt_id
      JOIN hendelser   h ON h.hvelv_id = k.hvelv_id AND h.type = m.hendelse_type
      JOIN frigivelser f ON f.hendelse_id = h.id AND f.status = 'frigitt'
     WHERE m.element_id = elementid
       AND k.bruker_id = gjeldende_bruker()) $$;

-- ── hendelser ──
ALTER TABLE hendelser ENABLE ROW LEVEL SECURITY;
CREATE POLICY hendelser_les ON hendelser FOR SELECT TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker() OR er_kontakt_i(hvelv_id)
         OR er_admin() OR gjeldende_rolle() = 'system');
CREATE POLICY hendelser_meld ON hendelser FOR INSERT TO livsarkiv_app
  WITH CHECK (kilde = 'manuell'
              AND er_betrodd_i(hvelv_id)
              AND kontakt_tilhorer_meg(meldt_av_kontakt_id)
              AND hvelv_av_kontakt(meldt_av_kontakt_id) = hvelv_id);
GRANT SELECT, INSERT ON hendelser TO livsarkiv_app;

-- ── bekreftelser (to-kilde-regelen) ──
ALTER TABLE hendelse_bekreftelser ENABLE ROW LEVEL SECURITY;
CREATE POLICY bekreftelser_les ON hendelse_bekreftelser FOR SELECT TO livsarkiv_app
  USING (er_kontakt_i(hvelv_av_hendelse(hendelse_id)) OR er_admin()
         OR gjeldende_rolle() = 'system');
CREATE POLICY bekreftelser_skriv ON hendelse_bekreftelser FOR INSERT TO livsarkiv_app
  WITH CHECK (er_betrodd_i(hvelv_av_hendelse(hendelse_id))
              AND kontakt_tilhorer_meg(kontakt_id));
GRANT SELECT, INSERT ON hendelse_bekreftelser TO livsarkiv_app;

-- ── attester: opplaster og admin. Eier ser status via frigivelsen, aldri filen. ──
ALTER TABLE attester ENABLE ROW LEVEL SECURITY;
CREATE POLICY attester_les ON attester FOR SELECT TO livsarkiv_app
  USING (kontakt_tilhorer_meg(lastet_opp_av) OR er_admin() OR gjeldende_rolle() = 'system');
CREATE POLICY attester_skriv ON attester FOR INSERT TO livsarkiv_app
  WITH CHECK (er_betrodd_i(hvelv_av_hendelse(hendelse_id))
              AND kontakt_tilhorer_meg(lastet_opp_av));
CREATE POLICY attester_vurder ON attester FOR UPDATE TO livsarkiv_app
  USING (er_admin()) WITH CHECK (er_admin());
GRANT SELECT, INSERT, UPDATE ON attester TO livsarkiv_app;

-- ── frigivelser: tilstandsvernet ligger DELVIS i RLS — eier kan KUN
--    karenstid→blokkert, melder KUN →tilbakekalt før godkjenning. ──
ALTER TABLE frigivelser ENABLE ROW LEVEL SECURITY;
CREATE POLICY frigivelser_les ON frigivelser FOR SELECT TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker() OR er_kontakt_i(hvelv_id)
         OR er_admin() OR gjeldende_rolle() = 'system');
CREATE POLICY frigivelser_opprett ON frigivelser FOR INSERT TO livsarkiv_app
  WITH CHECK (er_betrodd_i(hvelv_id) AND status = 'meldt');
CREATE POLICY frigivelser_admin ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (er_admin()) WITH CHECK (er_admin());
CREATE POLICY frigivelser_system ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (gjeldende_rolle() = 'system') WITH CHECK (gjeldende_rolle() = 'system');
CREATE POLICY frigivelser_eier_blokker ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker() AND status = 'karenstid')
  WITH CHECK (eier_av(hvelv_id) = gjeldende_bruker() AND status = 'blokkert');
CREATE POLICY frigivelser_melder_tilbakekall ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (er_melder(hendelse_id) AND status IN ('meldt', 'attest_lastet_opp', 'under_verifisering'))
  WITH CHECK (er_melder(hendelse_id) AND status = 'tilbakekalt');
CREATE POLICY frigivelser_kontakt_attest ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (er_betrodd_i(hvelv_id) AND status = 'meldt')
  WITH CHECK (er_betrodd_i(hvelv_id) AND status = 'attest_lastet_opp');
GRANT SELECT, INSERT, UPDATE ON frigivelser TO livsarkiv_app;

-- ── varslinger ──
ALTER TABLE varslinger ENABLE ROW LEVEL SECURITY;
CREATE POLICY varslinger_les ON varslinger FOR SELECT TO livsarkiv_app
  USING (er_admin() OR eier_av(hvelv_id) = gjeldende_bruker() OR gjeldende_rolle() = 'system');
CREATE POLICY varslinger_skriv ON varslinger FOR INSERT TO livsarkiv_app
  WITH CHECK (true);   -- bærer kun type + referanser; skrives fra alle kontekster
CREATE POLICY varslinger_sendt ON varslinger FOR UPDATE TO livsarkiv_app
  USING (gjeldende_rolle() = 'system') WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT, UPDATE ON varslinger TO livsarkiv_app;

-- System leser brukere (eierens e-post ved varsling) — radnivå; kolonnegranten
-- fra 001 holder fortsatt passord_hash utenfor rekkevidde.
CREATE POLICY brukere_system ON brukere FOR SELECT TO livsarkiv_app
  USING (gjeldende_rolle() = 'system');
-- …og hvelv (finne eieren som skal varsles).
CREATE POLICY hvelv_system ON hvelv FOR SELECT TO livsarkiv_app
  USING (gjeldende_rolle() = 'system');

-- ── mottaker-porten på hvelv_elementer (varslet i migrasjon 002) ──
CREATE POLICY elementer_mottaker ON hvelv_elementer FOR SELECT TO livsarkiv_app
  USING (nivaa <> 'sensitiv' AND element_frigitt_for_meg(id));
