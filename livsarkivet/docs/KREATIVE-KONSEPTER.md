# Kreative konsepter — 41 ideer

**Dato:** 28. juli 2026 · **Status:** idégrunnlag. Ingen av disse er besluttet, og de fleste bør aldri bygges.

Oppdraget ba om «minst 30 originale ideer som ikke er nevnt i denne prompten». Her er 41 ideer,
og **30 av dem står ikke i oppdraget**. De elleve som gjør det, er merket
**[STIKKORD FRA OPPDRAGET]** — de er tatt med fordi vrien er vår, ikke fordi de er nye.
Å telle dem som originale ville vært juks mot meg selv.

Ideene er sortert etter hvor godt de utnytter noe Livsarkivet allerede har og andre ikke har:
**verifisert dødsfall, fire øyne, karenstid, mottakermatrise, append-only revisjonslogg og
zero-knowledge.**

Hver idé har seks felt: **konsept · hvorfor den er ny · hvem den hjelper · hvorfor den passer oss ·
billig validering · hva som gjør den vanskelig å kopiere.**

---

## De ti sterkeste

### 1. Dødsattest-som-tjeneste for tredjeparter
**Konsept:** Vi har allerede den dyreste delen av infrastrukturen — et verifisert dødsfall bekreftet av to mennesker. Tilby det som et signert varsel til enhver aktør kunden har godkjent: banken, borettslaget, treningssenteret, veterinæren.
**Nytt:** Ingen selger «verifisert dødsfall» som en primitiv. Alle bygger det på nytt selv.
**Hjelper:** Etterlatte som må ringe 20 steder og forklare det samme.
**Passer oss:** Det *er* kjerneloopen vår, bare eksponert.
**Valider:** Spør tre borettslag og ett treningssenter om de ville tatt imot et slikt varsel.
**Vanskelig å kopiere:** Krever fire-øyne-bemanning og attestflyt. Det er organisasjon, ikke kode.

### 2. «Ingen svarte»-eskaleringen · **[STIKKORD FRA OPPDRAGET]** (dead man's switch, varsling ved manglende aktivitet)
**Konsept:** Frigivelsen fungerer bare hvis noen melder fra. Men enslige har ingen som melder. Snu det: hvis eieren ikke har logget inn på X måneder **og** ikke svarer på tre varsler, eskaleres det til en forhåndsvalgt person — ikke med tilgang, men med spørsmålet *«har du hørt fra henne?»*.
**Vrien som er vår:** Dead man's switch gir vanligvis *tilgang*. Denne gir bare et *spørsmål*.
**Hjelper:** Enslige, og folk hvis nærmeste bor langt unna.
**Passer oss:** Vi har varslingskø og kontakter. Terskelen for å bygge er lav.
**Valider:** Spør 20 brukere om de ville hatt det, og hvem de ville pekt på.
**Vanskelig å kopiere:** Krever tillit til at vi ikke gir tilgang — som er hele merkevaren.

### 3. Etterlattemodus for én ting om gangen · **[STIKKORD FRA OPPDRAGET]** (stegvis sjekkliste)
**Konsept:** I stedet for en liste med 40 oppgaver: én oppgave per dag, den som haster mest, med alt som trengs samlet. Resten er skjult.
**Vrien som er vår:** Oppdraget ba om en stegvis sjekkliste. Dette er det motsatte av en liste. For en person i sorg er 40 punkter en grunn til å lukke appen.
**Hjelper:** Etterlatte i de første ukene.
**Passer oss:** Vi vet hva som finnes i arkivet og kan rekkefølge det.
**Valider:** To papirprototyper til fem personer som nylig mistet noen. Hvilken orker de å bruke?
**Vanskelig å kopiere:** Rekkefølgen krever kunnskap om norsk dødsbo *og* om sorg. Det er redaksjonelt arbeid, ikke funksjonalitet.

### 4. Forsikringshullet
**Konsept:** Analyser hva kunden har oppgitt av forsikringer, og pek på det som **mangler** i lys av livssituasjonen — ikke på hva de bør kjøpe av hvem.
**Nytt:** Alle sammenligningstjenester selger. Ingen sier bare «du har ingen uføredekning og to barn» og stopper der.
**Hjelper:** Folk som tror de er dekket.
**Passer oss:** Vi ser hele bildet uten å selge noe. Det er nettopp fordi vi *ikke* tar provisjon at rådet er verdt noe.
**Valider:** Manuell gjennomgang for 20 brukere. Reagerte noen?
**Vanskelig å kopiere:** Kun troverdig fra en aktør uten provisjonsinteresse. Det utelukker de fleste.

