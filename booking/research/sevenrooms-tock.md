# SevenRooms vs. Tock — dyp analyse (status 2025/2026)

*Research-rapport, utarbeidet 28. juli 2026. Merk: Begge selskapenes egne nettsider (sevenrooms.com, exploretock.com) og flere tredjepartssider blokkerte direkte henting fra dette miljøet (HTTP 403), så detaljer er hentet via websøk mot de samme kildene. Der tall kun finnes fra tredjepart, er dette markert eksplisitt.*

---

## 1. Executive summary

- **SevenRooms** er en «guest experience & retention»-plattform: reservasjoner + bordstyring + dyp gjeste-CRM + marketing-automasjon, bygget rundt **direktebooking uten cover-fees**. Kjøpt av **DoorDash for 1,2 mrd. USD** (annonsert mai 2025, fullført 9. oktober 2025).
- **Tock** er pioneren på **forhåndsbetalte reservasjoner/ticketing** (grunnlagt av Nick Kokonas, Alinea). Kjøpt av **American Express for 400 mill. USD** (juni 2024). **Viktigst i 2026: Amex fusjonerer Tock inn i Resy** — forbrukerappen/nettsiden til Tock legges ned i løpet av sommeren 2026, mens restaurant-programvaren videreføres under Resy-paraplyen.
- **Killer features:** SevenRooms = auto-taggede gjesteprofiler (100+ datapunkter, POS-koblet forbruk) som driver automatisk, målbar markedsføring — og null provision per cover. Tock = betalingsforpliktelse ved booking (depositum/prepaid) som nesten eliminerer no-shows (snitt **1,7 %** no-show hos kunder med depositum) og gjør reservasjonen til et produkt som kan prises, tieres og selges.
- **Wisely** (kjøpt av **Olo** i 2021 for ~187 mill. USD) lever videre som **Olo Host + Olo Engage** (Guest Data Platform, Marketing, Sentiment) — relevant som «CRM-først»-konkurrent, særlig for kjeder. Olo ble selv tatt privat av Thoma Bravo i september 2025 (~2 mrd. USD).

---

## 2. SevenRooms

