/* Lærling — serverfunksjon som henter pilotloggen for kommandosentralen.
   Netlify-tokenet bor som miljøvariabel PILOTLOGG_TOKEN i Netlify (settes ÉN gang,
   per site) — det skal aldri ligge i nettleseren eller i koden.
   Svarer kun med de feltene kommandosentralen trenger. */

const KODE = "opbygg2026"; // samme interne pilotkode som kommandosentralen
const VERTER = [
  "op-bygg-laerling-app.netlify.app",
  "op-bygg-laerling-app-test.netlify.app"
];
const API = "https://api.netlify.com/api/v1";

exports.handler = async (event) => {
  const svar = (statusCode, kropp) => ({
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(kropp)
  });

  if (((event.queryStringParameters || {}).kode || "") !== KODE)
    return svar(401, { feil: "feil pilotkode" });

  const token = process.env.PILOTLOGG_TOKEN;
  if (!token)
    return svar(503, { feil: "PILOTLOGG_TOKEN er ikke satt i Netlify (Site configuration → Environment variables)" });

  const hent = async (sti) => {
    const r = await fetch(API + sti, { headers: { Authorization: "Bearer " + token } });
    if (!r.ok) throw new Error("Netlify-API svarte " + r.status);
    return r.json();
  };

  const alle = [];
  let vellykkede = 0;
  for (const vert of VERTER) {
    try {
      const skjemaer = await hent("/sites/" + vert + "/forms");
      vellykkede++;
      const f = skjemaer.find((x) => x.name === "pilotlogg");
      if (!f) continue;
      const subs = await hent("/forms/" + f.id + "/submissions?per_page=100");
      for (const s of subs) {
        alle.push({
          id: s.id,
          created_at: s.created_at,
          kanal: vert,
          data: { hendelse: (s.data || {}).hendelse, detalj: (s.data || {}).detalj }
        });
      }
    } catch (e) { /* én kanal kan mangle skjema eller feile — fortsett med den andre */ }
  }

  if (!vellykkede)
    return svar(502, { feil: "fikk ikke svar fra Netlify-API — sjekk at tokenet i PILOTLOGG_TOKEN er gyldig" });

  alle.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return svar(200, alle);
};
