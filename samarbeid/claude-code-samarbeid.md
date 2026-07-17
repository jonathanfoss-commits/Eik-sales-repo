# Utvikle Lærling sammen i Claude Code — Jonathan + Ole Fabian

Prinsippet: **Ole Fabian er domeneeksperten, Jonathan er produktsjefen, Claude Code er
utviklingsteamet.** Ingen av dere trenger å skrive kode — men arbeidet må organiseres som
et utviklingsteam ville gjort det.

## Oppsettet (30 minutter, én gang)

1. **Privat GitHub-repo** `laerling-ai` (github.com/new). Innholdet fra dette repoet flyttes
   dit; Ole Fabian inviteres som collaborator (Settings → Collaborators).
2. **Claude Code på web** (claude.ai/code): koble repoet. Dette er Jonathans verksted —
   funker fra hvilken som helst maskin, ingen lokal installasjon nødvendig.
3. **CLAUDE.md i repo-roten** — teamets hukommelse. Claude Code leser den automatisk i hver
   økt, så du slipper å forklare prosjektet på nytt hver gang. (Mal nederst.)
4. **GitHub Issues = backlog.** Hver idé, feil og ønske blir en issue. Ole Fabian oppretter
   dem rett fra mobilen (GitHub-appen) — eller sender deg melding, så oppretter du.
5. **Netlify kobles til repoet** (i stedet for Drop): hver endring på `main` publiseres
   automatisk, og hver pull request får en egen forhåndsvisnings-URL som Ole Fabian kan
   teste på telefonen **før** det går live.

## Arbeidsflyten (ukentlig rytme)

```
Ole Fabian (på byggeplassen)          Jonathan (i Claude Code)
────────────────────────────          ─────────────────────────
Bruker appen daglig                   Leser pilotloggen + issues
Melder inn: «purringen bommer         Én Claude Code-økt per issue:
på tonen når det haster» (issue)  →   forklarer problemet, Claude
                                      implementerer, tester, lager PR
Tester forhåndsvisnings-URL      ←    Sender preview-lenken
«Nå sitter den 👍»               →    Merge → auto-publisert
```

- **Små endringer, ofte** — én issue per økt, aldri «fiks alt».
- **Fredag:** 15-min gjennomgang sammen: hva loggene viser, hva som bygges neste uke.
- Alt Claude Code gjør committes med beskrivende meldinger — historikken er dokumentasjonen.

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
