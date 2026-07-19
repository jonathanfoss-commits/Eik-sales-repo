-- Modultabellene. Datanivåene fra avklaringene (D2) håndheves her:
--   DELT     = hele organisasjonen leser (timer/dagbok/varsler/innspill)
--   PRIVAT   = raden er synlig for eieren + ledelsen (timeføring, jf. [JONATHAN])
--   SENSITIVT = kun admin (ai_logg/kostnader, jf. [JONATHAN])
-- Alle skrivbare tabeller har versjon (konfliktvern) og klient_id (idempotens
-- for offline-køen): unik indeks per org gjør resending ufarlig.

-- Timeføring — PRIVAT + LEDELSE. Én føring per bruker/prosjekt/dato rettes ved
-- ny lagring (samme mønster som piloten).
CREATE TABLE timeforinger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid NOT NULL REFERENCES brukere(id),
  dato       date NOT NULL,
  prosjekt   text NOT NULL,
  timer      numeric NOT NULL CHECK (timer > 0 AND timer <= 24),
  notat      text,
  versjon    integer NOT NULL DEFAULT 1,
  klient_id  text,
  opprettet  timestamptz NOT NULL DEFAULT now(),
  endret     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, bruker_id, dato, prosjekt)
);
ALTER TABLE timeforinger ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeforinger FORCE ROW LEVEL SECURITY;
CREATE POLICY timer_les ON timeforinger FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org() AND (bruker_id = gjeldende_bruker() OR er_ledelse()));
CREATE POLICY timer_skriv ON timeforinger FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY timer_endre ON timeforinger FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker())
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY timer_slett ON timeforinger FOR DELETE TO plattform_app
  USING (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
GRANT SELECT, INSERT, UPDATE, DELETE ON timeforinger TO plattform_app;
CREATE UNIQUE INDEX timeforinger_klient ON timeforinger (org_id, klient_id) WHERE klient_id IS NOT NULL;
CREATE INDEX timeforinger_dato ON timeforinger (org_id, dato);

-- Byggedagbok — DELT (tidsnære bevis, HAB-dommen). Kun forfatter endrer egen
-- linje; ingen sletting (dagbok er bevismateriale — feilføringer korrigeres
-- med ny linje).
CREATE TABLE dagbok (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid NOT NULL REFERENCES brukere(id),
  dato       date NOT NULL,
  prosjekt   text NOT NULL,
  tekst      text NOT NULL,
  versjon    integer NOT NULL DEFAULT 1,
  klient_id  text,
  opprettet  timestamptz NOT NULL DEFAULT now(),
  endret     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dagbok ENABLE ROW LEVEL SECURITY;
ALTER TABLE dagbok FORCE ROW LEVEL SECURITY;
CREATE POLICY dagbok_les ON dagbok FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY dagbok_skriv ON dagbok FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY dagbok_endre ON dagbok FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker())
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
GRANT SELECT, INSERT, UPDATE ON dagbok TO plattform_app;
CREATE UNIQUE INDEX dagbok_klient ON dagbok (org_id, klient_id) WHERE klient_id IS NOT NULL;
CREATE INDEX dagbok_dato ON dagbok (org_id, dato);

-- Varemottak/avviksmeldinger — DELT, med status (meldt/rettet/kreditert).
CREATE TABLE varsler (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id   uuid NOT NULL REFERENCES brukere(id),
  type        text NOT NULL CHECK (type IN ('varemottak', 'endringsvarsel')),
  prosjekt    text NOT NULL,
  leverandor  text,
  tekst       text NOT NULL,
  status      text NOT NULL DEFAULT 'meldt' CHECK (status IN ('meldt', 'sendt', 'svart', 'rettet', 'kreditert')),
  versjon     integer NOT NULL DEFAULT 1,
  klient_id   text,
  opprettet   timestamptz NOT NULL DEFAULT now(),
  endret      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE varsler ENABLE ROW LEVEL SECURITY;
ALTER TABLE varsler FORCE ROW LEVEL SECURITY;
CREATE POLICY varsler_les ON varsler FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY varsler_skriv ON varsler FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY varsler_endre ON varsler FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org())
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT, UPDATE ON varsler TO plattform_app;
CREATE UNIQUE INDEX varsler_klient ON varsler (org_id, klient_id) WHERE klient_id IS NOT NULL;

-- Innspill (💡-løkka) — DELT. Innholdet er aktivt sendt av brukeren (D2).
CREATE TABLE innspill (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id     uuid REFERENCES brukere(id),
  type          text NOT NULL CHECK (type IN ('ide', 'skurrer', 'funker')),
  tekst         text NOT NULL,
  status        text NOT NULL DEFAULT 'ny' CHECK (status IN ('ny', 'hos_panelet', 'besvart', 'handtert')),
  svar          text,
  svar_av       text,
  versjon       integer NOT NULL DEFAULT 1,
  klient_id     text,
  opprettet     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE innspill ENABLE ROW LEVEL SECURITY;
ALTER TABLE innspill FORCE ROW LEVEL SECURITY;
CREATE POLICY innspill_les ON innspill FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY innspill_skriv ON innspill FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org());
CREATE POLICY innspill_endre ON innspill FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse())
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT, UPDATE ON innspill TO plattform_app;
CREATE UNIQUE INDEX innspill_klient ON innspill (org_id, klient_id) WHERE klient_id IS NOT NULL;

-- Pilotlogg — hendelsestyper, ALDRI innhold (ufravikelig regel fra piloten).
CREATE TABLE pilotlogg (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid REFERENCES brukere(id),
  hendelse   text NOT NULL,
  tid        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE pilotlogg ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilotlogg FORCE ROW LEVEL SECURITY;
CREATE POLICY pilotlogg_les ON pilotlogg FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse());
CREATE POLICY pilotlogg_skriv ON pilotlogg FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT ON pilotlogg TO plattform_app;
CREATE INDEX pilotlogg_tid ON pilotlogg (org_id, tid);

-- Godkjenninger — to-nøkkel-flyten som autentiserte audit-rader (aldri åpne
-- skjemaer): én stemme per bruker per versjon, knyttet til innlogget bruker.
CREATE TABLE godkjenninger (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid NOT NULL REFERENCES brukere(id),
  versjon    text NOT NULL,
  stemme     text NOT NULL CHECK (stemme IN ('godkjent', 'avvist')),
  tid        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, bruker_id, versjon)
);
ALTER TABLE godkjenninger ENABLE ROW LEVEL SECURITY;
ALTER TABLE godkjenninger FORCE ROW LEVEL SECURITY;
CREATE POLICY godkjenninger_les ON godkjenninger FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY godkjenninger_skriv ON godkjenninger FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker() AND er_ledelse());
GRANT SELECT, INSERT ON godkjenninger TO plattform_app;

-- AI-kostnadslogg — SENSITIVT: kun admin leser [JONATHAN]. Aldri innhold.
CREATE TABLE ai_logg (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id      uuid REFERENCES brukere(id),
  evne           text NOT NULL,
  modell         text NOT NULL,
  input_tokens   integer NOT NULL DEFAULT 0,
  output_tokens  integer NOT NULL DEFAULT 0,
  cache_les      integer NOT NULL DEFAULT 0,
  cache_skriv    integer NOT NULL DEFAULT 0,
  kost_ore       numeric NOT NULL DEFAULT 0,
  tid            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ai_logg ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logg FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_logg_les ON ai_logg FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org() AND gjeldende_rolle() = 'admin');
CREATE POLICY ai_logg_skriv ON ai_logg FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT ON ai_logg TO plattform_app;
CREATE INDEX ai_logg_tid ON ai_logg (org_id, tid);
