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

    // agentenes RÅD — beslutningen er alltid saksbehandlerens
    for (const v of sak.agent_vurderinger || []) {
      if (v.agent === 'vakt') {
        kort.append(el('div', {},
          el('span', { class: 'mono' }, 'Vaktagenten: '),
          v.vurdering.flagg?.length
            ? v.vurdering.flagg.map((f) => el('span', { class: 'merkelapp varsel' }, f.replaceAll('_', ' ')))
            : el('span', { class: 'merkelapp aktiv' }, 'ingen anomalier')));
      } else if (v.agent === 'frigivelse') {
        const d = v.vurdering;
        kort.append(el('div', {},
          el('span', { class: 'mono' }, 'Attest-sjekk (AI-råd): '),
          d.utilgjengelig
            ? el('span', { class: 'merkelapp' }, 'AI utilgjengelig — vurder manuelt')
            : el('span', {},
              el('span', { class: `merkelapp ${d.ser_ut_som_attest ? 'aktiv' : 'stoppet'}` },
                d.ser_ut_som_attest ? 'ligner attest' : 'ligner IKKE attest'), ' ',
              el('span', { class: `merkelapp ${d.navn_treff ? 'aktiv' : 'varsel'}` },
                d.navn_treff ? 'navn stemmer' : 'navn ikke funnet'),
              d.avvik?.length ? el('div', { class: 'meta' }, `Avvik: ${d.avvik.join('; ')}`) : null,
              d.kommentar ? el('div', { class: 'meta' }, d.kommentar) : null)));
      }
    }

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
        el('button', { class: 'fare', onclick: async (hendelse) => {
          const overstyr = hendelse.target.dataset.overstyr === '1';
          const a = await kall('POST', `/api/admin/frigivelser/${sak.id}/avvis`,
            { grunn: grunn.value, overstyrKvalitet: overstyr });
          if (!a.ok) {
            tom(feilRom);
            feilRom.append(feilboks(a.data.feil || 'Avvisning feilet'));
            // Kvalitetsagenten foreslo en varsommere formulering — mennesket velger
            if (a.data.kanOverstyres) {
              if (a.data.forslag) {
                feilRom.append(el('button', { class: 'liten sekundaer', onclick: () => {
                  grunn.value = a.data.forslag;
                } }, 'Bruk forslaget'));
              }
              hendelse.target.dataset.overstyr = '1';
              hendelse.target.textContent = 'Avvis likevel (overstyr)';
            }
            return;
          }
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
