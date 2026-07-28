# Tjenestekatalog — mulige nye tjenester i Livsarkivet

**Dato:** 28. juli 2026 · Grunnlag: `RESEARCH-NYE-TJENESTER.md` · Prioritering: `PRIORITERT-ROADMAP.md`

Skalaer: **kompleksitet** og **risiko** 1–10 (10 = verst). **Brukerverdi** og **betalingsvilje** 1–10 (10 = best).
Poengene her er de samme som brukes i `PRIORITERT-ROADMAP.md` — endrer du ett sted, endre begge.

Hver tjeneste har: brukerproblem · løsning · målgruppe · brukerreise · nødvendige data ·
integrasjoner · partner · inntektsmodell · juridisk risiko · personvernrisiko · kompleksitet ·
brukerverdi · betalingsvilje.

## Det Livsarkivet allerede har — ikke foreslå dette på nytt

Hvelvelementer i åtte kategorier (juridisk, forsikring, eiendeler, digitale kontoer, tilgangsinfo, praktisk, helsedirektiv, siste hilsen) · tre datanivåer med zero-knowledge på sensitiv · kontakter med betrodd-flagg og invitasjon · mottakermatrise (element × kontakt) · dødsfallsmelding med attest · to-kilde-regel · fire øyne · 48 t karenstid med eierens nødbrems · etterlattevisning · revisjonslogg · varsling til eier og alle kontakter · Folkeregister-trigger · deling av fire felt med eget forsikringsselskap · selskaps-API og webhooks · OIDC · eksport og kontosletting · abonnement med etisk gating.

---

# A. Fremtidsfullmakt og juridisk planlegging

## A1. Fremtidsfullmakt-veiviser
Detaljert i eget dokument: **`FREMTIDSFULLMAKT.md`**. Oppsummert her for fullstendighet.

| | |
|---|---|
| **Brukerproblem** | Folk vet ikke at fremtidsfullmakt finnes, eller tror det er noe advokater gjør. Uten den havner familien hos statsforvalteren i en vergemålssak. |
| **Løsning** | Vurderingsveiviser → utkast til utskrift → registrering av at fullmakten finnes, hvem som er fullmektig, og hvor originalen ligger → oppdateringspåminnelse → støtte til fullmektigen ved ikrafttredelse. |
| **Målgruppe** | 55+, og voksne barn av foreldre i 70-årene (kjøperen er ofte ikke brukeren). |
| **Brukerreise** | Erkjennelse → vurdering (5–7 spørsmål) → valg av omfang → utkast → valgfri advokatkontroll → signering med vitner → registrering i arkivet → påminnelse etter 3 år → ikrafttredelse. Ni faser i detalj i `FREMTIDSFULLMAKT.md`. |
| **Nødvendige data** | Fullmaktsgiver, fullmektig(er), omfang, vitner, dato, hvor originalen er. Ikke selve dokumentet nødvendigvis. |
| **Integrasjoner** | Ingen offentlig API finnes for registrering. Lenker til Statsforvalterens skjema og veiledere. Utskrift som eneste «integrasjon» mot signeringen. |
| **Partner** | Advokatfirma med vergemåls-/arverettspraksis. Sekundært: Help Forsikring, Pensjonistforbundet som kanal. |
| **Inntektsmodell** | Gratis veiviser + betalt juridisk kontroll (engangsbeløp, deles med advokat). |
| **Juridisk risiko** | **8** — grensen mot rettsrådgivning. Krever advokatavklaring. |
| **Personvernrisiko** | 4 |
| **Kompleksitet** | 4 (veiviser) / 7 (med partnerflyt) |
| **Brukerverdi** | **9** |
| **Betalingsvilje** | **7** for kontrollen, 2 for veiviseren alene |

## A2. Testamentregister — «vi vet at det finnes, og hvor»
| | |
|---|---|
| **Brukerproblem** | Testamentet finnes, men de etterlatte vet ikke om det, eller finner det ikke. Originalen kan ligge hos tingretten, en advokat, i en bankboks eller i en skuff. |
| **Løsning** | Ikke lagre testamentet. Registrere **at det finnes**, når det ble opprettet, hvor originalen er, hvem som er testamentfullbyrder, og frigi den opplysningen til de etterlatte gjennom den eksisterende frigivelsesmekanismen. |
| **Hvorfor ikke lagre det** | Arveloven § 42 krever original med to samtidige vitner. En kopi i et hvelv er ikke testamentet. Å antyde noe annet er farlig. **[FAKTA]** Tingretten tilbyr oppbevaring og registrering mot kvittering (arveloven § 63). |
| **Målgruppe** | Alle som allerede har opprettet testament — særlig de som leverte det til tingretten og aldri fortalte noen. |
| **Brukerreise** | Eier krysser av «jeg har testament» → fyller fire felt → velger hvem som skal få vite det ved dødsfall → frigis automatisk gjennom eksisterende mekanikk. Under ett minutt. |
| **Nødvendige data** | Type, dato, oppbevaringssted, kontaktperson. Ett hvelvelement — nesten ingen ny modell. |
| **Integrasjoner** | Ingen. Tingretten har ikke API. Lenke til deres oppbevaringsordning er nok. |
| **Partner** | Ingen nødvendig. Eventuelt advokatfirmaer som vil at klientenes testamenter skal bli funnet. |
| **Inntektsmodell** | Inkludert. Driver oppgradering. |
| **Juridisk risiko** | **2** hvis vi er strenge på formuleringene |
| **Personvernrisiko** | 2 — metadata om et dokument, ikke dokumentet |
| **Kompleksitet** | **2** |
| **Brukerverdi** | 8 · **Betalingsvilje** 3 |

**[ANBEFALING]** Bygg denne. Den er nesten gratis, den utnytter mekanikken vi allerede har, og den fjerner et reelt tap.

## A3. Bestilt juridisk gjennomgang (advokat-i-loopen)
| | |
|---|---|
| **Brukerproblem** | Brukeren har laget et utkast og tør ikke stole på det. |
| **Løsning** | Ett trykk: send utkastet til kontroll hos partneradvokat. Fast pris, svar innen X dager, kommentarer tilbake i arkivet. |
| **Målgruppe** | De som allerede har fylt ut noe — altså engasjerte brukere. |
| **Brukerreise** | Utkast ferdig → «få det sjekket» med pris og frist synlig → eksplisitt samtykke til deling av *dette ene dokumentet* → advokat leser → kommentarer tilbake i arkivet → brukeren retter → samtykket utløper. |
| **Nødvendige data** | Utkastet, kontaktinfo. Deles kun ved aktivt samtykke, per sak. |
| **Integrasjoner** | Ingen teknisk integrasjon nødvendig i første versjon — sikker overføring og et saksnummer holder. |
| **Partner** | Advokatfirma med arverett/vergemål. Se `PARTNERE-OG-INNTEKTER.md`. |
| **Inntektsmodell** | Deling av honorar. Realistisk 20–35 % henvisningsandel. **Må opplyses til brukeren.** |
| **Juridisk risiko** | **7** — hvem er ansvarlig for rådet? Må avtalefestes. Advokatens klientforhold er med brukeren, ikke oss. |
| **Personvernrisiko** | 6 — innhold forlater plattformen. Krever eksplisitt, avgrenset og tidsbegrenset samtykke. |
| **Kompleksitet** | 5 |
| **Brukerverdi** | 8 · **Betalingsvilje** **8** |

