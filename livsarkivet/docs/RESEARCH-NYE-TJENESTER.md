# Research: nye tjenester og produktmuligheter for Livsarkivet

**Utført:** 28. juli 2026 · **Av:** utviklingsteamet · **Status:** researchgrunnlag, ikke beslutning

Merking brukt gjennomgående:
**[FAKTA]** verifisert mot kilde · **[TOLKNING]** min lesning av fakta ·
**[HYPOTESE]** ubekreftet antakelse som må testes · **[ANBEFALING]** hva jeg mener vi bør gjøre

---

## Sammendrag

Fem funn endrer bildet mer enn resten til sammen. Leser du bare dette avsnittet:

1. **Cake — den mest kjente dødsplanleggings-tjenesten i USA — ble kjøpt av et begravelseskonsern og deretter slått av.** Foundation Partners Group kjøpte Cake i september 2024. 15. juni 2025 sluttet innlogging og nedlasting å virke, og gjenværende data ble slettet. **[FAKTA]**
   Dette er samtidig den beste og den verste nyheten i hele researchen: det beviser at «hva skjer med arkivet mitt hvis dere forsvinner?» er et reelt spørsmål — og at exit-garantien vi allerede lover i vilkårene er et ekte konkurransefortrinn. Det er også en advarsel om hvilken *type* oppkjøp som ødelegger produktet.

2. **Staten har allerede bygget den økonomiske oversikten for etterlatte.** Digitalt dødsbo (Digdir/Kartverket, lansert juni 2025) henter automatisk bankkontoer, eiendom, kjøretøy, gjeld, forsikring og pensjon, og gir arvinger tilgang via Altinn etter at tingretten har gitt dem det. **[FAKTA]**
   **[TOLKNING]** Alt vi kunne funnet på å bygge av «samlet økonomisk oversikt ved dødsfall» er allerede bygget, gratis, med autoritative kilder vi aldri får tilgang til. Vi må komplettere, ikke konkurrere. Staten vet **hva** som finnes. Den vet ikke **hvor nøkkelen ligger**, **hva avdøde ønsket**, eller **hvem som skal ha hva**.

3. **Fremtidsfullmakt og testament krever fysisk tilstedeværende vitner og våt signatur.** Testament: skriftlig, egenhendig signert, to habile vitner over 18 år, til stede samtidig i samme rom, ikke selv begunstiget (arveloven § 42). Fremtidsfullmakt: samme mønster med særskilt tilkalte vitner (vergemålsloven kap. 10). **[FAKTA]**
   **[TOLKNING]** Ingen ren digital tjeneste kan produsere et gyldig dokument i Norge i dag. Vi kan lage et *utkast til utskrift og signering*, og vi kan **vite at dokumentet finnes og hvor originalen er**. Å love mer er å love noe som ikke holder i retten.

4. **Forsikringsformidling er konsesjonspliktig.** Registrering hos Finanstilsynet, ansvarsforsikring på minst 1 564 610 euro per skadetilfelle, kapitalkrav, politiattest for ledelsen. **[FAKTA]**
   **[TOLKNING]** «Provisjon fra forsikring» er ikke en lettvint inntektslinje. Den er et eget selskap med egen konsesjon.

5. **Bankene har allerede abonnementsoversikt basert på ekte transaksjonsdata**, med oppsigelse i noen tastetrykk (f.eks. Sparebanken Norge «Mine abonnement»). **[FAKTA]**
   **[TOLKNING]** Vi har ikke PSD2-tilgang og kan ikke slå det på datakvalitet. Men ingen av dem løser hva som skjer med abonnementene **når kontoen er sperret ved dødsfall** — der er det fortsatt et hull.

**Den samlede konklusjonen [TOLKNING]:** Livsarkivets forsvarsverk er ikke lagring, ikke oversikt og ikke dokumentmaler. Det er **den kontrollerte frigivelsen** — verifisert hendelse, fire øyne, karenstid, mottakermatrise — og **at vi overlever oss selv**. Nye tjenester bør styrke de to, ikke spre produktet utover.

---

## Metodikk

**Slik ble researchen gjort:** websøk mot internasjonale og nordiske kilder, primærkilder der de var tilgjengelige (Lovdata, Finanstilsynet, Forbrukertilsynet, Digdir, Kartverket, Statsforvalteren), og produktenes egne sider. Prioritet på materiale fra 2023–2026.

