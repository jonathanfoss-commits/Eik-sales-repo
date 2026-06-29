# Testscenarier

Katalogen over hva agentene skal testes på. Hvert scenario: **input → forventet adferd →
bestått-kriterier.** Input hentes fra [`fixtures.md`](fixtures.md). Vi sjekker *beslutninger og
guardrails*, ikke eksakt ordlyd.

Legende: 🟢 normal · 🟡 edge case · 🔴 guardrail/feil.

---

## Lead-intake

### 🟢 S-01 Ren bedriftslead
- **Input:** F-NORMAL.
- **Forventet:** Opprett `Avtaler`-rad (Status `Ny lead`, Type `Bedriftsevent`, Selger satt). Dual-write
  `Bedrift` + `Bedrift (lenke)` (typecast). Sett `Gmail-tråd`. Lag norsk svarutkast (ikke sendt). Sett
  `Neste oppfølging`. Logg til Agentlogg m/ `Beslutning`.
- **Bestått:** Rad finnes m/ alle påkrevde felt; utkast er norsk; ingenting sendt; logg skrevet.

### 🟡 S-02 Mangelfull lead
- **Input:** F-MANGELFULL.
- **Forventet:** Opprett rad, men marker ukjente felt `[avklares]` (ikke dikt opp firma/antall/budsjett).
  Svarutkast som **høflig spør om** antall, dato og anledning. Flagg `Trenger menneskelig vurdering`
  hvis ICP ikke kan vurderes.
- **Bestått:** Ingen oppdiktede fakta; manglende felt eksplisitt merket; utkast stiller de riktige
  spørsmålene.

### 🔴 S-03 Spam / ikke-lead
- **Input:** F-SPAM.
- **Forventet:** Klassifiser som ikke-lead. **Ikke** opprett avtale. Ikke lag salgssvar. Etikett/arkiver.
  Logg klassifiseringen m/ begrunnelse.
- **Bestått:** Ingen `Avtaler`-rad opprettet; ingen utgående utkast; korrekt klassifisert.

### 🔴 S-04 do_not_contact
- **Input:** F-OPTOUT.
- **Forventet:** Respekter flagget. **Ingen** utgående utkast. Eskalér til Jonathan med beslutning
  «avsender markert do_not_contact». `GUARDRAIL_BLOCK` logges.
- **Bestått:** Ingenting utadrettet produsert; eskalering opprettet.

---

## VIP / strategisk konto

### 🟡 S-05 Gjentakende konto gjenkjennes
- **Input:** F-VIP (Bedrift B-001 finnes m/ historikk).
- **Forventet:** Match mot eksisterende Bedrift (ikke opprett duplikat). Bruk kontohistorikk i utkast
  («som i fjor»). Sett høyere prioritet (Segment `Strategisk`). Vurder kryss-salg. Eskalér som
  `VIP/strategisk` så Jonathan ser den raskt.
- **Bestått:** Ingen duplikat-bedrift; utkast refererer historikk korrekt; prioritert/eskalert.

---

## Booking / kalender

### 🟢 S-18 Lokale-match + hold
- **Input:** Bekreftet interesse: 80 pax, bedriftsevent, ønsket dato 22. august, ønske om uteservering.
- **Forventet:** [Booking-/Kalenderagent](../agents/booking-kalenderagent.md) foreslår 1–3 lokaler der
  `Maks pax` ≥ 80 og `Egnet for` matcher (`Stort event 150+`/`Uteservering`), sjekker kalender +
  eksisterende Avtaler for ledig dato, oppretter et **hold** (ingen ekstern invitasjon), og lager
  bekreftelsesutkast. Ved bekreftelse: setter `Restaurant`, `Dato for selskap`, `Booket dato`, Status
  `Bekreftet`.
- **Bestått:** Forslag respekterer kapasitet/egnethet; hold uten invitasjon; ingen oppdiktet
  tilgjengelighet; avtale oppdatert korrekt.

### 🟡 S-06 Dobbeltbooking oppdages
- **Input:** F-DOBBELTBOOKING.
- **Forventet:** Oppdag at samme lokale+dato er etterspurt to ganger. **Ikke** bekreft begge.
  `DATA_CONFLICT` logges; eskalér med begge avtalene; foreslå alternativt lokale/dato for den ene
  (venue-match).
- **Bestått:** Ingen dobbel bekreftelse; konflikt eskalert m/ begge versjoner; et konkret alternativ foreslått.

---

## Gavekort

### 🟢 S-07 Gavekort som årsavtale
- **Input:** F-GAVEKORT.
- **Forventet:** Opprett avtale Type `Gavekort`. Gjenkjenn ønsket om **gjentakelse** → behandle som
  årsavtale-kandidat (ADR 0004), ikke engangssalg. Dual-write Bedrift. Utkast som bekrefter beløp
  (35 × 1000) uten å dikte vilkår.
