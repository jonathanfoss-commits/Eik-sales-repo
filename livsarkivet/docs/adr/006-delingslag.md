# ADR-006: Delingslag — kunden deler utvalgte felt med sitt selskap

**Status:** Vedtatt av Jonathan (valgt i /goal-avklaringen).
**Implementert i migrasjon 012.**

## Kontekst
Livsarkivet skal kunne tilbys av et livsforsikringsselskap. Selskapet trenger
noen få opplysninger for å komme i gang med en utbetaling til begunstigede:
polisenummer, kundenummer, hvem som skal motta utbetalingen, og hvem de skal
kontakte. Uten dem er en verifisert dødsfallsmelding bare et varsel, ikke en
sak de kan behandle.

Samtidig er hele produktets verdiløfte at *ingen andre enn dine nærmeste får
se innholdet — heller ikke vi*. Et forsikringsselskap som distribuerer
tjenesten er nettopp den parten kunden lurer på om leser. Løses ikke det i
arkitekturen, forsvinner troverdigheten i det logoen settes på.

Tre alternativer ble lagt fram:
1. Null innsyn — selskapet ser kun hendelser.
2. Kunden deler utvalgte felt aktivt.
3. Fullt innsyn for saksbehandling.

**Jonathan valgte 2.**

## Beslutning

### Kunden deler, felt for felt, og kan trekke tilbake
Fire felttyper, ikke én mer. Hver enkelt legges inn av kunden og kan trekkes
tilbake når som helst. Alt annet i hvelvet er utilgjengelig for selskapet —
også etter dødsfallet, også etter frigivelse.

### Tre grenser, alle i databasen
1. **Bare eieren skriver.** Selskapet kan ikke legge inn en deling på kundens
   vegne, og kan ikke omgjøre et tilbaketrekk. Begge deler er testet.
2. **Selskapet ser kun aktive delinger i egen tenant.** `trukket_tid IS NULL`
   står i RLS-policyen, ikke i en `WHERE` i applikasjonskoden — et tilbaketrekk
   virker i det sekundet det skjer, uansett hvilken kodevei som spør.
3. **Plattformdriften ser dem IKKE.** Derfor `er_selskapets()` og ikke
   `er_admin_for()`. Vi trenger saksmetadata for å drifte frigivelsesløpet; vi
   trenger ikke kundens polisenummer, og da skal vi ikke kunne lese det.

### Klartekst, med vilje og med grenser
Dette er den eneste tabellen med kundeoppgitt innhold som noen utenfor eierens
egen krets kan lese. Den er derfor kort (200 tegn), typebegrenset til fire
felt, og verdien havner **aldri** i revisjonsloggen — loggen bærer felttypen,
slik at man kan bevise HVA som ble delt NÅR, uten å gjenta innholdet.

Å kryptere disse feltene ville vært teater: mottakeren er selskapet, så
selskapet måtte hatt nøkkelen.

### Historikken beholdes
Et tilbaketrekk setter `trukket_tid`, det sletter ikke raden. Kunden skal kunne
få svar på «hva hadde de tilgang til, og når?». Ved kontosletting forsvinner
alt via `ON DELETE CASCADE` på hvelvet, som resten av arkivet.

### Tilbaketrekk er aldri portet bak abonnement
Samme prinsipp som eierens nødbrems i frigivelsesløpet: ingen skal kunne bli
låst fast i en deling fordi et kort gikk ut.

## Konsekvenser
- Selskapet får en nyttelast som er verdt noe (leveranse C sender den ved
  verifisert dødsfall), uten at vi har rørt zero-knowledge for resten.
- Kunden ser hvem hen deler med, ved navn, i samme kort som avkryssingen.
  Uten det er samtykket blindt.
- Delingen er uavhengig av frigivelsesløpet: den er en handling den LEVENDE
  kunden gjør overfor selskapet sitt, ikke noe som utløses av død.
- En kunde som kom inn via livsarkivet.no har ingen å dele med, og ser ikke
  kortet i det hele tatt.

## Bevis
`tests/deling.test.js` — ti tester, hvorav seks forsøker å komme forbi
grensene: nabo-selskapet, plattformdriften, skriving på kundens vegne,
gjenoppliving av et tilbaketrekk, en femte felttype, og verdien i
revisjonsloggen.
