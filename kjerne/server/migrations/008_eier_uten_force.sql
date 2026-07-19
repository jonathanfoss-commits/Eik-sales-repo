-- Seeding feilet på Render: FORCE ROW LEVEL SECURITY underlegger også
-- tabelleieren policyene, og ingen policy gir eieren INSERT. Lokalt merket
-- ingen det, fordi kjerne_eier i docker-compose er superbruker (omgår alltid
-- RLS) — på managed Postgres er eieren en vanlig rolle.
--
-- Isolasjonen står seg uten FORCE: appen kobler alltid til som
-- plattform_app/plattform_auth, som ikke eier tabellene og dermed er fullt
-- bundet av ENABLE ROW LEVEL SECURITY. Eier-tilkoblingen
-- (MIGRATE_DATABASE_URL) brukes kun av migrering og tenant-seeding.
ALTER TABLE organisasjoner NO FORCE ROW LEVEL SECURITY;
ALTER TABLE brukere NO FORCE ROW LEVEL SECURITY;
ALTER TABLE invitasjoner NO FORCE ROW LEVEL SECURITY;
ALTER TABLE revisjon NO FORCE ROW LEVEL SECURITY;
ALTER TABLE timeforinger NO FORCE ROW LEVEL SECURITY;
ALTER TABLE dagbok NO FORCE ROW LEVEL SECURITY;
ALTER TABLE varsler NO FORCE ROW LEVEL SECURITY;
ALTER TABLE innspill NO FORCE ROW LEVEL SECURITY;
ALTER TABLE pilotlogg NO FORCE ROW LEVEL SECURITY;
ALTER TABLE godkjenninger NO FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_logg NO FORCE ROW LEVEL SECURITY;
ALTER TABLE fakturaer NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tillegg NO FORCE ROW LEVEL SECURITY;
ALTER TABLE prosjektfrister NO FORCE ROW LEVEL SECURITY;
