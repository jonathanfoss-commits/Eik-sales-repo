# Livsarkivet — investorpitch

**Dato:** 28. juli 2026 · **Status:** ingen brukere i produksjon, ingen inntekt

Les dette først, så slipper du å lure:

> **Vi har null brukere og null kroner i inntekt.** Ingen pilot er signert. Ingen
> partner har sagt ja. Det som finnes er et ferdig bygget og testet system, et
> researchgrunnlag, og et sett med samtaler som ennå ikke er avtaler.
> Alt annet i dette dokumentet skal leses med det som utgangspunkt.

Hver påstand om hva som er *bygget* kan verifiseres i koden i dette repoet, og
hver slik påstand er merket med filen den står i. Hver påstand om *markedet* har
kilde og dato, eller står ikke her.

---

## 1. Problemet

Når noen dør, mangler de etterlatte sjelden informasjon. De mangler **tilgang**.

Passordet til telefonen. Hvilken bank kontoen står i. Om det finnes et testament,
og hvor originalen ligger. Hvem som skal ha hytta. Om han hadde en
livsforsikring gjennom fagforeningen. Hvor nøkkelen til boden er. Hva han ville
sagt til barnebarna.

Dette er ikke registerdata. Det står ikke i Folkeregisteret, ikke i Kartverket,
ikke i Brønnøysund. Det står i hodet til én person, og den personen er død.

De fire brukerhistoriene som gikk igjen i researchen (fra sekundærkilder,
`docs/RESEARCH-NYE-TJENESTER.md`, hentet 28.07.2026 — de er *illustrasjoner*, ikke
bevis):

- Familien mister på én dag tilgang til kredittkort, strøm, bank, pensjon og
  medlemskap fordi far håndterte alt.
- Familiebilder låst i en skytjeneste som nekter tilgang med henvisning til
  personvern, og som senere sletter kontoen for inaktivitet.
- Fem måneder og en advokat for å få kopier av en avdød sønns e-post.
- Og det spørsmålet som går igjen i alle forumtrådene:
  *«hvor lenge finnes selskapet jeg legger dette hos?»*

Det siste spørsmålet er ikke paranoia. Det er punkt 2.

---

## 2. Hvorfor nå

### 2a. Cake — beviset på at spørsmålet er reelt

**Cake var den mest kjente dødsplanleggings-tjenesten i USA.** Foundation
Partners Group, et begravelseskonsern, kjøpte selskapet i september 2024.
**15. juni 2025 sluttet innlogging og nedlasting å virke, og gjenværende
brukerdata ble slettet.**

