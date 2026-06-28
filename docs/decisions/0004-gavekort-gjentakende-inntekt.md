# 0004 — Gavekort som gjentakende inntekt (produktifisering)

- **Status:** Vedtatt (modell), implementeres trinnvis
- **Dato:** 2026-06-26
- **Besluttet av:** CTO-agenten, etter simulert ledergruppevurdering

## Kontekst
Gavekort selges i dag som **sesongbaserte engangsutspill** (sommergaver, julegaver) — i praksis en
kald-pitch hver sesong, manuelt fulgt opp. Det vi så i [helsesjekken](../../analytics/crm-helsesjekk-2026-06-26.md):
ti gavekort-leads (advokat-/konsulentfirma) ble liggende på forfalt oppfølging. Mønsteret er klart:
gavekort er mange, små, **gjentakende** avtaler med høy margin — men de behandles som
engangshendelser. Det taper både omsetning (manglende fornyelse/utvidelse) og tid (alt manuelt).

Strategisk er gavekort vårt **mest skalerbare svinghjul** ([STRATEGY](../STRATEGY.md) tese 2):
lav leveransekostnad, forutsigbart, og det komponerer hvis vi gjør det til en abonnements-/årsmodell
med automatiske sesongtriggere.

## Beslutning
Produktifiser gavekort fra engangssalg til **gjentakende inntekt**, med tre tilbudsformer og en
egen CRM-entitet:

**Tilbudsformer**
1. **Årsavtale** — bedriften setter av et årlig gavekort-budsjett som dekker flere anledninger
   (sommer, jul, bursdager, ansattmilepæler, kundegaver), gjerne med volumrabatt. Gir ARR.
2. **Fast månedlig** — løpende ansattgode (flere leads ba allerede om dette).
3. **Sesong** — klassisk engangskjøp, men nå *fanget* så det automatisk trigges igjen neste sesong.

**Ny CRM-entitet: `Gavekortavtaler`** (følger samme mønster som `Partneravtaler`)
- Felter: Bedrift (lenke), Type (Årsavtale/Månedlig/Sesong), Årlig verdi, Rabatt, Startdato,
  Fornyelsesdato, Status (Prospekt/Aktiv/Pauset/Avsluttet), Ansvarlig, Notater, Fornyelsesvarsel
  (formel — flagger nær/forbi fornyelse).
- Skiller gjentakende gavekort-verdi fra enkeltbookinger i `Avtaler`, og gir **ARR-forecast** og
  **fornyelsesrate** som KPI-er.

**Sesong- og fornyelsestriggere (n8n)**
- Automatiske utkast ved sesongstart (sommer: mai–jun · jul: okt–nov · nyttår/Valentine ved behov)
  til både eksisterende gavekort-kunder (fornyelse/utvidelse) og nye prospekter.
- Fornyelsesvarsel X uker før `Fornyelsesdato` → utkast om forlengelse.
- Eies av [`gavekort-selger`](../../agents/gavekort-selger.md)-agenten.

## Simulert ledergruppevurdering (kort)
- **Head of Sales:** Årsavtaler løfter en transaksjon til et forhold; utvidelse (ansatte→kunder) gir
  mersalg. Klar omsetningsdriver.
- **Operations Manager:** Lav leveransekompleksitet (gavekort er digitalt); triggere fjerner manuelt
  sesongmas. Skalerer godt.
- **AI Systems Engineer:** Perfekt for automatisering — repeterbart, malbart, lavt risiko (utkast).
- **Product Manager:** Tre enkle SKU-er (års/måned/sesong) er nok; ikke overkompliser.
- **Security:** Ingen ny risiko; samme data/tilganger.
- **CTO:** Vedtatt. Start med playbook + prompt + entitet; triggere når dual-write/loop er på plass.

## Konsekvenser
- **Positivt:** forutsigbar ARR, høyere livstidsverdi per konto, mindre manuelt sesongarbeid,
  kryss-salg gavekort↔event↔Amex via [Bedrifter](0003-relasjonell-crm-kjerne.md).
- **Kostnad:** én ny CRM-tabell + en n8n-triggerflyt + agentoppdatering.
- **Avhengighet:** styrkes av relasjonell CRM-kjerne (ADR 0003) — gavekortavtaler kobles til Bedrifter.

## Implementeringstrinn
1. **Nå (repo):** playbook ([`sales/playbook-gavekort.md`](../../sales/playbook-gavekort.md)) +
   årsavtale-prompt ([`prompts/outreach/gavekort-aarsavtale.md`](../../prompts/outreach/gavekort-aarsavtale.md)).
2. **CRM:** opprett `Gavekortavtaler`-tabell (når Airtable-skriving er stabil).
3. **Automasjon:** sesong-/fornyelsestriggere i n8n, eid av gavekort-selger.
4. **KPI:** gavekort-ARR og fornyelsesrate inn i mandagsbriefen/dashbordet.
