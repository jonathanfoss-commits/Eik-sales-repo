// Tenant-isolasjon: to forsikringsselskaper på samme plattform skal ikke se
// hverandres saker. Dette er den ene testen en innkjøper faktisk kommer til å
// be om bevis for, så den prøver å BRYTE isolasjonen, ikke å bekrefte den.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import pg from 'pg';

// fetch() i Node NEKTER å sette Host — den står på undicis liste over forbudte
// headere og fjernes uten feilmelding. Første utgave av denne testen brukte
// fetch og «passerte» derfor mot plattformens standardmerkevare uansett.
// node:http setter headeren slik vi ber om, og er dermed den eneste måten å
// teste vertsnavn-ruting på uten ekte DNS.
function hentMedVert(vert, sti, { metode = 'GET', kropp } = {}) {
  return new Promise((løs, avvis) => {
    const forespørsel = http.request(
      { host: '127.0.0.1', port: PORT, path: sti, method: metode,
        headers: { Host: vert, ...(kropp ? { 'Content-Type': 'application/json' } : {}) } },
      (svar) => {
        let tekst = '';
        svar.on('data', (d) => { tekst += d; });
        svar.on('end', () => {
          let data = {};
          try { data = JSON.parse(tekst); } catch { /* tomt */ }
          løs({ status: svar.statusCode, data });
        });
      });
    forespørsel.on('error', avvis);
    if (kropp) forespørsel.write(JSON.stringify(kropp));
    forespørsel.end();
  });
}

process.env.MIGRATE_DATABASE_URL ||= 'postgres://livsarkiv_eier:livsarkiv@localhost:5432/livsarkiv';
process.env.LIVSARKIV_APP_PASSORD ||= 'app';
process.env.LIVSARKIV_AUTH_PASSORD ||= 'auth';

const { medBruker, lukkPools } = await import('../server/db.js');

const PORT = 3412;
const BASE = `http://127.0.0.1:${PORT}`;
const ROT = path.resolve(import.meta.dirname, '..');

let eier, server;
let tilgjengelig = true;
// to selskaper + plattformen
let tenantA, tenantB;
let adminA, adminA2, adminB, plattformAdmin;
let kundeA, kundeB, hvelvA, hvelvB, frigivelseA, hendelseA, kontaktA;

const som = (brukerId, rolle = 'person') => ({ brukerId, rolle });

async function nyBruker(navn, epost, rolle, tenantId) {
  return (await eier.query(
    `INSERT INTO brukere (navn, epost, rolle, passord_hash, tenant_id)
     VALUES ($1, $2, $3, 'scrypt:x:x', $4)
     ON CONFLICT (epost) DO UPDATE SET tenant_id = EXCLUDED.tenant_id RETURNING id`,
    [navn, epost, rolle, tenantId])).rows[0].id;
}

// Bygger et komplett hvelv med en sak i verifisering, som en ekte kunde ville hatt.
async function nySak(kundeId, tenantNavn) {
  let hvelvId, kontaktId, hendelseId, frigivelseId;
  await medBruker(som(kundeId), async (c) => {
    hvelvId = (await c.query(
      'INSERT INTO hvelv (eier_id) VALUES ($1) RETURNING id', [kundeId])).rows[0].id;
    await c.query(
      `INSERT INTO hvelv_elementer (hvelv_id, kategori, tittel, innhold)
       VALUES ($1, 'praktisk', 'Nøkler', $2)`, [hvelvId, `Hemmelig hos ${tenantNavn}`]);
    kontaktId = (await c.query(
      `INSERT INTO kontakter (hvelv_id, navn, epost, er_betrodd)
       VALUES ($1, 'Melder', $2, true) RETURNING id`,
      [hvelvId, `tn-melder-${tenantNavn}@test.no`])).rows[0].id;
  });
  // hendelse og frigivelse settes inn som eier-tilkobling: her testes lesing,
  // ikke innmeldingspolicyene (de har sine egne tester i rls.test.js)
  hendelseId = (await eier.query(
    `INSERT INTO hendelser (hvelv_id, type, kilde, meldt_av_kontakt_id)
     VALUES ($1, 'dodsfall', 'manuell', $2) RETURNING id`, [hvelvId, kontaktId])).rows[0].id;
  frigivelseId = (await eier.query(
    `INSERT INTO frigivelser (hendelse_id, hvelv_id, status)
     VALUES ($1, $2, 'under_verifisering') RETURNING id`, [hendelseId, hvelvId])).rows[0].id;
  await eier.query(
    `INSERT INTO attester (hendelse_id, filnavn, mime, storrelse, innhold, lastet_opp_av)
     VALUES ($1, 'attest.pdf', 'application/pdf', 8, '%PDF-1.4', $2)`,
    [hendelseId, kontaktId]);
  await eier.query(
    `INSERT INTO varslinger (hvelv_id, hendelse_id, kontakt_id, kanal, type)
     VALUES ($1, $2, $3, 'epost', 'dodsfall_meldt')`,
    [hvelvId, hendelseId, kontaktId]);
  return { hvelvId, kontaktId, hendelseId, frigivelseId };
}

