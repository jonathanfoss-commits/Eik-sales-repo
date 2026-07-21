# ADR-001: Kryptomodell for sensitiv-tier

**Status:** Godkjent av Jonathan 21.7.2026 — implementert (alternativ A +
gjenoppretting 1): migrasjon `007_krypto.sql`, kryptomodul `app/js/krypto.js`
(WebCrypto, samme kode i nettleser og Node-test), nøkkeldeponi til mottakere
via ECDH P-256 med engangs-nøkkelpar. Nivå 3-testene (server kan ikke
dekryptere; gjenoppretting ende-til-ende med simulert tap av frase) ligger i
`tests/krypto.test.js` og `tests/api.test.js`.

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

Shamir 2-av-3 står som fase 2-oppgradering.
