# Investerings- og driftsrapport: OP Bygg & Walan Maskin

**Utarbeidet:** 17. juli 2026
**Rolle:** CTO / CFO / SaaS-arkitekt / Investor
**Status:** Beslutningsgrunnlag før lansering
**Valutakurs brukt:** 1 USD = 10,50 NOK. Alle priser eks. mva.

---

## 0. Premisser og antakelser

Repoet inneholder ingen produktkode eller spesifikasjon for OP Bygg eller Walan Maskin. Rapporten bygger derfor på følgende kvalifiserte antakelser, som må bekreftes eller justeres:

| | **OP Bygg** | **Walan Maskin** |
|---|---|---|
| Målgruppe | Byggefirmaer, tømrere, entreprenører (2–100 ansatte) | Maskinentreprenører, anleggsfirmaer, maskinutleie |
| Kjernefunksjoner | AI-assistent for TEK17/byggeforskrifter, tilbud- og anbudsgenerering, KS/HMS-dokumentasjon, sjekklister, prosjektstyring, timeføring | Maskinpark- og flåtestyring, vedlikeholdsplanlegging, AI-assistent for drift/anbud, timeføring per maskin/prosjekt, dokumentasjon |
| AI-tyngde | Høy (dokumentgenerering, RAG mot forskrifter) | Middels (assistent + prediktivt vedlikehold) |
| Betalingsmodell | Abonnement per firma, trappetrinn etter antall brukere | Abonnement per firma, trappetrinn etter brukere + maskiner |

Begge behandles som separate selskaper med egen økonomi, men med felles teknisk plattform der det lønner seg (se seksjon 7).

---

## 1. Teknisk arkitektur

### 1.1 Anbefalt produksjonsstack

| Lag | Valg | Begrunnelse |
|---|---|---|
| Frontend + API | **Next.js på Vercel Pro** | Serverless skalerer fra 0 til 10 000 kunder uten arkitekturendring. Preview-deploys per PR, global CDN inkludert. Billigere enn å drifte egne servere før ~500 kunder. |
| Database | **Supabase Pro (PostgreSQL)** | Managed Postgres med Row Level Security (kritisk for multi-tenant), innebygd auth, storage, realtime og daglig backup i én tjeneste. Reduserer antall leverandører fra 4–5 til 1. |
| Vektordatabase | **pgvector i Supabase** | RAG mot forskrifter/dokumenter trenger ikke dedikert vektordatabase (Pinecone o.l.) før >10 mill. vektorer. pgvector gir 0 kr ekstra kostnad og én database mindre å drifte. |
| AI-modeller | **Anthropic Claude API**: Haiku 4.5 til standardsamtaler, Sonnet til tilbud/dokumentgenerering, Batch API til nattlige jobber | Haiku ($1/$5 per mill. tokens) dekker 70 % av trafikken til 1/3 av Sonnet-pris. Prompt caching gir 90 % rabatt på gjentatt kontekst (forskrifter, firmadata). Batch API gir 50 % rabatt på ikke-tidskritiske jobber. |
| Bakgrunnsjobber / automatisering | **n8n selvhostet på Railway** (~$10/mnd) | Integrasjoner (Tripletex, regnskap, e-post-flows) uten utviklingstid. Selvhostet n8n koster 1/10 av n8n Cloud. |
| Autentisering | **Supabase Auth** | Inkludert i Supabase Pro. E-post/passord, magic links, SSO (SAML på Enterprise-nivå). Sparer Auth0/Clerk (~$250+/mnd ved volum). |
| Fillagring + CDN | **Supabase Storage bak Cloudflare** | Bilder fra byggeplass/maskiner er største lagringsdriver. Cloudflare (gratisplan) foran alt gir CDN, WAF og DDoS-beskyttelse uten kostnad. |
| DNS / domener | **Cloudflare** | Gratis DNS, proxy, rate limiting. |
| Feilsporing | **Sentry Team** ($26/mnd, deles) | Bransjestandard, fanger frontend- og backendfeil. |
| Logging / oppetid | **Better Stack** (fra $0, betalt ~$25/mnd) | Sentralisert logg + uptime-varsling + statusside. |
| Kildekode / CI | **GitHub + GitHub Actions** | Monorepo med delt kjerne (se 7). Actions gratis-kvote holder til ~250 kunder. |
| Transaksjonell e-post | **Resend** ($20/mnd per selskap) | Fakturavarsler, invitasjoner, rapporter. |

