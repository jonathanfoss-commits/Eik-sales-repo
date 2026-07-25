# DPIA-utkast — Livsarkivet

> **UTKAST — ikke juridisk vurdert.** Skrevet av utviklingsteamet som grunnlag
> for Jonathans gjennomgang og en ekstern personvernjuridisk kvalitetssikring
> FØR lansering. Personvernkonsekvensvurdering etter GDPR art. 35. Ingenting
> her er juridisk rådgivning.

## 1. Hvorfor DPIA er påkrevd
Behandlingen utløser flere av kriteriene i art. 35(3) og Datatilsynets liste:
- **Særlige kategorier** (art. 9): helsedirektiv, og i praksis helseopplysninger
  i praktiske instrukser og «Siste hilsen».
- **Sårbare personer:** etterlatte i akutt sorg, og eiere med kritisk helsesvikt.
- **Sensitiv, samlet profil:** hele den økonomiske og digitale livssituasjonen
  til én person samlet på ett sted (juridisk, forsikring, eiendeler, digitale
  kontoer, tilgangsinformasjon).
- **Nye teknologiske løsninger:** trigger-infrastruktur som frigir opplysninger
  til tredjeparter basert på en verifisert dødsfallshendelse.
- **Konsekvens ved svikt:** uberettiget frigivelse er irreversibel.

## 2. Behandlingens art og formål
| | |
|---|---|
| Behandlingsansvarlig | Livsarkivet/Etterpå (juridisk enhet avklares — *åpent punkt*) |
| Formål | Sikker oppbevaring og KONTROLLERT frigivelse av opplysninger de nærmeste trenger ved eierens død eller kritiske helsesvikt |
| Rettslig grunnlag | Avtale (art. 6(1)(b)) for tjenesten til eier; **uttrykkelig samtykke** (art. 9(2)(a)) for særlige kategorier; berettiget interesse (art. 6(1)(f)) for misbruksvern og revisjonslogg |
| Kategorier av personer | Eiere (abonnenter), betrodde kontakter, mottakere, saksbehandlere. Indirekte: personer omtalt i hvelvinnhold |
| Lagringssted | EU/EØS (Postgres, Frankfurt-region) |
| Databehandlere | Hostingleverandør (Render eller kundens egen boks), e-postleverandør (kun varseltekst uten innhold), Stripe (betaling), Anthropic (AI-vurdering av dødsattest) |

## 3. Avdødes personopplysninger — særskilt merknad
GDPR gjelder ikke avdøde (fortalepunkt 27), men norsk praksis og
personopplysningsloven verner fortsatt opplysningene i praksis, og **de
etterlatte er levende personer med fulle rettigheter**. Vurderingen vår:
- Frigitt innhold blir de etterlattes behandling, men vi forblir
  behandlingsansvarlig for lagringen.
- Innhold som omtaler tredjepersoner (f.eks. helseopplysninger om ektefelle)
  behandles uten deres samtykke. **Tiltak:** eier informeres i UI om ansvaret
  for å omtale andre, og innsyns-/slettehenvendelser fra omtalte tredjeparter
  håndteres manuelt. *Åpent punkt for juridisk gjennomgang.*
- Slettefrist for frigitt arkiv etter avsluttet booppgjør må fastsettes
  (*forslag: 24 måneder etter frigivelse, deretter varsling og sletting*).

## 4. Dataflyt (som bygget)
1. Eier registrerer innhold → lagres i Postgres med RLS bundet til eierens id.
   Sensitiv-tier krypteres i nettleseren; serveren mottar kun chiffertekst.
2. Eier definerer mottakermatrise (element × mottaker × hendelsestype).
3. Betrodd kontakt melder dødsfall → dødsattest lastes opp (bytea i database).
4. To uavhengige kilder + to ULIKE saksbehandlere godkjenner → karenstid 48 t.
5. Eier og alle kontakter varsles ved hvert steg (varselet bærer aldri innhold).
   Eier kan blokkere gjennom hele karenstiden.
6. Karenstid utløper → frigivelse → mottakere ser kun sine elementer.

## 5. Nødvendighet og proporsjonalitet
- **Dataminimering:** kun det eieren selv velger å legge inn. Ingen import fra
  offentlige registre i MVP. Revisjonslogg og varsler lagrer hendelses*typer*,
  aldri innhold. AI-loggen lagrer modell og kostnad, aldri dokumentinnhold.
- **Formålsbegrensning:** innholdet brukes utelukkende til frigivelse. Ingen
  profilering, ingen markedsføring basert på innhold, aldri salg mot personer i
  akutt sorgfase (regel i produktet).
