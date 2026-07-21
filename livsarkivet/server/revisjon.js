// Skriv til den immutable revisjonsloggen. Kun hendelsestyper og referanser —
// aldri titler, innhold eller annet brukerinnhold i detaljene.
export async function loggRevisjon(c, ctx, hvelvId, hendelse, detaljer = {}) {
  await c.query(
    `INSERT INTO revisjon (bruker_id, rolle, hvelv_id, hendelse, detaljer)
     VALUES ($1, $2, $3, $4, $5)`,
    [ctx?.brukerId || null, ctx?.rolle || 'system', hvelvId, hendelse, detaljer]);
}
