// Tynn fetch-wrapper: JSON inn/ut, feilmeldingen fra serveren rett igjennom.
export async function kall(metode, sti, kropp) {
  const svar = await fetch(sti, {
    method: metode,
    headers: kropp === undefined ? {} : { 'Content-Type': 'application/json' },
    body: kropp === undefined ? undefined : JSON.stringify(kropp),
  });
  let data = {};
  try { data = await svar.json(); } catch { /* tomt svar */ }
  return { ok: svar.ok, status: svar.status, data };
}