---

# B. Ved dødsfall — etterlattemodus

## B1. Etterlatte-kontrollpanel (komplement til Digitalt dødsbo)
| | |
|---|---|
| **Brukerproblem** | Etterlatte vet ikke hva de skal gjøre først, og drukner i oppgaver i en tilstand der de ikke klarer å prioritere. |
| **Løsning** | En stegvis liste som starter med det som haster, og som **lenker til Digitalt dødsbo for alt som er registerdata**. Vi dekker det staten ikke har: hvor nøklene er, hva avdøde ønsket, hvem som skal varsles, katten, passordene, abonnementene. |
| **Hvorfor ikke bygge oversikten selv** | Digitalt dødsbo (juni 2025) henter bank, eiendom, kjøretøy, gjeld, forsikring og pensjon automatisk fra autoritative kilder. Vi har ikke tilgang og får det ikke. **[FAKTA]** |
| **Målgruppe** | Mottakere etter frigivelse. Typisk ektefelle eller voksent barn, 40–70 år, i sjokk, på mobil. |
| **Brukerreise** | Frigivelsesvarsel → rolig forside med én ting som haster → oppgave for oppgave, hver med det som trengs samlet → «dette tar staten seg av» med lenke → ferdigmarkering som andre etterlatte ser. Rå råmateriale for listen: appendiks 2. |
| **Nødvendige data** | Finnes allerede i hvelvet. Dette er presentasjon, ikke ny innsamling. |
| **Integrasjoner** | Lenker (ikke API) til Altinn/Digitalt dødsbo, tingretten, NAV, Skatteetaten. **Epilog** for selve arveoppgjøret. |
| **Partner** | Epilog (B4). Eventuelt begravelsesbyrå som henvisning *ut*, aldri som eier av flaten. |
| **Inntektsmodell** | Gratis for etterlatte — alltid. Det er den etiske gatingen vi allerede har. Verdien er at eieren betaler for at dette skal finnes. |
| **Juridisk risiko** | 3 |
| **Personvernrisiko** | 3 — ingen ny innsamling; risikoen er at flere ser mer enn matrisen tilsier. RLS er porten. |
| **Kompleksitet** | 4 |
| **Brukerverdi** | **10** · **Betalingsvilje** 2 direkte, **9** indirekte |

**[ANBEFALING]** Dette er den sterkeste enkeltutvidelsen i katalogen. Den koster lite, den er den etterlatte faktisk møter, og den er grunnen til at eieren betalte.

## B2. Abonnementsdød — hva skjer med de faste trekkene
| | |
|---|---|
| **Brukerproblem** | Kontoen sperres ved dødsfall, men trekkene fortsetter å forsøke. Etterlatte vet ikke hvilke abonnementer som finnes eller hvordan de sies opp. |
| **Løsning** | Kategori i hvelvet for løpende avtaler, med oppsigelseslenke og kundenummer per avtale, frigitt til de etterlatte. Ikke automatisk oppsigelse. |
| **Hvorfor ikke automatisk** | Vi har ikke fullmakt, og en feilaktig oppsigelse av forsikring eller strøm i et dødsbo kan gjøre reell skade. |
| **Målgruppe** | Etterlatte som sitter med dødsboets økonomi. Sekundært eieren selv, som får oversikt mens hen lever. |
| **Brukerreise** | Eier legger inn avtaler over tid (eller ved årlig gjennomgang) → ved frigivelse ser etterlatte listen sortert etter hva som koster mest per måned → én lenke og ett kundenummer per rad → avkrysning når det er ordnet. |
| **Nødvendige data** | Leverandør, kundenummer, beløp, oppsigelseslenke. Ingen betalingsdata. |
| **Integrasjoner** | Ingen. Dette er lenker og tekst — bevisst. Se avgrensningen under. |
| **Partner** | Ingen. Provisjon fra leverandørene ville ødelagt tjenesten (se D2). |
| **Avgrensning mot bank** | Bankene har allerede oversikt over faste trekk fra ekte transaksjonsdata, og oppsigelse i noen tastetrykk. **[FAKTA]** Vi taper på datakvalitet. Vi vinner på at bankens løsning ikke virker når kontoen er sperret. |
| **Inntektsmodell** | Inkludert. **Ikke provisjon** — se `PARTNERE-OG-INNTEKTER.md`. |
| **Juridisk risiko** | 2 · **Personvernrisiko** 3 · **Kompleksitet** 3 |
| **Brukerverdi** | 8 · **Betalingsvilje** 4 |

## B3. Digital minnehåndtering — plattformkontoene
| | |
|---|---|
| **Brukerproblem** | Bilder og kontoer forsvinner, eller ligger utilgjengelige for alltid. Kontoer slettes ved inaktivitet mens familien leter. |
| **Løsning** | En sjekkliste per plattform med hva som **faktisk er mulig** hos hver enkelt, og eierens instruks (minnekonto / slett / overfør) registrert på forhånd. |
| **Kritisk avgrensning** | **[FAKTA]** Facebook-arvekontakt kan feste innlegg og oppdatere profil, men **kan ikke logge inn eller lese meldinger**. Google Inactive Account Manager utløses av inaktivitet, ikke av død. Apple Digital Legacy krever **dødsattest og tilgangsnøkkel**. Passord kan i praksis ikke «arves» — de er ikke en eiendel, og bruk av andres innlogging kan bryte plattformens vilkår. **Ikke lov brukeren noe leverandøren ikke tillater.** |
| **Målgruppe** | Alle med bilder i skyen — altså alle under 80. Sterkest hos foreldre med barn. |
| **Brukerreise** | Eier velger plattformer hen bruker → får vite hva som faktisk er mulig hos hver → gjør det som må gjøres *hos plattformen* (arvekontakt, Legacy Contact) mens hen lever → registrerer hos oss at det er gjort, og hva instruksen er → frigis til de etterlatte. |
| **Nødvendige data** | Kontoliste, eierens instruks, om plattformens egen arveordning er satt opp. Ikke nødvendigvis passordene. |
| **Integrasjoner** | Ingen API finnes for dette hos noen av plattformene. Alt er lenker og instruksjoner. **[FAKTA]** |
| **Partner** | Ingen. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | **6** — vi må være svært presise i formuleringene |
| **Personvernrisiko** | 4 |
| **Kompleksitet** | 3 (informasjon) / 9 (om vi noen gang skulle automatisere) |
| **Brukerverdi** | **9** · **Betalingsvilje** 5 |

