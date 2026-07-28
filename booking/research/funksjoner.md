# Funksjonskatalog: Moderne restaurant-bookingsystemer («state of the art» 2025/2026)

Research-rapport basert på åpne kilder (leverandørsider, bransjeanalyser, sammenligningsguider), juli 2026. Der tall kommer fra leverandørenes egen markedsføring er dette markert. Skillet mellom **bekreftede fakta** (flere uavhengige kilder / offisiell dokumentasjon) og **antakelser/leverandørpåstander** er angitt løpende og oppsummert til slutt.

---

## 0. Markedsbilde — hvem definerer «state of the art»

- **Globale ledere:** OpenTable (marketplace + verktøy), SevenRooms (CRM-tungt, «direct booking»-filosofi, kjøpt av DoorDash for 1,2 mrd. USD i juni 2025), Tock (prepaid/ticketing-modellen), Resy (American Express), TheFork (Tripadvisor, sterk i Europa), Eat App, CoverManager (grupper/kjeder, Sør-Europa).
- **Nordiske/europeiske:** Superb (nordisk, «Guest Experience Management», inngang ca. €79/mnd), resOS (dansk, provisjonfritt, gratisnivå), DinnerBooking (etablert i DK/SE/NO, prising på forespørsel), Zenchef, ResDiary.
- **Viktig strukturendring 2025:** OpenTable avsluttet toveisintegrasjonen med SevenRooms — valget mellom dem er nå i praksis enten/eller ([Eat App](https://restaurant.eatapp.co/blog/opentable-pricing), [restaurantbookingsystem.com](https://restaurantbookingsystem.com/best/restaurant-booking-systems-2026/)).
- To forretningsmodeller konkurrerer: **marketplace med per-cover-avgift/provisjon** (OpenTable, TheFork) og **flat abonnementspris uten provisjon** (SevenRooms, resOS, Superb, Tock på abonnementsdelen). Trenden 2025/2026 går mot det siste — restauranter vil eie gjestedataene og slippe å betale for egne stamgjester.

---

## 1. Bordadministrasjon (table management)

**Hvorfor:** Bordene er restaurantens lagerbeholdning. Hvert tomt sete i et tidsvindu er tapt, ikke-lagringsbar omsetning (samme logikk som flyseter). Bordadministrasjon er derfor kjernen som alt annet bygger på.

### 1.1 Digital plantegning (floor plan)
- Interaktivt kart over lokalet med sanntidsstatus per bord (ledig, sittet, hovedrett, dessert, betalt, trenger rydding). Verter «drar» selskaper til bord.
- Beste praksis: flere plantegninger per lokale (sommer/uteservering, privatrom, ombygging), og statusoppdatering automatisk fra POS (når regningen skrives ut/betales, oppdateres bordstatus).
- Kilder: [SevenRooms Table Management](https://sevenrooms.com/platform/table-management/), [OpenTable Table Management](https://www.opentable.com/restaurant-solutions/products/table-management/).

### 1.2 Bordkombinasjoner
- Systemet definerer hvilke bord som kan slås sammen (f.eks. bord 4+5 = 6 personer) og tilbyr kombinasjonen automatisk i tilgjengelighetssøket. Uten dette må store selskaper ringe — med dette selges «usynlig» kapasitet online.
- **State of the art:** SevenRooms markedsfører en AI-setealgoritme som vurderer «10 000+ kombinasjoner per sekund» for å maksimere utnyttelse ([SevenRooms](https://sevenrooms.com/platform/table-management/) — leverandørpåstand, men funksjonen auto-optimalisert seating er reell og standard i toppsjiktet).

### 1.3 Turn times (bordtider)
- Estimert sittetid settes **per selskapsstørrelse** (2 pers ≈ 90 min, 6 pers ≈ 150 min) og ev. per skift/meny. Dette styrer når bordet «frigjøres» i tilgjengelighetsmotoren og muliggjør to–tre «seatings» per kveld.
- OpenTable har «turn controls»: definer minimum antall ganger et bord skal snus per størrelse, og systemet tilbyr bare tidspunkter som når målet ([OpenTable](https://www.opentable.com/restaurant-solutions/products/table-management/)).
- Beste praksis: mål faktiske turn times fra data (booking→betalt i POS) og juster per ukedag; kommuniser tidsbegrensning til gjesten ved booking («bordet er deres i 2 timer»).

### 1.4 Pacing / flow controls
- **Hvorfor:** Kjøkkenet knekker hvis 40 gjester settes kl. 19:00 samtidig. Pacing begrenser hvor mange covers (eller selskaper) som kan bookes per 15-minutters intervall.
- OpenTable lar dette settes per tidsperiode, per skift eller per 15-minutters intervall, med egne skiftinnstillinger per periode ([OpenTable flow controls](https://support.opentable.com/s/article/flow-controls?language=en_US)).
- Beste praksis: pacing per intervall + maks selskapstørrelse online (større selskaper til manuell håndtering/forespørsel), og egne «shifts» (lunsj/middag) med ulike regler.

---

## 2. Ventelister og walk-ins

**Hvorfor:** Walk-ins er tradisjonelt bufferen mot no-shows, og en god venteliste konverterer «fullt akkurat nå» til gjester senere samme kveld i stedet for tapt besøk.

Standardfunksjoner i 2025/2026:
- **Digital venteliste** side om side med reservasjoner i samme gulvvisning (walk-in registreres på 5 sek med navn + mobilnummer).
- **Estimert ventetid** beregnet algoritmisk — f.eks. BentoBox beregner ut fra antall selskaper sittet, bordkapasitet, turnover og kølengde ([BentoBox](https://www.getbento.com/products/waitlist/)); noen (Chowbus) henter sanntids bordstatus fra POS for mer presise estimater ([Chowbus](https://www.chowbus.com/blog/restaurant-waitlist-management-system)).
- **Toveis SMS:** gjesten får «bordet er klart»-melding og kan svare for å bekrefte, avbestille eller stille spørsmål ([TablesReady](https://www.tablesready.com/), [Waitwhile](https://waitwhile.com/restaurant-waitlist/)).
- **Selvbetjent påmelding:** QR-kode ved døren eller «virtuell kø» fra nettsiden før man drar hjemmefra.
- **Prediktiv venteliste:** SevenRooms lar gjesten følge sin plass i køen live, som avlaster verten ([SevenRooms](https://sevenrooms.com/platform/reservations-waitlist/)).
- Beste praksis: ventelistegjester blir automatisk gjesteprofiler (CRM-fangst også av walk-ins), og no-show fra ventelisten logges.

---

## 3. No-show-forebygging — funksjonene og tallene

**Hvorfor:** Bransjens no-show-rate ligger typisk på **5–20 %** avhengig av segment; OpenTable har rapportert ~5–7 % på en vanlig kveld, med >20 % på høytidskvelder uten depositum ([Tobeout](https://blog.tobeout.com/restaurant-no-show-rate-what-its-really-costing-you/), [Eat App](https://restaurant.eatapp.co/blog/restaurant-no-shows)). ResDiary-data (2024) viste at gjennomsnittsvenue i UK tapte over £3 600/år og at raten steg fra 5 % til 8 % på ett år; Zonal anslår £17,6 mrd. i årlig tap for UK-hospitality samlet (bekreftede bransjetall, UK).

Verktøykassen, rangert etter effekt (tallene er dels leverandørdata, dels operatørcase — se kildeforbehold):

| Tiltak | Typisk effekt | Kilde |
|---|---|---|
| **SMS-påminnelser** (24 t + 2 t før, med bekreft/avbestill-lenke) | 27–38 % reduksjon i no-shows; 30–50 % i enkelte studier. SMS har ~98 % åpningsrate mot ~20 % for e-post. 36 % av no-show-gjester sier de ville møtt med påminnelse. Dobbel påminnelse (24 t + 2 t) ga 31 % bedre effekt enn én melding. | [Hostie](https://hostie.ai/resources/automated-sms-confirmation-sequences-cut-restaurant-no-shows-27-percent-hostie-ai) (leverandørcase), [Eat App](https://restaurant.eatapp.co/blog/restaurant-no-shows), [Katalyst](https://www.katalystos.com/blog/how-to-reduce-restaurant-no-shows) |
| **Kortregistrering** (credit card hold — kortet lagres, gebyr belastes kun ved no-show/sen avbestilling) | OpenTable: opptil 16 % lavere no-show og 15 % færre sene avbestillinger; bransjekilder: 50–70 % reduksjon, snittrate faller mot ~3 % | [OpenTable](https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/), [Ordering.Tools](https://www.ordering.tools/en/blog/restaurant-reservation-deposits-no-shows) |
| **Depositum** (delbetaling ved booking, trekkes fra regningen) | Eliminerer 80–90 % av no-shows; operatørdata viser rater ned mot ~1,7 %; case: 15 %→1 % og 10–12 %→2 % | [Ordering.Tools](https://www.ordering.tools/en/blog/restaurant-reservation-deposits-no-shows), [Tock](https://www.exploretock.com/join/resources/deposit-for-restaurant-reservation-booking/) |
| **Full forhåndsbetaling** (ticketing) | No-show under 1 %; OpenTable-tall: prepaid-gjester er 44 % mindre tilbøyelige til no-show, 67 % mindre til sen avbestilling — og bruker ~30 % mer når tillegg (vinpakke o.l.) tilbys | [OpenTable](https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/) |

**Avbestillingsregler — beste praksis** ([Toast](https://pos.toasttab.com/blog/on-the-line/restaurant-reservation-cancellation-fees), [Reslify](https://reslify.com/en/blog/restaurant-cancellation-fee-policy/)):
- 24–48 timers frist for vanlig à la carte; 48–72 timer for premium/set menu; en uke+ for private dining og billetterte events.
- Regelen (frist, beløp, når kortet belastes) skal vises **før** gjesten bekrefter — transparens er både jus (forbrukervern) og konvertering.
- Friksjonsfri avbestilling (én klikk-lenke i SMS/e-post) er et no-show-tiltak i seg selv: en tidlig avbestilling kan reselges, en no-show kan ikke.
- Differensier: krev kort/depositum kun for store selskaper (6+), høytidskvelder og premium-menyer — ikke en tirsdag kl. 17.
- Kombinasjonen påminnelser + tydelig depositumpolicy + venteliste + enkel avbestilling kutter no-shows 50–70 % innen få måneder ([Katalyst](https://www.katalystos.com/blog/how-to-reduce-restaurant-no-shows)).

---

## 4. Gjesteprofiler / CRM

**Hvorfor:** Gjenkjennelse er gjestfrihetens kjerne («velkommen tilbake, bord ved vinduet som sist?») — og gjestedata restauranten selv eier er den strategiske grunnen til at mange forlater marketplace-modellen.

Standard i toppsjiktet ([SevenRooms CRM](https://sevenrooms.com/platform/crm/), [SevenRooms-blogg](https://sevenrooms.com/blog/the-top-restaurant-crms/)):
- **Én profil per gjest** på tvers av kanaler (online, telefon, walk-in, venteliste), med besøkshistorikk, no-show-/avbestillingshistorikk og totalforbruk.
- **Allergier og preferanser** som strukturerte felt som automatisk følger reservasjonen ut til kjøkken/servitør (allergi er også et matsikkerhetsansvar).
- **Tags:** manuelle («VIP», «matanmelder», «eier av nabobedrift») og **auto-tags** fra atferd («stamgjest», «storforbruker», «vinelsker», «no-show x2»). Tags driver både service på gulvet og segmentert markedsføring.
- **POS-kobling:** SevenRooms kobler 65+ POS-systemer for å legge ordrehistorikk og forbruk på profilen i sanntid — da vet man hva gjesten faktisk bestiller og legger igjen.
- **VIP-håndtering:** egne varsler når VIP booker/ankommer, mulighet for å holde av de beste bordene.
- **GDPR-dimensjonen** (relevant i Norge/EØS): samtykkehåndtering for markedsføring, sletterett og dataminimering må være innebygd. *Antakelse basert på regelverket, ikke funnet eksplisitt i kildene over: sensitive opplysninger som allergier krever særlig aktsomhet.*

---

## 5. Events, set menus og prepaid ticketing

**Hvorfor:** Tock beviste at restaurantplasser kan selges som konsertbilletter — forhåndsbetalt, med garantert omsetning og null no-show-risiko. Fine dining og «experiences» (chef's table, vinsmaking, temakvelder) er der modellen passer best.

- **Tock-modellen:** to former — *prepaid experience* (hele menyprisen betales ved booking) og *depositum* (delbeløp som trekkes fra sluttregningen) ([Reservation Finder](https://www.reservationfinder.io/guides/tock-guide), [Rose](https://reservations.gg/blog/what-is-tock-prepaid-reservations)).
- **Set menus/tillegg i bookingflyten:** gjesten velger meny og forhåndsbestiller tillegg (vinpakke, kake, champagne) ved booking — OpenTable-data viser ~30 % høyere forbruk per gjest når tillegg tilbys prepaid ([OpenTable](https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/)).
- **Beste praksis for billetterte events** ([Toast](https://pos.toasttab.com/blog/on-the-line/restaurant-reservation-cancellation-fees), [Addmi](https://addmi.com/blog/restaurant-event-ticketing)): billetter **ikke-refunderbare, men overførbare** (gjesten kan gi bort/selge plassen — setet fylles uansett); lang avbestillingsfrist (uke+); tydelige vilkår før betaling.
- **Tock-prising:** 79–769 USD/mnd uten per-cover-avgift, men 2–3 % gebyr på forhåndsbetalinger på lavere planer; events: 2,5 %/transaksjon + $0,49/billett (Essential) eller 3 % + $0,99 (Premium) ([The Restaurant HQ](https://www.therestauranthq.com/technology/tock-to-go-review/), [restaurantbookingsystem.com](https://restaurantbookingsystem.com/compare/tock-vs-opentable/)).

---

## 6. Gavekort

**Hvorfor:** Forskuddsbetalt kontantstrøm (pengene kommer før varen leveres), nye gjester (mottakeren er ofte førstegangsgjest), og «breakage» (ubrukte kort) er ren margin. *Breakage-prosent: ikke verifisert i kildene — antakelse fra bransjeerfaring.*

- Moderne bookingsystemer har **innebygd digitalt gavekortsalg** (f.eks. [Now Book It](https://www.nowbookit.com/solutions/restaurant-gift-cards/)): kjøp på nett, levering på e-post, og **automatisk kobling av innløsning til bookingen** — ingen manuell avstemming i døren.
- Alternativt ligger gavekort i POS-laget (f.eks. [Toast](https://pos.toasttab.com/products/gift-card)) med rapportering på salg og innløsning per periode.
- Beste praksis: gavekort som markedsføringsflate rundt jul/morsdag, analytics på innløsningsgrad, og gavekort mot *experiences* (gi bort en chef's table) som binder gavekort til event-modulen. En leverandørcase hevder 20 % omsetningsløft fra automatiserte gavekortprogram ([US Tech Automations](https://ustechautomations.com/resources/blog/restaurant-gift-card-automation-case-study-2026) — svak kilde, behandle som påstand).

---

## 7. Oversalg/overbooking-strategi

**Hvorfor:** Med kjent no-show-rate er det matematisk lønnsomt å ta inn litt flere bookinger enn kapasiteten — flybransjens yield management anvendt på bord. Akademisk grunnlag: Cornell/Kimes' restaurant revenue management og nyere modeller ([Chiang 2023](https://journals.sagepub.com/doi/abs/10.1177/10963480211064356), [modellering av no-shows/walk-ins](https://faculty.sites.iastate.edu/ytpoon/files/inline-files/JFBR2017.pdf)).

Beste praksis fra kildene ([EatlyPOS](https://www.eatlypos.com/blog/how-to-reduce-restaurant-no-shows-reservation-management), [Hostie](https://hostie.ai/resources/dynamic-overbooking-ai-hostie-demand-prediction-restaurant-revenue)):
- Restauranter har historisk brukt **walk-ins som buffer** i stedet for aktiv overbooking — tryggere, men krever walk-in-trafikk.
- Ved aktiv overbooking: **overbook 60–70 % av målt no-show-rate, aldri 100 %** (er raten 10 %, overbook 6–7 %), og bare i tidsvinduer der data viser høy no-show (f.eks. lørdag kl. 20).
- **Grace period 10–15 min** før bordet frigis til venteliste/walk-in — kombinert med automatisk «vi holder bordet i 15 min»-SMS.
- Kapasitetsbuffer på 10–15 % holdes gjerne utenfor onlinebooking for walk-ins/VIP.
- **State of the art 2025/2026:** dynamisk, AI-basert overbooking som predikerer no-show per kveld ut fra historikk, ukedag, vær og bookingkanal (foreløpig mest hos nisjeleverandører; leverandørpåstand).
- Viktig motvekt: forskning på gjestereaksjoner viser at synlig overbooking skader tillit ([ResearchGate](https://www.researchgate.net/publication/383046366_Overbooking_and_customer_reactions_in_tourism_Evidence_from_restaurants)) — depositum/kortregistrering er derfor førstevalget, overbooking siste utvei.

---

## 8. Integrasjoner

### 8.1 POS (kassesystem)
**Hvorfor:** Uten POS-kobling er gjesteprofilen blind (ingen forbruksdata), bordstatus manuell, og rapportering på omsetning per booking umulig.
- **SevenRooms:** 65+ POS-integrasjoner, sanntids kobling av ordre/spend til gjesteprofil ([SevenRooms CRM](https://sevenrooms.com/platform/crm/)).
- **Oracle MICROS Simphony:** 200+ integrasjoner via Oracle Cloud Marketplace; standardvalget i hotell/kjede-segmentet, også i Norge ([Oracle](https://www.oracle.com/food-beverage/restaurant-pos-systems/pos-integrations/)).
- **Trivec (Caspeco)** — stor i Norden: posisjonerer seg som økosystem med POS + booking + personal + analyse under én innlogging, og har bl.a. **TheFork-integrasjon** ([Trivec integrations](https://trivecgroup.com/products/integrations/), [Trivec × TheFork](https://trivecgroup.com/products/integrations/the-fork/)).
- **Favrit** (norsk): API-first-plattform med sanntidsdata og åpne integrasjoner (bl.a. Tripletex og 24SevenOffice på regnskap) ([Favrit](https://web.favrit.com/en/restaurant-pos)). *Antakelse: Favrits åpne API gjør bookingintegrasjon teknisk mulig, men en spesifikk liste over bookingpartnere ble ikke funnet i søkene.*

### 8.2 Reserve with Google («Reserver bord» i Google Maps/Søk)
**Hvorfor:** 40–62 % av forbrukere finner spisesteder via Google-søk, og 55 % av gjester starter bookingreisen der ([ServMe](https://www.servmeco.com/resources/reserve-with-google-for-restaurants)). En bookingknapp direkte i Maps/Søk fjerner alle mellomledd. Én leverandør (resmio) hevder opptil +30 % bookinger ([resmio](https://www.resmio.com/en/reservations/google-reserve/) — leverandørpåstand).
- **Gratis og provisjonsfritt** for restauranten — men den kan ikke koble seg på selv. Kravet er at **bookingsystemet er godkjent «Reserve with Google»-partner**.
- **Krav til restauranten:** aktiv, verifisert Google Business Profile som matcher lokasjonen (komplett profil med åpningstider, kategori, bilder) ([Waitly](https://www.waitly.com/how-to-set-up-reserve-with-google/), [Partoo](https://www.partoo.co/en/blog/reserve-with-google/)).
- **Krav til plattformen (Reservations End-to-End):** direkte avtaleforhold med restaurantene, lokasjonsliste som matcher Google Maps, og en sanntids tilgjengelighetsfeed + booking-API etter Googles spesifikasjon via Actions Center; partnersøknad via interesse­skjema ([Google Actions Center](https://developers.google.com/actions-center/verticals/reservations/e2e/overview)). Valgfrie tillegg: venteliste, betaling (redirect), menyer.
- Mange systemer har dette i dag — OpenTable, SevenRooms, TheFork, Eat App, resOS ([resOS](https://resos.com/feature/reserve-with-google/)) m.fl. **For et nytt bookingsystem er RwG-partnerskap en betydelig etableringsbarriere/tidsinvestering** (*vurdering, ikke dokumentert tall*).

### 8.3 Instagram/Meta («Reserver»-knapp)
- Instagram **action button «Reserve»** på bedriftsprofil + tilsvarende knapp på Facebook-side. Krav: Instagram Business-konto (ikke privat/creator), koblet Facebook-side, og at bookingleverandøren står på **Metas begrensede partnerliste** ([Meta Business Help](https://www.facebook.com/business/help/122793804938499), [Instagram Help](https://help.instagram.com/313280685976255/)).
- Partnere inkluderer OpenTable, Resy m.fl.; mindre systemer løser det via **channel manager som Mozrest** ([Mozrest](https://doc.mozrest.com/rms/meta/)) eller egne Meta-integrasjoner (simpleERB, Libro, resOS ([resOS](https://resos.com/support/how-to-set-up-reserve-with-facebook-and-instagram/))). Fallback som alltid virker: bookinglenke i bio/«Book now»-lenkeknapp.

### 8.4 Øvrige
- **Betaling:** Stripe/Adyen for kortregistrering og depositum (i Norge også Vipps — *antakelse, ikke fra kildene*). **E-post/SMS-markedsføring:** Mailchimp-typen eller innebygd. **Regnskap** og **personalplanlegging** (Caspeco-økosystemet er eksempelet på full samling).

---

## 9. Rapportering og analytics

**Hvorfor:** Booking-dataene er den eneste komplette loggen over etterspørsel — inkludert etterspørselen man *ikke* klarte å ta imot.

Standardinnhold ([OpenTable](https://www.opentable.com/restaurant-solutions/products/table-management/), [Eat App](https://restaurant.eatapp.co/software-for-restaurants), [Tableo](https://tableo.com/operations/tackling-overbooking/)):
- Covers per skift/dag/kanal (egen nettside vs. marketplace vs. Google vs. walk-in) — kanalmiks avgjør hva marketplace-avgiftene faktisk koster.
- No-show- og avbestillingsrater per ukedag/tidspunkt (grunnlaget for depositum- og overbooking-policy, jf. del 7).
- Faktiske turn times og setekapasitetsutnyttelse; ventelistekonvertering og tapt etterspørsel («fullt»-avvisninger).
- Omsetning per booking/gjest (krever POS-kobling), gjentaksrate og gjestesegmenter.
- For grupper: konsolidert rapportering på tvers av lokasjoner.
- **State of the art:** prediktive dashboards (forventet belegg/no-show per kveld) — foreløpig mest markedsføring hos de store, reell nytteverdi udokumentert (*vurdering*).

---

## 10. Multi-restaurant-støtte for grupper

**Hvorfor:** Kjeder og grupper vil gjenkjenne gjesten på tvers («VIP hos oss er VIP overalt»), styre sentralt og sammenligne lokasjoner.

- **SevenRooms** regnes som enterprise-standarden: cross-property gjesteprofiler der preferanser, allergier og VIP-status følger gjesten til alle gruppens steder ([restaurantbookingsystem.com](https://restaurantbookingsystem.com/best/reservation-systems-multi-location/)).
- **OpenTable** støtter multi-lokasjon, men hver restaurant har separat marketplace-tilstedeværelse ([Eat App](https://restaurant.eatapp.co/blog/best-reservation-system-for-multi-location-restaurants)).
- **CoverManager** og **Eat App** tilbyr samlet gjestedatabase og sentral administrasjon for grupper ([CoverManager](https://www.covermanager.com/en/who/groups-chains)).
- Kjernefunksjoner: sentral brukerstyring/roller, delte gjesteprofiler (med GDPR-avklart behandlingsgrunnlag på tvers av juridiske enheter — *egen vurdering*), «book hos søsterrestauranten»-omdirigering når fullt, konsolidert rapportering, og gruppens gavekort gyldige alle steder.

---

## 11. Prisbilde (listepriser per medio 2026)

| System | Modell | Pris |
|---|---|---|
| OpenTable | Abonnement + per cover | $149/$299/$499 per mnd + $1,50 (Basic) / $1,00 (Core) per marketplace-cover; egne nettside-bookinger gratis på Core/Pro ([Eat App](https://restaurant.eatapp.co/blog/opentable-pricing)) |
| SevenRooms | Flat abonnement | Fra ca. $499/mnd, enterprise-tilbud, $0 per cover ([Perfect Venue](https://www.perfectvenue.com/post/sevenrooms-vs-opentable)) |
| Tock | Abonnement + transaksjonsgebyr | $79–769/mnd; 2–3 % på forhåndsbetalinger; events 2,5 %+$0,49 til 3 %+$0,99 per billett ([The Restaurant HQ](https://www.therestauranthq.com/technology/tock-to-go-review/)) |
| TheFork | Programvare + provisjon | ~€30–75/mnd; ~€2–2,60 (estimert opp mot €5) per gjest via marketplace; egen widget provisjonsfri. Satser forhandles individuelt ([Reserver](https://www.reserver-app.com/en/blog/booking-platforms-pricing-comparison/), [Caramel](https://joincaramel.com/blog/post-23/)) |
| resOS | Freemium, ingen provisjon | Gratis (25 bookinger/mnd); Basic $47, Plus $98, Unlimited $149/mnd (kampanjepriser ~50 %) ([resOS pricing](https://resos.com/pricing/)) |
| Superb | Abonnement | Fra ~€79/mnd ([restaurantbookingsystem.com](https://restaurantbookingsystem.com/compare/superb-alternatives/)) |
| DinnerBooking | På forespørsel | Ikke offentlig prisliste ([restaurantbookingsystem.com](https://restaurantbookingsystem.com/best/restaurant-booking-systems-2026/)) |

Regneeksempel fra kildene: ved 2 000 marketplace-covers/mnd koster OpenTable $2 000–3 500/mnd i cover-avgifter alene, før abonnement — det er dette som driver flukten til flatpris-modeller.

---

## 12. Bekreftet vs. antakelse — oppsummert

**Godt bekreftet (flere uavhengige kilder/offisiell dokumentasjon):** funksjonslistene i del 1–2 og 4; OpenTable/Tock/resOS-prisene; Reserve with Google-kravene (verifisert Business Profile + godkjent partnerplattform med sanntidsfeed, gratis for restauranten); Meta-krav (business-konto + partnerliste); no-show-baseline 5–20 %; OpenTables 16 %/15 %-tall for kortregistrering og 44 %/67 %/30 %-tallene for prepaid (OpenTables egne data, men primærkilde); overbooking-prinsippene (60–70 %-regelen, 10–15 min grace, walk-ins som buffer).

**Leverandørpåstander/svakere kilder — behandle med forbehold:** «10 000 kombinasjoner/sek» (SevenRooms), 27–38 % SMS-effekt (Hostie er selv SMS-leverandør; retningen støttes bredt, størrelsen varierer), «+30 % bookinger fra Google» (resmio), 20 % gavekortløft, «deposits eliminerer 80–90 %» (bransjeblogg-aggregering av operatørcase), TheForks eksakte provisjonssatser (forhandles individuelt).

**Egne vurderinger/antakelser (ikke fra kildene):** GDPR-punktene om allergidata og konserndeling; Vipps som relevant betalingsintegrasjon i Norge; at RwG-partnerskap er en vesentlig barriere for nye systemer; breakage som gavekort-marginsdriver; at Favrits API muliggjør bookingintegrasjon.

**Hull i researchen:** Norsk-spesifikke no-show-tall ble ikke funnet (UK-tallene er beste proxy). Google-utviklerdokumentasjonen og enkelte leverandørsider var utilgjengelige (403 via proxy), så RwG-detaljene bygger på søkesammendrag av offisiell dokumentasjon pluss tredjepartguider. Favrit/Trivecs konkrete bookingpartner-lister bør verifiseres direkte hos leverandørene.

## Nøkkelfunn (agentens oppsummering)
- Markedet deler seg i to modeller: marketplace med per-cover-avgift (OpenTable $1–1,50/cover, TheFork ~€2–2,60/gjest) mot flat abonnementspris uten provisjon (SevenRooms fra ~$499/mnd, resOS fra gratis, Superb ~€79/mnd) — trenden går mot det siste fordi restauranter vil eie gjestedataene.
- No-show-baseline er 5–20 % (OpenTable ~5–7 % en vanlig kveld, >20 % på høytidskvelder); trappen av mottiltak har dokumentert effekt: SMS-påminnelser kutter ~27–38 %, kortregistrering gir opptil 16 % lavere no-show (OpenTable-data) og rater mot ~3 %, depositum gir rater mot ~1,7 %, full forhåndsbetaling under 1 %.
- Dobbel SMS-påminnelse (24 t + 2 t før) med én-klikks avbestillingslenke er beste praksis — SMS har ~98 % åpningsrate mot ~20 % for e-post, og 36 % av no-show-gjester sier de ville møtt opp med påminnelse.
- Kjernen i bordadministrasjon er fire ting: interaktiv plantegning med sanntidsstatus, automatiske bordkombinasjoner, turn times per selskapsstørrelse, og pacing/flow controls per 15-minutters intervall (OpenTable-standarden) så kjøkkenet ikke drukner.
- Reserve with Google er gratis og provisjonsfritt for restauranten, men krever verifisert Google Business Profile OG at bookingsystemet er godkjent RwG-partner med sanntids tilgjengelighetsfeed via Googles Actions Center — en reell etableringsbarriere for nye systemer; 55 % av gjester starter bookingreisen på Google.
- Tock-modellen (prepaid ticketing/depositum for experiences og set menus) gir både null no-show-risiko og høyere snittsalg: prepaid-gjester er 44 % mindre tilbøyelige til no-show, 67 % mindre til sen avbestilling, og bruker ~30 % mer når tillegg som vinpakker tilbys ved booking.
- Overbooking beste praksis: overbook 60–70 % av målt no-show-rate (aldri 100 %), 10–15 min grace period før bordet frigis, 10–15 % kapasitetsbuffer til walk-ins — men depositum/kortregistrering foretrekkes fordi synlig overbooking skader gjestetillit.
- POS-integrasjon er limet i CRM-et: SevenRooms kobler 65+ POS-systemer for å legge forbruk på gjesteprofilen (allergier, tags, VIP, besøkshistorikk); i Norden er Trivec/Caspeco et helhetsøkosystem med TheFork-integrasjon, mens Favrit er API-first uten dokumentert bookingpartnerliste.
- SevenRooms er enterprise-standarden for grupper med cross-property gjesteprofiler (VIP-status og allergier følger gjesten mellom søsterrestauranter); DoorDash kjøpte selskapet for 1,2 mrd. USD i 2025, og OpenTable kuttet samtidig toveisintegrasjonen — valget er nå enten/eller.
- Instagram/Facebook «Reserver»-knapp krever business-konto og at bookingleverandøren står på Metas begrensede partnerliste; mindre systemer løser det via channel manager (f.eks. Mozrest) eller nøyer seg med bookinglenke i bio.
