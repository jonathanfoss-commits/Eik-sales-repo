# Åpen risikoliste

**Dato:** 28. juli 2026 · **Skrevet av:** utviklingsteamet, til Jonathan og til
enhver som vurderer å gå inn i dette.

Dette dokumentet finnes fordi vi heller vil bli avvist på en riktig innvending
enn tatt inn på et feil inntrykk. Alt her ville en grundig motpart funnet
uansett. At det står her først, er hele poenget.

Hver post har: **hva som er galt**, **hvorfor det betyr noe**, **hva vi gjør**,
og **når**.

---

## 1. Vi har null brukere og null inntekt

**Hva:** Ingen bruker Livsarkivet. Ingen har betalt for det. Ingen pilot er
signert. De samtalene som finnes er samtaler, ikke avtaler, og skal ikke
omtales som noe annet.

**Hvorfor det betyr noe:** Hele produktprioriteringen vår — 27 tjenester,
41 konsepter, en topp 15-liste — bygger på markedsresearch og på hva vi tror
norske brukere trenger. Ikke på hva noen faktisk har gjort. Den svakeste
antakelsen i alt vi har skrevet er at vi vet hva de vil ha, og vi har skrevet
det slik selv i `docs/PRIORITERT-ROADMAP.md`.

**Hva vi gjør:** Kanalavtale med én medlemsorganisasjon foran forsikringssporet,
fordi den gir ekte brukere raskest og krever null ny kode. Målet er de første
100 som bruker produktet på ekte, ikke de første 1 000 som registrerer seg.

**Når:** Første henvendelser sendes så snart behandlingsansvarlig enhet er
avklart (post 5) — vi kan ikke ta imot brukere før den er på plass.

---

## 2. Ingen juridiske punkter er lest i primærkilde

**Hva:** Lovdata svarer 403 på automatisk henting. Det samme gjorde digdir.no,
kartverket.no, finansnorge.no og epilog.no. Alt vi skriver om arveloven § 42
(formkrav til testament), vergemålsloven kap. 10 (fremtidsfullmakt),
forsikringsformidling og Digitalt dødsbo bygger på **søkeindeksens gjengivelse
av kilden, ikke på lest primærkilde.**

**Hvorfor det betyr noe:** Vi selger et produkt som skal virke i en juridisk
situasjon. En juridisk påstand som viser seg feil i en kundeavtale eller i
markedsføring er ikke en skrivefeil, det er et tilsynsproblem. Og det svekker
alt annet vi har sagt.

**Hva vi gjør:** `docs/jurist-brief.md` er ferdig skrevet med tolv spørsmål.
Bestillingen dekker fire tiltak samtidig (fremtidsfullmakt, advokatkontroll,
beredskapskort, fullmektigmodus), så det er én bestilling, ikke fire. Ingen
juridisk påstand går i produkt, avtale eller markedsføring før den er
kvalitetssikret.

**Når:** Brief sendes jurist før første partnermøte. Dette er en kostnad som
må tas før inntekt, ikke etter.

---

## 3. De åtte åpne punktene i leverandørpakken

Fra `docs/leverandorpakke.md`. Ingen partner kan signere før disse er lukket.

| # | Mangler | Blokkerer | Hva vi gjør | Når |
|---|---|---|---|---|
| 1 | Behandlingsansvarlig juridisk enhet ikke avklart | Vilkår, databehandleravtaler, Stripe | Se post 5 — dette er det første som må skje | Før alt annet |
| 2 | Ekstern penetrasjonstest ikke gjennomført | Sikkerhetsgodkjenning | Se post 4 | Før første partnermøte med compliance |
| 3 | To navngitte saksbehandlere med responstid | **All frigivelse** | Se post 6 | Inn i pilotavtalen |
| 4 | RTO/RPO ikke formelt fastsatt | DORA-vurdering hos partner | Forslag ligger klart (RPO 24 t, RTO 4 t) — må vedtas og inn i DPIA | Ved DPIA-ferdigstilling |
| 5 | Databehandleravtaler med underleverandører ikke inngått (hosting, e-post, Stripe, valgfritt Anthropic) | Signatur | Standardavtaler hentes og signeres. Krever post 1 først | Etter post 1 |
| 6 | Exit-plan ved selskapsopphør | Vilkårene — **vi lover dette allerede** | Se post 7 | Før vilkårene publiseres |
| 7 | Integrasjonstest mot partnerens faktiske IdP | Innlogging i produksjon | Protokollen er implementert og angrepstestet mot falsk IdP med ekte RSA-nøkler. Gjenstår: test mot en ekte | Ved oppstart hos første partner |
| 8 | Maskinporten-avtale + hjemmel for Folkeregisteret | Automatisk trigger | Krever jurist (post 2) og en formell søknad | Etter at første partner er på plass |

