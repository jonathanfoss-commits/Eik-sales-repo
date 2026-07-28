# Eik & Friends bookingsystem — researchbasert forslag

**Status:** Forslag til godkjenning. Ingenting er bygget ennå — venter på OK fra Jonathan.
**Mål:** Komplett bookingsystem for Eik & Friends' restauranter, klart til testing fra mandag 3. august 2026.
**Grunnlag:** 8 parallelle dyp-research-rapporter (juli 2026) i [`booking/research/`](research/) — Eik & Friends selv, OpenTable/Resy, SevenRooms/Tock, de europeiske aktørene, Norden/Norge, funksjonskatalog, teknisk bygge-analyse og driftspraksis.

---

## 1. De viktigste funnene fra researchen

### Om Eik & Friends (research: [eik-friends.md](research/eik-friends.md))
- Gruppen (Eik Servering AS / Friends Hospitality Group) driver ca. **60 serveringssteder**, fra Michelin-restauranten Stallen via Smalhans (Bib Gourmand) til Heim-kjeden og en rekke barer. Proforma-omsetning 2023: ~1 mrd. NOK.
- **Dagens booking er fragmentert:** minst 6 kjernerestauranter (Katla, Smalhans, Sentralen/Hitchhiker, Feniqia, Rugantino, The Golden Chimp) er bekreftet på **DinnerBooking**. **Stallen bruker Superb**, Sawan og Brasserie Ouest indikeres på **ResDiary/Dish Cult**, Delicatessen og Heim booker via egne sider (leverandør ukjent).
- Lojalitetsprogrammet **Friends&Benefits** gir poeng per booking — og unntakene i vilkårene (Stallen, Sawan, Brasserie Ouest, Delicatessen) er nøyaktig stedene som *ikke* står på fellesplattformen. Fragmenteringen koster altså allerede i dag: gjestedata og lojalitet henger ikke sammen på tvers.

### Markedet (research: [opentable-resy](research/opentable-resy.md), [sevenrooms-tock](research/sevenrooms-tock.md), [europa](research/europa.md), [norden](research/norden.md))
- Markedet konsoliderer voldsomt: DoorDash kjøpte SevenRooms (2025), Amex eier Resy+Tock og kjøper TheFork (2026), Zenchef+CoverManager fusjonerte, **Quandoo legges ned i 2026**. Reservasjonen er blitt inngangsdør til gjestedata — det er dataene som er verdien.
- To prismodeller: marketplace med per-gjest-gebyr (OpenTable $1–1,50/cover) mot **flat pris uten provisjon** (SevenRooms, Zenchef, resOS, Superb). Trenden i Europa er flat pris + «eie egne gjestedata» — nøyaktig posisjonen et egenbygd system gir.
- **SevenRooms er gullstandarden for grupper**: én gjesteprofil på tvers av alle steder, beriket med POS-forbruk, auto-tags og marketing-automasjon. Det er dette Eik & Friends mangler i dag.
- **Norsk gap:** Ingen av de store systemene har dokumentert **Vipps**-betaling for depositum/no-show-sikring — med 4,6+ mill. norske Vipps-brukere er dette den tydeligste differensieringsmuligheten. Norske Superb-kunder rapporterer no-show-fall fra 16 % til 0,8 % med kortsikring.

### Hva som virker i drift (research: [funksjoner](research/funksjoner.md), [drift](research/drift.md))
- No-show-tiltakstrapp med dokumentert effekt: SMS-påminnelse med én-klikks avbestilling (27–50 % reduksjon) → kortsikring (~3 % no-show) → depositum (~1,7 %) → full forhåndsbetaling (0,9 %). 10–15 % av forventet regning er nok depositum til å endre atferd.
- Vertens kjerneskjerm: fargekodet bordkart + tidslinje + venteliste + gjestenotater. Pacing settes som **covers per 15 minutter**. Statusflyt seated → main → dessert → paid bør på sikt drives av POS.
- Regelmotor beste praksis: skift per sesong, turn time per selskapsstørrelse (1,75–2 t à la carte, 3–4 t for 8+), maks 6–8 gjester online, 10–15 % kapasitetsbuffer, 15 min grace + auto-release.
- Widget-UX: maks 3 steg (dato → antall → tid → kontakt), innebygd på egen side, sticky mobil-CTA, vis alternative tider når fullt, minimalt med obligatoriske felt.

