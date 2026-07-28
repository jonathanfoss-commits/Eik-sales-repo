# Partnere og inntektsmodeller

**Dato:** 28. juli 2026 · **Status:** analyse, ikke besluttet

---

## Det bærende prinsippet

Livsarkivets eneste reelle kapital er at brukeren tror oss når vi sier at vi ikke ser innholdet og ikke tjener penger på det.

Det gir en enkel test for enhver inntektsmodell:

> **Kan brukeren fortsatt stole på oss hvis hun vet nøyaktig hvordan vi tjener penger på henne?**

Modeller som består testen, står nedenfor. Modeller som ikke gjør det, står i egen tabell til slutt — med begrunnelse, så de ikke kommer snikende tilbake når kassen er tom.

---

## Partnerkategorier

### 1. Forsikringsselskaper — **hovedsporet**

**Hvorfor de vil ha det:** En verifisert dødsfallsmelding med polisenummer starter utbetalingen til begunstigede uten at noen må huske å be om den. Statens pensjonskasse omtaler selv dødsfallsdekning som «et ukjent gode» — dekninger som aldri kreves er et reelt problem for bransjen.

**Hva vi allerede har bygget:** tenant-isolasjon, white-label, delingslag, webhook ved frigivelse, selskaps-API, OIDC, leverandørpakke.

**Modell:** B2B2C. Selskapet betaler per aktiv bruker eller fast plattformavgift. Sluttbrukeren betaler ingenting.

| | |
|---|---|
| Inntektspotensial | **9** — én avtale kan gi tusenvis av brukere |
| Tillit | **9** — brukeren slipper å betale, og vi slipper å selge dem noe |
| Brukeropplevelse | 8 |
| Regulatorisk risiko | 5 — DORA, utkontraktering, databehandleravtale |
| Teknisk kompleksitet | **2** — bygget |
| Salgsprosess | **2/10 i enkelhet** — 6–18 måneder, mange møter |
| Passer formålet | **Ja** |

**Kritisk avgrensning:** Vi må aldri bli **forsikringsformidler**. Det krever registrering/tillatelse hos Finanstilsynet, ansvarsforsikring på minst **1 564 610 euro per skadetilfelle**, kapitalkrav og politiattest for ledelsen. **[FAKTA]**
Grensen går ved at vi **varsler om en hendelse og utleverer felt kunden har delt**. I det øyeblikket vi *anbefaler, sammenligner eller formidler* en forsikring, er vi over i konsesjonspliktig virksomhet.

### 2. Banker

**Hvorfor de vil ha det:** Etterlatte i banken er en tung, manuell prosess. Banken har allerede kunderelasjonen og BankID.

**Modell:** White-label i nettbanken, eller medlemsfordel.

| | |
|---|---|
| Inntektspotensial | 8 |
| Tillit | 7 — men banken er også den brukeren minst vil dele alt med |
| Regulatorisk risiko | 6 |
| Teknisk kompleksitet | 3 |
| Salgsprosess | Lang, og bankene bygger ofte selv |
| Passer formålet | Ja, med forbehold |

**[HYPOTESE]** Bankene er lettere å selge til *etter* at et forsikringsselskap har sagt ja, ikke før. Referansen er verdt mer enn pitchen.

### 3. Advokater

**Rolle:** Nivå 3 og 4 i `FREMTIDSFULLMAKT.md` — det vi ikke har lov til å gjøre selv.

**Modell:** Henvisningshonorar, 20–35 % av fast pris.

| | |
|---|---|
| Inntektspotensial | 5 — begrenset volum, god margin |
| Tillit | 8 **forutsatt at honoraret opplyses** |
| Regulatorisk risiko | 6 — advokatforskriftens regler om henvisning og markedsføring må sjekkes |
| Teknisk kompleksitet | 4 |
| Salgsprosess | **8/10 i enkelhet** — ett firma, én avtale |
| Passer formålet | Ja |

