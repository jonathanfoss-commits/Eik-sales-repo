// Kvalitetsagenten: QA på utgående tekst til mennesker i sorg — her
// saksbehandlerens avvisningsgrunn (den leses av melderen, ofte en pårørende).
// Rådgivende port: flagger den, får saksbehandleren forslag og kan omformulere
// eller bevisst overstyre. Er AI utilgjengelig, går teksten rett igjennom —
// mennesket har alltid siste ord, og ingenting blokkerer på AI-nedetid.
import { kjorModell } from '../ai/gateway.js';

const SYSTEM = `Du kvalitetssikrer korte beskjeder fra Livsarkivets saksbehandlere til
pårørende som nettopp har meldt et dødsfall. Vurder KUN om teksten er
sørgesensitiv: nøktern, respektfull, uten byråkratisk kulde eller anklager.
Svar KUN med gyldig JSON: {"ok": true/false, "forslag": "bedre formulering hvis ok=false, ellers tom"}`;

export async function vurderTekst(tekst) {
  const svar = await kjorModell({
    agent: 'kvalitet',
    modell: 'claude-haiku-4-5',
    system: SYSTEM,
    dokument: tekst,
    sporsmal: 'Vurder teksten i dokumentet.',
  });
  if (svar.utilgjengelig) return { promptId: svar.promptId, ok: true, utilgjengelig: true };
  try {
    const tolket = JSON.parse(svar.tekst.match(/\{[\s\S]*\}/)?.[0] || '{}');
    return { promptId: svar.promptId, ok: tolket.ok !== false,
      forslag: String(tolket.forslag || '').slice(0, 500) };
  } catch {
    return { promptId: svar.promptId, ok: true, utilgjengelig: true };
  }
}
