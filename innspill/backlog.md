# Backlog — forbedringer kveldsteamet kan ta når inbox er tom

Prioritert liste. Teamet tar ØVERSTE punkt, aldri flere enn ett per kveld fra backloggen.
Punkter merket 🔬 kommer fra bransjeresearchen 17. juli (`innspill/research-rapport.md`) —
les begrunnelsen der før bygging.

1. 🔬 Lokal purring-generator med norsk purretrapp: skjema (til hvem, faktura, forfall,
   beløp) → ferdig purremelding i riktig trinn (vennlig påminnelse → varsel om
   forsinkelsesrente → inkassovarsel iht. inkassoloven), uten AI — Kopier + Åpne i Mail.
   Fakturaliste med forfall lagres lokalt så appen kan minne om når neste purring bør gå.
2. 🔬 Varselvakta (NS 8407): dikter/skriv avviket → datostemplet, formriktig endringsvarsel
   klar samme dag + lokal varsellogg (sendt/svart/purrefrist). Bygger på eksisterende
   endringsmelding-prompt. «Et krav som ikke er varslet, finnes ikke.»
3. 🔬 Tilleggsarbeid-fangeren: 20-sekunders registrering rett etter «vi tar det på
   regning» → lokal tilleggslogg per prosjekt → fakturagrunnlag med Kopier-knapp.
   Samme mønster som timeføringen.
4. 🔬 Bildeknagg: ta/velg bilde + dikter én setning → lagres lokalt (IndexedDB) med dato
   og prosjekt; gjenbrukes i dagbok, varsler og rapporter. Bevis ved reklamasjon og
   skjulte konstruksjoner.
5. 🔬 Byggedagbok-autopilot: dagsutkast settes sammen LOKALT av dagens timeføring,
   varemottak, tillegg og bilder — brukeren godkjenner med én tommel; låst historikk og
   ukeeksport (tidsnære bevis — HAB-dommen). Erstatter tidligere «byggedagbok-generator»-
   og «byggedagbok-historikk»-punktene.
6. 🔬 Sluttoppgjør-fristvakta: overtakelsesdato per prosjekt → lokale nedtellinger mot
   preklusive frister (sluttoppstilling 2 mnd., søksmål 8 mnd.) med ferdige utkast-tekster.
7. Varemottak-historikk: lagre avviksmeldinger lokalt (IndexedDB) med status
   (meldt/rettet/kreditert) og påminnelse hvis leverandør ikke har svart innen fristen.
8. 🔬 Byggemøte-referat: ny prompt + mal — dikter hovedpunktene rett etter møtet →
   referat med ansvar og frister.
9. 🔬 Talesjekklister (KS): 3–4 lokale maler (tett bygg, våtrom, overlevering) med
   tommel-avkryssing og PDF-eksport. Aldri lov å love «forskriftsoppfyllelse».
10. 🔬 Tilbud fra egen prisbank: lokal enhetspris-hukommelse fra bedriftens tidligere
    tilbud, mates inn i tilbudsprompten («du tok 1 200 kr/m² sist»).
11. 🔬 Overtakelsesprotokollen: rom-for-rom-sjekkliste med diktert mangelliste, foto,
    deltakere og signatur — låst etter signering (buofl./NS 8407 pkt. 37).
12. «Dagens fokus» på I dag-fanen: ett smart tips per dag basert på ukedag
    (fredag: «husk ukesrapporten», mandag: «planlegg befaringer»).
13. Prompt-teller: vis i promptbiblioteket hvilke prompter som er mest brukt (lokalt).
14. Mørk/lys-modus-bryter (behold mørk som standard).
15. Forbedre tom-tilstanden med ukens tall («I dag: 4 oppgaver unnagjort»).

## Fra research runde 2 (17. juli kveld) — prioriteres inn av panelet

- **Lærlingtimeteller:** offentlige kontrakter krever fra 1.8.2025 at minst 10 % av
  byggfagtimene utføres av lærlinger — enkel teller per kontrakt med eksport (MEF).
- **Seriøsitetsmappa:** samlemappe per anbud (HMS-kort, fagbrev, lærlingbevis) for
  Norgesmodellens krav — lokal, med sjekkliste.
- **Grossist-matching i varemottaket:** match leveransefoto mot ordrebekreftelse fra
  Optimera/Ahlsell og varsle prisavvik (nordisk-validert: Fieldly/Minuba).
- **Tale-oppmåling:** «12 kvadrat gips i gangen» → mengder rett inn i tilbudet
  (Plancraft-validert, 30 000+ brukere) — lokal parsing.
- **Kvitteringsskanning → etterkalkyle:** knips bongen, koble kostnad til prosjekt,
  «tjener vi penger på denne jobben?» — [SENERE, krever OCR].
- **Synlig lagret-status overalt:** forskning viser at 2–3 opplevde datatap dreper
  tilliten varig — alle lagringer skal vise eksplisitt kvittering.
- **Dagslys-modus LØFTES:** mørkt tema er dokumentert dårligere i sollys — lys modus
  med én-trykks bytte bør opp fra punkt 14 til topp 5 (bekreftet av felt-UX-research).

## Avvist etter research (bygges IKKE — se rapporten for begrunnelse)

- Foto-AI som finner feil automatisk (umoden + Personvernvakt-veto)
- Full mannskapsliste-/HMS-compliance-suite (byggherrens plikt, ansvar vi ikke skal bære)
- Regnskaps-/lønnsintegrasjoner (Tripletex/Cordel vinner der; kopierbar tekst er broen)
