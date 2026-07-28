# ADR-008: Folkeregister-trigger

**Status:** Vedtatt (implementert i migrasjon 014). Aktiveres når
Maskinporten-avtale og hjemmel er på plass.

## Kontekst
I dag må en betrodd kontakt orke å logge inn og melde et dødsfall, midt i
sorgen, og deretter skaffe en dødsattest. Det er en reell terskel, og den
rammer nettopp de arkivene som trengs mest.

For et livsforsikringsselskap er automatisk, autoritativ dødsfallsdeteksjon
selve grunnen til å eie dette: utbetalingen til begunstigede kan starte uten
at noen må huske å be om den.

## Beslutning

### 1. En offisiell kilde erstatter IKKE fire øyne
ADR-002 antydet at Folkeregisteret kunne redusere kontrollen til én person.
**Det gjør vi ikke.** Registre tar feil — feil fødselsnummer, forvekslede
identiteter, tastefeil hos en saksbehandler et helt annet sted — og folk har
blitt erklært døde i norske registre mens de levde.

Saken opprettes i `under_verifisering`. To saksbehandlere må fortsatt
godkjenne, karenstiden på 48 timer gjenstår, og eierens nødbrems virker som
før. Det maskinen sparer oss for, er å VENTE på at noen orker å melde. Den
sparer oss ikke for å se etter.

Det som faktisk forsvinner, er attest-steget: registeroppføringen *er*
dokumentet.

### 2. Vi lagrer aldri fødselsnummeret
Kun en HMAC-hash med en pepper som bor i miljøet, ikke i databasen. Et
innkommende dødsfall hashes på samme måte og matches mot kolonnen.

**Svakheten, sagt rett ut:** fødselsnummer har et lite tallrom (~10⁷ gyldige
per fødselsdato), så en angriper med BÅDE en databasedump OG pepperen kan
regne seg tilbake. Pepperen ligger derfor utenfor databasen. En dump alene er
ikke nok. Dette hører hjemme i DPIA-en, ikke i en kodekommentar.

Uten pepper svarer hashefunksjonen `null` — en feilkonfigurert server skal
ikke falle tilbake på en forutsigbar SHA-256 som alle kan regne ut.

Serveren ser nummeret i det sekundet kunden sender det inn. Det er
uunngåelig: pepperen kan ikke ligge i nettleseren, for da kunne hvem som helst
regne ut hasher og prøve seg mot en dump. Det hashes i samme funksjon, logges
aldri, returneres aldri.

### 3. Ingen HTTP-vei kan sette kilden
`hendelser_folkeregister`-policyen krever `gjeldende_rolle() = 'system'`.
Ingest-modulen i serverprosessen er den eneste veien inn. En betrodd kontakt
som prøver å utgi seg for å være registeret, avvises av RLS — testet.

### 4. Idempotent, med spor
Samme dødsfall kommer igjen ved hver polling. En ny sak opprettes bare hvis
hvelvet ikke alt har en åpen. Terminaltilstander teller ikke som åpne: en
avvist sak skal kunne meldes på nytt hvis registeret fortsatt sier det samme.

`folkeregister_hendelser` sporer hva ingest har sett og hva det ble til
(`sak_opprettet`, `ukjent_person`, `alt_apen_sak`), slik at drift kan svare på
«kom meldingen fram?» uten å lete i frigivelser. Ingen fødselsnummer der heller.

### 5. Én kildefunksjon, ikke et rammeverk
ADR-002 avviste plugin-arkitektur, og det står. `hentDodsfall()` kan byttes
med ett argument, slik testene gjør. Hele nedstrømsløpet er dermed testet den
dagen Maskinporten-avtalen kommer — det er bare kildefunksjonen som er ny.

## Konsekvenser
- Uten `FOLKEREGISTER_URL` og `FNR_PEPPER` gjør ingest ingenting. Ingen
  krasj, ingen halvveis tilstand.
- Kunden må aktivt koble på fødselsnummeret sitt. Gjør hen ikke det, virker
  produktet nøyaktig som før.
- Varsling til eier og alle kontakter skjer i SAMME transaksjon som saken
  opprettes. En sak ingen ble varslet om, ville fjernet den ene sjansen den
  levende eieren har til å si fra.

## Gjenstår før aktivering (ikke kode)
- Maskinporten-klient og avtale med Skatteetaten.
- **Hjemmel** for å motta dødsfallsopplysninger. Dette er et juridisk
  spørsmål, ikke et teknisk: et forsikringsselskap har som regel hjemmel for
  egne kunder — spørsmålet er om Livsarkivet har det som databehandler på
  deres vegne. Står i jurist-briefen.
- DPIA må oppdateres med fnr-hash, pepper-håndtering og oppbevaringstid for
  `folkeregister_hendelser`.

## Bevis
`tests/folkeregister.test.js` — sju tester. Den viktigste sjekker ikke at det
virker, men at det ikke virker for godt: saken står i `under_verifisering`,
uten godkjenning, uten karenstid, med begge varsler ute.
