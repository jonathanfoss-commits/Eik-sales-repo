# Demo-manus — investormøte

**Varighet:** 9 minutter demo. Sett av 4 til spørsmål underveis.
**Enhet:** telefon eller nettleser på 390 px bredde. Ikke full skjerm — produktet er
bygget for én tommel, og det skal synes.

---

## Før du går inn i rommet

```bash
service postgresql start                    # eller docker compose up -d
cd livsarkivet

# FERSK BASE. Ikke hopp over dette.
psql -h localhost -U livsarkiv_eier -d postgres \
  -c 'DROP DATABASE IF EXISTS livsarkiv WITH (FORCE)' -c 'CREATE DATABASE livsarkiv'

npm run migrate
KARENSTID_SEKUNDER=240 REGISTRERING_AAPEN=1 npm start &
node server/verktoy/demo-data.js

# Generalprøve: går gjennom hele manuset og fotograferer hvert steg
node tests/generalprove.js docs/skjermbilder
```

Generalprøven feiler høyt hvis noe i manuset ikke lar seg gjennomføre — den
sjekker blant annet at nødbremsen faktisk er over skjermkanten, at fire-øyne-
sperren stopper samme saksbehandler, og at eksportfila dekrypterer med serveren
avslått. Kjør den kvelden før.

**Hvorfor fersk base:** `demo-data.js` fjerner bare kontoer på `@demo.livsarkivet.no`.
Har testsuiten kjørt mot samme base, blir saksbehandlerkøen full av testfiksturer — saker
fra «Eva E2E» og «Odd Herd», og merkevaren i toppfeltet kan vise et test-selskap i stedet
for Livsarkivet. Det så vi i generalprøven, og det er ikke noe du vil oppdage i rommet.
Kjører du mot en fersk base, trenger du heller ikke `--tving`.

**Karenstiden settes til 240 sekunder med vilje.** Da rekker nedtellingen å nå null mens
du snakker, og du får vist frigivelsen skje i stedet for å forklare at den ville skjedd.
Med standardverdien på 48 timer må du be dem forestille seg det.

Skriv ned innloggingene demo-data skriver ut. Engangskodene for saksbehandlerne roterer
hvert 30. sekund — ha `node -e` klar, eller legg TOTP-hemmelighetene i en autentiseringsapp
**før** møtet.

**Sjekk disse tre tingene, ellers stopper demoen:**
1. `curl localhost:3400/api/helse` → `{"ok":true}`
2. Logg inn som Kari og se at Status viser en løpende nedtelling
3. Ha eksportfilen fra Kari allerede lastet ned på maskinen (steg 6 blir vanskelig hvis
   nedlastingen henger). **Karis sikkerhetsfrase er `demofrase123`** — den låser opp
   både «Koder og bankboks» i appen og det krypterte i eksportfila.

**Fallback hvis noe ryker:** skjermbildene i `docs/skjermbilder/`. Si det rett ut —
«serveren min ligger nede, her er skjermbildene» er langt bedre enn å fikle i tre minutter.

---

## Manus

### 0 · Rammen (30 sekunder, før du rører skjermen)

> «Når noen dør, mister familien sjelden informasjonen. De mister *tilgangen*. Passordene,
> nøklene, hvor testamentet ligger, hvilken av de tre kontoene som betaler regningene.
> Det finnes i hodet til én person, og den personen er borte.
>
> Livsarkivet er ikke et sted å lagre det. Det er en mekanisme for å åpne det —
> på riktig dag, for riktige personer, og aldri en dag for tidlig.»

Ikke vis noe ennå. La setningen stå.

### 1 · Eieren har bygget arkivet (60 sekunder)

Logg inn som **Kari**. Gå til **Hvelv**.

> «Her er Kari. Åtte kategorier — juridisk, forsikring, digitale kontoer, tilgangsinfo,
> praktisk, og en siste hilsen. Det tar en kveld å fylle ut.»

Gå til **Hvem får hva**.

> «Og dette er forskjellen fra en passordboks. Kari bestemmer per element hvem som får se
> hva, og ved hvilken hendelse. Sønnen får det praktiske. Søsteren får brevet. Ingen får alt.»

**Ikke** bruk tid på å redigere matrisen på mobil. Vis den, forklar den, gå videre.

### 2 · Noen melder dødsfallet (60 sekunder)

Logg inn som **Bjørn** (betrodd kontakt). Gå til **Meld**.

> «Bjørn er betrodd kontakt hos Åse. Han melder dødsfallet og laster opp dødsattesten.
> Legg merke til hva som *ikke* skjer nå: ingenting åpnes. En påstand er ikke et bevis.»

### 3 · Fire øyne (90 sekunder — **dette er vollgraven, ta deg tid**)

Logg inn som **Astrid** (saksbehandler, engangskode). Gå til **Kø**. Godkjenn Odds sak.

