// Saksbehandling: verifiseringskø med fire-øyne-godkjenning, og revisjonslogg.
import { kall } from '../api.js';
import { el, tom, feilboks, STATUS_NAVN } from '../dom.js';

export async function visKoe(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Verifiseringskø'),
    el('p', { class: 'undertekst' },
      'Du ser sakens metadata og attesten — aldri innholdet i hvelvet. To ulike saksbehandlere må godkjenne.'));

  const svar = await kall('GET', '/api/admin/koe');
  const saker = svar.data.saker || [];
  if (!saker.length) {
    rot.append(el('div', { class: 'kort' }, el('p', { class: 'meta' }, 'Køen er tom.')));
    return;
  }

  for (const sak of saker) {
    const feilRom = el('div', {});
    const kort = el('div', { class: 'kort' },
      el('div', { class: 'rad' },
        el('h3', {}, `Dødsfall · meldt av ${sak.melder_navn || 'ukjent'}`),
        el('span', { class: `merkelapp ${sak.status === 'karenstid' ? 'varsel' : 'aktiv'}` },
          STATUS_NAVN[sak.status] || sak.status)),
      el('div', { class: 'meta' },
        `Kilde: ${sak.kilde} · Bekreftelser: ${sak.bekreftelser} · Betrodde i hvelvet: ${sak.betrodde}`),
      sak.fire_oyne_venter
        ? el('p', { class: 'meta' }, '⚠ Godkjent én gang — krever en ANNEN saksbehandler.') : null,
      feilRom);

    for (const a of sak.attester) {
      kort.append(el('div', { class: 'rad' },
        el('span', { class: 'meta' }, `${a.filnavn} (${Math.round(a.storrelse / 1024)} kB) — ${a.status}`),
        el('a', { href: `/api/admin/attester/${a.id}/fil`, target: '_blank', class: 'lenkeknapp' }, 'Åpne')));
    }

    if (['under_verifisering', 'godkjent_1'].includes(sak.status)) {
      const grunn = el('input', { type: 'text', placeholder: 'Grunn ved avvisning' });
      kort.append(
        el('button', { onclick: async () => {
          const g = await kall('POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
          if (!g.ok) { tom(feilRom); feilRom.append(feilboks(g.data.feil || 'Godkjenning feilet')); return; }
          visKoe(rot);
        } }, sak.status === 'godkjent_1' ? 'Godkjenn (andre signatur)' : 'Godkjenn attesten'),
        grunn,
        el('button', { class: 'fare', onclick: async () => {
          const a = await kall('POST', `/api/admin/frigivelser/${sak.id}/avvis`, { grunn: grunn.value });
          if (!a.ok) { tom(feilRom); feilRom.append(feilboks(a.data.feil || 'Avvisning feilet')); return; }
          visKoe(rot);
        } }, 'Avvis'));
    }
    if (sak.status === 'karenstid') {
      kort.append(el('p', { class: 'meta' },
        `Karenstid til ${new Date(sak.karenstid_slutt).toLocaleString('nb-NO')}.`));
    }
    rot.append(kort);
  }
}

export async function visLogg(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Revisjonslogg'),
    el('p', { class: 'undertekst' }, 'Uforanderlig logg: hendelsestyper og referanser — aldri innhold.'));
  const svar = await kall('GET', '/api/admin/logg');
  for (const rad of svar.data.logg || []) {
    rot.append(el('div', { class: 'kort' },
      el('div', { class: 'rad' },
        el('strong', {}, rad.hendelse),
        el('span', { class: 'meta' }, new Date(rad.tid).toLocaleString('nb-NO'))),
      el('div', { class: 'meta mono' }, `${rad.rolle || '—'} · ${JSON.stringify(rad.detaljer)}`)));
  }
}
