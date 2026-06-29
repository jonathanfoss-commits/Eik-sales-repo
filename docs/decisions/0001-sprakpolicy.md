# 0001 — Norsk (bokmål) som standardspråk

- **Status:** Vedtatt
- **Dato:** 2026-06-26
- **Besluttet av:** Jonathan Foss (eier), iverksatt av CTO-agenten

## Kontekst
Eik & Friends er en norsk virksomhet. Jonathans daglige arbeid foregår nesten utelukkende på
norsk: e-post, tilbud, forhandlinger, kundedialog og interne notater. Den første versjonen av
dette repoet ble bygget med engelsk som standard og norske varianter med `.no`-suffiks. Det er feil
prioritering for en norsk hverdag — det skaper friksjon og gjør at det norske (det viktigste)
føles sekundært.

## Beslutning
**Norsk (bokmål) er standardspråket i Eik Sales OS.** Alt som er rettet mot Jonathan eller mot
kunder/partnere skrives på naturlig norsk som standard:

- Brukervendt tekst, e-postmaler, prompter, rapporter og AI-output.
- Dokumentasjon ment for Jonathan (README, veikart, salgsplaybooks, ICP, ordliste).
- CRM-ets **synlige feltnavn** (Airtable-feltnavn) og utvalgsverdier.

**Engelsk beholdes kun der det følger bransjestandard for teknisk implementasjon:**

- Kode, API-er, variabelnavn og felt-*identifikatorer* (`snake_case`, f.eks. `expected_close_date`).
- Stabile `id`-er, enum-nøkler og filnavn (`kebab-case`).
- Dyp teknisk utviklerdokumentasjon (arkitektur-internas, kodestandard) kan være på engelsk, men
  bør ha et norsk sammendrag der Jonathan har nytte av det.

### Praktiske regler
- **Prompter:** standardfil (uten suffiks) er norsk. Engelsk variant, der den trengs for
  internasjonale mottakere, får `.en.md`-suffiks.
- **To språk koster vedlikehold.** Vi lager engelsk variant kun når det finnes et reelt behov
  (typisk utgående salg mot internasjonale kunder). Interne prompter lages kun på norsk.
- **Feltidentifikatorer forblir engelske** for å følge teknisk standard og holde integrasjoner
  robuste; det er kun den synlige etiketten som er norsk. Koblingen dokumenteres i CRM-modellen.

## Alternativer vurdert
1. **Beholde engelsk standard + `.no`-varianter** (status quo). Forkastet: feil prioritering for en
   norsk virksomhet; det viktigste språket blir andrerangs.
2. **Alt på norsk, inkludert feltidentifikatorer og kode.** Forkastet: bryter med teknisk
   bransjestandard, gjør integrasjoner (Notion/n8n/API-er) mer skjøre og mindre gjenkjennelige for
   utviklere/agenter.
3. **Tospråklig overalt.** Forkastet: dobbelt vedlikehold på alt er teknisk gjeld vi ikke vil ta
   (jf. [PRINCIPLES](../PRINCIPLES.md) — gjenbruk fremfor duplikering).

## Konsekvenser
- **Positivt:** systemet matcher Jonathans faktiske hverdag; mindre friksjon; output er klar til
  bruk uten oversettelse.
- **Positivt:** tydelig, dokumentert skille mellom *forretningsspråk* (norsk) og *teknisk språk*
  (engelsk) gjør fremtidige valg enkle.
- **Kostnad (engangs):** eksisterende engelske prompter snus til norsk standard; lenker og
  front-matter oppdateres. Utført i samme endring som denne ADR-en.
- **Fremover:** nye brukervendte filer skrives på norsk med mindre det finnes en klar teknisk grunn
  til engelsk. Kodestandard og navnekonvensjoner oppdateres for å reflektere dette.
