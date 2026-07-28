# Brief til jurist — Livsarkivet

Denne er skrevet for å gjøre jurist-timen så billig og treffsikker som mulig:
alt bakgrunnsmateriale foreligger, og spørsmålene er konkrete. Send gjerne
dette dokumentet sammen med `vilkar-utkast.md` og `dpia-utkast.md`.

## Hva tjenesten er, i tre setninger
Livsarkivet er et digitalt beredskapsarkiv: brukeren legger inn opplysninger de
nærmeste vil trenge (hvor papirene ligger, forsikringer, digitale kontoer,
praktiske instrukser, helsedirektiv), og bestemmer selv hvem som skal få hva.
Ved et meldt dødsfall verifiseres hendelsen med dødsattest og to uavhengige
kilder, godkjennes av to ulike saksbehandlere, og først etter 48 timers
karenstid — der eieren varsles og kan stoppe alt — frigis innholdet til de
mottakerne eieren har valgt. Tjenesten lagrer og distribuerer; den utfører
ingen juridiske handlinger.

## Det viktigste vi trenger hjelp til
Vi har selv formulert ansvarsavgrensningen i vilkårenes punkt 1: at Livsarkivet
**ikke** oppretter gyldige testamenter eller fremtidsfullmakter, og at
formkravene i arveloven og vergemålsloven må oppfylles utenfor tjenesten.
**Denne formuleringen må kvalitetssikres — den er tjenestens viktigste
ansvarsavgrensning.** Vi vil vite om den holder, og om den er plassert og
formulert slik at den faktisk virker overfor en forbruker.

## Spørsmål — vilkår
1. Er brukerne forbrukere i lovens forstand, og hvilke ufravikelige
   forbrukerrettigheter må inn (særlig **angrerett ved fjernsalg** av
   abonnement)?
2. Holder ansvarsavgrensningen om formkrav (punkt 1 i vilkårene)?
3. Hvilken ansvarsbegrensning og hvilket ansvarstak er realistisk for en
   tjeneste der svikt kan bety at et arkiv frigis for tidlig — eller ikke i
   det hele tatt?
4. **Saksbehandlernes rolle:** vi verifiserer dødsattester manuelt (to
   personer). Påtar vi oss et selvstendig ansvar med dette, og hvilken
   aktsomhetsnorm gjelder? Bør vi formulere oss annerledes om hva
   verifiseringen er?
5. Verneting og tvisteløsning.
6. Bør vilkårene si noe om hva som skjer hvis en **mottaker mener at
   frigivelsen var uberettiget** — eller hvis arvinger er uenige om innholdet?

## Spørsmål — personvern
7. **Behandlingsansvarlig enhet:** vi må avklare hvilken juridisk enhet som
   står ansvarlig (og dermed hvem som signerer databehandleravtalene).
8. **Avdødes personopplysninger:** GDPR gjelder ikke avdøde, men de etterlatte
   er levende. Hvordan bør vi behandle innhold som **omtaler tredjepersoner**
   (f.eks. helseopplysninger om ektefelle) som aldri har samtykket? Vi
   informerer eieren i grensesnittet i dag — er det nok?
9. **Oppbevaringstider.** Våre forslag, som vi ber om å få bekreftet eller
   korrigert: frigitt arkiv 24 måneder etter frigivelse, attester 24 måneder,
   revisjonslogg 10 år (den er bevismateriale for at frigivelsen var korrekt).
10. **Tredjelandsoverføring:** dødsattesten kan sendes til en AI-tjeneste
    (Anthropic) for en rådgivende kontroll før den menneskelige vurderingen.
    Hva kreves for at dette er lovlig — og bør vi heller kjøre helt uten AI?
    *Tjenesten er bygget slik at AI kan skrus av med én innstilling, uten at
    noe annet endres.*
11. Er en DPIA etter vår vurdering påkrevd (vi mener ja), og trenger vi
    **forhåndsdrøfting med Datatilsynet** etter art. 36?
12. Vi har **zero-knowledge-kryptering** på det mest sensitive: vi kan ikke
    lese det, og mister brukeren både sikkerhetsfrasen og gjenopprettings-
    koden, er innholdet tapt for godt. Må dette kommuniseres på en særskilt
    måte for å være gyldig avtalt?

## Det tekniske som er relevant for vurderingen
- All lagring i EU/EØS (Postgres, Frankfurt).
- Tilgangsstyring håndheves i databasen, ikke i applikasjonskoden: en bruker
  kan teknisk ikke se en annens data, og **saksbehandlere har ingen mulighet
  til å lese arkivinnhold** — bare sakens metadata og dødsattesten.
- Uforanderlig revisjonslogg over alt som skjer i frigivelsesløpet. Den
  inneholder aldri innhold, bare hendelsestyper og tidspunkt.
- Varsler (e-post) inneholder aldri noe fra arkivet.
- Dataportabilitet og sletterett er bygget: brukeren kan laste ned alt (også
  krypteringsnøklene, slik at eksporten er brukbar utenfor tjenesten) og slette
  kontoen med alt innhold. Revisjonssporet overlever slettingen — vi ber om en
  vurdering av om det er riktig avveining mot art. 17.
- Mottakertilgang er gratis, og en frigivelse skjer selv om abonnementet er
  ubetalt.

## Nye spørsmål etter distribusjonsmodellen mot forsikring

Tjenesten skal kunne tilbys av et livsforsikringsselskap under egen merkevare.
Det reiser fire spørsmål til:

13. **Hvem er behandlingsansvarlig når selskapet distribuerer?** Vår modell
    peker mot at Livsarkivet er behandlingsansvarlig og selskapet kun
    distributør: kunden er vår kunde, og selskapet ser utelukkende de feltene
    kunden aktivt har delt. Det er også selskapets sterkeste grunn til å ta
    tjenesten i bruk — de slipper ansvaret for kundenes mest sensitive
    opplysninger. Holder den konstruksjonen?

14. **Er delingen av utvalgte felt et gyldig samtykke, eller
    avtaleoppfyllelse?** Kunden krysser av per felt (polisenummer,
    kundenummer, begunstiget, kontaktperson) og kan trekke tilbake når som
    helst med umiddelbar virkning. Grunnlaget må være riktig valgt, siden
    tilbaketrekk skal være reelt.

15. **Fødselsnummer:** vi lagrer kun en HMAC-hash med en pepper utenfor
    databasen, aldri nummeret. Er hashen fortsatt en personopplysning i
    rettslig forstand (vi mener ja), og hvilke krav utløser det? Se ADR-008
    for den ærlige beskrivelsen av svakheten.

16. **Hjemmel for Folkeregisteret:** et forsikringsselskap har som regel
    hjemmel for opplysninger om egne kunder. Har Livsarkivet den samme
    hjemmelen som databehandler på deres vegne — eller må oppslaget gjøres av
    selskapet, som så varsler oss?

Se også `docs/leverandorpakke.md`, som er det samme materialet vendt mot
selskapets innkjøps- og compliance-funksjon.

## Vedlegg
- `docs/vilkar-utkast.md` — vilkårsutkast med åpne punkter markert.
- `docs/dpia-utkast.md` — DPIA-utkast med dataflyt, risikotabell og åpne punkter.
- `docs/leverandorpakke.md` — leverandørvurdering (DORA, utkontraktering,
  isolasjon mellom selskaper), med en eksplisitt liste over det som mangler.