### 5. Bevisbanken for de etterlatte · **[STIKKORD FRA OPPDRAGET]** (gaver og forskudd på arv)
**Konsept:** Ikke bare hva avdøde eide — men **hva de skyldte deg, og hva du skylder dem**. Muntlige lån mellom søsken, forskudd på arv, «pappa betalte for hytta mi».
**Vrien som er vår:** Oppdraget nevner forskudd på arv som et *felt*. Dette er noe annet: et sted der de muntlige avtalene skrives ned mens begge parter lever og kan protestere.
**Hjelper:** Familier som ellers ryker.
**Passer oss:** Vi har allerede et sted der eieren skriver ned ting bare hen vet.
**Valider:** Spør fem arverettsadvokater hva de krangler mest om.
**Vanskelig å kopiere:** Krever et sted folk allerede skriver ned sannheten. Det tar år å bygge.

### 6. Den doble nøkkelen for familiehemmeligheter · **[STIKKORD FRA OPPDRAGET]** (tilgang som krever flere godkjennere)
**Konsept:** Noen opplysninger bør bare komme fram hvis to mottakere er enige om å åpne dem — for eksempel opplysninger om biologisk opphav.
**Vrien som er vår:** Terskelen gjelder ikke *tilgang til systemet*, men *én bestemt opplysning*, og den er kryptografisk, ikke en policy vi kan overstyre.
**Hjelper:** Den som bærer på noe som bør sies, men ikke av dem alene.
**Passer oss:** Fire-øyne-mønsteret finnes allerede — dette er samme idé, flyttet til mottakersiden.
**Valider:** Vanskelig. Spør en familieterapeut før du spør en bruker.
**Vanskelig å kopiere:** Krever kryptomodell med terskeldeling **og** en organisasjon som tør.

### 7. Overleveringsprotokollen
**Konsept:** Ikke bare *gi* arkivet til de etterlatte — men **overføre eierskapet** til et nytt Livsarkiv, slik at gjenlevende ektefelle arver strukturen og ikke bare innholdet.
**Nytt:** Alle konkurrenter behandler frigivelsen som slutten. For gjenlevende er det starten på hens eget behov.
**Hjelper:** Den gjenlevende, som nå sitter med *to* liv å administrere.
**Passer oss:** Det gjør hver frigivelse til en ny bruker. Beste anskaffelseskanal vi har.
**Valider:** Spør enker og enkemenn om de savnet dette.
**Vanskelig å kopiere:** Krever at frigivelsen er godt løst i utgangspunktet.

### 8. Katastrofemodus · **[STIKKORD FRA OPPDRAGET]** (katastrofeberedskap)
**Konsept:** Én knapp: «huset brenner / jeg er ranet i utlandet / jeg har mistet alt». Gir umiddelbart det man trenger — pass, poliser, kontonumre, kontakter — uten å navigere.
**Vrien som er vår:** Den ene funksjonen som gir verdi mens brukeren lever og er frisk.
**Hjelper:** Alle, en gang i livet.
**Passer oss:** Senker terskelen for å komme i gang. Alt annet i produktet handler om noe folk helst ikke vil tenke på.
**Valider:** Spør ti som har opplevd brann eller ran hva de savnet.
**Vanskelig å kopiere:** Ikke særlig — men det er en god grunn til å bygge den først.

### 9. Den ærlige nedleggelsesplanen
**Konsept:** Gjør exit-garantien til en **funksjon**, ikke en klausul: en automatisk, kryptert kopi hos en uavhengig tredjepart som utløses hvis Livsarkivet slutter å svare i X dager.
**Nytt:** Cake beviste at faren er reell. Ingen har svart på den med teknikk.
**Hjelper:** Alle som lurer på om vi finnes om 20 år — altså alle.
**Passer oss:** Det er den eneste innvendingen som gjentar seg i alle brukerkilder.
**Valider:** Legg det inn i pitchen og se om det nevnes tilbake.
**Vanskelig å kopiere:** Krever at man tør å bygge for sin egen død. De fleste selskaper vil ikke.

