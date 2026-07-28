# Bookingsystemer for restauranter i Norden og Norge (2025/2026) — dybdeanalyse

## 0. Metode og forbehold

Researchen er gjort med websøk (juli 2026). Direkte oppslag mot restaurantenes nettsider var blokkert i dette miljøet, så «hva bruker de faktisk»-funnene er bekreftet via **indekserte booking-URL-er** (f.eks. dedikerte underdomener som `kontrast.superbexperience.com`) — det er sterk dokumentasjon, men ikke et ferskt skjermbilde av selve «bestill bord»-knappen. Alle funn er merket **[BEKREFTET]** (dokumentert URL/kilde) eller **[ANTAKELSE]** (rimelig slutning, ikke verifisert).

---

## 1. Hva kjente Oslo-restauranter faktisk bruker

| Restaurant | System | Bevis | Status |
|---|---|---|---|
| **Maaemo** (3* Michelin) | **Tock** | https://www.exploretock.com/maaemo (egne «experiences» for Main Dining Room og Private Dining Room) | [BEKREFTET] |
| **Kontrast** (2* Michelin) | **Superb (GX)** | https://kontrast.superbexperience.com/reserve/experience | [BEKREFTET] |
| **Hot Shop** (1* Michelin) | **Superb (GX)** | https://hotshop.superbexperience.com/ | [BEKREFTET] |
| **Ling Ling Oslo** (Hakkasan/Fursetgruppen, Aker Brygge) | **SevenRooms** | https://www.sevenrooms.com/explore/lingling/reservations/create/search | [BEKREFTET at profilen finnes; at det er primærkanalen er ANTAKELSE] |
| **Katla** | **DinnerBooking** | https://dinnerbooking.com/no/en-US/r1836/katla | [BEKREFTET] |
| **Sentralen** (Hitchhiker/Sentralen kafé og bar) | **DinnerBooking** | https://dinnerbooking.com/no/en-US/r919/hitchhiker-restaurant-sentralen-kafe | [BEKREFTET] |
| **Lava Oslo-gruppen** (Katla, Hrímnir Ramen, Hitchhiker, Smalhans, Handwerk Botaniske, The Golden Chimp, Vega Snackbar m.fl.) | **DinnerBooking** (gruppebredt) | Katla r1836 og Hrímnir Ramen r1838 bekreftet (https://dinnerbooking.com/no/en-US/r1838/hrimnir-ramen); resten av gruppen [ANTAKELSE] | Delvis bekreftet |
| **BA53** (Bygdøy allé 53) | Booking gikk via e-post (booking@ba53.no) | Yelp merker restauranten som **stengt** (oppdatert feb. 2025 / juni 2026): https://www.yelp.com/biz/restaurant-ba53-oslo | [BEKREFTET stengt via Yelp; e-postbooking fra visitoslofjorden.no] |
| **Olympen «Lompa»** (Grønland) | Booking via nettside/e-post (booking@olympen.no) | Nettsiden (https://www.olympen.no/) oppgir at restauranten er **stengt og søker nye drivere** | [BEKREFTET via søketreff; dobbeltsjekk anbefales] |

**Andre norske Superb-kunder** [BEKREFTET via Superbs egen kundeartikkel]: Kontrast, Substans og SAV (Bergen), Agrikultur, PMY — omtalt i Superbs artikkel om no-show-gebyrer i Norge, der de rapporterer fall i no-show-rate fra ~16 % til 0,8 % etter innføring av kortsikring: https://www.superbexperience.com/experience-matters/community-norways-top-restaurants-stop-no-shows

**Mønster:** Michelin-/fine-dining-segmentet i Oslo deler seg mellom **Superb** (Kontrast, Hot Shop), **Tock** (Maaemo) og **SevenRooms** (Ling Ling/internasjonale konsepter), mens **volumgrupper** som Lava Oslo (Eik-systemet) står på **DinnerBooking**. OpenTable/TheFork har svak dekning i Oslo sammenlignet med resten av Europa.

---

## 2. Leverandørprofiler

### 2.1 Superb (GX-plattformen) — superbexperience.com
- **Hvem:** Dansk (København), grunnlagt 2016. «Guest Experience Management» (GXM): booking + POS + betaling + gjestedata i én plattform, pluss RES-app for iPad (https://apps.apple.com/no/app/superb-res/id1449157986).
- **Finansiering:** Series A på €12M/$14,6M i mai 2021, ledet av Kinnevik, Vivino og Simple Feast (https://tech.eu/2021/06/08/copenhagen-based-guest-experience-management-platform-superb-raises-e12-million-in-series-a-round/). Totalt ~$16,4M reist.
- **Størrelse:** ~$3,9M omsetning og ~800 kunder i 2024 iflg. tredjepart Getlatka (https://getlatka.com/companies/superb) — [ANTAKELSE/tredjepartstall, ikke bekreftet av selskapet].
- **Pris:** Inngangspris ca. **€79/mnd**, ingen gratisplan, fastpris uten per-cover-gebyr (tredjepartskilde: https://restaurantbookingsystem.com/compare/superb-alternatives/; offisiell side: https://www.superbexperience.com/pricing — kunne ikke leses direkte). **5 % kommisjon på online-betalinger** (no-show-gebyr, gavekort) via Superb Payments (https://helpcenter.superbexperience.com/en/article/how-to-work-with-superb-payments-1icc6jk/) [BEKREFTET].
- **Norge-relevans:** Sterkest posisjon i nordisk fine dining; aktivt markedsført no-show-kortsikring mot norske topprestauranter.
- **Betaling:** Bygger på Stripe → kort, **ikke dokumentert Vipps-støtte** [ANTAKELSE: ingen Vipps].

### 2.2 resOS — resos.com
- **Hvem:** Dansk (København). Enkelt, rimelig bookingsystem uten kommisjon.
- **Pris** (https://resos.com/pricing/): Gratis (25 bookinger/mnd), deretter trinn basert på bookingvolum — Basic fra ~$35–47/mnd, Plus ~$65–98/mnd, Unlimited ~$95–149/mnd (kampanjepriser forekommer; kilder spriker noe: https://tekpon.com/software/resos/reviews/). Ingen binding, ingen kommisjon per cover.
- **SMS:** **€0,10 per SMS-segment** (160 tegn GSM-7), sendes via Twilio, ren forbruksfakturering (https://resos.com/sms-prices/) [BEKREFTET].
- **Norsk:** Plattformen finnes på norsk [BEKREFTET via søk]; egen GDPR-side (https://resos.com/feature/gdpr-compliant/).
- **Vipps:** Ikke dokumentert.

### 2.3 Tablein — tablein.com
- **Hvem:** Litauisk, rettet mot små/mellomstore restauranter i 50+ land.
- **Pris:** Starter **$49/mnd** (50 bookinger, $0,69 per ekstra), Growth **$107/mnd** (150–315), Success **$177/mnd** (ubegrenset) (https://www.capterra.com/p/176260/Tablein-com/ og https://www.tablein.com/). SMS-påminnelser inkludert som funksjon.
- **Norge-relevans:** Ingen dokumenterte kjente Oslo-kunder funnet. Norsk språkstøtte ikke bekreftet [ANTAKELSE: begrenset lokalisering].

### 2.4 easyTableBooking / easyTable — easytable.com
- **Hvem:** Dansk (København), «billig-alternativet»: 2 500+ restauranter i 43 land (https://www.crunchbase.com/organization/easytablebooking).
- **Pris:** **499 DKK/mnd** i Danmark / ca. **€67/mnd** (https://easytable.com/pricing/ og https://easytable.com/da/priser/), 30 dager gratis, ingen binding, ingen per-booking-gebyr. Egne SMS-priser (https://easytablebooking.com/text-message-prices/).
- **Norge-relevans:** Selger i Norden inkl. Norge; konkrete Oslo-kunder ble ikke dokumentert i søkene [ANTAKELSE: mest utbredt i Danmark].

### 2.5 DinnerBooking — dinnerbooking.com / biz.dinnerbooking.com
- **Hvem:** Dansk (etablert 2004). Både SaaS og **markedsplass** («Nordens største bookingside», 1 400+ restauranter), med norsk portal (https://dinnerbooking.com/no/nb-NO).
- **Pris:** Ikke offentlig — pakkepris per måned + tillegg **per 1 000 ekstra unike gjesteregistreringer** i databasen (https://support.dinnerbooking.com/billing/understand-your-invoice/packages/). Tilbyr «Full Plans»/White Label (https://biz.dinnerbooking.com/en-gb/full-plans/). [BEKREFTET modell, ukjente satser.]
- **Forskuddsbetaling:** Innebygd prepayment mot no-shows (meny, delbeløp eller depositum): https://biz.dinnerbooking.com/en-gb/prepayment/. Hvilke betalingsmetoder (kort vs. Vipps/MobilePay) er **ikke dokumentert** [ANTAKELSE: kort].
- **Norge-relevans:** De facto-systemet for Lava Oslo/Eik-gruppens restauranter (Katla, Hrímnir, Hitchhiker/Sentralen). Markedsplass-siden gir også synlighet/trafikk, ikke bare widget.

### 2.6 Bookio / BookioPro — bookio.com / bookiopro.com
- **Hvem:** Slovakisk (Creative Web, Bratislava). Primærmarked **Slovakia og Tsjekkia** (https://www.bookiopro.com/info/about).
- **Norge-relevans:** **Ingen dokumentert tilstedeværelse i Norden.** Trolig lite relevant som konkurrent i Norge [BEKREFTET fravær i søk / ANTAKELSE].

### 2.7 Waitwhile — waitwhile.com
- **Hvem:** San Francisco, grunnlagt 2017 av de svenske brødrene Christoffer og Jonas Klemming; kontor i Sverige; $12M i funding (CRV) (https://www.crunchbase.com/organization/waitwhile).
- **Hva:** Primært **venteliste/kø og timebestilling** (drop-in), ikke klassisk bordreservasjon — brukes mest i retail/service, men har restaurantmodul (https://waitwhile.com/restaurant-waitlist/).
- **Pris:** Gratisnivå (~100 gjester/mnd, 1 lokasjon); betalte planer — kilder spriker fra ~$23/mnd til ~$59/mnd per lokasjon (https://restaurant.eatapp.co/blog/best-restaurant-waitlist-management-systems). [Tall usikre.]
- **Norge-relevans:** Flerspråklig, men ingen dokumenterte norske restaurantkunder funnet.

### 2.8 Andre relevante aktører i Norge
- **Tock** (exploretock.com, USA/Squarespace): forhåndsbetalte «experiences»; brukes av Maaemo. Egnet for menyer med full forskuddsbetaling.
- **SevenRooms** (USA): internasjonale grupper; i Oslo bl.a. Ling Ling, Oche Aker Brygge (https://www.sevenrooms.com/reservations/ocheakerbrygge) og Pokalen Aker Brygge.
- **Munu** (munu.cloud, **Stavanger, Norge**, grunnlagt 2016): norsk alt-i-ett POS + booking «built for the Nordics», POS-integrert bordstatus, automatiske SMS/e-postbekreftelser (https://munu.cloud/product/booking/). Pris ikke offentlig. Den mest «norske» utfordreren.
- **Resovu** (resovu.com): norsk språk + 8 andre, GDPR, gratisplan for oppstart [kun via søketreff].
- **Bookingtjeneste.no**: norsk generell bookingtjeneste med **ferdig Vipps Checkout-integrasjon** (Vipps-app, kort, Klarna) (https://bookingtjeneste.no/en/vipps-checkout/) — ikke restaurantspesialist, men beviser at Vipps-flyt i booking er etterspurt og gjennomførbart.
- **OpenTable/TheFork**: OpenTable har Oslo-lister (https://www.opentable.com/neighborhood/no/norway/oslo-restaurants) men tynn faktisk dekning; ingen av de undersøkte Oslo-restaurantene brukte dem som primærkanal [ANTAKELSE basert på fravær].

---

## 3. Norske særkrav

### 3.1 Vipps-betaling
- Vipps hadde **ca. 4,6–4,68 millioner brukere i Norge** i 2025, og Vipps MobilePay totalt **12,2–12,4 millioner** i Norden (https://vipps.no/news/2025/2/vipps-ti-aar og Vipps MobilePay årsrapport 2025). Vipps er i praksis standard betalingsforventning hos norske forbrukere.
- **Ingen av de store restaurant-bookingsystemene (Superb, resOS, Tablein, easyTable, DinnerBooking) har dokumentert innebygd Vipps-betaling.** Superb kjører kortsikring/betaling via Stripe med 5 % kommisjon; DinnerBookings prepayment-metoder er udokumenterte. Dette er et reelt **gap i markedet**: no-show-depositum og forskuddsbetaling via Vipps ville senke terskelen betydelig for norske gjester. (Generiske norske systemer som Bookingtjeneste.no har allerede Vipps Checkout.)

### 3.2 Norsk SMS-utsending
- resOS: SMS som tillegg, €0,10/segment via Twilio (https://resos.com/sms-prices/). easyTable: egen SMS-prisliste. Munu: SMS-bekreftelser/påminnelser inkludert i plattformen. Tablein: SMS-påminnelser i planene.
- [ANTAKELSE] Systemer som ruter via internasjonale SMS-gatewayer (Twilio) fungerer i Norge, men avsender-ID, pris per norsk SMS og leveringskvalitet varierer — et punkt norske kjøpere bør sjekke i avtalen.

### 3.3 Norsk språk
- Bekreftet norsk gjeste-/adminflate: **resOS** (norsk), **DinnerBooking** (full norsk portal, nb-NO). **Munu** og **Resovu** er norskspråklige. Superbs gjestewidget er flerspråklig [ANTAKELSE — ikke direkte verifisert]; Tablein og Bookio har ikke dokumentert norsk.

### 3.4 GDPR / EU-datalagring
- **resOS** profilerer seg aktivt på GDPR-etterlevelse (https://resos.com/feature/gdpr-compliant/).
- Nyansering for alle som bruker **Stripe** (bl.a. Superb): Stripe tilbyr **ikke EU-dataresidens**; overføringer hviler på EU-US Data Privacy Framework + SCC-er, og Stripe er underlagt amerikansk CLOUD Act (https://support.stripe.com/questions/protection-of-european-data-transfers, https://dpa-atlas.foundagent.net/gdpr/stripe). GDPR-etterlevelse er mulig, men krever databehandleravtale og informasjon til gjestene.
- Gjestedatabaser (DinnerBookings prising per 1 000 gjesteregistreringer viser at gjestedata er kjernen i forretningsmodellen) utløser krav om dataminimering og sletterutiner etter GDPR.

---

## 4. Oppsummerende markedsbilde (2025/2026)

1. **Fine dining (Michelin-sjiktet):** Superb dominerer blant nordisk-eide topprestauranter (Kontrast, Hot Shop, Substans, SAV); Tock tar de som vil ha full forskuddsbetalt «ticketing» (Maaemo); SevenRooms tar internasjonale konsepter (Ling Ling).
2. **Restaurantgrupper med volum:** DinnerBooking (Lava Oslo/Eik-gruppen) — kombinasjonen SaaS + markedsplass-trafikk + prepayment.
3. **Små uavhengige:** resOS (gratis→~$35+), easyTable (~499 DKK), Tablein ($49+) konkurrerer på pris uten kommisjon.
4. **Norsk-bygde alternativer:** Munu (Stavanger) er eneste norske alt-i-ett-utfordrer med POS-kobling; Bookio er i praksis fraværende i Norden; Waitwhile er kø/venteliste, ikke bordbooking.
5. **Ledige posisjoner:** Ingen etablert aktør tilbyr dokumentert **Vipps-basert no-show-sikring/forskuddsbetaling** — trolig den tydeligste differensieringen for en ny aktør mot det norske markedet. BA53 og Olympen er stengt (per hhv. Yelp feb. 2025 og olympen.no) — restaurantdød i Oslo 2024–2026 gjør «lav fastpris uten binding» til et sterkt salgsargument.

## 5. Kilder (utvalg)
- https://www.exploretock.com/maaemo — https://kontrast.superbexperience.com/reserve/experience — https://hotshop.superbexperience.com/ — https://www.sevenrooms.com/explore/lingling/reservations/create/search — https://dinnerbooking.com/no/en-US/r1836/katla — https://dinnerbooking.com/no/en-US/r1838/hrimnir-ramen — https://dinnerbooking.com/no/en-US/r919/hitchhiker-restaurant-sentralen-kafe
- https://www.superbexperience.com/experience-matters/community-norways-top-restaurants-stop-no-shows — https://helpcenter.superbexperience.com/en/article/how-to-work-with-superb-payments-1icc6jk/ — https://tech.eu/2021/06/08/copenhagen-based-guest-experience-management-platform-superb-raises-e12-million-in-series-a-round/ — https://getlatka.com/companies/superb
- https://resos.com/pricing/ — https://resos.com/sms-prices/ — https://resos.com/feature/gdpr-compliant/
- https://www.tablein.com/ — https://www.capterra.com/p/176260/Tablein-com/
- https://easytable.com/pricing/ — https://easytable.com/da/priser/ — https://www.crunchbase.com/organization/easytablebooking
- https://support.dinnerbooking.com/billing/understand-your-invoice/packages/ — https://biz.dinnerbooking.com/en-gb/prepayment/
- https://www.bookiopro.com/info/about — https://waitwhile.com/restaurant-waitlist/ — https://www.crunchbase.com/organization/waitwhile
- https://munu.cloud/product/booking/ — https://bookingtjeneste.no/en/vipps-checkout/
- https://vipps.no/news/2025/2/vipps-ti-aar — https://support.stripe.com/questions/protection-of-european-data-transfers
- https://www.yelp.com/biz/restaurant-ba53-oslo — https://www.olympen.no/

## Nøkkelfunn (agentens oppsummering)
- Oslo fine dining deler seg: Superb brukes av Kontrast og Hot Shop (bekreftet via kontrast./hotshop.superbexperience.com), Tock av Maaemo, SevenRooms av Ling Ling (Fursetgruppen/Hakkasan).
- Lava Oslo-gruppen (Eik-systemet: Katla, Hrimnir Ramen, Hitchhiker/Sentralen m.fl.) bruker DinnerBooking — bekreftet via dedikerte restaurantsider (r1836, r1838, r919) på dinnerbooking.com.
- BA53 og Olympen er stengt (hhv. Yelp feb. 2025 og olympen.no som søker nye drivere); begge brukte e-post/nettside for booking, ikke et kjent bookingsystem.
- Superb (København, GX-plattform): inngangspris ca. €79/mnd uten kommisjon per cover, men 5 % kommisjon på online-betalinger som no-show-gebyr og gavekort via Stripe; norske kunder (Kontrast, Substans, SAV) rapporterer no-show-fall fra 16 % til 0,8 %.
- Prisbildet for utfordrerne: resOS gratis→ca. $35–95/mnd (SMS €0,10/segment via Twilio), Tablein $49–177/mnd, easyTable ca. 499 DKK/€67/mnd, DinnerBooking pakkepris + betaling per 1 000 unike gjesteregistreringer (satser ikke offentlige).
- Bookio er i praksis irrelevant i Norden (primært Slovakia/Tsjekkia), og Waitwhile er et kø-/ventelistesystem (svenske gründere, SF-basert), ikke klassisk bordbooking.
- Ingen av de store bookingsystemene har dokumentert innebygd Vipps-betaling — et tydelig gap gitt at Vipps har ca. 4,6–4,7 millioner norske brukere (2025); norske generiske systemer som Bookingtjeneste.no har allerede Vipps Checkout.
- GDPR-nyanse: Superb og andre Stripe-baserte løsninger innebærer dataoverføring til USA (ingen EU-dataresidens hos Stripe, DPF/SCC + CLOUD Act); resOS er den som tydeligst markedsfører GDPR-etterlevelse; DinnerBookings prismodell viser at gjestedatabasen er kjernen i forretningsmodellen.
- Munu (Stavanger) er eneste norskbygde alt-i-ett-utfordrer (POS + booking, SMS/e-post, bygget for Norden); pris ikke offentlig.
- Forbehold: restaurantenes nettsider kunne ikke besøkes direkte fra dette miljøet — bruksfunnene er bekreftet via indekserte booking-URL-er, og OpenTable/TheFork-fraværet i Oslo er en antakelse basert på manglende treff.
