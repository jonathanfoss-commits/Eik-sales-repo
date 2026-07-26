-- Agentlaget: vurderinger (råd til saksbehandler) og audit-logg for AI-bruk.
--
-- Ufravikelig prinsipp 4: agent-output er RÅD — ingen agent kan endre
-- frigivelsestilstand eller sende noe eksternt. Det finnes ingen policy eller
-- kodevei som lar dem gjøre det; tilstandsmaskinen kjenner ikke agentene.

-- Agentenes vurderinger av en sak. Skrives kun av system (agentkjøringer skjer
-- i serverprosessen), leses av admin (i køen) og system.
CREATE TABLE agent_vurderinger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frigivelse_id uuid NOT NULL REFERENCES frigivelser(id) ON DELETE CASCADE,
  agent         text NOT NULL CHECK (agent IN ('vakt', 'frigivelse', 'kvalitet')),
  vurdering     jsonb NOT NULL,      -- strukturert råd — aldri attestinnhold i klartekst
  prompt_id     text,                -- sporbarhet til audit-trail (NULL for regelbaserte)
  opprettet     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE agent_vurderinger ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_vurderinger_les ON agent_vurderinger FOR SELECT TO livsarkiv_app
  USING (er_admin() OR gjeldende_rolle() = 'system');
CREATE POLICY agent_vurderinger_skriv ON agent_vurderinger FOR INSERT TO livsarkiv_app
  WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT ON agent_vurderinger TO livsarkiv_app;

-- AI-audit: hvilken agent, hvilken modell, hva det kostet — ALDRI innhold.
-- Append-only som revisjon (ingen UPDATE/DELETE-grant).
CREATE TABLE agent_logg (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tid        timestamptz NOT NULL DEFAULT now(),
  agent      text NOT NULL,
  modell     text NOT NULL,
  prompt_id  text NOT NULL,
  kost_ore   integer NOT NULL DEFAULT 0,
  status     text NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'feil', 'budsjett_stopp'))
);
ALTER TABLE agent_logg ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_logg_les ON agent_logg FOR SELECT TO livsarkiv_app
  USING (er_admin() OR gjeldende_rolle() = 'system');
CREATE POLICY agent_logg_skriv ON agent_logg FOR INSERT TO livsarkiv_app
  WITH CHECK (gjeldende_rolle() = 'system');
GRANT SELECT, INSERT ON agent_logg TO livsarkiv_app;

-- Vaktagenten (system) leser revisjonsloggen for anomalimønstre
-- (mottakerendringer tett på en melding). Fortsatt append-only.
CREATE POLICY revisjon_les_system ON revisjon FOR SELECT TO livsarkiv_app
  USING (gjeldende_rolle() = 'system');

-- Månedsbudsjettet sjekkes på tvers av rader system-rollen ikke nødvendigvis
-- ser i fremtidige innstramminger — SECURITY DEFINER som i kjerne (D12).
CREATE OR REPLACE FUNCTION ai_kost_denne_mnd() RETURNS bigint
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
  AS $$ SELECT COALESCE(sum(kost_ore), 0) FROM agent_logg
        WHERE tid >= date_trunc('month', now()) AND status = 'ok' $$;