## B4. Henvisning til digitalt arveoppgjør (Epilog eller tilsvarende)
| | |
|---|---|
| **Brukerproblem** | Etter at arkivet er frigitt, står familien igjen med selve skiftet. |
| **Løsning** | Én lenke, med de opplysningene brukeren har samtykket til å ta med. |
| **Målgruppe** | Etterlatte som skal gjennomføre et privat skifte. |
| **Brukerreise** | Etterlatte har gjort det akutte i B1 → siste steg er «nå kommer selve arveoppgjøret» → forklaring av hva det innebærer → lenke, med tydelig opplysning om at vi mottar henvisningshonorar. |
| **Nødvendige data** | Ingen overføres uten aktivt valg. Helst: bare en lenke. |
| **Integrasjoner** | Lenke i første omgang. Eventuell dataoverføring krever egen samtykkeflyt og DPA. |
| **Partner** | Epilog. **[TOLKNING]** Naturlig komplement: de løser fasen etter, vi fasen før. |
| **Inntektsmodell** | Henvisningshonorar eller gjensidig distribusjon. Honoraret opplyses. |
| **Juridisk risiko** | 4 (må ikke fremstå som vårt eget juridiske råd) |
| **Personvernrisiko** | 2 ved ren lenke, 6 om data følger med |
| **Kompleksitet** | **2** |
| **Brukerverdi** | 7 · **Betalingsvilje** 5 |

---

# C. Sykdom og redusert handleevne

## C1. Beredskapskort — det som må virke i en ambulanse
| | |
|---|---|
| **Brukerproblem** | Ved akutt sykdom trenger helsepersonell og pårørende noen få opplysninger raskt. Et hvelv med innlogging er ubrukelig i det øyeblikket. |
| **Løsning** | Et lite, brukerdefinert utdrag — pårørende, allergier, faste medisiner, fastlege — tilgjengelig **uten innlogging** via QR-kode/kort som brukeren bærer på seg, med egen kort levetid og egen revisjonslogg. |
| **Alvorlig avveining** | Dette bryter med prinsippet om at alt krever autentisering. **[ANBEFALING]** Bygg det som et *separat, eksplisitt opt-in, brukervalgt utdrag* — aldri som en snarvei inn i hvelvet. Helseopplysninger er særlige kategorier (GDPR art. 9) og krever uttrykkelig samtykke. |
| **Målgruppe** | Kronisk syke, eldre, alenboende, folk med alvorlige allergier. Ikke alle — og det er poenget. |
| **Brukerreise** | Eier krysser av for de få feltene → ser nøyaktig hva en fremmed vil se → skriver ut kort / lagrer QR → kan trekke tilbake når som helst → hver oppslag logges og eieren kan se det. |
| **Nødvendige data** | Kun det brukeren aktivt krysser av. |
| **Integrasjoner** | Ingen. Kjernejournal er ikke tilgjengelig for private aktører, og vi skal ikke late som noe annet. |
| **Partner** | Eventuelt en interesseorganisasjon for en diagnosegruppe, som distribusjon og som fagfellevurdering av hvilke felt som faktisk hjelper. |
| **Inntektsmodell** | Inkludert. Ikke selg helseberedskap som tillegg. |
| **Juridisk risiko** | **7** · **Personvernrisiko** **8** |
| **Kompleksitet** | 5 |
| **Brukerverdi** | **9** · **Betalingsvilje** 6 |

## C2. Ønsker ved alvorlig sykdom (ikke «livstestament»)
| | |
|---|---|
| **Brukerproblem** | Familien må ta avgjørelser uten å vite hva den syke ville ha ønsket. |
| **Kritisk avgrensning** | **[FAKTA]** Et livstestament er **ikke juridisk bindende** i Norge. Behandlende lege skal vurdere konkret om det gjelder situasjonen, og det kan aldri alene begrunne behandlingsbegrensning i en akutt situasjon — men det **skal tillegges vekt**. |
| **Løsning** | Formuler det som *ønsker og verdier til støtte for samtalen*, aldri som et bindende direktiv. Kategorien `helsedirektiv` finnes allerede — dette er språk og veiledning, ikke ny datamodell. |
| **Målgruppe** | 60+, alvorlig syke i alle aldre, og pårørende som har stått i valget før. |
| **Brukerreise** | Innledning som er ærlig om at dette ikke binder noen → få, konkrete spørsmål om verdier framfor behandlingsvalg → lagres i `helsedirektiv` → deles med den nærmeste **mens eieren lever**, fordi det er der samtalen skal tas. |
| **Nødvendige data** | Fritekst + noen få strukturerte valg. Særlig kategori (art. 9). |
| **Integrasjoner** | Ingen. Lenke til Helsedirektoratets veiledning om beslutningsprosesser i livets sluttfase. |
| **Partner** | Ingen kommersiell. Faglig gjennomlesing fra palliativt miljø ville hevet kvaliteten betydelig. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | **6** hvis vi formulerer oss feil, 2 hvis vi er presise |
| **Personvernrisiko** | 6 — helseopplysninger, men skrevet av eieren selv om eieren selv |
| **Kompleksitet** | **2** |
| **Brukerverdi** | 8 · **Betalingsvilje** 4 |

## C3. Fullmektigmodus ved sykdom (ikke bare ved død)
| | |
|---|---|
| **Brukerproblem** | Frigivelsesmekanismen vår antar dødsfall. Men fremtidsfullmakt trer i kraft ved *redusert handleevne*, som er langt vanligere og varer lenger. |
| **Løsning** | Egen hendelsestype `helsesvikt` — **skjemaet støtter den allerede** — med egen mottakermatrise, egen verifisering (statsforvalterens stadfestelsesattest som dokumentasjon), og **reverserbar** tilgang. |
| **Hvorfor det er vanskeligere enn dødsfall** | Døden er endelig. Redusert handleevne kan gå over. Tilgangen må kunne trekkes tilbake, og eieren kan ha gjenvunnet samtykkekompetanse. |
| **Målgruppe** | Fullmektiger — oftest et voksent barn eller en ektefelle — og fullmaktsgivere som vil at det skal virke. |
| **Brukerreise** | Fullmektig melder `helsesvikt` → laster opp stadfestelsesattest → fire øyne hos oss → karenstid → begrenset, reverserbar tilgang til de elementene matrisen peker på → eier eller statsforvalter kan avslutte tilgangen → alt logges og de andre kontaktene varsles. |
| **Nødvendige data** | Attest fra statsforvalteren, fullmaktens omfang, hvilke elementer som omfattes. |
| **Integrasjoner** | Ingen. Statsforvalteren har ikke API for stadfestelser. Attesten er et dokument, som dødsattesten. |
| **Partner** | Advokat for utformingen av flyten. Statsforvalteren er myndighet, ikke partner. |
| **Inntektsmodell** | Premium. Dette er den funksjonen som gjør et abonnement forsvarlig for målgruppen 70+. |
| **Juridisk risiko** | **8** · **Personvernrisiko** 7 · **Kompleksitet** **8** |
| **Brukerverdi** | **9** · **Betalingsvilje** 7 |

**[ANBEFALING]** Stor verdi, men ikke før A1 er i drift og vi har sett hvordan fremtidsfullmakter faktisk brukes.

---

# D. Løpende avtaler

