# Robusthet: feil-, fallback- og backup-strategi

Hva systemet gjør **når noe går galt** — og hvordan vi unngår å miste data. Et operativsystem måles
ikke på godværsdager, men på hvordan det feiler. Forankret i
[ADR 0005](../docs/decisions/0005-styrings-og-maalelag.md); feilkodene er definert i
[loggstandarden](../observability/logging-standard.md#feiltaksonomi).

> **Grunnregel: fail safe, ikke fail silent.** Ved tvil gjør agenten *ingenting utadrettet*, skriver
> ingen halvferdig tilstand, og eskalerer. En tapt automatisering er et irritasjonsmoment; en feil
> sendt e-post eller en korrupt CRM-rad er en skade.

## Feilhåndtering per feilkode
| Kode | Hva agenten gjør | Hvorfor |
| --- | --- | --- |
| `API_TIMEOUT` | Retry 3x m/ eksponentiell backoff (2s, 4s, 8s). Fortsatt feil → eskalér, ingen datatap. | Forbigående; backoff unngår å gjøre vondt verre. |
| `API_AUTH` | **Ingen retry.** Stopp berørt flyt, eskalér `Kritisk`, varsle. | Retry hjelper ikke på utløpt token; det skjuler bare problemet. |
| `RATE_LIMIT` | Backoff + legg i kø; behandle når vinduet åpner. Aldri dropp. | Vi vil ikke miste leads fordi vi traff en grense. |
| `DATA_INVALID` | Ikke skriv. Logg + flagg for menneske (`Trenger menneskelig vurdering`). | Bedre tom rad enn feil rad (datakvalitet > dekning). |
| `DATA_CONFLICT` | Ikke overskriv. Eskalér med **begge** versjoner. | Mennesket avgjør; vi mister ingen av variantene. |
| `LOW_CONFIDENCE` | Lag utkast, men ikke la det passere kvalitetsport uten flagg. | Tvil → menneske, ikke gjetning. |
| `GUARDRAIL_BLOCK` | Stopp handlingen; logg hva + hvorfor; eskalér ved tvil. | Guardrails er ufravikelige. |
| `UNKNOWN` | Eskalér; klassifiser etterpå og utvid taksonomien. | Ukjent skal aldri svelges stille. |

## Per-integrasjon: eierskap, feilstrategi, fallback
For hvert verktøy: **hvem eier dataene**, hva skjer ved feil, og hva fallbacken er.

| Integrasjon | Dataeier | Synkes | Synkes ALDRI | Feilstrategi | Fallback |
| --- | --- | --- | --- | --- | --- |
| **Airtable (CRM)** | Airtable er kilde for avtaler/bedrifter/logg | Avtaler, Bedrifter, Venues, logg | Hemmeligheter; rådata fra Gmail-innhold utover lenke | Skrivefeil → retry→eskalér; aldri delvis skriv | Hvis nede: køes lokalt i n8n, skrives når oppe; Jonathan varsles |
| **Gmail** | Gmail er kilde for e-post | Lese tråder, etiketter, **utkast** | Aldri autonom sending; aldri eksport av innhold ut | Sendefeil finnes ikke (vi sender ikke); lesefeil → retry | Manuell: Jonathan ser tråden direkte |
| **Google Kalender** | Kalender er kilde for tid/møter | Lese ledig tid, foreslå reservasjoner | Aldri slette eksterne invitasjoner autonomt | Konflikt → `DATA_CONFLICT`, eskalér | Foreslå tid som tekst i utkast; Jonathan booker |
| **Google Drive/Docs** | Drive er kilde for dokumenter | Opprette/lese tilbudsdokument | Ingen destruktiv sletting | Skrivefeil → behold Markdown-utkast i tråden | Tilbud finnes alltid som tekst selv om Docs feiler |
| **Apollo/Clay** | Ekstern berikelseskilde | Prospektdata inn i Avtaler | Ikke skriv ubekreftet data som fakta | Feil/tom → hopp over berikelse, ikke blokkér lead | Lead opprettes uansett, beriking kan skje senere |
| **n8n** | Kjøreflate (eier ikke data) | — | — | Node-feil → flytens feilgren logger + eskalerer | Manuell kjøring av samme prompt i Claude/ChatGPT |
| **Notion** | ⚠️ Arkivert | **Ingenting** | **Alt** — skriv aldri | N/A | N/A (kun historisk lesing) |

## Backup-strategi
Levende data bor i tredjepartsverktøy; vi eier ikke serverne. Derfor en eksplisitt backup-plan så en
feilkonfigurasjon, en feilsletting eller en kontosperre ikke er katastrofal.

| Hva | Hvordan | Kadens | Eier |
| --- | --- | --- | --- |
| **Airtable-base** | Airtable snapshots (innebygd) + ukentlig CSV-/JSON-eksport av hver tabell til Drive (`/backups/airtable/ÅÅÅÅ-Uke`) | Snapshot: løpende. Eksport: ukentlig | n8n-jobb (spec) |
| **Repoet** | Git + GitHub remote (allerede distribuert) | Hver commit | GitHub |
| **Prompt-/agentdefinisjoner** | Bor i repoet → dekkes av Git | — | — |
| **Gmail/Drive** | Google Takeout kvartalsvis (Jonathans konto) | Kvartal | Jonathan |
| **n8n-workflows** | Eksporter JSON til `workflows/<navn>.json` ved endring | Ved endring | Den som endrer |

**Gjenopprettingsprinsipp:** En tabell skal kunne gjenskapes fra siste ukentlige eksport med maks én
ukes tap — og strukturen fra [`crm/schema.md`](../crm/schema.md). Repoet er «som-bygd»-tegningen.

> **Status:** Airtable-snapshots er på (innebygd). Den ukentlige eksport-jobben og Takeout-rutinen er
> **spec** — se [ROADMAP](../docs/ROADMAP.md). Inntil de er bygget er Airtables egne snapshots +
> Git den faktiske dekningen.

## Sikker degradering (graceful degradation)
Når et lag faller bort, skal systemet falle ned til neste nivå, ikke stoppe helt:
1. **Agent feiler** → orkestrator eskalerer → Jonathan gjør oppgaven manuelt (utkast finnes ofte alt).
2. **n8n nede** → samme prompter kjøres manuelt i Claude/ChatGPT (de er verktøyuavhengige — det er
   selve poenget med å holde dem i repoet).
3. **Airtable nede** → leads køes i Gmail (etikett «ubehandlet»), skrives når basen er oppe.
4. **Alt nede** → repoet + playbooks lar Jonathan jobbe helt manuelt med full prosess i hånden.

Dette er hvorfor kunnskapen ligger som lesbar Markdown og ikke låst inne i ett verktøy.
