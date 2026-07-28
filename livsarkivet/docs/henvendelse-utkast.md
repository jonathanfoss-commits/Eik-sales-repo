# Henvendelse til forsikringsselskap — ferdig utkast

**Skal sendes av Jonathan, under eget navn.** Jeg har skrevet dem, ikke sendt
dem. Bytt `[…]` og les gjennom — en e-post som ikke høres ut som deg, merkes
med én gang.

Alt annet er klart: produktet, sikkerhetsskjemaet, pilotavtalen og et
demomiljø med deres logo (`prospekt-demo.js`). Dette er det siste steget, og
det er ditt.

---

## Hvem den skal til

Ikke til «post@». Roller som faktisk kan si ja til en pilot, i prioritert
rekkefølge:

1. **Leder for personforsikring / livsforsikring** — eier problemet og budsjettet.
2. **Leder for innovasjon eller nye forretningsområder** — eier «vi må ha noe
   som skiller oss».
3. **Kundedirektør / leder kundeopplevelse** — eier hvordan det oppleves å
   være etterlatt.

Finn navnet på LinkedIn. Ett navn er bedre enn tre; en e-post til flere i
samme selskap ser ut som masseutsending, og det er den den blir behandlet som.

---

## Kort variant (anbefalt — 120 ord)

De fleste beslutningstakere leser første avsnitt og bestemmer seg der.

> **Emne:** Et spørsmål om deres dødsfallsdekninger
>
> Hei `[navn]`,
>
> Jeg lurer på én ting: hvor mange av deres dødsfallsdekninger ble aldri krevd
> i fjor?
>
> Statens pensjonskasse kaller sitt eget gruppeliv «et ukjent gode» — etterlatte
> som ikke vet at polisen finnes, melder aldri fra. Det er ikke selskapets feil,
> men det er selskapets omdømme.
>
> Jeg har bygget Livsarkivet: kunden legger inn det de nærmeste trenger, og
> deler fire felt med dere — polisenummer, kundenummer, begunstiget,
> kontaktperson. Ved et verifisert dødsfall får systemene deres beskjed
> automatisk. Resten av arkivet ser dere aldri, og det er poenget: dere slipper
> ansvaret for kundens mest sensitive opplysninger.
>
> Har du 30 minutter? Jeg tar med et demomiljø med deres logo.
>
> `[Jonathan Foss, telefon]`

---

## Lengre variant (hvis dere har snakket sammen før)

> **Emne:** Livsarkivet — pilot med 100 kunder, seks måneder
>
> Hei `[navn]`,
>
> `[Én setning om hvor dere møttes / hvorfor du skriver akkurat nå.]`
>
> Et livsforsikringsselskap får som regel vite om et dødsfall når noen melder
> det. Etterlatte som ikke vet at polisen finnes, melder aldri. Meldingen
> kommer sent. Og saken starter uten opplysninger om hvem som er begunstiget.
>
> Livsarkivet løser det siste leddet: kunden legger inn det de nærmeste
> trenger, under deres merkevare og med deres innlogging. Ved et verifisert
> dødsfall — kontrollert av to saksbehandlere, med 48 timers frist der eieren
> kan stoppe alt — får systemene deres beskjed og henter de fire feltene kunden
> selv har delt.
>
> Tre ting dere kommer til å spørre om, besvart med én gang:
>
> - **Innsyn:** dere ser kun de fire feltene. Testamentet, helsedirektivet og
>   den siste hilsenen er utilgjengelig for dere — også etter frigivelse, også
>   for mine egne. Dere slipper å være behandlingsansvarlig for det.
> - **Drift:** er tjenesten nede, behandler dere dødsfall som før. Den er ikke
>   kritisk for forsikringsleveransen, og skal ikke bli det.
> - **Sikkerhet:** ferdig utfylt skjema følger vedlagt, med de åpne postene
>   oppgitt. Penetrasjonstest er ikke gjennomført ennå, og ingen har tjenesten
>   i produksjon. Dere ville vært den første.
>
> Jeg ber ikke om en kontrakt. Jeg ber om en pilot: 100 kunder, seks måneder,
> ingen betaling. Utkast til avtale ligger klart.
>
> Passer 30 minutter `[uke]`?
>
> `[Jonathan Foss, telefon]`

---

## Vinkelen per selskap

Bytt ut andre avsnitt i den korte varianten:

- **Storebrand** — «Dere snakker allerede om livshendelser. Dette er den ene
  hendelsen ingen har løst den praktiske siden av.»
- **Fremtind** — «Kunden er både bank- og forsikringskunde. Etterlatte som
  leter etter kontoer, leter etter polisen samtidig.»
- **Gjensidige** — «Færre henvendelser inn, raskere oppgjør ut. Det starter
  med at dere får vite det først.»
- **KLP** — «Et medlemsgode som koster lite og betyr mye den dagen det gjelder.»

---

## Hva du gjør hvis de svarer

1. Kjør `node server/verktoy/prospekt-demo.js <slug> "<Selskap>" <vertsnavn>`
   før møtet. La dem se sitt eget navn og sin egen farge.
2. Vis **kundeflaten** først, ikke arkitekturen. Det er den som selger.
3. Vis så fire-øyne-køen: to saksbehandlere, to ulike mennesker. Det er den
   som skaper tillit.
4. Send `docs/sikkerhetsskjema.md` og `docs/leverandorpakke.md` etterpå — ikke
   før. De skal ha sett produktet før de leser om det.

## Hva du gjør hvis de ikke svarer

Én oppfølging etter ti virkedager, tre setninger, med noe nytt i:

> Hei igjen `[navn]` — jeg vet ikke om dette traff riktig person hos dere.
> Spørsmålet mitt står: hvor mange dødsfallsdekninger ble aldri krevd i fjor?
> Er det en annen jeg burde snakke med, setter jeg pris på et navn.

Så lar du det ligge. To henvendelser er interesse; tre er mas.

---

## Det du IKKE skal skrive

- Ikke lov en penetrasjonstest som ikke er bestilt.
- Ikke oppgi et tall på uutbetalt forsikring. Det finnes ikke offentlig, og
  blir det etterprøvd, mister du hele møtet på ett tall.
- Ikke skjul at ingen har tjenesten i produksjon. De finner det ut, og da har
  de også funnet ut at du holdt tilbake.
