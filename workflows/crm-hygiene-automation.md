# Workflow: CRM-hygiene (automatisk)

- **Motor:** Airtable (formelfelt — live) + n8n / Airtable-automasjon (status-flip)
- **Status:** ✅ Flagg live 26.06.2026 · flip-regel klar til aktivering
- **Godkjenningsport:** ingen — ren intern datahygiene, ingen kundekontakt.

## Mål
Holde pipelinen ren av seg selv, slik at de to tilbakevendende problemene aldri hoper seg opp igjen:
1. `Bekreftet`-avtaler med passert arrangementsdato (burde være `Gjennomført`).
2. Åpne avtaler uten / med forfalt `Neste oppfølging`.

## Del 1 — Live hygiene-flagg ✅ (deployet)
Et formelfelt **`Pipeline-hygiene`** i Avtaler (`appzIFWfzob6WEhnq`), som oppdateres daglig via
`TODAY()`:

```
IF(AND({Status}="Bekreftet", IS_BEFORE({Dato for selskap}, TODAY())),
   "⚠️ Sett til Gjennomført",
IF(AND(OR({Status}="Ny lead",{Status}="I dialog",{Status}="Tilbud sendt",{Status}="Pending"),
       OR({Neste oppfølging}=BLANK(), IS_BEFORE({Neste oppfølging}, TODAY()))),
   "🔔 Oppfølging mangler/forfalt",
   ""))
```

Bruk: lag en visning i Daily Command Center filtrert på `Pipeline-hygiene` er ikke tom — da ser du
nøyaktig hva som trenger handling, hver morgen.

## Del 2 — Auto-flip `Bekreftet → Gjennomført`
Flagget *synliggjør*; dette *fikser*. To måter (velg én):

### A) Via n8n-agenten «Digital Jonathan» (anbefalt — ingen ny infrastruktur)
Agenten kjører allerede daglig og gjør CRM-oppdateringer. Legg til denne regelen i dens rutine:

> Hver morgen: hent Avtaler der `Status` = `Bekreftet` og `Dato for selskap` < i dag → sett
> `Status` = `Gjennomført`. Logg antall flyttede i Agentlogg.

Se [`agents/digital-jonathan.md`](../agents/digital-jonathan.md) (driftsinstruksjoner).

### B) Som native Airtable-automasjon (script — 2 min å aktivere i UI)
Airtable → Automations → **+ Create automation** → Trigger «At scheduled time» (daglig 06:00) →
Action «Run a script» → lim inn:

```javascript
const table = base.getTable('Avtaler');
const today = new Date(); today.setHours(0, 0, 0, 0);
const query = await table.selectRecordsAsync({ fields: ['Status', 'Dato for selskap'] });
const updates = [];
for (const r of query.records) {
  const eventDate = r.getCellValue('Dato for selskap');
  if (r.getCellValueAsString('Status') === 'Bekreftet' && eventDate && new Date(eventDate) < today) {
    updates.push({ id: r.id, fields: { 'Status': { name: 'Gjennomført' } } });
  }
}
while (updates.length) { await table.updateRecordsAsync(updates.splice(0, 50)); }
console.log('Flyttet til Gjennomført: ' + query.records.length);
```

> Kan ikke opprettes via API (Airtable-automasjoner er UI-only) — derfor er regelen lagt til
> n8n-agenten (A) som standardvei, med dette scriptet som alternativ.

## Bivirkninger
- **Leser/skriver:** kun Avtaler.Status (intern). Ingen e-post, ingen kundekontakt.
- Idempotent: kjører den flere ganger, gjør den ingenting når alt allerede er ryddet.

## Historikk
- 26.06.2026: 86 avtaler ryddet manuelt (engangs), `Pipeline-hygiene`-flagget deployet. Se
  [`analytics/crm-helsesjekk-2026-06-26.md`](../analytics/crm-helsesjekk-2026-06-26.md).
