# Innspill — kveldsteamets arbeidsflyt

Ole Fabian melder inn via **appen** (Innspill-kortet på Rapport-fanen). Han trenger aldri
GitHub. Innspillene lander i Netlify Forms («pilotlogg», hendelse `innspill`) og varsles
Jonathan på e-post.

## Flyten

1. **Ole Fabian** sender innspill fra appen (👍/🐞/💡 + hvilket verktøy + fritekst).
2. **Jonathan** limer nye innspill inn i [`inbox.md`](inbox.md) (kopier fra Netlify-e-posten —
   30 sekunder) og pusher. *(Når Netlify kobles til repoet kan dette automatiseres.)*
3. **Lunsjtriagen** (kl. 12) prioriterer nye innspill i `prioritering.md` og flagger
   hastesaker. **Kveldsteamet** (ekspertpanel på 12 agenter, hver kveld kl. 21) vurderer
   kandidatene parallelt med fageksperter, bygger vinneren, tester, oppdaterer
   `app/changelog.json` («Nytt siden sist» i appen), flytter innspillet til
   [`behandlet.md`](behandlet.md) og pusher til forslag-branchen.
4. **Jonathan** ser over om morgenen og publiserer ny ZIP til Netlify.
   *(Kobles Netlify til repoet, skjer også publiseringen automatisk.)*

## Filene

- `inbox.md` — nye, ubehandlede innspill (én linje per innspill, med dato)
- `backlog.md` — kjente forbedringer teamet kan ta når inbox er tom
- `behandlet.md` — logg over hva som er vurdert og gjort (kveldsteamet fører denne)
