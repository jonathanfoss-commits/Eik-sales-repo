// Best-effort e-postutsending via provider-agnostisk JSON-API (Resend-kompatibelt
// format). Uten oppsett logges kun hendelsestypen — aldri innhold eller mottaker
// i klartekst utover det driftsloggen trenger.
const API_URL = process.env.EPOST_API_URL || '';
const API_NOKKEL = process.env.EPOST_API_NOKKEL || '';
const FRA = process.env.EPOST_FRA || 'Livsarkivet <varsel@livsarkivet.no>';

export function epostTilgjengelig() {
  return Boolean(API_URL && API_NOKKEL);
}

export async function sendEpost({ til, emne, tekst }) {
  if (!epostTilgjengelig()) {
    console.log(JSON.stringify({ hendelse: 'epost_hoppet_over', grunn: 'ikke_konfigurert' }));
    return false;
  }
  try {
    const svar = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_NOKKEL}` },
      body: JSON.stringify({ from: FRA, to: [til], subject: emne, text: tekst }),
    });
    if (!svar.ok) console.error('E-post feilet:', svar.status);
    return svar.ok;
  } catch (feil) {
    console.error('E-post feilet:', feil.message);
    return false;
  }
}
