# Workflow: Ukentlig pipeline-sammendrag

- **Motor:** n8n
- **Status:** utkast (mål: Fase 2)
- **Trigger:** tidsplan — hver mandag kl. 07:00 (Europe/Oslo)
- **Godkjenningsport:** ingen utadrettet handling. Sammendraget leveres kun til Jonathan (e-post
  eller Slack), så ingen kunde berøres. Trygt å kjøre fullautomatisk.

## Mål
Gi Jonathan en kort, prioritert oversikt over pipelinen ved starten av hver uke — med særlig vekt på
avtaler som står fast og forventede signeringer — slik at ingenting glir ut uten oppmerksomhet.

## Steg
1. **Trigger:** tidsplan utløser mandag morgen.
2. **Hent data:** les åpne avtaler fra Airtable-tabellen **Avtaler** (Status `Ny lead` → `Pending`),
   med felt: Tittel, Bedrift, Status, Totalbudsjett, Neste oppfølging, Dato for selskap, Selger.
   Les også avtaler satt til `Bekreftet`/`Gjennomført`/`Tapt` siste 7 dager.
3. **Avled flagg:** marker avtaler uten `Neste oppfølging`, eller med `Neste oppfølging` i fortiden,
   som «står fast».
4. **Generer sammendrag:** kjør [`prompts/reports/ukentlig-pipeline-sammendrag.md`](../prompts/reports/ukentlig-pipeline-sammendrag.md)
   med de hentede dataene.
5. **Lever:** send sammendraget til Jonathan (e-postutkast eller Slack-melding).

## Prompter / agenter som brukes
- Prompt: [`ukentlig-pipeline-sammendrag`](../prompts/reports/ukentlig-pipeline-sammendrag.md)

## Bivirkninger
- **Leser:** Airtable-CRM (Avtaler).
- **Skriver:** kun en intern leveranse til Jonathan (e-post/Slack). Ingen endring i CRM, ingen
  kundekontakt.

## Feilhåndtering
- Er CRM-et utilgjengelig: prøv på nytt med eksponentiell backoff; ved vedvarende feil, varsle
  Jonathan om at sammendraget ikke kunne lages, fremfor å sende et tomt.
- Er det ingen åpne avtaler: send et kort sammendrag som sier nettopp det (ikke hopp over kjøringen).

## Byggesjekkliste (Fase 2)
- [ ] Airtable-lesetilgang til Avtaler koblet.
- [ ] Tidsplan satt til mandag 07:00 Europe/Oslo.
- [ ] «Står fast»-logikken validert mot ekte data.
- [ ] Leveringskanal (e-post/Slack) bekreftet med Jonathan.
