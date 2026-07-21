# ADR-001: Kryptomodell for sensitiv-tier

**Status:** Utkast — venter på Jonathans godkjenning. IKKE implementert
(API-et svarer 501 på `nivaa='sensitiv'`; skjemaet er klart: `kryptert`,
`nokkel_ref` på `hvelv_elementer`).

## Kontekst
Ufravikelig prinsipp 3: zero-knowledge på sensitiv-tier (tilgangsinfo, passord,
koder). Serveren skal ALDRI kunne dekryptere dette innholdet — heller ikke
under frigivelse. Samtidig må mottakere kunne åpne innholdet etter frigivelse,
og eierens tap av nøkkel må kunne håndteres uten å bryte zero-knowledge.

## Alternativer

### A. WebCrypto AES-GCM med passfrase-avledet nøkkel (anbefalt)
- Klienten avleder hvelvnøkkel fra eierens passfrase (PBKDF2/scrypt i
  WebCrypto — ingen nye avhengigheter, i tråd med null-avhengighetslinja).
- Hvert sensitivt element krypteres med en egen elementnøkkel (AES-256-GCM);
  elementnøkkelen pakkes (wrappes) med hvelvnøkkelen og lagres i `nokkel_ref`.
- **Frigivelse:** ved opprettelse av mottakermatrise-rad for et sensitivt
  element pakker klienten elementnøkkelen også med en frigivelsesnøkkel som
  deponeres KRYPTERT i databasen — og selve dekrypteringsnøkkelen for
  deponiet utleveres først når frigivelsesmaskinen når `frigitt` (nøkkelen
  frigis via samme tilstandsmaskin og RLS-port som innholdet).
- Styrke: ingen nye avhengigheter, standard primitiver, alt klientside.
- Svakhet: passfrasen blir et angrepspunkt; frigivelsesdeponiet må designes
  så serveren alene aldri kan åpne det (to-parts-deling, se gjenoppretting).

### B. libsodium sealed boxes per element
- Per-hvelv nøkkelpar; elementer forsegles til mottakerens offentlige nøkkel.
- Styrke: moden konstruksjon, asymmetrisk (mottaker kan få direkte).
- Svakhet: ny avhengighet (WASM), mottakere må ha nøkkelpar FØR dødsfallet —
  friksjon i onboarding av mottakere som aldri har logget inn.

### C. Serverside konvoluttkryptering (AVVIST)
- KMS-stil: server krypterer med masternøkkel. Enkelt — men serveren kan
  dekryptere. Bryter zero-knowledge-prinsippet. Avvist.

## Gjenoppretting ved tapt hovednøkkel
1. **Forseglet gjenopprettingsnøkkel gjennom frigivelsesmaskinen (anbefalt
   først):** en kopi av hvelvnøkkelen krypteres med en tilfeldig
   gjenopprettingsnøkkel som deles i to: én halvdel hos brukeren (utskrift,
   engangsvisning), én i databasen. Begge kreves. Serveren alene kan aldri åpne.
2. **Shamir 2-av-3 hos betrodde kontakter (senere oppgradering):** nøkkelandeler
   distribueres til betrodde kontakter ved oppsett; 2 av 3 kan rekonstruere
   sammen med frigivelsesporten. Sterkere, men krever mer UX og
   andels-rotasjon ved kontaktbytte.

## Beslutning
Anbefaling: **A + gjenoppretting 1**, med Shamir som fase 2-oppgradering.
Testkravene (nivå 3 i /goal) implementeres i samme PR: negativtest som beviser
at service-tilkoblingen ikke kan dekryptere, og ende-til-ende-test av
gjenoppretting med simulert tap av hovednøkkel.

**Ingen kode skrives før Jonathan har godkjent denne ADR-en.**
