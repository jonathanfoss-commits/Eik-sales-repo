// Kontaktregisteret: hvem som kan varsle (betrodd) og hvem som kan motta.
import { kall } from '../api.js';
import { el, tom, feilboks, okboks } from '../dom.js';

export async function vis(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Kontakter'),
    el('p', { class: 'undertekst' },
      'Betrodde kontakter kan melde fra hvis noe skjer deg. Mottakere får det du velger i «Hvem får hva».'));

  const svar = await kall('GET', '/api/kontakter');
  const liste = el('div', {});
  rot.append(liste);

  for (const k of svar.data.kontakter || []) {
    const kodeRom = el('div', {});
    liste.append(el('div', { class: 'kort' },
      el('div', { class: 'rad' },
        el('div', {},
          el('h3', {}, k.navn),
          el('div', { class: 'meta' }, k.epost + (k.relasjon ? ` · ${k.relasjon}` : '')),
          el('div', {},
            k.er_betrodd ? el('span', { class: 'merkelapp aktiv' }, 'Betrodd') : null, ' ',
            k.koblet ? el('span', { class: 'merkelapp' }, 'Koblet til konto')
              : el('span', { class: 'merkelapp varsel' }, 'Ikke koblet'))),
        el('div', {},
          !k.koblet ? el('button', { class: 'liten', onclick: async () => {
            const inv = await kall('POST', `/api/kontakter/${k.id}/invitasjon`);
            tom(kodeRom);
            kodeRom.append(inv.ok
              ? okboks(`Invitasjonskode (vises kun nå): ${inv.data.kode}. Delt på e-post hvis oppsatt — ellers gi den til ${k.navn} selv.`)
              : feilboks(inv.data.feil || 'Kunne ikke lage invitasjon'));
          } }, 'Inviter') : null,
          el('button', { class: 'liten fare', onclick: async () => {
            if (!confirm(`Fjerne ${k.navn}?`)) return;
            await kall('DELETE', `/api/kontakter/${k.id}`);
            vis(rot);
          } }, 'Fjern'))),
      kodeRom));
  }

  const navn = el('input', { type: 'text', placeholder: 'Navn' });
  const epost = el('input', { type: 'email', placeholder: 'E-post' });
  const relasjon = el('input', { type: 'text', placeholder: 'Relasjon (f.eks. datter, bror)' });
  const betrodd = el('input', { type: 'checkbox', id: 'ny-betrodd' });
  const feilRom = el('div', {});
  rot.append(el('div', { class: 'kort' },
    el('h3', {}, 'Ny kontakt'), feilRom, navn, epost, relasjon,
    el('div', { class: 'sjekk' }, betrodd,
      el('label', { for: 'ny-betrodd' }, 'Betrodd — kan melde fra om dødsfall')),
    el('button', { onclick: async () => {
      const svar = await kall('POST', '/api/kontakter',
        { navn: navn.value, epost: epost.value, relasjon: relasjon.value, erBetrodd: betrodd.checked });
      if (!svar.ok) { tom(feilRom); feilRom.append(feilboks(svar.data.feil || 'Lagring feilet')); return; }
      vis(rot);
    } }, 'Legg til')));
}