### 1.2 Bevisste bortvalg

- **Kubernetes / Docker på VPS:** Feil verktøy før 50+ ansatte i teknologiteamet. Driftskostnaden er ikke serverne, men menneskene som passer dem. Serverless + managed Postgres eliminerer on-call for infrastruktur.
- **Firebase:** Låser til NoSQL og Google-økosystemet. Postgres med RLS er riktig for multi-tenant B2B med relasjonsdata (prosjekter ↔ brukere ↔ maskiner ↔ timer).
- **Fly.io:** Godt alternativ til Railway for n8n/bakgrunnsjobber, men Railway er enklere. Byttekostnad er lav — dette er ikke en kritisk beslutning.
- **Dedikert vektordatabase (Pinecone/Weaviate):** Utsettes til pgvector faktisk blir en flaskehals (usannsynlig før flere tusen kunder).

### 1.3 Delte tjenester mellom selskapene

| Kan deles | Bør være separat |
|---|---|
| Monorepo med delt kjernekode (auth, fakturering, AI-gateway, RAG-pipeline, designsystem) | Domener, branding, e-postavsendere |
| Vercel-team (én Pro-konto, to prosjekter) | Supabase-prosjekt (egen database per selskap — dataskille, GDPR, salgbarhet) |
| Sentry, Better Stack, GitHub-organisasjon | Kundedata, DPA-er, databehandleravtaler |
| Anthropic API-konto (felles volum → høyere rate limits) med kostnadstagging per produkt | Regnskap, Stripe-konto per selskap |
| n8n-instans, intern admin-/driftspanel | |

---

## 2. Månedlige driftskostnader

### 2.1 Faste kostnader (delt plattform, begge selskaper)

| Post | Normal (0–50 kunder) | Høy (250+ kunder) |
|---|---:|---:|
| Vercel Pro (delt team) | 210 kr | 1 100 kr |
| Supabase Pro × 2 prosjekter | 525 kr | 2 100 kr (compute-oppgradering) |
| Supabase PITR-backup × 2 | 0 kr (daglig backup inkl.) | 2 100 kr |
| Sentry Team (delt) | 275 kr | 850 kr |
| Better Stack (delt) | 0 kr | 550 kr |
| Railway (n8n, delt) | 105 kr | 210 kr |
| Resend × 2 | 420 kr | 850 kr |
| Domener (4 stk, snitt/mnd) | 70 kr | 70 kr |
| Google Workspace (2 brukere) | 300 kr | 1 500 kr |
| GitHub Team | 85 kr | 400 kr |
| Sikkerhet (Cloudflare, secret scanning) | 0 kr | 500 kr (Cloudflare Pro × 2) |
| Analyse (PostHog free → betalt) | 0 kr | 1 000 kr |
| **Sum faste, begge selskaper** | **≈ 2 000 kr/mnd** | **≈ 11 200 kr/mnd** |

Kjøres selskapene helt separat blir tilsvarende tall ca. **3 400 kr** og **18 500 kr** — deling sparer 40 % av faste kostnader (se seksjon 7).

### 2.2 Variable kostnader — enhetsøkonomi

Beregningsgrunnlag AI (Claude-prising, prompt caching aktivert):

- **Standardsamtale** (Haiku 4.5, 8 meldinger, ~4 000 input-tokens/melding hvorav 3 000 cachet, 400 output-tokens): ≈ $0,03 ≈ **0,30 kr per samtale**
- **Tung samtale/dokumentjobb** (Sonnet, tilbudsgenerering, RAG mot forskrifter): ≈ **1,50–3,00 kr per jobb**
- **Blandet snitt (70 % Haiku / 30 % Sonnet):** ≈ **0,80 kr per AI-samtale**