### 2.1 Eierskap og skala (bekreftet)
- DoorDash annonserte oppkjøp 6. mai 2025 (1,2 mrd. USD kontant); fullført 9. oktober 2025. Begrunnelse: hjelpe restauranter å vokse *in-store*, ikke bare levering — SevenRooms blir del av DoorDashs «commerce platform». Kilder: [CNBC](https://www.cnbc.com/2025/05/06/doordash-announces-1point2billion-sevenrooms-deal-misses-revenue-expectations.html), [Restaurant Dive](https://www.restaurantdive.com/news/DoorDash-acquires-sevenrooms-1-billion/747226/), [DoorDash IR](https://ir.doordash.com/news/news-details/2025/DoorDash-Announces-Agreement-to-Acquire-SevenRooms-to-Enhance-Commerce-Platform-Offerings/default.aspx), [DoorDash (fullført)](https://about.doordash.com/en-us/news/doordash-completes-acquisition-of-sevenrooms).
- Skala: 13 000+ venues globalt (2025, opp fra 10 000+ i 2024); omsetning rapportert til ~43 mill. USD i 2024 (opp fra 24,9 mill. i 2023 — tredjepartstall fra [Latka](https://getlatka.com/companies/sevenrooms), behandles som estimat). Kunder: restauranter, hoteller (F&B), nattklubber, barer, vingårder m.m. ([SevenRooms presse](https://sevenrooms.com/press/2025-US-data-report/)).
- Etter oppkjøpet kobles SevenRooms-restauranter til DoorDash/Deliveroo sin reservasjons-marketplace (rapportert av [RestaurantTools.ai](https://restauranttools.ai/tools/sevenrooms)).

### 2.2 CRM og gjesteprofiler (bekreftet fra produktsider/omtaler)
- Bygger automatisk rike gjesteprofiler med **100+ datapunkter per gjest**: besøkshistorikk, preferanser, allergier, bestillingshistorikk og **sanntids POS-forbruk** (integrasjoner mot bl.a. Oracle Micros, Toast osv.). ([sevenrooms.com/platform/crm/](https://sevenrooms.com/platform/crm/))
- **Tags og Auto-tags:** ferdig «best practice»-bibliotek pluss egendefinerte, regelbaserte auto-tags som settes automatisk ut fra atferd, preferanser og forbruk — f.eks. «wine lover», «steak lover», «positive reviewer», «dairy allergy», «takeout regular». Tags brukes både i service (host/servitør ser dem ved bordet) og i markedsføring (segmentering).
- Full **eierskap til gjestedataene** hos restauranten — et hovedargument mot OpenTable-modellen der gjesten «tilhører» plattformen.

### 2.3 Marketing-automasjon (bekreftet)
- Automatiserte e-postløp (13+ bransjetestede maler): post-visit-e-post, vinn-tilbake, bursdag, VIP osv.; i Growth/Premium-pakkene kan man bygge egne automasjoner mot auto-taggede segmenter. ([sevenrooms.com/platform/marketing-automation/](https://sevenrooms.com/platform/marketing-automation/))
- Integrert e-postmarkedsføring (lansert 2023) med attribusjon: viser reservasjoner, covers og **omsetning per e-post**. SevenRooms hevder kundene i snitt har **~70 % åpningsrate** (egenrapportert markedsføringstall — behandles med forbehold). ([presse](https://sevenrooms.com/press/sevenrooms-expands-marketing-suite-with-integrated-email-marketing/), [PRNewswire](https://www.prnewswire.com/news-releases/sevenrooms-expands-marketing-suite-with-integrated-email-marketing-301770704.html))
- Tilleggskanaler: WhatsApp-broadcasts og tekst-markedsføring, Voice AI — priset som separate add-ons. ([theprimeads.com-omtale](https://theprimeads.com/sevenrooms-restaurant-guide/))
- Automatisk gjenfylling av avbestilte bord: varsler high-value-gjester når bord frigjøres. ([sevenrooms.com/platform/reservations-waitlist/](https://sevenrooms.com/platform/reservations-waitlist/))

### 2.4 Direktebooking uten cover-fees (bekreftet)
- Bookingwidget på egen nettside + kanaler som Google (Reserve with Google), Instagram/Facebook m.fl. — **ingen provision/cover-fee på direktebookinger**. Forutsigbar fast månedspris i stedet for per-cover-avgift (kontrast til OpenTable). ([sevenrooms.com/pricing/](https://sevenrooms.com/pricing/), [Capterra](https://www.capterra.com/p/165480/SevenRooms/))

### 2.5 Table management og upsells (bekreftet)
- Full bordstyring: gulvplan, ventelister, turn-times, server-seksjoner, no-show-håndtering.
- **Upsells-modul:** forhåndsbetalte tillegg ved booking (velkomstdrink, kake, champagne, opplevelsespakker), ticketede eventer og prepayments — betaling er bygget inn i bookingflyten. ([sevenrooms.com](https://sevenrooms.com/platform/reservations-waitlist/), [RestaurantTools.ai](https://restauranttools.ai/tools/sevenrooms))

### 2.6 Priser (delvis bekreftet — SevenRooms publiserer IKKE priser)
- **Bekreftet:** Kun tilbudsbasert prising; tre tier-nivåer rapportert som **Starter / Growth / Premium**; add-ons (Email Marketing, WhatsApp/Text, Voice AI, Online Ordering) prises separat. ([sevenrooms.com/pricing/](https://sevenrooms.com/pricing/), [restaurantbookingsystem.com](https://restaurantbookingsystem.com/compare/sevenrooms-pricing/))
- **Tredjepartsestimater (ANTAKELSER, ikke offisielle):** kjerneplattform ~**499 USD/mnd per venue** (~5 988 USD/år); kunde-rapporterte tilbud 2024–2026 på **300–500+ USD/lokasjon/mnd** for lavere tier, **500–1 000+ USD** for full enterprise; implementeringsgebyr **5 000–25 000 USD**; årskontrakter standard. ([restaurantbookingsystem.com](https://restaurantbookingsystem.com/compare/sevenrooms-pricing/), [Software Finder](https://softwarefinder.com/retail/sevenrooms), [TrustRadius](https://www.trustradius.com/products/sevenrooms/pricing))

### 2.7 Styrker / svakheter
**Styrker:** dypest CRM i kategorien (POS-koblet forbruk + auto-tags); markedsføring med omsetningsattribusjon; null cover-fees og full dataeierskap; bredt bruksområde (restaurant, hotell, nattklubb); global tilstedeværelse; nå DoorDash-distribusjon i ryggen.
**Svakheter (fra G2/Capterra/omtaler):** bratt læringskurve (1–2 mnd. til full mestring); oppfattes som **dyrt for små steder** og prisene er ikke transparente; kompleks onboarding (gulvplan, opplæring); enkelte rapporterer bugs og POS-integrasjonstrøbbel (Oracle Micros); rotete UI ifølge noen brukere; **ingen egen forbruker-marketplace/discovery** (du må skape egen etterspørsel — dette kan endres med DoorDash). ([G2 pros/cons](https://www.g2.com/products/sevenrooms/reviews?page=3&qs=pros-and-cons), [thehotelgm.com](https://thehotelgm.com/tools/seven-rooms-review/), [aleno.me](https://www.aleno.me/en/blog/sevenrooms-alternative))

### 2.8 Passer for
Restauranter/grupper som **allerede har egen etterspørsel** og vil eie gjestedataene: fine dining og premium casual, hotell-F&B, grupper/kjeder med flere venues, nattklubb/bar med VIP-logikk. Dårlig match for små enkeltrestauranter med stramt budsjett eller steder som primært trenger discovery-trafikk.

### 2.9 Killer features (oppsummert)
1. Auto-taggede gjesteprofiler med POS-forbruksdata (CRM-en er selve produktet).
2. Marketing-automasjon med krone-og-øre-attribusjon per utsendelse.
3. Null cover-fees + dataeierskap (fast pris, forutsigbar økonomi).
4. Upsells i bookingflyten (inkrementell omsetning per cover).

---

## 3. Tock

### 3.1 Eierskap og strategisk status (bekreftet — kritisk for 2026)
- Grunnlagt 2014/2015 av Nick Kokonas (Alinea-gruppen); solgt til Squarespace i 2021 (~400 mill. USD), videresolgt til **American Express for 400 mill. USD** (annonsert 21. juni 2024). Amex eier også Resy (siden 2019). ([Squarespace IR](https://investors.squarespace.com/news-events-financials/investor-news/news-details/2024/Squarespace-Agrees-to-Sell-Tock-Platform-to-American-Express-for-400-Million/default.aspx), [Restaurant Business](https://www.restaurantbusinessonline.com/technology/american-express-acquiring-tock-squarespace-400m))
- **Februar 2026: Amex annonserte at Tock fusjoneres inn i Resy innen sommeren 2026.** Tocks forbrukerapp og nettside legges ned; Tocks ~8 000 bookbare venues (inkl. ~1 200 vingårder) flyttes gradvis inn i Resy, som dermed dobles til 25 000+ venues (mot OpenTables 60 000+). Tock-funksjoner som **tierede experiences og prepaid bookinger tas med inn i Resy**, og Tock-venues begynner å ta imot Amex' Resy-dining-credit i 2026. Restaurant-programvaren («restaurant management software») skal fortsette å operere som del av Resy. ([Restaurant Business](https://www.restaurantbusinessonline.com/technology/reservation-services-resy-tock-are-merging), [Fast Company](https://www.fastcompany.com/91496951/amex-resy-tock-restaurant-reservation-wars), [Thrifty Traveler](https://thriftytraveler.com/news/credit-card/amex-resy-tock-integration-dining-credits/), [Resy CEO-brev](https://blog.resy.com/newsroom/resy-tock-update-ceo-pablo-rivero/), [Expedite](https://www.expedite.news/p/pour-one-out-for-tock))
- August 2025: strategisk Amex–**Toast**-partnerskap — Resy/Tock-gjestedata («guestbook») vises på Toast Go-håndholdte/POS via «Digital Chits». ([BusinessWire](https://www.businesswire.com/news/home/20250805785771/en/American-Express-and-Toast-Announce-Strategic-Partnership-to-Help-Elevate-Hospitality-Experiences/))

### 3.2 Kjernemodellen: reservasjonen som produkt (bekreftet)
- **Prepaid/ticketing:** gjesten betaler hele menyprisen ved booking (som en konsert-billett). Ingen bookingavgift for gjesten fra Tock. ([reservationfinder.io-guide](https://www.reservationfinder.io/guides/tock-guide))
- **Depositum:** valgfritt beløp (helt ned til 5 USD; typisk 25–100 USD per person) trekkes ved booking og krediteres regningen. Tock anbefaler depositum på så lite som ~10 % av forventet snittregning. ([Tock deposits](https://www.exploretock.com/join/resources/deposit-for-restaurant-reservation-booking/), [Tock no-shows](https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/))
- **Fleksibel miks:** samme restaurant kan samtidig selge gratis reservasjoner (patio), depositums-bookinger (helligdager) og fullt forhåndsbetalte experiences (chef's counter, vinsmaking, kokkekurs). ([exploretock.com/join](https://www.exploretock.com/join/))
- **Dokumentert effekt:** kunder som tok depositum hadde i snitt **1,7 % no-show**; én kunde halverte no-shows etter innføring av depositum (Tocks egne tall — egenrapportert, men konsistent på tvers av kilder).

### 3.3 Priser (tredjeparts-rapportert — Tock publiserer planene, men siden var utilgjengelig herfra)
Rapportert struktur (fra [The Restaurant HQ](https://www.therestauranthq.com/technology/tock-to-go-review/), [G2](https://www.g2.com/products/tock/pricing), [TrustRadius](https://www.trustradius.com/products/tock/pricing), [Perfect Venue](https://www.perfectvenue.com/post/tock-vs-opentable), [Capterra](https://www.capterra.com/p/157947/Tock/)):
- **Intro:** 0 USD/mnd, men **3 % av prepaid-omsetningen**; kun ticketede eventer (ikke gratis reservasjoner/bordstyring); kun e-postsupport.
- **Plus:** **199 USD/mnd + 2 %** på prepaid; full reservasjons-, bord-, event-, takeout- og gjestehåndtering, ubegrensede covers/brukere/enheter; 24/7 telefonsupport.
- **Pro:** **699 USD/mnd, 0 %** prepaid-fee (noen kilder oppgir 769 USD — spennet 79–769 USD går igjen i G2/Capterra; avvikene skyldes trolig ulike årganger/markeder). Egen «Premium»-eventplan med 3 % per transaksjon og 2 % servicegebyr på takeout/experience-bookinger er også omtalt.
- **ANTAKELSE:** Prisene kan være endret under Amex, og etter Resy-fusjonen (sommeren 2026) er det uklart hvilken prisliste som gjelder videre. Behandle tallene som historiske referansepunkter, ikke gjeldende tilbud.

### 3.4 Styrker / svakheter
**Styrker:** best-i-klassen på forpliktede bookinger (kontantstrøm på forhånd, nesten null no-show); experiences/ticketing som ingen andre gjorde like godt; sterk i vinland (Napa/Sonoma m.m.), pop-ups, tasting menus; ingen per-cover-fees på gratis-reservasjoner; gjesten betaler ingen bookingavgift.
**Svakheter:** **liten forbruker-audience** — Tock er ikke et discovery-verktøy; mindre egnet for høyvolums «daily covers»-restauranter; prepaid-modellen passer dårlig for casual dining; G2-score under OpenTable på totaltilfredshet; og fremfor alt: **merkevaren/appen forsvinner inn i Resy i 2026**, med migrasjonsrisiko og usikkerhet for eksisterende kunder. ([eatapp.co](https://restaurant.eatapp.co/blog/tock-vs-opentable), [tryperdiem.com](https://www.tryperdiem.com/post/opentable-resy-and-tock-compared), [DCRS](https://dcrs.com/2025/04/09/no-reservations-comparison-of-restaurant-reservation-systems-2/))

### 3.5 Passer for
Destinasjonsrestauranter med tasting menu/prix fixe, chef's counters, vingårder og smaksrom, pop-ups, eventdrevne konsepter, steder med lange ventelister der etterspørselen overstiger kapasiteten. Ikke for volumdrevne bistroer/casual-steder som trenger discovery.

### 3.6 Killer features (oppsummert)
1. Prepaid reservations/ticketing — reservasjonen blir omsettelig vare med dynamisk prising (billigere tirsdag kl. 17, dyrere lørdag kl. 20).
2. Depositum-motoren → ~1,7 % no-show.
3. Experiences-katalogen (tierede opplevelser side om side med vanlige bord).
4. (Fremover) Amex-økosystemet: Resy-distribusjon, dining credits, Toast-integrasjon.

---

## 4. Wisely / Olo (kort, for kontekst)

- **Bekreftet:** Olo kjøpte Wisely i november 2021 for ~187 mill. USD. Teknologien selges nå som **Olo Host** (reservasjoner/venteliste/bordstyring) og **Olo Engage** (Guest Data Platform, Marketing, Sentiment). getwisely.com peker til Olo. Olo ble kjøpt av Thoma Bravo i september 2025 for ~2 mrd. USD. ([Olo IR](https://investors.olo.com/news/news-details/2021/Olo-to-Acquire-Wisely-a-Leading-Customer-Intelligence-and-Engagement-Platform-for-Restaurants/default.aspx), [Restaurant Dive](https://www.restaurantdive.com/news/olo-buys-wisely-for-187m/608726/), [RestaurantTools.ai](https://restauranttools.ai/tools/wisely))
- **Relevans:** Wisely var «CRM-først»-tenkningen tatt lengst — en restaurant-CDP som samler POS-, reservasjons- og bestillingsdata på tvers, med automatisert livssyklus-markedsføring og sentimentmåling. Retter seg i praksis mot **kjeder/enterprise** (Olos kundebase), ikke uavhengige finrestauranter. Bekrefter bransjetrenden alle tre aktørene rir på: gjestedata + automatisering er verdidriveren, reservasjonen er bare inngangsdøren.

---

## 5. Sammenligning

| Dimensjon | SevenRooms | Tock |
|---|---|---|
| Eier (2026) | DoorDash (okt. 2025, 1,2 mrd. USD) | American Express (2024, 400 mill. USD) — fusjoneres inn i Resy sommeren 2026 |
| Kjerneidé | Eie gjestedata → drive gjenbesøk | Forplikte gjesten økonomisk → eliminere no-show, sikre kontantstrøm |
| CRM | Dypest: 100+ datapunkter, auto-tags, POS-forbruk | Gjestehåndtering finnes, men CRM er ikke differensiatoren |
| Marketing | Automatiserte løp, e-post m/omsetningsattribusjon, WhatsApp | Begrenset; styrken ligger i selve bookingproduktet |
| Prepaid/depositum | Støttes (upsells, prepayments, ticketed events) | Kjerneproduktet; mest modent i markedet |
| Cover-fees | Ingen på direktebooking; fast månedspris | Ingen per-cover; % på prepaid-omsetning (0–3 % etter plan) |
| Pris (rapportert) | Tilbudsbasert; ~300–1 000+ USD/venue/mnd + add-ons + implementering | 0–699(–769) USD/mnd + 0–3 % prepaid-fee |
| Discovery | Nei (men DoorDash-marketplace kommer) | Svak → blir Resy-appen fra 2026 |
| Ideell kunde | Grupper, hotell-F&B, premium-restauranter med egen etterspørsel | Destinasjonsrestauranter, tasting menus, vingårder, eventkonsepter |

## 6. Skille: bekreftet vs. antakelse

**Bekreftet (flere uavhengige kilder):** eierskapshistorikk og beløp (DoorDash/SevenRooms 1,2 mrd.; Amex/Tock 400 mill.; Olo/Wisely 187 mill.; Thoma Bravo/Olo ~2 mrd.); Resy–Tock-fusjonen og nedleggelse av Tock-appen (annonsert feb. 2026, gjennomføres sommeren 2026); SevenRooms' auto-tags, POS-integrert CRM, no-cover-fee-modell; Tocks depositum/prepaid-mekanikk og planstruktur Intro/Plus/Pro.
**Egenrapporterte leverandørtall (forbehold):** 70 % e-poståpningsrate (SevenRooms), 1,7 % no-show (Tock), 13 000+ venues (SevenRooms).
**Antakelser/estimater:** alle konkrete SevenRooms-priser (tilbudsbasert, tredjepartsestimat); at Tocks prisliste består uendret gjennom Resy-migrasjonen; SevenRooms-omsetning 43 mill. USD (Latka-estimat); nøyaktig hvordan DoorDash-marketplace-distribusjonen vil fungere for SevenRooms-kunder.

## 7. Kilder (hoved-URL-er)

- https://sevenrooms.com/pricing/ · https://sevenrooms.com/platform/crm/ · https://sevenrooms.com/platform/marketing-automation/ · https://sevenrooms.com/press/sevenrooms-expands-marketing-suite-with-integrated-email-marketing/
- https://www.cnbc.com/2025/05/06/doordash-announces-1point2billion-sevenrooms-deal-misses-revenue-expectations.html · https://about.doordash.com/en-us/news/doordash-completes-acquisition-of-sevenrooms · https://www.restaurantdive.com/news/DoorDash-acquires-sevenrooms-1-billion/747226/
- https://restaurantbookingsystem.com/compare/sevenrooms-pricing/ · https://restauranttools.ai/tools/sevenrooms · https://www.g2.com/products/sevenrooms/reviews · https://www.capterra.com/p/165480/SevenRooms/ · https://thehotelgm.com/tools/seven-rooms-review/ · https://getlatka.com/companies/sevenrooms
- https://www.exploretock.com/join/pricing/ · https://www.exploretock.com/join/resources/deposit-for-restaurant-reservation-booking/ · https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/ · https://www.reservationfinder.io/guides/tock-guide
- https://www.therestauranthq.com/technology/tock-to-go-review/ · https://www.g2.com/products/tock/pricing · https://www.trustradius.com/products/tock/pricing · https://www.perfectvenue.com/post/tock-vs-opentable · https://restaurant.eatapp.co/blog/tock-vs-opentable · https://www.tryperdiem.com/post/opentable-resy-and-tock-compared
- https://investors.squarespace.com/news-events-financials/investor-news/news-details/2024/Squarespace-Agrees-to-Sell-Tock-Platform-to-American-Express-for-400-Million/default.aspx · https://www.restaurantbusinessonline.com/technology/reservation-services-resy-tock-are-merging · https://www.fastcompany.com/91496951/amex-resy-tock-restaurant-reservation-wars · https://blog.resy.com/newsroom/resy-tock-update-ceo-pablo-rivero/ · https://thriftytraveler.com/news/credit-card/amex-resy-tock-integration-dining-credits/ · https://www.expedite.news/p/pour-one-out-for-tock · https://www.businesswire.com/news/home/20250805785771/en/American-Express-and-Toast-Announce-Strategic-Partnership-to-Help-Elevate-Hospitality-Experiences/ · https://www.forbes.com/sites/caitlinpalumbo/2025/07/14/tock-looks-back-on-and-celebrates-10-years-as-an-industry-disruptor/
- https://investors.olo.com/news/news-details/2021/Olo-to-Acquire-Wisely-a-Leading-Customer-Intelligence-and-Engagement-Platform-for-Restaurants/default.aspx · https://www.restaurantdive.com/news/olo-buys-wisely-for-187m/608726/ · https://restauranttools.ai/tools/wisely

## Nøkkelfunn (agentens oppsummering)
- SevenRooms ble kjøpt av DoorDash for 1,2 mrd. USD (annonsert mai 2025, fullført oktober 2025) og kobles nå til DoorDash/Deliveroos reservasjons-marketplace.
- Tock ble kjøpt av American Express for 400 mill. USD i 2024, og i februar 2026 annonserte Amex at Tock fusjoneres inn i Resy sommeren 2026 — Tock-appen/nettsiden legges ned, mens restaurantprogramvaren og funksjoner som prepaid og tierede experiences videreføres i Resy.
- SevenRooms' killer feature er CRM-en: gjesteprofiler med 100+ datapunkter inkl. POS-forbruk, automatiske regelbaserte auto-tags (f.eks. «wine lover», «dairy allergy») som driver segmentert marketing-automasjon med omsetningsattribusjon per e-post.
- SevenRooms tar null cover-fees på direktebookinger og gir restauranten full dataeierskap, men publiserer ikke priser — tredjepartsestimater ligger på ca. 300–1 000+ USD per venue/mnd pluss add-ons og 5 000–25 000 USD i implementering (antakelse, ikke offisielt).
- Tocks killer feature er betalingsforpliktelse ved booking: prepaid/ticketing, depositum (ned til 5 USD, typisk 25–100 USD/person) og kortholds — kunder med depositum har i snitt 1,7 % no-show (Tocks egne tall).
- Tocks rapporterte prisplaner: Intro 0 USD/mnd + 3 % av prepaid-omsetning, Plus 199 USD/mnd + 2 %, Pro 699 USD/mnd med 0 % — tall fra tredjepart og kan være endret under Amex/Resy-overgangen.
- SevenRooms passer best for premium-restauranter, grupper og hotell-F&B med egen etterspørsel; hovedkritikk er bratt læringskurve, høy og lite transparent pris og kompleks onboarding.
- Tock passer best for destinasjonsrestauranter, tasting menus, chef's counters og vingårder (~1 200 vingårder på plattformen); svakheten er liten forbruker-audience og at modellen passer dårlig for høyvolums casual dining.
- Wisely lever videre som Olo Host + Olo Engage etter Olos oppkjøp i 2021 (~187 mill. USD) og retter seg mot kjeder/enterprise; Olo ble selv tatt privat av Thoma Bravo i september 2025 for ca. 2 mrd. USD.
- Bransjetrend på tvers av alle aktørene: gjestedata + automatisering er verdidriveren — reservasjonen er bare inngangsdøren, og alle tre er nå eid av større økosystemer (DoorDash, Amex, Thoma Bravo/Olo).
