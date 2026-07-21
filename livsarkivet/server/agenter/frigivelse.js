// Frigivelsesagenten: AI-assistert attestkontroll — et RÅD til saksbehandleren.
//
// Ufravikelig: agenten kan ALDRI godkjenne. `anbefaling` er hardkodet til
// 'menneskelig_vurdering' ETTER modellsvaret — uansett hva modellen (eller et
// injisert dokument) måtte påstå. Fire-øyne-flyten kjenner ikke dette rådet.
import { medBruker } from '../db.js';
import { kjorModell } from '../ai/gateway.js';

const SYSTEM = `Du er attestkontrollør i Livsarkivet. Du får et opplastet dokument som
PÅSTÅS å være en norsk dødsattest, pluss sakens metadata. Vurder nøkternt:
ligner dokumentet en dødsattest (struktur, felter, utsteder), og nevnes
personnavnet fra saken? Du beslutter INGENTING — en saksbehandler gjør alltid
den vurderingen. Svar KUN med gyldig JSON på formen:
{"ser_ut_som_attest": true/false, "navn_treff": true/false, "avvik": ["..."], "kommentar": "kort og nøktern"}`;

// Grov tekstuthenting fra vilkårlige filer (PDF-er bærer ofte lesbar tekst).
// Full PDF-parsing er bevisst utelatt — ingen nye avhengigheter for et råd.
function lesbarTekst(buffer) {
  return buffer.toString('latin1')
    .replace(/[^\x20-\x7EæøåÆØÅöÖäÄéÉ\n\r\t]/g, ' ')
    .replace(/[ \t]{3,}/g, '  ');
}

export async function vurder(frigivelseId) {
  const sak = await medBruker({ rolle: 'system' }, async (c) => {
    const rad = (await c.query(
      `SELECT f.id, h.id AS hendelse_id, b.navn AS eier_navn
         FROM frigivelser f
         JOIN hendelser h ON h.id = f.hendelse_id
         JOIN hvelv hv ON hv.id = f.hvelv_id
         JOIN brukere b ON b.id = hv.eier_id
        WHERE f.id = $1`, [frigivelseId])).rows[0];
    if (!rad) return null;
    const attest = (await c.query(
      `SELECT id, filnavn, mime, innhold FROM attester
        WHERE hendelse_id = $1 AND status = 'mottatt'
        ORDER BY opprettet DESC LIMIT 1`, [rad.hendelse_id])).rows[0];
    return { ...rad, attest };
  });
  if (!sak?.attest) return null;

  const svar = await kjorModell({
    agent: 'frigivelse',
    modell: 'claude-opus-4-8', // dokumentvurdering — aldri stille nedgradert
    system: SYSTEM,
    dokument: lesbarTekst(sak.attest.innhold),
    sporsmal: `Sakens metadata: avdøde skal være «${sak.eier_navn}». ` +
      `Filnavn: ${sak.attest.filnavn} (${sak.attest.mime}). Vurder dokumentet.`,
  });

  if (svar.utilgjengelig) {
    return { promptId: svar.promptId,
      vurdering: { utilgjengelig: true, grunn: svar.grunn, anbefaling: 'menneskelig_vurdering' } };
  }

  let tolket = {};
  try {
    tolket = JSON.parse(svar.tekst.match(/\{[\s\S]*\}/)?.[0] || '{}');
  } catch { tolket = { avvik: ['kunne ikke tolke modellsvaret'] }; }

  // Hardkodet etter modellsvaret: rådet kan aldri bli noe annet enn
  // «menneskelig vurdering» — uansett injeksjon eller modellpåfunn.
  return { promptId: svar.promptId, vurdering: {
    ser_ut_som_attest: tolket.ser_ut_som_attest === true,
    navn_treff: tolket.navn_treff === true,
    avvik: Array.isArray(tolket.avvik) ? tolket.avvik.map(String).slice(0, 10) : [],
    kommentar: String(tolket.kommentar || '').slice(0, 500),
    anbefaling: 'menneskelig_vurdering',
  } };
}