### 10. Fullmektigens dagbok
**Konsept:** Når en fremtidsfullmakt er i bruk, får fullmektigen et sted å loggføre hva som er gjort på fullmaktsgivers vegne — synlig for de andre pårørende.
**Nytt:** Fullmektiger mistenkeliggjøres i dag rutinemessig, uten å ha noe å vise til.
**Hjelper:** Fullmektigen mest av alle. Og familiefreden.
**Passer oss:** Vi har en immutabel revisjonslogg. Dette er den, vendt mot brukeren.
**Valider:** Spør fem som har vært fullmektig.
**Vanskelig å kopiere:** Krever append-only-logg med troverdighet — vi har grants-modellen for det.

---

## De neste 22

**11. Adressebok for det siste året.**
*Konsept:* En prioritert varslingsliste: hvem må vite det, i hvilken rekkefølge, og hvem må **ikke** få vite det fra Facebook først.
*Nytt:* Alle har en kontaktliste. Ingen har en *rekkefølge* med begrunnelse.
*Hjelper:* Etterlatte som glemmer noen, og den som blir glemt.
*Passer oss:* Kontaktene og matrisen finnes; dette er én sortering til.
*Valider:* Spør tre som nylig har mistet noen hvem de glemte å varsle.
*Kopieringsvern:* Svakt teknisk — men rekkefølgen er redaksjonell kunnskap.

**12. Kjæledyrprotokollen.** · **[STIKKORD FRA OPPDRAGET]** (kjæledyr)
*Konsept:* Hvem tar dyret, hva spiser det, hvilken veterinær, hva er avtalt — og varsling til den avtalte personen ved frigivelse.
*Vrien som er vår:* Ikke et felt, men en **avtale med en navngitt person som har sagt ja på forhånd**.
*Hjelper:* Dyret. Og den som ellers står med det i en bærebur.
*Passer oss:* Bruker mottakermatrisen og varslingskøen uendret.
*Valider:* Spør et dyrevernsamband hvor mange dyr som kommer inn etter dødsfall.
*Kopieringsvern:* Lavt. Bygg fordi det er riktig, ikke for forsvarsverket.

**13. Nøkkelkartet.**
*Konsept:* Ikke passord — fysiske nøkler. Hvilken nøkkel går hvor, hvor er reservenøkkelen, hvem har kopi.
*Nytt:* Hele kategorien «digital arv» har glemt at de fleste låser fortsatt er av metall.
*Hjelper:* Etterlatte som står utenfor en bod ingen har nøkkel til.
*Passer oss:* Ett hvelvelement. Nesten ingen kode.
*Valider:* Spør ti brukere om de vet hvor alle reservenøklene er.
*Kopieringsvern:* Ingen. Bygg det likevel — det tar en time.

**14. «Ikke gjør dette»-listen.**
*Konsept:* Eierens eksplisitte forbud: ikke selg hytta det første året, ikke la onkel Per holde tale, ikke gi bort verktøyet.
*Nytt:* Alle produkter samler ønsker. Ingen samler forbud, selv om negativ instruks er lettere å skrive og oftere det som betyr noe.
*Hjelper:* Etterlatte som skal ta valg de ikke vil bli bebreidet for.
*Passer oss:* Ren tekst i en eksisterende kategori.
*Valider:* Be ti brukere skrive tre ønsker og tre forbud. Hva går raskest?
*Kopieringsvern:* Lavt teknisk, men vanskelig å ta med en gang det er etablert som *vår* måte å spørre på.

**15. Beredskapskort for pårørende, ikke for deg selv.** · **[STIKKORD FRA OPPDRAGET]** (administrasjonshjelp for eldre foreldre)
*Konsept:* Voksne barn registrerer *foreldrenes* opplysninger, med foreldrenes samtykke.
*Vrien som er vår:* Snur eierskapet i datamodellen — den som fyller ut er ikke den arkivet handler om.
*Hjelper:* Den som faktisk er motivert, som sjelden er den eldste.
*Passer oss:* Krever at samtykket er ekte og dokumentert — det har vi mekanikk for.
*Valider:* Spør 15 voksne barn om de ville gjort dette for en forelder.
*Kopieringsvern:* Samtykkemodellen er den vanskelige delen, ikke skjemaet.

