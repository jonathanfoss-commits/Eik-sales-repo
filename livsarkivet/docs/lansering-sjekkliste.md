# Lanseringssjekkliste — det som må gjøres utenfor koden

Alt som kunne bygges og testes, er bygget og testet. Denne listen er kun det
som krever en konto, en signatur eller en betaling — altså det ingen kan gjøre
for deg. Rekkefølgen er valgt slik at hvert steg låser opp det neste.

## 1. Testmiljøet ✅ SATT OPP
Kjører på **https://livsarkivet-test.onrender.com** (Frankfurt, autodeploy fra
`main`). Database `livsarkivet-test-db`, samme plan som Lærling. Hemmelighetene
står tomme med vilje: varslene legger seg i kø, betaling svarer 503,
AI-kontrollen hopper over — ingenting krasjer.

- [ ] **Fyll inn resten av demoen** — én kommando i Render → livsarkivet-test →
      **Shell**: `node server/verktoy/demo-data.js`
      Den lager de to saksbehandlerne, en sak i karenstid og et frigitt arkiv,
      og skriver ut alle innloggingene med engangskoder.
- [ ] Åpne URL-en på telefonen og kjør `docs/akseptansetest.md`.

## 2. E-postavsender (1 time)
Uten dette går ingen varsler ut — og varselet er eierens eneste sjanse til å
stoppe en feilaktig frigivelse. Køen i databasen tar vare på alt i mellomtiden.
- [ ] Velg leverandør med EU-region (Resend eller Postmark har begge det).
- [ ] Verifiser avsenderdomenet: **SPF og DKIM** må være grønt, ellers havner
      varslene i søppelpost.
- [ ] Sett `EPOST_API_URL`, `EPOST_API_NOKKEL`, `EPOST_FRA` i Render.
- [ ] Test: meld et dødsfall i testmiljøet og se at varselet kommer frem til
      både eier og kontakter.

## 3. Juss (2–4 jurist-timer)
- [ ] Send `docs/jurist-brief.md`, `docs/vilkar-utkast.md` og
      `docs/dpia-utkast.md` til jurist. Briefen har de tolv spørsmålene
      formulert, så timen går til svar og ikke til utredning.
- [ ] **Avklar behandlingsansvarlig juridisk enhet** — dette blokkerer både
      vilkårene, databehandleravtalene og Stripe.
- [ ] Bekreft eller korriger oppbevaringstidene (forslag ligger i DPIA-en).
- [ ] Bestem: beholde AI-attestkontroll (krever tredjelandsvurdering) eller
      kjøre EØS-modus? EØS-modus = la `ANTHROPIC_API_KEY` stå tom. Ingen
      kodeendring.
- [ ] Publiser vilkår og personvernerklæring.

## 4. Databehandleravtaler (etter at enheten er avklart)
- [ ] Hosting (Render eller den du velger).
- [ ] E-postleverandør.
- [ ] Stripe.
- [ ] Anthropic — **bare hvis** du beholder AI-attestkontrollen.

## 5. Betaling (1 time)
- [ ] Stripe-konto på den juridiske enheten.
- [ ] Opprett produkt og månedspris → kopier pris-ID-en.
- [ ] **Test-mode først:** sett `STRIPE_SECRET`, `STRIPE_PRIS_ID` og
      `STRIPE_WEBHOOK_HEMMELIGHET`, legg til webhook mot
      `https://<din-url>/api/stripe/webhook` for hendelsene
      `checkout.session.completed`, `customer.subscription.updated` og
      `customer.subscription.deleted`.
- [ ] Kjør en test-betaling og se at abonnementet slår om til «aktiv».
- [ ] Bytt til live-nøkler først når vilkårene er publisert.

## 6. Drift (1–2 timer)
- [ ] Slå på **daglig backup** hos databaseleverandøren, og verifiser at den
      lagres et annet sted enn primærbasen. (Selve gjenopprettingen testes
      automatisk i CI ved hver endring.)
- [ ] Fastsett **RTO og RPO** og skriv dem inn i DPIA-en. Forslag: RPO 24
      timer (daglig backup), RTO 4 timer.
- [ ] Skriv ned planen for dataoverlevelse ved selskapsopphør — dette er en
      exit-garanti du lover i vilkårene.
- [ ] Domene og TLS (Render gjør TLS automatisk når domenet er koblet).

## 7. Bemanning — den eneste som ikke kan løses teknisk
- [ ] **Utpek de to saksbehandlerne ved navn.** Fire-øyne-regelen krever to
      forskjellige mennesker for hver frigivelse: uten to bemannede personer
      kan ingen frigivelse skje i det hele tatt.
- [ ] Bestem forventet responstid, og hva som skjer hvis den ene er
      utilgjengelig (ferie, sykdom). Et dødsfall venter ikke.

## 8. Sikkerhet før produksjon
- [ ] Ekstern pen-test. Bestill etter at eksport- og slettefunksjonen er inne
      (den er nå bygget), så testeren ser hele flaten.
- [ ] Gå gjennom funnene og lukk dem før første ekte kunde.

## 9. Første kunde
- [ ] Sett `REGISTRERING_AAPEN=0` i produksjon og inviter de første manuelt,
      slik at du følger dem tett.
- [ ] Kjør akseptansetesten på nytt i produksjonsmiljøet.
- [ ] Ha en plan for hva du gjør ved den første ekte dødsfallsmeldingen —
      inkludert hvem som ringer hvem.
