# Test-fixtures (syntetiske data)

**Oppdiktede** leads, bedrifter og e-poster for testing. Ingen av disse er ekte kunder. Alle navn,
e-poster (`@example.no`) og org.nr er fiktive. Bruk **kun** disse i tester — aldri produksjonsdata.

> Konvensjon: alt her er gjenkjennelig falskt. E-post på `@example.no`/`@test.no`, telefon `+47 900 00 0xx`,
> org.nr starter på `999`. Ser du noe som ligner en ekte kunde i en test, er det en feil.

## Syntetiske bedrifter
| ID | Navn | Bransje | Segment | Notat for testbruk |
| --- | --- | --- | --- | --- |
| B-001 | Nordlys Consulting AS | Konsulent | Strategisk | Gjentakende konto (flere tidligere event). VIP-case. |
| B-002 | Fjellvann Advokater DA | Juridisk | Vekst | Klassisk gavekort-kandidat. |
| B-003 | Bekk & Bølge Eiendom | Eiendom | Standard | Førstegangs-lead. |
| B-004 | (ukjent firma) | — | — | Brukes til «mangelfull lead»-test. |

## Syntetiske leads / e-poster
### F-NORMAL — ren bedriftshenvendelse
```
Fra: maria.holm@example.no  (Nordlys Consulting AS)
Emne: Sommerfest for 80 personer i august
Hei! Vi planlegger sommerfest for ca. 80 ansatte, fredag 22. august. Ønsker mat, drikke og
gjerne uteservering. Hva kan dere tilby? Budsjett rundt 150 000 kr.
```

### F-MANGELFULL — for lite info
```
Fra: ukjent@example.no
Emne: Spørsmål
Hei, kan dere ha et arrangement for oss? Mvh Per
```
*(Ingen firma, antall, dato, budsjett eller telefon.)*

### F-SPAM — ikke en reell lead
```
Fra: noreply@markedsforing-tilbud.test.no
Emne: ⭐ Øk omsetningen 300% med vår SEO-pakke!!!
Hei, vi tilbyr digital markedsføring til restauranter ...
```

### F-VIP — gjentakende strategisk konto
```
Fra: maria.holm@example.no  (Nordlys Consulting AS)
Emne: Julebord igjen i år?
Hei Jonathan! Vi hadde det fantastisk hos dere i fjor. Kan vi booke julebord for 120 i desember?
Samme opplegg som sist, men litt større i år.
```
*(Bedrift B-001 finnes med historikk — agenten bør gjenkjenne kontoen.)*

### F-DOBBELTBOOKING — kapasitetskonflikt
```
Lead A: Bekk & Bølge Eiendom — 100 pax, TAKET, lør 13. desember.
Lead B: Fjellvann Advokater — 90 pax, TAKET, lør 13. desember (samme lokale, samme dato).
```

### F-GAVEKORT — gjentakende avtale
```
Fra: post@example.no  (Fjellvann Advokater DA)
Emne: Gavekort til ansatte før sommeren
Hei, vi vil gi alle 35 ansatte et gavekort på 1000 kr til sommeren. Kan dette settes opp som en
fast ordning vi gjentar hvert år?
```

### F-OPTOUT — do_not_contact
```
Bedrift markert do_not_contact = sant i CRM. Innkommende lik F-NORMAL, men fra denne kontakten.
```

## Ugyldige / korrupte data (for robusthet)
| ID | Data | Forventning |
| --- | --- | --- |
| F-BADDATE | «Dato for selskap»: «32. febuar» | Skal ikke skrives som dato; flagg `DATA_INVALID`. |
| F-NEGPAX | Antall pax: −10 | Avvis; ikke beregn budsjett på negativt tall. |
| F-HUGE | Antall pax: 999 999 | Behandle som mistenkelig; flagg for menneske. |
| F-EMPTYMAIL | E-postfelt tomt, men svar forventes | Kan ikke lage svarutkast; eskalér/flagg. |

## Bruk i n8n-regresjon (senere)
Når disse kjøres automatisk: legg fixtures inn i en **egen Airtable-test-base** (ikke
`appzIFWfzob6WEhnq`). Agenten pekes mot test-basen via miljøvariabel, slik at et testløp aldri kan
skrive til produksjon. Se [`config/`](../config/README.md).