**16. Digital rydding mens du lever.**
*Konsept:* Årlig gjennomgang av kontoer du ikke bruker, med sletting som mål.
*Nytt:* Alle andre samler *flere* kontoer. Dette er den eneste funksjonen som gjør arkivet mindre.
*Hjelper:* Brukeren selv — mindre angrepsflate — og de etterlatte, som slipper rotet.
*Passer oss:* Selges som personvern, ikke som død. Det er en helt annen inngang til samme produkt.
*Valider:* Send én e-post til eksisterende brukere: «vil du rydde?» Mål åpningsrate.
*Kopieringsvern:* Lavt — men det strider mot forretningsmodellen til alle som selger lagring.

**17. Arvingsvarsel ved endring.**
*Konsept:* Endrer eieren mottakermatrisen vesentlig, får de berørte beskjed om **at** noe er endret — aldri hva.
*Nytt:* Ingen varsler mottakere før dødsfallet. Sjokket og mistanken kommer alltid etterpå.
*Hjelper:* Familier der noen ellers ville trodd på et testament fra 2009.
*Passer oss:* Varsling uten innhold er nøyaktig hva varslingsmodellen vår allerede er bygget for.
*Valider:* Spør 20 brukere om de ville turt. Motstanden er svaret.
*Kopieringsvern:* Krever at man tør å gjøre eieren ukomfortabel. De fleste tør ikke.

**18. Testamentets ledsagerbrev.**
*Konsept:* Testamentet er juridisk. Ledsagerbrevet forklarer **hvorfor** — så de som fikk mindre, hører begrunnelsen fra avdøde selv.
*Nytt:* Dette er trolig den mest verdifulle teksten et menneske kan etterlate seg, og ingen ber om den.
*Hjelper:* Alle som får mindre enn de trodde. Og den som skrev testamentet og ikke orket samtalen.
*Passer oss:* Kategorien `siste hilsen` finnes. Dette er en skriveramme, ikke ny modell.
*Valider:* Spør fem arverettsadvokater om et slikt brev ville dempet en konflikt de har sett.
*Kopieringsvern:* Skrivehjelpen er redaksjonell. Selve funksjonen er triviell.

**19. Boligens historie.**
*Konsept:* Hva er gjort på huset, av hvem, når, med hvilke garantier og fagbrev.
*Nytt:* Ved salg er dette penger (jf. avhendingslova); ved dødsfall er det uvurderlig. Ingen kobler de to.
*Hjelper:* Arvingen som skal selge, og eieren som skal dokumentere.
*Passer oss:* Kategorien eiendeler finnes. Verdien er at det samles over tiår, som er nøyaktig vår tidshorisont.
*Valider:* Spør tre eiendomsmeglere hva de savner i et dødsbosalg.
*Kopieringsvern:* Data som er verdt noe først etter ti år er per definisjon vanskelig å kopiere.

**20. Avtalt kodeord mot telefonsvindel.** · **[STIKKORD FRA OPPDRAGET]** (svindelbeskyttelse for eldre)
*Konsept:* Familien avtaler et ord som aldri sendes digitalt. Ved mistenkelig samtale spør man om ordet.
*Vrien som er vår:* Oppdraget ba om svindel*overvåking*. Dette er det motsatte: null data, null overvåking, ingen falske løfter.
*Hjelper:* Eldre som får «hei mamma, jeg har mistet telefonen»-meldingen.
*Passer oss:* Det er ærlig. Vi har ikke transaksjonsdata og skal ikke late som.
*Valider:* Én side i appen, mål hvor mange som faktisk avtaler et ord.
*Kopieringsvern:* Ingen — og det er greit. Dette er en tjeneste vi burde gi bort.

**21. Gjenlevendes økonomi-simulering.**
*Konsept:* «Hvis jeg dør i morgen, hva sitter Kari igjen med per måned?» Bare regnestykket, basert på det brukeren selv har lagt inn.
*Nytt:* Forsikringsselskaper regner dette for å selge. Ingen regner det bare for å vise det.
*Hjelper:* Den som tror hen er godt nok dekket.
*Passer oss:* Tallene ligger allerede i arkivet.
*Valider:* Regn det manuelt for 10 brukere og se om noen endrer noe etterpå.
*Kopieringsvern:* Svakt — og risikoen er høy, se selvkritikken nederst.

