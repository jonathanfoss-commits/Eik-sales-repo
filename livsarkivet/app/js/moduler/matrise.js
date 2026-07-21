// Mottakermatrisen: rutenett element × kontakt — trykk for å gi/ta tilgang.
import { kall } from '../api.js';
import { el, tom } from '../dom.js';

export async function vis(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Hvem får hva'),
    el('p', { class: 'undertekst' },
      'Velg hva hver kontakt skal få ved dødsfall. Ingenting frigis før hendelsen er verifisert og karenstiden er over.'));

  const [hvelv, kontakter, matrise] = await Promise.all([
    kall('GET', '/api/hvelv'), kall('GET', '/api/kontakter'), kall('GET', '/api/matrise')]);
  const elementer = hvelv.data.elementer || [];
  const folk = kontakter.data.kontakter || [];
  const rader = matrise.data.matrise || [];

  if (!elementer.length || !folk.length) {
    rot.append(el('div', { class: 'kort' },
      el('h3', {}, 'Mangler brikker'),
      el('p', { class: 'meta' }, 'Legg inn minst ett element i hvelvet og én kontakt først.')));
    return;
  }

  const kart = new Map(); // `${elementId}|${kontaktId}` → matriserad
  for (const r of rader) kart.set(`${r.element_id}|${r.kontakt_id}`, r);

  const tabell = el('table', { class: 'matrise-tabell' });
  tabell.append(el('tr', {}, el('th', {}, 'Element'),
    ...folk.map((k) => el('th', {}, k.navn))));

  for (const e of elementer) {
    const rad = el('tr', {}, el('td', {}, e.tittel));
    for (const k of folk) {
      const celle = el('td', { class: 'matrise-celle', role: 'button',
        'aria-label': `${e.tittel} til ${k.navn}` });
      const oppdater = () => { celle.textContent = kart.has(`${e.id}|${k.id}`) ? '✓' : '·'; };
      celle.addEventListener('click', async () => {
        const eksisterende = kart.get(`${e.id}|${k.id}`);
        if (eksisterende) {
          await kall('DELETE', `/api/matrise/${eksisterende.id}`);
          kart.delete(`${e.id}|${k.id}`);
        } else {
          const svar = await kall('POST', '/api/matrise', { elementId: e.id, kontaktId: k.id });
          if (svar.ok && svar.data.rad) kart.set(`${e.id}|${k.id}`, svar.data.rad);
        }
        oppdater();
      });
      oppdater();
      rad.append(celle);
    }
    tabell.append(rad);
  }
  rot.append(el('div', { class: 'kort', style: 'overflow-x:auto' }, tabell));
}