## D1. Avtaleoversikt uten salg
| | |
|---|---|
| **Brukerproblem** | Ingen har oversikt over egne bindingstider, oppsigelsesfrister og kundenumre. |
| **Løsning** | Kategori for løpende avtaler med felt for leverandør, kundenummer, bindingstid, oppsigelsesfrist — og påminnelse før bindingstid utløper. |
| **Målgruppe** | Alle. Dette er den ene funksjonen i katalogen med bred, hverdagslig nytte. |
| **Brukerreise** | Eier legger inn avtaler ved onboarding eller ved årlig gjennomgang → får varsel 30 dager før bindingstid utløper → velger selv hva hen gjør → avtalene inngår i det som frigis ved dødsfall (B2). |
| **Nødvendige data** | Leverandør, avtaletype, kundenummer, beløp, bindingstid, oppsigelsesfrist. |
| **Integrasjoner** | Ingen. PSD2-tilgang ville gitt bedre data og krever konsesjon vi ikke har og ikke bør skaffe. |
| **Partner** | Ingen — bevisst. Se D2. |
| **Hva vi IKKE gjør** | Ikke sammenligne priser, ikke selge om, ikke ta provisjon. Se D2 for hvorfor. |
| **Inntektsmodell** | Inkludert. Bidrar til at abonnementet oppleves nyttig i live. |
| **Juridisk risiko** | 2 · **Personvernrisiko** 3 · **Kompleksitet** 3 |
| **Brukerverdi** | 7 · **Betalingsvilje** 4 |

## D2. Strømbytte med provisjon — **anbefales ikke**
| | |
|---|---|
| **Forslaget** | Vise strømavtaler, anbefale bytte, ta provisjon. |
| **Hvorfor det ser fristende ut** | Det er penger i det, og strømavtalen står allerede i hvelvet. |
| **Hvorfor jeg fraråder det** | Tre grunner, i rekkefølge: **(1) Tillitskostnaden.** Hele produktets premiss er at vi ikke tjener penger på å se innholdet ditt. Første gang vi anbefaler en leverandør vi får betalt av, har vi solgt det premisset. **(2) Regulatorisk.** Strømsalg til forbrukere er tett regulert av Forbrukertilsynet: krav til opplysninger i markedsføring, prisliste, og forbud mot å reklamere med lavere pris enn konkurrenter uten dokumenterbar, sammenlignbar dokumentasjon. Forbrukertilsynet publiserte 21.11.2025 veiledning om **ulovlig praksis ved strømsalg i forbindelse med boligovertakelse** — altså nøyaktig den livshendelsen vi ville truffet. **[FAKTA]** **(3) Kategorien er tatt.** bytt.no og tilsvarende gjør dette bedre og har ingen tillit å tape. |
| **Målgruppe** | Ingen vi ønsker å tjene penger på denne måten. |
| **Brukerreise** | Ikke utformet — bevisst. |
| **Partner** | Strømleverandører. Se `PARTNERE-OG-INNTEKTER.md` pkt. 7 for hvorfor ikke. |
| **Juridisk risiko** | **8** · **Tillitsrisiko** **10** · **Personvernrisiko** 6 |
| **Brukerverdi** | 4 · **Betalingsvilje** 2 (brukeren betaler ikke — leverandøren gjør) |

**[ANBEFALING]** Ikke bygg. Hvis inntektsbehovet er reelt, finn det i B2B (se `PARTNERE-OG-INNTEKTER.md`), ikke i provisjon på egne brukere.

## D3. Overføring av avtaler ved dødsfall
| | |
|---|---|
| **Brukerproblem** | Strøm, forsikring og bredbånd må enten overføres eller avsluttes — og gjenlevende ektefelle sitter i et hus der strømmen står på avdødes navn. |
| **Løsning** | Sjekkliste med hva som må gjøres per avtaletype, hvem som kan gjøre det, og hva som kreves (skifteattest, fullmakt). Informasjon, ikke automatikk. |
| **Målgruppe** | Gjenlevende ektefelle/samboer i felles bolig. |
| **Brukerreise** | Del av B1 → «avtaler som må over på ditt navn» → per avtale: hva kreves, hvem ringer du, hva sier du → avkrysning. |
| **Nødvendige data** | Avtalelisten fra D1. Ingen ny innsamling. |
| **Integrasjoner** | Ingen. Hver leverandør har egen prosess; en generisk integrasjon finnes ikke. |
| **Partner** | Ingen. Merk at dette er nøyaktig den situasjonen Forbrukertilsynet har advart mot at selgere utnytter. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | 3 · **Personvernrisiko** 2 · **Kompleksitet** 3 |
| **Brukerverdi** | 8 · **Betalingsvilje** 4 |

---

# E. Livshendelser

## E1. Livshendelses-arbeidsflyter
| | |
|---|---|
| **Brukerproblem** | Ved store livshendelser endres forutsetningene i arkivet — men ingen oppdaterer det. |
| **Løsning** | Ikke en generisk «velg din livshendelse»-meny. **[ANBEFALING]** Bygg **tre**, ikke atten: **samlivsbrudd**, **nytt barn**, **kjøp av bolig**. Alle tre endrer arv, forsikring, fullmakter og mottakermatrise samtidig, og alle tre er hendelser brukeren selv oppsøker hjelp for. |
| **Hvorfor ikke alle atten** | Fordi 15 av dem vil stå tomme og få arkivet til å se forlatt ut. Full gjennomgang av alle 18 med hva hver enkelt faktisk krever: **appendiks 1**. |
| **Målgruppe** | Brukere midt i en endring — den eneste tilstanden der folk faktisk rydder i papirer. |
| **Brukerreise** | Eier melder hendelsen (eller vi spør ved årlig gjennomgang) → kort sjekkliste over hva som må endres → **direkte gjennomgang av mottakermatrisen**, som er det som oftest blir feil → påminnelse om det som ikke kan gjøres i dag. |
| **Nødvendige data** | Finnes. Dette er sjekklister + påminnelser + en gjennomgang av mottakermatrisen. |
| **Integrasjoner** | Ingen. Folkeregisteret varsler ikke om samlivsbrudd, og vi har uansett bare dødsfallshjemmel. |
| **Partner** | Ingen for de tre første. |
| **Inntektsmodell** | Inkludert; driver oppgradering fordi det er her folk ser at arkivet er utdatert. |
| **Juridisk risiko** | 3 · **Personvernrisiko** 3 · **Kompleksitet** 4 |
| **Brukerverdi** | 8 · **Betalingsvilje** 5 |

## E2. Årlig gjennomgang («er dette fortsatt riktig?»)
| | |
|---|---|
| **Brukerproblem** | Arkivet råtner. Kontakter flytter, avtaler endres, barn blir myndige. Et utdatert arkiv er verre enn ingen, fordi familien stoler på det. |
| **Løsning** | Én gang i året: en kort, konkret gjennomgang av det som mest sannsynlig er utdatert, basert på alder på oppføringen og på hva som har endret seg. |
| **Målgruppe** | Alle betalende brukere. Dette er selve abonnementet. |
| **Brukerreise** | Årlig e-post → 5–10 spørsmål, aldri hele arkivet → «stemmer dette fortsatt?» per element → oppdatert eller bekreftet → kvittering på at arkivet er gjennomgått, med dato de etterlatte kan se. |
| **Nødvendige data** | Tidsstempler vi allerede har. Ingen ny innsamling. |
| **Integrasjoner** | Ingen. |
| **Partner** | Ingen. |
| **Inntektsmodell** | Dette er selve begrunnelsen for et **abonnement** i stedet for engangsbetaling. |
| **Juridisk risiko** | 1 · **Personvernrisiko** 1 · **Kompleksitet** 3 |
| **Brukerverdi** | **9** · **Betalingsvilje** **8** |