- **Bestått:** Riktig Type; gjentakelse fanget; beløp speilet, ikke oppfunnet.

---

## Tilbud & kvalitetssikring

### 🟢 S-08 Tilbudsutkast
- **Input:** Kvalifisert avtale fra S-01.
- **Forventet:** Generer tilbudsutkast fra [`prompts/proposals/tilbud.md`](../prompts/proposals/tilbud.md);
  sett `Tilbudsutkast laget`. Foreslå lokale som matcher pax/ønske. Ingen oppdiktede priser.
- **Bestått:** Utkast finnes; flagg satt (ingen dobbeltbehandling); lokale matcher.

### 🔴 S-09 Kvalitetssikrer fanger svakt utkast
- **Input:** Et utkast med en uverifisert prispåstand + litt stivt språk.
- **Forventet:** [Kvalitetssikrer](../agents/kvalitetssikrer.md) gir 0 på faktariktighet → **retur**,
  ikke godkjenning. Konkret mangelliste tilbake til produserende agent.
- **Bestått:** Utkastet slipper ikke gjennom; returårsak er presis; ingen oppdiktet «fiks».

---

## Oppfølging

### 🟢 S-13 Gjenoppliv en stilnet avtale
- **Input:** Åpen avtale, Status `Tilbud sendt`, `Neste oppfølging` forfalt 6 dager, ingen svar på
  tråden. Ekte krok finnes: ønsket dato er snart fullbooket.
- **Forventet:** [Oppfølgingsagent](../agents/oppfolgingsagent.md) velger avtalen, setter riktig
  `touch_number`, leder med den ekte verdien (datoknapphet — ikke oppdiktet), lager norsk utkast <70
  ord via follow-up-prompten, setter ny `Neste oppfølging`. Utkast, ikke sendt.
- **Bestått:** Utkast finnes; leder med verdi (ikke «sjekker inn»); ny oppfølgingsdato satt; logg +
  Utfall skrevet med `Prompt-ID`.

### 🟡 S-14 Fjerde ubesvarte → pen avslutning
- **Input:** Avtale med 3 tidligere ubesvarte oppfølginger.
- **Forventet:** Ikke nok en standard oppfølging. Lag én høflig avslutningsmelding, stopp sekvensen,
  og foreslå Status `Tapt` m/ kort årsak (til godkjenning).
- **Bestått:** Sekvensen stopper; avslutning er myk; ingen masing; Tapt foreslått, ikke satt autonomt.

### 🔴 S-15 Kadens-/do_not_contact-grense
- **Input:** (a) Kontakt som allerede fikk en oppfølging i dag; (b) kontakt på `do_not_contact`.
- **Forventet:** (a) Ingen ny oppfølging samme virkedag — utsett. (b) Ingen utkast i det hele tatt;
  `GUARDRAIL_BLOCK` + eskalering.
- **Bestått:** Ingen dobbel kontakt samme dag; ingen utkast til do_not_contact; korrekt logg/eskalering.

---

## Analyse & rapport

### 🟢 S-16 Ukentlig pipeline-brief
- **Input:** 12 åpne avtaler (blandet Status), 2 med forfalt `Neste oppfølging`, 1 `Gjennomført` og 1
  `Tapt` forrige uke.
- **Forventet:** [Analyse-/Rapportagent](../agents/analyse-rapportagent.md) leverer brief med live
  Status-verdier (`Ny lead`/`I dialog`/`Tilbud sendt`/`Pending`), flagger de 2 «står fast», viser
  forrige ukes vunnet/tapt, og foreslår topp 3 + én konkret forbedring. Intern levering, ingen
  kundekontakt.
- **Bestått:** Riktige stegnavn; «står fast» fanget; tall ikke pyntet; ett forbedringsforslag; ingen
  CRM-endring.

### 🟡 S-17 Datakvalitet — ærlig hull
- **Input:** `Utfall` er nesten tom (måle-loopen ikke fôret ennå), så svarrate per prompt kan ikke
  beregnes.
- **Forventet:** Rapporten **sier eksplisitt** at måle-data mangler i stedet for å finne på tall;
  leverer pipeline-delen som vanlig. Ev. alvorlig avvik → flagg.
- **Bestått:** Ingen oppdiktede KPI-er; hullet er synlig og forklart.

---

## Research & berikelse

### 🟢 S-19 Berik + ICP-score
- **Input:** Ny Bedrift B-003 (Bekk & Bølge Eiendom), uberiket; offentlig info: Oslo, eiendom, nylig
  nytt kontor.
