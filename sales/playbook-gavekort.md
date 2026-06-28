# Playbook — Gavekort (gjentakende inntekt)

Hvordan vi gjør gavekort fra sesongbaserte engangssalg til **gjentakende inntekt**. Gavekort er
vårt mest skalerbare svinghjul: digitalt, høy margin, lav leveransekostnad — og det komponerer hvis
vi fanger og fornyer kundene i stedet for å pitche kaldt hver sesong. Se
[ADR 0004](../docs/decisions/0004-gavekort-gjentakende-inntekt.md).

## Tre tilbudsformer
| Form | Hva | Passer for | Verdi |
| --- | --- | --- | --- |
| **Årsavtale** | Årlig gavekort-budsjett over flere anledninger (sommer, jul, bursdager, milepæler, kundegaver), med volumrabatt | Mellomstore/store bedrifter med gavekultur (advokat, konsulent, finans) | Forutsigbar ARR, høyest livstidsverdi |
| **Fast månedlig** | Løpende ansattgode | Vekstselskaper, HR-tech, IT | Jevn, gjentakende strøm |
| **Sesong** | Engangskjøp — men *fanget* så det trigges igjen neste sesong | Alle | Inngangsport til årsavtale |

## Hvorfor kunden sier ja
- **Enkelt:** ett gavekort gjelder på 40+ restauranter — null logistikk for HR/kontoret.
- **Verdsatt:** mottakeren velger selv; gaver som faktisk brukes.
- **Forutsigbart for dem:** årsavtale = én beslutning, ikke fire mas i året.

## Den gjentakende motoren (det nye)
1. **Fang** hvert gavekort-salg som en `Gavekortavtale` (ikke bare en `Avtale`), med
   `Fornyelsesdato`.
2. **Oppgrader sesong → årsavtale:** etter første vellykkede sesongkjøp, foreslå en årsavtale som
   dekker resten av årets anledninger med rabatt.
3. **Forny automatisk:** [gavekort-selger](../agents/gavekort-selger.md)-agenten lager utkast X uker
   før `Fornyelsesdato` og ved hver sesongstart.
4. **Utvid:** ansattgaver → kundegaver → arrangementer (kryss-salg via [Bedrifter](../crm/schema.md)).

## Sesonghjul (når triggere fyrer)
| Anledning | Triggervindu |
| --- | --- |
| Sommergaver | mai–juni (før fellesferien) |
| Julegaver | oktober–november |
| Nyttår / kickoff | desember–januar |
| Valentine / vår | etter behov |
| Ansattmilepæler/bursdager | løpende (månedlig avtale) |

Jf. [sesongkalenderen](sesongkalender.md) for arrangementssiden.

## Innvendinger & svar
| Innvending | Svar |
| --- | --- |
| «Vi tar det per sesong.» | En årsavtale er én beslutning i stedet for fire, og gir rabatt — vi minner deg om hver anledning. |
| «Usikker på volum.» | Start lavt; årsavtalen justeres. Du betaler for det som brukes. |
| «Har en annen leverandør.» | 40+ restauranter på ett kort, lokalt — bredere enn de fleste alternativ. |

## KPI-er
- **Gavekort-ARR** (sum årlig verdi av aktive avtaler).
- **Fornyelsesrate** (andel som fornyes ved `Fornyelsesdato`).
- **Sesong→årsavtale-konvertering**.
- **Utvidelse** (vekst i årlig verdi per konto).

## Prompter
- Oppgrader til årsavtale: [`prompts/outreach/gavekort-aarsavtale.md`](../prompts/outreach/gavekort-aarsavtale.md)
- Sesong-/førstegangs: [`prompts/outreach/cold-outreach.md`](../prompts/outreach/cold-outreach.md) (gavekort-vinkel)
- Oppfølging: [`prompts/follow-up/follow-up-sequence.md`](../prompts/follow-up/follow-up-sequence.md)
