# Pilotavtale — utkast

**UTKAST FRA UTVIKLINGSTEAMET. IKKE JURIDISK KVALITETSSIKRET.**
Skal gjennom jurist før den vises til en motpart. Poenget med dokumentet er å
gjøre det lett å si ja til å **prøve** — ikke å binde noen til å kjøpe.

Åpne felter står som `[…]`.

---

## Hvorfor en pilot og ikke et salg

Livsarkivet har ingen kunder i produksjon. Å be et forsikringsselskap kjøpe
noe ingen har brukt, er å be om en beslutning de ikke kan ta. En pilot flytter
spørsmålet fra «tør vi satse på dette?» til «er dette verdt seks måneder og
100 kunder?» — og det er et spørsmål en avdelingsleder kan svare på selv.

## 1. Parter og omfang

| | |
|---|---|
| Leverandør | `[juridisk enhet, org.nr]` |
| Kunde | `[selskap, org.nr]` |
| Periode | Seks måneder fra `[dato]` |
| Omfang | Inntil **100** av kundens kunder |
| Vederlag | **Ingen** i pilotperioden |

Piloten gir ingen av partene plikt til å inngå videre avtale.

## 2. Det kunden får

- Livsarkivet under **kundens merkevare**, på kundens eget vertsnavn.
- Innlogging gjennom **kundens egen identitetsleverandør** (BankID via deres
  OIDC-tilbyder), slik at sluttbrukeren slipper enda et passord.
- Webhook ved verifisert og frigitt dødsfall, med oppslags-API for de feltene
  sluttbrukeren aktivt har delt.
- To saksbehandlerkontoer hos kunden, med obligatorisk tofaktor.
- Revisjonseksport for kundens egne saker.

## 3. Det kunden IKKE får — og hvorfor det er poenget

Kunden får se **fire felt** per sluttbruker: polisenummer, kundenummer,
begunstiget og kontaktperson — og kun de sluttbrukeren aktivt har delt, så
lenge hen ikke har trukket dem tilbake.

Kunden får **ikke** se arkivinnholdet. Ikke testamentet, ikke helsedirektivet,
ikke den siste hilsenen. Heller ikke etter frigivelse.

Dette er ikke en begrensning vi beklager. Det er grunnen til at sluttbrukeren
tør legge noe inn, og det er risikoen kunden slipper å bære.

## 4. Bemanning — det som må avklares før oppstart

Fireøyneprinsippet krever **to forskjellige mennesker** hos kunden. Uten to
bemannede saksbehandlere kan ingen frigivelse skje i det hele tatt.

- Saksbehandler 1: `[navn]`
- Saksbehandler 2: `[navn]`
- Forventet responstid: `[timer]` på virkedager
- Ved ferie/sykdom: `[vikar]`
- Eskalering når begge er utilgjengelige: `[hvem]`

**Et dødsfall venter ikke.** Dette punktet er ikke formalia.

## 5. Roller etter personvernforordningen

`[MÅ AVKLARES MED JURIST]` — vår vurdering er at Livsarkivet er
behandlingsansvarlig for sluttbrukerens arkiv, og at kunden er
behandlingsansvarlig kun for de feltene sluttbrukeren deler med dem.

Konsekvensen er verdt å merke seg: **kunden slipper ansvaret for
sluttbrukerens mest sensitive opplysninger.** Konstruksjonen må bekreftes før
signatur.

Databehandleravtale inngås som eget bilag.

## 6. Sikkerhet og revisjon

- Ferdig utfylt sikkerhetsskjema: `docs/sikkerhetsskjema.md`, med **åpne
  poster oppgitt**.
- Leverandørvurdering for finansbransjen: `docs/leverandorpakke.md`.
- Kunden har rett til å gjennomgå dokumentasjon og testbevis, og til å få
  utlevert revisjonslogg for egne saker.
- **Penetrasjonstest er ikke gjennomført.** Skal den være gjennomført før
  piloten starter, må det avtales her: `[ja/nei, frist]`.

## 7. Hendelseshåndtering

- Sikkerhetsbrudd varsles kunden uten ugrunnet opphold, senest innen `[24]`
  timer etter at leverandøren ble kjent med det.
- Kontaktpunkt hos leverandør: `[navn, telefon]`
- Kontaktpunkt hos kunde: `[navn, telefon]`

## 8. Tjenestenivå

Ingen SLA i pilotperioden. Partene er enige om at tjenesten **ikke er kritisk
for kundens forsikringsleveranse**: er Livsarkivet utilgjengelig, behandler
kunden dødsfall som før — meldingen kommer bare ikke automatisk.

Denne felles forståelsen har betydning for kundens egen vurdering etter DORA
og for meldeplikt om utkontraktering, men vurderingen er kundens.

## 9. Slutt på piloten

- Begge parter kan avslutte med `[30]` dagers varsel.
- Ved avslutning: sluttbrukerne beholder arkivene sine hos leverandøren, med
  mindre de selv velger å slette dem. **Arkivene følger ikke kunden ut** — de
  tilhører sluttbrukeren.
- Sluttbrukerne varsles om at merkevaren og innloggingen endres, i god tid.
- Kunden får utlevert revisjonslogg for egne saker.

At sluttbrukeren ikke mister arkivet sitt fordi to selskaper ble uenige, er et
løfte som må stå i avtalen — ikke bare i vilkårene.

## 10. Hva vi vurderer piloten på

Avtales i fellesskap før oppstart. Forslag:

- Andel inviterte sluttbrukere som faktisk legger inn noe.
- Antall dødsfall meldt gjennom tjenesten, og tid fra melding til kunden har
  opplysningene.
- Tilbakemelding fra saksbehandlerne på om køen er til å jobbe i.
- Tilbakemelding fra **minst én etterlatt** som har brukt visningen. Dette er
  det viktigste målet, og det vanskeligste å be om.

---

## Åpne punkter før dette kan sendes

1. Juridisk enhet og organisasjonsnummer for leverandøren
2. Jurists gjennomgang av hele dokumentet, særlig punkt 5
3. Databehandleravtale som bilag
4. Avklaring av om penetrasjonstest må være gjennomført før oppstart
