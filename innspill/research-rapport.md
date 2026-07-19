# Bransjeresearch — konkrete funksjonsforslag for Lærling hos OP Bygg

*17. juli 2026 · Fem parallelle research-agenter (hverdag, regelverk, konkurrenter,
pengestrøm, internasjonale AI-trender) + panelvurdering. Bestilt av Jonathan.
Dette er beslutningsgrunnlag — ingenting bygges uten panelet og to-nøkkel-flyten.*

## Hovedfunn på tvers av feltene

1. **Skrivejobben er hjemløs.** Samtlige norske konkurrenter (SmartDok, Cordel, Tripletex,
   Kvalitetskontroll, Svenn, Holte) leverer skjema, tall og sjekklister — ingen skriver
   ferdig norsk tekst. Tilbud, endringsmeldinger, purringer og referater er Lærlings
   ubestridte hjemmebane. Forsvar den, utvid fra den.
2. **Pengene tapes i øyeblikk som ikke fanges.** NS 8407-krav som varsles for sent er
   *prekludert* — tapt for alltid (rettspraksis: 12 dager = avvist, samme dag = godkjent).
   Tillegg avtalt muntlig faktureres aldri. Høyesterett (HAB, 2019) premierer *tidsnære
   bevis*. Alt peker samme vei: fang det på stedet, med diktering.
3. **Lokal-først er et salgsargument.** 54–62 % av entreprenører internasjonalt oppgir
   datavern som største AI-barriere. «Alt lagres hos deg» er ikke en begrensning — det er
   pitchen.
4. **Småbedrifter forlater de store systemene** pga. moduler, kurs og kontor-PC-krav
   (Cordel for 11 mann: ~14 000–27 000 kr/mnd; Holte-kurs 4 000+ kr). Lærlings pris
   (1 490–8 990 kr/bedrift/mnd) posisjoneres som «kvelden tilbake, null moduler».

## Topp 10 funksjonsforslag (verdi × innsats)

1. **Varselvakta (NS 8407)** — *Problem:* uvarslede/for sent varslede endringer er
   bransjens vanligste pengetap; «et krav som ikke er varslet, finnes ikke» (ns8407.com,
   CMS, Codex). *Løsning:* dikter avviket på stedet → datostemplet, formriktig varsel klar
   til sending samme dag + lokal varsellogg (sendt/svart/purrefrist). *Hvorfor vi vinner:*
   ingen konkurrent skriver varselet; vi har alt endringsmelding-prompten. *Innsats:* middels
   (bygger på eksisterende).
2. **Tilleggsarbeid-fangeren** — *Problem:* «vi tar det på regning» avtales muntlig og
   faktureres aldri; omtalt som konkursdriver for småbedrifter (Svenn, SmartDok, Duett).
   *Løsning:* 20-sekunders diktering rett etter avtalen → lokal tilleggslogg per prosjekt →
   ferdig fakturagrunnlag med Kopier. *Innsats:* liten–middels (samme mønster som timer).
3. **Purre-autopilot med norsk trapp** — *Problem:* SMB-er purrer for sent og taper
   likviditet (Coface/Kredinor; bygg har ~82 dagers kredittid globalt). *Løsning:* lokal
   fakturaliste med forfall → varsel når purring bør gå → generert melding i riktig trinn
   (vennlig → forsinkelsesrente → inkassovarsel iht. inkassoloven), tone tilpasset
   kundehistorikken (lagret lokalt). *Innsats:* liten — backlog-punktet i kveld er
   fundamentet. Internasjonal validering: Chaser-typen verktøy gir ~3 dager raskere betaling.
4. **Bildeknagg** — *Problem:* bilder drukner i kamerarull/SMS, men er avgjørende bevis
   ved reklamasjon og skjulte konstruksjoner (Advokattipset, Robertsen). CompanyCam
   (285 000 brukere) beviser behovet. *Løsning:* ta bilde + dikter én setning → lagres
   lokalt (IndexedDB) med dato/prosjekt; limes inn i dagbok, varsler og rapporter.
   *Innsats:* middels.
5. **Byggedagbok-autopilot** — *Problem:* dagboken føres ikke, og i sluttoppgjørstvister
   (~4 mrd. kr/år) avgjør tidsnære bevis (HAB-dommen). *Løsning:* dagsutkast settes
   sammen LOKALT av dagens timeføring, varemottak, tillegg og bilder — brukeren godkjenner
   med én tommel; låst historikk + ukeeksport. Procores «Daily Log Agent» viser retningen —
   vår er helt lokal. *Innsats:* middels (byggeklossene finnes alt i appen).
6. **Sluttoppgjør-fristvakta** — *Problem:* preklusive frister (sluttoppstilling 2 mnd.
   etter overtakelse, søksmål 8 mnd.) — oversittes de, er kravet tapt uansett kvalitet.
   *Løsning:* registrér overtakelsesdato per prosjekt → lokale nedtellinger + ferdig
   utkast-tekst i god tid. *Innsats:* liten. Høy kroneverdi per hendelse.
