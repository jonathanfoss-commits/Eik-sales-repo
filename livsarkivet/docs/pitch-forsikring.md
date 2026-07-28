# Livsarkivet for livsforsikring — én side

**Utkast fra utviklingsteamet.** Tallene under er markert som ANTAKELSE der de
er det. Ikke send noe herfra videre uten å ha erstattet dem med tall du kan stå
for — en pitch som faller på ett feil tall, faller på alle.

---

## Problemet selskapet har i dag

Et livsforsikringsselskap får som regel vite om et dødsfall når noen melder
det. Det betyr:

- **Etterlatte som ikke vet at polisen finnes, melder aldri.** Pengene blir
  liggende. Det er ikke selskapets feil, men det er selskapets omdømme.
- **Meldingen kommer sent**, i uker der familien har mest annet å tenke på.
- **Saken starter uten opplysninger**: hvem er begunstiget, hvor er papirene,
  hvem skal kontaktes.

## Det Livsarkivet gjør

Kunden legger inn det de nærmeste trenger, og deler **fire felt** med
selskapet: polisenummer, kundenummer, begunstiget og kontaktperson. Ved et
verifisert dødsfall får selskapets systemer en webhook, og kan hente akkurat
de feltene.

**Kjeden er:** hvelv → mottakermatrise → trigger → verifisering (to
saksbehandlere) → 48 timers karenstid → frigivelse → etterlattevisning.

## Fire grunner et selskap sier ja

**1. Utbetalingen starter av seg selv.**
Et verifisert dødsfall utløser saken. Ingen trenger å huske å be om den.

**2. Dere slipper å være behandlingsansvarlig for kundens mest sensitive
opplysninger.**
Dette er trolig det sterkeste argumentet, og det overrasker de fleste: dere ser
kun de fire feltene kunden aktivt har delt. Testamentet, helsedirektivet, de
digitale kontoene og den siste hilsenen er utilgjengelig for dere — også etter
frigivelse, også for våre egne. Det er ikke en begrensning vi beklager; det er
risikoen dere ikke trenger å bære.

**3. Det er et produkt kundene faktisk vil ha, i en bransje der lite skiller
aktørene.**
Livsforsikring er nesten identisk hos alle. Dette er ikke.

**4. Det er ikke en kritisk IKT-funksjon.**
Er Livsarkivet nede, behandler dere dødsfall som før — meldingen kommer bare
ikke automatisk. Det holder tjenesten unna «kritisk eller viktig funksjon» i
DORA-forstand, med tilsynsbyrden det gir begge parter. Vurderingen er deres,
men arkitekturen er laget for å gjøre den enkel.

## Det tekniske de kommer til å spørre om

| Spørsmål | Svar |
|---|---|
| Hvor ligger dataene? | EU/EØS (Frankfurt). Ingen tredjelandsoverføring. |
| Kan andre selskaper se våre kunder? | Nei. Radnivå-isolasjon i databasen, ikke i applikasjonskoden. Testet ved å forsøke å bryte den. |
| Kan deres ansatte lese innholdet? | Nei. Det finnes ingen tilgangsregel som gir det — heller ikke til oss. |
| Hvordan logger kundene våre inn? | Med deres egen identitetsleverandør (OIDC/BankID), under deres merkevare. |
| Hva om en melding er feil? | 48 timers karenstid der eieren kan stoppe alt. Selskapet varsles **først etter** frigivelse, nettopp derfor. |
| Revisjon? | Uforanderlig logg, eksporterbar per selskap med tidsrom. |

Full leverandørvurdering: `docs/leverandorpakke.md`. Den lister også **det som
mangler** — ærlig, fordi de finner det uansett.

## Vinkelen per selskap

Bruk den som treffer mottakerens egen agenda, ikke vår.

- **Storebrand** — bærekraft og livshendelser er allerede i språket deres.
  Vinkel: *omsorg utover utbetalingen*.
- **Fremtind** (SpareBank 1 / DNB) — distribusjon gjennom bank. Vinkel:
  *ett produkt som gjør både bank- og forsikringskunden tryggere*.
- **Gjensidige** — bredde og enkelhet. Vinkel: *færre henvendelser, raskere
  oppgjør*.
- **KLP** — medlemseid, offentlig sektor. Vinkel: *medlemsgode som koster lite
  og betyr mye*.

## Hva vi ber om i første møte

Ikke en kontrakt. **En pilot:** 100 kunder, seks måneder, deres merkevare,
deres innlogging. Utkast: `docs/pilotavtale-utkast.md`.

## Det vi ikke har ennå

Sagt her, ikke oppdaget senere:

- Ekstern penetrasjonstest er ikke gjennomført.
- Behandlingsansvarlig juridisk enhet er ikke formelt avklart.
- Ingen kunder i produksjon. **Dere ville vært den første.**

Det siste er en innvending, ikke en unnskyldning — og for riktig selskap er
det et argument: de får forme produktet.

---

## ANTAKELSER som må erstattes før bruk

- Antall livsforsikringspoliser i Norge, og hvor stor andel som ikke utbetales
  fordi ingen melder fra. **Kilde må finnes** — dette tallet bærer hele
  problemstillingen, og et anslag holder ikke i et styremøte.
- Pris per kunde per år.
- Hva selskapet sparer per sak i saksbehandling.
