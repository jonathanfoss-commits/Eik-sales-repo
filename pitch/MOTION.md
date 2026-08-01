# MOTION.md — bevegelsesspråket på landingssiden

Alt skal føles **fysisk og rolig**: ting bremser inn, de stopper ikke brått.
Ingen bevegelse er dekorativ uten grunn, og alt kan skrus av.

## Tokens (definert i `:root` i landing.html)

| Token | Verdi | Brukes til |
|---|---|---|
| `--m-rask` | .22s | fargeskift, fokus, topplinje-tekst |
| `--m-mid` | .4s | knappeløft, topplinje-fortetting |
| `--m-rolig` | .8s | avsløringer ved scroll |
| `--m-fjær` | cubic-bezier(.2,.8,.2,1) | knapper — kort overshoot, «fysisk» |
| `--m-inn` | cubic-bezier(.16,1,.3,1) | innfading — treg start, mykt stopp |

## Fire bevegelser, og bare fire

1. **Avsløring ved scroll** — `IntersectionObserver` (bevisst IKKE et scroll-bibliotek:
   batch-baserte reveals blir upålitelige og etterlater usynlige seksjoner).
   18 px opp + innfading, trinnvis forsinkelse `.t1/.t2/.t3` (80/160/240 ms).
   Observatøren kobles av etter første treff — elementer «blinker» aldri tilbake.
2. **Nordlyset** — sanntids GLSL. Pekeren styrer to uniformer, og verdiene dempes
   med faktor `.045` per frame (aldri lineær følging). Uten peker driver den av seg selv.
3. **Dokumentstabelen** — CSS-3D-rotasjon mot pekeren, dempet med `.055`.
   Maks ±10° — nok til dybde, ikke nok til å bli en leke.
4. **Topplinja** — fortettes (bakgrunn + blur + strek) når `scrollY > 24`.

## Regler

- `prefers-reduced-motion: reduce` → nordlyset tegnes som **ett statisk bilde**,
  avsløringer og pulseringer er av, knappene løfter seg ikke, `scroll-behavior:auto`.
- Render-løkka pauses når heroen er ute av syne og når fanen er skjult.
- `devicePixelRatio` er kappet til 2 — ellers brenner 4K-skjermer strøm på et bakteppe.
- Mister nettleseren WebGL-konteksten, byttes canvaset ut med en CSS-gradient.

## Lys og mørk modus

Temaet settes i et lite skript **før første maling**, så siden aldri blinker i feil drakt:
lagret valg → ellers systemets `prefers-color-scheme`. Bryteren i topplinja lagrer valget
på brukerens egen enhet (`localStorage`, nøkkel `laerling-tema`) — velger brukeren aldri
selv, følger siden systemet også når det byttes underveis.

Nordlyset er **ikke** slått av i lys modus: samme shader kjører, men en `lysm`-uniform
blander resultatet mot papir — båndene blir en pastellgrønn dis i stedet for lysende
nordlys. `--f-akse` går fra aurora-grønn (#39E29B) til dyp skoggrønn (#0A6640) som holder
AA mot papir, og knappene snur fra grønn fyll til blekksvart.

Telefonmockupen er et unntak med vilje: `.skjerm` definerer sine egne tokenverdier, slik
at appen alltid vises i sin mørke drakt uansett hva resten av siden gjør.
