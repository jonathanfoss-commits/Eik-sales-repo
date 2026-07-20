/* Lærling — serverfunksjon som henter pilotloggen for kommandosentralen og Prøverommet.
   Netlify-tokenet bor som miljøvariabel PILOTLOGG_TOKEN i Netlify (settes ÉN gang per
   site) — det skal aldri ligge i nettleseren eller i koden.
   Adgang: sentralkoden (X-Pilotkode-header) — den deles kun med pilotteamet og
   står ikke i noen offentlig fil (kommandosentralen/Prøverommet sjekker den mot
   et PBKDF2-avtrykk og husker den lokalt). Skrivemotoren har egen ansattkode
   (skriv.mjs) siden den må ligge åpent i appen. Settes miljøvariabelen
   PILOT_API_KODE, kreves DEN i stedet for koden under.
   Svarer kun med feltene klientene trenger, og kun relevante hendelsestyper. */

const KODE = "gerikt-laft-beslag-30"; // sentralkoden (kan overstyres med PILOT_API_KODE)
const VERTER = [
  "op-bygg-laerling-app.netlify.app",
  "op-bygg-laerling-app-test.netlify.app"
];
const API = "https://api.netlify.com/api/v1";
const RELEVANTE = ["innspill", "godkjenning", "panel-bestilling"];

// enkel svar-cache: demper spam og sparer Netlify-API-kvoten
let cacheKropp = null;
let cacheTid = 0;

exports.handler = async (event) => {
  const svar = (statusCode, kropp) => ({
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(kropp)
  });

  const riktigKode = process.env.PILOT_API_KODE || KODE;
  /* kun header — kode i URL havner i logger og nettleserhistorikk */
  const gittKode = (event.headers && (event.headers["x-pilotkode"] || event.headers["X-Pilotkode"])) || "";
  if (gittKode !== riktigKode) return svar(401, { feil: "feil pilotkode" });

  const token = process.env.PILOTLOGG_TOKEN;
  if (!token)
    return svar(503, { feil: "PILOTLOGG_TOKEN er ikke satt i Netlify (Site configuration → Environment variables)" });

  if (cacheKropp && Date.now() - cacheTid < 60000) return svar(200, cacheKropp);

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
      // paginer: «åpnet»-hendelser dominerer, så relevante innspill kan ligge langt bak
      for (let side = 1; side <= 3; side++) {
        const subs = await hent("/forms/" + f.id + "/submissions?per_page=100&page=" + side);
        for (const s of subs) {
          const hendelse = (s.data || {}).hendelse;
          if (!RELEVANTE.includes(hendelse)) continue;
          alle.push({
            id: s.id,
            created_at: s.created_at,
            kanal: vert,
            data: { hendelse, detalj: (s.data || {}).detalj }
          });
        }
        if (subs.length < 100) break;
      }
    } catch (e) { /* én kanal kan mangle skjema eller feile — fortsett med den andre */ }
  }

  if (!vellykkede)
    return svar(502, { feil: "fikk ikke svar fra Netlify-API — sjekk at tokenet i PILOTLOGG_TOKEN er gyldig" });

  alle.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  cacheKropp = alle; cacheTid = Date.now();
  return svar(200, alle);
};
