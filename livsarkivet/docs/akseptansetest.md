# Akseptansetest — nivå 7 (manuell, Jonathan)

Testregimets nivå 1–6 kjører automatisk i CI. Nivå 7 er menneskesjekken:
**gjør produktet det det skal, for folk i den situasjonen de faktisk er i?**
Denne listen skal gjennomføres før hver fase-leveranse. Sett dato og signatur
nederst.

## Raskeste vei: testmiljøet
**https://livsarkivet-test.onrender.com** er oppe med demodata og ett-trykks
innlogging — `/api/demo/inn?som=kari` (eier), `?som=bjorn` (betrodd kontakt),
`?som=mona` (mottaker med frigitt arkiv), `?som=astrid` og `?som=arne`
(de to saksbehandlerne). Da slipper du oppsettet under. To forbehold: karenstiden
der er 48 timer, så punktene som krever at den løper ut må kjøres lokalt med
`KARENSTID_SEKUNDER=120`, og e-postvarsler går ikke ut før avsenderen er satt opp
(de ligger i kø i basen).

## Forberedelser (lokalt — trengs for karenstid og varsler)
```
docker compose up -d
cp .env.example .env        # sett REGISTRERING_AAPEN=1, KARENSTID_SEKUNDER=120
npm install && npm run migrate && npm start
node server/verktoy/ny-admin.js "Saksbehandler 1" admin1@livsarkivet.no
node server/verktoy/ny-admin.js "Saksbehandler 2" admin2@livsarkivet.no
```
Bruk telefon (ikke desktop) for eier-, kontakt- og mottakerflatene. Du trenger
**to** saksbehandlerkontoer, og for etterlattedelen **én person uten
forkunnskap om produktet**.

## A. Eier — bygge arkivet
- [ ] Registrering og innlogging går uten forklaring.
- [ ] Legge inn element i hver kategori — språket er jordnært, ikke teknisk.
- [ ] Sensitivt element: du blir bedt om sikkerhetsfrase, får
      gjenopprettingskoden vist **én gang**, og forstår hva som skjer om du
      mister den.
- [ ] Låse opp et sensitivt element igjen fungerer.
- [ ] Legge inn kontakter, markere betrodde, sende invitasjon.
- [ ] Mottakermatrisen er forståelig på mobilskjerm — du klarer å se hvem som
      får hva uten å tenke.
- [ ] Prøveperioden vises, og du forstår hva som skjer når den løper ut.

## B. Kontakt — bli koblet til
- [ ] Invitasjonskoden virker, og kontakten skjønner hva hen har blitt med på.
- [ ] Kontakten setter sin egen sikkerhetsfrase (kreves for sensitivt innhold).
- [ ] Kontakten ser INGENTING av arkivinnholdet.

## C. Frigivelsesløpet — hovedsaken
- [ ] Å melde dødsfall føles alvorlig nok: bekreftelsesdialogen kommuniserer
      konsekvensen.
- [ ] Eieren og alle kontakter får varsel om meldingen.
- [ ] Attestopplasting fra telefon (foto eller PDF) fungerer.
- [ ] Bekreftelse fra en annen betrodd kontakt fører saken til verifisering.
- [ ] Saksbehandler 1 ser saken med melder-metadata, agentenes råd og attesten
      — men **ingen mulighet til å se hvelvinnhold noe sted**.
- [ ] Saksbehandler 1 kan ikke godkjenne to ganger (fire-øyne-sperren er
      forståelig forklart, ikke bare en feilmelding).
- [ ] Saksbehandler 2 godkjenner → karenstiden starter, alle varsles.
- [ ] Eieren ser nedtellingen og «Stopp frigivelsen»-knappen umiddelbart ved
      innlogging.
- [ ] **Stopp-testen:** trykk stopp → frigivelsen blokkeres, alle varsles,
      mottakerne ser fortsatt ingenting.
- [ ] **Gjennomføringstesten:** nytt løp, la karenstiden løpe ut → frigivelse.
- [ ] Avvisningstesten: saksbehandler avviser med en kald formulering →
      kvalitetsagenten foreslår en varsommere, og du kan overstyre bevisst.

## D. Etterlattemodus — testes av person UTEN forkunnskap
Gi personen kun denne setningen: «Du har fått en e-post om at du har tilgang
til noe her.» Ikke forklar mer. Observer.
- [ ] Personen kommer inn og finner det som er delt uten hjelp.
- [ ] Personen forstår at det praktiske ligger først.
- [ ] Sensitivt innhold: personen skjønner at egen sikkerhetsfrase kreves.
- [ ] Tonen oppleves rolig og verdig — ikke som et dashbord eller et salgsløp.
- [ ] Personen møter **ingen** oppfordring til å kjøpe noe.
- [ ] Noter med personens egne ord hva som var uklart:

      ______________________________________________

## E. Sikkerhet og tillit
- [ ] Logg inn som mottaker som IKKE har fått noe → tom, rolig side, ingen
      lekkasje av at det finnes et arkiv.
- [ ] Gjenopprettingsflyten: bruk koden, sett ny frase, gammelt innhold åpner.
- [ ] Revisjonsloggen (saksbehandler) viser hele løpet — og inneholder ikke ett
      eneste stykke arkivinnhold.
- [ ] Varsel-e-postene inneholder ingen opplysninger fra arkivet.

## F. Drift
- [ ] Stopp databasen midt i en karenstid, start den igjen → karenstiden
      fortsetter der den var, ingenting er tapt.
- [ ] Stopp serveren, la karenstiden løpe ut, start serveren → frigivelsen
      skjer og varslene sendes.
- [ ] `npm test`, `npm run e2e` og `npm run lasttest` grønne lokalt.

## Konklusjon
- Blokkerende funn (må fikses før leveranse):

      ______________________________________________

- Ikke-blokkerende funn (neste leveranse):

      ______________________________________________

**Godkjent av Jonathan:** ______________________  **Dato:** ____________
