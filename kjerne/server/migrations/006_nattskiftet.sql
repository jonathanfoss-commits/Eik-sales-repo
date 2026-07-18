-- NATTSKIFTET: purretrapp/fakturaer, tilleggsfangeren og fristvakta.
-- Datanivåer (D22, besluttet før bygging): fakturaer = KUN LEDELSE (økonomi);
-- tillegg og prosjektfrister = DELT (hele laget skal se hva som er avtalt og
-- hvilke frister som løper — det er selve poenget).

-- Fakturaer med forfall — grunnlaget for purretrappa. KUN LEDELSE.
CREATE TABLE fakturaer (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid NOT NULL REFERENCES brukere(id),
  kunde      text NOT NULL,
  referanse  text NOT NULL,          -- «Faktura 1042 · 48 500 kr»
  forfall    date NOT NULL,
  status     text NOT NULL DEFAULT 'aapen' CHECK (status IN ('aapen', 'purret1', 'purret2', 'varslet', 'betalt')),
  versjon    integer NOT NULL DEFAULT 1,
  klient_id  text,
  opprettet  timestamptz NOT NULL DEFAULT now(),
  endret     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE fakturaer ENABLE ROW LEVEL SECURITY;
ALTER TABLE fakturaer FORCE ROW LEVEL SECURITY;
CREATE POLICY fakturaer_ledelse ON fakturaer FOR ALL TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse())
  WITH CHECK (org_id = gjeldende_org() AND er_ledelse());
GRANT SELECT, INSERT, UPDATE, DELETE ON fakturaer TO plattform_app;
CREATE UNIQUE INDEX fakturaer_klient ON fakturaer (org_id, klient_id) WHERE klient_id IS NOT NULL;
CREATE INDEX fakturaer_forfall ON fakturaer (org_id, forfall);

-- Tilleggsarbeid — «vi tar det på regning» fanget på 20 sekunder. DELT.
CREATE TABLE tillegg (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id  uuid NOT NULL REFERENCES brukere(id),
  dato       date NOT NULL DEFAULT CURRENT_DATE,
  prosjekt   text NOT NULL,
  avtalt_med text,
  tekst      text NOT NULL,
  status     text NOT NULL DEFAULT 'registrert' CHECK (status IN ('registrert', 'fakturert')),
  versjon    integer NOT NULL DEFAULT 1,
  klient_id  text,
  opprettet  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tillegg ENABLE ROW LEVEL SECURITY;
ALTER TABLE tillegg FORCE ROW LEVEL SECURITY;
CREATE POLICY tillegg_les ON tillegg FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY tillegg_skriv ON tillegg FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY tillegg_endre ON tillegg FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org() AND (bruker_id = gjeldende_bruker() OR er_ledelse()))
  WITH CHECK (org_id = gjeldende_org());
GRANT SELECT, INSERT, UPDATE ON tillegg TO plattform_app;
CREATE UNIQUE INDEX tillegg_klient ON tillegg (org_id, klient_id) WHERE klient_id IS NOT NULL;

-- Fristvakta — overtakelsesdato per prosjekt gir preklusive nedtellinger
-- (sluttoppstilling 2 mnd., søksmål 8 mnd. — NS 8407). DELT.
CREATE TABLE prosjektfrister (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL DEFAULT gjeldende_org() REFERENCES organisasjoner(id),
  bruker_id    uuid NOT NULL REFERENCES brukere(id),
  prosjekt     text NOT NULL,
  overtakelse  date NOT NULL,
  versjon      integer NOT NULL DEFAULT 1,
  klient_id    text,
  opprettet    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, prosjekt)
);
ALTER TABLE prosjektfrister ENABLE ROW LEVEL SECURITY;
ALTER TABLE prosjektfrister FORCE ROW LEVEL SECURITY;
CREATE POLICY frister_les ON prosjektfrister FOR SELECT TO plattform_app
  USING (org_id = gjeldende_org());
CREATE POLICY frister_skriv ON prosjektfrister FOR INSERT TO plattform_app
  WITH CHECK (org_id = gjeldende_org() AND bruker_id = gjeldende_bruker());
CREATE POLICY frister_endre ON prosjektfrister FOR UPDATE TO plattform_app
  USING (org_id = gjeldende_org())
  WITH CHECK (org_id = gjeldende_org());
CREATE POLICY frister_slett ON prosjektfrister FOR DELETE TO plattform_app
  USING (org_id = gjeldende_org() AND er_ledelse());
GRANT SELECT, INSERT, UPDATE, DELETE ON prosjektfrister TO plattform_app;
CREATE UNIQUE INDEX frister_klient ON prosjektfrister (org_id, klient_id) WHERE klient_id IS NOT NULL;

-- Varselvakta-forsterkningen: purrefrist på varsler (når må motparten ha svart?)
ALTER TABLE varsler ADD COLUMN svarfrist date;
