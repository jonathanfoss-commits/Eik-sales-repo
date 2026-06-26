# Pipeline-steg (Avtaler.Status)

De ordnede stegene en avtale beveger seg gjennom. Dette er de **faktiske `Status`-verdiene** i
Airtable-tabellen Avtaler — bruk dem nøyaktig slik de står. Jf.
[ADR 0002](../docs/decisions/0002-faktisk-systemarkitektur.md).

| Rekkefølge | Status | Betydning | Gå videre når … |
| --- | --- | --- | --- |
| 1 | `Ny lead` | Ny henvendelse/lead registrert, ikke jobbet ennå. | Vi har tatt kontakt / dialog er i gang. |
| 2 | `I dialog` | Aktiv samtale; behov kartlegges. | Et tilbud er klart til å sendes. |
| 3 | `Tilbud sendt` | Tilbud levert til kunden. | Kunden vurderer / vi venter på svar. |
| 4 | `Pending` | Venter på kundens beslutning eller en avklaring. | Kunden bekrefter eller takker nei. |
| 5 | `Bekreftet` | Avtale bekreftet — arrangementet skal gjennomføres. | Arrangementet er avholdt. |
| 6 | `Gjennomført` | Arrangementet er levert. | — (terminal; grunnlag for gjenkjøp/pleie). |
| — | `Tapt` | Avtalen ble ikke noe av. | — (terminal; noter årsak i Notater). |

## Sannsynlighet (for «Vektet verdi»)
Formelfeltet **Vektet verdi** = Totalbudsjett × en sannsynlighet avledet av Status. Veiledende
mapping (juster i Airtable-formelen ved behov):

| Status | Veiledende sannsynlighet |
| --- | --- |
| Ny lead | 10 % |
| I dialog | 30 % |
| Tilbud sendt | 50 % |
| Pending | 65 % |
| Bekreftet | 100 % (kontraktsfestet) |
| Gjennomført | 100 % (realisert) |
| Tapt | 0 % |

## Regler (steghygiene)
- **Åpne avtaler** (`Ny lead` → `Pending`) skal ha en `Neste oppfølging`-dato. Mangler den, er
  avtalen i ferd med å gli ut — sett en dato eller flytt til `Tapt`.
- **Gå kun videre på ekte vilkår.** Ikke blås opp pipelinen.
- **`Tapt` bør ha en kort årsak** i Notater (pris, timing, valgte konkurrent, ingen respons,
  avlyst). Ærlige årsaker skjerper [ICP-en](../sales/icp.md).
- **`Bekreftet` → `Gjennomført`** når «Dato for selskap» er passert og arrangementet er levert.
  Dette skiller fremtidig kontraktsfestet omsetning fra realisert.

## Forhold til salgsmetodikken
[`sales/methodology.md`](../sales/methodology.md) beskriver salgsbevegelsen i mer generelle steg
(kartlegging, tilbud, forhandling, pleie). Disse er det *mentale* rammeverket; `Status`-verdiene
over er det *operative* som faktisk registreres i Airtable. Når de to omtaler samme ting, er det
`Status`-verdiene her som gjelder i praksis.
