# ADR-009: Innlogging via selskapets identitetsleverandør

**Status:** Vedtatt (implementert i migrasjon 015).

## Kontekst
ADR-007 utsatte dette med begrunnelsen «krever en ekte IdP å teste mot og bør
bygges sammen med første kunde».

**Den begrunnelsen holdt ikke.** En falsk IdP med ekte RSA-nøkler tester
nøyaktig det samme: discovery, JWKS, kodebytte og signaturverifisering er
standardisert. Det eneste en ekte tilbyder legger til, er deres egne
særegenheter — og de oppdager man uansett først i integrasjonstesten med dem.
Utsettelsen gjorde bare at et spørsmål innkjøperen stiller i første møte sto
ubesvart lenger enn nødvendig.

Poenget er heller ikke bekvemmelighet. Et forsikringsselskaps kunder har
allerede en identitet hos selskapet. Et ekstra passord til «enda en tjeneste»
er en terskel ved registrering — og en reell risiko ved dødsfall, for
etterlatte leter ikke etter et passord de aldri visste fantes.

## Beslutning

### Authorization Code + PKCE, uten avhengigheter
`node:crypto` kan importere JWKS-nøkler direkte (`format: 'jwk'`) og
verifisere RS256. Ingen jose, ingen passport — i tråd med at resten av
tjenesten kun bruker `pg`.

### Hva som verifiseres på id_token, og hvorfor hver enkelt
| Sjekk | Uten den |
|---|---|
| signatur | hvem som helst kan skrive sitt eget token |
| `iss` mot tenantens konfigurerte utsteder | en annen IdP kan logge inn hos feil selskap |
| `aud` | et token utstedt til en annen klient godtas |
| `exp`/`iat` (±120 s slingring) | gamle tokener lever evig |
| `nonce` | et gyldig token fra en annen økt kan spilles av |
| `alg = RS256` | «alg: none» er den klassiske JWT-bakdøren |

### Kobling på `sub`, aldri på e-post alene
E-post er foranderlig, og hos flere tilbydere noe brukeren selv kan sette. En
kobling på e-post ville latt noen med rett adresse hos feil IdP overta en
konto. `sub` er stabil og utstederens eget ansvar.

Konsekvens som er verdt prisen: bytter en kunde e-post hos selskapet, følger
kontoen med. Testet.

### En ekstern innlogging kan ALDRI bli saksbehandler
`oidc_koble_bruker()` setter alltid `rolle = 'person'`. Fire-øyne-regelen er
verdt lite hvis selskapets egen IdP kan utnevne godkjennere hos oss. Dette
ligger i databasefunksjonen, ikke i applikasjonskoden.

### En eksisterende passordkonto overtas ikke automatisk
Finnes e-posten allerede uten ekstern kobling, avvises innloggingen med en
beskjed om å logge inn med passord først. Alternativet — å koble automatisk —
ville gjort enhver IdP i stand til å overta en konto ved å påstå riktig
e-postadresse.

### state og nonce er engangs og tenant-bundet
De ligger i databasen, ikke i en signert cookie, fordi de må kunne **slettes**
ved innløsning. `oidc_los_inn_forsok()` er en `DELETE ... RETURNING`: én runde,
aldri to. Forsøket er dessuten bundet til tenanten det ble startet på, så en
innlogging startet hos ett selskap ikke kan fullføres hos et annet.

### redirect_uri fra vertsnavnet
Hvert selskap bruker sin egen adresse. At `Host` kan forfalskes spiller ingen
rolle: IdP-en godtar kun redirect_uri-er som står i selskapets egen liste hos
dem, så en forfalsket vert ender i avvisning der — ikke hos oss.

### Klienthemmeligheten i Basic-header
Ikke i kroppen, der den havner i tilbydernes tilgangslogger. Offentlig klient
(uten hemmelighet) støttes også — da er PKCE hele beskyttelsen.

## Konsekvenser
- Knappen «Logg inn med \<selskap\>» står **først** på innloggingsskjermen når
  selskapet har satt opp OIDC, over e-post og passord.
- Discovery og JWKS caches i fem minutter: kort nok til at en nøkkelrotasjon
  hos IdP-en går gjennom av seg selv, langt nok til at vi ikke banker på ved
  hvert klikk.
- Kontoer opprettet via OIDC har ingen brukbar passord-hash. De kan bruke
  «Glemt passord?» for å sette ett, hvis de vil ha begge veier inn.

## Bevis
`tests/oidc.test.js` — fjorten tester mot en falsk IdP med ekte RSA-nøkler.
Åtte av dem er angrep: forfalsket signatur, feil utsteder, token til en annen
klient, utløpt token, nonce fra en annen økt, gjenbrukt state, ukjent state,
og forsøk på å overta en eksisterende passordkonto. Pluss den viktigste: at en
ekstern innlogging aldri kan bli saksbehandler.