- **AI-bruk:** kun eksplisitt opplastet dødsattest sendes til modellen, og bare
  som råd til saksbehandler. Sensitiv-tier er zero-knowledge og kan ikke
  behandles av AI i det hele tatt.

## 6. Risikoer og tiltak
| # | Risiko | Konsekvens | Tiltak i produktet | Restrisiko |
|---|---|---|---|---|
| R1 | Uberettiget frigivelse (feil eller ondsinnet melding) | Alvorlig, irreversibel | To uavhengige kilder, fire-øyne av to ULIKE saksbehandlere, 48 t karenstid med eier-blokkering, varsel til ALLE kontakter ved hvert forsøk, Vaktagentens anomaliflagg, immutabel revisjonslogg | Lav–middels: en samordnet aktør med falsk attest og eier som ikke kan svare |
| R2 | Tilgangslekkasje mellom brukere | Alvorlig | RLS på hver tabell, appen kobler aldri til som tabelleier, mottaker ser kun matrise-mappede elementer i frigitt sak, egen RLS-testsuite i CI | Lav |
| R3 | Innsyn fra driftspersonell/saksbehandler | Alvorlig | Admin har INGEN leserett til hvelvinnhold (ingen policy finnes), sensitiv-tier er zero-knowledge, all atteståpning revideres | Lav for sensitiv; middels for øvrig innhold ved databasetilgang på infrastrukturnivå |
| R4 | Eier mister sikkerhetsfrasen | Innhold utilgjengelig | Gjenopprettingsnøkkel delt i to (eier + server), begge kreves | Middels: mister eier både frase og kode, er sensitivt innhold tapt (bevisst konsekvens av zero-knowledge — kommuniseres tydelig) |
| R5 | Datatap | Alvorlig | Daglig offsite-backup, automatisert gjenopprettingstest i CI (nivå 6), definert RTO/RPO (*må fastsettes*) | Lav |
| R6 | Promptinjeksjon via opplastet dokument | Middels | Dokumentinnhold rammes inn og deklareres som data, agentens anbefaling er hardkodet til «menneskelig vurdering», red-team-suite i CI | Lav |
| R7 | Selskapsopphør | Alvorlig for brukerne | Dataportabilitet og exit-garanti i vilkårene, plan for dataoverlevelse (*må ferdigstilles*) | Åpen |
| R8 | Betalingsdata | Middels | All kortbehandling hos Stripe; vi lagrer kun kunde-/abonnements-id | Lav |

## 7. De registrertes rettigheter
- **Innsyn/portabilitet (art. 15 og 20):** `GET /api/eksport` gir alt eieren
  har lagt inn som JSON — inkludert de frasepakkede krypteringsnøklene, slik at
  eksporten er brukbar utenfor tjenesten. Testet i `tests/konto.test.js`:
  sensitivt innhold dekrypteres fra eksporten alene med eierens egen frase.
- **Sletting (art. 17):** `POST /api/konto/slett` krever passordet på nytt og
  fjerner konto, hvelv, elementer, kontakter, matrise, hendelser, frigivelser,
  varslinger, krypteringsnøkler og abonnement i én transaksjon. Kontakter i
  ANDRES hvelv beholdes, men løsnes fra den slettede kontoen.
  **Revisjonssporet overlever** (uten innhold, kun hendelsestype og id) fordi
  det er bevismateriale for at frigivelser var korrekte — *avveiningen mot
  art. 17 bør bekreftes av jurist, se `jurist-brief.md` punkt 12.*
- **Innsigelse/begrensning:** eier kan blokkere en frigivelse i karenstiden og
  tilbakekalle mottakertilgang ved å endre matrisen.
- **Revisjonslogg** gir de registrerte etterprøvbarhet — den er bevisst
  uforanderlig, og oppbevaringstid må fastsettes.

## 8. Åpne punkter før lansering
1. Behandlingsansvarlig juridisk enhet og personvernerklæring.
2. Databehandleravtaler: hosting, e-post, Stripe, Anthropic.
3. Vurdering av tredjelandsoverføring for AI-behandling av dødsattest
   (Anthropic) — alternativt kjøre attestkontroll uten AI i EØS-modus.
4. Oppbevaringstider: frigitt arkiv, revisjonslogg, attester, varslinger.
5. RTO/RPO og plan for dataoverlevelse ved selskapsopphør
   (*forslag: RPO 24 t, RTO 4 t — se `lansering-sjekkliste.md`*).
6. Ekstern pen-test før produksjon.
7. Rutine for henvendelser fra tredjepersoner omtalt i hvelvinnhold.
8. Oppbevaringstid for revisjonsloggen som overlever kontosletting.
