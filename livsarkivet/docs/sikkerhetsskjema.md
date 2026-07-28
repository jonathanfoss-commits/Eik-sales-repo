# Sikkerhetsskjema — ferdig utfylt

Svarene her er hentet fra koden slik den faktisk er, ikke fra hva vi ønsker at
den skal være. Hvert «Ja» skal kunne etterprøves i repoet; referansen står i
høyre kolonne. Der svaret er «Nei» eller «Delvis», står det uten omskriving.

**Til den som sender dette videre:** oppdater det når koden endres. Et
sikkerhetsskjema som er seks måneder gammelt, er verre enn ingen — det
inviterer til å bli tatt i noe.

Sist oppdatert i samme leveranse som OIDC (ADR-009).

---

## A. Tilgangsstyring

| # | Spørsmål | Svar | Hvor |
|---|---|---|---|
| A1 | Er tilgangskontroll håndhevet under applikasjonslaget? | **Ja.** Row Level Security i Postgres. Appen kobler til som roller som ikke eier noen tabell, så en feil i koden gir null rader — ikke feil rader. | `migrations/001` |
| A2 | Kan én kundes data nås fra en annen kundes kontekst? | **Nei.** Testet ved å forsøke: lesing, godkjenning og skriving på tvers av tenant. | `tests/tenant.test.js` |
| A3 | Kan leverandørens ansatte lese kundeinnhold? | **Nei.** Det finnes ingen tilgangsregel som gir det. Vi ser saksmetadata for support, aldri innhold, aldri delte felt. | ADR-005, ADR-006 |
| A4 | Tofaktor for privilegerte kontoer? | **Ja, obligatorisk.** En saksbehandlerkonto uten TOTP nektes innlogging. | `auth.js`, `tests/herding.test.js` |
| A5 | Fireøyneprinsipp på kritiske handlinger? | **Ja.** To ULIKE saksbehandlere i samme selskap, håndhevet både i app og som databasebegrensning. | `migrations/003` |
| A6 | SSO / føderert innlogging? | **Ja.** OIDC Authorization Code + PKCE mot kundens egen IdP. Ekstern innlogging kan aldri gi administratorrolle. | ADR-009 |
| A7 | Rutine for tilbaketrekking av tilgang? | **Delvis.** API-nøkler og kontoer kan deaktiveres umiddelbart. **Formell offboarding-rutine er ikke dokumentert.** | — |

## B. Kryptering og datahåndtering

| # | Spørsmål | Svar | Hvor |
|---|---|---|---|
| B1 | Kryptering i transitt? | **Ja.** TLS, HSTS i produksjon. Webhooks kun til https (unntak: loopback). | `index.js`, `migrations/013` |
| B2 | Kryptering i ro? | **Ja** på databasenivå hos leverandøren. I tillegg er sensitiv-tier kryptert i **nettleseren** — serveren mottar aldri klartekst. | ADR-001 |
| B3 | Hvem har nøklene til det klientkrypterte? | Kunden. Nøkkelen avledes fra kundens frase (PBKDF2, 310 000 runder). Vi kan ikke dekryptere. | `app/js/krypto.js` |
| B4 | Lagres fødselsnummer? | **Nei.** Kun HMAC-hash med pepper utenfor databasen. Se B5. | ADR-008 |
| B5 | Kjente svakheter i hashingen? | **Ja, og vi sier det:** fødselsnummer har lite tallrom. En angriper med BÅDE databasedump OG pepper kan regne seg tilbake. De er derfor lagret atskilt; en dump alene er ikke nok. | ADR-008 |
| B6 | Hvilke persondata deles med kunden (selskapet)? | Kun fire felt sluttbrukeren aktivt har delt, og som hen kan trekke tilbake med umiddelbar virkning. | ADR-006 |
| B7 | Dataminimering i logger? | **Ja.** Revisjonsloggen bærer hendelsestype og referanser, aldri innhold. Varsler og webhook-nyttelast bærer aldri personopplysninger. | `revisjon.js`, ADR-007 |

## C. Applikasjonssikkerhet

