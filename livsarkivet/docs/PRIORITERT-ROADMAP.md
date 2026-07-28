# Prioritert roadmap

**Dato:** 28. juli 2026 · Grunnlag: `TJENESTEKATALOG.md`, `PARTNERE-OG-INNTEKTER.md`, `KREATIVE-KONSEPTER.md`

**Poengskala 1–10.** For *brukerverdi, betalingsvilje, inntektspotensial, strategisk relevans, konkurransefortrinn, gjennomførbarhet* er **10 best**.
For *teknisk kompleksitet, juridisk risiko, tillitsrisiko* er **10 verst**.

**Sum** = (de seks positive) − (de tre negative). Maks +60, min −30. Sum er en sorteringshjelp, ikke en fasit — les begrunnelsen.

---

## BYGG NÅ

Lav kompleksitet, høy verdi, utnytter mekanikk som allerede finnes.

| # | Tjeneste | Verdi | Betal. | Inntekt | Strat. | Fortrinn | Gj.førb. | Kompl. | Jur. | Tillit | **Sum** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **B1 Etterlatte-kontrollpanel** | 10 | 2 | 9 | 10 | 9 | 9 | 4 | 3 | 1 | **+41** |
| 2 | **A2 Testamentregister («finnes, og hvor»)** | 8 | 3 | 5 | 8 | 8 | 10 | 2 | 2 | 1 | **+37** |
| 3 | **E2 Årlig gjennomgang** | 9 | 8 | 6 | 9 | 6 | 8 | 3 | 1 | 1 | **+41** |
| 4 | **C2 Ønsker ved alvorlig sykdom** | 8 | 4 | 4 | 7 | 6 | 9 | 2 | 2 | 2 | **+32** |
| 5 | **H1 Beredskapsscore (regelbasert)** | 8 | 5 | 5 | 8 | 5 | 9 | 3 | 2 | 1 | **+34** |
| 6 | **B4 Henvisning til Epilog** | 7 | 5 | 4 | 7 | 5 | 10 | 2 | 4 | 2 | **+30** |
| 7 | **B2 Abonnementsdød** | 8 | 4 | 4 | 7 | 7 | 8 | 3 | 2 | 2 | **+31** |

**Hvorfor akkurat disse:** alle sju bruker mekanikk som allerede står. Ingen krever ny arkitektur, ny konsesjon eller ny underleverandør. Til sammen er de trolig under to måneders arbeid, og de flytter produktet fra «hvelv» til «tjeneste».

**Den viktigste er nr. 1.** Etterlattevisningen er det eneste av alt vi bygger som *den etterlatte faktisk møter*. Alt annet er noe eieren gjorde en gang.

---

## VALIDER FØRST

Reell verdi, men vi vet ikke om noen vil ha det. Test billig før du bygger.

| # | Tjeneste | Verdi | Betal. | Inntekt | Strat. | Fortrinn | Gj.førb. | Kompl. | Jur. | Tillit | **Sum** | Hvordan validere |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 8 | **A1 Fremtidsfullmakt-veiviser** | 9 | 7 | 6 | 9 | 8 | 7 | 4 | 8 | 3 | **+31** | Legg ut MVP (registrer at den finnes). Mål antall registreringer på 8 uker. |
| 9 | **G3 Tjeneste for dem uten nær familie** | 10 | 9 | 7 | 8 | 10 | 4 | 5 | 8 | 4 | **+31** | Intervju 15 enslige 60+. Betalingsvilje før kode. |
| 10 | **C1 Beredskapskort** | 9 | 6 | 5 | 7 | 7 | 6 | 5 | 7 | 6 | **+22** | Papirprototype til 10 brukere. Ville de båret det? |
| 11 | **G1 Gradert pårørendetilgang** | 9 | 7 | 6 | 9 | 8 | 6 | 6 | 4 | 5 | **+30** | Spør eksisterende brukere om de hjelper en forelder i dag. |
| 12 | **F1 Kryptonøkkel-arv (veiledning)** | 9 | 9 | 5 | 6 | 8 | 8 | 4 | 5 | 4 | **+32** | Landingsside, mål påmelding. Lite segment, høy vilje. |
| 13 | **E1 Tre livshendelser** | 8 | 5 | 5 | 7 | 5 | 7 | 4 | 3 | 1 | **+29** | Bygg **én** (samlivsbrudd). Mål bruk før nr. to. |

**Nr. 9 fortjener en kommentar.** Den har høyest råscore på verdi, betalingsvilje og konkurransefortrinn i hele katalogen — og lavest gjennomførbarhet. Det er ikke et kodeproblem; det er at noen må stå ansvarlig som betrodd part. **[ANBEFALING]** Valider betalingsviljen før du vurderer om organisasjonen kan bære ansvaret.

---

## UNDERSØK PARTNERSKAP

Krever noen andre. Bygg ikke før avtalen finnes.

