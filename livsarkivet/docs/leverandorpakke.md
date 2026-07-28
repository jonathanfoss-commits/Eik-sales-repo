# Leverandørpakke — Livsarkivet som IKT-tredjepart til et forsikringsselskap

**Status:** Utkast fra utviklingsteamet. Beskriver det som faktisk er bygget og
testet per i dag. Punkter som ikke er på plass er merket **MANGLER** — de er
ikke utelatt for å pynte på bildet.

Dette dokumentet er svaret på spørsmålene et forsikringsselskaps
innkjøps-, sikkerhets- og compliance-funksjon stiller før de kan ta en
leverandør i bruk. Det erstatter ikke DPIA-en (`dpia-utkast.md`) eller
vilkårene (`vilkar-utkast.md`), men peker til dem.

---

## 1. Hva tjenesten er, og hva den ikke er

Livsarkivet er et hvelv der en privatperson legger det de nærmeste vil trenge,
og som frigis kontrollert etter et verifisert dødsfall. Kjerneloopen er
**hvelv → mottakermatrise → trigger → verifisering → karenstid → frigivelse →
etterlattevisning.**

**Tjenesten behandler ikke forsikringssaker.** Den varsler at et arkiv er
frigitt, og utleverer de feltene kunden aktivt har delt. Saksbehandlingen skjer
i selskapets egne systemer.

Kritikalitet for selskapet: tjenesten er **ikke** kritisk for
forsikringsleveransen. Er Livsarkivet nede, kan selskapet behandle dødsfall som
før — meldingen kommer bare ikke automatisk. Dette er en bevisst
arkitekturegenskap, og bør stå i tjenesteavtalen: den holder Livsarkivet unna
kategorien «kritisk eller viktig funksjon» i DORA-forstand, med den
tilsynsbyrden det innebærer for begge parter.

## 2. Datastrømmer og hvem som ser hva

| Data | Kunden | Mottakere | Selskapets saksbehandler | Livsarkivets drift |
|---|---|---|---|---|
| Hvelvinnhold (delt/privat) | ✅ | Etter frigivelse, kun matrisens elementer | **Aldri** | **Aldri** |
| Hvelvinnhold (sensitiv) | ✅ dekryptert lokalt | Etter frigivelse, dekryptert lokalt | **Aldri** (kun chiffertekst finnes) | **Aldri** |
| Delte felt (polise, begunstiget …) | ✅ | ❌ | ✅ egen tenant, aktive delinger | **Aldri** |
| Saksmetadata (status, tidspunkt) | ✅ egen sak | ❌ | ✅ egen tenant | ✅ på tvers (support) |
| Melderidentitet ved dødsfallsmelding | ❌ | ❌ | ✅ egen tenant | ✅ |
| Revisjonslogg | ✅ eget hvelv | ❌ | ✅ egen tenant | ✅ |
| Fødselsnummer | Sendes én gang, hashes | ❌ | ❌ | **Lagres aldri** |

«Aldri» betyr at det ikke finnes en RLS-policy som gir tilgangen — ikke at
applikasjonskoden lar være å spørre. Se punkt 4.

## 3. Isolasjon mellom selskaper

Flere selskaper står i samme database, isolert av Row Level Security på
radnivå (ADR-005). Konkret:

- Hver bruker tilhører én tenant. Tenanten til en sak utledes fra **hvelvets
  eier**, ikke fra en kolonne som kan komme i utakt.
- En saksbehandler ser kun saker i egen tenant — `er_admin_for(hvelv_id)`,
  ikke et ubetinget `er_admin()`.
- Fire-øyne-regelen gjelder innenfor samme selskap: to ULIKE saksbehandlere,
  håndhevet både i applikasjonen og som `CHECK (godkjent_2_av <> godkjent_1_av)`
  i databasen.
- **Livsarkivets drift ser saksmetadata på tvers**, for support og tilsyn.
  Dette er normal leverandørrolle og skal stå eksplisitt i
  databehandleravtalen. Driften ser aldri hvelvinnhold og aldri delte felt.

Ønsker selskapet **egen database**, er det en driftsendring, ikke en
omskriving — modellen står ikke i veien. Det bør prises deretter.

## 4. Sikkerhetsarkitektur

**Applikasjonen kan ikke omgå tilgangskontrollen.** Den kobler til som
databaseroller (`livsarkiv_app`, `livsarkiv_auth`) som ikke eier noen tabell,
og hver spørring kjører i en transaksjon med transaksjonslokal
`app.bruker_id` + `app.rolle`. En feil i applikasjonskoden gir null rader, ikke
feil rader.

- **Autentisering:** scrypt-hashede passord, sesjonstoken kun lagret som
  SHA-256. Saksbehandlere **må** ha TOTP — en admin-konto uten tofaktor nektes
  innlogging, ellers ville fire-øyne-regelen kunne omgås med ett passord.
