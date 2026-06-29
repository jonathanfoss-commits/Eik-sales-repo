# 0005 — Styrings- og målelag (agent-kontrakter, observabilitet, måle-loop)

- **Status:** Vedtatt
- **Dato:** 2026-06-28
- **Besluttet av:** CTO-/COO-agenten, etter simulert ledergruppevurdering

## Kontekst
[STRATEGY.md](../STRATEGY.md) definerer en målarkitektur i fem lag. L1 (kildesystem) og L2
(kunnskap) er reelle i dag; L3 (agent-mesh) finnes som to operative n8n-agenter. Men **L4 —
styring, observabilitet og måling — finnes ikke som noe annet enn en rå `Agentlogg`-tabell.**
Konkret mangler systemet:

- **En måle-loop.** STRATEGY tese 4 kaller utfallsmåling «motoren for komponerende kvalitet», men
  ingen AI-handling kobles i dag til et utfall. Prompter og agenter kan derfor ikke forbedres
  systematisk — de platåer.
- **En loggstandard.** `Agentlogg` fanger «hva skjedde» i fritekst, men ikke modell, tokenforbruk,
  kostnad, latens, konfidens eller beslutningsgrunnlag. Vi kan ikke svare på «hvorfor gjorde agenten
  dette?» eller «hva koster systemet?».
- **Et feil- og eskaleringsspor.** Det finnes ingen taksonomi for feil og ingen definert kø for
  saker som krever menneske. «Trenger menneskelig vurdering» er en enkelt avkrysningsboks uten SLA.
- **Maskinlesbare agent-kontrakter.** Agentene er prosabeskrevet. Ved 10x og flere samarbeidende
  agenter trengs eksplisitt **myndighet, begrensninger, inputs/outputs, verktøy, samarbeidspartnere
  og eskaleringsregler** — ellers blir mesh-et uforutsigbart og utrygt å automatisere videre.

Uten dette laget er systemet en samling dokumenter og skript, ikke et **operativsystem** som lærer
og blir bedre. Dette er den største enkeltstående arkitektursvakheten i dag.

## Beslutning
Innfør et eksplisitt **styrings- og målelag (L4)** som definisjon i repoet, materialisert som data
i Airtable. Tre komponenter:

1. **Agent-kontrakter.** Hver agent får et utvidet, maskinlesbart kontraktsformat (front-matter +
   faste seksjoner): `authority`, `limits`, `inputs`, `outputs`, `tools`, `collaborators`,
   `escalation`, `metrics`. Et **agent-register** ([`agents/README.md`](../../agents/README.md))
   blir én kilde til sannhet for hele mesh-et — også agenter som ennå ikke er bygget, så veikartet
   for organisasjonen er eksplisitt uten tomt stillas.
2. **Observabilitet** ([`observability/`](../../observability/)). En loggstandard som utvider
   `Agentlogg` med modell, tokens, kostnad, latens, konfidens og beslutning; en feiltaksonomi; og en
   eskaleringskø med SLA.
3. **Måle-loop** ([`observability/maaleloop.md`](../../observability/maaleloop.md)). Hver
   utadrettet AI-handling kobles til et **utfall** (sendt/forkastet, svar/ikke svar, vunnet/tapt),
   slik at prompter og agenter scores og forbedres i en fast kadens.

Repoet eier **definisjonen** (skjema, standarder, kontrakter); Airtable eier **dataene** (loggrader,
utfall). Ingen ny infrastruktur — additivt på eksisterende base, jf. skala-prinsipp 1 i STRATEGY.

## Alternativer vurdert
1. **Egen observabilitets-stack (Langfuse/Helicone/OpenTelemetry + tidsseriedatabase).**
   Kraftigst på tokens/kostnad/tracing. **Forkastet nå:** egen drift, ny leverandørlåsing og
   kostnad, og det splitter sannheten fra CRM-et der utfallene faktisk lever. Overkill ved dagens
   volum (prinsipp 9: ikke overengineere). Holdes som opsjon hvis volum/kostnad vokser — loggstandarden
   er bevisst verktøyuavhengig, så en eksport dit senere er en additiv endring, ikke en ombygging.
2. **Bygge alle ~16 agenter i listen som fulle filer nå.** Gir en synlig «organisasjon». **Forkastet:**
   bryter prinsipp 9 (ikke stillas i forkant) og CLAUDE.md («No empty scaffolding»). 14 tomme
   agentfiler er gjeld, ikke verdi — de ville duplisere det Digital Jonathan faktisk gjør, og råtne.
   I stedet: **registeret** definerer hele mesh-et med kontrakt-stubber (ansvar/myndighet/status), og
   vi materialiserer agenter når det finnes reelt arbeid å gi dem.
3. **Holde alt i `Agentlogg` med rikere fritekst, ingen eget lag.** Billigst. **Forkastet:** fritekst
   kan ikke aggregeres → ingen KPI-er, ingen måle-loop, ingen feilrate. Det er nettopp dagens
   blindsone. En lett struktur (faste felt + enum-er) er en liten kostnad for stor sporbarhet.

**Valgt: et definisjons-lag i repoet + lett struktur i Airtable (alternativ utenfor 1–3, syntese).**
Best på enkelhet, leverandøruavhengighet, sporbarhet og «bygg for 10x uten ombygging».

## Konsekvenser
- **Positivt:** Systemet får et nervesystem — det kan måle seg selv, forklare hver handling, fange
  feil og forbedres i en loop. Kontrakter gjør mesh-utvidelse trygg og forutsigbar. Grunnmur for
  KPI-dashboard (L5).
- **Kostnad:** Noen nye felt i `Agentlogg` + to nye Airtable-tabeller (`Utfall`, `Eskaleringer`) som
  må settes opp i UI (API støtter ikke alle felttyper). Agentene må oppdateres til å logge etter
  standarden — gjøres trinnvis.
- **Risiko:** Lav (additivt). Hovedhensyn: ikke gjør logging så tungt at agentene blir trege —
  derfor er kjernen i loggstandarden et lite, fast sett felt, resten valgfritt.
- **Erstatter ikke:** ADR 0003 (relasjonell kjerne) og 0004 (gavekort) — dette laget **måler** dem.