**[ANBEFALING]** Den mest undervurderte tjenesten i katalogen. Den svarer på «hvorfor skal jeg betale hver måned for noe jeg fylte ut én gang».

---

# F. Digitale verdier

## F1. Kryptonøkkel-arv
| | |
|---|---|
| **Brukerproblem** | Seed-frasen dør med eieren. Ingen kundeservice, ingen domstol, ingen tilbakestilling. Chainalysis anslår ~3,7 mill. bitcoin tapt. **[FAKTA]** |
| **Løsning** | Sensitiv-tier finnes allerede og er teknisk riktig for dette. Det som mangler er **veiledningen**: hva som faktisk må lagres, hvordan man deler en seed-frase i deler, og hva som skjer hvis mottakeren mister sin del. |
| **Målgruppe** | Lite segment, høy betalingsvilje. Typisk menn 25–50 med beløp de ikke har fortalt familien om. |
| **Brukerreise** | Eier velger sensitiv-tier → veiledning om hva som skal lagres og hva som **ikke** skal (aldri hele frasen ett sted uten at konsekvensen er forstått) → kryptering i nettleseren → mottaker får nøkkelen først gjennom frigivelsen → mottakerveiledning skrevet for noen som aldri har sett en lommebok. |
| **Nødvendige data** | Kun kryptert klientside. Vi ser aldri innholdet. |
| **Integrasjoner** | Ingen — og det er et sikkerhetskrav, ikke en mangel. Enhver integrasjon mot en børs eller lommebok ville flyttet oss mot finansiell virksomhet. |
| **Partner** | Ingen. Se `PRIORITERT-ROADMAP.md` nr. 37 om hvorfor egen forvaring er utelukket. |
| **Inntektsmodell** | Premium (sensitiv-tier). Ikke en egen pris — det ville gjort oss til en kryptotjeneste. |
| **Alvorlig risiko** | Konsentrasjon av verdi. Et hvelv som er kjent for å inneholde kryptonøkler blir et mål. Zero-knowledge betyr at vi ikke kan hjelpe hvis frasen mistes — det må sies rått og tydelig. |
| **Juridisk risiko** | 5 · **Personvernrisiko** 4 · **Kompleksitet** 4 (veiledning) |
| **Brukerverdi** | **9** for de få · **Betalingsvilje** **9** for de få |

## F2. Inntektsgivende digitale eiendeler
| | |
|---|---|
| **Brukerproblem** | Domener, nettbutikker, YouTube-kanaler og apper som gir inntekt, stopper eller forsvinner. Domener utløper. |
| **Løsning** | Egen kategori med fornyelsesdatoer, hvem som må gjøre hva, og instruks om videreføring eller avvikling. |
| **Målgruppe** | Selvstendig næringsdrivende, skapere, småbedriftseiere. Lite segment i Norge foreløpig. |
| **Brukerreise** | Eier registrerer eiendel + fornyelsesdato + hvem som har tilgang hos leverandøren → varsel før fornyelse → ved frigivelse får den utpekte instruks om videreføring eller avvikling. |
| **Nødvendige data** | Eiendel, leverandør, fornyelsesdato, inntektsnivå i grove trekk, instruks. |
| **Integrasjoner** | Ingen. WHOIS-oppslag kunne automatisert fornyelsesdatoer, men er ikke verdt kompleksiteten på dette volumet. |
| **Partner** | Ingen. Eventuelt regnskapsfører som kanal. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | 3 · **Personvernrisiko** 2 · **Kompleksitet** 3 |
| **Brukerverdi** | 7 · **Betalingsvilje** 6 (høy for de som har det) |

---

# G. Familie og tilgang

## G1. Gradert pårørendetilgang før dødsfall
| | |
|---|---|
| **Brukerproblem** | Et voksent barn hjelper mor med regninger. I dag er valget alt eller ingenting — enten deler hun BankID (som er ulovlig og farlig), eller hun får ikke hjelp. |
| **Løsning** | Tidsbegrenset, rollebasert lesetilgang til utvalgte deler av arkivet, med revisjonslogg og enkel tilbaketrekking. Ikke tilgang til kontoer — tilgang til *opplysningene*. |
| **Målgruppe** | Voksne barn 40–60 som hjelper en forelder 75+. Kjøperen og brukeren er ulike personer. |
| **Brukerreise** | Eier velger person og hvilke deler → setter utløpsdato → mottakeren får lesetilgang og ser tydelig at alt logges → eieren ser en oversikt over hva som er sett → tilgangen utløper av seg selv, eller trekkes med ett trykk. |
| **Nødvendige data** | Modellen finnes (kontakter, matrise, RLS). Dette er nye policyer, ikke ny arkitektur. |
| **Integrasjoner** | Ingen. BankID ville styrket identitetssikkerheten — se `PARTNERE-OG-INNTEKTER.md` pkt. 8. |
| **Partner** | Ingen nødvendig. |
| **Inntektsmodell** | Familie- eller premium-abonnement. Dette er den klareste begrunnelsen for et familieabonnement i hele katalogen. |
| **Juridisk risiko** | 4 · **Personvernrisiko** 6 · **Kompleksitet** 6 |
| **Brukerverdi** | **9** · **Betalingsvilje** 7 |

## G2. Flere godkjennere for særlig sensitivt innhold
| | |
|---|---|
| **Brukerproblem** | Noe bør kreve at to i familien er enige, ikke bare én. |
| **Løsning** | Terskelkrav per element: «denne krever to av tre mottakere». |
| **Målgruppe** | Smalt. Familier med kjent konfliktpotensial, eller innhold som ikke bør leses alene. |
| **Brukerreise** | Eier merker ett element med terskel → ved frigivelse ser mottaker at elementet finnes, men er låst → to må be om åpning → begge varsles, alle andre kontakter varsles → åpnes. |
| **Nødvendige data** | Finnes, pluss en terskel per element. |
| **Integrasjoner** | Ingen. Kryptografisk terskeldeling (Shamir) er nevnt som mulig oppgradering i ADR-001. |
| **Partner** | Ingen. |
| **Inntektsmodell** | Premium. |
| **Kompleksitet** | 7 · **Juridisk risiko** 2 · **Personvernrisiko** 3 |
| **Brukerverdi** | 6 · **Betalingsvilje** 4 |

