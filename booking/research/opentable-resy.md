# OpenTable vs. Resy — dybdeanalyse (status 2025/2026)

## 0. Metode og kildekvalitet

Analysen er basert på websøk (juli 2026) mot leverandørenes egne sider, bransjemedier (Restaurant Dive, Restaurant Business, NRN), prissammenligningssider (Eat App, TableLink, RestaurantBookingSystem) og brukeranmeldelser (Capterra/G2). Leverandørenes egne pris-sider (opentable.com/restaurant-solutions/plans og resy.com/resyos/plans-and-pricing) var blokkert for direkte henting, så pristall er kryssjekket via flere tredjepartskilder. Der kildene spriker, er det markert eksplisitt. Skillet mellom **bekreftet** (flere uavhengige kilder eller leverandørens egne tall) og **antakelse/usikkert** er angitt underveis og oppsummert i kap. 8.

---

## 1. Markedskontekst 2025/2026

- **OpenTable** eies av Booking Holdings. Nettverket vokste fra 60 000 til **65 000+ restauranter** globalt i 2025, og fyller **1,9 milliarder seter i året** (opp fra 1,7 mrd.), med i snitt 8 reservasjoner booket per sekund og 150+ millioner gjesteanmeldelser i nettverket. (Kilder: https://www.opentable.com/restaurant-solutions/diner-network/, https://www.prnewswire.com/news-releases/opentable-reveals-the-top-trends-set-to-define-dining-in-2026-302618592.html)
- **Resy** eies av American Express (kjøpt 2019, sum ikke offentliggjort). Amex kjøpte også **Tock** (fra Squarespace, 400 mill. USD, 2024) og Rooam. I februar 2026 annonserte Amex at **Tock fusjoneres inn i Resy**, live sommeren 2026 — samlet **25 000+ bookbare venues** i Resy-appen. (Kilder: https://www.restaurantdive.com/news/resy-acquired-by-american-express/554851/, https://www.businesswire.com/news/home/20240621180849/en/, https://www.restaurantbusinessonline.com/technology/reservation-services-resy-tock-are-merging)
- **Resy-nettverket alene**: ca. 16 000 kuraterte restauranter, 50 millioner brukere (2024), over 350 millioner gjester satt i perioden okt. 2023–sep. 2024, og 600 millioner reservasjoner totalt siden oppstart. (Kilde: https://blog.resy.com/newsroom/resy-retrospective-2024/)
- **Markedsandeler (USA)**: OpenTable falt fra ca. 51 % til ca. 46 % av reservasjonsmarkedet 2022–2024; Toast Tables tok ~5 % på kort tid, Yelp vokste ~11 %. OpenTable, Yelp, Resy, Tock, Wisely, Toast Tables og SevenRooms dekker >95 % av det amerikanske markedet. (Kilder: https://www.bistrochat.com/foodforthought/en/posts/usa-restaurant-reservation-systems-market-data.html, https://www.analytics.restaurant/our-data-in-the-work/the-us-restaurant-reservation-market-heats-up) *Merk: 6sense oppgir avvikende tall (OpenTable 33 %, Tock 35 %, Resy 13 %) — trolig målt på webteknologi-fotavtrykk, ikke faktiske restauranter. Behandles som usikkert.*
- **Konsolidering rundt betalingsnettverk**: Amex eier Resy+Tock (kortfordeler: Global Dining Access for Platinum-kunder); OpenTable inngikk Visa-partnerskap i 2024 (Visa Infinite-fordeler); DoorDash kjøpte SevenRooms for **1,2 mrd. USD** (fullført juni 2025). Reservasjonsplattformene er i praksis blitt lojalitetsvåpen for kortselskaper og leveringsplattformer. (Kilder: https://restaurantbookingsystem.com/compare/opentable-vs-resy/, https://www.servmeco.com/resources/sevenrooms-competitors)

---

## 2. OpenTable — funksjonalitet for restauranten

### 2.1 Bordadministrasjon / floor plan
- Tilpassbare plantegninger («floor plans»), automatiske bordtildelinger, bordkombinasjoner og turn time-analyse for å maksimere antall seatinger. Tilgjengelig fra Core-planen; Basic er i hovedsak booking uten full bordstyring. (Kilder: https://www.opentable.com/restaurant-solutions/products/table-management/, https://www.opentable.com/restaurant-solutions/plans/core/)
- **POS-integrasjon** gir «auto table statusing» (bordet endrer status ut fra POS-hendelser), omsetning per bord/booking og innsikt i ordredata. Nye POS-integrasjoner i 2025: Union, PixelPoint, Heartland. (Kilde: https://www.opentable.com/restaurant-solutions/opentable-product-innovations/)

### 2.2 Kapasitets-/vaktplanlegging
- Shift-oppsett med pacing-kontroller (antall covers per tidsluke), justerbare turn times per selskapstørrelse, og historiske trendsammenligninger for å planlegge bemanning per skift. (Kilde: https://www.opentable.com/restaurant-solutions/our-solutions/) *Merk: OpenTable har ikke egentlig vaktplanlegging av personal — «shift planning» gjelder kapasitet/inventar, ikke turnus.* (Bekreftet funksjonsomfang; tolkningen er min.)

### 2.3 Venteliste
- Digital venteliste der gjesten kan stille seg i kø før ankomst, med automatisk estimert ventetid beregnet ut fra bordene i salen; restauranten kan justere estimater manuelt. SMS-varsling når bordet er klart. (Kilde: https://www.opentable.com/restaurant-solutions/products/features/opentable-waitlist/)

### 2.4 Gjestedatabase / CRM
- Gjesteprofiler med besøkshistorikk, notater, allergier/preferanser, «guest alerts» ved ankomst, og automatisert gjestekommunikasjon (bekreftelser, påminnelser, e-post etter besøk). (Kilde: https://www.opentable.com/restaurant-solutions/our-solutions/)
- **Viktig forbehold om dataeierskap**: OpenTable hevder restauranten eier data den selv legger inn (telefonbookinger, walk-ins), men **begrenser hvordan restauranten kan bruke kontaktinfo for gjester som booket via OpenTable-nettverket til egen markedsføring**, og endret i 2019 avtalen slik at deling av gjestedata med tredjepartsplattformer (f.eks. SevenRooms) krever betaling/samtykke. Dette er en varig konfliktlinje. (Kilder: https://www.restaurantdive.com/news/opentable-blocks-data-sharing-with-competitors/550662/, https://nrn.com/operations/opentable-tightens-control-consumer-information, https://www.opentable.com/restaurant-solutions/learn/built-to-protect/)

### 2.5 No-show-håndtering og betaling/depositum
- **Kredittkort-hold**: kortet belastes ikke ved booking, men restauranten kan trekke gebyr ved no-show/sen avbestilling. OpenTables egne tall: gjester med kort-hold er opptil **16 % mindre tilbøyelige til no-show** og 15 % mindre til sen avbestilling. (Kilde: https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/)
- **Depositum**: forhåndsbetaling ved booking, med valgfri refusjonsfrist (typisk 24–48 t). OpenTables tall: depositum kutter no-shows med **57 % i snitt** og gjør gjester **72 % mindre tilbøyelige** til å avbestille i siste liten. (Kilde: https://www.opentable.com/restaurant-solutions/resources/nowserving-deposits/)
- **Sanksjon mot gjester**: en diner som uteblir **4 ganger på 12 måneder får kontoen suspendert**. (Kilde: https://www.opentable.com/c/legal/terms-and-conditions/, https://www.tastingtable.com/1179757/the-opentable-reservation-penalty-youll-want-to-avoid/)
- Bransjetall: normal no-show-rate 5–7 % av reservasjoner på OpenTable-plattformen, >20 % på høytidsdager; no-shows koster bransjen globalt anslagsvis 16 mrd. USD/år. (Kilder: https://blog.tobeout.com/restaurant-no-show-rate-what-its-really-costing-you/, https://www.katalystos.com/blog/how-to-reduce-restaurant-no-shows)

### 2.6 Rapportering og AI
- Rapportering på covers, inntekt (via POS), turn times, no-show-rater og benchmarking mot historikk. Pro-planen legger til mer avansert rapportering og markedsføringsverktøy. (Kilde: https://www.opentable.com/restaurant-solutions/our-solutions/)
- **AI Concierge (lansert 15. juli 2025)**: generativ AI innebygd i restaurantprofilene som svarer på gjestespørsmål (meny, diett, parkering, stemning) før booking — bygget på OpenTables egne data pluss Perplexity- og OpenAI-API-er. I tillegg distribusjonspartnerskap med OpenAI Operator, Microsoft Copilot, Amazon Alexa+, og voice-AI (Slang AI, PolyAI) samt Salesforce Agentforce for kundeservice. (Kilder: https://www.prnewswire.com/news-releases/opentable-launches-gen-ai-powered-concierge-to-arm-diners-with-instant-insights-for-its-60-000-global-restaurants-302504834.html, https://restauranttechnologynews.com/2025/08/opentable-launches-embedded-concierge-to-answer-diner-questions-and-drive-restaurant-bookings/)

### 2.7 Markedsføring
- **Boost Campaigns**: betalt synlighet i søk på OpenTable; restauranten betaler kun per faktisk *seated diner*, ikke per visning/klikk (pris per seter ikke offentlig — usikkert). (Kilde: https://www.opentable.com/restaurant-solutions/products/features/boost-campaigns/)
- **Experiences**: billetterte menyer/arrangementer som selges i bookingflyten. (Kilde: https://www.opentable.com/restaurant-solutions/resources/how-to-set-up-opentable-experience/)

---

## 3. OpenTable — prismodell (bekreftede tall, USA)

| Plan | Månedspris | Nettverks-cover | Direkte-cover (egen nettside) |
|---|---|---|---|
| Basic | 149 USD | 1,50 USD | 0,25 USD/cover **eller** 49 USD/mnd flat |
| Core | 299 USD | 1,00 USD | 0 (inkludert) |
| Pro | 499 USD | 1,00 USD | 0 (inkludert) |

- Cover-gebyr påløper **kun** for gjester som fant restauranten via OpenTables app/nettside/affiliatenettverk — ikke for bookinger via restaurantens egen widget (unntatt Basic) eller telefon. (Kilder: https://restaurant.eatapp.co/blog/opentable-pricing, https://tablelink.app/blog/opentable-fees-explained, https://www.opentable.com/restaurant-solutions/plans/, https://tekpon.com/software/opentable/pricing/)
- *Avvik i kilder*: enkelte eldre/alternative kilder oppgir Core 249 USD / Pro 449 USD — trolig utdaterte priser eller regionsvariasjon. 149/299/499 er det gjennomgående 2025/2026-tallet. (Usikkerhet markert.)
- **Ny transaksjonsavgift**: fra tidlig 2026 rapporteres et **2 % servicegebyr** på transaksjoner gjennom plattformen (depositum, no-show-gebyrer, forhåndsbetalte Experiences). Regneeksempel fra kilden: en tasting-meny på 150 USD/pers med 500 covers/mnd gir 1 500 USD/mnd bare i dette gebyret. (Kilde: https://restaurant.eatapp.co/blog/opentable-pricing — én hovedkilde, bør verifiseres direkte med OpenTable før beslutninger.)
- Reelt kostnadsbilde: en restauranteier i Washington D.C. oppga 2 000+ USD/mnd i høysesong; en eldre uavhengig analyse estimerte ~10,40 USD i kostnad per «inkrementelt» 4-mannsbord booket via OpenTable.com — mot typisk 5 % driftsmargin i bransjen. (Kilder: https://www.nbcnews.com/business/consumer/restaurants-fight-back-ftc-crackdown-junk-fees-diners-balk-new-charges-rcna168078, https://checkthat.ai/brands/opentable/reviews)

---

## 4. Resy (ResyOS) — funksjonalitet for restauranten

### 4.1 Bordadministrasjon / floor plan
- Tilpasset plantegning med egendefinerte turn times og bordkombinasjoner; «Shift Settings» styrer åpningstider, turn times og pacing per skift; endringer i tilgjengelighet kan gjøres live under service. (Kilder: https://resy.com/resyos/features/service/, https://resy.com/resyos/restaurant-solutions/streamline-your-operations/)

### 4.2 Kapasitetsstyring
- **Pacing-kontroller** sprer covers utover kvelden så kjøkkenet ikke «slammes» ved skiftstart; slot-/inventarkontroller lar restauranten slippe bord i puljer og sette egne bookingregler per skift. Alt inventar (reservasjoner, events, experiences, add-ons) styres samlet. (Kilde: https://resy.com/join/restaurants/) *Som hos OpenTable: dette er kapasitetsplanlegging, ikke personalturnus.*

### 4.3 Venteliste og «Notify»
- Venteliste for walk-ins pluss **Notify** — en «fremtidsventeliste» der gjester abonnerer på avbestillinger for ønsket dato/tid og får push/e-post når bord frigjøres (førstemann til mølla). For restauranten betyr det at kanselleringer refylles automatisk fra en forhåndsbygd etterspørselskø — bredt regnet som Resys mest verdifulle enkeltfunksjon mot tapt omsetning. (Kilder: https://helpdesk.resy.com/what-is-notify-and-how-does-it-work-BJrJzPQLu, https://blog.resy.com/for-restaurants/how-to-fill-empty-seats-and-create-a-dream-guest-list-with-notify/)

### 4.4 Gjestedatabase / CRM
- Skybasert sentral gjestedatabase koblet mot POS: totalforbruk, live-regninger («live checks»), besøkshistorikk. Gjester beriker selv profilen via Resy-appen (allergier, diett, bursdag). Ingen per-cover-innlåsing, og Resy markedsfører **fullt eierskap til gjestedata** som differensiator mot OpenTable. (Kilder: https://www.getapp.com/retail-consumer-services-software/a/resyos/, https://restaurantbookingsystem.com/compare/opentable-vs-resy/)

### 4.5 Events/ticketing
- Experiences/events selges side om side med vanlige reservasjoner, med flere prisnivåer (GA, VIP, early bird, premium tables) og mulighet for flere experiences per bord. Tock-fusjonen (sommer 2026) tilfører markedets sterkeste forhåndsbetalings-/billettmotor (prepaid tasting menus, pop-ups, chef events). (Kilder: https://resy.com/join/experiences/, https://upgradedpoints.com/news/resy-merges-with-tock-adds-25k-venues/)

### 4.6 No-show-håndtering
- Kredittkort-hold ved booking og forhåndsbetaling («collect payment ahead of time») for å redusere no-shows.
- **Bot-/reseller-bekjempelse**: Resy tok i bruk en patentsøkt ML-modell mot reservasjonsboter, som sammen med New Yorks «Restaurant Reservation Anti-Piracy Act» ga **90 % reduksjon i no-shows forårsaket av boter/brokere fra Q2 2024 til Q2 2025** (Resys egne tall). (Kilde: https://resy.com/join/restaurants/ og Resy/Amex-omtale via https://www.softwareadvice.com/retail/resyos-profile/)

### 4.7 Rapportering
- Grunnrapportering i alle planer; mer avansert i Pro/Enterprise. Kjent svakhet: begrensede on-demand-rapporter — mye må hentes ut via eksport (se 6.2). (Kilde: https://www.selecthub.com/p/restaurant-reservations-software/resy-os/)

---

## 5. Resy — prismodell (bekreftede tall, USA)

| Plan | Månedspris | Per-cover-gebyr |
|---|---|---|
| Basic | 249 USD | **0** |
| Pro | 399 USD | **0** |
| Enterprise | 899 USD | **0** |

- Flat månedspris uten cover-gebyr eller provisjon på noen plan — regningen vokser ikke med antall gjester. Basic: reservasjoner, bordstyring, gjesteprofiler, basisrapportering. Pro/Enterprise: CRM, markedsføringsverktøy, multi-lokasjon, API. (Kilder: https://restaurantbookingsystem.com/compare/resy-pricing/, https://tablelink.app/blog/resy-fees-explained, https://tablelink.app/tools/resy-cost-calculator)
- Konsekvens: jo flere covers, desto lavere effektiv kostnad per cover. Break-even mot OpenTable inntreffer typisk rundt et par hundre nettverkscovers i måneden; kilden angir at Resy lønner seg for restauranter med **200+ covers/mnd** fra nettverket. (Kilde: https://restaurantbookingsystem.com/compare/opentable-vs-resy/ — terskelen er kildens estimat, ikke et offisielt tall.)
- Ulempe: høy inngangsbillett (249 USD/mnd) og ingen gratis/billig instegsplan.

---

## 6. Gjesteopplevelsen og discovery-nettverket

### 6.1 OpenTable (gjestesiden)
- Størst nettverk og størst discovery-verdi: 65 000+ restauranter, ~31 millioner månedlige diners (tall fra sammenligningskilde), poengprogram for gjester, 150M+ anmeldelser, AI Concierge i profilene, og distribusjon inn i ChatGPT/Operator, Copilot, Alexa+ og Perplexity. Bredden dekker alt fra kjedekasual til fine dining. (Kilder: https://www.opentable.com/restaurant-solutions/diner-network/, https://restaurantbookingsystem.com/compare/opentable-vs-resy/, https://www.pymnts.com/restaurant-technology/2025/opentable-debuts-ai-powered-concierge-for-diners/)

### 6.2 Resy (gjestesiden)
- Kuratert, merkevaresterkt nettverk med overvekt av Michelin-restauranter og «hotspots»; sterkest i NYC/LA, tynnere i mellomstore byer. App-funksjoner: Notify, Hit List (lagrede ønskerestauranter med varsler), Invite Your Party (del reservasjon via SMS), redaksjonelt innhold. Amex-koblingen gir Platinum/Centurion-kunder **Global Dining Access** (reserverte bord på fullbookede restauranter, Priority Notify, tidlig tilgang til events) — for restauranten betyr dette tilgang til et betalingssterkt segment. (Kilder: https://helpdesk.resy.com/what-is-notify-and-how-does-it-work-BJrJzPQLu, https://blog.resy.com/newsroom/new-resy-benefits-are-added-to-american-express-u-s-consumer-and-business-platinum-cards/, https://www.selecthub.com/p/restaurant-reservations-software/resy-os/)
- Toast-partnerskapet (aug. 2025) gir Resy/Tock-listinger synlighet i «Local by Toast»-appen og kobler Toasts POS-data («Digital Chits») mot Resys guestbook. (Kilde: https://markets.financialcontent.com/decaturdailydemocrat/article/bizwire-2025-8-5-american-express-and-toast-announce-strategic-partnership-to-help-elevate-hospitality-experiences)

---

## 7. Styrker, svakheter og hva restauranteiere klager på

### 7.1 OpenTable — styrker
1. Uslåelig discovery-volum (størst nettverk, flest diners) — best for nye restauranter og konkurranseutsatte markeder som trenger fylte seter.
2. Moden bordstyring + bredt POS-økosystem med auto-statusing og omsetningskobling.
3. Best vurderte B2B-support i kategorien (8,8/10 på G2, 4,5/5 på Capterra for support). (Kilde: https://checkthat.ai/brands/opentable/reviews)
4. Sterk no-show-verktøykasse (hold, depositum, gjestesanksjoner) med dokumenterte effekttall.
5. Ledende på AI-distribusjon (Concierge + agent-økosystem).

### 7.2 OpenTable — svakheter og klager (fra anmeldelser/bransjepresse)
1. **Kostnadsmodellen er klage nummer én**: 149–499 USD/mnd pluss 1,00–1,50 USD per nettverkscover oppleves som «skatt på egne stamgjester»; sitat fra verifisert eier på Capterra: *«They drained us monthly with their expensive plan and added little to no value in growing our company.»* (Kilder: https://checkthat.ai/brands/opentable/reviews, https://www.capterra.com/p/17313/OpenTable-for-Restaurants/reviews/)
2. **Dataeierskap/innlåsing**: begrensninger på bruk av diner-kontaktdata til egen markedsføring og blokkering av datadeling med tredjeparter (SevenRooms-konflikten). (Kilde: https://www.restaurantdive.com/news/opentable-blocks-data-sharing-with-competitors/550662/)
3. **Tekniske hendelser**: bl.a. en systemomfattende feil i desember 2025 med dobbeltbookinger, bekreftet av selskapet. (Kilde: https://checkthat.ai/brands/opentable/reviews)
4. **Kundeflukt**: 409 dokumenterte bytter til Toast Tables og markedsandelsfall 51 %→46 % knyttes i analyser direkte til prismisnøye. (Kilde: https://www.bistrochat.com/foodforthought/en/posts/usa-restaurant-reservation-systems-market-data.html)
5. Nytt 2 %-transaksjonsgebyr (2026) rammer nettopp de betalingsfunksjonene som skal beskytte mot no-shows. (Kilde: https://restaurant.eatapp.co/blog/opentable-pricing)

### 7.3 Resy — styrker
1. **Forutsigbar flat pris uten cover-gebyr** — hovedargumentet mot OpenTable; effektiv kostnad synker med volum.
2. Premium merkevare/kuratering — signalverdi for fine dining og trendsteder; flere Michelin-restauranter enn kjeder.
3. **Notify** — automatisk gjenfylling av kanselleringer fra etterspørselskø.
4. Amex-motoren: Global Dining Access gir garantert etterspørsel fra høytbetalende kort-kunder; Tock-fusjonen tilfører best-i-klassen forhåndsbetaling/ticketing og 25 000+ venues.
5. Tydelig holdning på at restauranten eier gjestedataene.
6. Dokumentert bot-bekjempelse (90 % reduksjon i bot-/broker-no-shows Q2 2024–Q2 2025).

### 7.4 Resy — svakheter og klager
1. **Mindre nettverk med geografisk skjevhet**: sterk i NYC/LA, «reasonable» i Chicago/DC, tynn i mellomstore markeder — mindre discovery-verdi utenfor storbyene. (Kilde: https://www.selecthub.com/p/restaurant-reservations-software/resy-os/)
2. **Begrenset rapportering**: on-demand-analyser er tynne; mye krever eksport. (Samme kilde.)
3. **App-/plattformstabilitet**: «lock timeout fail»-feil og lasteproblemer i ResyOS; enkelte funksjoner finnes bare på web, ikke i app. (Kilder: https://www.capterra.com/p/197806/ResyOS/reviews/, https://www.softwareworld.co/software/resy-os-reviews/)
4. **Manglende blacklist-funksjon** for problemgjester — mye etterspurt av fine dining-operatører. (Kilde: https://www.selecthub.com/p/restaurant-reservations-software/resy-os/)
5. **Kundeservice**: klager på treg oppfølging og manglende kommunikasjon, særlig ved kanselleringer/kontoproblemer. (Kilde: https://www.capterra.com/p/197806/ResyOS/reviews/)
6. Høy minstepris (249 USD/mnd) gjør den lite egnet for små steder med lavt bookingvolum.
7. *Usikkert*: én kilde hevder appen kun finnes for iOS — dette gjelder i så fall ResyOS-restaurantappen (App Store-oppføring bekreftet); gjeste-appen finnes normalt på begge plattformer. Behandles som ubekreftet.

---

## 8. «Best i klassen» — konsensus på tvers av kilder

| Funksjonsområde | Best i klassen (2025/2026) | Kommentar |
|---|---|---|
| Discovery/diner-nettverk | **OpenTable** | 65k restauranter, 1,9 mrd. seter/år, AI-agent-distribusjon |
| Flat, forutsigbar prising | **Resy** (og Toast Tables i budsjettsegmentet, 50–199 USD/mnd) | Ingen cover-gebyr |
| Fylle kanselleringer | **Resy Notify** | «Fremtidsventeliste» |
| Forhåndsbetaling/ticketing | **Tock** (→ inn i Resy sommeren 2026) | Prepaid-modellen ga 3 % no-show-rate hos Tock-kunder med kort-hold (des. 2023–mar. 2024) |
| Gjeste-CRM + markedsføringsautomasjon | **SevenRooms** | Full dataeierskap, prediktiv no-show-modell (~92 % treffsikkerhet i 2025-piloter); nå DoorDash-eid |
| POS-nativ integrasjon | **Toast Tables** | Null friksjon mot Toast POS |
| No-show-verktøy med dokumentert effekt | **OpenTable** (depositum −57 % no-shows) og **Resy** (bot-reduksjon −90 %) | Ulike angrepsvinkler |
| Support | **OpenTable** | 8,8/10 G2 |
| Premium-/fine-dining-posisjonering | **Resy** | Amex GDA som etterspørselsmotor |

(Kilder: tabellene og tallene over; i tillegg https://sevenrooms.com/blog/opentable-alternatives/, https://restaurant.eatapp.co/blog/toast-tables-alternatives-and-competitors, https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/)

---

## 9. Bekreftet vs. antakelse — oppsummert

**Bekreftet (flere kilder / leverandørtall):** planpriser (OpenTable 149/299/499 USD; Resy 249/399/899 USD), cover-gebyrer (1,50/1,00 USD nettverk; 0,25 USD el. 49 USD flat for direkte på Basic; Resy 0), nettverksstørrelser (65k / 16k→25k+), eierskap (Booking Holdings / Amex), Tock-fusjonen, SevenRooms-DoorDash (1,2 mrd. USD), AI Concierge-lanseringen (juli 2025), no-show-effekttall fra OpenTable (16 %/57 %/72 %), Resys bot-tall (90 %), OpenTables 4-no-shows-regel, dataeierskapskonflikten.

**Usikkert / antakelse:** det nye 2 %-transaksjonsgebyret hos OpenTable (én hovedkilde), eksakt break-even på 200 covers/mnd for Resy (kildens estimat), 31M månedlige OpenTable-diners (sammenligningsside, ikke primærkilde), 6sense-markedsandelene, «iOS-only»-påstanden om Resy-appen, Boost-kampanjenes pris per seated diner (ikke offentliggjort). Alle priser er USA-priser; begge plattformer kan ha andre priser og planstrukturer i Europa/Norden (ikke verifisert — OpenTable opererer i Norden, Resy er i praksis USA/UK-fokusert, hvilket i seg selv er en antakelse basert på markedsdekningen i kildene).

---

## 10. Kildeliste (hoved-URL-er)

- https://www.opentable.com/restaurant-solutions/plans/
- https://restaurant.eatapp.co/blog/opentable-pricing
- https://tablelink.app/blog/opentable-fees-explained
- https://tekpon.com/software/opentable/pricing/
- https://www.opentable.com/restaurant-solutions/products/table-management/
- https://www.opentable.com/restaurant-solutions/products/features/opentable-waitlist/
- https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/
- https://www.opentable.com/restaurant-solutions/resources/nowserving-deposits/
- https://www.opentable.com/c/legal/terms-and-conditions/
- https://www.opentable.com/restaurant-solutions/diner-network/
- https://www.prnewswire.com/news-releases/opentable-launches-gen-ai-powered-concierge-to-arm-diners-with-instant-insights-for-its-60-000-global-restaurants-302504834.html
- https://www.restaurantdive.com/news/opentable-blocks-data-sharing-with-competitors/550662/
- https://checkthat.ai/brands/opentable/reviews
- https://www.capterra.com/p/17313/OpenTable-for-Restaurants/reviews/
- https://restaurantbookingsystem.com/compare/resy-pricing/
- https://restaurantbookingsystem.com/compare/opentable-vs-resy/
- https://tablelink.app/blog/resy-fees-explained
- https://resy.com/join/restaurants/
- https://resy.com/resyos/features/service/
- https://helpdesk.resy.com/what-is-notify-and-how-does-it-work-BJrJzPQLu
- https://blog.resy.com/newsroom/resy-retrospective-2024/
- https://www.selecthub.com/p/restaurant-reservations-software/resy-os/
- https://www.capterra.com/p/197806/ResyOS/reviews/
- https://www.restaurantbusinessonline.com/technology/reservation-services-resy-tock-are-merging
- https://upgradedpoints.com/news/resy-merges-with-tock-adds-25k-venues/
- https://www.businesswire.com/news/home/20240621180849/en/
- https://www.bistrochat.com/foodforthought/en/posts/usa-restaurant-reservation-systems-market-data.html
- https://www.analytics.restaurant/our-data-in-the-work/the-us-restaurant-reservation-market-heats-up
- https://sevenrooms.com/blog/opentable-alternatives/
- https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/
- https://www.nbcnews.com/business/consumer/restaurants-fight-back-ftc-crackdown-junk-fees-diners-balk-new-charges-rcna168078

## Nøkkelfunn (agentens oppsummering)
- OpenTable koster 149/299/499 USD/mnd pluss 1,00–1,50 USD per nettverkscover; Resy koster flat 249/399/899 USD/mnd uten cover-gebyr — dette er den viktigste strukturelle forskjellen.
- OpenTable har klart størst discovery-nettverk (65 000+ restauranter, 1,9 mrd. seter fylt/år); Resy har ~16 000 kuraterte steder, men vokser til 25 000+ når Tock fusjoneres inn sommeren 2026.
- Begge er nå kortselskaps-våpen: Amex eier Resy+Tock (Global Dining Access for Platinum), OpenTable partnerskap med Visa (2024), og DoorDash kjøpte SevenRooms for 1,2 mrd. USD (2025).
- No-show-verktøy virker målbart: OpenTables depositum kutter no-shows 57 % og kort-hold 16 %; Resys ML-modell mot boter ga 90 % reduksjon i bot-/broker-no-shows Q2 2024–Q2 2025; OpenTable suspenderer gjester etter 4 no-shows på 12 mnd.
- Største klage på OpenTable er kostnaden (eiere rapporterer 2 000+ USD/mnd i høysesong) og at restauranten ikke fritt kan bruke gjestedata fra nettverksbookinger til egen markedsføring; markedsandelen falt fra 51 % til 46 % (2022–2024).
- Største klager på Resy er tynt nettverk utenfor storbyene, begrenset on-demand-rapportering, app-ustabilitet, manglende blacklist-funksjon og treg kundeservice.
- «Best i klassen» er fragmentert: OpenTable på discovery/support, Resy på Notify (gjenfylling av kanselleringer) og flat pris, Tock på forhåndsbetaling/ticketing, SevenRooms på CRM/markedsføringsautomasjon, Toast Tables på POS-integrasjon og lavpris.
- OpenTable leder på AI-distribusjon: gen-AI «Concierge» i restaurantprofilene (juli 2025) pluss integrasjoner mot ChatGPT/Operator, Copilot, Alexa+ og Perplexity.
- Ubekreftet men viktig å verifisere: et nytt 2 % transaksjonsgebyr hos OpenTable fra 2026 på depositum/no-show-gebyrer/forhåndsbetalte Experiences (én hovedkilde).
- Alle pristall er USA-priser; nordiske priser og planstrukturer er ikke verifisert i denne researchen.