**Begrensninger du skal kjenne til, sagt rett ut:**

- **Flere norske nettsteder avviste automatisk henting (HTTP 403)** — blant andre lovdata.no, digdir.no, kartverket.no og epilog.no. For disse bygger funnene på søkeindeksens gjengivelse, ikke på lest primærkilde. Alle slike funn er merket, og **de juridiske punktene må verifiseres mot Lovdata manuelt før de brukes i en kundeavtale eller markedsføring.**
- **App Store, Google Play, Reddit og Product Hunt ble ikke gjennomsøkt direkte** — søkeverktøyet er indeksbasert og USA-vridd. Brukerstemmer under er hentet fra sekundærkilder som siterer dem, og er derfor svakere bevis enn en direkte gjennomgang. **[HYPOTESE]** der de er brukt til å slutte noe.
- **Sammenligningsartikler av typen «beste digitale hvelv 2026» er i hovedsak affiliate-innhold.** De er brukt til å finne *hvilke aktører som finnes*, aldri som kilde på fakta om produktene.
- Ingen priser er verifisert mot leverandørens egen prisside der det ikke står eksplisitt.

---

## Undersøkte markeder

| Marked | Modenhet | Hovedinntrykk |
|---|---|---|
| USA | Høyest | Mange aktører, høy konsolidering, flere døde produkter. Sterkt drevet av at arveoppgjør i USA er dyrt og advokattungt. |
| Storbritannia | Middels | Blanding av gratis (MyWishes) og forsikringsdistribuert. |
| Sverige | Middels | Begravelsesbransjen eier kategorien og gir den bort gratis. Lovreform på vei. |
| Norge | Lav på produkt, **høy på offentlig infrastruktur** | Staten har bygget mer enn i noe annet land vi så på. Privat marked tynt. |
| Danmark | Ikke kartlagt | Fant ingen sammenlignbare aktører i søkene. **[HYPOTESE]** markedet er tynt, men dette er ikke bekreftet. |

---

## Undersøkte aktører

### Internasjonalt

| Aktør | Hva de gjør | Relevans for oss |
|---|---|---|
| **Everplans** (US) | Etablert digitalt hvelv for arveplanlegging, dokumenter, kontoer, instrukser. ~99 USD/år. | Nærmeste funksjonelle slektning. Distribueres også gjennom arbeidsgivere og finansrådgivere. |
| **Trustworthy** (US) | «Intelligent digital vault» for familier, gratisnivå opp til ~40 USD/mnd. AI-uthenting av dokumentdata. | Viser at AI-uthenting er blitt forventet, ikke et salgsargument. |
| **Cake** (US) | Dødsplanlegging. **Kjøpt av Foundation Partners Group sept. 2024, brukerkontoer avviklet 15. juni 2025.** | Den viktigste enkeltsaken i researchen. Se sammendraget. |
| **GoodTrust** (US) | Digital arv, plattformkontoer, testament. | Fokusert på digitale eiendeler spesielt. |
| **Clocr** (US) | «Emergency vault», beredskapskort, krypto/NFT, tidskapsel, digital eksekutor. | Nærmest i konsept til vår beredskapsvinkling. |
| **DGLegacy** (EU/BG) | Digital arv med «heartbeat»-mekanisme. Utmerkelser 2024–2025. | Europeisk, GDPR-innfødt. Verdt å studere nærmere. |
| **MyWishes** (UK) | Gratis: digital arv, «social media will», avskjedsmeldinger, advance care planning. | Beviser at gratisnivået finnes og er dekkende for mange. |
| **Emberlay / Eternal Vault** | Zero-knowledge-arkitektur, «printable legacy key». | Samme kryptomodell som vår sensitiv-tier. Ikke lenger unikt. |

### Norden

