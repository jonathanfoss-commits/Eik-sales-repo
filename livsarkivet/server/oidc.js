// OpenID Connect mot selskapets egen identitetsleverandør.
// Authorization Code + PKCE, ingen avhengigheter: node:crypto kan importere
// JWKS-nøkler direkte (`format: 'jwk'`) og verifisere RS256.
//
// Det som verifiseres på id_token, og hvorfor hver enkelt:
//   signatur  — ellers kan hvem som helst skrive sitt eget token
//   iss       — bundet til tenantens konfigurerte utsteder, så en annen IdP
//               ikke kan logge inn hos feil selskap
//   aud       — tokenet må være utstedt TIL oss, ikke til en annen klient
//   exp/iat   — ferskhet, med et lite slingringsmonn for klokkeskjev
//   nonce     — knytter tokenet til DENNE innloggingen; uten den kan et
//               gyldig token fra en annen økt spilles av
import crypto from 'node:crypto';

const SLINGRING_S = 120;          // klokkeskjev mellom oss og IdP-en
const TIDSAVBRUDD_MS = 10_000;

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function nyPkce() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const utfordring = b64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, utfordring };
}

async function hentJson(url, valg = {}) {
  const svar = await fetch(url, { ...valg, signal: AbortSignal.timeout(TIDSAVBRUDD_MS) });
  if (!svar.ok) throw new Error(`${url} svarte ${svar.status}`);
  return svar.json();
}

// Discovery og JWKS caches: de spørres ved hver innlogging, og endres sjelden.
// Fem minutter er kort nok til at en nøkkelrotasjon hos IdP-en går gjennom av
// seg selv, og langt nok til at vi ikke banker på ved hvert klikk.
const cache = new Map();
async function medCache(nokkel, hent) {
  const treff = cache.get(nokkel);
  if (treff && Date.now() - treff.tid < 5 * 60_000) return treff.verdi;
  const verdi = await hent();
  cache.set(nokkel, { tid: Date.now(), verdi });
  return verdi;
}
export function tomOidcCache() { cache.clear(); }

export function oppdag(issuer) {
  return medCache('oppdag:' + issuer, () =>
    hentJson(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`));
}

function hentNokler(jwksUri) {
  return medCache('jwks:' + jwksUri, () => hentJson(jwksUri));
}

// Verifiser id_token. Kaster ved ALT som ikke stemmer — det finnes ingen
// «nesten gyldig» her.
export async function verifiserIdToken(token, { issuer, klientId, nonce, jwksUri }) {
  const deler = String(token || '').split('.');
  if (deler.length !== 3) throw new Error('id_token har ikke tre deler');
  const [hodeB64, kroppB64, signaturB64] = deler;
  const hode = JSON.parse(Buffer.from(hodeB64, 'base64url'));
  const krav = JSON.parse(Buffer.from(kroppB64, 'base64url'));

  if (hode.alg !== 'RS256') throw new Error(`uventet algoritme ${hode.alg}`);

  const { keys } = await hentNokler(jwksUri);
  const jwk = (keys || []).find((k) => k.kid === hode.kid) || (keys || [])[0];
  if (!jwk) throw new Error('fant ingen nøkkel i JWKS');
  const nokkel = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${hodeB64}.${kroppB64}`),
    nokkel, Buffer.from(signaturB64, 'base64url'));
  if (!ok) throw new Error('signaturen stemmer ikke');

  const naa = Math.floor(Date.now() / 1000);
  if (krav.iss !== issuer) throw new Error('feil utsteder');
  const aud = Array.isArray(krav.aud) ? krav.aud : [krav.aud];
  if (!aud.includes(klientId)) throw new Error('tokenet er ikke utstedt til oss');
  if (typeof krav.exp !== 'number' || krav.exp + SLINGRING_S < naa) {
    throw new Error('tokenet er utløpt');
  }
  if (typeof krav.iat === 'number' && krav.iat - SLINGRING_S > naa) {
    throw new Error('tokenet er utstedt i framtiden');
  }
  if (krav.nonce !== nonce) throw new Error('nonce stemmer ikke');
  if (!krav.sub) throw new Error('tokenet mangler sub');
  return krav;
}

export function autoriseringsUrl(oppdaget, { klientId, tilbakeUrl, state, nonce, utfordring }) {
  const u = new URL(oppdaget.authorization_endpoint);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', klientId);
  u.searchParams.set('redirect_uri', tilbakeUrl);
  u.searchParams.set('scope', 'openid profile email');
  u.searchParams.set('state', state);
  u.searchParams.set('nonce', nonce);
  u.searchParams.set('code_challenge', utfordring);
  u.searchParams.set('code_challenge_method', 'S256');
  return u.toString();
}

export async function bytteKode(oppdaget, { kode, tilbakeUrl, klientId, hemmelighet, verifier }) {
  const kropp = new URLSearchParams({
    grant_type: 'authorization_code',
    code: kode,
    redirect_uri: tilbakeUrl,
    client_id: klientId,
    code_verifier: verifier,
  });
  const headere = { 'Content-Type': 'application/x-www-form-urlencoded' };
  // Konfidensiell klient: hemmeligheten i Basic-header, ikke i kroppen —
  // den havner ellers i tilbydernes tilgangslogger.
  if (hemmelighet) {
    headere.Authorization = 'Basic '
      + Buffer.from(`${encodeURIComponent(klientId)}:${encodeURIComponent(hemmelighet)}`)
        .toString('base64');
  }
  return hentJson(oppdaget.token_endpoint, { method: 'POST', headers: headere, body: kropp });
}
