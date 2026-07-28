-- Tenant-isolasjon: flere forsikringsselskaper på samme plattform.
--
-- ADR-003 forberedte dette (tenant-tabell + tenant_id på brukere). Nå
-- aktiveres det, og det som aktiveres er først og fremst én ting: fram til nå
-- så `er_admin()` ALLE saker i hele basen. Med Storebrand og Gjensidige på
-- samme plattform betyr det at den enes saksbehandler ser den andres kunder.
-- Det er showstopperen i enhver innkjøpsgjennomgang, og den lukkes her.
--
-- Modellen:
--   * hver bruker tilhører én tenant (kolonnen fantes allerede)
--   * en saksbehandler ser KUN saker som tilhører sin egen tenant
--   * unntaket er plattform-tenanten («livsarkivet»): den drifter tjenesten og
--     ser saksmetadata på tvers for support og tilsyn — aldri hvelvinnhold,
--     der finnes ingen policy for noen admin. Dette er en opplysning som SKAL
--     stå i databehandleravtalen, ikke en hemmelighet.

-- ── Hvem er jeg, og hvilken tenant hører saken til? ──
-- SECURITY DEFINER av samme grunn som eier_av/er_betrodd_i i 002: policyene
-- må kunne slå opp i brukere/hvelv uten å utløse policyene der på nytt.
CREATE OR REPLACE FUNCTION min_tenant() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT tenant_id FROM brukere WHERE id = gjeldende_bruker() $$;