| Enhet | Normal belastning | Høy belastning |
|---|---:|---:|
| Kostnad per AI-samtale | 0,80 kr | 1,50 kr |
| AI-kostnad per aktiv bruker/mnd (25 samtaler + 8 dokumentjobber) | 30 kr | 90 kr |
| Infrastruktur per aktiv bruker/mnd (DB, lagring, båndbredde) | 4 kr | 8 kr |
| Kostnad per prosjekt (lagring av bilder/dok, ~2 GB) | 1 kr | 3 kr |
| **Total variabel kostnad per aktiv bruker/mnd** | **≈ 35 kr** | **≈ 100 kr** |
| Kostnad per kunde (antatt 60 % aktive brukere) | 21 kr × antall ansatte | 60 kr × antall ansatte |

Merk: AI-kostnaden er den klart største variable posten (85–90 %). Alt kostnadsarbeid bør derfor rettes mot token-forbruk (se seksjon 10).

---

## 3. Kostnad per kunde og lønnsomhet per kundestørrelse

Antakelse: 60 % av ansatte er aktive brukere. «Månedlig kostnad» = AI + infra + amortisert support (est. 50 kr + 5 kr/bruker). Nettofortjeneste her = bidrag etter direkte kostnader og betalingsgebyr (2 %), før lønn/faste kostnader.

### 3.1 OP Bygg

| Ansatte | Anbefalt plan / pris | Månedlig kostnad | Bruttofortjeneste | Nettofortjeneste | Dekningsgrad |
|---:|---|---:|---:|---:|---:|
| 5 | Starter — 990 kr | 155 kr | 835 kr | 815 kr | 84 % |
| 10 | Pro — 2 490 kr | 290 kr | 2 200 kr | 2 150 kr | 88 % |
| 20 | Business — 4 990 kr | 545 kr | 4 445 kr | 4 345 kr | 89 % |
| 50 | Enterprise — 9 900 kr | 1 280 kr | 8 620 kr | 8 420 kr | 87 % |
| 100 | Enterprise — 17 900 kr | 2 500 kr | 15 400 kr | 15 040 kr | 86 % |

### 3.2 Walan Maskin

Litt høyere pris (maskindata/telematikk-integrasjoner gir høyere betalingsvilje) og litt høyere kostnad (integrasjonstrafikk).

| Ansatte | Anbefalt plan / pris | Månedlig kostnad | Bruttofortjeneste | Nettofortjeneste | Dekningsgrad |
|---:|---|---:|---:|---:|---:|
| 5 | Starter — 1 190 kr | 175 kr | 1 015 kr | 990 kr | 85 % |
| 10 | Pro — 2 990 kr | 330 kr | 2 660 kr | 2 600 kr | 89 % |
| 20 | Business — 5 990 kr | 620 kr | 5 370 kr | 5 250 kr | 90 % |
| 50 | Enterprise — 11 900 kr | 1 450 kr | 10 450 kr | 10 210 kr | 88 % |
| 100 | Enterprise — 19 900 kr | 2 800 kr | 17 100 kr | 16 700 kr | 86 % |

**Konklusjon:** Dekningsgraden ligger stabilt på 84–90 % i alle segmenter. Dette er sunn SaaS-økonomi — AI-kostnaden ødelegger ikke marginen så lenge Haiku brukes som standardmodell og caching er på.

---

## 4. Prisstrategi

### 4.1 OP Bygg

| Plan | Pris/mnd | Målgruppe | Brukere | AI-forbruk | Lagring | Support | Funksjoner |
|---|---:|---|---|---|---|---|---|
| **Starter** | 990 kr | Enkeltmannsforetak og småfirma | Opptil 5 | 300 AI-samtaler | 20 GB | E-post | AI-assistent, sjekklister, timeføring, 10 aktive prosjekter |
| **Pro** | 2 490 kr | Etablerte byggefirma | Opptil 15 | 1 500 samtaler | 100 GB | E-post + chat, 24t SLA | + Tilbuds-/anbudsgenerering, KS/HMS-modul, ubegrensede prosjekter, regnskapsintegrasjon |
| **Business** | 4 990 kr | Mellomstore entreprenører | Opptil 40 | 5 000 samtaler | 500 GB | Prioritert, 8t SLA | + API-tilgang, egne maler, rapporter/analyse, roller og tilganger |
| **Enterprise** | fra 9 900 kr | 50+ ansatte, kjeder | Ubegrenset | Etter avtale | Etter avtale | Dedikert kontakt, SSO | + SAML SSO, databehandleravtale-tilpasning, onboarding, egne integrasjoner |