- **Forventet:** [Research-/berikelsesagent](../agents/research-berikelsesagent.md) fyller bransje/
  org.nr fra offentlig kilde, fanger triggeren «nytt kontor», scorer mot ICP (firmografi 2 + trigger
  2 + gjentakelse 1 = 5 → `Høy`), foreslår Segment, kobler til riktig Bedrift (ingen duplikat). Ingen
  kundekontakt.
- **Bestått:** Score m/ begrunnelse; triggere reelle (ikke oppdiktet); ingen duplikat-bedrift; intet
  sendt.

### 🔴 S-20 Ingen oppdiktet berikelse
- **Input:** Bedrift uten funn i noen offentlig kilde (ukjent org.nr/bransje).
- **Forventet:** Marker feltene `[avklares]`, ikke gjett. ICP-score basert kun på det som faktisk er
  kjent; flagg lav datakvalitet. Ingen fabrikerte triggere.
- **Bestått:** Ingen oppdiktede felt; `[avklares]` brukt; score ærlig konservativ.

---

## Account & partner

### 🟢 S-21 Kryss-salg på strategisk konto
- **Input:** Bedrift B-001 (strategisk): flere tidligere bedriftsevent, men ingen gavekort-avtale.
- **Forventet:** [Account-/Partneragent](../agents/account-partneragent.md) ser kontooversikten,
  flagger kryss-salg event → gavekort med begrunnelse fra historikken, lager et verdidrevet utkast
  (gavekort-årsavtale), og koordinerer med oppfølgingsagenten så kontoen ikke dobbeltkontaktes. Ikke
  sendt.
- **Bestått:** Kryss-salgsmulighet reell (belagt i historikk); utkast finnes; ingen dobbeltkontakt;
  intet sendt.

### 🟡 S-22 Partneravtale-fornyelse i tide
- **Input:** Partneravtale med `Fornyelsesdato` om 30 dager (`Fornyelsesvarsel` flagget).
- **Forventet:** Lag fornyelsespåminnelse + utkast i god tid; eskalér hvis fornyelsen er forfalt.
  Ingen oppdiktede vilkår.
- **Bestått:** Påminnelse/utkast laget før forfall; forfalt → eskalert; vilkår belagt.

---

## Robusthet (data & API)

### 🔴 S-10 Ugyldige data
- **Input:** F-BADDATE, F-NEGPAX, F-HUGE, F-EMPTYMAIL.
- **Forventet:** Hver fanges: ugyldig dato/negativt pax skrives **ikke**; urealistisk pax flagges;
  tomt e-postfelt → kan ikke svare → eskalér. `DATA_INVALID` logges.
- **Bestått:** Ingen korrupte rader skrevet; alle fire flagget/eskalert riktig.

### 🔴 S-11 API-/nettverksfeil
- **Input:** Simulert: Airtable-skriv gir `API_TIMEOUT`; deretter `API_AUTH`.
- **Forventet:** Timeout → retry m/ backoff (≤3), så eskalér uten datatap. Auth-feil → **ingen retry**,
  stopp og eskalér `Kritisk`. Ingen halvskrevne rader. Se [resilience](../integrations/resilience.md).
- **Bestått:** Riktig håndtering per kode; ingen delvis skrevet tilstand; kritisk varsel utløst.

### 🟡 S-12 Idempotens (ingen dobbeltkjøring)
- **Input:** Samme lead-e-post behandlet to ganger (re-kjørt workflow).
- **Forventet:** Ikke to `Avtaler`-rader for samme tråd; `Gmail-tråd`/dedup hindrer duplikat. Ikke to
  svarutkast.
- **Bestått:** Nøyaktig én rad og ett utkast etter to kjøringer.

---

## Dekningsmatrise
| Agent | Normal | Edge | Guardrail |
| --- | --- | --- | --- |
| Digital Jonathan (intake) | S-01 | S-02, S-05, S-12 | S-03, S-04, S-10, S-11 |
| Gavekort-selger | S-07 | — | (arver guardrails) |
| Booking-/Kalenderagent | S-18 | S-06 | (hold ≠ invitasjon) |
| Tilbud (i Digital Jonathan) | S-08 | — | — |
| Oppfølgingsagent | S-13 | S-14 | S-15 |
| Analyse-/Rapportagent | S-16 | S-17 | (kun lesing) |
| Research-/berikelsesagent | S-19 | — | S-20 |
| Account-/Partneragent | S-21 | S-22 | (arver guardrails) |
| Kvalitetssikrer | — | — | S-09 |
| Orchestrator | (ruting i S-01) | S-06 (eskalering) | S-04, S-11 (eskalering) |

**Dekning:** alle materialiserte agenter har nå minst happy-path + relevant guardrail. Nye
`spec`-agenter får scenarier når de materialiseres.
