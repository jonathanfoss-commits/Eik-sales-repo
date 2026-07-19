# 01 — Produktkonsept: Lærling

## Problemet

Norske SMB-er vet at AI kan spare dem for timer hver uke, men:

- De vet ikke **hvor de skal begynne** — verktøyjungelen er overveldende.
- Generiske verktøy (ChatGPT, Copilot) krever at *brukeren* finner ut hva de skal brukes til, skriver promptene og husker å bruke dem.
- Konsulenter som bygger skreddersydd automasjon koster 50 000–500 000 kr og leverer noe statisk som forvitrer.
- Nybegynnere gir opp etter to uker fordi ingenting kjører *av seg selv*.

Gapet i markedet: **ingen selger "en AI-ansatt som finner ut av det selv"** til folk uten teknisk kompetanse — som abonnement, ikke prosjekt.

## Løsningen

Lærling er en autonom AI-agent som opptrer som en ny medarbeider i bedriften:

> *"Ansett Lærling. Den bruker første uka på å bli kjent med bedriften din. Deretter begynner den å bygge verktøyene du aldri visste du trengte — og drifter dem for deg."*

### De fire fasene (kjernen i produktet)

**1. Undersøke (dag 1–3)**
- Crawler bedriftens nettside, Google-profil, sosiale medier og offentlige data (Brønnøysundregistrene, Proff).
- Kobler seg (med eksplisitt samtykke, OAuth) til e-post, kalender, regnskap, booking- og fagsystemer.
- Gjennomfører et samtale-intervju med eieren på vanlig norsk: «Hva bruker du mest tid på? Hva utsetter du alltid?»

**2. Lære (dag 3–7)**
- Bygger en **bedriftsprofil**: tjenester, kunder, tone-of-voice, prislogikk, sesongmønstre, flaskehalser.
- Analyserer e-post- og kalendermønstre for å finne repetitive oppgaver (f.eks. «du skriver i praksis samme tilbuds-e-post 14 ganger i måneden»).
- Presenterer en **mulighetsrapport**: «Her er de 5 oppgavene jeg kan ta fra deg, rangert etter timer spart.»

**3. Utvikle (uke 2+)**
- Bygger konkrete verktøy fra en bransjetilpasset malbibliotek + skreddersøm:
  - *Håndverker:* tilbudsgenerator fra befaring-notater, automatisk purring, jobbdokumentasjon.
  - *Klinikk/frisør:* booking-svar, avbestillings-fylling, journalnotat-utkast.
  - *Butikk/netthandel:* produkttekster, kundeservice-svar, lagervarsler.
  - *Regnskap/rådgivning:* bilagspurring, fristvarsler, klientoppsummeringer.
  - *Byrå/kreativ:* brief-til-utkast, statusrapporter, innholdskalender.
- Brukeren godkjenner hvert verktøy med ett klikk — ingen konfigurasjon.

**4. Operere (løpende — dette er abonnementsverdien)**
- Verktøyene kjører automatisk med **godkjenningsporter**: Lærling gjør utkastet, mennesket trykker «send» (til brukeren velger full auto per verktøy).
- Kontinuerlig læring: hver korrigering fra brukeren forbedrer bedriftsprofilen.
- **Ukesrapport**: «Denne uka: 23 e-poster besvart, 4 tilbud sendt, ca. 6,5 timer spart.»
- Foreslår proaktivt nye verktøy etter hvert som den lærer mer.

## Verdiløfte

| For kunden | I stedet for |
|---|---|
| «En AI-ansatt til prisen av en lunsj om dagen» | Konsulentprosjekt til 100 000+ |
| Null teknisk kompetanse nødvendig | Prompte-kurs og verktøyjungel |
| Verdi målt i timer spart, vist hver uke | Abstrakt «AI-strategi» |
| Blir smartere hver måned | Statisk løsning som forvitrer |

## Hvorfor det kan selges som abonnement

1. **Løpende drift** er selve produktet — verktøyene kjører, overvåkes og forbedres kontinuerlig.
2. **Akkumulert læring** gir høy byttekostnad: etter 6 måneder kjenner Lærling bedriften bedre enn noen konkurrent kan.
3. **Timer spart** er målbart og synlig i hver ukesrapport → lav churn, enkel oppsalgslogikk («Lærling har funnet 3 nye oppgaver — oppgrader for å aktivere»).

## Differensiering

- **Zapier/Make:** krever at brukeren designer flyten selv. Lærling designer den.
- **ChatGPT/Copilot:** reaktive verktøy. Lærling er proaktiv og kjører uten input.
- **AI-konsulenter:** engangsleveranse. Lærling er en levende tjeneste med fallende marginalkostnad.
- **Vertikale SaaS (bransjesystemer):** løser én ting per bransje. Lærling er tverrgående og personlig.