**[ANBEFALING]** Start med **ett** firma, ikke en markedsplass. En markedsplass krever volum vi ikke har, og skaper et utvalgsansvar vi ikke vil ha.

### 4. Begravelsesbyråer — **behandles med forsiktighet**

**Hvorfor det ser fristende ut:** De møter etterlatte den dagen det skjer. Rask distribusjon.

**Hvorfor jeg advarer:** Foundation Partners Group kjøpte Cake i september 2024 og avviklet brukerkontoene 15. juni 2025. **[FAKTA]** Bransjelogikken er kundetilgang, ikke abonnementsdrift. I Sverige og Norge gir byråene allerede bort ønskeskjema og minnesider gratis (Fonus «Mitt farvel», Jølstad «Min begravelse») som anskaffelseskanal.

| | |
|---|---|
| Inntektspotensial | 4 |
| Tillit | 5 — brukeren kan tro vi selger dataene til byrået |
| Regulatorisk risiko | 4 |
| Teknisk kompleksitet | 3 |
| Salgsprosess | Kort |
| Passer formålet | **Delvis** |

**[ANBEFALING]** Bruk dem som **henvisningskanal ut** (etterlatte som trenger byrå), ikke som eier eller hovedkanal inn. Og hvis oppkjøpstilbud kommer derfra: les Cake-historien først.

### 5. Medlemsorganisasjoner — **undervurdert**

Pensjonistforbundet, LOfavør, Seniornett, fagforeninger, Huseierne.

**Hvorfor:** De har nøyaktig målgruppen, de har troverdighet vi ikke kan kjøpe, og de kjøper allerede medlemsfordeler i bulk. Beslutningsveien er kortere enn i en bank.

| | |
|---|---|
| Inntektspotensial | 7 |
| Tillit | **9** |
| Regulatorisk risiko | **2** |
| Teknisk kompleksitet | **2** — samme tenant-modell som forsikring |
| Salgsprosess | **7/10 i enkelhet** |
| Passer formålet | **Ja** |

**[ANBEFALING]** Dette er trolig den **raskeste** veien til de første tusen ekte brukerne, og den er billigst å teste. Vurder den før du bruker seks måneder på et forsikringsselskap.

### 6. Arbeidsgivere

**Modell:** Personalgode, betalt per ansatt.

| | |
|---|---|
| Inntektspotensial | 6 |
| Tillit | 5 — **arbeidsgiver må aldri se noe**, og det må være åpenbart for den ansatte |
| Regulatorisk risiko | 5 |
| Teknisk kompleksitet | 3 |
| Salgsprosess | Middels |
| Passer formålet | Ja, hvis arbeidsgiver kun betaler og aldri ser |

### 7. Strøm, mobil og bredbånd — **kun som datafelt, aldri som salg**

Se `TJENESTEKATALOG.md` D2 for hele begrunnelsen. Kort:

**[FAKTA]** Strømsalg til forbrukere er tett regulert av Forbrukertilsynet — krav til opplysninger i markedsføring, prisliste etter prisopplysningsforskriften § 21, og forbud mot å reklamere med lavere pris enn konkurrenter uten dokumenterbar, sammenlignbar dokumentasjon. Forbrukertilsynet publiserte 21.11.2025 veiledning om **ulovlig praksis ved salg av strømavtaler ved boligovertakelse** — nøyaktig den livshendelsen en «flytting»-flyt ville truffet.

| | |
|---|---|
| Inntektspotensial | 5 |
| Tillit | **1** |
| Regulatorisk risiko | **8** |
| Passer formålet | **Nei** |

**[ANBEFALING]** Ta imot avtalen som et *datafelt* brukeren fyller ut. Ikke selg noe. Hvis du senere vil ha inntekt her, gjør det som en **åpen, brukerinitiert** funksjon der brukeren ber om en sammenligning — aldri som en anbefaling vi dytter fram.

### 8. Identitets- og sikkerhetstjenester

BankID for identitetskontroll ved sensitive operasjoner.

