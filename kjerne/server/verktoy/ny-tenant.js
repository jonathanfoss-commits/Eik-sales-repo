// Oppretter (eller oppdaterer) en tenant fra en fil i tenants/ — beviset på at
// ny kunde er konfig, ikke kode (D5-kriterium 1).
//
//   node server/verktoy/ny-tenant.js laerling
//   node server/verktoy/ny-tenant.js malermester-demo
//
// Kjøres som databaseeier (MIGRATE_DATABASE_URL). Idempotent: finnes org-en
// (på slug), oppdateres konfigurasjonen; brukere som finnes, røres ikke.
// For hver NY bruker settes et engangspassord som skrives til konsollen —
// gis til brukeren utenfor systemet, byttes ved første innlogging.
import pg from 'pg';
import { lagInvitasjonskode, hashInvitasjonskode } from '../auth.js';

export async function opprettTenant(navn, url) {
  const { default: tenant } = await import(`../../tenants/${navn}.js`);
  const klient = new pg.Client({ connectionString: url });
  await klient.connect();
  try {
    const org = (await klient.query(
      `INSERT INTO organisasjoner (slug, navn, orgnr, konfig) VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET navn = EXCLUDED.navn, konfig = EXCLUDED.konfig
       RETURNING id`,
      [tenant.slug, tenant.navn, tenant.orgnr, JSON.stringify(tenant.konfig)])).rows[0];
    console.log(`Tenant «${tenant.navn}» (${tenant.slug}): ${org.id}`);

    for (const b of tenant.brukere || []) {
      const finnes = (await klient.query(
        'SELECT 1 FROM brukere WHERE lower(epost) = lower($1)', [b.epost])).rows[0];
      if (finnes) { console.log(`  ${b.epost}: finnes fra før — urørt`); continue; }
      // Aldri passord i deploy-logger (funn fra praksisgjennomgangen): brukeren
      // opprettes uten brukbart passord og får en NULLSTILLINGSKODE i stedet —
      // settes via «Glemt passord?» → «Har du fått kode?» i appen. Koden er
      // hashet i databasen, engangs og utløper etter 7 dager.
      const nyId = (await klient.query(
        `INSERT INTO brukere (org_id, navn, epost, rolle, passord_hash)
         VALUES ($1,$2,$3,$4,'ma-nullstilles') RETURNING id`,
        [org.id, b.navn, b.epost.toLowerCase(), b.rolle])).rows[0].id;
      const kode = lagInvitasjonskode();
      await klient.query(
        `INSERT INTO nullstillinger (bruker_id, kode_hash, utloper)
         VALUES ($1, $2, now() + interval '7 days')`,
        [nyId, hashInvitasjonskode(kode)]);
      console.log(`  ${b.epost} (${b.rolle}) — nullstillingskode (7 dager): ${kode}`);
    }
    console.log('Tenanten er klar — konfigurasjonen bor nå i databasen.');
    return org.id;
  } finally {
    await klient.end();
  }
}

// CLI-bruk
if (process.argv[1] && process.argv[1].endsWith('ny-tenant.js')) {
  const navn = process.argv[2];
  const url = process.env.MIGRATE_DATABASE_URL || process.env.DATABASE_URL;
  if (!navn || !url) {
    console.error('Bruk: MIGRATE_DATABASE_URL=... node server/verktoy/ny-tenant.js <tenants-fil uten .js>');
    process.exit(1);
  }
  await opprettTenant(navn, url);
}
