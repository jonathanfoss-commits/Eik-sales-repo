// Livsarkivet — HTTP-server. Ingen rammeverk: node:http + liten ruter.
// Statiske filer fra app/, API under /api, sesjonscookie.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from './config.js';
import { Ruter, ApiFeil, svarJson, lesJson, lesCookies } from './http.js';
import { loggInn, loggUt, finnSesjon, registrerSelv, innlosInvitasjon,
  finnBrukerPaaEpost, lagNullstilling, fullforNullstilling, byttPassord } from './auth.js';
import { sendEpost, epostTilgjengelig } from './epost.js';
import { medBruker, authPool } from './db.js';
import * as hvelv from './api/hvelv.js';
import * as kontakter from './api/kontakter.js';
import * as matrise from './api/matrise.js';
import * as hendelse from './api/hendelse.js';
import * as verifisering from './api/verifisering.js';
import * as etterlatt from './api/etterlatt.js';
import * as abonnement from './api/abonnement.js';
import * as krypto from './api/krypto.js';
import * as konto from './api/konto.js';
import { feiKarenstid } from './feier.js';
import { sendUtestaaende } from './varsling.js';

const ruter = new Ruter();
for (const modul of [hvelv, kontakter, matrise, hendelse, verifisering, etterlatt,
  abonnement, krypto, konto]) {
  modul.registrer(ruter);
}

// Karenstid-feieren går også i bakgrunnen, så frigivelse skjer selv om ingen
// leser status. Samme passering tømmer varslingskøen — varsler som ikke ble
// sendt (e-post nede, prosessen døde) blir liggende og sendes her.
// I testmodus styrer testene tiden selv.
if (!config.testmodus) {
  setInterval(() => {
    feiKarenstid()
      .then(() => sendUtestaaende())
      .catch((f) => console.error('Feier:', f.message));
  }, 60_000).unref();
}

// ── Enkel rate-demper (i minnet): innlogging og melding er de utsatte flatene ──
const teller = new Map();
function forMange(nokkel, maks, vinduMs) {
  const naa = Date.now();
  const liste = (teller.get(nokkel) || []).filter((t) => naa - t < vinduMs);
  liste.push(naa);
  teller.set(nokkel, liste);
  return liste.length > maks;
}
setInterval(() => { if (teller.size > 10000) teller.clear(); }, 600_000).unref();

// Bak proxy ser socketen én og samme proxy-IP for ALLE brukere — klient-IP
// leses fra X-Forwarded-For, ellers blir grensene globale.
function klientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'ukjent';
}

// ── Åpne ruter (uten sesjon) ──
const AAPNE = new Set(['POST /api/auth/logg-inn', 'POST /api/auth/registrer',
  'POST /api/auth/innlos-invitasjon', 'GET /api/helse',
  'POST /api/auth/glemt', 'POST /api/auth/nullstill',
  'GET /api/demo/inn',           // egen vaktpost i ruten (kun demomiljø)
  'GET /api/miljo',              // må leses FØR innlogging (demoadvarsel)
  'POST /api/stripe/webhook']); // signaturverifisert i ruten

ruter.add('GET', '/api/helse', async () => ({ ok: true }));

// Et demomiljø må SI at det er et demomiljø. Står demoinnloggingen på, kommer
// hvem som helst med lenken inn — da skal ingen legge inn ekte opplysninger,
// og advarselen må stå der før innloggingsskjemaet, ikke i en README.
// «registrering» styrer om «Opprett ditt livsarkiv» vises i det hele tatt. I
// produksjon står flagget av, og da er knappen en blindvei: brukeren fyller ut
// skjemaet og får «Registrering er ikke åpnet ennå» etterpå.
ruter.add('GET', '/api/miljo', async () => ({
  demo: config.demoInnlogging,
  registrering: config.registreringAapen,
}));

function settSesjonsCookie(res, token) {
  const sikker = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `livsarkiv_sesjon=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${14 * 86400}${sikker}`);
}