### 4.2 Walan Maskin

| Plan | Pris/mnd | Målgruppe | Brukere/maskiner | AI-forbruk | Lagring | Support | Funksjoner |
|---|---:|---|---|---|---|---|---|
| **Starter** | 1 190 kr | Små maskinentreprenører | 5 brukere / 10 maskiner | 300 samtaler | 20 GB | E-post | Maskinregister, vedlikeholdslogg, timeføring, AI-assistent |
| **Pro** | 2 990 kr | Mellomstore anleggsfirma | 15 brukere / 30 maskiner | 1 500 samtaler | 100 GB | E-post + chat | + Vedlikeholdsplanlegging, prosjektøkonomi per maskin, anbudsstøtte |
| **Business** | 5 990 kr | Store maskinparker | 40 brukere / 100 maskiner | 5 000 samtaler | 500 GB | Prioritert | + Telematikk-integrasjon, prediktivt vedlikehold, utleiemodul, API |
| **Enterprise** | fra 11 900 kr | Konsern, utleieselskaper | Ubegrenset | Etter avtale | Etter avtale | Dedikert | + SSO, flåteanalyse, egne integrasjoner |

### 4.3 Hvorfor prisene er riktige

1. **Verdiforankring:** Ett vunnet anbud eller én spart dag med KS-dokumentasjon per måned er verdt mer enn hele abonnementet. Prisen måles mot timepris på fagarbeider (700–900 kr/t), ikke mot programvarebudsjett.
2. **Markedsforankring:** Norske bransjeverktøy (SmartDok, Ditio, Cordel — se seksjon 8) ligger typisk på 150–400 kr per bruker/mnd. Våre planer tilsvarer 125–250 kr/bruker — konkurransedyktig, med AI som differensiator.
3. **Marginforankring:** 84–90 % dekningsgrad tåler både rabatter (årsavtale −15 %) og AI-prisøkninger.
4. **Flat pris per trinn, ikke per bruker:** Fjerner friksjonen «skal vi virkelig legge til enda en bruker?» — øker utbredelse internt hos kunden, som øker byttekostnad og reduserer churn.
5. AI-kvoter er satt slik at <5 % av kundene treffer taket (overforbruk selges som påfyll: 500 samtaler = 350 kr).

---

## 5. Lønnsomhetsanalyse — kunder som kreves per omsetningsmål

Blandet ARPA (gjennomsnittsinntekt per kunde): OP Bygg **2 900 kr/mnd**, Walan Maskin **3 400 kr/mnd** (vektet mot Pro-tunge kundemasser). Samlet-kolonnen antar 50/50-miks (blandet ARPA 3 150 kr).

| Mål (MRR) | OP Bygg alene | Walan Maskin alene | Begge samlet |
|---:|---:|---:|---:|
| 100 000 kr/mnd | 35 kunder | 30 kunder | 32 kunder |
| 250 000 kr/mnd | 87 | 74 | 80 |
| 500 000 kr/mnd | 173 | 148 | 159 |
| 1 000 000 kr/mnd | 345 | 295 | 318 |
| 5 000 000 kr/mnd | 1 725 | 1 471 | 1 588 |
| 10 000 000 kr/mnd | 3 449 | 2 942 | 3 175 |

**Realitetssjekk mot markedet:** Norge har ~60 000 aktive byggevirksomheter og ~4 000–6 000 maskinentreprenører. 3 449 kunder for OP Bygg = ~6 % markedsandel — krevende men mulig (SmartDok/Ditio har flere tusen kunder). 2 942 kunder for Walan Maskin alene er **over 50 % av det norske markedet** — 10 mill. kr/mnd for Walan krever derfor internasjonalisering eller prisøkning mot større flåter. Dette er den viktigste strukturelle forskjellen mellom selskapene.

