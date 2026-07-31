/* Lærling — «Bli kjent»-intervjueren (onboarding av nye kundefirma).
   Nettsiden app/bli-kjent.html sender samtalen hit; funksjonen kaller
   Anthropic-API-et med VÅR nøkkel og strømmer intervjuerens svar tilbake.

   Personvern (ufravikelig, samme kontrakt som skriv.mjs): ren gjennomstrømming.
   Samtalen bor i kundens nettleser (localStorage), sendes hit KUN per tur,
   lagres aldri her eller i noen database, logges aldri, og brukes aldri til
   trening (API-bruk trenes det ikke på). Den ferdige bedriftsprofilen sendes
   separat — og kun ved kundens aktive «Send»-trykk — til pilotloggen.

   Miljøvariabler i Netlify:
   - ANTHROPIC_API_KEY  (påkrevd — deles med Skrivemotoren)
   - INTERVJU_KODE      (valgfri — overstyrer invitasjonskoden under)

   Invitasjonskoden er BEVISST ingen hemmelighet: den står i lenka Jonathan
   sender kundene (kode i URL havner i logger og historikk — derfor kan den
   aldri være mer enn bot-demping, jf. innspill.js). Vern mot misbruk er
   koden + IP-taket + at hver tur koster lite. */

const KODE = "bli-kjent-26";
const MODELL = "claude-opus-4-8";
const MAKS_TUR_TEGN = 8000;      /* én melding (innlimt tilbud er størst) */
const MAKS_HISTORIKK_TEGN = 40000;

const FELTER = ["firma", "jobbene", "kundene", "skrivestil", "penger", "systemer", "folk"];

const INSTRUKS = "Du er onboarding-assistenten til Lærling — en AI-medarbeider for bygg- og " +
  "håndverksfirma. Personen du snakker med driver eller jobber i et slikt firma. Jobben din: " +
  "bli kjent med firmaet gjennom en hyggelig samtale, så appen deres kan stå ferdig oppsatt.\n\n" +
  "REGLER:\n" +
  "- Svar ALLTID kort: maks to korte setninger + ETT spørsmål. Aldri to spørsmål. Ingen småprat.\n" +
  "- Jordnære spørsmål uten fagord eller jussord. Grav videre når svaret åpner for det.\n" +
  "- «Hopp over» og «vet ikke» er alltid greit — gå videre uten kommentar.\n" +
  "- Etter 2–3 svar: speil kort noe konkret tilbake («Da skriver jeg tilbud som dette for dere: …») " +
  "så kunden ser gevinsten underveis.\n" +
  "- Spør ALDRI om: priser/påslag, organisasjonsnummer, personnumre, lønninger, eller hva de vil appen skal gjøre.\n\n" +
  "TEMAENE i rekkefølge:\n" +
  "1. FIRMAET: «Fortell om firmaet ditt som om jeg var en ny lærling på første arbeidsdag — " +
  "hva gjør dere, hvor holder dere til, hvor mange er dere?»\n" +
  "2. JOBBENE OG KUNDENE: typiske jobber (størrelse/varighet), privatfolk vs. firma/proffer " +
  "(ca. fordeling), underentreprenører og oppfølging av dem.\n" +
  "3. PAPIRARBEIDET: hvem skriver hva (tilbud/e-post/rapporter), hva stjeler mest kveldstid. " +
  "Be dem så lime inn et gammelt tilbud eller en typisk e-post — analyser tone, hilsen og signatur.\n" +
  "4. PENGER OG DOKUMENTASJON: ekstraarbeid (varsling, tapt betaling?), purrerutiner, " +
  "reklamasjon/uenighet der dokumentasjon manglet.\n" +
  "5. SYSTEMER OG FOLK: regnskaps-/faktura-/timesystem, hva skrives fra byggeplassen i dag, " +
  "hvem skal bruke appen (fornavn + rolle), hvem er sjef for oppsettet, iPhone eller Android.\n\n" +
  "AVSLUTNING: Når alle temaene er dekket (eller kunden ber om å avslutte): les opp en kort " +
  "oppsummering på vanlig norsk og spør «Stemmer dette?». Deretter skriv én tekstblokk med " +
  "NØYAKTIG disse feltoverskriftene (skriv «ukjent» der noe mangler):\n" +
  "=== BEDRIFTSPROFIL TIL LÆRLING v1 ===\n" +
  "FIRMA: / STED: / ANSATTE: / FAG OG TYPISKE JOBBER: / KUNDEMIKS (privat/proff, ca. %): / " +
  "UNDERENTREPRENØRER: / SKRIVESTIL (tone, hilsen, signatur): / EKSEMPELTEKST FRA FIRMAET: / " +
  "STØRSTE TIDSTYVER (prioritert): / EKSTRAARBEID-PRAKSIS: / PURREPRAKSIS: / " +
  "DOKUMENTASJONSERFARING: / SYSTEMER: / BRUKERE (fornavn + rolle): / KONTAKTPERSON: / " +
  "MOBILTYPE: / ANNET VERDT Å VITE:\n" +
  "=== SLUTT ===\n" +
  "Si til slutt at profilen sendes med Send-knappen på siden.\n\n" +
  "MASKINSPOR (ufravikelig — et svar UTEN denne linjen er ugyldig): Absolutt siste linje i " +
  "HVERT ENESTE svar, uansett innhold, skal være nøyaktig på formen\n" +
  "<!--PROFIL{\"firma\":false,\"jobbene\":false,\"kundene\":false,\"skrivestil\":false," +
  "\"penger\":false,\"systemer\":false,\"folk\":false,\"klar\":false}-->\n" +
  "der feltene settes true etter hvert som temaene er reelt besvart, og «klar» settes true " +
  "kun i meldingen som inneholder den ferdige profilblokken. Linjen er UI-status — aldri " +
  "innhold — og vises ikke til kunden. Sjekk før du avslutter: er siste linje maskinsporet?";

