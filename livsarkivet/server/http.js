// Små HTTP-hjelpere: ruting, JSON-lesing, svar, cookies og feilklasse.
// (Tilpasset kopi fra kjerne/server/http.js — bevisst duplisert så produktene
// kan skilles i egne repo uten delt avhengighet.)

export class ApiFeil extends Error {
  constructor(status, melding) { super(melding); this.status = status; }
}

export function svarJson(res, status, data) {
  const kropp = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(kropp);
}

export function lesCookies(req) {
  const ut = {};
  for (const del of (req.headers.cookie || '').split(';')) {
    const i = del.indexOf('=');
    if (i > 0) ut[del.slice(0, i).trim()] = decodeURIComponent(del.slice(i + 1).trim());
  }
  return ut;
}

export function lesJson(req, maksBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let lengde = 0;
    let overskredet = false;
    let biter = [];
    req.on('data', (bit) => {
      if (overskredet) return; // fortsett å drenere så 413-svaret faktisk når klienten
      lengde += bit.length;
      if (lengde > maksBytes) { overskredet = true; biter = []; return; }
      biter.push(bit);
    });
    req.on('end', () => {
      if (overskredet) return reject(new ApiFeil(413, 'For stor forespørsel'));
      if (!biter.length) return resolve({});
      try {
        const data = JSON.parse(Buffer.concat(biter).toString('utf8'));
        // handlers destrukturerer kroppen — «null»/tall/streng skal ikke gi TypeError
        resolve(data && typeof data === 'object' && !Array.isArray(data) ? data : {});
      } catch { reject(new ApiFeil(400, 'Ugyldig JSON')); }
    });
    req.on('error', reject);
  });
}

// Rute-tabell: [metode, mønster med :param, handler(req, res, ctx)]
export class Ruter {
  constructor() { this.ruter = []; }
  add(metode, monster, handler) {
    const deler = monster.split('/').filter(Boolean);
    this.ruter.push({ metode, deler, handler });
  }
  finn(metode, sti) {
    const stiDeler = sti.split('/').filter(Boolean).map(decodeURIComponent);
    for (const rute of this.ruter) {
      if (rute.metode !== metode || rute.deler.length !== stiDeler.length) continue;
      const params = {};
      let treff = true;
      for (let i = 0; i < rute.deler.length; i++) {
        const d = rute.deler[i];
        if (d.startsWith(':')) params[d.slice(1)] = stiDeler[i];
        else if (d !== stiDeler[i]) { treff = false; break; }
      }
      if (treff) return { handler: rute.handler, params };
    }
    return null;
  }
}
