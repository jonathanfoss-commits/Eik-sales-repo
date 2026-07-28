-- Delingslaget: kunden deler UTVALGTE felt med sitt eget forsikringsselskap.
--
-- Dette er stedet der zero-knowledge-løftet møter forretningsmodellen, og
-- måten det løses på er at kunden selv bestemmer, felt for felt. Selskapet ser
-- polisenummeret sitt fordi kunden aktivt la det inn og krysset av — aldri
-- fordi selskapet driver plattformen.
--
-- Tre grenser, alle i basen og ikke bare i appen:
--   1. Bare eieren kan legge inn og trekke tilbake.
--   2. Selskapet ser KUN aktive delinger (trukket_tid IS NULL) i EGEN tenant.
--   3. Plattformdriften ser dem IKKE. Dette er kundens data delt med sitt
--      selskap, ikke saksmetadata vi trenger for å drifte frigivelsesløpet.
--      Derfor `er_selskapets()` og ikke `er_admin_for()`.

CREATE TABLE selskapsdeling (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hvelv_id    uuid NOT NULL REFERENCES hvelv(id) ON DELETE CASCADE,
  felttype    text NOT NULL CHECK (felttype IN
                ('polisenummer', 'kundenummer', 'begunstiget', 'kontaktperson')),
  -- Med vilje i klartekst: hele poenget er at selskapet skal kunne lese det.
  -- Dette er den ENESTE tabellen med kundeoppgitt innhold som noen utenfor
  -- eierens egen krets kan se, og den er derfor kort og typebegrenset.
  verdi       text NOT NULL CHECK (length(verdi) BETWEEN 1 AND 200),
  delt_tid    timestamptz NOT NULL DEFAULT now(),
  trukket_tid timestamptz
);
-- Partielt unikt, ikke UNIQUE(hvelv_id, felttype, trukket_tid): Postgres
-- regner NULL-er som ULIKE i en unik constraint, så den varianten ville
-- sluppet gjennom flere aktive delinger av samme felt. Historikken (trukne
-- rader) beholdes med vilje — den er beviset på hva som var delt når.
CREATE UNIQUE INDEX selskapsdeling_aktiv ON selskapsdeling (hvelv_id, felttype)
  WHERE trukket_tid IS NULL;

-- Selskapets rekkevidde: egen tenant, uten plattform-omveien i er_admin_for().
CREATE OR REPLACE FUNCTION er_selskapets(hvelvid uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT er_admin() AND tenant_av_hvelv(hvelvid) = min_tenant() $$;

ALTER TABLE selskapsdeling ENABLE ROW LEVEL SECURITY;

CREATE POLICY deling_eier ON selskapsdeling FOR ALL TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker())
  WITH CHECK (eier_av(hvelv_id) = gjeldende_bruker());

-- Tilbaketrekk håndheves her, ikke i en WHERE i appen: en trukket deling
-- forsvinner for selskapet i det øyeblikket kunden trekker den.
CREATE POLICY deling_selskap ON selskapsdeling FOR SELECT TO livsarkiv_app
  USING (er_selskapets(hvelv_id) AND trukket_tid IS NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON selskapsdeling TO livsarkiv_app;
