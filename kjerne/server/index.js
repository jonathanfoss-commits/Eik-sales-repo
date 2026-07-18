// Plattformkjernen — HTTP-server. Ingen rammeverk: node:http + liten ruter.
// Statiske filer fra app/, API under /api, sesjonscookie, SSE for live-laget.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { Ruter, ApiFeil, svarJson, lesJson, lesCookies } from './http.js';
import { loggInn, loggUt, finnSesjon, registrerMedInvitasjon } from './auth.js';
import { medOrg } from './db.js';
import { abonner } from './buss.js';
import * as timer from './api/timer.js';
import * as dagbok from './api/dagbok.js';
import * as varsler from './api/varsler.js';
import * as innspill from './api/innspill.js';
import * as skriv from './api/skriv.js';
import * as sentral from './api/sentral.js';
import * as innflytting from './api/innflytting.js';
import * as personvern from './api/personvern.js';

const ruter = new Ruter();
for (const modul of [timer, dagbok, varsler, innspill, skriv, sentral, innflytting, personvern]) {
  modul.registrer(ruter);
}

// ── Enkel rate-demper (i minnet): innlogging og AI er de dyre/utsatte flatene ──
const teller = new Map();
function forMange(nokkel, maks, vinduMs) {
  const naa = Date.now();
  const liste = (teller.get(nokkel) || []).filter((t) => naa - t < vinduMs);
  liste.push(naa);
  teller.set(nokkel, liste);
  return liste.length > maks;
}
setInterval(() => { if (teller.size > 10000) teller.clear(); }, 600_000).unref();

// Bak Render/proxy ser socketen én og samme proxy-IP for ALLE brukere — da må
// klient-IP-en leses fra X-Forwarded-For (settes av plattformen; første ledd er
// klienten), ellers blir innloggingsgrensen global og et lite antall feilforsøk
// låser hele organisasjonen ute (funn fra sikkerhetsgjennomgangen).
function klientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req.socket.remoteAddress || 'ukjent';
}

// ── Åpne ruter (uten sesjon) ──
const AAPNE = new Set(['POST /api/login', 'POST /api/registrer', 'GET /api/helse']);

ruter.add('GET', '/api/helse', async () => ({ ok: true }));

ruter.add('POST', '/api/login', async ({ req, body, res }) => {
  // dobbel nøkkel: per klient-IP OG per e-post — verner kontoen selv når
  // mange deler IP, uten at én angriper kan låse ute hele organisasjonen
  const epostNokkel = String(body.epost || '').trim().toLowerCase();
  if (forMange('login:' + klientIp(req), 30, 15 * 60_000)
      || forMange('login-epost:' + epostNokkel, 10, 15 * 60_000)) {
    throw new ApiFeil(429, 'For mange forsøk — vent et kvarter');
  }
  const resultat = await loggInn(body.epost, body.passord, body.totp);
  if (!resultat) throw new ApiFeil(401, 'Feil e-post eller passord');
  if (resultat.trengerTotp) return { trengerTotp: true };
  const sikker = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie',
    `plattform_sesjon=${resultat.token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${14 * 86400}${sikker}`);
  return { bruker: resultat.bruker };
});

ruter.add('POST', '/api/registrer', async ({ req, body }) => {
  if (forMange('registrer:' + klientIp(req), 20, 60 * 60_000)) throw new ApiFeil(429, 'For mange forsøk');
  const resultat = await registrerMedInvitasjon(body);
  if (resultat.feil) throw new ApiFeil(400, resultat.feil);
  return { ok: true, navn: resultat.bruker.navn };
});

ruter.add('POST', '/api/logout', async ({ req, res }) => {
  await loggUt(lesCookies(req).plattform_sesjon);
  res.setHeader('Set-Cookie', 'plattform_sesjon=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  return { ok: true };
});

// /api/meg gir brukeren + tenant-konfigen (appnavn, tema, moduler) — det er
// slik white-label-temaet når klienten. Instrukser/profil sendes ALDRI ut.
ruter.add('GET', '/api/meg', ({ ctx }) => medOrg(ctx, async (c) => {
  const org = (await c.query(
    'SELECT slug, navn, konfig FROM organisasjoner WHERE id = $1', [ctx.orgId])).rows[0];
  const k = org?.konfig || {};
  return {
    bruker: { id: ctx.brukerId, navn: ctx.navn, rolle: ctx.rolle },
    org: {
      slug: org?.slug, navn: org?.navn,
      appnavn: k.appnavn || 'Plattform', undertittel: k.undertittel || '',
      tema: k.tema || {}, moduler: k.moduler || [],
    },
  };
}));

// ── SSE: live-hendelser (D3). Rollefiltrering + aldri innhold. ──
function sseHandler(req, res, ctx) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': tilkoblet\n\n');
  const ledelse = ['admin', 'pilotleder'].includes(ctx.rolle);
  const slutt = abonner(ctx.orgId, (h) => {
    if (h.sensitiv && !ledelse) return; // ansatte får aldri sensitive hendelser
    res.write(`data: ${JSON.stringify(h)}\n\n`);
  });
  const puls = setInterval(() => res.write(': puls\n\n'), 25_000);
  req.on('close', () => { clearInterval(puls); slutt(); });
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
  // Sikkerhetsheadere på alt (D4): CSP uten eksterne kilder, ingen innramming.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
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
      ctx = await finnSesjon(lesCookies(req).plattform_sesjon);
      if (!ctx) throw new ApiFeil(401, 'Logg inn først');
    }

    if (req.method === 'GET' && sti === '/api/hendelser') return sseHandler(req, res, ctx);
    if (req.method === 'POST' && sti === '/api/skriv'
        && forMange('skriv:' + (ctx?.brukerId || 'x'), 30, 10 * 60_000)) {
      throw new ApiFeil(429, 'Mange utkast på kort tid — vent et par minutter');
    }

    const rute = ruter.finn(req.method, sti);
    if (!rute) throw new ApiFeil(404, 'Ukjent API-rute');
    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await lesJson(req) : {};
    const resultat = await rute.handler({ req, res, ctx, body, params: rute.params, sok: url.searchParams });

    if (resultat && resultat._csv !== undefined) {
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${resultat.filnavn || 'eksport.csv'}"` });
      res.end(resultat._csv);
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

server.listen(config.port, () => {
  console.log(`Plattformkjernen kjører på :${config.port}`);
});