/* samme best-effort IP-demper som skriv.mjs, romsligere vindu for samtaleturer */
const teller = new Map();
function forMange(ip) {
  const naa = Date.now(), vindu = 10 * 60 * 1000;
  const liste = (teller.get(ip) || []).filter((t) => naa - t < vindu);
  liste.push(naa);
  teller.set(ip, liste);
  return liste.length > 60;
}

function feil(status, melding) {
  return new Response(JSON.stringify({ feil: melding }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return feil(405, "Bare POST.");

  const kode = req.headers.get("x-invitasjon") || "";
  const riktigKode = process.env.INTERVJU_KODE || KODE;
  if (kode !== riktigKode) return feil(401, "Ugyldig invitasjon — sjekk lenka du fikk tilsendt.");

  const nokkel = process.env.ANTHROPIC_API_KEY;
  if (!nokkel) return feil(503, "Intervjueren er ikke koblet til ennå.");

  let kropp;
  try { kropp = await req.json(); } catch { return feil(400, "Ugyldig forespørsel."); }

  const historikk = Array.isArray(kropp.historikk) ? kropp.historikk : null;
  if (!historikk || !historikk.length) return feil(400, "Tom samtale.");

  let sum = 0;
  const meldinger = [];
  for (const m of historikk) {
    const tekst = String(m.tekst || "").trim();
    if (!tekst) continue;
    if (tekst.length > MAKS_TUR_TEGN) return feil(413, "Én av meldingene er for lang — del den opp.");
    sum += tekst.length;
    meldinger.push({ role: m.rolle === "laerling" ? "assistant" : "user", content: tekst });
  }
  if (!meldinger.length || meldinger[meldinger.length - 1].role !== "user")
    return feil(400, "Samtalen må slutte med kundens melding.");
  if (sum > MAKS_HISTORIKK_TEGN) return feil(413, "Samtalen er blitt for lang — trykk Send, eller start på nytt.");

  const ip = req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for") || "ukjent";
  if (forMange(ip)) return feil(429, "Mange meldinger på kort tid — vent et par minutter.");

  const apiSvar = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": nokkel,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODELL,
      max_tokens: 1500,
      stream: true,
      system: [{ type: "text", text: INSTRUKS, cache_control: { type: "ephemeral" } }],
      messages: meldinger
    })
  });

  if (!apiSvar.ok || !apiSvar.body) {
    return feil(502, "Intervjueren fikk ikke svar akkurat nå — prøv igjen om et øyeblikk.");
  }

  /* som skriv.mjs: videresend kun selve teksten, bit for bit */
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
        /* forbindelsen røk — siden viser det den rakk å få */
      }
      c.close();
    }
  });

  return new Response(strom, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
  });
}

export { FELTER };
