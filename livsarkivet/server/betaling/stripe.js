// Stripe-integrasjon med rå fetch — ingen SDK-avhengighet. Test-mode-nøkler i
// miljøvariabler; uten oppsett svarer API-et rent «ikke satt opp».
import crypto from 'node:crypto';

const BASE = () => process.env.STRIPE_BASE_URL || 'https://api.stripe.com';
const HEMMELIG = () => process.env.STRIPE_SECRET || '';
const PRIS_ID = () => process.env.STRIPE_PRIS_ID || '';
const WEBHOOK_HEMMELIGHET = () => process.env.STRIPE_WEBHOOK_HEMMELIGHET || '';
const APP_URL = () => process.env.APP_URL || 'http://localhost:3400';

export function stripeTilgjengelig() {
  return Boolean(HEMMELIG() && PRIS_ID());
}

// Checkout-økt for abonnement. Returnerer { url } til Stripes betalingsside.
export async function opprettCheckout({ brukerId, epost }) {
  const felter = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': PRIS_ID(),
    'line_items[0][quantity]': '1',
    customer_email: epost,
    client_reference_id: brukerId,
    success_url: `${APP_URL()}/#hvelv`,
    cancel_url: `${APP_URL()}/#hvelv`,
  });
  const svar = await fetch(`${BASE()}/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HEMMELIG()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: felter.toString(),
  });
  if (!svar.ok) throw new Error(`Stripe svarte ${svar.status}`);
  const data = await svar.json();
  return { url: data.url };
}

// Stripes signaturskjema: header «t=<unix>,v1=<hmac>», HMAC-SHA256 av
// «<t>.<råkropp>» med webhook-hemmeligheten. 5 minutters klokkeslingring.
export function verifiserSignatur(raaKropp, signaturHeader, naaMs = Date.now()) {
  const deler = Object.fromEntries(String(signaturHeader || '').split(',')
    .map((d) => d.split('=')).filter((d) => d.length === 2));
  if (!deler.t || !deler.v1) return false;
  if (Math.abs(naaMs / 1000 - Number(deler.t)) > 300) return false;
  const ventet = crypto.createHmac('sha256', WEBHOOK_HEMMELIGHET())
    .update(`${deler.t}.${raaKropp}`).digest('hex');
  const a = Buffer.from(ventet);
  const b = Buffer.from(String(deler.v1));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