**22. Bankboksregisteret.**
*Konsept:* Hvilke bokser finnes, i hvilken bank, hvem har nøkkelen, hva ligger der.
*Nytt:* Bankbokser er en klassisk kilde til at verdier aldri finnes — og de står i ingen register etterlatte kan søke i.
*Hjelper:* Etterlatte som aldri får vite at boksen fantes.
*Passer oss:* Ett strukturert element, frigitt gjennom mekanikken vi har.
*Valider:* Spør to banker hvor mange bokser som står uåpnet etter dødsfall.
*Kopieringsvern:* Lavt teknisk. Verdien er at opplysningen faktisk når fram.

**23. Den utenlandske eiendelen.**
*Konsept:* Leilighet i Spania, konto i Sverige, pensjon fra Storbritannia. Ett felt, én advarsel: dette krever advokat i det landet.
*Nytt:* Verdien ligger i å **oppdage** problemet, ikke løse det. Alle andre later som de kan løse det.
*Hjelper:* Etterlatte som ellers oppdager det to år for sent.
*Passer oss:* Vi kan si «dette kan vi ikke» uten å miste kunden — fordi vi ikke selger juridiske tjenester.
*Valider:* Legg inn spørsmålet i onboarding, mål hvor mange som svarer ja.
*Kopieringsvern:* Ingen. Men det er en ærlighetsmarkør konkurrenter med provisjonsmodell ikke kan sette.

**24. Nedtellingen som ikke skremmer.** · **[STIKKORD FRA OPPDRAGET]** (personlig beredskapsscore)
*Konsept:* I stedet for «du kommer til å dø»: «arkivet ditt er 71 % klart — de tre viktigste tingene som mangler er …».
*Vrien som er vår:* Scoren er regelbasert og **forklarlig**, ikke AI-generert, og den peker alltid på én neste handling.
*Hjelper:* Alle som gruer seg til å begynne.
*Passer oss:* Rammingen avgjør om målgruppen orker. Det er en produktbeslutning, ikke en algoritme.
*Valider:* A/B-test to formuleringer i en e-post. Måltall: fullførte handlinger, ikke klikk.
*Kopieringsvern:* Ingen. Men rammingen er merkevare.

**25. Vitnetjeneste.**
*Konsept:* Testament og fremtidsfullmakt krever to habile vitner. Mange har ikke to nøytrale personer tilgjengelig. Formidling av vitner.
*Nytt:* Et lite, konkret, udekket behov som all dokumentautomatisering later som ikke finnes.
*Hjelper:* Enslige, folk uten nettverk i nærheten, og alle som ikke vil vise testamentet til naboen.
*Passer oss:* Dårlig, ærlig talt — det er bemanning, ikke programvare. Se selvkritikken.
*Valider:* Spør Statsforvalteren hvor ofte formkravet er årsaken til at en fullmakt underkjennes.
*Kopieringsvern:* Krever juridisk avklaring og et menneskeapparat. Det er både vernet og problemet.

**26. Sorgpakken til arbeidsgiver.**
*Konsept:* Hva en arbeidsgiver bør gjøre når en ansatt dør, og hva familien har krav på fra arbeidsgiveren.
*Nytt:* Oppdraget spør hvordan etterlatte kontakter arbeidsgiver. Dette snur det: arbeidsgiveren er kunden.
*Hjelper:* HR-ansvarlige som aldri har gjort dette før, og familien som ellers må spørre selv.
*Passer oss:* Åpner arbeidsgiverkanalen (se `PARTNERE-OG-INNTEKTER.md` pkt. 6) med noe annet enn et personalgode.
*Valider:* Send utkastet til tre HR-ledere. Ville de betalt for det?
*Kopieringsvern:* Lavt — men det er en billig døråpner til en kanal som ellers krever lang salgsprosess.

**27. Barnas versjon.** · **[STIKKORD FRA OPPDRAGET]** (omsorg for barn)
*Konsept:* Hva skjer med barn under 18 hvis begge foreldre dør: hvem er verge, hva er avtalt med besteforeldre, hva ønsket foreldrene om oppvekst.
*Vrien som er vår:* Ikke et omsorgsfelt, men et **eget frigivelsesløp** der barnets verge er mottaker og ingen andre.
*Hjelper:* Barn. Og småbarnsforeldre som ikke tør tenke tanken ferdig.
*Passer oss:* Trolig den enkeltfunksjonen som mest sannsynlig faktisk selger et abonnement.
*Valider:* Spør 15 småbarnsforeldre om de har skrevet ned hvem som skal ta barna.
*Kopieringsvern:* Emosjonelt tungt innhold som må skrives riktig. Feil tone dreper produktet.

