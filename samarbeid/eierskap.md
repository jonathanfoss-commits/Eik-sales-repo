# Eierskap — Jonathan + Ole Fabian som likeverdige eiere

Ole Fabian skal eie Lærling sammen med Jonathan. Det påvirker tre ting: GitHub-oppsettet,
selskapsformen og tilgangene. Alt under er gjort på under en time.

## 1. GitHub: organisasjon, ikke privat repo (3 minutter — løser også blokkeringen)

Et repo på en privat konto har én eier. Riktig struktur for to eiere er en **organisasjon**:

1. Gå til **github.com/organizations/plan** → velg Free → navn: `laerling-ai`
   (kontakt-e-post: din).
2. Under opprettelsen (eller etterpå: People → Invite member): inviter **Ole Fabians
   GitHub-bruker** → sett rollen til **Owner**. (Har han ikke GitHub-konto: github.com/signup,
   2 min — gratis.)
3. Opprett repoet **i organisasjonen**: New repository → owner: `laerling-ai` →
   navn: `laerling` → **Private**.
4. Si fra til Claude (meg): «repoet laerling-ai/laerling er klart» → jeg kobler det til og
   pusher alt innhold med CLAUDE.md på plass.

Resultat: begge brødre har full, lik kontroll — ingen av dere kan låses ute, og selskapet
kan senere overta organisasjonen uten flytting.

## 2. Juridisk eierskap: ENK fungerer ikke lenger — velg AS

- Et **enkeltpersonforetak kan bare ha én eier**. Med to eiere er alternativene i praksis
  **AS** (anbefalt: 30 000 kr aksjekapital, begrenset ansvar, ryddig eierbrøk) eller
  ANS/DA (frarådes: personlig ansvar for hverandres forpliktelser).
- **Anbefaling:** registrer **Lærling AS** med avtalt eierbrøk (50/50 eller f.eks. 60/40 —
  avklar ærlig ut fra innsats og risiko FØR dere starter, ikke etterpå).
  De 30 000 kan brukes til drift; begge kan skyte inn halvparten.
- **Frem til AS-et er på plass:** signer en enkel **samarbeidsavtale** (én side holder):
  eierbrøk, at all IP (kode, merkevare, innhold) overføres selskapet ved stiftelse,
  hvem som beslutter hva, og hva som skjer om én vil ut. Bruk en jurist-time (~2 500 kr)
  på å kvalitetssikre — billigste forsikring dere kan kjøpe som brødre og partnere.
- **Merk Eik-forholdet:** Jonathans bierverv-avklaring gjelder fortsatt og bør nevne at
  virksomheten drives sammen med tredjepart.
- **Habilitetsnotat for piloten:** OP Bygg er pilotkunde og Ole Fabian er både medeier og
  ansatt der. Vær åpne om det overfor sjefen hans — og hent case-tall nummer to fra en
  bedrift ingen av dere eier, så tallene er troverdige i salg.

## 3. Delte tilganger (sjekkliste)

| Ressurs | Oppsett |
|---|---|
| GitHub | Organisasjon `laerling-ai`, begge Owners (punkt 1) |
| Netlify | Team → Members → inviter Ole Fabian (gratisplan har 1 medlem — Owner-rollen kan om nødvendig deles via felles team senere; start med at Jonathan drifter) |
| Domene | Registreres på selskapet når AS er stiftet; inntil da: Jonathan, notert i samarbeidsavtalen |
| Claude-kontoer | Hver sin bruker; Team-plan når piloten konverterer |
| Fiken/bank | Følger selskapet (AS) |

## Rekkefølge

1. I dag: GitHub-organisasjonen (punkt 1) → innholdet flyttes → samarbeidet er i gang.
2. Denne uken: samarbeidsavtalen signeres (én side).
3. Når første betalende kunde er inne: stift Lærling AS, overfør IP og domene.
