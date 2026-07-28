# Vollgraven — hvorfor dette ikke kopieres på en måned

Hver del hver for seg er kjent teknologi. Kryptering i nettleseren er en helg.
En ventetid er en kolonne. To godkjennere er en `if`.

**Det vanskelige er rekkefølgen, og at hvert ledd må kunne feile trygt.**

Systemet må gjøre to motsatte ting samtidig: *aldri* frigi for tidlig, og
*alltid* frigi til slutt. Feil i den ene retningen utleverer en levende persons
mest private opplysninger. Feil i den andre gjør produktet verdiløst nøyaktig
den dagen det gjelder. Det finnes ingen versjon av dette som er «litt riktig».

## De seks leddene, i den rekkefølgen de må stå

| Ledd | Hvis akkurat dette svikter |
|---|---|
| **1. Verifisert dødsfall** — attest eller offisiell kilde, aldri bare at eieren sluttet å svare | Arkivet åpnes fordi noen var på ferie |
| **2. Fire øyne** — to *ulike* saksbehandlere, håndhevet i databasen | Én innsider, eller ett kapret passord, åpner alt |
| **3. Karenstid, 48 t** — eieren varsles og har nødbremsen selv | Ingen vei tilbake hvis attesten var feil |
| **4. Mottakermatrise** — hver mottaker får kun det eieren pekte ut til hen | Datteren ser brevet som var til broren |
| **5. Zero-knowledge** — det sensitive krypteres i nettleseren; serveren *avviser* klartekst | Databasetyveri er også innholdstyveri |
| **6. Append-only revisjonslogg** — ingen har rett til å endre eller slette | Ingen kan i ettertid bevise at frigivelsen var korrekt |

## Rekkefølgen er selve poenget

Bytt om på to av dem, og systemet er ødelagt uten å se ødelagt ut.

- **Karenstid før fire øyne:** klokka tikker mens ingen har lest saken.
- **Matrise etter frigivelse:** alt er allerede ute. Eieren må ha bestemt den
  mens hen levde, ellers bestemmer noen andre.
- **Kryptering lagt til «senere»:** umulig. Nøklene må finnes hos mottakeren
  *før* frigivelsen. Legges det på i etterkant, har noen sett klarteksten på
  veien — og da har du ikke zero-knowledge, du har en påstand om det.
- **Redigerbar logg:** verdiløs som bevis. Den beviser bare at noen kunne endre den.

## Hvert ledd må feile trygt — det som tar tid og ikke synes

- **Alt skjer i én transaksjon:** tilstandsendring, revisjonsrad, varsler og
  webhook skrives sammen. **Det kan ikke finnes en frigivelse ingen ble varslet om.**
- **Utsending er en egen, gjentakbar jobb.** Er e-posten nede, blir varselet
  liggende til den er oppe. Forsinket, aldri tapt.
- **En karenstid som løper ut mens serveren står**, plukkes opp ved neste
  gjennomgang. Samtidige forsøk kan ikke frigi samme sak to ganger.
- **Tilgangskontrollen ligger under applikasjonen.** En feil i vår egen kode gir
  **null rader, ikke feil rader.** Det er forskjellen på en bug og et innbrudd.
- **Ingen tilgangsregel lar en saksbehandler lese innholdet** — ikke hos
  partneren, ikke hos oss. Regelen er ikke slått av; den er aldri skrevet.
- **AI-en er rådgiver, aldri beslutningstaker.** Slår modellen seg av, går saken
  til menneskelig vurdering som før.

## Det som ikke kan kopieres i det hele tatt

En konkurrent kan bygge alle seks leddene i riktig rekkefølge. Det tar mer enn
en måned, men det lar seg gjøre.

Det som ikke lar seg bygge, er svaret på spørsmålet kunden faktisk stiller:
**«finnes dere den dagen dette trengs?»**

Cake — den mest kjente tjenesten i sitt slag i USA — ble kjøpt av et
begravelseskonsern i september 2024 og slått av 15. juni 2025. Brukerne mistet
alt. Det gjør spørsmålet legitimt for hele kategorien, og svaret til en del av
produktet, ikke av markedsføringen.

Vårt svar er bygget, ikke lovet: eieren kan når som helst hente ut alt sitt,
**inkludert krypteringsnøklene**, og lese det uten oss. Arkivet skal overleve
selskapet. Den som vil kopiere det, må ta samme beslutning om hvem de kan
selges til — før pengene ligger på bordet.