CREATE OR REPLACE FUNCTION tenant_av_hvelv(hvelvid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT b.tenant_id FROM hvelv h JOIN brukere b ON b.id = h.eier_id
         WHERE h.id = hvelvid $$;

-- En invitert kontakt skal havne i samme tenant som den som inviterte — ellers
-- ville en betrodd kontakt hos Storebrand telle som plattformens bruker.
-- SECURITY DEFINER også fordi livsarkiv_auth (som løser inn invitasjonen) med
-- vilje ikke har tilgang til kontakter-tabellen.
CREATE OR REPLACE FUNCTION tenant_av_kontakt(kontaktid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT b.tenant_id FROM kontakter k JOIN hvelv h ON h.id = k.hvelv_id
          JOIN brukere b ON b.id = h.eier_id WHERE k.id = kontaktid $$;

-- Plattformdrift: admin i tenanten «livsarkivet» (standard_tenant() fra 001).
CREATE OR REPLACE FUNCTION er_plattformadmin() RETURNS boolean
  LANGUAGE sql STABLE AS $$ SELECT er_admin() AND min_tenant() = standard_tenant() $$;

-- Saksbehandlerens rekkevidde, uttrykt én gang. NULL-hvelv (systemhendelser i
-- revisjonsloggen) er kun plattformdriftens sak — en tenant skal ikke kunne
-- lese aktivitet den ikke eier, heller ikke innholdsløs aktivitet.
CREATE OR REPLACE FUNCTION er_admin_for(hvelvid uuid) RETURNS boolean
  LANGUAGE sql STABLE AS $$
    SELECT er_admin() AND (er_plattformadmin()
                           OR tenant_av_hvelv(hvelvid) = min_tenant()) $$;

-- ── Erstatt hver ubegrensede er_admin() med den skopede varianten ──
-- Rekkefølgen følger migrasjonene de kom fra, så en leser kan spore dem.

-- 001: revisjonsloggen
DROP POLICY revisjon_les_admin ON revisjon;
CREATE POLICY revisjon_les_admin ON revisjon FOR SELECT TO livsarkiv_app
  USING (CASE WHEN hvelv_id IS NULL THEN er_plattformadmin()
              ELSE er_admin_for(hvelv_id) END);

-- 002: kontakter (melder-identitet i verifiseringskøen)
DROP POLICY kontakter_admin ON kontakter;
CREATE POLICY kontakter_admin ON kontakter FOR SELECT TO livsarkiv_app
  USING (er_admin_for(hvelv_id));

-- 003: hendelser, bekreftelser, attester, frigivelser, varslinger
DROP POLICY hendelser_les ON hendelser;
CREATE POLICY hendelser_les ON hendelser FOR SELECT TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker() OR er_kontakt_i(hvelv_id)
         OR er_admin_for(hvelv_id) OR gjeldende_rolle() = 'system');

DROP POLICY bekreftelser_les ON hendelse_bekreftelser;
CREATE POLICY bekreftelser_les ON hendelse_bekreftelser FOR SELECT TO livsarkiv_app
  USING (er_kontakt_i(hvelv_av_hendelse(hendelse_id))
         OR er_admin_for(hvelv_av_hendelse(hendelse_id))
         OR gjeldende_rolle() = 'system');

DROP POLICY attester_les ON attester;
CREATE POLICY attester_les ON attester FOR SELECT TO livsarkiv_app
  USING (kontakt_tilhorer_meg(lastet_opp_av)
         OR er_admin_for(hvelv_av_hendelse(hendelse_id))
         OR gjeldende_rolle() = 'system');
DROP POLICY attester_vurder ON attester;
CREATE POLICY attester_vurder ON attester FOR UPDATE TO livsarkiv_app
  USING (er_admin_for(hvelv_av_hendelse(hendelse_id)))
  WITH CHECK (er_admin_for(hvelv_av_hendelse(hendelse_id)));

DROP POLICY frigivelser_les ON frigivelser;
CREATE POLICY frigivelser_les ON frigivelser FOR SELECT TO livsarkiv_app
  USING (eier_av(hvelv_id) = gjeldende_bruker() OR er_kontakt_i(hvelv_id)
         OR er_admin_for(hvelv_id) OR gjeldende_rolle() = 'system');
-- Den viktigste: godkjenning av en frigivelse. En saksbehandler i ett selskap
-- skal ikke kunne signere for et annet selskaps kunde — heller ikke ved et uhell.
DROP POLICY frigivelser_admin ON frigivelser;
CREATE POLICY frigivelser_admin ON frigivelser FOR UPDATE TO livsarkiv_app
  USING (er_admin_for(hvelv_id)) WITH CHECK (er_admin_for(hvelv_id));

DROP POLICY varslinger_les ON varslinger;
CREATE POLICY varslinger_les ON varslinger FOR SELECT TO livsarkiv_app
  USING (er_admin_for(hvelv_id) OR eier_av(hvelv_id) = gjeldende_bruker()
         OR gjeldende_rolle() = 'system');

-- 004: agentvurderinger henger på en frigivelse, som henger på et hvelv.
CREATE OR REPLACE FUNCTION hvelv_av_frigivelse(frigivelseid uuid) RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT hvelv_id FROM frigivelser WHERE id = frigivelseid $$;
DROP POLICY agent_vurderinger_les ON agent_vurderinger;
CREATE POLICY agent_vurderinger_les ON agent_vurderinger FOR SELECT TO livsarkiv_app
  USING (er_admin_for(hvelv_av_frigivelse(frigivelse_id))
         OR gjeldende_rolle() = 'system');

-- agent_logg er kostnads- og modellbruk uten hvelvreferanse: plattformdrift.
DROP POLICY agent_logg_les ON agent_logg;
CREATE POLICY agent_logg_les ON agent_logg FOR SELECT TO livsarkiv_app
  USING (er_plattformadmin() OR gjeldende_rolle() = 'system');

-- ── White-label ──
-- Merkevaren bor i tenanter.konfig (jsonb fantes fra 001 — ingen ny kolonne
-- trengs): vertsnavn appen svarer på, visningsnavn og aksentfarge.
-- «aktiv» er derimot en egen kolonne: at et selskap er avviklet er en
-- tilstand vi må kunne spørre på og indeksere, ikke en detalj i en blob.
ALTER TABLE tenanter ADD COLUMN aktiv boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN tenanter.konfig IS
  'White-label: {"vertsnavn": ["x.no"], "visningsnavn": "…", "aksent": "#39E29B"}';
