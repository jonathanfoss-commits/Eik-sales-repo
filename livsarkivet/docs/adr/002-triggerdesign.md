# ADR-002: Triggerdesign — kildeabstraksjon uten rammeverk

**Status:** Vedtatt (implementert i migrasjon 003).

## Kontekst
/goal krever trelags utløsermekanisme: Folkeregisteret (primær), betrodd
kontakt + attest (sekundær, MVP), dead man's switch (tertiær). MVP
implementerer kun den sekundære — men arkitekturen skal være API-klar for
Folkeregisteret fra dag én.

## Beslutning
En trigger er en rad i `hendelser` med `kilde IN ('manuell',
'folkeregisteret', 'dodmannsknapp')`. Kildene skiller seg KUN i hvem som
setter inn raden og hvilket bevis som følger med:

- `manuell`: betrodd kontakt via API (RLS-policyen `hendelser_meld` låser
  kilden til `manuell` for eksterne innsendere) + dødsattest + to-kilde-regelen.
- `folkeregisteret` (fase 3): en ingest-modul med Maskinporten-klient setter
  inn raden med kilde `folkeregisteret`. Folkeregisteret-oppføringen kan da
  telle som verifisert kilde; resten av kjeden (fire øyne kan reduseres til
  én kontroll, karenstid, varsling, frigivelse) er uendret.
- `dodmannsknapp` (fase 2): en planlagt jobb med eskalerende varsling setter
  inn raden når eieren ikke har svart.

Alt nedstrøms — verifisering, karenstid, blokkering, frigivelse,
etterlattevisning — er kildeagnostisk og rører aldri `kilde`.

## Avviste alternativer
Plugin-/adapterrammeverk for triggere: spekulativ abstraksjon (Musk steg 2).
Én enum-verdi og én innsettingsvei per kilde er hele behovet.
