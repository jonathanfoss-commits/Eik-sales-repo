# Behandlet — kveldsteamets logg

<!-- Kveldsteamet fører inn: dato, hva som ble vurdert, hva som ble gjort, testresultat -->

- [2026-07-31] **Bestilling fra Jonathan (/goal):** «Bli kjent»-siden — AI-onboarding av
  nye kundefirma. Panel (behovsstyrt): UX JA, Personvernvakt ENDRE (3 absolutte krav,
  innfridd), Frontend JA (5 krav, innfridd). Bygget i v0.20.0: app/bli-kjent.html +
  netlify/functions/intervju.mjs + samarbeid/onboarding-superprompt.md. Testet ende-til-
  ende: motor mot ekte API med fiktivt firma, UI i Playwright begge viewporter, Forms-rør
  200 begge kanaler. Bifangst fikset: TEST-siten manglet skjemadeteksjon — alle TEST-
  innsendinger (inkl. godkjenn-stemmer) har gått tapt til nå; aktivert og verifisert.

- [2026-07-21] **Kveldskjøring (behovsstyrt panel, første):** innspill hentet direkte fra
  Netlify Forms (ingen nye — begge kjente er bygget). Kandidat = ⚠ HASTER fra
  prioriteringen: sentralkode-rotasjon uten kode i repo. To eksperter hørt (behovsstyrt):
  Personvernvakt JA (rotér straks etter utrulling, kun kode i header, 503 uten detaljer),
  Frontend ENDRE (lås opp kun på 200, «feil kode» kun på 401, resten serverfeil; sett
  PILOT_API_KODE på begge sitene FØR deploy; oppdater plattform-notatet). Bygget i
  v0.18.1: server-verifisert opplåsing i admin/lab, PBKDF2 slettet, hardkodet kode
  fjernet fra innspill.js, PILOT_API_KODE satt på begge sitene (dagens kode — rotasjon
  er Jonathans steg 4). QA grønn i begge viewporter.

- [2026-07-20] **Kveldskjøring:** kandidat = «Lover & regler på byggeplassen» (brukerinnspill
  fra pilotloggen 17. juli, uten navn — prioritert av lunsjtriagen). Seks eksperter hørt:
  Kontraktsjurist JA (krav: kunnskapsdato-forbehold med henvisning til Lovdata/DiBK, aldri
  konkludere i konkret sak, SHA-ansvar kan ikke delegeres, ansvarsfraskrivelse i hvert svar,
  nekt veiledning ved pågående farlig situasjon — «stans arbeidet, kontakt ansvarlig»;
  DPA med API-leverandør flagget som eget sjekkpunkt til Jonathan), Byggdomene JA (skill
  TEK17 fra arbeidsplassforskriften/forskrift om utførelse av arbeid; dekk pbl/SAK10,
  byggherreforskriften, AML, internkontrollforskriften, avfall; aldri gjette hjemmel),
  Personvernvakt JA (ren gjennomstrømming i eksisterende Skrivemotor-flyt, logg kun
  hendelsestype), UX JA (rad i prompt-biblioteket, ansvarsfraskrivelse også i
  KOPIER-fallbacken), Frontend JA (én OPPGAVER-nøkkel + én PROMPTER-rad, null ny JS),
  Tekst ENDRE (tittel «Lov- og regelsjekk», «»-sitattegn, «før du bestemmer deg»).
  Bygget i v0.18.0: ny oppgavetype «lovregel» i skriv.mjs med alle jurist- og
  byggdomene-vilkårene i instruksen, ny rad i prompt-biblioteket med ⚡ UTKAST og
  KOPIER-fallback der fraskrivelsen er bakt inn i selve prompten. Svar til innmelder i
  panelsvar.json.

- [2026-07-17] **Panelkjøring (live-demo for Jonathan, «kjør panelet nå»):** kandidat =
  timeregistrering (backlog #1, brukerinnspill fra Ole Fabian). Seks eksperter hørt:
  Byggdomene JA (krav: dato per føring, redigerbar føring, notatfelt til fakturering),
  Personvernvakt JA (logging kun hendelsestype — aldri timetall/prosjekt/dato; «lagres kun
  på telefonen»-setning i arket), UX JA (egen rad på forsiden, chips i stedet for tastatur,
  stoppeklokke og historikk-redigering utsatt), Tekst JA (alle tekster levert), Innsikt JA
  (daglig-bruk-anker; valider mot pilotloggen etter to uker), Forretning ENDRE (bygg som
  «prosjektleders kladdeblokk» — aldri lønn/satser/integrasjonsløfter). Bygget i v0.10.0:
  ⏱ Timer-rad på forsiden, ark med prosjekt-hurtigvalg, +0,5/+1/7,5-chips, notat,
  én føring per prosjekt per dag (ny lagring retter), ukesoppsummering med Kopier.
  Utsatt til senere (bevisst): overtidskryss, historikk-redigering, eksportformater.

- [2026-07-17] Innspill fra appen: «Timeregistrering — kan det være aktuelt å legge inn i
  appen?» (hastebehandlet på dagtid). Vurdering: klart ja — lokal timelogg uten AI passer
  lokal-først-arkitekturen og gir daglig verdi. Svar publisert i app/panelsvar.json (vises
  i kommandosentralen under «Svar fra panelet»), lagt som punkt 1 i backloggen for
  kveldens kjøring. Testet som del av v0.9.2-fullkjøringen.