test.before(async () => {
  eier = new pg.Client({ connectionString: process.env.MIGRATE_DATABASE_URL });
  try {
    await eier.connect();
  } catch {
    tilgjengelig = false;
    console.log('Tenant-tester hoppet over: ingen Postgres');
    return;
  }
  await eier.query(`DELETE FROM hvelv WHERE eier_id IN
    (SELECT id FROM brukere WHERE epost LIKE 'tn-%@test.no')`);
  await eier.query(`DELETE FROM brukere WHERE epost LIKE 'tn-%@test.no'`);
  await eier.query(`DELETE FROM tenanter WHERE slug IN ('tn-alfa', 'tn-beta')`);

  tenantA = (await eier.query(
    `INSERT INTO tenanter (slug, navn, konfig) VALUES ('tn-alfa', 'Alfa Forsikring', $1)
     RETURNING id`,
    [JSON.stringify({ vertsnavn: ['alfa.test'], visningsnavn: 'Alfa Forsikring', aksent: '#123456' })]
  )).rows[0].id;
  tenantB = (await eier.query(
    `INSERT INTO tenanter (slug, navn) VALUES ('tn-beta', 'Beta Forsikring') RETURNING id`
  )).rows[0].id;
  const plattform = (await eier.query(`SELECT standard_tenant() AS id`)).rows[0].id;

  adminA = await nyBruker('Alfa-saksbehandler', 'tn-admin-a@test.no', 'admin', tenantA);
  adminA2 = await nyBruker('Alfa-saksbehandler 2', 'tn-admin-a2@test.no', 'admin', tenantA);
  adminB = await nyBruker('Beta-saksbehandler', 'tn-admin-b@test.no', 'admin', tenantB);
  plattformAdmin = await nyBruker('Plattformdrift', 'tn-admin-p@test.no', 'admin', plattform);
  kundeA = await nyBruker('Kunde hos Alfa', 'tn-kunde-a@test.no', 'person', tenantA);
  kundeB = await nyBruker('Kunde hos Beta', 'tn-kunde-b@test.no', 'person', tenantB);

  const sakA = await nySak(kundeA, 'alfa');
  const sakB = await nySak(kundeB, 'beta');
  hvelvA = sakA.hvelvId; hendelseA = sakA.hendelseId;
  frigivelseA = sakA.frigivelseId; kontaktA = sakA.kontaktId;
  hvelvB = sakB.hvelvId;

  server = spawn('node', ['server/index.js'], {
    cwd: ROT,
    env: { ...process.env, PORT: String(PORT), REGISTRERING_AAPEN: '1', LIVSARKIV_TESTMODUS: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const frist = Date.now() + 30_000;
  for (;;) {
    try { if ((await fetch(BASE + '/api/helse')).ok) break; } catch { /* venter */ }
    if (Date.now() > frist) throw new Error('Serveren kom aldri opp');
    await new Promise((r) => setTimeout(r, 100));
  }
});

test.after(async () => {
  server?.kill();
  if (tilgjengelig) {
    await eier.query(`DELETE FROM hvelv WHERE eier_id IN
      (SELECT id FROM brukere WHERE epost LIKE 'tn-%@test.no')`);
    await eier.query(`DELETE FROM brukere WHERE epost LIKE 'tn-%@test.no'`);
    await eier.query(`DELETE FROM tenanter WHERE slug IN ('tn-alfa', 'tn-beta')`);
    await eier.end().catch(() => {});
  }
  await lukkPools();
});

const hopp = () => !tilgjengelig;

// ── Lesing på tvers ──
test('saksbehandler i ett selskap ser ikke det andres saker', { skip: hopp() }, async () => {
  await medBruker(som(adminB, 'admin'), async (c) => {
    for (const [hva, sql] of [
      ['frigivelser', 'SELECT 1 FROM frigivelser WHERE hvelv_id = $1'],
      ['hendelser', 'SELECT 1 FROM hendelser WHERE hvelv_id = $1'],
      ['kontakter', 'SELECT 1 FROM kontakter WHERE hvelv_id = $1'],
      ['varslinger', 'SELECT 1 FROM varslinger WHERE hvelv_id = $1'],
    ]) {
      assert.equal((await c.query(sql, [hvelvA])).rows.length, 0,
        `Beta-saksbehandleren så Alfas ${hva}`);
    }
    assert.equal((await c.query(
      `SELECT 1 FROM attester WHERE hendelse_id = $1`, [hendelseA])).rows.length, 0,
    'Beta-saksbehandleren så Alfas dødsattest');
  });
});

test('saksbehandler ser sitt EGET selskaps saker', { skip: hopp() }, async () => {
  await medBruker(som(adminA, 'admin'), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM frigivelser WHERE hvelv_id = $1', [hvelvA])).rows.length, 1);
    assert.equal((await c.query(
      'SELECT 1 FROM attester WHERE hendelse_id = $1', [hendelseA])).rows.length, 1);
    assert.equal((await c.query(
      'SELECT 1 FROM kontakter WHERE id = $1', [kontaktA])).rows.length, 1);
  });
});

// ── Skriving på tvers: den farligste ──
test('saksbehandler kan ikke godkjenne en annen tenants frigivelse', { skip: hopp() }, async () => {
  await medBruker(som(adminB, 'admin'), async (c) => {
    const res = await c.query(
      `UPDATE frigivelser SET godkjent_1_av = $2, status = 'godkjent_1'
        WHERE id = $1 RETURNING id`, [frigivelseA, adminB]);
    assert.equal(res.rows.length, 0, 'Beta-saksbehandleren signerte for Alfas kunde');
  });
  // og saken står urørt
  const etter = (await eier.query(
    'SELECT status, godkjent_1_av FROM frigivelser WHERE id = $1', [frigivelseA])).rows[0];
  assert.equal(etter.status, 'under_verifisering');
  assert.equal(etter.godkjent_1_av, null);
});

test('egen tenants saksbehandler KAN godkjenne', { skip: hopp() }, async () => {
  await medBruker(som(adminA, 'admin'), async (c) => {
    const res = await c.query(
      `UPDATE frigivelser SET godkjent_1_av = $2, status = 'godkjent_1'
        WHERE id = $1 RETURNING id`, [frigivelseA, adminA]);
    assert.equal(res.rows.length, 1);
  });
  // rull tilbake så senere tester ser en urørt sak
  await eier.query(
    `UPDATE frigivelser SET status = 'under_verifisering', godkjent_1_av = NULL WHERE id = $1`,
    [frigivelseA]);
});

test('fire øyne gjelder fortsatt INNENFOR et selskap', { skip: hopp() }, async () => {
  await assert.rejects(eier.query(
    `UPDATE frigivelser SET godkjent_1_av = $2, godkjent_2_av = $2 WHERE id = $1`,
    [frigivelseA, adminA2]), /fire_oyne/);
});

// ── Plattformdrift ──
test('plattformdrift ser begge selskapers saker (support og tilsyn)', { skip: hopp() }, async () => {
  await medBruker(som(plattformAdmin, 'admin'), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM frigivelser WHERE hvelv_id = ANY($1)', [[hvelvA, hvelvB]])).rows.length, 2);
  });
});

// ── Prinsipp 3 holder uansett tenant ──
test('INGEN admin ser hvelvinnhold — heller ikke plattformdrift', { skip: hopp() }, async () => {
  for (const [hvem, id] of [['egen tenant', adminA], ['annen tenant', adminB],
    ['plattform', plattformAdmin]]) {
    await medBruker(som(id, 'admin'), async (c) => {
      assert.equal((await c.query(
        'SELECT 1 FROM hvelv_elementer WHERE hvelv_id = ANY($1)',
        [[hvelvA, hvelvB]])).rows.length, 0, `Admin (${hvem}) leste hvelvinnhold`);
    });
  }
});

// ── Kunden selv er upåvirket ──
test('kunden ser sitt eget hvelv som før', { skip: hopp() }, async () => {
  await medBruker(som(kundeA), async (c) => {
    assert.equal((await c.query(
      'SELECT 1 FROM hvelv_elementer WHERE hvelv_id = $1', [hvelvA])).rows.length, 1);
    assert.equal((await c.query(
      'SELECT 1 FROM hvelv_elementer WHERE hvelv_id = $1', [hvelvB])).rows.length, 0,
    'Alfas kunde så Betas hvelv');
  });
});

// ── White-label og tenant-tilhørighet over HTTP ──
test('vertsnavnet avgjør merkevare og hvilket selskap en ny kunde havner i',
  { skip: hopp() }, async () => {
    const standard = (await hentMedVert('127.0.0.1', '/api/miljo')).data;
    assert.equal(standard.merkevare.navn, 'Livsarkivet');
    assert.equal(standard.merkevare.aksent, null);

    const hos = (await hentMedVert('alfa.test', '/api/miljo')).data;
    assert.equal(hos.merkevare.navn, 'Alfa Forsikring');
    assert.equal(hos.merkevare.aksent, '#123456');

    // registrering på selskapets adresse → selskapets tenant
    const svar = await hentMedVert('alfa.test', '/api/auth/registrer', {
      metode: 'POST',
      kropp: { navn: 'Ny hos Alfa', epost: 'tn-ny-a@test.no', passord: 'passord1234' },
    });
    assert.equal(svar.status, 200);
    const rad = (await eier.query(
      'SELECT tenant_id FROM brukere WHERE epost = $1', ['tn-ny-a@test.no'])).rows[0];
    assert.equal(rad.tenant_id, tenantA, 'Ny kunde havnet ikke i Alfa');
  });

test('ukjent vertsnavn faller til plattformen, ikke til et tilfeldig selskap',
  { skip: hopp() }, async () => {
    const svar = (await hentMedVert('noe.helt.annet.test', '/api/miljo')).data;
    assert.equal(svar.merkevare.navn, 'Livsarkivet');
  });
