// Oppstart for plattformer uten konsoll (Render): kjører migrasjoner og
// oppretter tenants (TENANTS=laerling,malermester-demo) før serveren starter.
// Krever MIGRATE_DATABASE_URL for migrering — uten den startes bare serveren.
if (process.env.MIGRATE_DATABASE_URL) {
  await import('./migrate.js');

  // Tenants fra tenants/-filene — idempotent (finnes de, oppdateres kun konfig).
  const { opprettTenant } = await import('./verktoy/ny-tenant.js');
  for (const navn of (process.env.TENANTS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    await opprettTenant(navn, process.env.MIGRATE_DATABASE_URL);
  }
} else {
  console.log('MIGRATE_DATABASE_URL ikke satt — starter uten migrering.');
}

await import('./index.js');