| | |
|---|---|
| Inntektspotensial | 3 (kostnad, ikke inntekt) |
| Tillit | **9** — BankID hever troverdigheten betydelig |
| Regulatorisk risiko | 3 |
| Teknisk kompleksitet | 5 |
| Passer formålet | **Ja** |

**[TOLKNING]** BankID er ikke en inntektsmodell, men det kan være den enkeltendringen som gjør størst forskjell for tillit i norsk marked — særlig hos eldre brukere, som kjenner den igjen.

### 9. Epilog og digitale arveoppgjør

Gjensidig henvisning: vi sender etterlatte videre til skiftet, de sender brukere tilbake til forberedelsen.

| | |
|---|---|
| Inntektspotensial | 4 |
| Tillit | 8 |
| Regulatorisk risiko | 3 |
| Teknisk kompleksitet | **2** |
| Salgsprosess | **9/10 i enkelhet** — liten norsk aktør, lett å nå |
| Passer formålet | **Ja** |

**[ANBEFALING]** Den enkleste partneravtalen i hele dokumentet. Ta den tidlig.

### 10. Pensjonsleverandører

**Hvorfor de vil ha det:** Samme mekanikk som forsikring, samme problem: ytelser som aldri kreves fordi de etterlatte ikke vet at de finnes. Statens pensjonskasse omtaler selv dødsfallsdekning som «et ukjent gode». Ektefelle- og barnepensjon utløses ikke av seg selv i alle ordninger.

**Modell:** Identisk med forsikringssporet — tenant, deling av utvalgte felt, webhook ved `frigitt`. Ingen ny kode.

| | |
|---|---|
| Inntektspotensial | 6 |
| Tillit | 8 |
| Regulatorisk risiko | 5 — samme utkontrakteringskrav som forsikring |
| Teknisk kompleksitet | **1** — bygget, og identisk med forsikring |
| Salgsprosess | Lang. Færre og tregere beslutningstakere enn i forsikring |
| Passer formålet | **Ja** |

**[TOLKNING]** Dette er ikke et eget spor, det er samme spor med en annen kundeliste. Ta det som utvidelse **etter** første forsikringsavtale, ikke som parallelt salgsløp — kapasiteten finnes ikke.

### 11. Eiendomsmeglere — **frarådes som partner**

**Hvorfor det ser fristende ut:** De møter dødsbo og samlivsbrudd, og de har et akutt dokumentbehov (boligens historie, jf. konsept nr. 19).

**Hvorfor jeg fraråder:** Megleren har en salgsinteresse i boligen. Blir vi kanal inn til et dødsbosalg, er vi part i den transaksjonen — og det er nøyaktig samme feil som strømprovisjonen, med større beløp.

| | |
|---|---|
| Inntektspotensial | 5 |
| Tillit | **3** |
| Regulatorisk risiko | 5 — eiendomsmeglingsloven har egne regler om vederlag og uavhengighet |
| Teknisk kompleksitet | 3 |
| Passer formålet | **Nei** |

**[ANBEFALING]** Ikke som partner. Men «boligens historie» som *funksjon* er god uansett — bygg den for eieren, ikke for megleren.

---

## Inntektsmodeller vurdert

