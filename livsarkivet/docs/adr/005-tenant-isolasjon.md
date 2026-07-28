# ADR-005: Tenant-isolasjon — aktivering av multi-tenant

**Status:** Vedtatt (implementert i migrasjon 011).
**Erstatter ikke ADR-003, men aktiverer den.**

## Kontekst
Målet er at et forsikringsselskap skal kunne tilby Livsarkivet til sine
kunder under egen merkevare. Da står flere selskaper i samme database, og
ADR-003 lovet at aktivering ville være «én migrasjon uten backfill».

Det løftet holdt teknisk, men det skjulte en reell feil: fram til nå var
`er_admin()` ubetinget. En saksbehandler så ALLE frigivelser, hendelser,
kontakter, attester og varslinger i hele basen. Med én kunde var det
uproblematisk. Med to forsikringsselskaper er det den type funn som avslutter
en innkjøpsprosess i første sikkerhetsgjennomgang — og med rette.

## Beslutning

### 1. Saksbehandlerens rekkevidde uttrykkes én gang
`er_admin_for(hvelv_id)` erstatter `er_admin()` i alle radskopede policyer:

```sql
er_admin() AND (er_plattformadmin() OR tenant_av_hvelv(hvelvid) = min_tenant())
```

`min_tenant()` og `tenant_av_hvelv()` er SECURITY DEFINER av samme grunn som
`eier_av`/`er_betrodd_i` i migrasjon 002: policyene må kunne slå opp i
`brukere`/`hvelv` uten å utløse policyene der på nytt.

Tenanten utledes fra **hvelvets eier**, ikke fra en kolonne på hver tabell.
Det holder ADR-003s løfte om ingen backfill, og det gjør det umulig for en
barnerad å komme i utakt med hvem den egentlig tilhører.

### 2. Plattformdrift ser på tvers — og det skal stå i avtalen
Admin i tenanten `livsarkivet` (`er_plattformadmin()`) ser saksmetadata på
tvers for drift og support. Dette er ikke en bakdør, det er den normale
leverandørrollen i enhver SaaS — men det er en opplysning som **skal stå
eksplisitt i databehandleravtalen**, ikke oppdages av en revisor.

Grensen som IKKE flyttes: `hvelv_elementer` har fortsatt ingen admin-policy.
Ingen saksbehandler, heller ikke plattformens egne, kan lese hvelvinnhold.
Testen `INGEN admin ser hvelvinnhold — heller ikke plattformdrift` holder det
nede for alle tre rollene.

### 3. Vertsnavnet avgjør tenant
`server/tenant.js` slår opp tenant på `Host`-headeren, med 60 sekunders cache.
Ukjent vertsnavn faller til plattformen. Klienten kan ikke velge tenant selv —
den ville ellers vært en tilgangsvektor.

Merkevaren (visningsnavn, aksentfarge, avsender) bor i `tenanter.konfig`,
som fantes fra migrasjon 001. Ingen ny tabell, ingen ny kolonne — bortsett fra
`aktiv`, som er en tilstand vi må kunne spørre på og derfor ikke hører hjemme
i en jsonb-blob.

### 4. Tilhørighet arves, ikke gjettes
- Registrering på selskapets adresse → selskapets tenant.
- **Invitert kontakt arver tenanten til den som inviterte**, ikke vertsnavnet
  hen tilfeldigvis åpnet lenken på. En betrodd kontakt hos Storebrand er
  Storebrands, uansett hvor lenken ble klikket.

## Alternativer vurdert

**`tenant_id` på hver tabell.** Raskere policyer (ingen oppslag), men krever
backfill og åpner for at en rad kan bære feil tenant. Avvist: en denormalisert
sikkerhetsgrense som kan komme i utakt, er en sikkerhetsgrense som før eller
siden kommer i utakt.

**Én database per selskap.** Sterkest tenkelige isolasjon, og noen innkjøpere
vil be om det. Avvist for nå: migrasjoner, backup og drift ganges opp per
kunde, og RLS-isolasjonen er testbar på en måte «vi har separate baser» ikke
er. Dette er likevel den naturlige oppgraderingen for en kunde som krever det
kontraktsfestet — modellen her hindrer den ikke.

**Tenant som GUC (`app.tenant_id`).** Avvist: da kan klienten eller en
programmeringsfeil sette den. Tenanten skal utledes fra brukerens rad i basen,
aldri fra noe som er sendt inn.

## Konsekvenser
- Fire-øyne-regelen gjelder nå **innenfor** et selskap: to ulike
  saksbehandlere i samme tenant. Et selskap som bemanner med én person kan
  ikke frigi noe i det hele tatt. Det er tilsiktet, og må sies i salgsmøtet.
- `agent_logg` (modellbruk og kostnad) er plattformdriftens, ikke det enkelte
  selskapets — den har ingen hvelvreferanse å skopes på.
- Systemrollen (karenstid-feieren) er uendret og går på tvers. Den frigir kun
  saker som allerede har passert fire øyne i sin egen tenant.

## Bevis
`tests/tenant.test.js` — ti tester som prøver å BRYTE isolasjonen: lesing på
tvers av fire tabeller, godkjenning av en annen tenants frigivelse, admin mot
hvelvinnhold i alle tre rollene, og vertsnavn-ruting.

En merknad om testmetode: første utgave brukte `fetch()` med en `Host`-header.
Node fjerner den i stillhet (forbudt header i undici), så testen «passerte»
mot plattformens standardmerkevare uansett hva den påsto å teste. Den bruker
nå `node:http`, som faktisk setter headeren.