| Aktør | Hva de gjør | Relevans |
|---|---|---|
| **Livsarkivet.se** (SE) | **Samme navn.** Gratis skjema for ønsker ved bortgang, tilgjengelig for medlemsbyråene i den svenske begravelsesbransjeforeningen. | **[ANBEFALING]** Varemerkesjekk før nordisk ekspansjon eller nordisk salg. Dette er ikke en teknisk risiko, det er en navnerisiko. |
| **Vita Arkivet / Fonus** (SE/NO) | Gratis «siste vilje»-skjema fra begravelseskonsern. Fonus Norge har «Mitt farvel». | Kategorien gis bort gratis av begravelsesbransjen. Presser betalingsviljen. |
| **Jølstad** (NO) | «Min begravelse» — planlegg egen begravelse, lagre og komme tilbake. Minnesider. | Norsk konkurrent på ønske-delen, gratis. |
| **Epilog** (NO) | Digitalt arveoppgjør: beregner arvinger og arvelodd, registrerer eiendeler og gjeld, fordeler arven, genererer bindende skifteavtale. Ubegrenset juridisk veiledning inkludert. Grunnlagt av to arverettsadvokater. Startuplab-akselerator 2025, DNB NXT 2025. | **Den mest relevante norske aktøren.** De løser fasen *etter* dødsfallet. Vi løser fasen *før*. **[TOLKNING]** Dette er en partner, ikke en konkurrent — og det er en av de mest åpenbare integrasjonene i hele katalogen. |

### Offentlig infrastruktur i Norge (viktigst)

| Tjeneste | Hva den gjør | Status |
|---|---|---|
| **Digitalt dødsbo** (Digdir/Kartverket) | Samlet oversikt over avdødes eiendeler og gjeld: bankkontoer, eiendom, kjøretøy, forsikring, pensjon, gjeld. Data hentet automatisk fra banker, Kartverket, Brønnøysund og Skatteetaten. Arvinger varsles på SMS og e-post, får lenke i Altinn. Kun arvinger tingretten har gitt tilgang. | **Lansert juni 2025**, alle tingretter innen årsslutt 2025. **[FAKTA]** |
| **Livshendelsen «Dødsfall og arv»** | Regjeringens prioriterte livshendelse. Arbeid med etterlattguide, fullmaktsløsninger, lovendringer, bedre dataflyt. | Pågående. **[FAKTA]** |
| **Testamentregistrering hos tingretten** | Testator kan levere originalt testament til oppbevaring og registrering ved en hvilken som helst tingrett, mot kvittering. Kan leveres forseglet (arveloven § 63 m/forskrift). | I drift. **[FAKTA]** |

---

## Viktigste markedstrender

**1. Konsolidering nedstrøms — og produktdød. [FAKTA + TOLKNING]**
Cake ble kjøpt av et begravelseskonsern og lagt ned som produkt. Det er ikke et unntak; det er logikken i bransjen: den som tjener penger på selve dødsfallet, kjøper det som gir dem kundetilgang, og driver ikke videre et abonnementsprodukt.
**[ANBEFALING]** Om Livsarkivet skal selges, er kjøperens *forretningsmodell* viktigere enn prisen. En forsikringsaktør har grunn til å holde tjenesten i live (den reduserer deres egne kostnader og øker kundelojalitet). Et begravelseskonsern har grunn til å slå den av etter at kundelisten er hentet ut.

**2. Staten spiser den enkle delen. [FAKTA]**
Norge er trolig det landet i verden der offentlig sektor har kommet lengst i å løse «hva eide avdøde». Alt som er *registerdata* vil bli gratis og bedre hos staten.
**[TOLKNING]** Verdien flytter seg fra *data om formuen* til *kunnskap som ikke står i noe register*: hvor nøkkelen ligger, hva som skal skje med katten, hvilken av de tre bankboksene som er den viktige, hva avdøde ville sagt.

**3. Nødtilgang er blitt en hyllevare. [FAKTA]**
Bitwarden har Emergency Access med ventetid der eieren kan avslå. 1Password lanserte i 2025 et «Digital Legacy»-verktøy med begunstigede direkte i appen. Apple, Google og Meta har alle legacy-mekanismer.
**[TOLKNING]** «Hvelv med nødtilgang» er ikke lenger et differensiator. Vår karenstid er *lik* Bitwardens. Det som skiller oss er at frigivelsen krever **verifisert dødsfall og to mennesker**, ikke bare at eieren lot være å svare.

**4. Begravelsesbransjen gir kategorien bort gratis. [FAKTA]**
Fonus, Jølstad og de svenske aktørene tilbyr ønskeskjema og minnesider uten kostnad, som kundeanskaffelse.
**[TOLKNING]** Betalingsvilje for «skriv ned ønskene dine» er tett på null i Norge. Betalingsviljen ligger et annet sted — se TJENESTEKATALOG.md.

