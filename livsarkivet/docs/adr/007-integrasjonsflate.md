# ADR-007: Integrasjonsflate — API-nøkler og webhooks

**Status:** Vedtatt (implementert i migrasjon 013).

## Kontekst
Et livsforsikringsselskap som distribuerer Livsarkivet må kunne koble det til
sine egne systemer. IT-arkitekten deres stiller to spørsmål i første møte:
«hvordan får vi vite at en kunde er død?» og «hvordan henter vi det vi trenger
for å behandle saken?»

## Beslutning

### 1. Webhooken bærer ingen personopplysninger
Nyttelasten er `{hendelse, sak_id, tidspunkt}`. Ikke ett navn, ikke ett
polisenummer. Selskapet henter feltene etterpå med API-nøkkelen sin.

Grunnen er ikke pedanteri. Ved oppslaget sjekkes `trukket_tid` på nytt, hver
gang. Hadde verdiene ligget i nyttelasten, ville et tilbaketrekk vært
virkningsløst mot en kopi som allerede lå i selskapets kø — og da hadde
delingslaget (ADR-006) vært et løfte vi ikke kunne holde.

Bieffekt som teller i en sikkerhetsgjennomgang: køtabellen vår inneholder
aldri kundedata, og et feilsendt eller avlyttet webhook-kall lekker ingenting.

### 2. Vi varsler først ved FRIGITT — aldri når karenstiden starter
Det ville vært teknisk enklere å varsle straks to saksbehandlere har godkjent.
Vi gjør det ikke: i karenstiden kan eieren fortsatt stoppe alt, fordi hen
lever. Varsler vi selskapet da, kan en utbetaling være satt i gang før
nødbremsen er brukt — og et dødsbudskap kan ikke trekkes tilbake med en PATCH.

De 48 timene koster selskapet ingenting. De koster alt for den ene kunden i
året der meldingen er feil.

### 3. Nøkkelen gir tenant, ikke identitet
Person-skopet RLS har ingenting å gripe fatt i når den som ringer er et system.
Rekkevidden håndheves i stedet av SECURITY DEFINER-funksjoner som tar
`tenant_id` som argument og bare svarer for saker i den tenanten. Nøkkelen
lagres kun som SHA-256, med et prefiks i klartekst så drift kan se *hvilken*
nøkkel uten å ha den — samme mønster som sesjonstokener og invitasjonskoder.

Det selskapet kan lese er uttømmende: **egne frigitte saker, og bare felt
kunden aktivt deler.** Aldri hvelvinnhold, aldri kontakter, aldri attester.
En sak i karenstid er ikke synlig i det hele tatt.

### 4. Signering med tidsstempel i signaturen
```
X-Livsarkivet-Signatur: sha256=<hmac over "<tidsstempel>.<kropp>">
X-Livsarkivet-Tidsstempel: <unix-sekunder>
```
Tidsstemplet er med i det signerte nettopp for at et gammelt, gyldig kall ikke
skal kunne spilles av på nytt. Selskapet skal avvise tidsstempler eldre enn
fem minutter.

### 5. Holdbarhet som for varslene
Utsendingsraden legges i kø i SAMME transaksjon som tilstandsendringen
(CLAUDE.md punkt 8). Rulles frigivelsen tilbake, forsvinner webhooken — det
finnes aldri en utsending om noe som ikke skjedde. Utsending er en separat,
gjentakbar passering med eksponentiell tilbaketrekning (1, 2, 4 … minutter,
tak ~4 timer, 12 forsøk). En feilet utsending **slettes ikke** — den blir
liggende med `siste_feil`, for ellers mister drift beviset på at selskapets
endepunkt var nede.

### 6. https, med ett unntak
`CHECK` krever https på endepunkts-URL-en. Loopback (`127.0.0.1`,
`localhost`) er unntatt: trafikken forlater aldri verten, og nyttelasten bærer
uansett ingen personopplysninger. Unntaket finnes fordi integrasjonstesten
skal kunne kjøre mot en EKTE mottaker i stedet for en mock — en webhook-sender
som bare er testet mot en mock, er ikke testet.

## Alternativer vurdert

**Full nyttelast i webhooken.** Enklere for selskapet (ett kall i stedet for
to). Avvist: gjør tilbaketrekk virkningsløst, og legger kundedata i en kø.

**Polling i stedet for webhooks.** Ingen signering, ingen retry-logikk, ingen
utgående kall. Fristende enkelt — og fortsatt mulig, `GET /api/selskap/saker`
finnes. Men et dødsfall bør ikke vente på neste polling-intervall, og et
selskap som poller hvert minutt for å slippe ventetid, belaster oss unødig.
Begge veier er nå åpne.

**mTLS i stedet for API-nøkkel.** Sterkere, og noen innkjøpere vil be om det.
Utsatt: sertifikathåndtering på begge sider er en driftsbyrde vi ikke skal ta
før en kunde faktisk krever det. Nøkkelmodellen står ikke i veien.

## Ikke i denne leveransen
**OIDC/BankID-innlogging.** Selskapets kunder har allerede en identitet hos
selskapet, og bør slippe enda et passord. Det krever en ekte IdP å teste mot,
og bør bygges sammen med den første kunden — ikke gjettes fram i forkant.
Skjemaet står ikke i veien: `brukere` kan få en ekstern-id-kolonne uten at noe
annet endres.

## Bevis
`tests/integrasjon.test.js` — elleve tester. Sju av dem prøver å komme forbi
grensene: uten nøkkel, med tull, med tilbaketrukket nøkkel, inn i et annet
selskaps saker (både via liste og direkte sak-id), inn i en sak som ennå ikke
er frigitt, og forbi et tilbaketrekk. Webhook-testen kjører mot en ekte
HTTP-mottaker og verifiserer HMAC-signaturen mot det som faktisk kom fram.
