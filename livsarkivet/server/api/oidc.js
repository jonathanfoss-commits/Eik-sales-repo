// Innloggingsflyten mot selskapets IdP. To ruter, begge uten sesjon:
//   GET /api/auth/oidc/start    → sender brukeren til selskapets innlogging
//   GET /api/auth/oidc/tilbake  → tar imot koden, verifiserer, lager sesjon
import crypto from 'node:crypto';
import { ApiFeil, settSesjonsCookie } from '../http.js';
import { lagSesjon } from '../auth.js';
import { medBruker } from '../db.js';
import { finnTenant } from '../tenant.js';
import { oppdag, nyPkce, autoriseringsUrl, bytteKode, verifiserIdToken } from '../oidc.js';

// redirect_uri bygges fra vertsnavnet forespørselen kom inn på, slik at hvert
// selskap bruker sin egen adresse. At Host kan forfalskes spiller ingen rolle:
// IdP-en godtar kun redirect_uri-er som står i selskapets egen liste hos dem,
// så en forfalsket vert ender i avvisning der — ikke hos oss.
function tilbakeUrl(req) {
  const vert = String(req.headers.host || 'localhost:3400');
  const skjema = /^(localhost|127\.0\.0\.1)(:|$)/.test(vert) ? 'http' : 'https';
  return `${skjema}://${vert}/api/auth/oidc/tilbake`;
}

async function konfigFor(req) {
  const tenant = await finnTenant(req);
  if (!tenant) throw new ApiFeil(404, 'Ukjent innloggingsadresse');
  const rad = await medBruker({ rolle: 'system' }, async (c) =>
    (await c.query('SELECT * FROM oidc_for_tenant($1)', [tenant.id])).rows[0]);
  if (!rad) throw new ApiFeil(404, 'Innlogging via selskapet er ikke satt opp her');
  return { tenant, ...rad };
}

export function registrer(ruter) {
  ruter.add('GET', '/api/auth/oidc/start', async ({ req }) => {
    const k = await konfigFor(req);
    const oppdaget = await oppdag(k.issuer);
    const state = crypto.randomBytes(24).toString('base64url');
    const nonce = crypto.randomBytes(24).toString('base64url');
    const pkce = nyPkce();
    await medBruker({ rolle: 'system' }, (c) => c.query(
      'SELECT oidc_start_forsok($1, $2, $3, $4)',
      [state, k.tenant.id, nonce, pkce.verifier]));
    return { _omdirigering: autoriseringsUrl(oppdaget, {
      klientId: k.klient_id, tilbakeUrl: tilbakeUrl(req), state, nonce,
      utfordring: pkce.utfordring }) };
  });

  ruter.add('GET', '/api/auth/oidc/tilbake', async ({ req, sok, res }) => {
    // IdP-en melder avbrudd og feil i selve omdirigeringen
    if (sok.get('error')) {
      throw new ApiFeil(400, `Innlogging avbrutt: ${sok.get('error')}`);
    }
    const kode = sok.get('code');
    const state = sok.get('state');
    if (!kode || !state) throw new ApiFeil(400, 'Mangler kode eller state');

    // Innløsningen SLETTER forsøket. Kommer samme state igjen, finnes den ikke.
    const forsok = await medBruker({ rolle: 'system' }, async (c) =>
      (await c.query('SELECT * FROM oidc_los_inn_forsok($1)', [state])).rows[0]);
    if (!forsok) throw new ApiFeil(400, 'Ugyldig eller brukt innlogging — prøv på nytt');

    const k = await konfigFor(req);
    // Forsøket er bundet til tenanten det ble startet på. Uten denne sjekken
    // kunne en state startet hos ett selskap fullføres hos et annet.
    if (forsok.tenant_id !== k.tenant.id) {
      throw new ApiFeil(400, 'Innloggingen hører til en annen adresse');
    }

    const oppdaget = await oppdag(k.issuer);
    let svar;
    try {
      svar = await bytteKode(oppdaget, { kode, tilbakeUrl: tilbakeUrl(req),
        klientId: k.klient_id, hemmelighet: k.klient_hemmelighet,
        verifier: forsok.kode_verifier });
    } catch (e) {
      console.error(JSON.stringify({ hendelse: 'oidc_kodebytte_feilet', feil: e.message }));
      throw new ApiFeil(502, 'Fikk ikke svar fra selskapets innlogging');
    }
    if (!svar.id_token) throw new ApiFeil(502, 'Selskapets innlogging svarte uten id_token');

    let krav;
    try {
      krav = await verifiserIdToken(svar.id_token, {
        issuer: k.issuer, klientId: k.klient_id, nonce: forsok.nonce,
        jwksUri: oppdaget.jwks_uri });
    } catch (e) {
      console.error(JSON.stringify({ hendelse: 'oidc_token_avvist', feil: e.message }));
      throw new ApiFeil(401, 'Innloggingen kunne ikke verifiseres');
    }

    const epost = String(krav.email || '').trim().toLowerCase();
    if (!epost) throw new ApiFeil(400, 'Selskapets innlogging ga ingen e-postadresse');

    const rad = await medBruker({ rolle: 'system' }, async (c) =>
      (await c.query('SELECT * FROM oidc_koble_bruker($1, $2, $3, $4, $5)',
        [k.tenant.id, k.issuer, krav.sub, epost,
          String(krav.name || epost).slice(0, 100)])).rows[0]);

    if (rad.status === 'epost_finnes') {
      throw new ApiFeil(409, 'Det finnes alt en konto med denne e-posten. '
        + 'Logg inn med passord først, så kan du koble til selskapets innlogging.');
    }
    if (rad.status === 'deaktivert') throw new ApiFeil(403, 'Kontoen er deaktivert');

    console.log(JSON.stringify({ hendelse: 'oidc_innlogging', status: rad.status,
      bruker_id: rad.id }));
    settSesjonsCookie(res, await lagSesjon(rad.id));
    return { _omdirigering: '/' };
  });
}
