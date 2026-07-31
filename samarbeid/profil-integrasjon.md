# Profil-integrasjon — fra «Bli kjent»-intervju til ferdig oppsatt app

*Kartlagt 31. juli 2026 (arkitekt-utredning mot kildekoden). Kveldsteamet følger
denne når en ny bedriftsprofil kommer inn — ETTER Jonathans klarsignal.
Innsendingen inneholder både lesbar profilblokk og en `PROFILJSON:`-linje med
normaliserte nøkler (null = ukjent) som kan leses maskinelt.*

## Felt → landingspunkt i koden

| PROFILJSON-nøkkel | Landes hvor | Hva endres |
|---|---|---|
| firma, sted, ansatte, fag_og_jobber | `PROFIL`-konstanten i `app/index.html` OG `netlify/functions/skriv.mjs` (holdes i sync!) + `kjerne/tenants/<slug>.js` | Første avsnitt skrives om; fag styrer FAGREGLENE (totalentreprenør → NS 8407-spor; maler/rørlegger → NS 8406/håndverkertjenesteloven) |
| kundemiks_privat_prosent | FAGREGLER-punktet «Skill mellom kundetyper» i `PROFIL` | Ren proff → NS-spor som standard; mest privat → forbrukerlov-spor; blandet → behold «Ukjent kundetype? Spør» |
| kontraktspraksis | Samme FAGREGLER-punkt + endringsmelding-instruksen | NS-standard vs. tilbud+aksept endrer varslings- og endringsspråket |
| underentreprenorer | «DIN JOBB» i `PROFIL`, «Purring til UE»-kortet i `PROMPTER`, UE-sjekk-forslaget i `FORSLAG` | Uten UE-bruk: UE-kort ut, UE-sjekk-forslag ut |
| skrivestil, signatur, eksempeltekst | SKRIVESTIL-avsnittet i `PROFIL` + hardkodede signaturer i purretrapp-tekstene (`index.html` ~1650) | Tone, hilsen og signaturlinje byttes overalt |
| tidstyver | Rekkefølge/utvalg i `PROMPTER` + `konfig.moduler` i tenant-config | Viktigste verktøy øverst, uaktuelle kort fjernes |
| ekstraarbeid_praksis | Endringsmelding-prompten + varslings-fagregelen | |
| purrepraksis | Purretrappens terskler (`foreslaattTrinn`, i dag 14/42 dager) og trinntekster | Frister og tone justeres til firmaets praksis |
| rapportering | Ukesrapport-fagregelen i `PROFIL` (+ `evner.ukesrapport` i kjernen) | Fast rytme/mottaker settes; uten rutine: forsiktig standard |
| dokumentasjonserfaring | Byggedagbok-fagregelen + prioritering av dagbok-forslag | Har de brent seg: dagbok-verktøyene løftes |
| systemer | `FORSLAG`-konstanten i `intervju.mjs` (regnskapskobling) | Beslutningsgrunnlag til Jonathan — aldri automatisk integrasjon |
| brukere, kontaktperson | `brukere` i tenant-config, «av»-feltet i changelog | |
| mobiltype | Veiledningen i `bli-med.html` | |
| drommen, annet | `FORSLAG`-hilsen + prioritering i til-godkjenning | Aldri rett i prompt — det er veikart-input |

## Prosessen (porten er Jonathan)

1. Kveldsteamet ser ny `bedriftsprofil`-innsending (begge kanalers skjema) →
   research (2–3 agenter) → forslags-utkast i `innspill/forslag-utkast-<firma>.md`.
2. Jonathan får utkastet i nattens rapport og sier klarsignal (evt. justerer).
3. FØRST DA: kveldsteamet genererer konfig-endringene etter tabellen over som
   ordinær leveranse (versjonsbump, QA, kveldsteam-forslag, to-nøkkel) og legger
   forslagene inn i `FORSLAG`-konstanten så kunden ser dem på bli-kjent-siden.
4. For plattformkunder: `kjerne/tenants/<slug>.js` genereres fra PROFILJSON —
   «kunde nr. 2 er konfig, ikke kode» får dermed konfigurasjonen sin fra intervjuet.