### Ærlig vurdering av å bygge selv (research: [teknisk.md](research/teknisk.md))
- For **én** restaurant er egenbygging økonomisk uforsvarlig (kommersielle systemer koster 0–1 000 kr/mnd). Men **for en gruppe på 60 steder er regnestykket motsatt**: lisenskost × 60 steder + gjestedata spredt på 3–4 eksterne plattformer + ingen Vipps + lojalitetsprogram som ikke henger sammen. Egenbygging gir ifølge researchen mening nettopp «som flerrestaurant-plattform» — som er akkurat det Eik & Friends er.
- Realistisk arbeidsmengde: bookingmotoren (slots, pacing, bordallokering) er 1–2 ukers arbeid og velbeskrevet. Kompleksiteten ligger i betalingsflyt, samtidighet, Reserve with Google-sertifisering og support. MVP 4–8 uker, driftsbrukbart 3–5 måneder.
- **Konsekvens for planen:** Testklart system til mandag er realistisk for kjernen (booking + vertsvisning + varsling, uten betaling). Depositum/Vipps, CRM på tvers og POS-integrasjon er fase 2/3 — og et eventuelt gruppebredt bytte bort fra DinnerBooking er en beslutning som bør tas *etter* piloten.

---

## 2. Anbefalt konsept

**«Friends Booking»** (arbeidstittel): gruppens egen bookingplattform, bygget rundt tre flater:

1. **Gjestewidget** — mobil-først, 3 steg, norsk/engelsk, kan bygges inn på hvert steds nettside og på eikandfriends.no. Ingen app-tvang, ingen konto-tvang.
2. **Vertsskjerm** («Boka») — iPad/mobil-vennlig servicevisning: dagsliste, tidslinje, bordkart, walk-in, venteliste, statusflyt, gjestenotater.
3. **Kommandosenter** — for driftssjef/gruppen: bookingregler per sted, rapporter på tvers, gjestedatabase (fase 2), Friends&Benefits-kobling (fase 2).

Strategisk posisjon researchen peker på: **flat egen plattform uten per-gjest-gebyr, med Vipps-basert no-show-sikring som ingen konkurrent har, og én gjesteprofil på tvers av 60 steder koblet til Friends&Benefits.**

---

## 3. Funksjonsforslag

### Fase 1 — MVP, testklar mandag 3. august (pilot: 1–2 restauranter)
| # | Funksjon | Merknad |
|---|---|---|
| 1 | Gjestewidget: dato → antall → tid → kontakt → bekreftelse | Maks 3 steg, sticky mobil-CTA |
| 2 | Alternative tider når ønsket slot er fullt | Beste praksis mot frafall |
| 3 | Skift/åpningstider per sted, med stengte datoer | Regelmotorens grunnmur |
| 4 | Pacing: maks covers per 15-min-vindu | Kjøkkenets vern |
| 5 | Turn time per selskapsstørrelse | 2–5 pers ≠ 8 pers |
| 6 | Automatisk bordallokering (grådig best-fit) + bordkombinasjoner | Enkelt bordkart per sted |
| 7 | Maks selskapsstørrelse online (6–8) → «send forespørsel»-skjema for store grupper | Går til e-post/vertsskjerm |
| 8 | E-postbekreftelse + SMS-bekreftelse | Norsk avsender |
| 9 | SMS-påminnelse dagen før med én-klikks avbestillingslenke | Størst dokumentert no-show-effekt |
| 10 | Vertsskjerm: dagsliste + tidslinje + bordkart med status | Ledig/booket/ankommet/ferdig |
| 11 | Walk-in-registrering og manuell booking fra vertsskjermen | Telefonbookinger legges inn her |
| 12 | Endre/avbestille for gjest (lenke i bekreftelsen) | Selvbetjening |
| 13 | Gjestenotater per booking (anledning, kommentar) | Fritekst — ikke strukturert allergifelt (GDPR art. 9) |
| 14 | Grace period 15 min + markér no-show | Manuelt i MVP |
| 15 | Enkel dagsrapport: bookinger, covers, no-shows | Per sted |