7. **Tilbud fra egen prisbank** — *Problem:* kalkyle krever kontor-PC (Cordel/SmartKalk);
   internasjonalt sparer Handoff-brukere 8+ t/uke med AI-estimat. *Løsning:* lokal
   prisbank bygget av bedriftens EGNE tidligere tilbud («du tok 1 200 kr/m² sist») som
   mates inn i tilbudsprompten. Helt lokalt; norsk vri med NS 3420-poststruktur senere.
   *Innsats:* middels–stor. Følg med på nykommeren Proanbud her.
8. **Talesjekklister (KS)** — *Problem:* KS-sjekklister fylles på papir «på baksiden av
   pappesker» (Digimeter 2025); ansvarlig utførende må kunne dokumentere KS (SAK10).
   *Løsning:* 3–4 faste lokale maler (tett bygg, våtrom, overlevering) med tommel-/tale-
   avkryssing og PDF-eksport. *Innsats:* middels. NB: aldri lov å love «forskriftsoppfyllelse».
9. **Overtakelsesprotokollen** — *Problem:* protokollen er tungtveiende bevis i
   reklamasjonssaker (buofl. 5 år; NS 8407 pkt. 37 krever den), men lages ad hoc.
   *Løsning:* rom-for-rom-sjekkliste med diktert mangelliste, foto, deltakere og
   signatur/kvittering — låst etter signering. *Innsats:* middels–stor.
10. **Byggemøte-referatet** — *Problem:* referater droppes og beslutninger blir «ord mot
    ord» (Robertsen). *Løsning:* ny prompt + mal: dikter hovedpunktene rett etter møtet →
    referat med ansvar og frister. *Innsats:* liten (promptbiblioteket finnes).

## Tre forslag vi AVVISER (like viktig)

- **Foto-AI som finner feil automatisk** — umoden teknologi (~72 % treffsikkerhet i beta),
  krever at bildene sendes ut av enheten → Personvernvakt-veto. Bildeknagg gir 80 % av
  verdien helt lokalt.
- **Full mannskapsliste-/HMS-suite** — plikten er byggherrens (byggherreforskriften § 15),
  Infobric/SmartDok eier feltet, og å love forskriftsoppfyllelse er ansvar vi ikke skal
  bære. Lærling kan være «notatblokka» (hvem var her i dag) — aldri compliance-systemet.
- **Regnskaps-/lønnsintegrasjon** — Tripletex/Cordel vinner der; integrasjoner binder
  utviklingskraft og bryter «selvforsynt kode»-prinsippet. Kopierbar tekst inn i deres
  systemer er broen — «Kopier til Tripletex» kan bli integrasjonshistorie SENERE, ikke løfte nå.

## Kilder

Se agentrapportene — nøkkelkilder: ns8407.com · cms.law (praktisk entrepriserett) ·
lovdata.no (byggherreforskriften, SAK10, TEK17 § 4-1, aml. § 10-7) · arbeidstilsynet.no ·
robertsen.no · berngaard.no · bygg.no · nemitek.no (konfliktkostnad ~4 mrd.) · EBA-rapport
2019 · tu.no (1 583 konkurser 2025) · byggforsk.no (byggskader ~4 %) · Digimeter 2025
(SmartCraft/Kvalitetskontroll — tall bør verifiseres i selve rapporten før salgsbruk) ·
Trustpilot (Tripletex 2/5) · tjenesteoppslag.no (Cordel-pris) · svenn.com · proanbud.no ·
companycam.com · handoff.ai · procore.com (AI-agenter) · chaserhq.com · coface.no.

*Metodenotat: enkelte nettsteder var blokkert for direkte henting fra sandkassen (403);
funn bygger da på søkeresultatenes utdrag. Tall merket med kilde bør slås opp før de
brukes i salgsmateriell.*

---

# Runde 2 — 17. juli kveld (8 agenter: research NO+INT, sikkerhet, kode, a11y, plattform)

**Nye hovedfunn:** (1) Regelverk gir konkrete produktmuligheter: lærlingkrav 10 % i
offentlige kontrakter fra 1.8.2025, Norgesmodellens seriøsitetskrav, åpenhetslov-krav som
sildrer ned fra store kunder. (2) Nordisk-validerte funksjoner: grossist-matching i
varemottak (Fieldly/Minuba), tale-oppmåling (Plancraft, 30 000+ brukere), kvitterings-
etterkalkyle. (3) RØDT-listen bekreftet: GPS-sporing, geofence-stempling, AI-kameraer og
produktivitetsscoring er juridisk døde i Norge (GDPR/aml.) — lokal-først er salgsargumentet.
(4) Frafallsforskning: apper forlates pga. trykk-antall, kontor-DNA, stille datatap og at
ingen leser rapportene — Lærlings motgrep: synlig lagret-status og mottaker-loop.
(5) ⚠ Mørkt tema er dokumentert svakere i sollys — dagslys-modus løftes i backloggen.
(6) Pris: per-bedrift (aldri per bruker), OP Bygg-størrelse ≈ 2 990–3 990 kr/mnd,
laveste trinn må inneholde daglig-verktøyene (retensjon). (7) Neste bransje: maler
(letteste), så murer/flislegger, så rørlegger — elektriker frarådes som først.
Detaljer: agentrapportene i kjøreloggen + konsept/plattform-notat.md.