**Merk:** ingen av disse er kodearbeid. Å bygge tolv nye funksjoner lukker ikke
ett eneste av dem.

---

## 4. Ingen ekstern penetrasjonstest

**Hva:** Vi har gjort en egen sikkerhetsgjennomgang og herdet på funnene
(filtypebegrensning på attester med sandbox-CSP, obligatorisk tofaktor for
saksbehandlere, lengdegrenser, rate-demping, `X-Robots-Tag: noindex`,
sesjonsrykking ved passordbytte). Testregimet forsøker aktivt å **bryte**
grensene: annet selskaps saker, godkjenning på tvers av tenant, admin mot
hvelvinnhold, forbi et tilbaketrekk, forfalsket hendelseskilde.

**Men vi har testet oss selv.** Ingen uavhengig part har forsøkt å bryte dette.

**Hvorfor det betyr noe:** Et forsikringsselskaps sikkerhetsfunksjon slipper oss
ikke gjennom uten. Og en egen gjennomgang finner systematisk ikke det man selv
ikke tenkte på — det er hele grunnen til at pen-test finnes som disiplin.

**Hva vi gjør:** Bestille ekstern pen-test. Rapporten legges frem for partnere
uredigert, inkludert funn vi ikke har lukket ennå.

**Når:** Før første møte med en compliance-funksjon. Bestilt-status er
Jonathans, og den er ikke bestilt per i dag.

**Kjente svakheter vi allerede vet om, uten å vente på testen:**
- Fødselsnummer-hashen er en HMAC med pepper utenfor databasen. Tallrommet er
  lite; en angriper med **både** databasedump og pepper kan regne seg tilbake.
  En dump alene er ikke nok.
- De fire delte feltene til selskapet ligger i klartekst. De må kunne leses av
  selskapet — det er hele hensikten — og er derfor begrenset til fire korte
  felttyper.
- mTLS mot selskapets endepunkt er ikke implementert.

---

## 5. Behandlingsansvarlig juridisk enhet er ikke avklart

**Hva:** Det er ikke formelt fastslått hvilken juridisk enhet som er
behandlingsansvarlig for opplysningene i Livsarkivet.

**Hvorfor det betyr noe:** Dette blokkerer vilkårene, alle
databehandleravtalene og Stripe-oppsettet. Vi kan ikke lovlig ta imot en eneste
ekte bruker før det er på plass. Det er den enkeltposten som holder flest andre
poster nede.

Det henger også sammen med et spørsmål vi ikke kan svare på alene: **er
partnerselskapet behandlingsansvarlig for sine kunders arkiv, eller er vi det,
med selskapet som distributør?** Vår modell peker mot det siste — kunden er vår
kunde, selskapet ser kun det kunden aktivt deler. Og det er faktisk *selskapets
sterkeste grunn* til å ta tjenesten i bruk: de slipper å være
behandlingsansvarlig for sine kunders mest sensitive opplysninger. Men det er
en juridisk vurdering, ikke vår.

**Hva vi gjør:** Jonathan avklarer selskapsstrukturen. Spørsmålet om
rollefordelingen mot partner ligger i jurist-briefen.

**Når:** Først av alt. Alt annet venter på dette.

---

## 6. Fire-øyne-regelen krever bemanning som ikke finnes ennå

**Hva:** Ingen frigivelse kan skje uten at to *ulike* saksbehandlere hos samme
selskap godkjenner. Dette er håndhevet i databasen og kan ikke omgås — heller
ikke av oss, heller ikke i en hastesituasjon.

**Hvorfor det betyr noe:** **Et dødsfall venter ikke.** Er begge utilgjengelige
— ferie, sykdom, helg — står saken. Det er tilsiktet, og det er riktig, men det
er også en driftsforpliktelse noen må ta på seg med navn og responstid. Det kan
ikke løses teknisk uten å ødelegge selve sikringen.

**Hva vi gjør:** Navngitte personer, forventet responstid, ferie- og
sykdomsdekning og eskaleringsvei skrives inn i pilotavtalen som et eget punkt.
Utkastet ligger i `docs/pilotavtale-utkast.md`.

**Når:** I den første avtalen. Ikke etterpå.

---

