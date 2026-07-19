# 03 — Teknisk arkitektur

## Overordnet: fire samvirkende systemer

```
┌─────────────────────────────────────────────────────────────┐
│                     LÆRLING-PLATTFORMEN                      │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐    │
│  │ 1. OPPDAGER  │──▶│ 2. BEDRIFTS- │──▶│ 3. VERKTØYS-   │    │
│  │  (Discovery) │   │    PROFIL    │   │    FABRIKK     │    │
│  └──────────────┘   │ (Knowledge)  │   └───────┬────────┘    │
│         ▲           └──────▲───────┘           │             │
│         │                  │            ┌──────▼─────────┐   │
│         │                  └────────────│ 4. DRIFTS-     │   │
│         │                   læringsloop │    MOTOR       │   │
│         └───────────────────────────────│  (Operations)  │   │
│                                         └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 1. Oppdageren (Discovery Engine)

Kjøres ved onboarding og deretter periodisk.

- **Åpne kilder:** nettside-crawl, Brønnøysundregistrene (åpent API), Proff, Google Business-profil, sosiale medier. Gir bransje (NACE-kode), størrelse, tjenester, tone-of-voice.
- **Samtykkebaserte kilder (OAuth):** Gmail/Outlook, Google/Microsoft-kalender, regnskap (Fiken, Tripletex, PowerOffice — alle har åpne API-er), booking (f.eks. Timma), e-handel (Shopify/WooCommerce).
- **Intervju-agent:** samtalebasert onboarding på norsk; stiller oppfølgingsspørsmål basert på det den allerede har funnet («Jeg ser dere tilbyr X — hvem skriver tilbudene?»).
- **Mønsteranalyse:** LLM-basert klassifisering av e-post-/kalendermønstre → kandidatliste over repetitive oppgaver med estimert tidsbruk.

## 2. Bedriftsprofilen (Knowledge Layer)

Én isolert kunnskapsbase per kunde — dette er produktets vollgrav.

- **Strukturert profil:** tjenester, priser, kunder, leverandører, sesong, regler («vi svarer aldri på pris uten befaring»).
- **Stil-korpus:** eksempler på kundens egne formuleringer → alle utkast låter som *dem*.
- **Vektorisert dokumentminne** (RAG) over tilbud, e-poster og dokumenter kunden deler.
- **Læringslogg:** hver menneskelige korrigering lagres som preferanse og vekter fremtidige utkast.
- **Personvern:** data per kunde er kryptert og logisk isolert; ingen kryss-kunde-trening; EU/EØS-hosting; databehandleravtale som standard. GDPR er et salgsargument i Norge, ikke bare compliance.

## 3. Verktøysfabrikken (Tool Factory)

Der «utvikler»-løftet innfris — uten at kunden ser kode.

- **Bransjemal-bibliotek:** 8–12 velprøvde verktøysmaler per vertikal (tilbudsgenerator, booking-svar, purreflyt, innholdskalender …). Maler = agentflyt + promptskjelett + integrasjonskrav.
- **Skreddersøm-agent:** en byggeagent (Claude Agent SDK) instansierer malen med kundens bedriftsprofil, kobler integrasjoner, og genererer testkjøringer på kundens egne historiske data («slik ville tilbudet til Hansen sett ut»).
- **Godkjenningsflyt:** kunden ser 2–3 testeksempler og aktiverer med ett klikk. Ingen konfigurasjonsskjermer.
- **Egendefinerte verktøy (Pro):** byggeagenten kan komponere nye flyter utenfor malbiblioteket, med menneskelig kvalitetssjekk før aktivering.

## 4. Driftsmotoren (Operations Runtime)

Der «operere på auto»-løftet innfris.

- **Hendelsesdrevet:** triggere fra e-post, kalender, webhooks og tidsplaner starter verktøykjøringer.
- **Godkjenningsporter:** hvert verktøy kjører i modus *utkast* (menneske godkjenner) eller *auto* (kjører selv, logges). Kunden flytter verktøy til auto når tilliten er der — dette er bevisst produktpsykologi for nybegynnere.
- **Overvåking:** kvalitetsscore per kjøring (selv-evaluering + stikkprøver), automatisk deaktivering + varsling ved avvik.
- **Ukesrapport-generator:** aggregerer kjøringer → timer spart, oppgaver utført, forslag til neste verktøy.
- **Kostnadsstyring:** modell-ruting (små modeller til rutine, store til skreddersøm), caching av bedriftsprofil, budsjett-tak per kunde.

## Teknologivalg (MVP)

| Lag | Valg | Begrunnelse |
|---|---|---|
| Agent-kjerne | Claude Agent SDK / Claude API | Beste norskspråklige resonnering + verktøybruk; agentic loop innebygd |
| Backend | TypeScript (Node) + Postgres + pgvector | Raskt å bygge, én database for profil + vektorminne |
| Integrasjoner | Nango/egen OAuth-hub + native API-er (Fiken, Tripletex, Gmail, MS Graph) | Norske fagsystemer har gode åpne API-er |
| Kjøremiljø | Kø-basert (f.eks. Temporal/BullMQ) | Pålitelig replay av agentkjøringer, revisjonslogg |
| Frontend | Enkel web-app + e-post/Slack som primærgrensesnitt | Nybegynnere skal ikke lære et nytt verktøy — Lærling møter dem i innboksen |
| Hosting | EU/EØS (f.eks. AWS Stockholm) | GDPR + salgsargument |

## Sikkerhet og tillit (kritisk for målgruppen)

- Minste-privilegium OAuth-scopes; kunden ser nøyaktig hva Lærling har tilgang til.
- Full revisjonslogg: hver handling Lærling gjør kan inspiseres («Hvorfor sendte du denne e-posten?» → vis resonnering).
- Ingenting sendes eksternt uten godkjenningsport i standardmodus.
- «Angre-knapp» og umiddelbar frakobling av alle integrasjoner.
