# 0003 — Relasjonell CRM-kjerne med Bedrifter som navet

- **Status:** Vedtatt — struktur + backfill utført; rollups/visninger gjenstår
- **Dato:** 2026-06-26
- **Besluttet av:** CTO-agenten, etter simulert ledergruppevurdering

## Kontekst
Dagens CRM er **avtale-sentrisk**: tabellen `Avtaler` har «Bedrift» som *fritekst*. Samme kunde
opptrer i mange rader uten å være koblet sammen (PwC, American Express/GCSG, AkerBP, Krogsveen,
ABG Sundal Collier m.fl. går igjen). Konsekvenser ved 10x:
- Ingen kontooversikt: vi ser ikke en bedrifts samlede verdi, historikk eller gjentakelsesrate.
- Ingen kryss-salg: event-kunder kobles ikke til gavekort/Amex-potensial.
- Skjør analyse: fritekst gir duplikater og umulig aggregering.

Relasjonsbygging og account-based selling — kjernen i Jonathans arbeid — er i praksis blind.

## Beslutning
Innfør **Bedrifter** som kjerneentitet i Airtable-basen, og gjør CRM-et relasjonelt:

```
Bedrifter (ny)  1───*  Kontakter (ny/utvidet)
     │  1                     │
     │                        *
     *                     Avtaler  *───1  (Selger)
  Gavekortavtaler (ny)        │
                              *
                       Interaksjoner (ny — berøringshistorikk)
```

- **Bedrifter:** Navn, Org.nr, Bransje, Segment (Strategisk/Vekst/Standard), Relasjonseier,
  rollups (samlet verdi, antall avtaler, vunnet-rate, siste kontakt, gjentakende?).
- **Avtaler** får et **lenkefelt `Bedrift (lenke)`** til Bedrifter — *i tillegg til* dagens
  fritekstfelt (additivt, ingen sletting).
- **Interaksjoner** (senere): hver e-post/møte/samtale som rad — gir ekte berøringshistorikk og
  mat til måle-loopen.
- **Gavekortavtaler** (senere): gjentakende gavekort-/årsavtaler skilt fra enkeltbookinger
  (jf. [STRATEGY](../STRATEGY.md) tese 2).

## Simulert ledergruppevurdering
| Rolle | Vurdering |
| --- | --- |
| **CTO** | Riktig fundament for alt videre (analyse, agenter, prediksjon). Gjør additivt og reversibelt. |
| **Senior Architect** | Behold fritekstfeltet i en overgangsfase (dual-write). Lenkefelt + rollups gir aggregering uten ny infrastruktur. Lav koblingsrisiko. |
| **AI Systems Engineer** | Lenker gir agentene kontotrådt kontekst («dette er 4. avtale med PwC») — bedre personalisering og kryss-salg. |
| **Security Engineer** | Ingen ny dataeksponering; samme base og tilgangsmodell. Org.nr er offentlig. Ingen risiko. |
| **Head of Sales** | Endelig én kontooversikt: livstidsverdi, gjentakelse, kryss-salg event↔gavekort↔Amex. Direkte omsetningsdriver. |
| **Operations Manager** | n8n-agentene skriver i dag *fritekst* «Bedrift». Må ikke brytes: behold feltet, og la agentene **dual-write** lenken fremover. Backfill kjøres kontrollert. |
| **Product Manager** | Faseinndel: (1) struktur, (2) backfill av bedriftskontoer, (3) agent dual-write, (4) rollups/visninger. Privatkunder trenger ikke Bedrift-rad. |

**Konklusjon:** Fordelene (relasjonsintelligens, kryss-salg, skalerbar analyse) er store og direkte
koblet til omsetning; risikoen er lav fordi endringen er additiv og reversibel. Vedtatt.

## Migreringsplan (faser)
1. **Struktur** ✅ (utført 26.06.2026): `Bedrifter`-tabell (`tblta9yg4zK7Uzzxi`) + lenkefeltet
   `Bedrift (lenke)` (`fldDNx9qG041noBzh`) på Avtaler opprettet. Fritekstfeltet beholdt.
   *(Reversibelt: kan slettes uten datatap i eksisterende felt.)*
2. **Backfill** ✅ (utført 28.06.2026) — *metoden ble forbedret*: i stedet for å opprette Bedrifter
   manuelt og spore id-er, brukte vi Airtables **`typecast`** ved oppdatering av lenkefeltet med
   bedriftsnavnet som streng — Airtable oppretter/matcher Bedrift-raden automatisk på navn
   (auto-dedup). **Resultat: 57 Bedrifter opprettet, 93 bedriftsavtaler lenket.** Toppkontoer:
   American Express (12 avtaler), Krogsveen Årvoll (7), PwC/Akademikerne/Circle K/Oslo Elektriske (3).
   Privatkunder forble ulenket (korrekt). Fritekstfeltet er beholdt uendret.
   *Læring: store skrivekall (~48 rader) feilet på MCP-permission-strømmen; batcher på ~10 (gjerne
   parallelt) var stabile.*
3. **Dual-write:** oppdater [`digital-jonathan`](../../agents/digital-jonathan.md) og
   [`gavekort-selger`](../../agents/gavekort-selger.md) til å sette *både* fritekst og lenke ved nye
   leads, og opprette Bedrift-rad om den mangler.
4. **Segmentering** ✅ (28.06.2026): de 17 gjentakende kontoene (2+ avtaler) er satt til
   `Segment = Strategisk`. Resten står åpne til manuell vurdering.
5. **Rollups & visninger** — *må settes opp i Airtable-UI* (API-en støtter ikke rollup-felt). På
   Bedrifter, legg til rollup over `Avtaler`-lenken:
   - **Samlet verdi** = SUM(`Totalbudsjett`)
   - **Antall avtaler** = COUNT
   - **Vunnet verdi** = SUM(`Totalbudsjett`) med betingelse `Status = Gjennomført`
   - **Siste kontakt** = MAX(`Dato for selskap`)
   Lag deretter en visning **«Strategiske kontoer»** filtrert på `Segment = Strategisk`, sortert på
   Samlet verdi. *(2 min i UI.)*
6. **Avvikling (valgfritt, senere):** når dual-write er stabil, gjør lenken til primær og faser ut
   fritekstfeltet.

## Konsekvenser
- **Positivt:** kontobasert salg, kryss-salg, skalerbar analyse, bedre AI-personalisering.
- **Kostnad:** en kontrollert backfill + en liten oppdatering av agentene.
- **Risiko:** lav (additivt). Hovedhensyn: ikke bryt n8n-intake — derfor dual-write fremfor å fjerne
  fritekstfeltet nå.