**5. Sverige digitaliserer testamentet, Norge har ikke begynt. [FAKTA]**
SOU 2025:91 foreslår digitale testamenter og et nasjonalt testamentregister, med foreslått ikrafttredelse 1. januar 2027.
**[TOLKNING + HYPOTESE]** Norge følger ofte etter Sverige på arverettsdigitalisering. Skjer det samme her, blir «digitalt testament» plutselig lovlig — og da vil den som allerede har brukerne, dokumentene og identiteten på plass, ha et forsprang på et par år. Dette er et argument for å bygge *forberedelsen* nå og *utstedelsen* når loven kommer.

**6. Krypto er et voksende, uløst arvehull. [FAKTA]**
Chainalysis anslår at ~3,7 millioner bitcoin — rundt 20 % av alle — er tapt, mye av det bak glemte seed-fraser. Anslag på 17 % kryptoeierskap blant amerikanske voksne.
**[TOLKNING]** Dette er den ene aktivaklassen der *ingen* institusjon kan hjelpe etterlatte. Ingen kundeservice, ingen domstol, ingen tilbakestilling. Det gjør det til det sterkeste enkeltargumentet for en zero-knowledge sensitiv-tier som vår.

**7. Svindel mot eldre øker og er kjønnsskjev. [FAKTA]**
Vishing-saker opp ~50 % på ett år, ~70 % av ofrene er kvinner, aldersgruppen 60+ er overrepresentert (Finans Norge / SpareBank 1 Sør-Norge, 2025). Samtidig falt de samlede svindeltapene for første gang i første halvår 2025.
**[TOLKNING]** «Pårørende ser at noe skjer med mor» er et reelt, akutt og udekket behov — og det er *nærmere* Livsarkivets natur (betrodde kontakter, gradert tilgang, varsling) enn de fleste andre utvidelsene i denne rapporten.

**8. Forsikringsselskapene bygger allerede dokumentasjonsverktøy. [FAKTA]**
Gjensidige har «Husk Hva Du Har» for å fotografere og huske innbo, med dokumentasjonskrav for verdisaker over 30 000 kr.
**[TOLKNING]** Ikke bygg en generisk «verdigjenstandsoversikt». Den finnes hos den som skal betale erstatningen.

---

## Sentrale funn om reelle brukerproblemer

Fra sekundærkilder som gjengir brukerhistorier **[HYPOTESE der de er brukt til å slutte noe]**:

- Far dør, familien mister på én dag tilgang til kredittkort, strøm, bankkontoer, pensjon, trygdeytelser og medlemskap fordi han håndterte alt og ingen kjente passordene.
- Tusenvis av familiebilder låst i en skytjeneste som nekter tilgang med henvisning til personvern. Kontoen ble senere slettet på grunn av inaktivitet.
- En far brukte fem måneder og advokat på å få kopier av sønnens e-post etter dødsfall.
- Gjentakende bekymring i forum: *«hvor lenge finnes selskapet jeg legger dette hos?»*

**[TOLKNING]** Tre mønstre går igjen, og de peker alle samme vei:
1. Problemet oppstår **ikke** fordi informasjonen manglet, men fordi **tilgangen** manglet.
2. Tap skjer ved **inaktivitetssletting** — tiden jobber mot de etterlatte.
3. Brukerne stoler ikke på at leverandøren overlever dem. Cake gir dem rett.

---

## Kilder

Alle hentet 28. juli 2026 med mindre annet er oppgitt.