| # | Tjeneste | Verdi | Betal. | Inntekt | Strat. | Fortrinn | Gj.førb. | Kompl. | Jur. | Tillit | **Sum** |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 14 | **Medlemsorganisasjon som kanal** | 8 | 7 | 7 | 10 | 6 | 8 | 2 | 2 | 1 | **+41** |
| 15 | **A3 Advokatkontroll** | 8 | 8 | 5 | 7 | 7 | 6 | 5 | 7 | 3 | **+26** |
| 16 | **BankID-innlogging** | 7 | 4 | 3 | 9 | 6 | 6 | 5 | 3 | 1 | **+26** |
| 17 | **Bankpartnerskap** | 7 | 5 | 8 | 8 | 5 | 3 | 3 | 6 | 3 | **+24** |

**Nr. 14 er den enkleste vinnersaken i hele dokumentet.** Ingen ny kode (tenant-modellen er bygget), lav juridisk risiko, høy tillit, kort beslutningsvei — og den gir de første tusen ekte brukerne. **[ANBEFALING]** Ta den før forsikringssporet, ikke etter.

---

## JURIDISK AVKLARING NØDVENDIG

Ikke bygg før jurist har svart.

| # | Tjeneste | Spørsmålet som må besvares |
|---|---|---|
| 18 | **C3 Fullmektigmodus ved sykdom** | Hva kreves for å gi tilgang basert på redusert handleevne? Holder statsforvalterens attest? Hvordan reverseres tilgangen forsvarlig? |
| 19 | **C1 Beredskapskort** | Helseopplysninger uten innlogging — hvordan innhentes uttrykkelig samtykke (art. 9), og hvordan begrenses eksponeringen? |
| 20 | **G3 Profesjonell betrodd part** | Hvilket ansvar påtar vi oss? Krever det verge-/advokatgodkjenning? |
| 21 | **A1/A3 Fremtidsfullmakt med generator** | Hvor går grensen mot rettsrådgivning? Hvem hefter for malen? |
| 22 | **H2 AI-dokumentforståelse** | Tredjelandsoverføring ved modellbruk. EØS-modell eller ny DPIA-vurdering. |

---

## LANGSIKTIG MULIGHET

Riktig retning, feil tidspunkt.

| # | Tjeneste | Hvorfor vente |
|---|---|---|
| 23 | **Digitalt testament** | Ulovlig i Norge i dag. Sverige foreslår ikrafttredelse 1.1.2027 (SOU 2025:91). **[HYPOTESE]** Norge kan følge etter. Følg med — ikke bygg. |
| 24 | **J1 Meldinger til fremtidige datoer** | Krever at vi finnes om 20 år. Bygg først når eksportmodellen gjør meldingen uavhengig av oss. |
| 25 | **H3 Etterlatte-assistent (AI)** | Bygg B1 manuelt først. Hvis sjekklisten er god nok, trengs kanskje ikke AI. |
| 26 | **Nordisk ekspansjon** | Krever varemerkeavklaring (Livsarkivet.se finnes) og egen juridisk tilpasning per land. |
| 27 | **F2 Inntektsgivende digitale eiendeler** | Lite segment i Norge foreløpig. |
| 28 | **G2 Flere godkjennere** | Løser et problem få har meldt. |

---

## IKKE ANBEFALT

| # | Forslag | Begrunnelse |
|---|---|---|
| 29 | **D2 Strømprovisjon** | Tillitsrisiko 10. Regulatorisk risiko 8. Kategorien er tatt av aktører uten tillit å tape. |
| 30 | **Provisjon på forsikringssalg** | Konsesjonspliktig (ansvarsforsikring 1,56 mill. EUR/skadetilfelle). Samme interessekonflikt. |
| 31 | **Egen økonomisk oversikt for etterlatte** | Digitalt dødsbo gjør det bedre, gratis, fra autoritative kilder. |
| 32 | **Abonnementsoppdagelse fra bankdata** | Krever PSD2. Bankene har det. |
| 33 | **Generisk verdigjenstandsregister** | Gjensidige m.fl. har det, koblet til erstatningsoppgjøret. |
| 34 | **Automatisk oppsigelse av avtaler** | Ingen fullmakt. Feil oppsigelse i et dødsbo gjør reell skade. |
| 35 | **Automatisk innlogging på avdødes kontoer** | Bryter plattformvilkår. Kan være straffbart. |
| 36 | **Salg av aggregerte data** | Bryter premisset. Aldri. |
| 37 | **Egen krypto-forvaring** | Å holde nøkler for andre er finansiell virksomhet med eget konsesjonsspor. |
| 38 | **Alle atten livshendelser** | Femten av dem står tomme og får produktet til å se forlatt ut. Full gjennomgang: `TJENESTEKATALOG.md` appendiks 1. |
| 39 | **ID-tyveriovervåking** | Krever datakilder vi ikke har. Etablerte aktører gjør det; vi ville bare videresolgt. |