---

## 6. Skaleringsanalyse

Tall for **begge selskaper samlet**, delt plattform, blandet ARPA 3 150 kr. Personalkostnad: gründerdrevet til 25 kunder, deretter gradvis bemanning (support fra 100 kunder, utviklere fra 250).

| Kunder | MRR | Infra + AI-kostnad | Personal (support/dev/drift) | Totalkostnad | Driftsresultat | Margin |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 3 150 | 2 200 | 0 | 2 200 | 950 | 30 % |
| 10 | 31 500 | 4 500 | 0 | 4 500 | 27 000 | 86 % |
| 25 | 78 750 | 8 000 | 0 | 8 000 | 70 750 | 90 % |
| 50 | 157 500 | 14 000 | 60 000 (1 årsverk) | 74 000 | 83 500 | 53 % |
| 100 | 315 000 | 26 000 | 130 000 (2 årsverk) | 156 000 | 159 000 | 50 % |
| 250 | 787 500 | 60 000 | 330 000 (5 årsverk) | 390 000 | 397 500 | 50 % |
| 500 | 1 575 000 | 115 000 | 600 000 (9 årsverk) | 715 000 | 860 000 | 55 % |
| 1 000 | 3 150 000 | 220 000 | 1 000 000 (15 årsverk) | 1 220 000 | 1 930 000 | 61 % |

**Hva skalerer lineært, og hva skalerer nesten ikke:**

- **Lineært med bruk:** AI-tokens (største post), database-compute, lagring, transaksjonell e-post, betalingsgebyr, support.
- **Trappetrinn:** Supabase compute-nivåer, Vercel-seter, personalansettelser.
- **Nesten flatt:** Vercel serverless, Cloudflare, Sentry, GitHub, n8n, domener, overvåking — hele den faste plattformen koster omtrent det samme på 10 og 500 kunder.
- **Nøkkelinnsikt:** Infrastrukturkostnaden faller fra ~70 % av omsetning (1 kunde) til ~7 % (1 000 kunder). Etter ~50 kunder er **mennesker**, ikke maskiner, den dominerende kostnaden. Marginbunnen på 50–53 % rundt 50–250 kunder er ansettelsesfasen — normal og forbigående.

---

## 7. Synergier

| Beslutning | Anbefaling | Begrunnelse |
|---|---|---|
| Helt separate produkter? | **Nei** | Dobler alt arbeid uten gevinst |
| Dele backend-kjerne? | **Ja** — monorepo med delt kjerne (auth, fakturering, AI-gateway, RAG, designsystem), separate apper | 60–70 % av koden er identisk: brukere, roller, prosjekter, timeføring, dokumenter, AI-chat |
| Dele AI-infrastruktur? | **Ja** — felles Anthropic-konto og AI-gateway med kostnadstagging per produkt | Felles volum gir høyere rate limits; delt prompt-bibliotek og evalueringsverktøy |
| Dele database? | **Nei** — eget Supabase-prosjekt per selskap | Dataskille, enklere GDPR/DPA, og selskapene kan selges hver for seg |
| Dele autentisering? | **Delt kode, separate brukerbaser** | Samme Supabase Auth-oppsett, men ingen delte identiteter på tvers |
| Dele administrasjonspanel? | **Ja** — ett internt driftspanel med selskapsvelger | Internt verktøy, ingen kundedata-risiko |
| Dele analyse og overvåking? | **Ja** — felles Sentry/Better Stack/PostHog med miljø-tagging | Én vaktordning, ett dashbord |

**Beregnet besparelse ved deling:**

| Post | Separat drift | Delt | Besparelse |
|---|---:|---:|---:|
| Faste kostnader, oppstart | 3 400 kr/mnd | 2 000 kr/mnd | 1 400 kr/mnd (41 %) |
| Faste kostnader, 250+ kunder | 18 500 kr/mnd | 11 200 kr/mnd | 7 300 kr/mnd (39 %) |
| Utviklingstid (est.) | 2 × full produktutvikling | ~1,4 × | **30–40 % av utviklingskost — den reelle gevinsten** |