| # | Spørsmål | Svar | Hvor |
|---|---|---|---|
| C1 | Content Security Policy? | **Ja**, uten eksterne kilder. `frame-ancestors 'none'`, `nosniff`, `noindex`. | `index.js` |
| C2 | Filopplasting begrenset? | **Ja.** Kun PDF/JPEG/PNG/HEIC, håndhevet i API **og** som databasebegrensning. Serveres med egen sandbox-CSP, aldri inline for utrygge typer. | `migrations/010` |
| C3 | Rate-demping? | **Ja.** Innlogging (per IP og per e-post), attestopplasting, eksport, per API-nøkkel. | `index.js`, `api/selskap.js` |
| C4 | Beskyttelse mot promptinjeksjon i AI-bruk? | **Ja**, og AI står aldri på kritisk sti: agentene gir råd, aldri vedtak. Ingen agent kan endre tilstand. | `ai/gateway.js`, ADR i README |
| C5 | Avhengighetsrisiko? | **Én** kjøreavhengighet: `pg`. Playwright er kun testavhengighet. | `package.json` |
| C6 | Hemmeligheter i kode? | **Nei.** CI feiler på hemmelighetsskann ved hver endring. | `.github/workflows/livsarkivet-ci.yml` |
| C7 | Penetrasjonstest gjennomført? | **Nei. Ikke gjennomført.** Dette er den største åpne posten i skjemaet. | — |

## D. Drift og gjenoppretting

| # | Spørsmål | Svar | Hvor |
|---|---|---|---|
| D1 | Backup? | Daglig hos databaseleverandøren. | Drift |
| D2 | Er gjenoppretting testet? | **Ja, automatisk ved hver endring i CI** — ikke bare dokumentert. | `tests/drift.test.js` |
| D3 | RTO/RPO? | **Ikke formelt fastsatt.** Forslag: RPO 24 t, RTO 4 t. | — |
| D4 | Kan en hendelse gå tapt ved krasj? | **Nei.** Tilstandsendring, revisjonsrad, varslingskø og webhook-kø skjer i én transaksjon. Utsending er separat og gjentakbar. | `feier.js`, `varsling.js` |
| D5 | Vaktordning og responstid? | **Ikke etablert.** | — |
| D6 | Lasttestet? | **Ja**, i CI: samtidige innlogginger og lesninger med terskler for p95. | `tests/lasttest.js` |
| D7 | Endringshåndtering? | Alle endringer gjennom pull request med grønn CI. Sju testnivåer. Arkitekturbeslutninger dokumentert som ADR. | `docs/adr/` |

## E. Personvern og etterlevelse

| # | Spørsmål | Svar | Hvor |
|---|---|---|---|
| E1 | Datalokasjon? | EU/EØS (Frankfurt). | `render.yaml` |
| E2 | Tredjelandsoverføring? | Kun ved valgfri AI-attestkontroll. Lar man nøkkelen stå tom, kjører tjenesten i EØS-modus **uten kodeendring**. | `ai/gateway.js` |
| E3 | DPIA? | **Utkast foreligger**, ikke juridisk kvalitetssikret. | `docs/dpia-utkast.md` |
| E4 | Innsyn og portabilitet? | **Ja.** Full eksport som JSON, inkludert krypteringsnøklene, så innholdet kan åpnes utenfor tjenesten. | `GET /api/eksport` |
| E5 | Sletterett? | **Ja.** Krever passord på nytt. Revisjonssporet uten innhold overlever som bevis for at frigivelser var korrekte — dette er en avveining vi ber jurist bekrefte. | `POST /api/konto/slett` |
| E6 | Underleverandører? | Hosting (Render, Frankfurt), e-post, Stripe, valgfritt Anthropic. **Databehandleravtaler er ikke inngått.** | — |
| E7 | Behandlingsansvarlig? | **Ikke avklart.** Blokkerer vilkår, databehandleravtaler og betaling. | — |
| E8 | Varslingsplikt ved brudd? | GDPR art. 33: 72 timer til tilsynet. Raskere frist til kunden er et **avtalepunkt**, ikke et teknisk. | — |
| E9 | Sertifiseringer (ISO 27001, SOC 2)? | **Ingen.** Vi har testbevis og dokumentert arkitektur, ikke et sertifikat. | — |

---

## Sammendrag av åpne poster

1. Penetrasjonstest — ikke gjennomført
2. Behandlingsansvarlig juridisk enhet — ikke avklart
3. Databehandleravtaler — ikke inngått
4. RTO/RPO — ikke formelt fastsatt
5. Vaktordning og responstid — ikke etablert
6. Formell offboarding-rutine — ikke dokumentert
7. Sertifiseringer — ingen

Ingen av disse er kodearbeid. Punkt 1–5 er de som normalt må lukkes før
signatur; 6 og 7 kan følge etter, avhengig av selskapets egne krav.