Prøv å godkjenne **én gang til som Astrid**.

> «Og her stopper systemet meg. To *ulike* mennesker må godkjenne. Det er ikke en
> innstilling — det er en beskrankning i databasen. Selv om noen skrev om koden vår i natt,
> ville basen nektet.»

Logg inn som **Arne**. Godkjenn samme sak.

> «Nå starter karenstiden.»

### 4 · Nødbremsen (90 sekunder — **høydepunktet**)

Logg inn som **Kari**. Gå til **Status**.

La nedtellingen stå synlig et øyeblikk før du sier noe.

> «Kari lever. Noen har meldt henne død — det skjer, ved forveksling og ved vondskap.
> Hun har 48 timer, og én knapp.»

Pek på **tidslinjen** under knappen.

> «Og hun ser nøyaktig hvor langt det er kommet. Et varsel om at noen har meldt deg død,
> uten å vise hva som skjer videre, er bare skremmende.»

**Trykk «Stopp frigivelsen — jeg lever».**

> «Terminaltilstand. Saken kan ikke gjenopplives — den som mener hun er død, må melde på
> nytt og gå gjennom hele løpet igjen.»

### 5 · Den etterlatte (75 sekunder)

Logg inn som **Mona**. Gå til **Til deg**.

> «Dette er den eneste skjermen i hele produktet et menneske i sorg faktisk møter. Derfor
> ser den ikke ut som resten. Ingen dashbord, ingen tall, ingen oppgaveliste på førti punkter.»

Bla ned til **«Dette trenger du ikke lete etter»**.

> «Og her sier vi hva staten allerede gjør gratis. Digitalt dødsbo ga arvinger automatisk
> oversikt over bank, eiendom, kjøretøy, gjeld, forsikring og pensjon fra juni i fjor.
> Vi konkurrerer ikke med det. Staten vet *hva* som finnes. Den vet ikke hvor nøkkelen ligger.»

Dette avsnittet selger mer enn noe annet i demoen. Det viser at vi har gjort leksa.

### 6 · Hva om dere forsvinner (75 sekunder — **avslutt her**)

Som **Kari**: last ned eksporten. **Slå av serveren.** Åpne filen.

> «Cake var USAs mest kjente dødsplanleggingstjeneste. Kjøpt av et begravelseskonsern i
> september 2024. I juni 2025 sluttet innlogging å virke og dataene ble slettet.
>
> Dette er hele arkivet hennes. Serveren er av. Jeg er ikke på nett.»

Skriv sikkerhetsfrasen. Innholdet kommer fram.

> «Vi kan ikke lese dette — det ble kryptert i nettleseren hennes. Men hun kan, uten oss,
> for alltid. Det er ikke en klausul i vilkårene. Det er en fil.»

---

## Hva du ikke skal vise

| Ikke vis | Hvorfor |
|---|---|
| **Admin → Logg** | Tørr tabell. Nevn at den er append-only, ikke vis den. |
| **Registrering** | Krever `REGISTRERING_AAPEN`, og et tomt arkiv selger ingenting. |
| **Redigering av matrisen på mobil** | Mange små trykkflater. Vis den, ikke bruk den. |
| **Abonnement / Stripe** | Testmodus. En investor som ser «test» tenker «ikke ekte». |
| **AI-agentene** | De er hjelpere, ikke på kritisk sti. Å nevne AI her flytter samtalen dit du ikke vil. |

---

## Spørsmål du får, og de ærlige svarene

**«Hvor mange brukere har dere?»**
Null. Produktet er bygget og testet, ingen har brukt det ennå. Første kanal er en
medlemsorganisasjon — det er raskeste vei til de første tusen, og den krever ingen ny kode.

**«Gjør ikke staten dette allerede?»**
Halvparten, og bedre enn vi kunne. Digitalt dødsbo dekker alt som står i et register.
Ingenting av det som bare finnes i hodet til den som døde.

**«Hva hindrer en bank i å kopiere dette på et kvartal?»**
Ikke funksjonene — rekkefølgen. Se `docs/vollgraven.md`. Seks ledd som hver kan feile
trygt, og der ombytting ødeleggger uten å se ødelagt ut.

**«Hva er den største risikoen?»**
At vi ikke får den første partneren. Alt annet kan løses med penger og tid.
`docs/risiko-apent.md` har alle ti, med hva vi gjør og når.

**«Er dette GDPR-klart?»**
DPIA-utkast finnes, zero-knowledge er implementert, revisjonsloggen kan ikke endres av oss.
Åtte punkter i `docs/leverandorpakke.md` er fortsatt åpne — blant annet behandlingsansvarlig
juridisk enhet og pen-test. De må lukkes før første ekte kunde, og de står i risikoarket.

**Ikke pynt på noe av dette.** Investoren har hørt hundre pitcher som runder oppover. Den
som sier «null brukere» uoppfordret blir husket.