Infrastrukturbesparelsen er hyggelig, men den store synergien er **utviklingshastighet**: hver kjernefunksjon bygges én gang og lanseres i begge produkter.

---

## 8. Konkurrentanalyse

| Konkurrent | Marked | Typisk pris | Tilbyr | Mangler (vår åpning) |
|---|---|---|---|---|
| **SmartDok** (SmartCraft) | Bygg + anlegg, Norge | ~150–300 kr/bruker/mnd | Timeføring, HMS, maskinstyring, mannskapslister | Ingen generativ AI, gammeldags UX |
| **Ditio** | Anlegg/maskin, Norge | ~200–400 kr/bruker/mnd | Timeføring, maskinregistrering, dagbok | Ingen AI-assistent, svak dokumentgenerering |
| **Cordel** | Bygg/elektro/VVS | Ofte 1 000–3 000+ kr/mnd per firma | Kalkyle, tilbud, prosjekt | Tungt, dyrt, lang onboarding |
| **Bygglet** (SmartCraft) | Bygg, Norden | ~250–450 kr/bruker/mnd | Prosjektstyring, tilbud, fakturering | Ingen AI, per-bruker-prising skalerer dyrt |
| **CheckD** | Bygg, sjekklister/KS | ~150–300 kr/bruker/mnd | Sjekklister, avviksregistrering | Smal funksjonsflate |
| **Holte (SmartKalk m.fl.)** | Bygg, kalkyle/HMS | Modulpriser, ofte 500–2 000 kr/mnd | Kalkyle, HMS, byggesøknad | Fragmentert produktportefølje |
| **Tripletex/Fiken** | Regnskap (tilstøtende) | 200–1 500 kr/mnd | Økonomi, timeføring | Ikke bransjespesifikk — integrasjonspartner, ikke konkurrent |

**Posisjonering:**

1. **«AI-first» er reell differensiering i 2026.** Ingen av de etablerte norske aktørene har generativ AI som kjerne — de har skjemaer, vi har en assistent som *skriver dokumentene*.
2. **Pris: på nivå med markedet, ikke under.** Effektiv pris ~125–250 kr/bruker ligger i markedets midtsjikt. Å prise under markedet signaliserer lav verdi og finansierer ikke AI-kostnaden. Differensier på verdi (AI, UX, onboarding på minutter i stedet for uker), ikke pris.
3. **Angrip fra undersiden:** Cordel/Holte er dyre og tunge for småfirma — Starter/Pro-planene tar dette segmentet, deretter vokser vi oppover med kundene.
4. **Integrer, ikke konkurrer, med økonomisystemene** (Tripletex, Fiken, PowerOffice) — integrasjoner er kjøpsutløsende og øker byttekostnad.

---

## 9. Risikoanalyse

Prioritert etter sannsynlighet × økonomisk konsekvens:

