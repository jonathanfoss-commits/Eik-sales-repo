# Lokaler (venue-guide)

Hurtigreferanse over lokalene i Eik & Friends-porteføljen, for å matche et arrangement til riktig
sted. Speiler Airtable-tabellen **Venues** (`tblgMDhWEPCY4596A`), som er sannhetskilden — denne
filen kan ligge litt etter. Per 26.06.2026: 38 lokaler registrert.

> **Status:** Venue-registeret er et førsteutkast bygget fra eikandfriends.no (12.06.2026). Ingen
> rader er ennå merket «Verifisert» i Airtable — dobbeltsjekk kapasitet og vilkår mot lokalet før
> et tilbud sendes. Brukes av AI-agenten til venueforslag i tilbud.

## Etter kapasitet (maks pax)
| Lokale | Sted | Konsept | Maks pax | Egnet for |
| --- | --- | --- | --- | --- |
| Tårnet Kulturarena | Økern | Kulturarena/eventlokale | 8000 | Julebord, Stort event 150+, Konferanse |
| Sentralen (Marmorsalen m.fl.) | Kvadraturen | Arrangementssaler | 800 | Konferanse, Stort event 150+, Julebord |
| Fyrhuset Kuba | Kuba | Bar/restaurant | 500 | Sommerfest, Uteservering, Stort event 150+ |
| Brød & Sirkus | Oslo | Eventlokale/nattklubb | 500 | Julebord, Stort event 150+, Nattklubb/fest |
| Bar Vulkan | Vulkan | Bar | 350 | Stort event 150+, Nattklubb/fest, Sommerfest, Privatfest |
| TAKET Steen & Strøm | Sentrum | Takterrasse/restaurant | 300 | Julebord, Sommerfest, Stort event 150+, Uteservering |
| Amazonia by BAR | Oslo | Bar/uteservering | 300 | Sommerfest, Uteservering, Privatfest, Stort event 150+ |
| FYR Bistronomi & Bar | Oslo | Bistronomi | 250 | Sommerfest, Uteservering, Mindre grupper |
| Kastellet | Oslo | Restaurant | 212 | Mindre grupper, Privatfest |
| Kafe Republik | Oslo | Kafé/bar | 205 | Mindre grupper, Uteservering |
| Katla | Oslo | Restaurant | 200 | Mindre grupper, Privatfest |
| Håndslag | Oslo | Klubb/bar | 162 | Nattklubb/fest, Privatfest |
| Hitchhiker | Vulkan | Asiatisk gatemat | 150 | Mindre grupper, Privatfest |
| Mynt Takterrasse | Sentralen | Takterrasse | 150 | Sommerfest, Uteservering |
| Handwerk Botaniske | Oslo | Kafé | 120 | Sommerfest, Uteservering, Mindre grupper |
| Sawan | Oslo | Thai fine dining | 120 | Sommerfest, Privatfest, Uteservering, Mindre grupper |
| Girotondo | Oslo | Italiensk | 120 | Privatfest, Mindre grupper |
| Alf Nabolagsbar | Oslo | Nabolagsbar | 120 | Mindre grupper, Privatfest, Uteservering |
| Brasserie Ouest | Oslo | Brasserie | 112 | Mindre grupper |
| Vineria Ventidue | Oslo | Italiensk vinbar | 100 | Mindre grupper, Uteservering |
| Folkvang | Sagene | Restaurant/bar | 100 | Mindre grupper, Privatfest |
| Smalhans | St. Hanshaugen | Restaurant/bar | 90 | Mindre grupper |
| Hrimnir Ramen | Oslo | Ramenbar | 70 | Mindre grupper |
| Rugantino | Oslo | Italiensk | 68 | Mindre grupper |
| The Golden Chimp | Oslo | Restaurant/bar | 42 | Mindre grupper |
| LULU Omakase | Oslo | Omakase/sushi | 36 | Mindre grupper |
| Restaurant Stallen | Oslo | Restaurant | 22 | Mindre grupper |
| Honolulu | Oslo | Bar/karaoke | — | Privatfest, Mindre grupper |
| Der Peppern Gror | Rådhusplassen | Restaurant/matkurs | — | Matkurs, Mindre grupper |

## Lokaler uten registrert kapasitet/egnethet (suppler i Airtable)
The Three Fifty (restaurant/bar), Sentralpuben (Oslo S, pub), Den Glade Gris (restaurant),
Delicatessen Aker Brygge & Delicatessen Stavanger (tapas), HEIM Gastropub St. Hanshaugen (gastropub),
Feniqia (Oslo/Lillestrøm, libanesisk), Metz (Bergen, bar), Felix (Bergen, restaurant).

## Slik matcher du arrangement → lokale
1. **Start med gjestetall.** Finn lokaler der maks pax ≥ antall gjester (med litt margin).
2. **Filtrer på type:** julebord/sommerfest/konferanse/privatfest/nattklubb/mindre grupper.
3. **Vurder konsept og stemning** mot kundens ønske (fine dining, bar, takterrasse, uteservering).
4. **Foreslå 2–3 alternativer** i tilbudet (se [`prompts/proposals/tilbud.md`](../prompts/proposals/tilbud.md)).

**Tommelregler:**
- **Store events (150+):** Tårnet, Sentralen, Fyrhuset Kuba, Brød & Sirkus, Bar Vulkan, TAKET, Amazonia.
- **Julebord:** Tårnet, Sentralen, Brød & Sirkus, TAKET.
- **Sommerfest/uteservering:** TAKET, Amazonia, FYR, Mynt, Fyrhuset Kuba, Bar Vulkan.
- **Intime middager:** LULU Omakase, Restaurant Stallen, Rugantino, The Golden Chimp.
