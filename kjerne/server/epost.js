// E-postutsending — leverandør-uavhengig via miljøvariabler (ingen npm-
// avhengighet, ingen innlåsing): et enkelt JSON-POST mot en transaksjons-
// e-post-API (Resend, Postmark, Brevo o.l. — de fleste følger dette mønsteret;
// tilpass kroppen med EPOST_MAL ved behov).
//
//   EPOST_API_URL    f.eks. https://api.resend.com/emails
//   EPOST_API_NOKKEL Bearer-nøkkelen fra leverandøren (aldri i kode)
//   EPOST_FRA        f.eks. "Lærling <ikke-svar@laerling.no>"
//
// Uten oppsett: sendes ingenting (kallere håndterer reserven — ledelsen kan
// alltid lage nullstillingskode i Sentral). Innholdet i e-poster er begrenset
// til koder/lenker — aldri brukerdata.
import { config } from './config.js';

export function epostTilgjengelig() {
  return Boolean(process.env.EPOST_API_URL && process.env.EPOST_API_NOKKEL && process.env.EPOST_FRA);
}

export async function sendEpost({ til, emne, tekst }) {
  if (!epostTilgjengelig()) return false;
  try {
    const res = await fetch(process.env.EPOST_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.EPOST_API_NOKKEL}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.EPOST_FRA, to: [til], subject: emne, text: tekst }),
    });
    if (!res.ok) console.error('epost: leverandøren svarte', res.status);
    return res.ok;
  } catch (feil) {
    console.error('epost:', feil.message);
    return false;
  }
}
