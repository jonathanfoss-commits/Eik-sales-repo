# Teknologistrategi — Eik Sales OS

> CTO-dokument. Nordstjernen for hvordan dette systemet skal bli en **varig konkurransefordel** for
> Eik & Friends de neste fem årene — ikke bare en samling skript og mapper. Leses sammen med
> [ARCHITECTURE.md](ARCHITECTURE.md) (hvordan det er bygd i dag) og [ROADMAP.md](ROADMAP.md)
> (rekkefølge). Større beslutninger forankres som ADR-er i [`decisions/`](decisions/).

## Premisset: bygg for 10x, ikke for i dag
Anta at systemet om to år håndterer **10x kunder, salgsmuligheter, automatiseringer og data**, med
flere AI-agenter som samarbeider. Da må arkitekturen tåle vekst uten ombygging. Dagens system er
**transaksjons-drevet og reaktivt** (det svarer på innkommende og kjører engangsutspill). For å skalere
må det bli **relasjons-drevet, målbart og proaktivt**.

## Fem strategiske teser (spesifikke for Eik & Friends)

### 1. Relasjon slår transaksjon
Dagens CRM er avtale-sentrisk (`Avtaler` med fritekst «Bedrift»). De mest verdifulle eiendelene —
**bedriftsrelasjonene** — er usynlige. PwC, AkerBP, Krogsveen og American Express går igjen, men
systemet ser dem som løsrevne rader. **Bedrifter må bli kjerneentiteten**, med livstidsverdi,
relasjonseier og et kryss-salgs-kart (event → gavekort → Amex). *Moat:* ingen konkurrent har en samlet
kontooversikt på tvers av 22 lokaler.

### 2. Gavekort er et gjentakende-inntekts-svinghjul
Gavekort selges i dag som sesongbaserte engangsutspill. Produktifisert som **årsavtaler/abonnement med
automatiske sesongtriggere** blir det den mest skalerbare, høymarginlinjen vi har — og den komponerer
over tid. Dette er den raskeste veien til forutsigbar omsetning.

### 3. Venue-matching er en forsvarbar AI-kapabilitet
22+ lokaler × arrangementstype × kapasitet × sesong er et **anbefalingsproblem** AI kan eie:
tilbud på minutter, optimal kapasitetsutnyttelse på tvers av porteføljen. Enkeltlokaler og generiske
eventbyråer kan ikke kopiere porteføljedataene. [`sales/lokaler.md`](../sales/lokaler.md) er
råmaterialet; neste steg er en matchemodell.

### 4. Måle-loopen er motoren for komponerende kvalitet
Uten utfallsmåling platåer AI-en. Med den komponerer den. Hver AI-handling (utkast, tilbud) skal kobles
til et **utfall** (vunnet/tapt, svarrate), slik at prompter og agenter forbedres systematisk. Dette er
i seg selv en moat: konkurrenter uten data-loopen blir stående stille mens vårt system blir bedre for
hver uke.

### 5. Fra én monolitt til et styrt agent-mesh
«Digital Jonathan» gjør alt i dag. Ved 10x trengs **spesialiserte agenter** (intake, research/berikelse,
outreach, tilbud, oppfølging, account management, gavekort-fornyelse) som deler CRM-tilstand og et
kunnskapslag — med et **orkestrerings- og styringslag** (guardrails, eskalering, observabilitet).

## Målarkitektur (fem lag)
```
L5  Grensesnitt      Dashboard (KPI) · Gmail · Kalender · Slack   ← menneskelige berøringspunkter
L4  Styring          Agentlogg→metrikker · eskaleringskø · guardrails · evaluering/måling
L3  Agent-mesh       intake · research · outreach · tilbud · oppfølging · account · gavekort
                     + orkestrator (kjører i n8n, delt tilstand via Airtable)
L2  Kunnskapslag     lokaler · menyer · priser · playbooks · utfall fra tidligere avtaler (RAG-klart)
L1  Kildesystem      Airtable (relasjonelt CRM): Bedrifter↔Kontakter↔Avtaler↔Interaksjoner
                     · Venues · Partneravtaler · Kampanjer · Gavekortavtaler · Agentlogg
```
Repoet (GitHub) er **definisjons- og styringslaget** for L2–L4: skjema, prompter, agent-spesifikasjoner,
arbeidsflyter og beslutninger. Levende data bor i L1.

## KPI-rammeverk (det vi styrer etter)
| Område | Nøkkeltall |
| --- | --- |
| Omsetning | Vektet pipeline-verdi · vunnet-rate per linje (event/privat/gavekort/Amex) · snittavtale |
| Gjentakelse | Andel gjentakende bedrifter · gavekort årlig gjentakende verdi (ARR) · kontoens livstidsverdi |
| Effektivitet | Spart tid (auto-genererte utkast) · AI-utkast → sendt-rate · ledetid lead→tilbud |
| Kvalitet | Svarrate per prompt/segment · tilbud→vunnet-rate · andel avtaler med fersk oppfølging |
| Drift | Forfalte oppfølginger (skal mot 0) · agent-feilrate · saker som krever menneske |

## Sekvensert plan (folder inn i veikartet)
- **Nå → Q3:** Relasjonell CRM-kjerne (Bedrifter) · måle-felter (utfall) · gavekort-produktifisering.
  Se [ADR 0003](decisions/0003-relasjonell-crm-kjerne.md).
- **Q4:** Agent-mesh-refaktor + kunnskapslag (RAG-klart) + observabilitet på Agentlogg.
- **År 2:** Prediktivt — lead-scoring, fornyelses-/churn-varsling for gavekort, venue-optimalisering.

## Prinsipper for skalavalg
1. **Additivt og reversibelt før destruktivt.** Nye entiteter/felt legges til ved siden av; vi river
   ikke ned det n8n-agentene er avhengige av uten en migreringsplan.
2. **Kontrakter, ikke punkt-til-punkt.** Integrasjoner og agenter forholder seg til dokumenterte
   skjemaer/grensesnitt, ikke til hverandres innmat — så vi kan bytte deler uten å bryte helheten.
3. **Måling fra dag én.** Ingen ny agent eller prompt uten et definert utfall vi kan spore.
4. **Menneske-i-løkken der det betyr noe, full autonomi der det er trygt.** Ren datahygiene kan være
   autonom; alt utadrettet er utkast til godkjenning.
5. **Bygg det en erfaren CTO ville stå inne for om fem år** — robust, modulært, enkelt å videreutvikle.
