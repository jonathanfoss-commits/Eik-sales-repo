/* Lærling — Skrivemotoren.
   Lager ferdige utkast på serversiden slik at ingen i OP Bygg trenger egen
   Claude-konto: appen sender dikteringen hit, funksjonen kaller Anthropic-API-et
   med VÅR nøkkel og strømmer ferdig tekst rett tilbake.

   Personvern (ufravikelig): ren gjennomstrømming. Dikteringen sendes KUN når
   brukeren aktivt trykker «Lag utkast», lagres aldri her eller i noen database,
   logges aldri, og brukes aldri til trening (API-bruk trenes det ikke på).

   Miljøvariabler i Netlify (Site configuration → Environment variables):
   - ANTHROPIC_API_KEY  (påkrevd — uten den svarer funksjonen 503 og appen
                         faller tilbake til kopier-prompten)
   - PILOT_API_KODE     (valgfri — overstyrer standard pilotkode, som i innspill.js) */

const KODE = "opbygg2026";
const MODELL = "claude-opus-4-8";
const MAKS_TEGN = 6000;

/* Holdes i sync med PROFIL i app/index.html (samme kilde til sannhet inntil
   kunde.js-utpakkingen i plattform-notatet). */
const PROFIL = "Du er assistenten til Ole Fabian Foss, prosjektleder i OP Bygg AS — en totalentreprenør i Oslo med rundt 11 ansatte. OP Bygg leverer renovering, oppussing og nybygg for bolig, kontor og næring, og profilerer seg på ryddig prosjektstyring. Ole Fabian har bakgrunn som tømrer og snakker praktisk og direkte.\n\nDIN JOBB: Hjelpe med skriftlig arbeid: e-poster til kunder og byggherrer, tilbudsgrunnlag etter befaring, møtereferater, endringsmeldinger, ukesrapporter, byggedagbok og purringer til underentreprenører. Brukeren dikterer ofte rått og ustrukturert — gjør det om til ryddig, profesjonell tekst.\n\nSKRIVESTIL: Norsk bokmål. Kort, tydelig og jordnær. Høflig men rett på sak. E-poster starter med «Hei [navn]» og slutter med «Mvh, Ole Fabian Foss, Prosjektleder, OP Bygg AS».\n\nFAGREGLER:\n- Skill mellom kundetyper: proffkunder følger NS-kontrakten (NS 8407/8417 totalentreprise, NS 8405/8406 ellers). Forbrukerkunder beskyttes av ufravikelige regler (bustadoppføringslova for nybygg, håndverkertjenesteloven for arbeid på bolig). Ukjent kundetype? Spør.\n- Endringer mot proffkunde: nøytralt varsel først, SAMME DAG — fristen «uten ugrunnet opphold» i NS 8407 er dager, ikke uker. Varsle alltid konsekvens for pris OG fremdrift.\n- Tilbud: skill tydelig mellom «inkludert», «forutsetninger» og «forbehold». Ta med forbehold om skjulte feil ved renovering av eldre bygg.\n- Møtereferater: nummererte aksjonspunkter med ansvarlig og frist. Avslutt med «Innsigelser til referatet meldes innen 3 virkedager.»\n- Ukesrapport: 1) Utført denne uken 2) Fremdrift mot plan 3) Avvik 4) Plan neste uke 5) Avklaringer vi trenger.\n- Byggedagbok: dato/prosjekt, vær, mannskap, utført arbeid, leveranser, hindringer, beskjeder fra byggherre. Kort og faktabasert.\n\nALLTID: Lever ferdig tekst som kan sendes. Mangler noe (navn, datoer, beløp), sett [KLAMMER] i stedet for å gjette. Svar KUN med selve teksten — ingen innledning eller kommentarer rundt.";

