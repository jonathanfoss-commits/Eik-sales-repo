// Webhook-utsending: samme holdbarhetsmønster som varsling.js. Radene legges i
// kø innenfor frigivelsestransaksjonen (ko_webhooks); denne passeringen er
// separat, gjentakbar og trygg å kalle så ofte man vil.
//
// Signaturen lar selskapet bevise at kallet kom fra oss:
//   X-Livsarkivet-Signatur: sha256=<hmac over "<tidsstempel>.<kropp>">
//   X-Livsarkivet-Tidsstempel: <unix-sekunder>
// Tidsstemplet er med i det signerte for å hindre at et gammelt, gyldig kall
// spilles av på nytt. Selskapet skal avvise tidsstempler eldre enn ~5 minutter.
import crypto from 'node:crypto';
import { medBruker } from './db.js';

const TIDSAVBRUDD_MS = 10_000;

export function signer(hemmelighet, tidsstempel, kropp) {
  return 'sha256=' + crypto.createHmac('sha256', hemmelighet)
    .update(`${tidsstempel}.${kropp}`).digest('hex');
}

export async function sendUtestaaendeWebhooks(maks = 50) {
  const koe = await medBruker({ rolle: 'system' }, async (c) =>
    (await c.query('SELECT * FROM utestaaende_webhooks($1)', [maks])).rows);
  let sendt = 0;
  for (const u of koe) {
    const kropp = JSON.stringify(u.nyttelast);
    const tidsstempel = Math.floor(Date.now() / 1000);
    let ok = false;
    let feil = '';
    try {
      const svar = await fetch(u.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Livsarkivet-Signatur': signer(u.hemmelighet, tidsstempel, kropp),
          'X-Livsarkivet-Tidsstempel': String(tidsstempel),
        },
        body: kropp,
        signal: AbortSignal.timeout(TIDSAVBRUDD_MS),
      });
      ok = svar.ok;
      if (!ok) feil = `HTTP ${svar.status}`;
    } catch (e) {
      feil = e.name === 'TimeoutError' ? 'tidsavbrudd' : String(e.message || e);
    }
    await medBruker({ rolle: 'system' }, (c) =>
      c.query('SELECT webhook_resultat($1, $2, $3)', [u.id, ok, feil]));
    if (ok) sendt++;
  }
  return sendt;
}