---

# Prioritert topp 15

Rekkefølgen tar hensyn til avhengigheter og til hva som faktisk kan gjøres parallelt.

| # | Tiltak | Type | Hvorfor akkurat nå |
|---|---|---|---|
| **1** | **Etterlatte-kontrollpanel (B1)** | Bygg | Det eneste den etterlatte faktisk møter. Grunnen til at eieren betalte. Komplementerer Digitalt dødsbo i stedet for å konkurrere. |
| **2** | **Medlemsorganisasjon som kanal** | Partner | Raskeste vei til første tusen ekte brukere. Ingen ny kode. Høyest tillit, kortest beslutningsvei. |
| **3** | **Årlig gjennomgang (E2)** | Bygg | Svarer på «hvorfor betale hver måned». Uten den er abonnementet uforsvarlig. |
| **4** | **Testamentregister (A2)** | Bygg | Nesten gratis, fjerner et reelt tap, bruker frigivelsesmekanikken som står. |
| **5** | **Fremtidsfullmakt MVP (A1, kun registrering)** | Valider | Måler om målgruppen finnes, uten å bygge generator eller ta juridisk risiko. |
| **6** | **Henvisning til Epilog (B4)** | Partner | Enkleste partneravtale i hele analysen. Lukker sirkelen etter frigivelse. |
| **7** | **Beredskapsscore (H1)** | Bygg | Regelbasert, forklarlig, driver utfylling av alt annet. |
| **8** | **Abonnementsdød (B2)** | Bygg | Dekker hullet bankene ikke dekker: når kontoen er sperret. |
| **9** | **Ønsker ved alvorlig sykdom (C2)** | Bygg | Kategorien finnes. Dette er språk og presisjon, ikke arkitektur. |
| **10** | **Jurist på pakken A1/A3/C1/C3** | Juridisk | Låser opp fire tiltak samtidig. Én bestilling, ikke fire. |
| **11** | **Gradert pårørendetilgang (G1)** | Valider | Løser «datteren hjelper mor» uten BankID-deling. Stor verdi hvis behovet er reelt. |
| **12** | **Digital arv — plattformsjekkliste (B3)** | Bygg | Høy verdi, men krever presisjon om hva plattformene faktisk tillater. |
| **13** | **Kryptonøkkel-veiledning (F1)** | Valider | Lite segment, svært høy betalingsvilje, sensitiv-tier finnes allerede. |
| **14** | **BankID** | Partner | Ikke inntekt — men trolig største enkelttiltak for tillit i norsk marked. |
| **15** | **Én livshendelse: samlivsbrudd (E1)** | Bygg | Test formatet på den ene hendelsen som endrer arv, forsikring og matrise samtidig. |

---

## To konsepter som hører hjemme i «bygg nå», funnet i kvalitetssikringen

Disse to kom fram da jeg gikk gjennom `KREATIVE-KONSEPTER.md` på nytt. De er billigere enn alt annet på listen og hører til mellom nr. 4 og nr. 5 i topp 15. Nummereringen over er ikke endret, så referanser til nr. 1–38 fortsatt stemmer.

| Konsept | Verdi | Betal. | Inntekt | Strat. | Fortrinn | Gj.førb. | Kompl. | Jur. | Tillit | **Sum** |
|---|---|---|---|---|---|---|---|---|---|---|
| **Konsept nr. 40 — registrering av det som IKKE finnes** | 8 | 3 | 4 | 7 | 9 | 10 | 1 | 1 | 1 | **+38** |
| **Konsept nr. 39 — papirversjonen på kjøleskapet** | 7 | 2 | 3 | 6 | 5 | 10 | 1 | 1 | 1 | **+30** |

**Nr. 40** løser et problem ingen i kategorien har sett: etterlatte bruker uker på å lete etter ting som aldri fantes. Et arkiv som bare registrerer det som finnes, lar ingen slutte å lete. Kostnaden er noen avkrysningsbokser.

**Nr. 39** er en innrømmelse av egen begrensning: nødsituasjonen begynner ofte med et menneske i en gang med en telefon de ikke får låst opp. Ett ark på kjøleskapet løser det vi ikke kan løse digitalt.

---

## Det som ikke står i listen, men som er viktigere enn nr. 15

**[ANBEFALING]** To ting slår alt på denne listen, og de er ikke funksjoner:

1. **Skaff de første 100 ekte brukerne.** Hele denne analysen bygger på research, ikke på observert atferd hos norske brukere av Livsarkivet — fordi det ikke finnes noen ennå. Den svakeste antakelsen i dokumentet er at vi vet hva de vil ha.

2. **Lukk de åtte MANGLER-punktene i `leverandorpakke.md`.** Ingen partner i tabellene over kan signere før behandlingsansvarlig juridisk enhet er avklart og pen-testen er gjennomført. Å bygge tolv nye funksjoner endrer ikke det.