---

# Runde 3 — 18. juli (4 agenter: jus, bygg-eller-kjøp, PWA-teknikk, møtetyper) — Møtehjelperen

**Jus (styrer ambisjonen):** Skriftlige møtenotater/referater og diktering av EGNE ord er
trygt uten samtykke (avtale/berettiget interesse; kun informasjonsplikt via personvern-
erklæring). Lydopptak av møter man selv deltar i er lovlig etter strl. § 205, men krever i
næring samtykke-/informasjonssteg (GDPR), og overfor egne ansatte er samtykke IKKE gyldig
grunnlag — opptak er kontrolltiltak (aml. §§ 9-1/9-2, drøfting med ansatte kreves). RØDT:
skjult opptak, opptak etter at man forlater rommet (straffbart), alltid-på-opptak,
skylagring av rålyd, stemmegjenkjenning («hvem sa hva» = biometri, art. 9). Beste
bevissikring er uansett: send referatet til deltakerne — uimotsagt referat står sterkt.

**Bygg-eller-kjøp:** v1 trenger IKKE transkribering — diktert sammendrag via Skrivemotoren
gir ~80 % av verdien med null nye databehandlere. Ferdige møteassistenter (Otter, Fireflies,
tl;dv, Plaud, Teams Copilot) ryker samlet på usynlighetskravet (synlige boter/apper) og de
fleste på EU-prosessering. HVIS piloten viser behov for ekte opptak: Azure AI Speech batch
i EU-region (Norway East) bak vår egen serverfunksjon (~$0.18/t, selvbetjent EU + moden
DPA — OpenAIs EU-residency er salgsgated). Endgame/lokal-først: NB-Whisper
(Nasjonalbiblioteket, Apache 2.0) — dokumentert BEST på norsk (WER 6,6 vs. 10,4 for
OpenAI large, trent på 66 000 t norsk m/ dialekter) og kan aldri «dø» — vår ultimate
exit-plan. Kostnad uansett valg: ~100–200 kr/mnd per bedrift — kostnad er ikke driveren.

**PWA-teknikk (iOS):** Web Speech API er ustabil på iOS — Apples tastatur-diktering i
textarea forblir primærmønsteret (norsk, offline, virker i PWA). .ics-kalenderfiler med
VALARM virker ved import, men blob-nedlasting er upålitelig i hjemskjerm-PWA → del filen
via Web Share (til seg selv i Mail → «Legg til alle»), data:-URL som reserve. Planlagte
lokale varsler finnes ikke på weben — påminnelsen ER .ics-alarmen (Web Push krever server
og egen beslutning). mailto er trygt opp til ~2 000 enkodede tegn (æ/ø/å = 6 tegn!) —
kort e-post + Kopier-knapp. Møtehistorikk bør i IndexedDB + navigator.storage.persist().

**Møtetyper (verdi × hyppighet):** 1. BYGGEMØTET (ukentlig; referatet blir bindende om
ingen protesterer innen neste møte; HAB-dommen krever tidsnære bevis — «den som skriver
referatet, eier virkeligheten»). 2. BEFARINGER/TELEFONAVTALER («du sa fredag» — muntlige
avtaler er bindende men bevisbyrden ligger hos den som hevder; hvtjl. § 32: prisoverslag
maks +15 %, bevisbyrde hos entreprenøren → 30-sek diktat + «Som avtalt i dag»-e-post).
3. OVERTAKELSEN (sjelden men høyest verdi; formkrav — egen inngang via protokoll-verktøyet,
IKKE referat). Deretter: UE-avklaringer (back-to-back-re-varsling, 30-dagers frist),
sluttoppgjørsmøte, ettårsbefaring. IKKE rør: vernerunder/SHA (byggherrens plikt, dekket
marked, tilsynsansvar) og interne personalmøter (null tvisteverdi, høy GDPR-risiko).

**Bygget på funnene (v0.14.0):** Møtehjelperen som verktøy 12 i Prøverommet — notater
(aldri lydopptak), åpenhets-avkryssing, referat via Skrivemotoren (ny «referat»-oppgave)
med lokal mal som reserve, .ics via Web Share med VALARM-påminnelse, «som avtalt i dag»-
e-post, endringsvarsel-hint ved endringsord i notatene. Kilder: agentrapportene i
kjøreloggen (lovdata/Datatilsynet/arXiv 2402.01917/webkit.org/BAHR m.fl.).
