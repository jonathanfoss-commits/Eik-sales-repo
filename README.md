# Eik Sales OS

> Den sentrale hjernen i AI-økosystemet til **Jonathan Foss**, Sales Manager i **Eik & Friends** (Norge).

Dette repoet er et **AI-operativsystem** for salget i Eik & Friends — et **restaurantkollektiv**
med ~22 spisesteder i Oslo-området. Det er ikke en applikasjon du kjører — det er en strukturert,
versjonskontrollert kunnskapsbase som AI-agenter (Claude, ChatGPT) og automatiseringen i **n8n**
leser fra og skriver til for å gjøre ekte salgsarbeid: prospektering, henvendelser, oppfølging,
tilbud, forhandling, partnerutvikling og rapportering. Det levende CRM-et er en **Airtable**-base;
dette repoet er «hjernen» som dokumenterer og styrer hvordan arbeidet gjøres
([ADR 0002](docs/decisions/0002-faktisk-systemarkitektur.md)).

Den bærende idéen: **alt som gjør Jonathan god på salg skal ligge her som gjenbrukbare,
sammensettbare og dokumenterte byggeklosser** — slik at både mennesker og AI-agenter kan forstå
arbeidet, gjenta det og forbedre det over tid.

> **Språk:** Norsk (bokmål) er standardspråket. Forretnings- og brukervendt innhold skrives på
> norsk; teknisk implementasjon (kode, identifikatorer) er på engelsk der det følger bransjestandard.
> Se [ADR 0001](docs/decisions/0001-sprakpolicy.md).

---

## Hva repoet inneholder

| Modul | Formål |
| --- | --- |
| [`agents/`](agents/) | Definisjoner av AI-agenter (rolle, instruksjoner, verktøy, sikkerhetsgjerder). |
| [`prompts/`](prompts/) | Gjenbrukbart, utprøvd promptbibliotek for salgsoppgaver. |
| [`templates/`](templates/) | Gjenbrukbare dokumentmaler (tilbud, e-postsignatur). |
| [`sales/`](sales/) | Salgs-playbooks: ICP, metodikk, arrangements- og partnerprosesser. |
| [`crm/`](crm/) | Dokumentasjon av det levende **Airtable**-CRM-et (tabeller, felter, pipeline). |
| [`integrations/`](integrations/) | Hvordan systemet kobler seg til Gmail, Kalender, Notion, Drive m.m. |
| [`workflows/`](workflows/) | Automatiseringer (n8n, Zapier) og dokumentasjonen av dem. |
| [`config/`](config/) | Konfigurasjonskonvensjoner, miljø og delte innstillinger. |
| [`docs/`](docs/) | Arkitektur, veikart, prinsipper og standarder for bidragsytere. |

> Mapper opprettes bare når de har reelt, nyttig innhold. Vi vokser strukturen etter behov — aldri
> tomt stillas.

---

## Kom i gang

- **Skal du bruke systemet i salgshverdagen?** Start med
  [`docs/bruk.md`](docs/bruk.md) — situasjon → riktig ressurs, uten teknisk oppsett.
- **Vil du forstå hvordan systemet er bygd?**
  1. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — hvordan delene henger sammen.
  2. [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md) — *hvordan* vi bygger her.
  3. [`prompts/`](prompts/) — ferdige salgsprompter.
  4. [`docs/SETUP.md`](docs/SETUP.md) — koble til verktøyene dine.

> Merk: De dype tekniske dokumentene (arkitektur, prinsipper, kodestandard) er på engelsk fordi de
> primært er for AI-agenter og fremtidige utviklere. Alt forretningsvendt — denne README-en,
> veikartet, salgs-playbooks og prompter — er på norsk.

## For AI-agenter

Er du en AI-agent som jobber i dette repoet, start med
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) og [`docs/PRINCIPLES.md`](docs/PRINCIPLES.md), og last
deretter `README.md` for den relevante modulen før du handler. Hver modul dokumenterer sine egne
konvensjoner.

---

## Status

**Repoet er tilpasset det levende systemet.** CRM-dokumentasjonen speiler Airtable-basen, norsk er
standardspråk, og integrasjonene (Airtable, Gmail, Kalender, Drive) er aktive. Se
[`docs/ROADMAP.md`](docs/ROADMAP.md) for neste steg.