**28. Levende testamentfullbyrder.**
*Konsept:* En avtalt person som **årlig bekrefter at hen fortsatt er villig**.
*Nytt:* Testamentfullbyrdere dør, flytter og blir uvenner — og ingen sjekker før det er for sent.
*Hjelper:* Eieren, som ellers har en plan basert på en person som sa ja i 2019.
*Passer oss:* Samme mekanikk som årlig gjennomgang (E2), rettet mot en tredjepart.
*Valider:* Spør ti som har oppnevnt en fullbyrder om de har snakket med vedkommende siste to år.
*Kopieringsvern:* Krever at man tør å stille et spørsmål som kan gi «nei» til svar.

**29. Innboksens siste vilje.** · **[STIKKORD FRA OPPDRAGET]** (e-postkontoer, instruksjoner om sletting/overføring/minnekonto)
*Konsept:* Instruks for e-postkontoen spesifikt: hva arkiveres, hva slettes, hvem skal varsles om at kontoen er død.
*Vrien som er vår:* E-post er ikke én konto blant mange — den er **nøkkelen til alle de andre**, og bør behandles først, ikke i en liste.
*Hjelper:* Etterlatte som ellers mister tilgang til alt annet fordi gjenopprettingsmeldingene går til en død innboks.
*Passer oss:* Kategorien digitale kontoer finnes; dette er prioritering og veiledning.
*Valider:* Spør fem etterlatte hva som stoppet dem først.
*Kopieringsvern:* Ingen. Men rekkefølgen er innsikten.

**30. Frigivelsesgeneralprøven.**
*Konsept:* Kjør hele frigivelsen i testmodus én gang i året, med de betrodde kontaktene, uten at noe faktisk frigis.
*Nytt:* **Ingen konkurrent gjør dette.** Beredskap som ikke er øvd, er ikke beredskap.
*Hjelper:* Eieren, som får vite at kontakten hens byttet e-postadresse i fjor.
*Passer oss:* Tilstandsmaskinen er allerede ren og testbar — en øvingsmodus er en variant, ikke en ny motor.
*Valider:* Kjør den manuelt med fem brukere. Hvor mange oppdaget en feil?
*Kopieringsvern:* Krever en frigivelsesflyt som tåler å bli sett på. De fleste har ikke det.

**31. Bortfallsvarsel til partnere.**
*Konsept:* Slutter kunden å betale eller sletter kontoen, får forsikringsselskapet beskjed om at **dekningen av tjenesten** er borte — aldri om innholdet.
*Nytt:* B2B2C-avtaler mangler nesten alltid et negativt signal. Partneren vet bare hvem som *er* med.
*Hjelper:* Partneren, som ellers tror dekningen er intakt.
*Passer oss:* Webhook-modellen bærer allerede hendelser uten personopplysninger (ADR-007).
*Valider:* Spør en potensiell partner om de ville hatt det. Svaret er trolig ja med en gang.
*Kopieringsvern:* Krever en webhook-modell som beviselig ikke lekker innhold.

**32. Etterlattes tilbakemelding.**
*Konsept:* Etter en faktisk frigivelse: spør de etterlatte hva som manglet.
*Nytt:* Det er den eneste kilden til hva et arkiv *burde* inneholdt — og den finnes ikke hos noen konkurrent, fordi ingen andre er til stede i det øyeblikket.
*Hjelper:* Alle framtidige brukere.
*Passer oss:* Vi er den eneste som vet når frigivelsen skjedde.
*Valider:* Gjør det manuelt etter de fem første frigivelsene.
*Kopieringsvern:* **Høyest av alt på listen.** Dette er et datagrunnlag som bare akkumuleres hos den som allerede har frigivelser.

---

## Ni til, funnet i den avsluttende kvalitetssikringen

**33. Høyrisikoperioden.**
*Konsept:* En tidsavgrenset skjerpet beredskap eieren slår på selv — ekspedisjon, krigssone, stor operasjon: kortere karenstid, én navngitt kontakt, automatisk avslag når datoen passeres og eieren melder seg.
*Nytt:* Alle andre har én statisk beredskap. Livet er ikke statisk.
*Hjelper:* Den som reiser eller opereres, og familien som ellers venter 48 timer for mye.
*Passer oss:* `KARENSTID_SEKUNDER` er allerede en parameter, ikke en konstant i logikken.
*Valider:* Spør ti som har vært i en slik situasjon om de tenkte på arkivet i det hele tatt.
*Kopieringsvern:* Lavt teknisk — men det krever at karenstiden er en gjennomtenkt mekanisme og ikke en timer.