## G3. Tjeneste for dem uten nær familie
| | |
|---|---|
| **Brukerproblem** | Alle funksjonene våre forutsetter en betrodd kontakt. Enslige uten barn — en voksende gruppe — har ingen å oppgi. |
| **Løsning** | Profesjonell betrodd part: advokat, verge eller vår egen bemannede rolle, mot betaling. |
| **Målgruppe** | Enslige 60+, barnløse, folk med familie i utlandet, folk som er brutt med familien. |
| **Brukerreise** | Eier oppdager i onboarding at hen ikke har noen å oppgi → tilbud om profesjonell betrodd part → avtale med navngitt ansvarlig og fast pris → årlig bekreftelse på at ordningen står → ved dødsfall melder den profesjonelle parten, og fire-øyne-kravet gjelder som ellers. |
| **Nødvendige data** | Som ellers, pluss en avtale med reelt ansvarsinnhold. |
| **Integrasjoner** | Ingen teknisk. Alt det vanskelige er organisatorisk. |
| **Partner** | Advokatfirma, eller vår egen bemanning. Statsforvalterens vergeordning dekker ikke dette. |
| **Inntektsmodell** | Egen betalt tjeneste, årlig avgift. Trolig den høyeste prisen i hele katalogen. |
| **Juridisk risiko** | **8** — dette er å påta seg et ansvar. Krever avklaring. |
| **Personvernrisiko** | 5 |
| **Kompleksitet** | 5 teknisk, **9** organisatorisk (det er bemanning, ikke kode) |
| **Brukerverdi** | **10** for gruppen · **Betalingsvilje** **9** |

**[HYPOTESE]** Dette kan være det mest betalingsvillige segmentet i hele katalogen. Det er også det som krever mest av oss som organisasjon. Valider før du bygger.

---

# H. AI

Felles avgrensning for alle: **AI foreslår, mennesket bestemmer.** Ingen AI-funksjon får stå på kritisk sti i frigivelsesløpet — det prinsippet er allerede håndhevet i koden og skal ikke mykes opp. AI skal aldri fremstilles som advokat, lege eller finansiell rådgiver.

## H1. Beredskapsscore med konkret neste steg
| | |
|---|---|
| **Brukerproblem** | Brukeren vet ikke om arkivet er godt nok. |
| **Løsning** | En score som er **regelbasert, ikke AI** — har du betrodd kontakt? mottakermatrise? oppdatert siste 12 mnd? — med én konkret neste handling. |
| **Hvorfor regelbasert** | Fordi den skal være forklarlig og lik for alle. En AI-generert score som ingen kan begrunne, er verre enn ingen. |
| **Målgruppe** | Nye brukere i onboarding, og alle som har stoppet halvveis. |
| **Brukerreise** | Forside viser score + **én** neste handling → handlingen tar under to minutter → scoren oppdateres synlig → neste handling dukker opp. Aldri en liste på 12 mangler. |
| **Nødvendige data** | Kun metadata om arkivet, aldri innhold. Fungerer også for sensitiv-tier, som vi ikke kan lese. |
| **Integrasjoner** | Ingen. |
| **Partner** | Ingen. |
| **Inntektsmodell** | Inkludert. Driver utfylling av alt annet. |
| **Juridisk risiko** | 2 · **Personvernrisiko** 1 · **Kompleksitet** 3 |
| **Brukerverdi** | 8 · **Betalingsvilje** 5 |

## H2. Dokumentforståelse ved opplasting
| | |
|---|---|
| **Brukerproblem** | Å legge inn en forsikringspolise manuelt er kjedelig nok til at folk lar være. |
| **Løsning** | Last opp en polise → AI foreslår kategori, tittel, utløpsdato og hvilke felt som mangler. Brukeren godkjenner. |
| **Målgruppe** | Alle i utfyllingsfasen. |
| **Brukerreise** | Opplasting → forslag vises som **utkast med tydelig merking** → brukeren retter og godkjenner → ingenting lagres før godkjenning. |
| **Nødvendige data** | Dokumentet må leses av modellen. Det er hele avveiningen. |
| **Integrasjoner** | Modellleverandør med databehandleravtale og EØS-behandling. |
| **Partner** | Modellleverandør. Valget er en personvernbeslutning, ikke en teknisk. |
| **Inntektsmodell** | Premium — det er en reell kostnad per dokument. |
| **Personvernrisiko** | **7** — dokumentet må leses av modellen. **Kan ikke kombineres med sensitiv-tier**, som er zero-knowledge. Krever tredjelandsvurdering eller EØS-modell. |
| **Juridisk risiko** | 4 · **Kompleksitet** 5 |
| **Brukerverdi** | 8 · **Betalingsvilje** 5 |

## H3. Etterlatte-assistent
| | |
|---|---|
| **Brukerproblem** | Etterlatte vet ikke hva de skal spørre om, og orker ikke lete i en struktur de aldri har sett. |
| **Løsning** | «Hva gjør jeg nå?» i fritekst, besvart ut fra det frigitte arkivet og en sjekkliste. |
| **Målgruppe** | Mottakere etter frigivelse. |
| **Brukerreise** | Etterlatt spør i fritekst → svaret **peker på hva som finnes i arkivet**, med lenke → aldri råd, aldri tolkning av jus → «dette vet jeg ikke» er et gyldig svar og skal brukes ofte. |
| **Nødvendige data** | Kun det som allerede er frigitt til denne mottakeren. RLS er porten, også for modellen. |
| **Integrasjoner** | Modellleverandør med DPA. Samme vurdering som H2. |
| **Partner** | Samme som H2. |
| **Inntektsmodell** | Gratis for etterlatte. Alt annet ville vært å ta betalt av folk i sorg. |
| **Risiko** | Feil svar til en person i sorg er en alvorlig feil. Må begrenses til å *finne fram i det som finnes*, ikke gi råd. |
| **Juridisk risiko** | **6** · **Personvernrisiko** 6 · **Kompleksitet** 5 |
| **Brukerverdi** | **9** · **Betalingsvilje** 4 |

---

# I. Beredskap og trygghet

## I1. Svindelvarsling til pårørende
| | |
|---|---|
| **Brukerproblem** | Vishing-saker opp ~50 % på ett år, ~70 % av ofrene kvinner, 60+ overrepresentert. **[FAKTA]** Pårørende oppdager det ofte for sent. |
| **Løsning** | **[ANBEFALING]** Ikke bygg overvåking. Bygg det enkle: en avtalt «ring meg først»-ordning der eldre bruker kan trykke én knapp for å varsle en betrodd person, og et forhåndsavtalt kodeord mot telefonsvindel. |
| **Målgruppe** | 70+, og de voksne barna deres. |
| **Brukerreise** | Familien avtaler kodeord i appen → eier har én stor knapp «ring meg først» → betrodd kontakt varsles med tid og sted, aldri med innhold → kontakten ringer. |
| **Nødvendige data** | Kodeordet (som ikke bør lagres i klartekst), og hvem som varsles. Ingen transaksjonsdata. |
| **Integrasjoner** | Ingen. Se avgrensningen under. |
| **Partner** | Eventuelt Pensjonistforbundet eller Seniornett som distribusjon og som fagfelle på formuleringene. |
| **Hvorfor ikke overvåking** | Vi har ingen transaksjonsdata og får det ikke. Bankene har det og gjør det bedre. Å love svindeloppdagelse vi ikke kan levere, er verre enn å la være. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | 3 · **Personvernrisiko** 3 · **Kompleksitet** 3 |
| **Brukerverdi** | 8 · **Betalingsvilje** 6 |

