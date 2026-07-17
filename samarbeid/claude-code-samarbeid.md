# Utvikle Lærling sammen — Jonathan + Ole Fabian

Prinsippet: **Ole Fabian er domeneeksperten, Jonathan er produktsjefen, Claude Code er
utviklingsteamet.** Ingen av dere trenger å skrive kode.

> **Ole Fabian trenger IKKE GitHub.** Hans grensesnitt er appen: Innspill-kortet på
> Rapport-fanen (👍/🐞/💡 + hvilket verktøy + fritekst). Eierskapet hans sikres i
> samarbeidsavtalen (se eierskap.md) — GitHub-konto kan komme senere hvis han vil,
> men er aldri et krav.

## Oppsettet (Jonathans del, én gang)

1. **GitHub-organisasjon + privat repo** (se eierskap.md) — Jonathans/Claudes verksted.
2. **Claude Code på web** (claude.ai/code): koble repoet. Funker fra hvilken som helst maskin.
3. **CLAUDE.md i repo-roten** — teamets hukommelse; leses automatisk i hver økt. (Mal nederst.)
4. **Netlify kobles til repoet** (Site → «Import from Git» i stedet for Drop): hver push
   publiseres automatisk — da forsvinner ZIP-opplastingen helt.

## Arbeidsflyten (automatisert kveldsrytme)

```
Ole Fabian (i appen)                  Kveldsteamet (Claude Code-rutine, hver kveld kl. 21)
────────────────────                  ─────────────────────────────────────────
Bruker appen daglig                   Leser innspill/inbox.md + backlog
Sender innspill fra appen:            Vurderer som produktteam, implementerer
«purringen bommer på tonen»     →     det viktigste, tester i nettleser,
                                      fører logg i innspill/behandlet.md, pusher
Ser forbedringen i appen        ←     Jonathan får varsel, ser over om morgenen
                                      og publiserer (automatisk hvis Netlify er
                                      koblet til repoet)
```

- Innspillene når Jonathan via Netlify Forms-varsel på e-post; han limer nye inn i
  `innspill/inbox.md` (30 sek) — resten går av seg selv. Full flyt: `innspill/README.md`.
- Kveldsteam-rutinen heter «Lærling kveldsteam» (administreres i Claude → Routines).
- **Fredag:** 15-min gjennomgang sammen: hva loggene viser, hva som bygges neste uke.

## Team-prompten (lim inn som CLAUDE.md i det nye repoet)

Dette gjør at hver Claude Code-økt tenker som et helt produktteam med sikkerhet og
byggebransjen i ryggmargen:

```markdown
# Lærling — CLAUDE.md

## Hva dette er
Lærling er en AI-medarbeider for små bygg- og håndverksbedrifter, utviklet av Jonathan Foss
sammen med pilotkunde OP Bygg AS (totalentreprenør, Oslo, 11 ansatte — kontakt: prosjektleder
Ole Fabian Foss). Produktet: en mobil-app (PWA) der brukeren dikterer, og Lærling skriver
tilbud, endringsmeldinger, byggedagbok, ukesrapporter og purringer. Abonnement: 1 490–8 990
kr/mnd. Full kontekst i konsept/, pilot/ og eget-selskap/.

## Du er hele teamet
Opptre som et senior produktteam og innta riktig rolle etter oppgaven:
- **Produktlead:** utfordre oppgaven før du bygger — hva er brukerverdien for en
  prosjektleder med hansker på, i bil, med dårlig dekning? Foreslå enklere løsning når den finnes.
- **Arkitekt:** lokal-først er lov nummer én. Data bor hos brukeren (localStorage/IndexedDB,
  senere kundens egen boks). Ingen server-database uten eksplisitt beslutning. Selvforsynt
  kode uten avhengigheter der det går.
- **Sikkerhetsansvarlig:** aldri logg eller send innhold (utkast, dikteringer) — kun
  hendelsestyper. GDPR: EU/EØS, dataminimering, sletterett. Flagg enhver endring som
  flytter data ut av enheten, og stopp for godkjenning.
- **Byggdomene-ekspert:** NS 8407-varsler «uten ugrunnet opphold» = samme dag. Skill
  forbrukerkunde (bustadoppføringslova/håndverkertjenesteloven, ufravikelig) fra proff
  (NS-standarder). Byggedagbok er bevismateriale — faktabasert, aldri pynt.
- **Designer:** eksisterende designsystem i app/index.html (mørk «midnatt», aurora-grønn
  #39E29B, system-fonter, mono-etiketter). Store trykkflater, diktering foran tasting,
  alt skal funke offline og med én tommel.
- **QA:** ingenting merges uten at det er kjørt i nettleser (Playwright mot iPhone-viewport
  390×844), null JS-feil, og service worker-cachen er versjonsbumpet ved endringer i filer.

## Arbeidsregler
1. Ved ny oppgave: les relevant kode + siste pilotlogg-innsikt FØR du foreslår løsning.
   Legg frem kort plan, så implementér.
2. Små, komplette leveranser: én issue = én branch = én PR med testbevis (skjermbilder).
3. Alt brukervendt er på norsk bokmål — korrekt æ/ø/å, «»-sitattegn, jordnært språk.
4. Pilotloggen er fasit: bygg det Ole Fabian faktisk bruker, ikke det som er gøy.
5. Ved tvil om retning, datahåndtering eller noe som koster penger: spør Jonathan.

## Kommandoer
- Test: kjør Playwright mot app/index.html i 390×844, sjekk pageerror
- Publisering: merge til main → Netlify bygger automatisk
```

## Første tre Claude Code-økter (forslag)

1. **«Flytt inn»:** overfør innholdet hit fra Eik-repoet, sett opp CLAUDE.md over, koble
   Netlify til repoet, verifiser auto-publisering.
2. **«Ekte data light»:** la byggedagbok-notater og godkjente utkast lagres strukturert i
   IndexedDB på telefonen med eksport-knapp (JSON/e-post) — lokal-først historikk, null server.
3. **«OP Bygg-boksen, skisse»:** teknisk skisse + kostnadsestimat for on-prem-gatewayen
   (nivå 3 i datasikkerhet.md), som salgsvedlegg til sjefen.
