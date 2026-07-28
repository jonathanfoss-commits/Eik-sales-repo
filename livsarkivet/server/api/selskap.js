// Selskapets integrasjons-API. Autentiseres med API-nøkkel, ikke sesjon:
//   Authorization: Bearer lva_<40 tegn>
//
// Nøkkelen gir tenant-tilhørighet, ikke en brukeridentitet — derfor kan ikke
// person-skopet RLS brukes her. Rekkevidden håndheves i stedet av
// SECURITY DEFINER-funksjonene i migrasjon 013, som tar tenant_id som argument
// og bare svarer for saker som tilhører DEN tenanten.
//
// Det selskapet kan lese er strengt avgrenset: sine egne FRIGITTE saker, og
// bare de feltene kunden aktivt har delt og ikke trukket tilbake. Aldri
// hvelvinnhold, aldri kontakter, aldri attester.
import crypto from 'node:crypto';
import { ApiFeil } from '../http.js';
import { medBruker } from '../db.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

export function nyApiNokkel() {
  const raa = 'lva_' + crypto.randomBytes(24).toString('base64url');
  return { raa, hash: sha256(raa), prefiks: raa.slice(0, 12) };
}

// Rate-demping per nøkkel: en integrasjon som løper løpsk skal ikke kunne
// belaste basen for alle de andre selskapene på plattformen.
const teller = new Map();
function forMange(nokkelId, maks = 600, vinduMs = 60_000) {
  const naa = Date.now();
  const liste = (teller.get(nokkelId) || []).filter((t) => naa - t < vinduMs);
  liste.push(naa);
  teller.set(nokkelId, liste);
  return liste.length > maks;
}

async function autentiser(req) {
  const hode = String(req.headers.authorization || '');
  const m = hode.match(/^Bearer\s+(lva_[A-Za-z0-9_-]{10,80})$/);
  if (!m) throw new ApiFeil(401, 'Mangler eller ugyldig API-nøkkel');
  const rad = await medBruker({ rolle: 'system' }, async (c) =>
    (await c.query('SELECT * FROM finn_api_nokkel($1)', [sha256(m[1])])).rows[0]);
  if (!rad) throw new ApiFeil(401, 'Ukjent eller tilbaketrukket API-nøkkel');
  if (forMange(rad.nokkel_id)) throw new ApiFeil(429, 'For mange kall — vent litt');
  // «Sist brukt» er driftsinformasjon, ikke en del av svaret — skrives utenfor
  // svarveien så et treigt skriv aldri forsinker integrasjonen.
  medBruker({ rolle: 'system' }, (c) =>
    c.query('SELECT merk_nokkel_brukt($1)', [rad.nokkel_id])).catch(() => {});
  return rad;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function registrer(ruter) {
  // Alle saker selskapet har krav på å vite om: frigitte, i egen tenant.
  ruter.add('GET', '/api/selskap/saker', async ({ req, sok }) => {
    const nokkel = await autentiser(req);
    const maks = Math.min(Number(sok.get('maks') || 100), 500);
    const rader = await medBruker({ rolle: 'system' }, async (c) =>
      (await c.query('SELECT * FROM selskapssaker($1, $2)',
        [nokkel.tenant_id, maks])).rows);
    return { saker: rader.map((r) => ({ sakId: r.sak_id, frigittTid: r.frigitt_tid })) };
  });

  // Feltene kunden deler. Sjekkes på NYTT ved hvert oppslag, så et
  // tilbaketrekk virker også mot en integrasjon som allerede kjenner sak-id-en.
  ruter.add('GET', '/api/selskap/saker/:id', async ({ req, params }) => {
    const nokkel = await autentiser(req);
    // uten denne gir en misformet id en databasefeil og 500 i stedet for 404
    if (!UUID.test(params.id)) throw new ApiFeil(404, 'Ukjent sak');
    const rader = await medBruker({ rolle: 'system' }, async (c) =>
      (await c.query('SELECT * FROM selskapssak($1, $2)',
        [nokkel.tenant_id, params.id])).rows);
    if (!rader.length) throw new ApiFeil(404, 'Ukjent sak');
    const felter = {};
    for (const r of rader) if (r.felttype) felter[r.felttype] = r.verdi;
    return {
      sakId: rader[0].sak_id,
      status: rader[0].status,
      frigittTid: rader[0].frigitt_tid,
      delteFelter: felter,
    };
  });
}