## I2. Katastrofeberedskap
| | |
|---|---|
| **Brukerproblem** | Huset brenner, eller sekken blir stjålet i utlandet. Alt som trengs for å komme videre ligger i det som brant. |
| **Løsning** | Kopi av pass, forsikringspoliser og kontaktinfo tilgjengelig når huset brenner eller sekken blir stjålet i utlandet. |
| **Målgruppe** | Alle. Den bredeste målgruppen i katalogen. |
| **Brukerreise** | Eier legger inn ved onboarding (det er uansett de samme dokumentene) → én knapp «jeg har mistet alt» → viser det som trengs, sortert etter hva man ringer først. |
| **Nødvendige data** | Finnes i kategoriene juridisk og forsikring. |
| **Integrasjoner** | Ingen. |
| **Partner** | Reiseforsikringsleddet hos et forsikringsselskap er en åpenbar kanal — samme partner som hovedsporet. |
| **Inntektsmodell** | Inkludert. Verdien er at den senker terskelen for å begynne. |
| **[TOLKNING]** | Dette er den ene utvidelsen som gir verdi **mens brukeren lever og er frisk** — og som derfor kan senke terskelen for å komme i gang. Alt annet i produktet handler om noe folk helst ikke vil tenke på. |
| **Juridisk risiko** | 2 · **Personvernrisiko** 4 (pass er sensitivt i praksis, om ikke i lovens forstand) · **Kompleksitet** 2 |
| **Brukerverdi** | 7 · **Betalingsvilje** 5 |

---

# J. Minner

## J1. Meldinger til fremtidige datoer
| | |
|---|---|
| **Brukerproblem** | Foreldre vil si noe til barna sine på et tidspunkt de kanskje ikke får oppleve. |
| **Løsning** | «Til datteren min på hennes 25-årsdag.» Frigis på dato, ikke ved dødsfall. |
| **Målgruppe** | Foreldre, besteforeldre, og alvorlig syke. |
| **Brukerreise** | Eier skriver melding + dato + mottaker → **får se hvor lang tid det er, og hva vi lover** → meldingen inngår i eksporten, slik at den ikke er avhengig av oss → leveres på dato. |
| **Nødvendige data** | Melding, mottaker, dato. |
| **Integrasjoner** | Ingen — men eksportmodellen må dekke dette, ellers er løftet tomt. |
| **Partner** | Eventuelt en uavhengig tredjepart for oppbevaring (jf. konsept nr. 9 i `KREATIVE-KONSEPTER.md`). |
| **Inntektsmodell** | Premium. Men se forpliktelsen under før du tar betalt. |
| **Alvorlig forpliktelse** | En melding som skal leveres om 20 år er et løfte om at vi finnes om 20 år. **[TOLKNING]** Cake beviste at det løftet kan brytes. Enten løser vi dette i eksportmodellen — mottakeren får en fil som virker uten oss — eller så lover vi det ikke. |
| **Juridisk risiko** | 3 · **Personvernrisiko** 3 · **Kompleksitet** 5 |
| **Brukerverdi** | 8 · **Betalingsvilje** 6 |

## J2. Kontekst til bildene
| | |
|---|---|
| **Brukerproblem** | Familien arver 40 000 bilder og vet ikke hvem som er på dem. |
| **Løsning** | Ikke lagre bildene. Lagre **historien**: hvem er hvem, hvor er albumene, hva er viktig. |
| **Målgruppe** | 65+, og den i familien som «har alle bildene». |
| **Brukerreise** | Eier peker på hvor bildene ligger → skriver hvem som er hvem i de viktigste albumene → utpeker hvem som skal arve dem → frigis. |
| **Nødvendige data** | Tekst og pekere. Ingen bildefiler — bevisst, av lagrings- og personvernhensyn. |
| **Integrasjoner** | Ingen. Skytjenestenes arveordninger er beskrevet i B3. |
| **Partner** | Ingen. |
| **Inntektsmodell** | Inkludert. |
| **Juridisk risiko** | 2 · **Personvernrisiko** 3 (opplysninger om tredjepersoner) · **Kompleksitet** 3 |
| **Brukerverdi** | 7 · **Betalingsvilje** 4 |

---

## Tjenester jeg vurderte og forkaster

Med begrunnelse, så de ikke kommer tilbake:

| Tjeneste | Hvorfor ikke |
|---|---|
| Egen økonomisk oversikt for etterlatte | Digitalt dødsbo gjør det bedre, gratis, med kilder vi ikke får. |
| Generisk verdigjenstandsregister | Gjensidige og andre har det allerede, koblet til erstatningen. |
| Abonnementsoppdagelse fra bankdata | Krever PSD2-konsesjon. Bankene har det. |
| Strømprovisjon | Se D2. Tillitskostnaden er større enn inntekten. |
| Automatisk oppsigelse av avtaler ved dødsfall | Vi har ikke fullmakt, og feil oppsigelse gjør reell skade. |
| Digitalt signert testament | Ulovlig i Norge i dag (arveloven § 42 krever samtidige fysiske vitner). Revurder hvis Norge følger Sverige. |
| Automatisk innlogging på avdødes kontoer | Bryter plattformenes vilkår. Kan være straffbart. |
| Fullt kryptolommebok-integrasjon | Å holde nøkler for andre er finansiell virksomhet. Eget konsesjonsspor. |
| ID-tyveriovervåking | Krever datakilder vi ikke har. Etablerte aktører gjør det, og vi ville bare videreselge. |

---

# Personvern, sikkerhet og regulering — samlet gjennomgang

Oppdraget ba om at hver dimensjon vurderes for alle forslag. Her er dimensjonene med det som gjelder på tvers, og hvilke tjenester som skiller seg ut.