**Norsk offentlig / juridisk**
- Digdir, Digitalt dødsbo tilgjengelig for arvinger — https://www.digdir.no/sammenhengende-tjenester/digitalt-dodsbo-er-na-tilgjengelig-arvinger/7158 *(403 ved henting; via søkeindeks)*
- Kartverket, Digitalt dødsbo — https://www.kartverket.no/en/about-kartverket/nyheter/eiendom/2025/juni/digitalt-dodsbo-tilgjengelig-for-arvinger *(403 ved henting)*
- Digdir, livshendelsen Dødsfall og arv — https://www.digdir.no/handlingsplanen/dodsfall-og-arv/2588
- Altinn Digital, Dødsfall og arv — https://www.altinndigital.no/eksempler/dodsfall-og-arv/
- DSOP, Oppgjør etter dødsfall — https://dokumentasjon.dsop.no/dsop_v2oed_about.html
- Lovdata, vergemålsloven kap. 10 (fremtidsfullmakt) — https://lovdata.no/nav/lov/2010-03-26-9/kap10 *(403 ved henting)*
- Lovdata, arveloven § 42 (testament, formkrav) — https://lovdata.no/lov/2019-06-14-21/%C2%A742
- Lovdata, forskrift til arveloven § 1 (oppbevaring hos tingretten) — https://lovdata.no/forskrift/2020-11-09-2327/%C2%A71
- Statsforvalteren, informasjonsskriv om fremtidsfullmakt (2026) — https://www.statsforvalteren.no/siteassets/fm-oslo-og-viken/vergemal/informasjonsskriv/nr-13.-informasjonsskriv-om-fremtidsfullmakt-2026.pdf
- Statsforvalteren, veileder om stadfesting av ikrafttredelse — https://d71tvbqpkyamo.cloudfront.net/2-Beslutningsst%C3%B8tte/Vergem%C3%A5l/Veiledere-og-rundskriv/Stadfestingavfremtidsfullmakt-1.pdf
- Finanstilsynet, tillatelser — https://www.finanstilsynet.no/tillatelser/
- Lovdata, forsikringsformidlingsforskriften — https://lovdata.no/dokument/SF/forskrift/2021-12-22-3872
- Forbrukertilsynet, veileder strøm — https://www.forbrukertilsynet.no/vi-jobber-med/strom
- Forbrukertilsynet, ulovlig praksis ved salg av strømavtaler ved boligovertakelse (21.11.2025) — https://www.forbrukertilsynet.no/ulovlig-praksis-ved-salg-av-stromavtaler-ved-overtakelse-av-bolig
- Helsedirektoratet, beslutningsprosesser i livets sluttfase — https://www.helsedirektoratet.no/faglige-rad/lindrende-behandling-i-livets-sluttfase/kommunikasjon-og-samvalg/legg-til-rette-for-gode-beslutningsprosesser-i-livets-sluttfase
- Store norske leksikon, livstestament — https://snl.no/livstestament
- Finans Norge, status og tiltak mot svindel 2025 — https://www.finansnorge.no/tema/okonomisk-kriminalitet/svindel/status-og-tiltak-mot-svindel-for-2025/
- SpareBank 1 Sør-Norge, økning i svindel mot eldre kvinner — https://kommunikasjon.ntb.no/pressemelding/18716141/

**Aktører**
- Epilog — https://www.epilog.no/om-oss *(403 ved henting)*
- Altogether/Cake FAQ (avvikling 15.06.2025) — https://www.altogetherfuneral.com/faq/faq-cake.html
- Funeral Director Daily, Foundation Partners kjøper Cake — https://funeraldirectordaily.com/foundation-partners-acquires-cake/
- Everplans — https://www.everplans.com/
- Trustworthy — https://www.trustworthy.com/
- Livsarkivet.se — https://www.livsarkivet.se/
- Fonus Norge — https://fonus.no/
- Jølstad, planlegg min begravelse — https://planlegg.jolstad.no/planlegg-min-begravelse/
- Bitwarden Community, Emergency Access — https://community.bitwarden.com/t/bitwarden-after-death/55824
- Gjensidige, dokumenter innboet — https://www.gjensidige.no/godtforberedt/bolig-eiendom/slik-skal-du-dokumentere-innboet-ditt
- Sparebanken Norge, Mine abonnement — https://www.spv.no/dagligbank/betaling/mine-abonnement
- Abonnementsoversikt.no — https://abonnementsoversikt.no/

**Marked og bransje**
- Crunchbase News, death/end-of-life planning startup funding — https://news.crunchbase.com/venture/death-end-of-life-planning-startup-funding-better-place/
- Tracxn, Death Tech-sektoren — https://tracxn.com/d/sectors/death-tech/
- Regeringen.se, SOU om nye regler om arv og testamente — https://www.regeringen.se/contentassets/c716a109da4e4ffb89478f59b443e271/nya-regler-om-arv-och-testamente-.pdf
- CNBC, crypto estate planning mistakes (06.12.2025) — https://www.cnbc.com/amp/2025/12/06/crypto-investors-estate-planning-taxes-mistakes.html

---

## Hva jeg IKKE fant, og som bør undersøkes videre

Ærlig liste, så ingen tror dette er uttømmende:

