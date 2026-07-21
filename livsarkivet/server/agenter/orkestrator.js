// Orkestratoren: kjører agentene på en sak og lagrer rådene deres for
// saksbehandlerkøen. Feil i en agent stopper ALDRI saksflyten — agentene er
// råd, saken går til menneskelig vurdering uansett.
import { medBruker } from '../db.js';
import * as vakt from './vakt.js';
import * as frigivelsesagent from './frigivelse.js';

export async function vurderSak(frigivelseId) {
  for (const [navn, agent] of [['vakt', vakt], ['frigivelse', frigivelsesagent]]) {
    try {
      const resultat = await agent.vurder(frigivelseId);
      if (!resultat) continue;
      const vurdering = resultat.vurdering || resultat;
      const promptId = resultat.promptId || null;
      await medBruker({ rolle: 'system' }, (c) => c.query(
        `INSERT INTO agent_vurderinger (frigivelse_id, agent, vurdering, prompt_id)
         VALUES ($1, $2, $3, $4)`, [frigivelseId, navn, vurdering, promptId]));
    } catch (feil) {
      console.error(`Agent ${navn} feilet (saken går videre til menneske):`, feil.message);
    }
  }
}