ruter.add('POST', '/api/auth/logg-inn', async ({ req, body, res }) => {
  // dobbel nøkkel: per klient-IP OG per e-post — verner kontoen selv når
  // mange deler IP, uten at én angriper kan låse ute alle
  const epostNokkel = String(body.epost || '').trim().toLowerCase();
  if (forMange('login:' + klientIp(req), config.loginPerIpKvarter, 15 * 60_000)
      || forMange('login-epost:' + epostNokkel, 10, 15 * 60_000)) {
    throw new ApiFeil(429, 'For mange forsøk — vent et kvarter');
  }
  const resultat = await loggInn(body.epost, body.passord, body.totp);
  if (!resultat) throw new ApiFeil(401, 'Feil e-post eller passord');
  if (resultat.manglerTotpOppsett) {
    throw new ApiFeil(403, 'Saksbehandlerkontoen mangler tofaktor og kan ikke brukes. '
      + 'Drift må opprette den på nytt med server/verktoy/ny-admin.js.');
  }
  if (resultat.trengerTotp) return { trengerTotp: true };
  settSesjonsCookie(res, resultat.token);
  return { bruker: resultat.bruker };
});

ruter.add('POST', '/api/auth/registrer', async ({ req, body }) => {
  if (forMange('registrer:' + klientIp(req), 20, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  const resultat = await registrerSelv(body);
  if (resultat.feil) throw new ApiFeil(400, resultat.feil);
  return { ok: true, navn: resultat.bruker.navn };
});

// Innløsning virker både utlogget (oppretter konto) og innlogget (kobler
// eksisterende konto til kontaktraden). Selve koblingen kontakt→bruker gjøres
// med app-rollen — auth-laget har ikke tilgang til kontakter-tabellen.
ruter.add('POST', '/api/auth/innlos-invitasjon', async ({ req, body, res }) => {
  if (forMange('innlos:' + klientIp(req), 20, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  const sesjon = await finnSesjon(lesCookies(req).livsarkiv_sesjon);
  const resultat = await innlosInvitasjon({ ...body, innloggetBrukerId: sesjon?.brukerId });
  if (resultat.feil) throw new ApiFeil(400, resultat.feil);
  if (resultat.kontaktId) {
    await medBruker({ rolle: 'system' }, (c) => c.query(
      'UPDATE kontakter SET bruker_id = $2 WHERE id = $1', [resultat.kontaktId, resultat.brukerId]));
  }
  // ny konto: logg rett inn (passordet ble nettopp satt, e-posten står på invitasjonen)
  if (!sesjon && resultat.bruker) {
    settSesjonsCookie(res, await loggInnMedId(resultat.bruker));
  }
  return { ok: true };
});

// Ny konto fra invitasjon: lag sesjon direkte (passordet er alt verifisert satt).
async function loggInnMedId(bruker) {
  const token = crypto.randomBytes(32).toString('hex');
  const utloper = new Date(Date.now() + 14 * 86400_000);
  await authPool.query(
    'INSERT INTO sesjoner (token_hash, bruker_id, utloper) VALUES ($1, $2, $3)',
    [crypto.createHash('sha256').update(token).digest('hex'), bruker.id, utloper]);
  return token;
}

// Ett-trykks innlogging for demoing (DEMO_INNLOGGING=1). Ingen «av med
// innlogging»-modus finnes, og skal ikke finnes: hele appen er definert av hvem
// du er, og RLS gir null rader uten bruker. Dette lager en EKTE sesjon for en
// demokonto, slik at alt du ser er produktets virkelige oppførsel.
// Strukturell grense: bare @demo.livsarkivet.no kan nås — aldri en ekte konto.
ruter.add('GET', '/api/demo/inn', async ({ sok, res }) => {
  if (!config.demoInnlogging) throw new ApiFeil(404, 'Ukjent API-rute');
  const kort = String(sok.get('som') || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{1,40}$/.test(kort)) throw new ApiFeil(400, 'Ugyldig kontonavn');
  const epost = `${kort}@demo.livsarkivet.no`;
  const bruker = (await authPool.query(
    'SELECT id, navn FROM brukere WHERE epost = $1 AND aktiv', [epost])).rows[0];
  if (!bruker) throw new ApiFeil(404, `Fant ingen demokonto «${kort}»`);
  console.log(JSON.stringify({ hendelse: 'demo_innlogging', konto: epost }));
  settSesjonsCookie(res, await loggInnMedId(bruker));
  return { _omdirigering: '/' };
});

// /api/meg: hvem er jeg, og hvilke hvelv er jeg betrodd kontakt i?
ruter.add('GET', '/api/meg', ({ ctx }) => medBruker(ctx, async (c) => {
  const betroddI = (await c.query(
    `SELECT h.id AS hvelv_id, b.navn AS eier_navn
       FROM kontakter k JOIN hvelv h ON h.id = k.hvelv_id JOIN brukere b ON b.id = h.eier_id
      WHERE k.bruker_id = $1 AND k.er_betrodd`, [ctx.brukerId])).rows;
  return { bruker: { id: ctx.brukerId, navn: ctx.navn, rolle: ctx.rolle }, betroddI };
}));

// Glemt passord: svarer alltid likt (røper aldri om e-posten finnes).
ruter.add('POST', '/api/auth/glemt', async ({ req, body }) => {
  if (forMange('glemt:' + klientIp(req), 10, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  if (!epostTilgjengelig()) {
    return { ok: true, melding: 'E-postutsending er ikke satt opp ennå — kontakt oss, så hjelper vi deg inn.' };
  }
  const bruker = await finnBrukerPaaEpost(body.epost);
  if (bruker) {
    const kode = await lagNullstilling(bruker.id);
    await sendEpost({
      til: String(body.epost).trim(),
      emne: 'Nullstill passordet ditt i Livsarkivet',
      tekst: `Hei ${bruker.navn}!\n\nNoen (forhåpentligvis du) ba om å nullstille passordet.\n` +
        `Kode: ${kode}\n\nÅpne Livsarkivet → «Glemt passord?» → skriv inn koden.\n` +
        `Koden varer i 2 timer. Var ikke dette deg, kan du se bort fra denne e-posten.`,
    });
  }
  return { ok: true, melding: 'Hvis e-posten finnes hos oss, er det sendt en kode dit nå.' };
});

ruter.add('POST', '/api/auth/nullstill', async ({ req, body }) => {
  if (forMange('nullstill:' + klientIp(req), 10, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  const resultat = await fullforNullstilling(body.kode, body.passord);
  if (resultat.feil) throw new ApiFeil(400, resultat.feil);
  return { ok: true };
});

ruter.add('POST', '/api/auth/passord', async ({ req, ctx, body }) => {
  if (forMange('passord:' + ctx.brukerId, 10, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  const resultat = await byttPassord(ctx.brukerId, body.gammelt, body.nytt,
    lesCookies(req).livsarkiv_sesjon);
  if (resultat.feil) throw new ApiFeil(400, resultat.feil);
  return { ok: true };
});

ruter.add('POST', '/api/auth/logg-ut', async ({ req, res }) => {
  await loggUt(lesCookies(req).livsarkiv_sesjon);
  res.setHeader('Set-Cookie', 'livsarkiv_sesjon=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  return { ok: true };
});

function lesRaa(req, maksBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let biter = [], lengde = 0;
    req.on('data', (bit) => {
      lengde += bit.length;
      if (lengde > maksBytes) { reject(new ApiFeil(413, 'For stor forespørsel')); req.destroy(); }
      else biter.push(bit);
    });
    req.on('end', () => resolve(Buffer.concat(biter).toString('utf8')));
    req.on('error', reject);
  });
}

// ── Statiske filer ──
const APP_DIR = path.join(config.rot, 'app');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function serverStatisk(req, res, sti) {
  if (sti === '/') sti = '/index.html';
  const full = path.normalize(path.join(APP_DIR, sti));
  if (!full.startsWith(APP_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Ikke funnet');
    return;
  }
  res.writeHead(200, {
    'Content-Type': MIME[path.extname(full)] || 'application/octet-stream',
    'Cache-Control': full.endsWith('.html') ? 'no-cache' : 'public, max-age=300',
  });
  fs.createReadStream(full).pipe(res);
}

// ── Selve serveren ──
const server = http.createServer(async (req, res) => {
  // Driftslogg: metode, sti, status, varighet og rolle — ALDRI kropp/innhold.
  const t0 = Date.now();
  res.on('finish', () => {
    if (req.url.startsWith('/api/') && req.url !== '/api/helse') {
      console.log(JSON.stringify({ tid: new Date().toISOString(), m: req.method,
        sti: req.url.split('?')[0], status: res.statusCode, ms: Date.now() - t0,
        rolle: res._rolle || null }));
    }
  });
  // Sikkerhetsheadere på alt: CSP uten eksterne kilder, ingen innramming.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  // Ingenting her hører hjemme i et søkeresultat — heller ikke innloggingssiden
  // til et testmiljø hvis lenke er delt i en e-post.
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
    "script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  const url = new URL(req.url, 'http://x');
  const sti = url.pathname;

  try {
    if (!sti.startsWith('/api/')) return serverStatisk(req, res, sti);

    const noekkel = `${req.method} ${sti}`;
    let ctx = null;
    if (!AAPNE.has(noekkel)) {
      ctx = await finnSesjon(lesCookies(req).livsarkiv_sesjon);
      if (!ctx) throw new ApiFeil(401, 'Logg inn først');
      res._rolle = ctx.rolle;
    }

    // Dyre flater dempes per bruker: attestopplasting tar inntil 10 MB, og
    // eksporten dumper hele hvelvet. Uten demping kunne én konto belaste
    // basen fritt.
    if (ctx && req.method === 'POST' && /^\/api\/hendelser\/[^/]+\/attest$/.test(sti)
        && forMange('attest:' + ctx.brukerId, 20, 60 * 60_000)) {
      throw new ApiFeil(429, 'For mange attestopplastinger — vent litt');
    }
    if (ctx && req.method === 'GET' && sti === '/api/eksport'
        && forMange('eksport:' + ctx.brukerId, 10, 60 * 60_000)) {
      throw new ApiFeil(429, 'For mange eksporter — vent litt');
    }

    const rute = ruter.finn(req.method, sti);
    if (!rute) throw new ApiFeil(404, 'Ukjent API-rute');
    // Stripe-webhooken signeres over RÅKROPPEN — den må leses uparsset.
    const body = sti === '/api/stripe/webhook'
      ? { _raa: await lesRaa(req) }
      : ['POST', 'PUT', 'PATCH'].includes(req.method) ? await lesJson(req) : {};
    const resultat = await rute.handler({ req, res, ctx, body, params: rute.params, sok: url.searchParams });
    if (resultat && resultat._omdirigering !== undefined) {
      res.writeHead(302, { Location: resultat._omdirigering, 'Cache-Control': 'no-store' });
      res.end();
    } else if (resultat && resultat._fil !== undefined) {
      // Opplastede filer serveres bare INLINE når typen er trygg å vise (PDF og
      // bilder). Alt annet lastes ned. I tillegg får svaret sin egen, strengeste
      // CSP med sandbox, så en fil aldri kan oppføre seg som en side på vårt
      // domene — attesten kommer fra en betrodd kontakt, ikke fra oss.
      const TRYGGE_INLINE = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'];
      const mime = resultat._fil.mime || 'application/octet-stream';
      const plassering = (!resultat._fil.nedlasting && TRYGGE_INLINE.includes(mime))
        ? 'inline' : 'attachment';
      // filnavn: strip stier og anførselstegn før det havner i headeren
      const filnavn = String(resultat._fil.filnavn || 'fil')
        .replace(/[\\/]/g, '_').replace(/["\r\n]/g, '').slice(0, 100);
      res.writeHead(200, { 'Content-Type': mime,
        'Content-Disposition': `${plassering}; filename="${filnavn}"`,
        'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "sandbox; default-src 'none'" });
      res.end(resultat._fil.innhold);
    } else {
      svarJson(res, 200, resultat ?? { ok: true });
    }
  } catch (feil) {
    const status = feil instanceof ApiFeil ? feil.status : 500;
    if (status === 500) console.error('API-feil:', feil);
    svarJson(res, status, { feil: feil instanceof ApiFeil ? feil.message : 'Uventet feil på serveren',
      ...(feil.data || {}) });
  }
});

// Farlige kombinasjoner skal ikke kunne gli umerket ut i produksjon. Vi stopper
// ikke oppstarten (testmiljøet kjører med NODE_ENV=production med vilje), men
// roper høyt i loggen så det blir synlig ved gjennomgang.
function advarOmRisikoFlagg() {
  if (process.env.NODE_ENV !== 'production') return;
  const funn = [];
  if (config.demoInnlogging) funn.push('DEMO_INNLOGGING=1 — hvem som helst med lenken kommer inn som en demokonto');
  if (config.registreringAapen) funn.push('REGISTRERING_AAPEN=1 — hvem som helst kan opprette konto');
  if (config.karenstidSekunder < 48 * 3600) funn.push(`KARENSTID_SEKUNDER=${config.karenstidSekunder} — kortere enn de 48 timene som er lovet i vilkårene`);
  if (!funn.length) return;
  console.warn('\n⚠ ADVARSEL — flagg som ikke hører i et produksjonsmiljø med ekte brukere:');
  for (const f of funn) console.warn('  · ' + f);
  console.warn('  Er dette et testmiljø, er alt i orden. Er det ikke, skru dem av nå.\n');
}

server.listen(config.port, () => {
  console.log(`Livsarkivet kjører på :${config.port}`);
  advarOmRisikoFlagg();
});
