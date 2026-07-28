-- Folkeregister-trigger: et dødsfall oppdages fra offisiell kilde i stedet for
-- at en betrodd kontakt må orke å melde det midt i sorgen.
--
-- Dette er den funksjonen et forsikringsselskap faktisk vil eie. Den er også
-- den farligste, og derfor står den viktigste beslutningen først:
--
--   EN OFFISIELL KILDE ERSTATTER IKKE FIRE ØYNE.
--
-- ADR-002 antydet at Folkeregisteret kunne redusere kontrollen til én person.
-- Det gjør vi ikke. Et register kan ta feil — feil fødselsnummer, forvekslede
-- identiteter, tastefeil hos en saksbehandler et helt annet sted — og folk har
-- blitt erklært døde i norske registre mens de levde. Det maskinen sparer oss
-- for, er å VENTE på at noen orker å melde. Det den ikke sparer oss for, er å
-- se etter. Karenstiden og eierens nødbrems står også urørt.

-- ── Oppslagsnøkkel, ikke identifikator ──
-- Vi lagrer ALDRI fødselsnummeret. Vi lagrer en nøklet hash (HMAC med en
-- pepper som bor i miljøet, ikke i basen), slik at et innkommende dødsfall kan
-- matches uten at vi noen gang har hatt nummeret.
--
-- Ærlig om svakheten: fødselsnummer har et lite tallrom, så en angriper som
-- får BÅDE en databasedump OG pepperen kan regne seg tilbake. Pepperen ligger
-- derfor utenfor databasen, og en dump alene er ikke nok. Dette skal stå i
-- DPIA-en, ikke gjemmes i en kommentar — den står her fordi den som endrer
-- koden må vite det.
ALTER TABLE brukere ADD COLUMN fnr_hash text UNIQUE;

-- Appen skal kunne SETTE sin egen, men aldri lese noens — heller ikke sin
-- egen. Kolonnegranten fra 001 listet kolonnene eksplisitt, så fnr_hash er
-- allerede utenfor SELECT. Her gis kun skriverett på den ene kolonnen.
GRANT UPDATE (fnr_hash) ON brukere TO livsarkiv_app;

CREATE POLICY brukere_eget_fnr ON brukere FOR UPDATE TO livsarkiv_app
  USING (id = gjeldende_bruker()) WITH CHECK (id = gjeldende_bruker());

-- Oppslaget fra ingest-modulen: hash inn, hvelv ut. SECURITY DEFINER fordi
-- system-rollen ikke har (og ikke skal ha) generell tilgang til brukere.
CREATE OR REPLACE FUNCTION hvelv_for_fnr_hash(hash text) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT h.id FROM hvelv h JOIN brukere b ON b.id = h.eier_id
   WHERE b.fnr_hash = hash AND b.aktiv
$$;
GRANT EXECUTE ON FUNCTION hvelv_for_fnr_hash(text) TO livsarkiv_app;

-- Appen må kunne vise «du er koblet» uten å kunne lese hashen. Funksjonen
-- svarer ja/nei for den innloggede, og for ingen andre.
CREATE OR REPLACE FUNCTION har_fnr_kobling() RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT fnr_hash IS NOT NULL FROM brukere WHERE id = gjeldende_bruker()
$$;
GRANT EXECUTE ON FUNCTION har_fnr_kobling() TO livsarkiv_app;

-- ── System kan melde fra offisiell kilde ──
-- Policyen hendelser_meld låser eksterne innsendere til kilde='manuell'.
-- Ingest-modulen kjører som system og er den ENESTE veien inn for
-- 'folkeregisteret': ingen HTTP-rute setter denne kilden.
CREATE POLICY hendelser_folkeregister ON hendelser FOR INSERT TO livsarkiv_app
  WITH CHECK (gjeldende_rolle() = 'system'
              AND kilde = 'folkeregisteret'
              AND meldt_av_kontakt_id IS NULL);

-- Saken går rett til verifisering: registeroppføringen ER dokumentet, så det
-- finnes ingen attest å laste opp. Fire øyne gjenstår — det er poenget.
CREATE POLICY frigivelser_system_opprett ON frigivelser FOR INSERT TO livsarkiv_app
  WITH CHECK (gjeldende_rolle() = 'system' AND status = 'under_verifisering');

-- ── Idempotens ──
-- Samme dødsfall kommer igjen ved hver polling. En ny sak skal bare opprettes
-- hvis hvelvet ikke alt har en åpen. Terminaltilstandene (avvist, tilbakekalt,
-- blokkert, frigitt) teller ikke som åpne — en avvist sak skal kunne meldes
-- på nytt hvis registeret fortsatt sier det samme.
CREATE OR REPLACE FUNCTION har_apen_sak(hvelvid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM frigivelser
                  WHERE hvelv_id = hvelvid
                    AND status NOT IN ('avvist', 'tilbakekalt', 'blokkert', 'frigitt'))
$$;
GRANT EXECUTE ON FUNCTION har_apen_sak(uuid) TO livsarkiv_app;

-- Sporing av hva ingest har sett, så drift kan svare på «kom meldingen fram?»
-- uten å måtte lete i frigivelser. Ingen fødselsnummer, kun hashen og utfallet.
CREATE TABLE folkeregister_hendelser (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fnr_hash    text NOT NULL,
  dodsdato    date,
  utfall      text NOT NULL CHECK (utfall IN
                ('sak_opprettet', 'ukjent_person', 'alt_apen_sak')),
  hvelv_id    uuid REFERENCES hvelv(id) ON DELETE SET NULL,
  mottatt     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE folkeregister_hendelser ENABLE ROW LEVEL SECURITY;
CREATE POLICY fr_hendelser_system ON folkeregister_hendelser FOR ALL TO livsarkiv_app
  USING (gjeldende_rolle() = 'system' OR er_plattformadmin())
  WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT ON folkeregister_hendelser TO livsarkiv_app;
CREATE INDEX fr_hendelser_tid ON folkeregister_hendelser (mottatt DESC);
