# SAGA

Ett samlet, selvforbedrende AI-system: personlig assistent, digitalt styrerom
og selskapsfabrikk – bygget som statiske moduler med delt kjerne, uten backend.

```
saga/
├── core/                  # felles: nøkler, aktivitetslogg, event-bus, modulbro
├── modules/
│   ├── assistant/         # SAGA-assistenten (tidl. JARVIS) – stemme-PWA
│   ├── aeis/              # Executive Board – beslutningsstøtte
│   └── factory/           # Company Factory – idé → selskap
├── shared/                # design-tokens (Tiffany Blue), felles kontrakter
├── tools/                 # saga-CLI (improve-loopen)
└── docs/                  # beslutninger, arkitektur, migrering, automatisering
```

- **Kjør lokalt:** `python3 -m http.server 8130` fra repo-roten →
  `http://localhost:8130/saga/modules/assistant/` (evt. `aeis`/`factory`)
- **Tester:** `node tests/e2e.js && node tests/aeis.e2e.js && node tests/factory.e2e.js`
- **Forbedringsloop:** `npm run saga improve` (se `docs/automation.md`)
- **Design:** alle farger via `shared/design-tokens.css` – primær #0ABAB5
- **Dokumentasjon:** `docs/decisions.md`, `docs/architecture.md`,
  modul-arkitektur i `modules/*/ARCHITECTURE.md`, manuelle steg i `/MIGRATION.md`