**34. Trinnvis frigivelse over sorgens faser.**
*Konsept:* Ikke alt på én gang. Det praktiske straks, brevene etter tre måneder, det tyngste etter et år.
*Nytt:* Alle konkurrenter behandler frigivelse som én utlevering. Sorg har faser; en datadump har ikke.
*Hjelper:* Etterlatte som ikke orker den personlige delen i uke én.
*Passer oss:* Mottakermatrisen kan bære en forsinkelse per element uten ny arkitektur.
*Valider:* Spør en sorgterapeut og fem etterlatte om rekkefølgen stemmer.
*Kopieringsvern:* Krever redaksjonell forståelse av sorg, ikke kode. Og det krever at man tør å holde noe tilbake.

**35. Se arkivet med mottakerens øyne.**
*Konsept:* Eieren kan forhåndsvise arkivet nøyaktig slik hver enkelt mottaker vil se det.
*Nytt:* Mottakermatriser finnes hos flere. Ingen lar deg *se resultatet* før det er for sent å rette.
*Hjelper:* Eieren, som oppdager at datteren ikke får noe som helst fordi en avkrysning mangler.
*Passer oss:* RLS-modellen kan gjøre dette eksakt riktig — vi kan spørre basen «hva ser denne personen?» og få sannheten, ikke en simulering.
*Valider:* Vis det til ti brukere som har fylt ut en matrise. Hvor mange retter noe?
*Kopieringsvern:* Krever at tilgangsstyringen er datamodellert og ikke en samling if-setninger.

**36. Den vanskelige samtalen, én gang.**
*Konsept:* En utskriftsvennlig samtaleguide som eieren går gjennom **sammen med** den betrodde kontakten, én gang, mens begge lever.
*Nytt:* Den vanligste feilen er ikke et tomt arkiv — det er en betrodd kontakt som ikke vet at hen er det, eller hva som forventes.
*Hjelper:* Begge to. Særlig kontakten.
*Passer oss:* Vi vet nøyaktig hvem kontakten er og hva hen vil bli bedt om. Ingen andre har den listen.
*Valider:* Lag guiden som PDF. Mål nedlastinger og spør fem par om samtalen ble tatt.
*Kopieringsvern:* Rent redaksjonelt — men det er den billigste funksjonen på hele listen målt mot effekt.

**37. Den betrodde kontaktens egen beredskapsside.**
*Konsept:* Kontakten får sin egen side: hva forventes av meg, hva gjør jeg først, hvem ringer jeg, hva kan jeg *ikke* gjøre. Utskrivbar.
*Nytt:* I dag får den betrodde en invitasjon og deretter stillhet i tjue år.
*Hjelper:* Kontakten, som ellers møter systemet vårt første gang i verste stund.
*Passer oss:* Rollen finnes i modellen (`er_betrodd`); den mangler bare en flate.
*Valider:* Spør ti registrerte kontakter hva de tror de skal gjøre. Avstanden mellom svar og virkelighet er verdien.
*Kopieringsvern:* Lavt — men det er den mest oversette brukeren i hele kategorien.

**38. Byrdefordelingen.**
*Konsept:* Eieren fordeler ikke bare *informasjon*, men **oppgaver**: hvem tar begravelsen, hvem tar banken, hvem tar huset — og hver enkelt blir spurt, mens eieren lever, om de aksepterer. Uaksepterte oppgaver er synlige for eieren.
*Nytt:* Mottakermatriser fordeler tilgang. Ingen fordeler arbeid, og det er arbeidet som velter familier.
*Hjelper:* Alle etterlatte — og særlig den ene som ellers gjør alt.
*Passer oss:* Samme struktur som matrisen, med en aksept-tilstand. Ikke ny arkitektur.
*Valider:* Spør fem familier som nylig har vært gjennom et dødsbo hvem som gjorde jobben.
*Kopieringsvern:* Aksept-løkken krever at kontaktene faktisk er i systemet. Det tar tid å bygge.