| Dimensjon | Gjelder på tvers | Tjenester som krever noe eget |
|---|---|---|
| **GDPR-grunnlag** | Avtale (art. 6 b) for kjernetjenesten. Samtykke der data forlater plattformen. | A3 og H2 (deling til tredjepart), C1 og C2 (art. 9). |
| **Dataminimering** | Alle forslag som *ikke* lagrer dokumentet, men bare at det finnes, er valgt bevisst: A2, B3, J2. | J1 lagrer innhold over lang tid — det er den svakeste minimeringen i katalogen. |
| **Samtykke** | Må være avgrenset, tidsbegrenset og trekkbart. | A3, H2, G1 (tilgang gitt til et menneske), C1. |
| **Særlige kategorier (art. 9)** | Helseopplysninger krever uttrykkelig samtykke. | **C1 og C2 er de eneste med art. 9-data.** Krever egen vurdering før bygging. |
| **Tilgangsstyring** | Person-skopet RLS avgjør per rad. Nye tjenester som gir noen innsyn krever ny policy **og** ny RLS-test i samme leveranse. | G1, G2, C3, B1. |
| **Kryptering** | Sensitiv-tier er zero-knowledge i nettleseren. | F1 hviler helt på den. **H2 og H3 kan aldri kombineres med sensitiv-tier** — modellen kan ikke lese det vi ikke kan lese. |
| **Logging** | Append-only revisjon uten innhold. | C1 trenger **egen** logg fordi tilgangen skjer uten innlogging. Konsept nr. 41 foreslår å bruke loggen aktivt — krever juridisk vurdering. |
| **Sletting** | Kontosletting finnes. | C3 er den vanskelige: tilgang gitt ved helsesvikt må kunne **reverseres**, ikke bare slettes. |
| **Dataportabilitet** | Eksport finnes. | J1 avhenger av at eksporten er selvstendig lesbar uten oss. Det er en forutsetning, ikke en finesse. |
| **Lagringssted** | EU/EØS. | H2/H3 krever EØS-modell eller full tredjelandsvurdering. |
| **Identitetskontroll** | Passord + TOTP for admin i dag. | BankID ville hevet G1, C3 og G3 betydelig. Se `PARTNERE-OG-INNTEKTER.md` pkt. 8. |
| **Juridisk ansvar** | Vi svarer for verktøyet, brukeren for innholdet. | A1/A3 (malen), G3 (ansvaret som betrodd part), H3 (svar til en sørgende). |
| **Finansielle reguleringer** | Vi driver ikke finansiell virksomhet, og skal ikke. | F1 må aldri bli forvaring. «Provisjon forsikring» er konsesjonspliktig formidling. |
| **Forsikringsformidling** | Grensen går ved å *varsle om en hendelse* versus å *anbefale, sammenligne eller formidle*. **[FAKTA]** | Konsept nr. 4 (forsikringshullet) ligger tettest på grensen av alt i katalogen. Må avklares. |
| **Juridiske tjenester** | Vi gir generell informasjon og teknisk dokumentstøtte. Aldri rettsråd. | A1, A2, A3, C3 — de fire nivåene er definert i `FREMTIDSFULLMAKT.md`. |
| **Markedsføring og provisjoner** | Ethvert henvisningshonorar opplyses der henvisningen skjer. | A3, B4. |
| **Interessekonflikter** | Vi tar aldri betalt for å påvirke et valg brukeren gjør i arkivet. | D2 er forkastet nettopp av denne grunn. |

**Krever juridisk vurdering før implementering:** A1, A3, C1, C2, C3, G3, H2, H3, og konsept nr. 4, 25 og 41 i `KREATIVE-KONSEPTER.md`. Samlet i `PRIORITERT-ROADMAP.md` under «Juridisk avklaring nødvendig».

---

# Appendiks 1 — alle 18 livshendelser

Oppdraget ba om en gjennomgang av 18 livshendelser. Anbefalingen er fortsatt å bygge **tre** (E1). Her er de øvrige 15 med hva de faktisk krever, slik at valget er dokumentert og ikke tilfeldig.

| Livshendelse | Hva brukeren må huske | Hva som må endres i arkivet | Bygg? |
|---|---|---|---|
| **Samlivsbrudd** | Testament, forsikringsbegunstigelse, fullmakter, felles lån | Mottakermatrise, kontakter, betrodd-flagg — nesten alt | **Ja, først** |
| **Nytt barn** | Verge, forsikring, testament, barnas oppvekst | Mottakere, ny kategori for barnet, forsikringsbehov | **Ja** |
| **Boligkjøp** | Lånedokumenter, forsikring, nøkler, boligens historie | Eiendeler, forsikring, tilgangsinfo | **Ja** |
| Boligsalg | Avtaleoverføring, garantidokumenter | Eiendeler, avtaler | Nei — dekkes av D3 |
| Flytting | Adresse på alle avtaler, strøm | Avtaler | Nei — for lite som endres |
| Samboerskap | **Samboere arver ikke uten testament** | Juridisk, mottakere | Nei, men gi advarselen i A2 |
| Ekteskap | Ektepakt, begunstigelse, navneendring | Juridisk, forsikring | Nei — nær samlivsbrudd i mekanikk |
| Pensjonering | Pensjonsvalg, forsikringer som opphører | Forsikring, økonomi | Nei — men høy relevans for målgruppen; vurder senere |
| Alvorlig sykdom | Fullmakt, helsedirektiv, hvem som varsles | Alt — dekkes av C2 og C3 | Dekkes andre steder |
| Dødsfall (annens) | Skifte, overføringer | Dekkes av B1 | Dekkes andre steder |
| Utenlandsopphold | Forsikring, fullmakt, beredskapskontakt | Kontakter, forsikring | Nei — dekkes av konsept nr. 33 |
| Utvandring | Skatt, trygd, jurisdiksjon for testament | Juridisk — og en advarsel om at norsk rett kanskje ikke gjelder | Nei — for komplekst, gi advarsel |
| Etablering av selskap | Aksjonæravtale, nøkkelmannforsikring | Juridisk, digitale eiendeler | Nei — annet marked |
| Salg av selskap | Skatt, oppgjør | — | Nei |
| Kjøp av hytte | Dokumenter, nøkler, sameieavtale | Eiendeler, tilgangsinfo | Nei — dekkes av boligkjøp |
| Kjøp av båt | Registrering, forsikring | Eiendeler | Nei |
| Kjøp/salg av bil | Omregistrering, forsikring | Eiendeler | Nei — Digitalt dødsbo dekker kjøretøy ved død |
| Kjøp av hund/kjæledyr | Hvem tar dyret hvis noe skjer | Praktisk | Nei som arbeidsflyt — ja som felt (konsept nr. 12) |

**[TOLKNING]** Mønsteret er tydelig: tre hendelser endrer *hvem som skal ha hva*. Resten endrer bare *hva som står i et felt*. Bare de tre første fortjener en egen flyt.

# Appendiks 2 — råmateriale til etterlattesjekklisten (B1)

Oppdraget listet en rekke oppgaver ved dødsfall. Her er de sortert etter hva som faktisk haster, og etter hvem som løser det. Dette er innholdsgrunnlaget for B1, ikke en funksjonsliste.

**Første døgn — og bare dette:** varsle nærmeste · kjæledyr · låse bolig · begravelsesbyrå · finne testament (A2 sier hvor det er).

**Første uke:** melde dødsfall til NAV (skjer ofte automatisk via Folkeregisteret) · arbeidsgiver · begravelse · skifteattest fra tingretten · sperre kort.

**Første måned — mye av dette gjør staten:** *Digitalt dødsbo gir bankkontoer, eiendom, kjøretøy, forsikring, pensjon og gjeld automatisk.* **[FAKTA]** Vi dekker resten: abonnementer og faste trekk (B2) · strøm, mobil, bredbånd, TV, alarm (D3) · medlemskap og treningssenter · bombrikke og parkering · leasing og serviceavtaler.

**Når det er tid:** sosiale medier og minnekontoer (B3) · bilder og skylagring (B3, J2) · lojalitetsprogrammer og flybonus (ofte ikke arvelige — **sjekk vilkårene, ikke lov noe**) · refusjoner og utestående krav · selve arveoppgjøret (B4).

**[ANBEFALING]** Rekkefølgen er verdien. Innholdet kan enhver skrive; det er å vite hva som *ikke* haster som gjør listen bærbar for noen i sorg.