### Fase 2 — etter pilotuke(r)
- **Vipps-depositum og kortsikring (Stripe SetupIntent)** for helger, høytrykksdatoer og 6+ — differensiatoren ingen konkurrent har. Vipps-reservasjon kan stå i 180 dager (mot Stripes ~7) og passer depositum langt frem.
- Venteliste med automatisk backfill ved avbestilling («notify list»).
- Gjesteprofiler på tvers av stedene: besøkshistorikk, preferanser, tags, VIP — SevenRooms-modellen.
- **Friends&Benefits-integrasjon**: poeng automatisk ved fullført besøk (også for stedene som i dag står utenfor).
- Events/faste menyer med forhåndsbetaling (Tock-modellen) — julebord, vinkvelder, tasting menus.
- Kryss-salg: fullbooket hos Katla → foreslå ledig søsterrestaurant.
- Auto-release av bord + automatisk no-show-håndtering etter regler.
- Rapporter på tvers av gruppen: belegg, no-show-rate, kanalfordeling, gjentaksrate.
- Roller/tilganger: vert ser kveldens liste, daglig leder sitt sted, gruppen ser alt.

### Fase 3 — senere
- POS-integrasjon (statusflyt seated → main → dessert → paid drives automatisk; forbruk beriker gjesteprofilen). Krever avklaring av gruppens POS-landskap.
- **Reserve with Google** — krever partner-sertifisering; en plattform med 60 steder er faktisk stor nok til å søke. Inntil da: «Business Link» på Google-profilene.
- Instagram/Meta «Reserver»-knapp (via channel manager).
- Gavekort koblet mot booking (i dag Gifty), marketing-automasjon («vi savner deg»-e-post), AI-telefonsvar for bookinger, overbooking-modell basert på målt no-show.

---

## 4. Teknisk skisse (kort)

- **Frontend:** selvforsynt PWA-tilnærming som i Lærling-appen — men booking krever delt sanntidstilstand, så **dette produktet trenger en server-database** (to verter og hundrevis av gjester må se samme tilgjengelighet). Dette flagges eksplisitt jf. lokal-først-regelen i CLAUDE.md og krever Jonathans godkjenning.
- **Backend:** enkel Node-API + database (f.eks. Netlify Functions + hosted Postgres, eller en liten VPS). Samtidighet håndteres med transaksjoner per slot.
- **SMS:** Sveve (norsk, ~39–41 øre/SMS, servere i Norge) anbefales over Twilio/LINK for pilot.
- **Betaling (fase 2):** Stripe for kortsikring, Vipps ePayment for depositum. Begge krever avtaler/nøkler fra dere.
- **GDPR:** dokumentert lagringstid, sletterutiner, dataminimering, databehandleravtaler. Allergier som strukturert felt unngås i MVP (helseopplysninger, art. 9).
- **Testing:** Playwright mot iPhone-viewport, null JS-feil — samme QA-krav som Lærling.

## 5. Plan til mandag (forutsatt OK)

| Dag | Leveranse |
|---|---|
| Ons–tor | Bookingmotor + gjestewidget for pilotstedene, e-postbekreftelse |
| Fre | Vertsskjerm (dagsliste, tidslinje, bordkart), SMS-oppsett |
| Lør | Påminnelser, endre/avbestill-flyt, dagsrapport |
| Søn | Playwright-testing, testdata, feilretting, «kom i gang»-side for verter |
| **Man** | **Testing starter** med pilotrestaurantene |

Forutsetninger for å rekke det: svar på spørsmålene under (særlig pilotsted, åpningstider/bordkart og SMS/domene-tilganger) innen onsdag.

---

## 6. Spørsmål til Jonathan (svar gjerne kort, nummerert)