## 7. Exit-garantien er lovet, men ikke fullt dokumentert

**Hva:** Vi lover i vilkårene at arkivet overlever oss. Teknisk er halve svaret
bygget: eieren kan når som helst hente alt sitt via `GET /api/eksport`,
inkludert de frasepakkede krypteringsnøklene, slik at innholdet kan dekrypteres
uten oss.

**Det som mangler er den andre halvparten:** en dokumentert plan for hva som
faktisk skjer med data hvis selskapet opphører eller selges. Hvem varsler
brukerne? Hvor lang frist får de? Hvem har ansvaret for at det skjer, hvis vi
ikke finnes?

**Hvorfor det betyr noe:** Dette er selve argumentet vårt mot Cake-scenariet.
Foundation Partners Group kjøpte Cake i september 2024 og avviklet
brukerkontoene 15. juni 2025. En garanti som ikke er dokumentert, er nøyaktig
det Cakes brukere også trodde de hadde.

**Hva vi gjør:** Skrive exit-planen og publisere den sammen med vilkårene. Vi
vurderer også en bindende bestemmelse i aksjonæravtalen om hvilke typer kjøpere
som ikke kan overta tjenesten uten at exit-prosedyren utløses først.

**Når:** Før vilkårene publiseres, som er før første ekte bruker.

---

## 8. Vi er avhengige av at én motpart sier ja

**Hva:** Hovedmodellen (B2B2C) forutsetter at et forsikringsselskap, en bank
eller en medlemsorganisasjon tilbyr Livsarkivet til sine kunder. Vi har ingen
slik avtale. Et forsikringssalg tar erfaringsmessig 6–18 måneder, og vi har ikke
begynt å telle ennå.

**Hvorfor det betyr noe:** Uten partner er det ingen inntektsmodell som virker i
den skalaen som er forutsatt. Og vi har ikke undersøkt om noe norsk
forsikringsselskap allerede har bygget noe lignende internt — det står som et
åpent punkt i researchen vår.

**Hva vi gjør:** Tre grep. **Ett:** medlemsorganisasjon foran forsikring, fordi
beslutningsveien er kortere og den regulatoriske terskelen lavere. **To:**
direkte abonnement beholdes ved siden av, slik at produktet ikke dør med én
partner. **Tre:** sjekke direkte, før pitch, om selskapet allerede har noe
internt — det er langt bedre å vite det før møtet enn i det.

**Når:** Løpende, fra første henvendelse.

---

## 9. Sikkerhetsantakelser vi ikke har testet i felt

**Hva:** Ingenting av dette har møtt en ekte bruker i en ekte krise. Vi har
skjermbilder fra 390×844 og en manuell akseptansetest der etterlattevisningen
er prøvd av en person uten forkunnskap. Vi har ikke sett en faktisk pårørende
bruke dette i uken etter et dødsfall.

**Hvorfor det betyr noe:** Etterlattevisningen er den ene flaten som brukes av
noen som ikke valgte å bruke oss, som ikke har lest noe, og som er i den verste
uken i livet sitt. Alt annet i produktet er noe eieren gjorde en gang, i ro.
Hvis den flaten ikke virker, virker ingenting.

**Hva vi gjør:** Etterlatte-kontrollpanelet er tiltak nummer én i roadmapen,
foran alt annet. Og den manuelle akseptansetesten gjentas med nye personer uten
forkunnskap ved hver større endring, ikke bare én gang.

**Når:** Løpende. Første ekte tilbakemelding kan ikke komme før post 1 er løst.

---

## 10. Navnerisiko

**Hva:** `Livsarkivet.se` finnes i Sverige — et gratis ønskeskjema fra den
svenske begravelsesbransjen. Samme navn, tilgrensende kategori.

**Hvorfor det betyr noe:** Ikke et problem for norsk drift i dag. Et problem
den dagen noen vurderer nordisk ekspansjon eller salg til en nordisk aktør, og
et spørsmål en due diligence vil stille.

**Hva vi gjør:** Varemerkesjekk før nordisk aktivitet av noe slag. Ikke før.

**Når:** Utsatt bevisst. Notert her så det ikke blir en overraskelse.

---

## Det vi mener er verdt å legge merke til

Ni av de ti postene over kan lukkes med penger, tid og en jurist. De er
kjedelige, dyre og løsbare.

**Post 1 kan ikke løses fra skrivebordet.** Den krever at noen faktisk begynner
å bruke dette. Det er den eneste risikoen på listen som blir større av at vi
bygger mer.