- **Zero-knowledge sensitiv-tier:** kryptert i nettleseren med WebCrypto
  (PBKDF2 310k, AES-GCM), nøkkeldeling via ECDH P-256. Serveren mottar aldri
  klartekst. Verifisert i E2E ved å lese chifferteksten rett fra basen.
- **Immutabel revisjonslogg:** ingen app-rolle har UPDATE eller DELETE på
  `revisjon`. Endring feiler med «permission denied» uansett policy.
- **Innholdssikkerhet:** CSP uten eksterne kilder, `frame-ancestors 'none'`,
  HSTS, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex`. Opplastede
  attester serveres med egen `sandbox`-CSP og aldri inline for utrygge typer.
- **Attester:** kun PDF/JPEG/PNG/HEIC, håndhevet både i API og som CHECK.
- **Rate-demping:** innlogging (per IP og per e-post), attestopplasting,
  eksport, og per API-nøkkel.

**Kjente avgrensninger, sagt rett ut:**
- Fødselsnummer-hashen er en HMAC med pepper utenfor databasen. Tallrommet er
  lite; en angriper med både databasedump og pepper kan regne seg tilbake. En
  dump alene er ikke nok (ADR-008).
- Delte felt ligger i klartekst. De må kunne leses av selskapet — det er hele
  poenget — og er derfor begrenset til fire korte felttyper (ADR-006).
- **MANGLER:** ekstern penetrasjonstest. Bestilt-status er Jonathans.

## 5. Tilgjengelighet, gjenoppretting og hendelseshåndtering

- **Datalokasjon:** EU/EØS (Frankfurt). Ingen overføring til tredjeland, med
  ett valgfritt unntak: AI-assistert attestkontroll. Lar man
  `ANTHROPIC_API_KEY` stå tom, kjører tjenesten i EØS-modus uten kodeendring.
- **Holdbarhet i frigivelsesløpet:** tilstandsendring, revisjonsrad,
  varslingskø og webhook-kø skjer i ÉN transaksjon. Det finnes aldri en
  frigivelse ingen ble varslet om. Utsending er en separat, gjentakbar
  passering — nedetid i e-post eller hos selskapets endepunkt utsetter bare
  leveringen, den mister ingenting.
- **Backup:** daglig hos databaseleverandøren. **Gjenoppretting testes
  automatisk i CI ved hver endring** (nivå 6), ikke bare dokumentert.
- **MANGLER:** RTO/RPO er ikke formelt fastsatt. Forslag som skal inn i
  DPIA-en: RPO 24 timer, RTO 4 timer.
- **MANGLER:** vaktordning og formell responstid. Se punkt 8.
- **Varslingsplikt ved brudd:** GDPR art. 33 gir 72 timer til tilsynet.
  Selskapet vil kreve raskere varsling til seg — typisk 24 timer. Dette er et
  avtalepunkt, ikke et teknisk.

## 6. Integrasjon

Se ADR-007 for detaljene. Kort:

- **Webhook** ved frigivelse, med HMAC-SHA256 der tidsstemplet inngår i
  signaturen. Nyttelasten bærer **ingen personopplysninger** — kun sak-id og
  tidspunkt.
- **Selskapet varsles først når arkivet er FRIGITT**, aldri når karenstiden
  starter. I karenstiden kan eieren fortsatt stoppe alt fordi hen lever, og en
  for tidlig igangsatt utbetaling kan ikke ringes tilbake.
- **Les-API** med bærer-nøkkel gir egne frigitte saker og de feltene kunden
  aktivt deler. Et tilbaketrekk virker umiddelbart, også mot en integrasjon som
  allerede kjenner sak-id-en.
- **OIDC-innlogging er på plass** (ADR-009): Authorization Code + PKCE,
  RS256 verifisert mot IdP-ens JWKS. Kobling på `sub`, aldri e-post alene, og
  en ekstern innlogging kan aldri bli saksbehandler. Selskapet registrerer
  `https://<deres vertsnavn>/api/auth/oidc/tilbake` som redirect-URI hos sin
  egen tilbyder. Integrasjonstesten mot deres faktiske IdP gjenstår, men
  protokollen er implementert og angrepstestet.
- **MANGLER:** mTLS. Nøkkelmodellen står ikke i veien for å legge det på.

## 7. Testregime

Sju nivåer, hvorav nivå 1–6 kjører automatisk i CI ved hver endring:

