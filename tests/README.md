# Tester

Et **scenario-basert testbibliotek** for Eik Sales OS. Et AI-operativsystem som ikke kan testes, kan
ikke stoles på — og kan ikke forbedres trygt. Disse testene lar oss verifisere at agenter oppfører
seg riktig **uten å røre produksjonsdata**.

> Dette er ikke kode-enhetstester. Agentene er definert i Markdown og kjører på Claude/ChatGPT/n8n.
> Derfor tester vi dem slik man tester en medarbeider: gi et **scenario**, observer **handlingen**,
> sjekk mot **forventet adferd**.

## Slik kjører du en test
1. Velg et scenario fra [`scenarios.md`](scenarios.md).
2. Gi agenten scenariets **input** sammen med dens egen kontrakt fra [`agents/`](../agents/).
   Bruk **kun** syntetiske data fra [`fixtures.md`](fixtures.md) — aldri ekte kunder.
3. Sammenlign agentens handling mot **Forventet adferd** og **Bestått-kriterier**.
4. Avvik = enten en agent-/prompt-feil (rett den) eller en mangelfull test (oppdater scenariet).

En menneskelig gjennomgang holder i dag. Når volumet vokser, kan disse scenariene kjøres som et
n8n-/skript-regresjonssett mot en **test-base** i Airtable (egen base, aldri produksjons-basen).

## Prinsipper
- **Ingen produksjonsdata.** All test-input er syntetisk (fixtures). Ekte kundedata kommer aldri inn
  i en test.
- **Edge cases er poenget.** Det normale tar agenten lett; verdien ligger i dårlige leads, manglende
  data, konflikter og feil.
- **Forventet adferd, ikke eksakt tekst.** Vi sjekker *beslutninger og guardrails* (flagget den? lot
  den være å sende? eskalerte den?), ikke at en e-post er ord-for-ord lik.
- **Hver guardrail har minst én test** som forsøker å bryte den.
- **Golden behavior.** For nøkkelscenarier noterer vi en kort «slik ser et godt svar ut» som referanse.

## Innhold
| Fil | Hva |
| --- | --- |
| [`fixtures.md`](fixtures.md) | Syntetiske leads, bedrifter og e-poster å teste med. |
| [`scenarios.md`](scenarios.md) | Testkatalogen: normale tilfeller + edge cases, med forventet adferd. |

## Dekningsmål
Hver agent-kontrakt i [`agents/`](../agents/) bør ha minst:
- 1 normalt («happy path») scenario,
- 1 edge case som treffer dens spesifikke risiko,
- 1 guardrail-test.

Mangler en agent dekning, er det teknisk gjeld — noter i [ROADMAP](../docs/ROADMAP.md).
