# Restaurantdrift og booking (2025/2026) — researchrapport

**Metodenotat:** All informasjon under er hentet via websøk (juli 2026). Direkte henting av enkeltsider (OpenTable, Tock, Eat App m.fl.) ble blokkert av proxy (HTTP 403), så tallene er sitert fra søkeresultat-sammendrag av kildene. Der en påstand kun står i én leverandørkilde (som har egeninteresse), er det markert. Skillet «Bekreftet» = tall som gjengis konsistent i flere uavhengige kilder; «Antakelse/leverandørtall» = enkeltkilde eller markedsføringstall.

---

## 1. No-show: statistikk og mottiltak med effekt-tall

### Omfang (bekreftet på tvers av flere kilder)
- Bransjesnittet for no-show ligger på **5–20 %** av reservasjoner, avhengig av format, prisnivå og om det kreves depositum. OpenTable-plattformens snitt er ca. **5–7 %** på en vanlig kveld; på høytrykkskvelder (nyttårsaften, Valentinsdagen, morsdag) rapporterer operatører **over 20 %** uten depositumskrav. Kilder: [Eat App](https://restaurant.eatapp.co/blog/restaurant-no-shows), [Checkless](https://checkless.io/blog/restaurant-reservations-no-shows-2026-solutions), [ToBeOut](https://blog.tobeout.com/restaurant-no-show-rate-what-its-really-costing-you/)
- Kostnad: et regneeksempel fra bransjen: 5 % no-show på 100 ukentlige reservasjoner ≈ **1 500 USD/uke, ~78 000 USD/år** for én restaurant. Globalt anslås no-shows å koste bransjen **~16 mrd. USD årlig** (mye sitert anslag, opprinnelig usikker primærkilde — behandle som størrelsesorden, ikke presist tall).

### Mottiltak med dokumentert effekt

| Tiltak | Effekt | Kilde/status |
|---|---|---|
| SMS/e-post-påminnelser (24 t før + samme dag, med én-klikks avbestilling) | 27–50 % reduksjon i no-shows; resOS oppgir **27 % i snitt**; flere kilder oppgir fall fra 15–20 % til ≤5 % | Leverandørtall, men konsistente på tvers: [resOS](https://resos.com/feature/table-booking-reminders/), [Hostie](https://www.hostie.ai/resources/ai-reservation-assistants-reduce-no-shows-sms-reminder-impact) |
| Kortreservasjon (credit card hold, gebyr kun ved no-show) | No-show-rate ned til **~3 %** (Tock-kunder, des. 2023–mars 2024) | Leverandørtall: [Tock](https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/), [Octotable](https://www.octotable.com/en/credit-card-warranty/) |
| Depositum | OpenTable: **57 % reduksjon** i no-shows, gjester **72 % mindre tilbøyelige** til å avbestille i siste liten; operatørdata viser no-show ned mot **~1,7 %**; case: fra 15 % til 1 % | Leverandørtall: [OpenTable](https://www.opentable.com/restaurant-solutions/resources/3-proven-payment-strategies-reduce-no-shows/), [Katalyst](https://www.katalystos.com/blog/how-to-reduce-restaurant-no-shows) |
| Full forhåndsbetaling (prepaid/billett-modell à la Tock) | **0,9 %** no-show (Tock-kunder samme periode); case fra 10–12 % til 2 % | Leverandørtall: [Tock](https://www.exploretock.com/join/resources/eliminate-no-shows-3-tock-tools/) |
| SMS-kanalvalg | SMS har **~98 % åpningsrate** mot ~20 % for e-post; 42 % av gjester sier SMS-påminnelse aktivt hindrer dem i å droppe bordet | [SendHub](https://www.sendhub.com/restaurant-sms-marketing-fill-tables-reduce-no-shows-build-loyalty/), [Tablein](https://www.tablein.com/blog/restaurant-sms-types) |

- Viktig praktisk innsikt (flere kilder): depositum trenger ikke dekke hele måltidet — **10–15 % av forventet regning er nok til å endre atferd**. Kortreservasjon uten trekk gir nesten samme effekt som depositum med lavere bookingfriksjon; full forhåndsbetaling gir lavest no-show, men brukes mest av tasting-meny/destinasjonsrestauranter.
- Beste praksis-«stige» (syntese, min antakelse basert på kildene): påminnelser til alle → kortreservasjon for helg/store grupper → depositum kun for høytrykksdatoer og 6+/8+ personer. [Toast om avbestillingsgebyr](https://pos.toasttab.com/blog/on-the-line/restaurant-reservation-cancellation-fees), [OpenTable om no-show-tall](https://www.opentable.com/restaurant-solutions/resources/no-show-diners-numbers/) (OpenTable hevder selv «forbedre no-show-tall med 40 %» med sine verktøy — leverandørtall).

## 2. Hvordan verter/hovmestere jobber med systemet i drift

### Service-visning (bekreftet mønster på tvers av Toast, SevenRooms, OpenTable, Hostme)
- Vertens arbeidsflate er én skjerm som kombinerer: **plantegning med fargekodet bordstatus** (ledig/opptatt/reservert/ryddes), **dagens reservasjonsliste i tidsrekkefølge**, **venteliste** og **gjestenotater/tags** (allergier, VIP, stamgjest, anledning). Kilder: [Toast Tables](https://support.toasttab.com/en/article/Using-Toast-Tables-Waitlist), [SevenRooms Table Management](https://sevenrooms.com/platform/table-management/), [Crewli](https://crewli.io/blog/restaurant-reservation-software)
- Verten gjør fire ting løpende: sjekker inn ankomster, setter gjester (dra reservasjon til bord), håndterer walk-ins mot venteliste, og flytter/kombinerer bord når planen sprekker.

### Pacing per 15 minutter (bekreftet)
- Standarden i bransjen er **«covers per 15-minutters vindu»**: systemet begrenser hvor mange gjester (ikke bord) som kan bookes i hvert kvarter per serviceperiode. OpenTables standardinnstilling er **30 covers per 15 min** — de fleste restauranter setter dette langt lavere (typisk kalibrert mot kjøkkenets kapasitet på pass). Kilder: [OpenTable flow controls](https://support.opentable.com/s/article/flow-controls?language=en_US), [Hostme cover pacing](https://help.hostmeapp.com/en/articles/4473275-understand-cover-pacing)
- Pacing er kjøkkenets vern, ikke salens: en 8-er som bestiller samtidig «treffer passet som tre bord på én gang» — derfor begrenses også store bord til f.eks. ett per 30-min-vindu. Kilde: [TheFoodyGram](https://www.thefoodygram.com/blogs/restaurant-resources/how-to-manage-restaurant-reservations/)

### Statusflyt gjennom måltidet (bekreftet)
- OpenTable bruker sekvensen **seated → starter → main → dessert → paid**, og statusene går kun fremover (kan ikke rulles tilbake). POS-integrasjoner (f.eks. Lightspeed) oppdaterer status automatisk ved at rettnummer i POS mappes til bordstatus — flere retter kan mappes til samme status. Kilder: [Lightspeed K-Series/OpenTable](https://k-series-support.lightspeedhq.com/hc/en-us/articles/4415755433627-Setting-up-the-OpenTable-integration), [Lightspeed/SevenRooms](https://k-series-support.lightspeedhq.com/hc/en-us/articles/23105693114651-Setting-up-the-SevenRooms-integration)
- Poenget med statusflyten er **turneringsprognose**: når verten ser «dessert» på et bord, vet hun at bordet frigjøres om ~20–30 min og kan love ventelisten et tidspunkt. SevenRooms viser i tillegg sanntidsforbruk per bord fra POS. Kilde: [SevenRooms](https://sevenrooms.com/platform/table-management/)
- **Antakelse (design-implikasjon):** manuell statussetting dør i praksis i travle skift — statusflyt fungerer best når POS driver den automatisk, med verten som kun korrigerer.

## 3. Beste praksis for bookingregler

### Vinduer/turn time (bekreftet)
- Sett turn time **per selskapsstørrelse, ikke ett globalt tall**: à la carte typisk **1,75–2 t**, tasting-meny **2,5–3 t**. Toast/Tasting Table: tidsgrenser er vanligvis **90 min–2 t for 2–5 personer**; case Bonnie's (Brooklyn): ≤8 personer = 2 t, større grupper = 3–4 t. Klokka starter ved reservasjonstidspunktet, ikke ankomst. Kilder: [Toast](https://pos.toasttab.com/blog/on-the-line/restaurant-reservation-etiquette), [Tasting Table](https://www.tastingtable.com/1645809/restaurant-reservation-time-limit/), [Tock blueprint-oppsett](https://tock.zendesk.com/hc/en-us/articles/360031223931-Setting-Reservation-Hours-and-Turn-Times-for-Blueprints)
- Bruk **egne data, ikke bransjesnitt**: mål faktiske turn times i to uker og kalibrer systemet etter dem. Kilde: [TheFoodyGram](https://www.thefoodygram.com/blogs/restaurant-resources/how-to-manage-restaurant-reservations/)

### Kapasitet og walk-ins (bekreftet)
- Sett online-kapasiteten **10–15 % under fysisk kapasitet** — buffer for service og walk-ins. Hold aktivt av bord/tidsrom til walk-ins. Kilder: [TheFoodyGram](https://www.thefoodygram.com/blogs/restaurant-resources/how-to-manage-restaurant-reservations/), [Eat App](https://restaurant.eatapp.co/blog/how-to-manage-reservations-at-a-restaurant)

### Store grupper (bekreftet)
- Vanlig grense for online-booking: **maks 6–8 personer**; større grupper må ringe/sende forespørsel (for meny, bordoppsett og betalingsvilkår). Krav om **48 t varsel** og **depositum/kortreservasjon for 6–8+** er standard. Begrens til **ett stort bord per 30-min-vindu**. Kilder: [Tasting Table](https://www.tastingtable.com/1651239/things-to-check-restaurant-reservation/), [Toast](https://pos.toasttab.com/blog/on-the-line/restaurant-reservation-etiquette)

### Åpningstider, sesong og skift (bekreftet mønster)
- Systemene modellerer dette som **«shifts»/serviceperioder** (lunsj/middag) med egne regler per periode: intervaller, pacing, turn times og siste bookbare slot. Anbefalt: bredere lunsjtilgjengelighet, strammere intervaller rundt middagsrushet, og **cutoff for siste slot tidlig nok til at kjøkkenet slipper ankomster rett før stengetid**. Sesongvariasjon (høysesong/lavsesong/skuldersesong) planlegges med egne skiftoppsett og datointervaller. Kilder: [Tableo](https://tableo.com/operations/seasonal-restaurant-booking-trends/), [Eat App](https://restaurant.eatapp.co/blog/how-to-manage-reservations-at-a-restaurant), [Toast waitlist-data](https://pos.toasttab.com/blog/on-the-line/restaurant-waitlist-data) (merk: tidlig-uke-bookinger vokser raskt, særlig tidlig kveld)

### Release av bord og forsentkomming (bekreftet)
- Bransjenorm: **15 min «grace period»** (noen 15–20) — etter det kan bordet markeres no-show og gis til ventelisten. Forsinket ankomst spiser av tidsvinduet (20 min for sent = 70 min igjen av 90). Avbestilling kreves typisk 24 t i forveien (30 min samme dag som absolutt minimum hos noen). Gjengangere med no-show kan avkreves forhåndsbetaling ved neste booking. Kilder: [OpenTable hjelpesenter](https://help.opentable.com/s/article/What-is-your-no-show-policy-1505261059461?language=en_US), [Tasting Table](https://www.tastingtable.com/1645809/restaurant-reservation-time-limit/), [Template.net-policyeksempler](https://www.template.net/edit-online/420813/restaurant-table-reservation-rules)
- **Antakelse (funksjonskrav):** et godt system trenger altså automatikk for: (a) auto-release av bord X min etter reservasjonstid uten innsjekk, (b) automatisk backfill fra venteliste, (c) «notify list» når fullbookede kvelder får avbestillinger.

## 4. UX-mønstre i bookingwidgeter som konverterer

### Struktur og steg (bekreftet mønster, effekt-tall er enkeltkilder)
- Standard flyt: **(1) dato → antall personer → tid, (2) kontaktinfo, (3) bekreftelse** — maks **4–5 steg**; færre steg = mindre frafall («krever verktøyet 4 steg der 2 holder, blør du leads»). Kilder: [Ralabs booking-UX](https://ralabs.org/blog/booking-ux-best-practices/), [Eat App widget-guide](https://restaurant.eatapp.co/how-to-guide-to-restaurant-booking-widgets-free)
- **Pop-up/innebygd widget** på egen side konverterer bedre enn å sende gjesten til ekstern bookingside (mindre frafall). [Tablein](https://www.tablein.com/blog/restaurant-booking-widget-examples)
- **CTA over folden** + **sticky «Reserver bord»-knapp på mobil** som følger scrollingen: «løft i tosifret prosent» rapportert. [FSR Magazine](https://www.fsrmagazine.com/feature/how-to-make-a-restaurant-booking-website-that-converts-guests/), [ION Hospitality](https://www.ionhospitality.com/2026/05/15/8-restaurant-website-must-haves-to-boost-bookings/)
- **Hastighet:** 1 sekunds ekstra lastetid ≈ **–7 % konvertering** (generelt web-tall, ikke restaurantspesifikt). Sosialt bevis («X bookinger denne uken») rapportert å øke fullføring med opptil 23 % (enkeltkilde, behandle med skepsis). [WiserNotify](https://wisernotify.com/blog/booking-widget-for-website/)
- **Felter:** navn, mobil, e-post — pluss valgfrie felt for anledning/allergier/kommentar. Mobilnummer er kritisk (SMS-påminnelser er hovedvåpenet mot no-show, jf. del 1). **Antakelse:** hvert obligatorisk ekstrafelt koster konvertering; alt utover navn+mobil bør være valgfritt. Vis alternative tider når ønsket slot er fullt, i stedet for blank «utsolgt».

### Kanaler utover widgeten (bekreftet)
- **Reserve with Google** gir i stor grad *inkrementelle* gjester: en 2026-studie (Hospitality Technology, sitert via Reslify) fant at widget-bookinger holdt seg flate mens totalvolum vokste ~30 % — Google-gjestene ville ikke besøkt nettsiden uansett. Access Group-case: 89 % bookingkonvertering via RwG og £1,21 mill. inkrementell årsomsetning (leverandørcase). Beste praksis 2026 er flerkanal: widget + Google + Instagram-DM/WhatsApp + telefon-AI. Kilder: [Reslify](https://reslify.com/en/blog/how-reserve-with-google-works/), [Access Group](https://www.theaccessgroup.com/en-gb/blog/hos-reserve-with-google-integrations/), [TableCheck](https://www.tablecheck.com/en/blog/increase-restaurant-reservations-reserve-with-google/)

## 5. Hva restaurantgrupper (flere restauranter, felles CRM) trenger spesielt

### Bekreftede behov/mønstre
- **Én gjesteprofil på tvers av alle steder** («cross-property guest recognition»): samme gjest gjenkjennes med preferanser, allergier, forbrukshistorikk og besøksmønster uansett hvilken restaurant i gruppen hun besøker. Dette er SevenRooms' hovedargument for enterprise-grupper (10+ steder); Eat App og CoverManager tilbyr det samme for mindre grupper. Kilder: [SevenRooms](https://sevenrooms.com/restaurants/), [Eat App multi-location](https://restaurant.eatapp.co/blog/best-reservation-system-for-multi-location-restaurants), [CoverManager](https://www.covermanager.com/en/who/groups-chains)
- **POS-data inn i profilen:** SevenRooms integrerer 65+ POS-systemer slik at hver transaksjon beriker gjesteprofilen (totalt forbruk, favorittretter, tips-nivå). [SevenRooms](https://sevenrooms.com/platform/table-management/)
- **Gruppe-rapportering:** samlet dashboard på tvers av steder (belegg, no-show, kanalfordeling, gjentaksrate), pluss mulighet for lokal markedsføring per sted fra samme database. [Birdeye](https://birdeye.com/blog/restaurant-crm/), [RestaurantBookingSystem.com](https://restaurantbookingsystem.com/best/reservation-systems-multi-location/)
- **Kryss-salg innad i gruppen:** når restaurant A er fullbooket, foreslå søsterrestaurant B; sentralt bookingteam/sentralbord som kan booke på tvers. (Omtalt hos CoverManager og Eat App.)
- **Prismodell betyr mye på gruppenivå (bekreftede listepriser 2025):** OpenTable **149/299/499 USD/mnd per sted** + **1,50 USD per cover** fra OpenTable-nettverket på Basic (1,00 på Core; egne kanaler gratis på Core/Pro). SevenRooms fra **~499 USD/mnd**, **0 per cover** — mer forutsigbart for høyvolumgrupper (ved 2 000 nettverks-covers/mnd kan OpenTable-gebyrene alene bli 2 000–3 500 USD/mnd). SevenRooms ble kjøpt av DoorDash for 1,2 mrd. USD (juni 2025); Tock slås sammen med Resy under Amex (migrering ferdig sommer 2026) — konsolidering pågår. Kilder: [Eat App OpenTable-pricing](https://restaurant.eatapp.co/blog/opentable-pricing), [Tekpon](https://tekpon.com/software/opentable/pricing/), [RestaurantTools.ai](https://restauranttools.ai/blog/best-restaurant-reservation-systems-2026), [US Tech Automations](https://ustechautomations.com/resources/blog/automate-sevenrooms-vs-tock-for-restaurants-2026)
- **Strategisk poeng (bekreftet argument i flere kilder):** grupper vil «eie gjestedataene» — per-cover-gebyrer på nettverksbookinger gir insentiv til å drive trafikk til *egen* widget/direktekanal, der bookingen er gratis og dataene er dine. GDPR-krav (samtykke per formål, sletterett) gjelder for felles CRM på tvers av juridiske enheter i en gruppe — **antakelse:** dette krever eksplisitt behandlingsgrunnlag/felles behandlingsansvar i Norge/EØS, og er et reelt salgsargument for systemer med god samtykkehåndtering.

### Antakelser (ikke direkte kildebelagt, men rimelige krav fra gruppene)
- Sentral styring av bookingregler med lokal overstyring (mal på gruppenivå, unntak per sted).
- Roller/tilganger: daglig leder ser alt for sitt sted; gruppe-CRM/marked ser aggregert; servitør ser kun kveldens liste.
- Felles svarteliste/«no-show-historikk» på tvers av steder er ønsket, men personvernmessig følsomt.

---

## Kort syntese for produktbygging
1. No-show-våpenet med best kost/nytte er **SMS-påminnelse med én-klikks avbestilling** (27–50 % reduksjon), deretter **kortreservasjon** (~3 %) og **depositum** (~1–2 %) for risikodatoer og store grupper.
2. Vertens kjerneskjerm = plantegning + tidslinje + venteliste + gjestenotater; pacing settes i **covers per 15 min**; statusflyten **seated → starter → main → dessert → paid** bør drives av POS, ikke manuelt.
3. Regelmotoren må ha: skift per sesong, turn time per selskapsstørrelse (90 min–2 t for 2–5, 3–4 t for 8+), maks 6–8 online, 10–15 % kapasitetsbuffer, siste-slot-cutoff, 15 min grace + auto-release.
4. Widget: 3 steg (dato/antall/tid → kontakt → bekreft), sticky mobil-CTA, alternative tider ved fullt, minimalt med obligatoriske felt — pluss Reserve with Google som inkrementell kanal.
5. Grupper kjøper: én gjesteprofil på tvers, POS-beriket CRM, gruppe-rapportering, kryss-salg mellom steder og forutsigbar pris uten per-cover-gebyr.

## Nøkkelfunn (agentens oppsummering)
- No-show ligger typisk på 5-20 % (OpenTable-snitt 5-7 %, over 20 % på høytrykkskvelder); anslått global kostnad ~16 mrd. USD/år.
- Effekt-stige mot no-show: SMS-påminnelser 27-50 % reduksjon, kortreservasjon gir ~3 % no-show (Tock-data), depositum ~1,7 % / 57 % reduksjon (OpenTable), full forhåndsbetaling 0,9 % - og 10-15 % av forventet regning i depositum er nok til å endre atferd.
- Verter styrer service via én skjerm: fargekodet plantegning + tidslinje + venteliste + gjestenotater; pacing settes som covers per 15-minutters vindu (OpenTable-default 30, settes normalt lavere).
- Statusflyten seated → starter → main → dessert → paid er de facto-standard (OpenTable/Lightspeed), går kun fremover, og bør drives automatisk fra POS (rettnummer mappes til status) for å forutsi når bord frigjøres.
- Bookingregler beste praksis: turn time per selskapsstørrelse (1,75-2 t à la carte, 2,5-3 t tasting; 8+ personer 3-4 t), maks 6-8 personer online, 48 t varsel + depositum for store grupper, ett stort bord per 30-min-vindu, online-kapasitet 10-15 % under fysisk kapasitet.
- Release-norm: 15 min grace period, deretter markeres no-show og bordet gis til ventelisten; forsinkelse spiser av tidsvinduet; gjengangere kan avkreves forhåndsbetaling.
- Widget-UX som konverterer: maks 3-5 steg (dato → antall → tid → kontakt), innebygd/pop-up fremfor ekstern side, sticky mobil-CTA (tosifret løft rapportert), 1 sek ekstra lastetid ≈ -7 % konvertering, minimalt med obligatoriske felt men mobilnummer er kritisk for SMS.
- Reserve with Google gir i hovedsak inkrementelle bookinger (~30 % volumvekst uten kannibalisering av widget, iflg. 2026-studie sitert av Reslify).
- Restaurantgrupper krever én gjesteprofil på tvers av steder, POS-beriket CRM (SevenRooms: 65+ POS-integrasjoner), gruppe-rapportering og kryss-salg mellom søsterrestauranter.
- Pris 2025: OpenTable 149-499 USD/mnd + 1,00-1,50 USD per nettverks-cover; SevenRooms fra ~499 USD/mnd uten cover-gebyr; konsolidering pågår (DoorDash kjøpte SevenRooms 2025, Tock+Resy slås sammen under Amex 2026).