**39. Papirversjonen på kjøleskapet.**
*Konsept:* Én utskriftsside: hvem ringer du, at arkivet finnes, hvordan en frigivelse starter. Ingen innhold, ingen passord.
*Nytt:* Paradokset i et digitalt beredskapsarkiv er at nødsituasjonen ofte begynner med et menneske i en gang, med en telefon de ikke får låst opp.
*Hjelper:* Den som finner en bevisstløs person. Ambulansepersonell. Naboen.
*Passer oss:* Det er å innrømme grensen for egen kanal. Det er også det tryggeste vi kan trykke.
*Valider:* Del ut 20 ark. Ring etter tre måneder: henger det der?
*Kopieringsvern:* Ingen. Bygg det fordi det virker.

**40. Registrering av det som IKKE finnes.**
*Konsept:* Eksplisitte negative utsagn: «jeg har ikke testament», «jeg har ingen bankboks», «jeg skylder ingen penger», «jeg har ingen konto i utlandet».
*Nytt:* Alle arkiver registrerer det som finnes. **Ingen lar noen slutte å lete.** Etterlatte bruker uker på å søke etter ting som aldri fantes.
*Hjelper:* Etterlatte — og bostyrere, som må dokumentere at de har lett.
*Passer oss:* Det er den samme frigivelsesmekanikken, med motsatt fortegn. Nesten null kode.
*Valider:* Spør tre bostyrere hvor mye tid som går til å utelukke ting.
*Kopieringsvern:* Lavt teknisk. Men det er en tanke ingen i kategorien har hatt, og den er lett å ta eierskap til.

**41. Tidsstempelet som bevis.**
*Konsept:* Revisjonsloggen kan bevise **når** eieren skrev noe. Ved arvetvist er spørsmålet ofte om et ønske var gammelt og gjennomtenkt eller nytt og påvirket.
*Nytt:* Ingen i kategorien har tenkt på loggen som bevismateriale for brukerens regning — den er alltid til for vår egen.
*Hjelper:* Den avdøde, som ikke kan forsvare sitt eget ønske. Og familien som slipper mistanken.
*Passer oss:* Loggen er allerede append-only uten UPDATE/DELETE-grant. Vi må ikke bygge tilliten — vi må bare dokumentere den.
*Valider:* Spør tre arverettsadvokater om et slikt tidsstempel ville hatt vekt.
*Kopieringsvern:* **Høyt.** Det krever en logg som beviselig ikke kan endres, også av oss. Det er en arkitekturbeslutning tatt for to år siden, ikke en funksjon som kan legges til.
*Forbehold:* **[HYPOTESE]** Bevisverdien i norsk rett er ikke undersøkt. Må avklares med jurist før det formuleres som noe annet enn en logg.

---

## Kritikk av mine egne ideer

**[ANBEFALING]** Det ville vært uærlig å levere 41 ideer uten å si hvilke jeg mistror.

**Svakest:** nr. 6 (dobbel nøkkel for familiehemmeligheter) er teknisk elegant og menneskelig naiv — å bygge en mekanisme for å avsløre familiehemmeligheter etter din død er et etisk minefelt vi ikke har kompetanse til å navigere. Nr. 21 (økonomi-simulering) glir mot finansiell rådgivning raskere enn det ser ut. Nr. 25 (vitnetjeneste) høres enkelt ut og er trolig konsesjons- eller ansvarsbelagt.

**Mest overvurdert av meg selv:** nr. 1 (dødsattest-som-tjeneste). Den er strategisk vakker, men forutsetter at motparten vil ta imot et varsel fra en ukjent liten aktør. Det er en salgsjobb på størrelse med hele forsikringssporet.

**Svakest av de ni nye:** nr. 34 (trinnvis frigivelse). Den er vakker i teorien og kan i praksis bety at en etterlatt ikke får et brev hen trenger, fordi vi bestemte at det var for tidlig. Sorg lar seg ikke skjemalegge. Bygg den bare hvis mottakeren selv kan be om alt med én gang.

**Den jeg ville bygget først hvis jeg bare fikk én:** nr. 3 (én ting om gangen). Den koster minst, den treffer mennesket i verst tenkelige tilstand, og den er den eneste på listen som gjør produktet *snillere* i stedet for bare mer omfattende.

**Den jeg angrer mest på at ikke sto i første utkast:** nr. 40 (registrering av det som ikke finnes). Den er nesten gratis, den er ny, og den løser et problem jeg først så da jeg gikk gjennom listen på nytt.
