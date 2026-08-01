# Lærling — landingsside

Selvforsynt HTML uten byggesteg og uten avhengigheter (ett dokument: `landing.html`).
Publiseres på Netlify-siten `op-bygg-laerling-nett`.

## Kjøre lokalt

```bash
cd pitch && python3 -m http.server 8080     # åpne http://localhost:8080/landing.html
```

## Verifisere (skjermbilder, a11y, Lighthouse, OG-bilde)

```bash
cd pitch/verify && npm install && npm run verify
```

Skriver skjermbilder til `pitch/skjermbilder/` (1440 / 834 / 390 px, seksjonsvis),
rapporter til `pitch/rapporter/` og OG-bildet til `pitch/og-laerling.png`.
Krever Chromium; i skyen ligger den på `/opt/pw-browsers/chromium` (kan overstyres med
`CHROMIUM_PATH`). WebGL headless krever swiftshader-flaggene — de er satt i scriptet.

**Terskler (feiler bygget om de brytes):** Lighthouse performance ≥ 90, accessibility ≥ 95,
axe-core: null kritiske/alvorlige avvik — kjøres i **både lys og mørk modus**.
Siste kjøring: **100 / 100 / 100 / 100**, null avvik i begge temaer.

## Hvor endrer jeg hva?

| Vil du endre … | Gå til |
|---|---|
| Farger, typestørrelser, avstander, radius, skygger, bevegelsestempo | `:root`-blokken øverst i `landing.html` — **alt annet arver herfra** |
| Lys modus | `:root[data-tema="lys"]` rett under — samme tokennavn, andre verdier |
| Fargene i telefonmockupen | `.skjerm` har egne token-verdier: appen er mørk uansett sidetema |
| Bevegelsesspråket | `MOTION.md` + de fire bolkene i skriptet nederst |
| Nordlyset (form, fart, intensitet) | `fs`-shaderen i skriptet: `band(...)`-kallene styrer bånd, `col+=`-linjene styrer styrke |
| Teksten på siden | HTML-en i `<main>` — seksjonene ligger i lesbar rekkefølge |
| Prisene | `#priser`-seksjonen (tre `.plan`-kort) |
| Hvor «Bli kjent» peker | søk på `bli-kjent.html?invitasjon=` |

## Publisering

Siten bygges ikke — den lastes opp som statiske filer:

```bash
cd pitch && zip -q /tmp/landing.zip landing.html og-laerling.png   # index.html = landing.html
curl -X POST "https://api.netlify.com/api/v1/sites/<SITE_ID>/deploys" \
  -H "Authorization: Bearer $NETLIFY_AUTH_TOKEN" \
  -H "Content-Type: application/zip" --data-binary @/tmp/landing.zip
```

Filen må hete `index.html` i pakken. Se `samarbeid/lansering-28-juli.md` for site-IDer.

## Placeholders å erstatte

- **`op-bygg-logo.png`** finnes ikke i repoet ennå (gjelder appen, ikke denne siden).
- **Kundelogoer / referanser:** siden har bevisst ingen «brukt av»-rad før flere kunder finnes —
  ærlighet foran sosialt bevis. Legg til en `.tillit`-lignende rad når det er sant.
- **Analytics:** ingen sporing er lagt inn. Ønskes det, er Plausible (EU, cookiefritt) rett valg —
  ett `<script defer data-domain="…" src="https://plausible.io/js/script.js">` i `<head>`.
- **Skjemaet** poster til Netlify Forms (`interesse`). Formsdeteksjon må være på for siten,
  ellers svarer POST 404 — se `netlify.com` → Site configuration → Forms.