const OPPGAVER = {
  tilbud: "Brukeren har vært på befaring og dikterer notatene sine rått og " +
    "ustrukturert. Lag 1) en oppsummerings-e-post til kunden og 2) et internt " +
    "tilbudsgrunnlag med omfang, forutsetninger og forbehold.",
  endringsmelding: "Det har oppstått en endring på et prosjekt. Skriv en formell " +
    "endringsmelding til byggherren basert på dikteringen. Er kontraktstypen ukjent, " +
    "skriv et nøytralt varsel som holder under NS 8407 («uten ugrunnet opphold»). " +
    "Er beløpet ukjent, varsle at konsekvens for pris og fremdrift følger når det er avklart.",
  purring: "Skriv en purring basert på dikteringen. Vennlig tone, men tydelig frist " +
    "og konsekvens. Følg norsk skikk — aldri trusler, og aldri gebyrer eller renter " +
    "uten hjemmel.",
  referat: "Brukeren dikterer notater fra et møte (byggemøte, befaring, vernerunde " +
    "eller avklaring). Lag et ryddig møtereferat: møtetype, dato, prosjekt og deltakere " +
    "øverst (bruk [KLAMMER] der det mangler), deretter hovedpunkter, og til slutt " +
    "nummererte aksjonspunkter med ansvarlig og frist. Ta med avtaler og datoer " +
    "nøyaktig slik de ble sagt. Avslutt med «Innsigelser til referatet meldes innen " +
    "3 virkedager.»"
};

/* enkel best-effort-demper mot misbruk: maks 30 utkast per IP per 10 minutter
   (moduleminnet overlever varme kall — godt nok i pilot) */
const teller = new Map();
function forMange(ip) {
  const naa = Date.now(), vindu = 10 * 60 * 1000;
  const liste = (teller.get(ip) || []).filter((t) => naa - t < vindu);
  liste.push(naa);
  teller.set(ip, liste);
  return liste.length > 30;
}

function feil(status, melding) {
  return new Response(JSON.stringify({ feil: melding }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return feil(405, "Bare POST.");

  const url = new URL(req.url);
  const kode = req.headers.get("x-pilotkode") || url.searchParams.get("kode") || "";
  const riktigKode = process.env.PILOT_API_KODE || KODE;
  if (kode !== riktigKode) return feil(401, "Feil pilotkode.");

  const nokkel = process.env.ANTHROPIC_API_KEY;
  if (!nokkel) {
    return feil(503, "Skrivemotoren er ikke koblet til ennå — kopier prompten og bruk Claude som før. " +
      "(Oppsett: legg ANTHROPIC_API_KEY som miljøvariabel i Netlify og deploy på nytt.)");
  }

  let kropp;
  try { kropp = await req.json(); } catch { return feil(400, "Ugyldig forespørsel."); }

  const instruks = OPPGAVER[kropp.oppgave];
  const tekst = (kropp.tekst || "").trim();
  if (!instruks) return feil(400, "Ukjent oppgavetype.");
  if (!tekst) return feil(400, "Dikteringen var tom.");
  if (tekst.length > MAKS_TEGN) return feil(413, "Dikteringen er for lang — del den opp.");

  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "ukjent";
  if (forMange(ip)) return feil(429, "Mange utkast på kort tid — vent et par minutter og prøv igjen.");

  const apiSvar = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": nokkel,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODELL,
      max_tokens: 2000,
      stream: true,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: PROFIL, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: instruks + "\n\nDiktering fra brukeren:\n" + tekst }]
    })
  });

  if (!apiSvar.ok || !apiSvar.body) {
    return feil(502, "Skrivemotoren fikk ikke svar akkurat nå — prøv igjen, eller kopier prompten og bruk Claude som reserve.");
  }

  /* Anthropic svarer med SSE-hendelser; vi videresender kun selve teksten,
     bit for bit, så brukeren ser utkastet vokse frem. */
  const leser = apiSvar.body.getReader();
  const dekoder = new TextDecoder();
  const koder = new TextEncoder();
  let rest = "";
  const strom = new ReadableStream({
    async start(c) {
      try {
        for (;;) {
          const { done, value } = await leser.read();
          if (done) break;
          rest += dekoder.decode(value, { stream: true });
          const linjer = rest.split("\n");
          rest = linjer.pop();
          for (const linje of linjer) {
            if (!linje.startsWith("data:")) continue;
            let h;
            try { h = JSON.parse(linje.slice(5).trim()); } catch { continue; }
            if (h.type === "content_block_delta" && h.delta && h.delta.type === "text_delta") {
              c.enqueue(koder.encode(h.delta.text));
            }
          }
        }
      } catch {
        /* forbindelsen røk underveis — appen viser det den rakk å få */
      }
      c.close();
    }
  });

  return new Response(strom, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}
