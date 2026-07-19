# Lansering neste uke — dag for dag

Definisjonen av «lansert» fredag: firmaet kan fakturere, nettsiden og appen er live på egen
adresse, pilot #1 er i drift, minst 20 personer vet at tjenesten finnes, og minst ett tilbud
er sendt. Alt materiell finnes allerede i dette repoet — planen under er bare montering.

## I helgen (forberedelser, ~1 time)

- [ ] Les ansettelsesavtalen din (bierverv/konkurranse/IP) og forbered Eik-praten.
- [ ] Sjekk domenenavn (domeneshop.no): `laerling.no`, alternativt `laerling.ai`,
      `ansettlaerling.no`. Ikke kjøp ennå — bare ha 2–3 kandidater klare.
- [ ] Opprett gratis Netlify-konto (med GitHub-innloggingen din).

## Mandag — Fundament (2–3 timer)

1. **Eik-praten** (morgen). Få muntlig OK + send en kort e-post etterpå som bekrefter
   («som avtalt: jeg starter egen virksomhet rettet mot SMB utenfor Eiks marked…»). Skriftlig spor.
2. **Eierskap:** Ole Fabian er medeier — ENK er derfor uaktuelt (kan bare ha én eier).
   Gjør i stedet: opprett GitHub-organisasjonen og signer samarbeidsavtalen
   (se [samarbeid/eierskap.md](samarbeid/eierskap.md)). AS stiftes ved første betalende kunde.
3. **Kjøp domenet** og publiser:
   - `laerling-app.zip` → Netlify Drop → omdøp site til `laerling-app` → koble `app.dittdomene.no`
   - `laerling-nettside.zip` → Netlify Drop → koble `dittdomene.no`
4. **Fiken-konto** (regnskap + faktura, ~200 kr/mnd) settes opp når selskapet er registrert.
5. **Opprett firma-e-post** (Domeneshop/Google Workspace) og bytt CTA-adressen i
   `pitch/landing.html` (én konstant øverst i skriptet) → last opp nettsiden på nytt.

**Mandag kveld er du et firma med live nettside og app.**

## Tirsdag — Pilot #1 i drift

1. **Send Ole Fabian** (morgen): `[app-URL]/rapport.html` («se hva jeg kan ta over for deg»)
   + `[app-URL]` («legg den på hjemskjermen») + forslag om 20 minutter i morgen/i dag.
2. **Oppsettsmøtet** (20 min, fysisk eller video): Claude Pro på hans mobil → Project →
   lim inn `grunninstruks.md` → kjør én ekte befaring-til-tilbud sammen. Send ham `prompter.md`.
3. **Avtal evalueringsdato** (dag 14) med kalenderinvitasjon med en gang.
4. Kveld: notér alt fra møtet i pilot-loggen — hvert spørsmål han stilte er innsikt.

## Onsdag — Salgsmaskinen (3–4 timer)

1. **Generisk mulighetsrapport-mal:** kopier `app/rapport.html`, bytt OP Bygg-detaljene
   med [KLAMMER] — nå kan du lage en personlig rapport til enhver bedrift på under en time.
2. **Tilbudsmal for oppstartspakken:** én side — hva de får (undersøkelse, rapport, 5 verktøy,
   opplæring, 14 dagers oppfølging), pris 14 500 kr intro (ord. 19 500), oppstart innen én uke.
3. **Listen:** 20 navn fra nettverket ditt som eier/driver SMB (bygg først). For hver: bedrift,
   relasjon, én setning om hva Lærling kan ta over for akkurat dem.
4. **Meldingsmal** (SMS/Messenger — ikke e-post, SMB-Norge svarer ikke på e-post fra ukjente):
   > «Hei [navn]! Jeg har startet et firma som gir småbedrifter en slags AI-medarbeider —
   > den skriver tilbud, purringer og rapporter for deg. Har laget en gratis rapport som viser
   > hva den kunne tatt over hos [bedrift]. Vil du se den? Tar 15 min på telefon.»

## Torsdag — Lanseringsdagen

1. **09:00 — LinkedIn-post:** personlig historie, ikke reklame: «Jeg har sett [håndverkere/
   småbedrifter] miste kveldene sine til papirarbeid. Derfor har jeg bygget Lærling…» +
   skjermbilde av appen + lenke. Be 3–4 venner like/kommentere første timen.
2. **09:30–11:00 — Send de 20 meldingene.** Personlig, én og én, ikke masseutsendelse.
3. **Ettermiddag — Ring de 2 regnskapsførerne** du kjenner best: partnertilbud
   (20 % av første års inntekt for henvisninger). De er kanal, ikke kunde.
4. **Svar alle samme dag.** Målet i dag er ikke salg — det er 5 bookede «mulighetsprater».

## Fredag — Første tilbud ut

1. **Gjennomfør mulighetspratene** (15–20 min telefon/video per stykk): spør hva de bruker
   mest tid på, fortell hva Lærling tar over, tilby gratis mulighetsrapport innen 72 timer.
2. **Lag og send 1–3 personlige mulighetsrapporter** (bruk malen fra onsdag — dette er
   «concierge»-versjonen: du er Lærling bak kulissene).
3. **Send første tilbud** på oppstartspakken til den varmeste.
4. **Sjekk inn med Ole Fabian:** «Hvordan gikk uka? Hva brukte du?» — juster det som skurrer.
5. Kveld: skriv ukens tall — meldinger sendt, svar, prater, rapporter, tilbud. Det er
   dashbordet ditt for uke 2.

## Hva du bevisst IKKE gjør denne uken

- **Ikke stift AS ennå** — samarbeidsavtalen holder til første betalende kunde. **Ikke logo/profil** — nettsiden er identiteten.
- **Ikke bygge programvare** — Claude Projects + deg ER produktet i pilotfasen.
- **Ikke App Store** — PWA-en på hjemskjermen holder til produktet er bevist.
- **Ikke betale for annonser** — nettverk og henvisninger er kanalen de første 90 dagene.

## Suksesskriterier fredag kveld

| Mål | Minimum | Bra |
|---|---|---|
| Firma + fakturaklart | ✅ | ✅ |
| Nettside + app på eget domene | ✅ | ✅ |
| Pilot #1 aktiv | Oppsett gjort | Han har brukt 2+ verktøy |
| Folk nådd | 20 | 30+ og LinkedIn-posten lever |
| Mulighetsprater | 3 | 5+ |
| Tilbud sendt | 1 | 3 |

Faller noe utenfor uken (domene-DNS bruker et døgn, en prat glir til mandag) — helt greit.
Det eneste som ikke kan skli, er Eik-praten (alt hviler på den) og Ole Fabian-oppsettet
(caset ditt begynner å tikke fra tirsdag).