**Strategi og forankring**
1. Er dette forankret hos gruppen (Erlend/driftsledelsen), eller er det foreløpig ditt initiativ som skal bevises med en pilot?
2. Hva er viktigst av: (a) kutte lisenskostnader, (b) eie gjestedataene, (c) Vipps/no-show-sikring, (d) Friends&Benefits på tvers? Rangér gjerne.
3. Skal systemet på sikt erstatte DinnerBooking/Superb/ResDiary for hele gruppen, eller leve side om side?
4. Finnes det tall på dagens bookingvolum og no-show-rate per sted? Hvem kan gi meg dem?
5. Hva koster dagens systemer gruppen totalt per måned (forhandlingsgrunnlag og businesscase)?

**Pilot og omfang**
6. Hvilke 1–2 restauranter skal være pilot fra mandag? (Mitt forslag: ett mellomstort sted med enkel bordflate, f.eks. Smalhans eller én Heim-avdeling — ikke Stallen/fine dining først.)
7. Hvem tester mandag — ekte verter på ekte bookinger, eller internt med testdata først?
8. Skal piloten kjøre parallelt med dagens system (dobbeltføring), eller ta ekte bookinger alene?
9. Hvem er min kontaktperson på pilotstedet (vertens «Ole Fabian»)?

**Bookingregler og drift**
10. Kan jeg få åpningstider/skift, antall bord med størrelser, og gjerne plantegning for pilotstedene?
11. Hvilke turn times bruker dere i dag (2 pers / 4 pers / større selskap)?
12. Hva er maks selskapsstørrelse for online-booking før det skal bli forespørsel (6? 8?)?
13. Hvilken grace period praktiserer dere før bordet gis bort (15 min?)?
14. Trenger piloten venteliste/walk-in-kø fra dag én, eller holder booking + walk-in-registrering?

**Gjesteflyt**
15. Hvor skal widgeten bo: booking.eikandfriends.no, hvert steds nettside, eller begge? Hvem styrer DNS og nettsidene?
16. Språk: norsk + engelsk fra start?
17. Skal gjesten kunne ønske område (vindu/bar/uteservering), eller holder «antall + tid» i MVP?
18. Hvilke felt skal være obligatoriske? (Min anbefaling: navn + mobil, alt annet valgfritt.)

**Betaling og no-show**
19. Skal depositum/kortsikring med i piloten, eller fase 2 (min anbefaling: fase 2)?
20. Har gruppen Stripe-konto og/eller Vipps-avtale (MSN) jeg kan få testnøkler til?
21. Hvilke avbestillingsregler ønsker dere (f.eks. gratis inntil 24 t før)?

**Varsling og data**
22. SMS-avsendernavn («EikFriends»? Restaurantnavnet?) — og OK å opprette konto hos Sveve (norsk leverandør, ~40 øre/SMS)? Hvem tar kostnaden?
23. Hvilken e-postavsender skal bekreftelser gå fra (booking@eikandfriends.no?) — og hvem kan sette opp SPF/DKIM?
24. Skal gjesteprofiler deles på tvers av restaurantene fra start (krever felles behandlingsansvar/GDPR-avklaring), eller holdes per sted i piloten?
25. Hvor lenge skal gjestedata lagres etter siste besøk (forslag: 24 mnd, dokumentert i personvernerklæring)?

**Teknisk og tilganger**
26. Booking krever server-database (delt sanntidstilstand) — godkjenner du det, og har du preferanse på hosting (Netlify + hosted Postgres, egen VPS, annet)?
27. Skal dette ligge i dette repoet (`booking/`) eller eget repo? (Mitt forslag: eget repo `eik-friends-booking` — si fra, så ber jeg om tilgang via add_repo.)
28. Hvilket POS-system bruker gruppen (Trivec, Favrit, Munu, annet)? Kun til fase 3-planlegging.
29. Budsjettramme for piloten (SMS, database-hosting, domene — anslag < 1 000 kr/mnd)?
30. Tre av MCP-tilkoblingene i denne økten er ikke autorisert ennå — vil du autorisere dem i claude.ai-innstillingene, i tilfelle de er relevante (jeg ser ikke hvilke tjenester det er før de er godkjent)?

---

*Neste steg: Jonathan svarer på spørsmålene og gir OK → bygging starter umiddelbart etter planen i del 5.*
