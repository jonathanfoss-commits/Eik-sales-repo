# Datasikkerhet — svar til OP Bygg-ledelsen

Bekymringen er legitim og lett å møte, fordi Lærling er bygget **lokal-først** fra starten.
Her er nøyaktig hvor data bor i dag, og de tre sikkerhetsnivåene fremover.

## Slik er det i piloten (i dag)

| Data | Hvor bor det | Forlater det OP Bygg? |
|---|---|---|
| Utkast, godkjenninger, innstillinger i appen | **Lokalt på Ole Fabians telefon** (localStorage) | Nei — appen har ingen database hos oss |
| Dikteringer og tekster han jobber med | I hans egen Claude-konto | Til Anthropic (se tiltak under), ingen andre |
| Bruksstatistikk (pilotloggen) | Netlify Forms | Kun hendelsestyper («kopierte tilbudsprompt») — **aldri innhold** |
| E-poster han sender | Hans egen Mail-app | Som all annen e-post fra OP Bygg |

Det finnes altså **ingen Lærling-server med OP Byggs data**. Vi kan ikke miste det vi ikke har.

**To tiltak som gjøres i oppsettsmøtet:**
1. I Claude-appen: Innstillinger → Personvern → skru av deling av samtaler til
   modellforbedring (så ingenting brukes til trening).
2. Grunnregel som allerede står i bedriftsprofilen: aldri personnummer, lønn eller
   helseopplysninger inn i diktering — prosjektinfo og firmanavn er OK.

**Anbefalt oppgradering allerede i piloten (Jonathan betaler):** Claude **Team/Work-konto**
i stedet for privat konto — der brukes dataene aldri til trening, og Jonathan får
administratorkontroll. Dette er det enkleste «ja» til sjefen.

## Nivå 2 — Fullversjonen (standard for betalende kunder)

- All kundedata kryptert og logisk isolert per kunde, hostet i **EU/EØS**.
- **Databehandleravtale** (GDPR art. 28) signeres før oppstart.
- AI-kall går via **API med null datalagring** (zero data retention hos Anthropic — data
  brukes aldri til trening og lagres ikke etter behandling).
- Full revisjonslogg: hver handling Lærling gjør kan inspiseres. Angreknapp sletter alt.

## Nivå 3 — «Boksen hos OP Bygg» (lokal lagring hos kunden)

Ja, dette er mulig, og det er et sterkt tilbud til sikkerhetsbevisste kunder:

- En liten maskin (Mac mini / Intel NUC, ~10 000 kr) står **fysisk hos OP Bygg** og kjører
  Lærling-gatewayen: bedriftsprofil, dokumenter, e-postkø og all historikk lagres **kun der**,
  på deres nett, bak deres brannmur.
- Når et utkast skal skrives, sendes bare den konkrete tekstforespørselen kryptert til
  AI-API-et og svaret kommer rett tilbake til boksen — ingenting lagres eksternt.
- OP Bygg kan når som helst trekke ut støpselet — bokstavelig talt.
- Prises som Enterprise-tillegg (f.eks. +2 000 kr/mnd + boksen), og OP Bygg kan få den
  til pilotpris mot at de er utviklingspartner.

**Helt lokal AI** (LLM på boksen, ingenting ut i det hele tatt) er teknisk mulig, men frarådes
i pilot: kvalitetsfallet på norsk fagspråk er merkbart. Tilbys som opsjon senere for kunder
med absolutte krav.

## Anbefalt svar til sjefen (kortversjon)

> «I testperioden lagres alt lokalt på Ole Fabians telefon og i en Claude-konto med trening
> avskrudd — det finnes ingen server med deres data. Blir dere med videre som
> utviklingspartner, får dere databehandleravtale, EU-lagring med null datalagring hos
> AI-leverandøren — og hvis dere vil: en boks som står fysisk hos dere, slik at
> bedriftsdataene aldri forlater huset.»