| Modell | Inntekt | Tillit | UX | Reg. risiko | Kompleks. | Salg | Passer? |
|---|---|---|---|---|---|---|---|
| Gratis grunnversjon | — | 9 | 9 | 1 | 2 | — | **Ja, som inngang** |
| Privat abonnement | 5 | 8 | 7 | 2 | **0 (finnes)** | 5 | Ja |
| Familieabonnement | 7 | 8 | 8 | 2 | 4 | 5 | **Ja** |
| Premium (juridisk + gjennomgang) | 6 | 7 | 7 | 5 | 5 | 5 | Ja |
| Engangsbetaling | 3 | 7 | 6 | 2 | 3 | 6 | **Nei** — se under |
| Per juridisk dokument | 5 | 5 | 6 | 7 | 5 | 6 | Nei |
| **Årlig gjennomgang** | 6 | **9** | 8 | 2 | 3 | 5 | **Ja** |
| Concierge ved dødsfall | 6 | 7 | **9** | 6 | **9** | 4 | Valider |
| Provisjon strøm | 5 | **1** | 3 | **8** | 4 | 7 | **Nei** |
| Provisjon forsikring | 6 | 3 | 4 | **9** | 6 | 4 | **Nei** |
| Partnerhenvisning (advokat) | 5 | 8 | 7 | 6 | 4 | 8 | Ja, med åpenhet |
| **White-label** *(leveransemodellen)* | **9** | 9 | 8 | 5 | **0 (finnes)** | 2 | **Ja — hovedsporet** |
| Bedriftsavtaler | 6 | 5 | 7 | 5 | 3 | 4 | Ja |
| Bankpartnerskap | 8 | 7 | 8 | 6 | 3 | 2 | Ja |
| **Forsikringspartnerskap** *(kunden i white-label)* | **9** | 9 | 8 | 5 | **0 (finnes)** | 2 | **Ja — hovedsporet** |
| Pensjonsleverandør | 6 | 8 | 8 | 5 | **0 (finnes)** | 3 | Ja, som utvidelse |
| **Medlemsorganisasjon** | 7 | **9** | 8 | **2** | **2** | **7** | **Ja — start her** |
| Arbeidsgiverbetalt | 6 | 5 | 7 | 5 | 3 | 4 | Ja |
| Begravelsesbyrå | 4 | 5 | 6 | 4 | 3 | 7 | Forsiktig |
| Advokatfirma som kanal | 4 | 8 | 7 | 6 | 4 | 7 | Ja, i liten skala |
| Eiendomsmegler som kanal | 5 | **3** | 5 | 5 | 3 | 6 | **Nei** |

### Hvorfor engangsbetaling frarådes

**[TOLKNING]** Et arkiv som ikke vedlikeholdes, er verre enn ingen arkiv — familien stoler på det, og det er feil. Engangsbetaling fjerner enhver økonomisk grunn til å holde det oppdatert, både for brukeren og for oss. Abonnementet er ikke bare en inntektsmodell; det er det som betaler for at innholdet fortsatt stemmer den dagen det trengs.

---

## Modeller som ikke består tillitstesten

| Modell | Hvorfor ikke |
|---|---|
| Provisjon på strøm/mobil/bredbånd | Vi ville tjent penger på å påvirke valg vi har privilegert innsyn i. |
| Provisjon på forsikringssalg | Konsesjonspliktig, og samme interessekonflikt. |
| Målrettet reklame basert på innhold | Bryter hele premisset. Aldri. |
| Salg av aggregerte data | «Anonymisert» holder ikke i en base der noen har oppgitt at de har kreft. |
| Betalt plassering av partnere | Skjult redaksjonell styring. Hvis vi rangerer, må kriteriene være åpne. |
| Gratis mot at partner får se innholdet | Da er brukeren produktet. |

---

## Anbefalt inntektsarkitektur

**[ANBEFALING]** Tre ben, i denne rekkefølgen:

1. **B2B2C-plattform (hovedinntekt).** Forsikring, bank, medlemsorganisasjon betaler per bruker. Sluttbrukeren betaler ingenting. Alt er bygget.
2. **Direkte abonnement (bevis og kontroll).** Beholdes selv om B2B tar over — det holder oss ærlige og gir et produkt som ikke er avhengig av én partner.
3. **Betalte tilleggstjenester (margin).** Juridisk kontroll, årlig gjennomgang, concierge. Alltid frivillig, alltid med åpen pris.

**Rekkefølgen på salget, som er noe annet enn rekkefølgen på inntekten:**
Medlemsorganisasjon (raskest, billigst å teste) → forsikring (størst) → bank (etter referanse).

**Aldri:** provisjon på brukerens egne valg.