| # | Risiko | Sannsynlighet | Konsekvens | Tiltak |
|---:|---|---|---|---|
| 1 | **AI-forbruk undervurdert** — enkeltbrukere kan 10-doble snittet; lange dokumenter i kontekst uten caching spiser marginen | Høy | Høy | Harde kvoter per plan, kostnadstak per kunde med varsling, caching på alt, Haiku som default, månedlig kostnadsdashboard per kunde |
| 2 | **Support skalerer raskere enn antatt** — bygg/anlegg-brukere er ikke programvarevante; onboarding er arbeidsintensiv | Høy | Middels | Selvbetjent onboarding, AI-supportbot på egne data, hjelpesenter fra dag 1, «white glove» kun på Business+ |
| 3 | **Churn i SMB-segmentet** — små byggefirma har høy konkursrate og sesongvariasjon | Høy | Middels | Årsavtaler med rabatt, fakturering på forskudd, produktet må inn i daglig drift (timeføring) ikke bare AI |
| 4 | **Vedlikehold og teknisk gjeld** — to produkter på delt kjerne kan låse hverandre | Middels | Høy | Streng modulgrense i monorepo, delt kjerne har egne tester og versjonering |
| 5 | **API-begrensninger / leverandøravhengighet** (Anthropic rate limits, prisendringer, nedetid) | Middels | Middels | AI-gateway-abstraksjon som kan rute til alternativ modell, Batch API for alt ikke-interaktivt, køhåndtering med graceful degradation |
| 6 | **Sikkerhet og GDPR** — KS/HMS-dokumenter og persondata; ett datainnbrudd kan drepe merkevaren i et lite marked | Lav–middels | Svært høy | RLS på alle tabeller fra dag 1, DPA med alle underleverandører, EU-region på all lagring, pentest før Enterprise-salg, secrets-håndtering |
| 7 | **Backup/gjenoppretting undervurdert** — daglig backup er ikke nok når kunder sletter data ved feil | Middels | Middels | PITR aktiveres fra ~50 kunder (2 100 kr/mnd), «papirkurv»-funksjon i produktet, gjenopprettingsøvelse kvartalsvis |
| 8 | **Datalagring vokser ubegrenset** (byggeplassbilder) | Middels | Lav | Lagringskvoter per plan, bildekomprimering ved opplasting, kald lagring for avsluttede prosjekter |
| 9 | **Logging-/observabilitetskostnader eksploderer ved feil** (retry-stormer) | Lav | Lav | Sampling, kvoter i Sentry, alarmer på volum |

---

## 10. Optimalisering — prioritert etter økonomisk effekt

1. **Prompt caching på all fast kontekst** (forskrifter, firmaprofil, maler): 90 % rabatt på cachede input-tokens. Effekt: reduserer AI-kostnaden 50–70 %. *Størst enkelteffekt — implementeres før lansering.*
2. **Modellruting Haiku-først:** Haiku 4.5 som standard, eskaler til Sonnet kun for dokumentgenerering/kompleks analyse. Effekt: 60–70 % lavere snittkostnad per samtale enn «Sonnet på alt».
3. **Batch API (50 % rabatt) for alle nattjobber:** rapporter, oppsummeringer, vedlikeholdsanalyser. Effekt: halverer kostnaden på 20–30 % av AI-volumet.
4. **Harde AI-kvoter + mersalg av påfyll:** konverterer risikopost nr. 1 til en inntektslinje.
5. **Delt plattform (seksjon 7):** 40 % lavere faste kostnader og 30–40 % lavere utviklingskost.
6. **Årsavtaler med 15 % rabatt:** bedre kontantstrøm og lavere churn — «koster» margin, men reduserer CAC-payback og finansieringsbehov.
7. **Selvbetjent onboarding:** utsetter første supportansettelse fra ~50 til ~100 kunder (≈ 60 000 kr/mnd utsatt kostnad).
8. **Utsett kostnader som ikke trengs ennå:** PITR, Cloudflare Pro, dedikert vektordatabase, betalt analyse — aktiveres på definerte kundeterskler, ikke «for sikkerhets skyld».

Samlet effekt av 1–3: variabel AI-kostnad per aktiv bruker faller fra ~90 kr (naiv implementasjon, Sonnet på alt uten caching) til ~30 kr — det er forskjellen på 75 % og 88 % dekningsgrad.

---

## 11. Investeringsvurdering

**Ville jeg investert?** Ja, betinget. Enhetsøkonomien er sterk (85 %+ dekningsgrad), markedet er reelt og underdigitalisert, og AI-differensieringen er troverdig i 2026. Betingelsene: (1) delt plattform som beskrevet, (2) sekvensiell lansering — ikke to produkter samtidig med ett lite team, (3) bevist distribusjon — 10 betalende pilotkunder før det investeres i produkt nr. 2.