| Nivå | Hva | Hvor |
|---|---|---|
| 1 | Tilstandsmaskinen, 100 % av overgangene mot en håndskrevet fasit | `tests/frigivelse.test.js` |
| 2 | RLS og migrasjoner — policyene, ikke koden, er muren | `tests/rls.test.js`, `tenant.test.js`, `deling.test.js` |
| 2 | OIDC mot falsk IdP med ekte RSA-nøkler (8 angrepsforsøk) | `tests/oidc.test.js` |
| 3 | Zero-knowledge-krypto | `tests/krypto.test.js` |
| 4 | E2E i Chromium, hele frigivelsesløpet + negativløp | `tests/e2e.js` |
| 5 | Agenter (golden + red-team) | `tests/agenter.test.js` |
| 6 | Drift: backup-gjenoppretting, feilinjeksjon, last | `tests/drift.test.js`, `lasttest.js` |
| 7 | Manuell akseptansetest, inkl. etterlattevisning testet av person uten forkunnskap | `docs/akseptansetest.md` |

Testene er skrevet for å **bryte** grensene, ikke bekrefte dem: et annet
selskaps saker, godkjenning på tvers av tenant, admin mot hvelvinnhold, forbi
et tilbaketrekk, forfalsket hendelseskilde.

## 8. Bemanning og drift — det som ikke kan løses teknisk

**Fire-øyne-regelen krever to bemannede mennesker per selskap.** Uten to
tilgjengelige saksbehandlere kan ingen frigivelse skje i det hele tatt. Dette
er tilsiktet og må avklares i avtalen:

- **MANGLER:** hvem de to er, ved navn.
- **MANGLER:** forventet responstid, og hva som skjer ved ferie og sykdom.
  Et dødsfall venter ikke.
- **MANGLER:** eskaleringsvei når begge er utilgjengelige.

## 9. Utkontraktering og tilsyn

- Et forsikringsselskap som setter ut IKT-tjenester har **meldeplikt til
  Finanstilsynet** ved utkontraktering av betydning. Om Livsarkivet utløser
  meldeplikt avhenger av kritikalitetsvurderingen i punkt 1 — vår vurdering er
  at det ikke gjør det, men **det er selskapets vurdering, ikke vår**.
- **DORA** stiller krav til register over IKT-tredjeparter, avtalepunkter om
  revisjonsrett, tilgang, exit og hendelsesrapportering. Vi kan levere:
  revisjonseksport per tenant, arkitekturdokumentasjon (ADR-ene), og
  testbevis. **MANGLER:** formell revisjonsrett-klausul og exit-plan i avtale.
- **Underleverandører:** hosting (Render, Frankfurt), e-postutsending, Stripe,
  og valgfritt Anthropic for AI-attestkontroll. Alle skal ha
  databehandleravtale. **MANGLER:** avtalene er ikke inngått.
- **Exit:** kunden kan når som helst hente alt sitt via `GET /api/eksport`,
  inkludert de frasepakkede krypteringsnøklene, slik at innholdet kan
  dekrypteres utenfor tjenesten. **MANGLER:** plan for dataoverlevelse ved
  selskapsopphør — dette er en garanti vi lover i vilkårene og må kunne vise.

## 10. Personvern

Se `dpia-utkast.md`. Hovedpunkter:

- **MANGLER:** behandlingsansvarlig juridisk enhet er ikke avklart. Dette
  blokkerer vilkår, databehandleravtaler og Stripe.
- Rollefordelingen må avklares med jurist: er selskapet behandlingsansvarlig
  for sine kunders arkiv, eller er Livsarkivet det med selskapet som
  distributør? Vår modell peker mot det siste — kunden er vår kunde, selskapet
  ser kun det kunden deler — og **det er faktisk selskapets sterkeste
  argument for å ta tjenesten i bruk:** de slipper å være behandlingsansvarlig
  for sine kunders mest sensitive opplysninger.
- Registrertes rettigheter: innsyn og portabilitet (`GET /api/eksport`),
  sletting (`POST /api/konto/slett`, krever passord på nytt). Revisjonssporet
  uten innhold overlever sletting som bevis for at frigivelser var korrekte.
- **MANGLER:** oppbevaringstider skal bekreftes av jurist.

---

## Sammendrag: hva som mangler før signatur

| # | Mangler | Eier | Blokkerer |
|---|---|---|---|
| 1 | Behandlingsansvarlig juridisk enhet | Jonathan | Vilkår, DPA-er, Stripe |
| 2 | Ekstern penetrasjonstest | Jonathan | Sikkerhetsgodkjenning |
| 3 | To navngitte saksbehandlere + responstid | Selskapet/Jonathan | All frigivelse |
| 4 | RTO/RPO formelt fastsatt | Jonathan | DORA-vurdering |
| 5 | Databehandleravtaler med underleverandører | Jonathan | Signatur |
| 6 | Exit-plan ved selskapsopphør | Jonathan | Vilkår |
| 7 | Integrasjonstest mot selskapets faktiske IdP | Felles, ved oppstart | Innlogging i produksjon |
| 8 | Maskinporten-avtale + hjemmel for Folkeregisteret | Jonathan + jurist | Automatisk trigger |