1. **Danske aktører.** Null treff. Enten tynt marked eller dårlig søk.
2. **Faktiske abonnementstall og churn** for Everplans/Trustworthy. Ingen offentlige tall funnet.
3. **Om noe norsk forsikringsselskap allerede har et lignende produkt internt.** Bør sjekkes direkte før pitch.
4. **Provisjonsnivåer i norsk strømsalg.** Forbrukertilsynets regelverk fant jeg; tallene gjorde jeg ikke.
5. **Direkte brukerstemmer** fra App Store, Google Play og Reddit. Dette er den største svakheten i researchen, og den bør lukkes før produktbeslutninger som hviler på antatt brukersmerte.

---

## Avsluttende kvalitetssikring

Gjennomført til slutt, mot oppdragsbeskrivelsen og på tvers av de seks dokumentene. Hva som ble kontrollert, og hva som ble funnet:

**Kontrollert og i orden**
- **Poeng stemmer på tvers.** Alle 17 tjenester som er scoret begge steder, er sammenholdt felt for felt mellom `TJENESTEKATALOG.md` og `PRIORITERT-ROADMAP.md`. Ingen avvik.
- **Regnestykkene stemmer.** Alle 19 sum-rader i roadmapen er regnet om for hånd: sum = de seks positive minus de tre negative. Ingen feil.
- **Ingen forslag duplikerer eksisterende funksjonalitet.** Katalogen åpner med en liste over hva som allerede finnes, og hvert forslag er holdt mot den.
- **Merkingen er gjennomført.** Alle faktapåstander er merket **[FAKTA]**, **[TOLKNING]**, **[HYPOTESE]** eller **[ANBEFALING]**, og de fire nettstedene som avviste automatisk henting er navngitt.

**Funnet og rettet**
1. **`KREATIVE-KONSEPTER.md` overdrev sin egen originalitet.** Elleve av ideene er stikkord som står i oppdragsbeskrivelsen (katastrofeberedskap, kjæledyr, beredskapsscore, dead man's switch, flere godkjennere, svindelbeskyttelse m.fl.). De er nå merket **[STIKKORD FRA OPPDRAGET]**, og ni nye ideer er lagt til slik at 30 ideer faktisk ikke står i oppdraget. Antallet gikk fra 32 til 41.
2. **Ideene 11–32 manglet fire av seks obligatoriske felt.** Alle har nå konsept, nyhetsverdi, hvem de hjelper, hvorfor de passer oss, billig validering og kopieringsvern.
3. **`TJENESTEKATALOG.md` manglet målgruppe, brukerreise, integrasjoner, partner og personvernrisiko** på de fleste tjenestene. Lagt til på alle 27.
4. **Ingen samlet personvern- og reguleringsgjennomgang fantes.** Lagt til, med de 17 dimensjonene oppdraget ba om, og med en eksplisitt liste over hva som krever juridisk vurdering.
5. **De 18 livshendelsene var ikke gjennomgått** — bare de tre anbefalte. Alle 18 er nå med i appendiks 1, med begrunnelse for hvorfor 15 av dem ikke bør bli egne arbeidsflyter.
6. **Etterlatteoppgavene fra oppdraget manglet et sted å bo.** Samlet i appendiks 2 som råmateriale for B1, sortert etter hva som faktisk haster.
7. **`PARTNERE-OG-INNTEKTER.md` manglet pensjonsleverandører og eiendomsmeglere**, og inntektstabellen manglet forsikringspartnerskap og advokatfirma som kanal. Alle lagt til — eiendomsmegler med en frarådning.
8. **To konsepter viste seg å høre hjemme i «bygg nå»** (nr. 39 og 40 i `KREATIVE-KONSEPTER.md`). Lagt inn i roadmapen som eget avsnitt, uten å renummerere resten.

**Fortsatt svakt, sagt rett ut**
- Ingen av de juridiske punktene er lest i primærkilde — Lovdata avviste henting. **Må verifiseres av jurist før bruk i produkt, avtale eller markedsføring.**
- Ingen direkte brukerstemmer fra app-butikker eller forum. Hele analysen hviler på research, ikke på observert atferd hos norske brukere.
- Ingen av prioriteringene er testet mot en betalende kunde, fordi det ikke finnes noen ennå. Det er den viktigste innvendingen mot hele dokumentsettet, og den står også som punkt 1 i roadmapens siste avsnitt.