| Spørsmål | Svar | Begrunnelse |
|---|---|---|
| Størst potensial? | **OP Bygg** | ~60 000 byggevirksomheter i Norge mot ~5 000 maskinentreprenører — 10× større hjemmemarked |
| Lanseres først? | **OP Bygg** | Størst marked, kortest vei til pilotkunder, AI-verdien (dokumenter/anbud) er lettest å demonstrere |
| Kortest vei til lønnsomhet? | **Walan Maskin** | Høyere ARPA og mindre konkurranse i nisjen — men fra et mindre totalmarked. Break-even på antall kunder er lavest her |
| Størst internasjonalt potensial? | **Walan Maskin** | Maskinpark/flåtestyring er mindre avhengig av nasjonale byggeforskrifter enn OP Bygg (TEK17-bindingen gjør OP Bygg norsk-spesifikk); vedlikehold og telematikk er universelt |
| Størst risiko? | **Walan Maskin** | Lite hjemmemarked (10 mill. kr/mnd krever >50 % nasjonal markedsandel eller eksport), avhengighet av telematikk-integrasjoner mot lukkede leverandør-API-er (Volvo, Cat, Komatsu) |

---

## 12. Endelig anbefaling

**Beslutning (CTO + CFO + investor i ett):**

1. **Teknologistack:** Next.js/Vercel + Supabase (Postgres, Auth, Storage, pgvector) + Cloudflare + Anthropic Claude (Haiku 4.5 default, Sonnet for tunge jobber, Batch for natt) + n8n på Railway + Sentry/Better Stack + GitHub/Actions. Monorepo med delt kjerne, separate databaser.
2. **Skyplattform:** Serverless/managed hele veien. Ingen Kubernetes, ingen VPS-drift. Revurderes først ved >2 000 kunder eller dokumentert kostnadsproblem.
3. **Abonnementer:** Fire trinn per produkt som i seksjon 4 (OP Bygg 990/2 490/4 990/9 900+, Walan 1 190/2 990/5 990/11 900+), flat pris per trinn, AI-kvoter med påfyllssalg, årsavtale −15 %.
4. **Forventede driftskostnader:** ~2 000 kr/mnd fast (delt) ved oppstart, ~11 000 kr/mnd ved 250+ kunder, pluss ~30 kr per aktiv bruker i variabel kostnad (normal drift).
5. **Forventede marginer:** 84–90 % dekningsgrad per kunde; driftsmargin ~85 % før ansettelser, 50–55 % gjennom vekstfasen, 60 %+ ved 1 000 kunder.
6. **Break-even:** Ren infrastruktur: ~1–2 kunder. Inkludert én gründerlønn (80 000 kr/mnd kostnad): **~27 kunder** — realistisk innen 6–9 måneder etter lansering av OP Bygg. Med to ansatte: ~70 kunder.
7. **Rekkefølge:** Lanser **OP Bygg først**. Bygg den delte kjernen som del av OP Bygg-utviklingen. Lanser Walan Maskin 4–6 måneder senere på samme kjerne — da til ~40 % av kostnaden av produkt nr. 1. Walan posisjoneres tidlig for eksport (engelsk/svensk UI), siden hjemmemarkedet alene ikke bærer ambisjonen over ~3 mill. kr/mnd.
8. **Fra 10 til 10 000 kunder uten arkitekturendring:** Multi-tenant med RLS fra første kunde (aldri «en database per kunde»), all AI bak én intern gateway (modell kan byttes uten produktendring), serverless frontend/API (skalerer selv), database som eneste vertikale skaleringspunkt (Supabase compute-nivåer rekker til titusener av kunder), kø-basert bakgrunnsprosessering, og feature flags per plan i stedet for kodeforgreninger. Det eneste som endres på veien er *størrelsen* på databasen og *antall mennesker* — ikke arkitekturen.

**Kort konklusjon:** Bygg én plattform, to merkevarer. OP Bygg er vekstmotoren, Walan Maskin er marginmotoren med eksportopsjon. Med Haiku-først-ruting og prompt caching er AI-kostnaden en håndterbar COGS-post på 10–15 % av omsetningen, og økonomien tåler både prispress og AI-prisendringer. Anbefalingen er å gå til lansering på denne modellen.

---

*Rapporten er basert på markedspriser per juli 2026 (Anthropic-prisliste, Vercel/Supabase/Sentry-priser) og kvalifiserte estimater der eksakte tall mangler (norske konkurrentpriser, aktiveringsgrad, samtalevolum). Tall bør kalibreres mot reelle pilotdata etter 90 dager i drift.*
