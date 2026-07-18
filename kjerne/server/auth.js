// Innlogging, sesjoner, invitasjonsbasert innrullering og TOTP for admin.
// Passord hashes med scrypt (node:crypto — ingen avhengigheter). Sesjonstoken
// lagres kun som SHA-256-hash i databasen. Invitasjonskoder lagres kun hashet.
import crypto from 'node:crypto';
import { authPool } from './db.js';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESJON_LEVETID_TIMER = 24 * 14;

export function hashPassord(passord) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passord, salt, SCRYPT.keylen, SCRYPT).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function sjekkPassord(passord, lagret) {
  const [ordning, salt, hash] = String(lagret || '').split(':');
  if (ordning !== 'scrypt' || !salt || !hash) return false;
  const kandidat = crypto.scryptSync(passord, salt, SCRYPT.keylen, SCRYPT);
  const fasit = Buffer.from(hash, 'hex');
  return kandidat.length === fasit.length && crypto.timingSafeEqual(kandidat, fasit);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// ── TOTP (RFC 6238, SHA-1, 6 sifre, 30 s-vindu) — kun node:crypto ──
export function nyTotpHemmelighet() {
  // base32 uten padding — det formatet autentiseringsapper leser
  const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const rå = crypto.randomBytes(20);
  let biter = '', ut = '';
  for (const b of rå) biter += b.toString(2).padStart(8, '0');
  for (let i = 0; i + 5 <= biter.length; i += 5) ut += ALFABET[parseInt(biter.slice(i, i + 5), 2)];
  return ut;
}

function base32Dekod(s) {
  const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let biter = '';
  for (const tegn of String(s).toUpperCase().replace(/=+$/, '')) {
    const i = ALFABET.indexOf(tegn);
    if (i < 0) continue;
    biter += i.toString(2).padStart(5, '0');
  }
  const byter = [];
  for (let i = 0; i + 8 <= biter.length; i += 8) byter.push(parseInt(biter.slice(i, i + 8), 2));
  return Buffer.from(byter);
}

export function totpKode(hemmelighet, tidMs = Date.now()) {
  const teller = Math.floor(tidMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(teller));
  const hmac = crypto.createHmac('sha1', base32Dekod(hemmelighet)).update(buf).digest();
  const off = hmac[hmac.length - 1] & 0x0f;
  const kode = ((hmac.readUInt32BE(off) & 0x7fffffff) % 1_000_000);
  return String(kode).padStart(6, '0');
}

export function sjekkTotp(hemmelighet, kode, tidMs = Date.now()) {
  const k = String(kode || '').trim();
  // ±1 vindu tolererer klokkeskjev — standard praksis
  return [-1, 0, 1].some((skritt) => totpKode(hemmelighet, tidMs + skritt * 30_000) === k);
}

// ── Innlogging ──
export async function loggInn(epost, passord, totp) {
  const res = await authPool.query(
    `SELECT id, org_id, navn, rolle, passord_hash, totp_hemmelighet, aktiv
       FROM brukere WHERE lower(epost) = lower($1)`,
    [String(epost || '').trim()]
  );
  const bruker = res.rows[0];
  // Kjør alltid en hash-sammenlikning så svartiden ikke røper om e-posten finnes.
  const ok = sjekkPassord(String(passord || ''), bruker?.passord_hash || 'scrypt:00:00');
  if (!bruker || !bruker.aktiv || !ok) return null;
  // Har brukeren TOTP satt (kravet gjelder admin i produksjon), må koden stemme.
  if (bruker.totp_hemmelighet && !sjekkTotp(bruker.totp_hemmelighet, totp)) {
    return { trengerTotp: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const utloper = new Date(Date.now() + SESJON_LEVETID_TIMER * 3600_000);
  await authPool.query(
    'INSERT INTO sesjoner (token_hash, bruker_id, org_id, utloper) VALUES ($1, $2, $3, $4)',
    [sha256(token), bruker.id, bruker.org_id, utloper]
  );
  return { token, bruker: { id: bruker.id, orgId: bruker.org_id, navn: bruker.navn, rolle: bruker.rolle } };
}

export async function finnSesjon(token) {
  if (!token) return null;
  const res = await authPool.query(
    `SELECT s.bruker_id, s.org_id, b.navn, b.rolle, b.aktiv
       FROM sesjoner s JOIN brukere b ON b.id = s.bruker_id
      WHERE s.token_hash = $1 AND s.utloper > now()`,
    [sha256(token)]
  );
  const rad = res.rows[0];
  if (!rad || !rad.aktiv) return null;
  return { brukerId: rad.bruker_id, orgId: rad.org_id, navn: rad.navn, rolle: rad.rolle };
}

export async function loggUt(token) {
  if (!token) return;
  await authPool.query('DELETE FROM sesjoner WHERE token_hash = $1', [sha256(token)]);
}

// ── Innrullering: invitasjonskode → ny bruker. Ingen selvregistrering. ──
export function lagInvitasjonskode() {
  // 12 tegn uten forvekslingsfare (ikke 0/O/1/l) — leselig over SMS/telefon
  const ALFABET = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(12)).map((b) => ALFABET[b % ALFABET.length]).join('');
}
export const hashInvitasjonskode = (kode) => sha256(String(kode || '').trim().toLowerCase());

export async function registrerMedInvitasjon({ kode, navn, epost, passord }) {
  if (!kode || !navn || !epost || !passord) return { feil: 'Alle feltene må fylles ut' };
  if (String(passord).length < 10) return { feil: 'Passordet må ha minst 10 tegn' };
  const klient = await authPool.connect();
  try {
    await klient.query('BEGIN');
    const inv = (await klient.query(
      `SELECT id, org_id, rolle FROM invitasjoner
        WHERE kode_hash = $1 AND brukt_av IS NULL AND utloper > now() FOR UPDATE`,
      [hashInvitasjonskode(kode)])).rows[0];
    if (!inv) { await klient.query('ROLLBACK'); return { feil: 'Ugyldig eller brukt invitasjonskode' }; }
    const finnes = (await klient.query(
      'SELECT 1 FROM brukere WHERE lower(epost) = lower($1)', [String(epost).trim()])).rows[0];
    if (finnes) { await klient.query('ROLLBACK'); return { feil: 'E-posten er alt registrert' }; }
    const bruker = (await klient.query(
      `INSERT INTO brukere (org_id, navn, epost, rolle, passord_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, org_id, navn, rolle`,
      [inv.org_id, String(navn).trim(), String(epost).trim().toLowerCase(), inv.rolle,
        hashPassord(String(passord))])).rows[0];
    await klient.query(
      'UPDATE invitasjoner SET brukt_av = $2, brukt_tid = now() WHERE id = $1',
      [inv.id, bruker.id]);
    await klient.query('COMMIT');
    return { bruker };
  } catch (feil) {
    await klient.query('ROLLBACK').catch(() => {});
    throw feil;
  } finally {
    klient.release();
  }
}
