# Research-rapport: Å bygge et eget restaurant-bookingsystem (2025/2026)

Rapporten dekker seks temaer: åpen kildekode-alternativer, kjernealgoritmen, Reserve with Google, SMS/e-post i Norge, betaling for depositum/no-show, GDPR — og en ærlig vurdering av arbeidsmengden for et MVP. Bekreftede fakta er merket med kilder; alt annet er eksplisitt merket som antakelse eller «bør verifiseres».

---

## 1. Åpen kildekode-alternativer og modenhet

Kort oppsummert: det finnes **ingen moden, vedlikeholdt åpen kildekode-erstatning for OpenTable/resOS** med ordentlig bordkart, bordallokering og gjestehåndtering. Landskapet er studentprosjekter, WordPress-plugins og ett stort prosjekt (TastyIgniter) der reservasjon er en bimodul.

| Prosjekt | Teknologi | Status (verifisert via GitHub, juli 2026) | Vurdering |
|---|---|---|---|
| [TastyIgniter](https://github.com/tastyigniter/TastyIgniter) | PHP/Laravel, MIT-lisens | 3 677 stjerner, 1 158 forks, aktivt vedlikeholdt (siste oppdatering 28.07.2026), startet 2014 | Mest modne alternativet. MEN: hovedfokus er nettbestilling av mat; bordreservasjon er en enklere modul (tid + antall gjester + bordtildeling), ikke et fullt «table management»-verktøy à la OpenTable. |
| [openresto](https://github.com/karanshukla/openresto) | .NET/EF Core + React Native/Expo, selvhostet | 74 stjerner, startet **januar 2026**, aktiv | Renest konsept: kun booking, flere restauranter per instans, egen e-post for kundekommunikasjon, mobilvennlig. Men svært ungt — ikke produksjonsmodent ennå. |
| [vanadiuz/table-reservation](https://github.com/vanadiuz/table-reservation) | WordPress-plugin, Vue | 108 stjerner, 56 åpne issues | WordPress-avhengig, halvdødt vedlikehold. |
| [SeatFrenzy](https://github.com/pjborowiecki/SEAT-FRENZY-Restaurant-Table-Booking-System) | Next.js 14, Drizzle, MySQL | 48 stjerner, merket «work in progress» | Demoprosjekt/portefølje, ikke produkt. |
| Diverse ([Vijayrengaraj](https://github.com/Vijayrengaraj/Restaurant-Table-Booking-System), [slavyanHristov](https://github.com/slavyanHristov/restaurant-table-reservation-system), [Brad-Galindo](https://github.com/Brad-Galindo/Resturant-Reservation-System) m.fl.) | PHP/Vue/Node | < 60 stjerner | Skoleprosjekter. Nyttige som referanse for datamodell, ikke som grunnmur. |

**Om «Cal.com-sporet»:** [Cal.com](https://github.com/calcom/cal.com) er stort og modent, men modellerer *personers kalendere og avtaler* (1:1-slots), ikke *ressursallokering av bord med kombinasjoner og varighet per selskapstørrelse*. Å bøye Cal.com til restaurantbruk gir feil datamodell i kjernen (antakelse basert på kjennskap til Cal.com-arkitekturen, ikke testet her). Konklusjonen gjelder tilsvarende for generiske booking-verktøy (Easy!Appointments o.l.).

**Konklusjon punkt 1 (vurdering):** Åpen kildekode gir deg gratis *referanser* og kanskje en admin-skall (TastyIgniter), men kjernen — bordallokering og kapasitetsstyring — må du uansett bygge selv om du vil konkurrere med kommersielle system.

---

## 2. Kjernealgoritmen: slots, bordallokering, kapasitet

Dette er godt beskrevet i forskningslitteratur og patenter (bekreftede kilder):

**Slot-generering** ([US-patent 10,037,585, Systems and methods for managing table and seating use](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10037585)):
- Del driftsdagen i skift (lunsj/middag), del skiftene i intervaller på 15 eller 30 min.
- Hver reservasjon har **antatt varighet avhengig av selskapstørrelse** (typisk 90 min for 2, 120 min for 4–6, 150+ for større — tallene her er bransjepraksis, antakelse).
- En slot er ledig hvis det finnes et bord (eller en gyldig bordkombinasjon) som er ubooket i hele intervallet [starttid, starttid + varighet].

**Bordallokering** — kjente tilnærminger, fra enkel til avansert:
1. **Grådig «best fit»** (MVP-nivå): sorter bord etter kapasitet, velg det minste bordet ≥ selskapstørrelse som er ledig i hele vinduet. Dette er det de fleste kommersielle systemer faktisk gjør som standard, og det holder langt.
2. **Bordkombinasjoner**: definer eksplisitt hvilke bord som kan slås sammen (graf av kombinerbare bord). Forskning viser at kombinerbare bord vs. dedikerte bord er en klassisk avveining ([Kimes/Thompson-tradisjonen, «Optimizing a restaurant's seating capacity»](https://www.researchgate.net/publication/247273890_Optimizing_a_restaurant's_seating_capacity_Use_dedicated_or_combinable_tables), samt [«Restaurant reservation management considering table combination», SciELO](https://www.scielo.br/j/pope/a/bkBQnG3YtpX37nKYSzpKhvP/)). Sistnevnte modellerer det som et heltallsprogrammeringsproblem (MIP) og viser at fleksibel tildeling (tilby nabo-tidspunkt, minimere ubrukte seter) kan gi **~25 % bedre setebruk** enn naiv tildeling.
3. **Yield management / dynamisk programmering**: aksepter/avvis-beslutninger basert på forventet fremtidig etterspørsel (ADP) — beskrevet i bl.a. [Claremont-avhandlingen «Optimizing Restaurant Reservation Scheduling»](https://scholarship.claremont.edu/cgi/viewcontent.cgi?article=1022&context=hmc_theses). Dette er overkill for MVP.

**Kapasitetsstyring i praksis** (bransjepraksis, delvis fra [mydigimenu-guiden](https://www.mydigimenu.com/post/step-by-step-table-reservation-optimize-restaurant-booking) og [hostie.ai-case](https://hostie.ai/resources/san-francisco-bistro-ai-reservation-optimization-case-study)):
- «Pacing»: maks antall nye bord/gjester per 15-min-intervall (skjermer kjøkkenet), uavhengig av fysisk bordkapasitet.
- Hold igjen store bord for store selskap til sent i vinduet; slipp dem til små selskap først når alternativene er brukt.
- Buffer for walk-ins (f.eks. X % av bordene aldri bookbare online).

**Ærlig vurdering:** MVP-algoritmen (grådig best-fit + eksplisitte kombinasjoner + pacing) er **noen hundre linjer kode** og 1–2 ukers arbeid inkl. tester. Det vanskelige er ikke algoritmen, men kantene rundt: endringer i sanntid, samtidighet (to gjester booker samme slot), varighet som varierer, og at restauranten vil overstyre alt manuelt.

---

## 3. Reserve with Google — kan et egenbygd system integreres?

**Ja, teknisk — men programmet er laget for plattformer, ikke enkeltrestauranter.** Bekreftet fra [Googles Actions Center-dokumentasjon](https://developers.google.com/actions-center/verticals/reservations/e2e/overview) og [plattform-policyene](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/platform-policies):

- Partneren må være en **B2B-plattform som håndterer bookinger for flere virksomheter («merchants»)**, med **direkte kontraktsforhold til hver merchant**, og merchant-listen må matche Google Maps-oppføringer. En enkeltrestaurant kan ikke integrere direkte; den går via en partner ([kilde](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/integration-policies)).
- Tekniske krav (End-to-End): feeds for merchants/tjenester/tilgjengelighet + en **booking-server** som implementerer `HealthCheck`, `BatchAvailabilityLookup`, `CreateBooking`, `UpdateBooking` — og Googles oppslag må besvares på **under ett sekund**. Online kansellering må støttes. ([Overview](https://developers.google.com/actions-center/verticals/reservations/e2e/overview))
- Prosess: partner-interesseskjema → sandbox i Actions Center → Googles gjennomgang/sertifisering → lansering. Valgfrie tillegg: venteliste, betaling-redirect, menyer.
- Kommersielle aktører bekrefter at integrasjonen i seg selv er gratis fra Googles side (ingen provisjon per booking) — se f.eks. [Tableo](https://tableo.com/reserve-with-google/) og [resOS](https://resos.com/feature/reserve-with-google/), som selger RwG som funksjon. **Antakelse/bør verifiseres:** at Google ikke tar gebyr; det stemmer med all sekundærdokumentasjon, men Google publiserer ikke en prisliste.

**Praktisk konsekvens:** Bygger du systemet for **én** restaurant, får du sannsynligvis ikke E2E-partnerskap (kravet er «multiple merchants»/plattform). Bygger du en plattform for flere restauranter, er det realistisk, men regn med uker–måneder med feed-bygging, sertifisering og Googles gjennomgang. Enklere alternativ som finnes i samme program: «Business Links» (Reserve-knapp som lenker til din bookingside) — vesentlig lavere terskel ([matching-guidelines for Business Link](https://developers.google.com/actions-center/verticals/reservations/bl/partner-portal/inventory/matching-guidelines)). RwG for restauranter er tilgjengelig i Norge via partnere som resOS ([kilde](https://resos.com/feature/reserve-with-google/)).

---

## 4. SMS og e-post i Norge

**SMS-leverandører (bekreftede tall der oppgitt):**

| Leverandør | Pris | Kommentar |
|---|---|---|
| [Sveve](https://sveve.no/tjenester/) | **fra ca. 39–41 øre per SMS** (pakkepriser; pakker utløper ikke) | Norsk selskap, servere i Norge (GDPR-fordel), enkel HTTP-API, avsendernavn som tekst («RESTAURANT»). Profilerer seg eksplisitt som [norsk Twilio-alternativ](https://sveve.no/artikler/alternativ-til-twilio/). Eksakt pakkepris bør verifiseres på sveve.no (siden blokkerte automatisk henting). |
| [LINK Mobility](https://www.linkmobility.com/no/produkter/mylink-sms-api) | Gateway: **etablering 2 590 kr, 479 kr/mnd, 0,70–0,96 kr per delmelding** (volumavhengig, < 5 000/mnd = 0,96 kr) | Størst i Norden, «enterprise»-oppsett. Dyrere og tyngre å komme i gang med enn Sveve for småvolum. |
| [Twilio](https://www.twilio.com/en-us/sms/pricing/no) | Globalt «fra $0,0083», men Norge ligger vesentlig høyere — **antakelse: ca. $0,08–0,10 (≈ 0,8–1,1 kr) per SMS til Norge**; eksakt sats sto ikke i søkeresultatene og må sjekkes på Twilios prisside | Best API/dokumentasjon, men amerikansk databehandler (GDPR-merarbeid: SCC/DPA) og typisk dyrest per melding til Norge. |

Regneeksempel (antakelse): en restaurant med 600 bookinger/mnd og 2 SMS per booking (bekreftelse + påminnelse) = 1 200 SMS ≈ **470–500 kr/mnd med Sveve**, ~840–1 150 kr med LINK (pluss månedsavgift).

**E-post:** ukontroversielt og nesten gratis — transaksjonsleverandører (Postmark, Resend, Amazon SES, Brevo) koster fra ~0 til noen øre per e-post (antakelse basert på allmenn markedskunnskap; ikke undersøkt i detalj her). E-post er «gratis-kanalen»; SMS er den som faktisk reduserer no-show.

---

## 5. Betaling: depositum og no-show-gebyr — Stripe vs. Vipps

**Stripe — det etablerte mønsteret** (bekreftet av [Stripes dokumentasjon om holds](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) og bransjeimplementasjoner som [ResDiary](https://resdiary.freshdesk.com/en/support/solutions/articles/4000099994-stripe-charging-for-no-shows-or-late-cancellations-), [simpleERB](https://help.simpleerb.com/en/articles/4419415-how-to-take-payments-for-no-shows-late-cancellation-bookings), [Tablein](https://help.tablein.com/how-does-no-show/late-cancellation-fee-works)):
- **Kortregistrering (SetupIntent):** gjesten lagrer kortet ved booking, ingenting trekkes. Ved no-show/sen kansellering oppretter restauranten en PaymentIntent off-session mot det lagrede kortet. Dette er standardmønsteret i bransjen («credit card guarantee»). Risiko: off-session-trekk kan avvises (3DS/SCA, sperret kort) og kan bestrides av kortholder.
- **Hold (autorisasjon med `capture_method: manual`):** beløpet reserveres ved booking og captures kun ved no-show. **Begrensning: en kortautorisasjon er normalt gyldig ~7 dager** før den slippes (bekreftet prinsipp i Stripe-dokumentasjonen; eksakt antall dager varierer per kortnettverk) — så holds fungerer bare for bookinger nær i tid.
- **Depositum:** vanlig betaling ved booking, refunder ved oppmøte/kansellering i tide (refusjonsgebyret beholdes ikke av Stripe-gebyret automatisk).
- **Pris Norge:** **1,5 % + 1,80 kr per innenlandsk transaksjon**; +3,25 % for internasjonale kort, +2 % ved valutakonvertering ([Stripe fee calculator Norway](https://affonso.io/resources/stripe-fee-calculator/norway), [globalfeecalculator](https://globalfeecalculator.com/blog/stripe-fees-by-country/)).

**Vipps — det norske alternativet** (bekreftet fra [Vipps MobilePay developer-docs](https://developer.vippsmobilepay.com/docs/knowledge-base/reserve-and-capture/)):
- ePayment-API-et støtter **reserve → capture/cancel**: beløpet reserveres på gjestens konto ved booking, og restauranten kan capture (belaste) eller cancel (frigi). Viktig: Vipps' regelverk sier at man ikke skal capture før varen/tjenesten er levert — for no-show-gebyr bør vilkårene være eksplisitte (antakelse: dette er akseptert praksis når gebyret er tydelig kommunisert, men bør avklares med Vipps).
- **Reservasjonens levetid:** Vipps i Norge: inntil **180 dager**; kortbetalinger via Vipps: ned mot **7 dager**; MobilePay DK/FI: 14 dager ([kilde](https://developer.vippsmobilepay.com/docs/knowledge-base/reserve-and-capture/)). 180-dagersvinduet gjør Vipps *bedre egnet enn Stripe-holds* for bookinger langt frem i tid.
- **Det Vipps IKKE har:** noe direkte motstykke til SetupIntent («lagre betalingsmiddel, trekk senere ved behov») for engangsbruk — Recurring-API-et finnes, men er ment for abonnement (antakelse basert på API-dokumentasjonens innretning; bør verifiseres om «Vipps-avtale» kan brukes til betinget no-show-trekk).
- **Pris:** typisk **1,25–1,75 % per transaksjon** avhengig av produkt og volum; Vipps Checkout har engangsavgift rundt 5 000 kr; forhandlingsrom fra ~100 000 kr/mnd i omsetning ([Smartbyrå-guide 2026](https://smartbyra.no/crm-og-salg/vipps-for-bedrift)). Oppgjør 1–3 virkedager.

**Anbefalt MVP-strategi (vurdering):** Vipps-reservasjon for depositum (180 dagers vindu + norsk brukervennlighet) og/eller Stripe SetupIntent for «kortgaranti uten trekk». Ren Stripe-hold er kun brukbar ≤ 7 dager frem.

---

## 6. GDPR-krav for gjestedata

Bekreftet fra [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/grunnleggende-personvernprinsipper/lagringsbegrensning/) og norske GDPR-veiledere:

1. **Behandlingsgrunnlag:** selve bookingen hviler på avtale (GDPR art. 6(1)(b)) — navn, telefon, e-post, tidspunkt, antall. Markedsføring (nyhetsbrev, SMS-kampanjer) krever separat samtykke.
2. **Lagringsbegrensning:** data skal slettes/anonymiseres når formålet er oppfylt. [Datatilsynet om avslutning av kundeforhold](https://www.datatilsynet.no/personvern-pa-ulike-omrader/kundehandtering-handel-og-medlemskap/digitale-tjenester-og-forbrukeres-personopplysninger/avslutning-av-kundeforholdet/): når kundeforholdet er over, skal data normalt slettes *uoppfordret*. Lagringstid må angis **konkret** (uker/måneder/år) i behandlingsprotokollen — «så lenge nødvendig» er ikke lov ([GDPRControl](https://gdprcontrol.no/lagringstid-gdpr/)). Praktisk norm i bransjen: slett/anonymiser gjestedata f.eks. 12–24 mnd etter siste besøk (antakelse/bransjepraksis, ikke lovfestet tall). Regnskapsdata (betalinger) må derimot oppbevares etter bokføringsloven (5 år — bekreftet norsk lovkrav).
3. **Sletterett:** forespørsler skal normalt etterkommes innen én måned ([Draftit](https://draftit.no/blogg/hvordan-sletter-du-personopplysninger-pa-riktig-mate)). Systemet trenger altså en faktisk slette-/anonymiseringsfunksjon fra dag én.
4. **Særlige kategorier — allergier:** felt for «allergier/matintoleranse» er **helseopplysninger** (art. 9) og krever eksplisitt samtykke og strengere sikring. Mange systemer omgår dette med fritekst «kommentar til restauranten» — men innholdet blir like fullt sensitivt. (Vurdering: unngå strukturert allergifelt i MVP.)
5. **Databehandlere:** SMS-leverandør, e-postleverandør, betalingsleverandør og hosting er databehandlere → databehandleravtale (DPA) med hver. Norske/EØS-leverandører (Sveve, LINK, Vipps, EØS-hosting) forenkler dette vesentlig; Twilio/amerikansk sky krever overføringsgrunnlag (SCC/adequacy under EU-US DPF).
6. **Øvrig:** personvernerklæring på bookingsiden, behandlingsprotokoll (art. 30), innsynsrett, og logging som ikke lagrer mer enn nødvendig ([Lov & Data om logging](https://lod.lovdata.no/article/2024/06/Logging%20som%20sikkerhetstiltak%20etter%20GDPR)).

---

## 7. Ærlig vurdering: MVP vs. kommersielle systemer

**Hva de kommersielle koster** (bekreftet): [resOS](https://resos.com/pricing/) har gratisplan (25 bookinger/mnd) og betalte planer der tillegg som Google-reservasjoner, venteliste og betaling koster €3,99–11,99/mnd ekstra; [Superb](https://www.superbexperience.com/platform/restaurant-reservation-system) fra ca. €79/mnd; DinnerBooking er tilbudsbasert ([sammenligning](https://restaurantbookingsystem.com/best/restaurant-booking-systems-2026/)). Altså: et fullverdig system kan kjøpes for **~500–1 000 kr/mnd**.

**Arbeidsestimat for egenbygd (vurdering/antakelse, basert på funnene over):**

| Nivå | Innhold | Estimat (én erfaren utvikler) |
|---|---|---|
| **Minimalt MVP** | Bookingskjema, slot-generering, grådig bordallokering, admin-liste, e-postbekreftelse, GDPR-basics (sletting, erklæring) | **4–8 uker** |
| **Brukbart i drift** | + SMS-påminnelse, endring/kansellering via lenke, bordkombinasjoner, pacing, walk-in/overstyring i admin, venteliste, samtidighetskontroll | **3–5 måneder** |
| **Konkurransedyktig** | + depositum/no-show (Stripe/Vipps), bordkart-UI, Reserve with Google (krever plattform-status), gjestehistorikk, rapporter, multi-lokasjon | **6–12+ måneder**, pluss løpende drift |

**Den ubehagelige sannheten:** Kjernealgoritmen er den *enkleste* delen. Kostnaden ligger i randene: no-show-betalingsflyt med SCA-kanter, RwG-sertifisering (og at man i det hele tatt må være plattform for å få den), GDPR-vedlikehold, support når restauranten står fredag kveld med dobbeltbooking. Mot en kjøpspris på 500–1 000 kr/mnd er egenbygging **økonomisk uforsvarlig for én enkelt restaurant** — break-even mot resOS/Superb ligger flere år frem selv med lave timepriser.

**Når egenbygging likevel gir mening:** (a) man bygger en *plattform* som skal selges til mange restauranter (da er RwG-partnerskap også oppnåelig), (b) man trenger noe nisjespesifikt de kommersielle ikke dekker (f.eks. dyp integrasjon med eget kassasystem eller lokal-først-arkitektur), eller (c) booking er en bifunksjon i et større produkt man allerede eier. For alle andre: kjøp resOS-klassen, og bruk utviklingstiden på differensiering.

---

### Kildeliste (utvalg)
- Åpen kildekode: [TastyIgniter](https://github.com/tastyigniter/TastyIgniter) · [openresto](https://github.com/karanshukla/openresto) · [SeatFrenzy](https://github.com/pjborowiecki/SEAT-FRENZY-Restaurant-Table-Booking-System) · [GitHub-topic table-booking](https://github.com/topics/table-booking) · [Laravel News om TastyIgniter](https://laravel-news.com/tastyigniter-open-source-restaurant-software)
- Algoritmer: [US-patent 10,037,585](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10037585) · [Table combination-studien (SciELO)](https://www.scielo.br/j/pope/a/bkBQnG3YtpX37nKYSzpKhvP/) · [Dedicated vs combinable tables](https://www.researchgate.net/publication/247273890_Optimizing_a_restaurant's_seating_capacity_Use_dedicated_or_combinable_tables) · [Claremont-avhandling](https://scholarship.claremont.edu/cgi/viewcontent.cgi?article=1022&context=hmc_theses)
- Google: [Reservations E2E Overview](https://developers.google.com/actions-center/verticals/reservations/e2e/overview) · [Platform Policies](https://developers.google.com/actions-center/verticals/reservations/e2e/policies/platform-policies) · [Tableo om RwG](https://tableo.com/reserve-with-google/) · [resOS RwG](https://resos.com/feature/reserve-with-google/)
- SMS: [Sveve tjenester/priser](https://sveve.no/tjenester/) · [Sveve om Twilio-alternativ](https://sveve.no/artikler/alternativ-til-twilio/) · [LINK Mobility SMS API](https://www.linkmobility.com/no/produkter/mylink-sms-api) · [Twilio SMS-priser Norge](https://www.twilio.com/en-us/sms/pricing/no)
- Betaling: [Stripe holds-dokumentasjon](https://docs.stripe.com/payments/place-a-hold-on-a-payment-method) · [Vipps reserve/capture](https://developer.vippsmobilepay.com/docs/knowledge-base/reserve-and-capture/) · [Stripe-gebyr Norge](https://affonso.io/resources/stripe-fee-calculator/norway) · [Vipps for bedrift-guide](https://smartbyra.no/crm-og-salg/vipps-for-bedrift) · [ResDiary no-show via Stripe](https://resdiary.freshdesk.com/en/support/solutions/articles/4000099994-stripe-charging-for-no-shows-or-late-cancellations-)
- GDPR: [Datatilsynet — lagringsbegrensning](https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/grunnleggende-personvernprinsipper/lagringsbegrensning/) · [Datatilsynet — avslutning av kundeforhold](https://www.datatilsynet.no/personvern-pa-ulike-omrader/kundehandtering-handel-og-medlemskap/digitale-tjenester-og-forbrukeres-personopplysninger/avslutning-av-kundeforholdet/) · [GDPRControl om lagringstid](https://gdprcontrol.no/lagringstid-gdpr/) · [Draftit om sletting](https://draftit.no/blogg/hvordan-sletter-du-personopplysninger-pa-riktig-mate)
- Kommersielle priser: [resOS pricing](https://resos.com/pricing/) · [Superb](https://www.superbexperience.com/platform/restaurant-reservation-system) · [Sammenligning 2026](https://restaurantbookingsystem.com/best/restaurant-booking-systems-2026/)

## Nøkkelfunn (agentens oppsummering)
- Ingen moden åpen kildekode-erstatning for OpenTable finnes; TastyIgniter (3 677 stjerner, aktiv) er nærmest, men bordreservasjon er en bimodul der — resten er studentprosjekter eller det helt ferske openresto (jan. 2026).
- Kjernealgoritmen (15/30-min-slots, grådig best-fit-bordallokering, bordkombinasjoner, pacing) er velbeskrevet i litteraturen og utgjør 1–2 ukers arbeid; forskning viser ~25 % bedre setebruk med fleksibel tildeling, men MVP klarer seg med grådig tilnærming.
- Reserve with Google (End-to-End) krever at man er en B2B-plattform med flere restauranter under kontrakt, booking-server med svar under 1 sekund og Google-sertifisering — én enkeltrestaurant med egenbygd system slipper ikke inn direkte, men «Business Link» (lenke-knapp) er en lavterskelvei.
- SMS i Norge: Sveve fra ca. 39–41 øre/SMS (norsk, servere i Norge, GDPR-enkelt); LINK Mobility 0,70–0,96 kr/delmelding pluss 2 590 kr etablering og 479 kr/mnd; Twilio er dyrest til Norge og gir amerikansk databehandler-kompleksitet.
- Betaling: Stripe SetupIntent (lagre kort, trekk ved no-show) er bransjestandard; Stripe-holds utløper etter ~7 dager, mens Vipps-reservasjoner i Norge kan stå i inntil 180 dager — Vipps (1,25–1,75 %) er derfor best egnet for depositum langt frem i tid, Stripe (1,5 % + 1,80 kr) for kortgaranti.
- GDPR: konkret lagringstid må dokumenteres (ikke «så lenge nødvendig»), gjestedata skal slettes uoppfordret etter endt kundeforhold, sletting innen én måned ved krav, og allergifelt er helseopplysninger (art. 9) — unngå strukturert allergifelt i MVP.
- Kommersielle systemer koster 0–1 000 kr/mnd (resOS gratis/rimelig, Superb fra ~€79/mnd) — egenbygging for én restaurant er økonomisk uforsvarlig.
- Realistisk arbeidsmengde egenbygd: minimalt MVP 4–8 uker, driftsbrukbart system 3–5 måneder, konkurransedyktig produkt 6–12+ måneder pluss løpende drift — kompleksiteten ligger i betalingsflyt, samtidighet, RwG-sertifisering og support, ikke i algoritmen.
- Egenbygging gir bare mening som flerrestaurant-plattform (da åpnes også RwG-partnerskap), ved nisjebehov kommersielle ikke dekker, eller når booking er bifunksjon i et større produkt.