Kilder: Funeral Director Daily om oppkjøpet
(https://funeraldirectordaily.com/foundation-partners-acquires-cake/) og
Altogether/Cake sin egen FAQ om avviklingen
(https://www.altogetherfuneral.com/faq/faq-cake.html). Begge hentet 28.07.2026.

Dette er den viktigste enkeltsaken i hele analysen vår, og den sier to ting:

1. **«Finnes dere om 20 år?» er et helt legitimt spørsmål.** Kunder som stiller
   det har rett. Enhver som selger et beredskapsarkiv og ikke har et svar på
   det, selger noe de ikke kan levere.
2. **Hvilken type kjøper som overtar, avgjør om produktet overlever.** Et
   begravelseskonsern tjener penger på selve dødsfallet. For dem er en
   abonnementstjeneste en kundeliste å hente ut, ikke en forretning å drive
   videre. En forsikringsaktør har motsatt insentiv: tjenesten senker deres egne
   kostnader og øker kundelojaliteten, så de har grunn til å holde den i live.

**Konsekvensen for oss, som er en produktbeslutning og ikke en talemåte:** vi
har bygget eksporten først. `GET /api/eksport` gir eieren alt sitt som JSON,
inkludert de frasepakkede krypteringsnøklene, slik at innholdet kan dekrypteres
uten oss (`server/api/konto.js`). Arkivet skal kunne overleve selskapet. Det er
også en begrensning på hvem vi kan selges til, og den vil vi ha inn i
aksjonæravtalen — ikke som en klausul mot en exit, men som en klausul mot den
ene typen exit som ødelegger produktet for brukerne.

### 2b. Avgrensningen mot Digitalt dødsbo — svaret før du spør

Vi tar dette først, fordi det er den innvendingen enhver som kjenner norsk
offentlig sektor kommer med.

**Digitalt dødsbo (Digdir/Kartverket, lansert juni 2025)** gir arvinger en
samlet, automatisk hentet oversikt over avdødes **bankkontoer, eiendom,
kjøretøy, gjeld, forsikring og pensjon**, via Altinn, etter at tingretten har
gitt dem tilgang. Det er gratis, det er autoritativt, og det er bedre enn noe
en privat aktør kan bygge.

Kilder: Digdir (https://www.digdir.no/sammenhengende-tjenester/digitalt-dodsbo-er-na-tilgjengelig-arvinger/7158)
og Kartverket (https://www.kartverket.no/en/about-kartverket/nyheter/eiendom/2025/juni/digitalt-dodsbo-tilgjengelig-for-arvinger).
**Begge nettsteder svarte 403 på automatisk henting 28.07.2026** — funnene
bygger på søkeindeksens gjengivelse, ikke på lest primærkilde. Det bør
verifiseres manuelt før det brukes i en avtale.

**Vi konkurrerer ikke med dette. Vi vil ikke konkurrere med dette.** Vi har
eksplisitt strøket «egen økonomisk oversikt for etterlatte» fra roadmapen med
den begrunnelsen (`docs/PRIORITERT-ROADMAP.md`, punkt 31 under «Ikke
anbefalt»).

Skillet, i én setning:

> **Staten vet hva som finnes. Staten vet ikke hvor nøkkelen ligger, hva avdøde
> ønsket, eller hvem som skal ha hva.**

| Staten løser | Vi løser |
|---|---|
| Hvilke kontoer, eiendommer, kjøretøy, gjeld og poliser fantes | Passord, koder, hvor originaldokumentene ligger |
| Data fra registre | Kunnskap som aldri sto i noe register |
| Tilgang **etter** at tingretten har åpnet skiftet | Det de nærmeste trenger **de første 48 timene** |
| Formuen | Ønskene, instruksene, den siste hilsenen |
| Arvingene | Mottakerne eieren selv har pekt ut, som ikke alltid er arvingene |

At staten har bygget den registerbaserte delen er faktisk **bra for oss**: det
tar bort den delen av produktet vi ville tapt på, og det legitimerer hele
kategorien overfor en norsk bruker.

### 2c. To bevegelser til, med kilde

- **Nødtilgang er blitt hyllevare, men på et svakere premiss.** Bitwarden har
  Emergency Access med ventetid, 1Password lanserte Digital Legacy i 2025,
  Apple/Google/Meta har alle legacy-mekanismer. Felles for dem: frigivelsen
  utløses av at eieren *ikke svarte*. Vår utløses av et **verifisert dødsfall
  godkjent av to mennesker**. Det er forskjellen på et produkt et
  forsikringsselskap kan bygge en utbetaling på, og et som det ikke kan.
- **Sverige utreder digitale testamenter** (SOU 2025:91, foreslått ikrafttredelse
  1.1.2027). **[HYPOTESE, ikke fakta]** Norge følger ofte etter på
  arverettsdigitalisering. Skjer det, har den som allerede har brukerne,
  dokumentene og identiteten på plass, et par års forsprang. Vi bygger
  *forberedelsen* nå. Vi bygger ikke utstedelsen, fordi den er ulovlig i Norge
  i dag (arveloven § 42 krever egenhendig signatur og to samtidig
  tilstedeværende vitner).

---

## 3. Hva vi har bygget

Alt under er verifisert i koden i dette repoet 28.07.2026. Filreferansene er
med så du kan sjekke selv.

**Kjerneloopen, hele veien:**
`hvelv → mottakermatrise → trigger → verifisering → karenstid → frigivelse → etterlattevisning`

| Det som er bygget | Verifisert i |
|---|---|
| Tilstandsmaskin for frigivelse med ni tilstander, aktørbaserte overganger, og karenstidsutløp der klokka injiseres som parameter (ren funksjon, testbar) | `server/frigivelse.js` |
| **Fire øyne:** to *ulike* saksbehandlere må godkjenne. Håndhevet både i app og som databasebeskrankning `CONSTRAINT fire_oyne CHECK (godkjent_2_av IS NULL OR godkjent_2_av <> godkjent_1_av)` | `server/frigivelse.js`, `server/migrations/003_utlosning.sql` |
| **Karenstid, 48 timer** som standard, med eierens nødbrems (`karenstid → blokkert`, aktør: eier) | `server/config.js`, `server/frigivelse.js` |
| **To-kilde-regel:** attest kreves alltid; med to eller flere betrodde kontakter kreves i tillegg bekreftelse fra en annen enn melderen | `server/frigivelse.js` (`klarForVerifisering`) |
| **Append-only revisjonslogg:** approllen har kun `GRANT SELECT, INSERT` på `revisjon`. Det finnes ingen UPDATE- eller DELETE-rettighet å omgå | `server/migrations/001_grunnmur.sql` |
| **Zero-knowledge sensitiv-tier:** PBKDF2 310 000 iterasjoner, AES-GCM 256, nøkkeldeling til mottaker via ECDH P-256, alt i nettleseren. API-et **avviser** `nivaa='sensitiv'` uten `kryptert` + `nokkelRef` — serveren kan ikke ta imot klartekst selv om noen skulle prøve | `app/js/krypto.js`, `server/api/hvelv.js` |
| **Ingen saksbehandler kan lese hvelvinnhold.** Det finnes ingen RLS-policy som gir det. `hvelv_elementer` har nøyaktig to lesepolicyer: eieren, og en mottaker etter frigivelse | `server/migrations/002_hvelv.sql`, `003_utlosning.sql`, `007_krypto.sql` |
| **Flerselskapsisolasjon (white-label):** `er_admin_for(hvelv_id)` i stedet for et ubetinget `er_admin()`, slik at ett selskaps saksbehandler aldri ser et annets kunder | `server/migrations/011_tenant.sql` |
| **Delingslag:** kunden deler fire felt (polise, kundenummer, begunstiget, kontaktperson) hver for seg, og tilbaketrekket ligger i RLS-policyen — ikke i en `WHERE` i koden | `server/migrations/012_deling.sql`, `server/api/deling.js` |
| **Webhook ved frigivelse** med HMAC-SHA256 over `"<tidsstempel>.<kropp>"`, uten personopplysninger i nyttelasten | `server/webhook.js` |
| **OIDC-innlogging via selskapets IdP** (Authorization Code + PKCE, RS256 mot JWKS, `node:crypto`, ingen avhengigheter). En ekstern innlogging får **alltid** rolle `'person'` — selskapets IdP kan aldri utnevne saksbehandlere hos oss | `server/oidc.js`, `server/migrations/015_oidc.sql` |
| **Folkeregister-trigger:** oppretter sak i `under_verifisering` — fjerner attest-steget, men ikke fire øyne og ikke karenstiden. Fødselsnummer lagres aldri, kun HMAC med pepper utenfor basen. Uten `FOLKEREGISTER_URL` + `FNR_PEPPER` gjør den ingenting | `server/folkeregister.js` |
| **AI-agentene er råd, aldri vedtak.** Uten API-nøkkel svarer gatewayen «utilgjengelig», og saken går til menneskelig vurdering som før. Ingen agent står på kritisk sti | `server/ai/gateway.js`, `server/agenter/orkestrator.js` |
| **GDPR art. 15/17/20:** eksport med nøkler, og sletting som krever passord på nytt | `server/api/konto.js` |
| **Etisk abonnementsgating:** utløpt betaling stenger kun eierens *redigering*. Lesing, frigivelsesløpet, nødbremsen og etterlattevisningen er aldri portet | `server/api/abonnement.js` |

**Teknisk profil:** Node ≥ 20 og Postgres 16. Én produksjonsavhengighet (`pg`).
15 migrasjoner, 19 testfiler over sju testnivåer, skjermbilder som testbevis i
`testbevis/`. Drift i EU/EØS (Frankfurt, `render.yaml`).

**Hva som IKKE er bygget, selv om det står omtalt et sted:**
- Dead man's switch: kun en tillatt verdi i en databasebeskrankning. Ingen kode.
- SMS-kanal: `kanal`-kolonnen tillater `'sms'`. Ingen SMS sendes.
- «Siste hilsen»: finnes som kategori. Ingen egen funksjon rundt den.
- README-avsnittet «Bevisste avgrensninger» er utdatert på to punkter —
  kryptoen og Folkeregister-triggeren er implementert siden det ble skrevet.

**Ingen av dette er i produksjon med ekte brukere.**

---

## 4. Hvorfor det er vanskelig å kopiere

Kort her; hele argumentet står på ett ark i `docs/vollgraven.md`.

Hver enkeltdel er kjent teknologi. Kryptering i nettleseren er en helg. En
ventetid er en kolonne. To godkjennere er en `if`.

Det som er vanskelig er **rekkefølgen**, og at **hvert ledd må kunne feile
trygt**. Systemet må gjøre to motsatte ting samtidig: aldri frigi for tidlig,
og alltid frigi til slutt. En feil i den ene retningen er et personvernbrudd
med et menneske i live. En feil i den andre gjør hele produktet verdiløst den
dagen det gjelder. Det finnes ingen versjon av dette som er «litt riktig».

Den delen som ikke kan kopieres i det hele tatt er det som ikke er kode:
tilliten til at vi finnes om tjue år, og at vi ikke selges til noen som slår
det av. Cake taper det argumentet for hele bransjen. Vi kan vinne det ved å
ha bygget exit-en først.

---

## 5. Forretningsmodell

Prinsippet vi ikke bøyer: **vi tjener aldri penger på å påvirke valg vi har
privilegert innsyn i.** Ingen provisjon på strøm, ingen provisjon på forsikring,
aldri salg av data. Det er skrevet ned med begrunnelse i
`docs/PARTNERE-OG-INNTEKTER.md`, slik at det ikke kommer snikende tilbake når
kassen er tom.

**Hovedsporet er B2B2C, fordi produktet allerede er bygget for det:** et
forsikringsselskap, en bank eller en medlemsorganisasjon tilbyr Livsarkivet
under egen merkevare og egen innlogging, og betaler per aktiv bruker.
Sluttbrukeren betaler ingenting. Tenant-isolasjon, white-label, delingslag,
webhook, selskaps-API og OIDC er ferdig kode, ikke en plan.

**Salgsrekkefølgen er noe annet enn inntektsrekkefølgen:**

1. **Medlemsorganisasjon først** (Pensjonistforbundet, LOfavør, Seniornett,
   fagforeninger). De har målgruppen, troverdigheten og kortest beslutningsvei,
   og de kjøper allerede medlemsfordeler i bulk. Raskeste og billigste vei til
   de første tusen ekte brukerne.
2. **Forsikring deretter** — størst potensial, 6–18 måneders salgsløp.
3. **Bank til slutt**, når det finnes en referanse å vise til.

**Prisen er ikke satt.** Vi har ikke et tall vi kan forsvare, og vi vil ikke
finne på et. Det settes i den første forhandlingen.

**Direkte abonnement beholdes** ved siden av (Stripe er implementert, i
test-modus). Ikke fordi det er hovedinntekten, men fordi det holder oss ærlige:
et produkt som bare finnes gjennom én partner, dør med den partneren.

**Om markedstallene:** vi har ikke funnet et offentlig tall på hvor mye
livsforsikring i Norge som aldri utbetales fordi ingen meldte fra. Det finnes
ikke hos Finans Norge og ikke hos Finanstilsynet. Vi bruker derfor ikke noe
slikt tall. Det vi har er at Statens pensjonskasse **selv** kaller sin
dødsfallsdekning «et ukjent gode» i en pressemelding 1. juli 2026, med beløp på
drøyt 1,9 mill. kr til gjenlevende ektefelle/samboer/partner og 680 000 kr per
barn under 25 år
(https://kommunikasjon.ntb.no/pressemelding/18948198/ukjent-gode-slik-fungerer-gruppeliv-i-staten).
Vi har også sett et tall på i størrelsesorden 4,9 mrd. kr utbetalt
dødsfallskapital på engangsbetalte produkter i 2025, tilskrevet Finans Norge —
**vi fikk 403 ved henting og har ikke verifisert det mot deres egen tabell, og
bruker det derfor ikke.**

---

## 6. Roadmap

Full prioritering med poeng og begrunnelse i `docs/PRIORITERT-ROADMAP.md`.
De fem første, i rekkefølge:

| # | Hva | Hvorfor akkurat denne |
|---|---|---|
| 1 | **Etterlatte-kontrollpanel** | Det eneste i hele produktet den etterlatte faktisk møter. Alt annet er noe eieren gjorde en gang. Bygges som komplement til Digitalt dødsbo, ikke som konkurrent |
| 2 | **Første kanalavtale med en medlemsorganisasjon** | Ingen ny kode. De første tusen ekte brukerne, som er den eneste måten å avkrefte antakelsene våre på |
| 3 | **Årlig gjennomgang** | Svaret på «hvorfor betale hver måned». Et arkiv som ikke vedlikeholdes er verre enn ingen arkiv, fordi familien stoler på det |
| 4 | **Testamentregister — «finnes det, og hvor ligger originalen»** | Nesten gratis å bygge, fjerner et reelt tap, bruker frigivelsesmekanikken som allerede står |
| 5 | **Fremtidsfullmakt, kun registrering** | Måler om målgruppen finnes, uten å bygge en dokumentgenerator og uten å ta juridisk risiko vi ikke kan bære |

Det vi **ikke** bygger, og hvorfor det er et signal: egen økonomisk oversikt
(staten gjør det bedre), digitalt testament (ulovlig i Norge i dag),
provisjonsmodeller (konsesjonspliktig eller tillitsødeleggende), egen
kryptoforvaring (finansiell virksomhet med eget konsesjonsspor). Hele listen
med begrunnelser står i roadmapen. Vi mener listen over hva vi har sagt nei til
sier mer om selskapet enn listen over hva vi vil bygge.

---

## 7. Risiko

Full gjennomgang med tiltak og frist per punkt: `docs/risiko-apent.md`. De fem
som betyr mest:

1. **Null brukere.** Hele produktprioriteringen hviler på research, ikke på
   observert atferd hos norske brukere. Det er den svakeste antakelsen i alt vi
   har skrevet, og vi har skrevet det slik selv i roadmapen.
2. **Ingen juridiske punkter lest i primærkilde.** Lovdata svarer 403 på
   automatisk henting. Alt om arveloven, vergemålsloven og
   forsikringsformidling bygger på søkeindeks og må verifiseres av jurist før
   det brukes i avtale eller markedsføring.
3. **Åtte åpne punkter blokkerer enhver signatur** — behandlingsansvarlig
   juridisk enhet, ekstern pen-test, navngitte saksbehandlere med responstid,
   RTO/RPO, databehandleravtaler, exit-plan, IdP-integrasjonstest,
   Maskinporten-hjemmel (`docs/leverandorpakke.md`).
4. **Avhengighet av at én motpart sier ja.** B2B2C-modellen forutsetter en
   partner. Vi har ingen ennå. Derfor er medlemsorganisasjon-sporet lagt foran
   forsikringssporet: kortere beslutningsvei, lavere regulatorisk terskel.
5. **Fire-øyne-regelen krever to bemannede mennesker per selskap, hele tiden.**
   Det er tilsiktet, og det kan ikke løses teknisk. Ferie og sykdom må stå i
   avtalen. Et dødsfall venter ikke.

---

## 8. Hva vi søker

**Vi er ikke ferdige med å finne ut hva dette er verdt, og vi later ikke som.**

Det vi trenger er ikke først og fremst penger til å bygge mer. Systemet er
bygget. Vi trenger å komme forbi de tre tingene som står mellom «kode klar» og
«tatt i bruk»:

1. **Juridisk avklaring og formalisering** — behandlingsansvarlig enhet,
   jurist på de tolv spørsmålene i `docs/jurist-brief.md`,
   databehandleravtaler. Dette blokkerer alt annet.
2. **Ekstern penetrasjonstest.** Ingen compliance-funksjon i et
   forsikringsselskap slipper oss gjennom uten.
3. **Distribusjon.** Én kanalavtale som gir de første tusen brukerne. Er det ett
   sted en investor med nettverk er verdt mer enn kapitalen, er det her.

**Det vi ber om i første omgang er ikke en term sheet.** Det er at du sier hva
du mener er galt med dette, og — hvis du kjenner noen — én introduksjon til en
medlemsorganisasjon eller et livsforsikringsselskap.

Vi vil heller ha en riktig innvending nå enn et ja vi ikke kan innfri.

---

## Dokumenter det er verdt å lese videre

| Fil | Hva den er |
|---|---|
| `docs/vollgraven.md` | Ett ark: hvorfor dette ikke kopieres på en måned |
| `docs/risiko-apent.md` | Alt som er galt, med tiltak og frist |
| `docs/leverandorpakke.md` | Svaret på en compliance-funksjons spørsmål, med de åtte manglene |
| `docs/RESEARCH-NYE-TJENESTER.md` | Markedsresearchen, med kilder og med det vi *ikke* fant |
| `docs/PRIORITERT-ROADMAP.md` | Prioriteringen, inkludert alt vi har sagt nei til |
| `docs/adr/` | Ni arkitekturbeslutninger med begrunnelse |
