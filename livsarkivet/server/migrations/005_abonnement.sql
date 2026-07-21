-- Abonnement (Stripe): prøveperiode 30 dager, deretter betalt.
--
-- ETISK GATING (forretningsmodellen i /goal): abonnementet porter KUN eierens
-- redigering av eget arkiv. Frigivelsesløpet, varsling, blokkering og
-- etterlattevisningen er ALDRI portet — mottakertilgang er gratis, og et
-- dødsfall skal aldri strande på betaling. Håndheves i API-laget
-- (krevAktivtAbonnement kalles kun fra eier-skriveruter).

CREATE TABLE abonnementer (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id            uuid NOT NULL UNIQUE REFERENCES brukere(id) ON DELETE CASCADE,
  status               text NOT NULL DEFAULT 'proveperiode'
                         CHECK (status IN ('proveperiode', 'aktiv', 'forfalt', 'kansellert')),
  stripe_kunde_id      text,
  stripe_abonnement_id text UNIQUE,
  proveperiode_slutt   timestamptz NOT NULL DEFAULT now() + interval '30 days',
  periode_slutt        timestamptz,
  opprettet            timestamptz NOT NULL DEFAULT now(),
  oppdatert            timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE abonnementer ENABLE ROW LEVEL SECURITY;
CREATE POLICY abonnementer_selv ON abonnementer FOR SELECT TO livsarkiv_app
  USING (bruker_id = gjeldende_bruker() OR gjeldende_rolle() = 'system');
CREATE POLICY abonnementer_opprett ON abonnementer FOR INSERT TO livsarkiv_app
  WITH CHECK (bruker_id = gjeldende_bruker() OR gjeldende_rolle() = 'system');
-- kun webhooken (system) endrer status — aldri brukeren selv
CREATE POLICY abonnementer_endre ON abonnementer FOR UPDATE TO livsarkiv_app
  USING (gjeldende_rolle() = 'system') WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT, UPDATE ON abonnementer TO livsarkiv_app;
