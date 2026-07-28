// Saksbehandling: verifiseringskø med fire-øyne-godkjenning, og revisjonslogg.
import { kall } from '../api.js';
import { el, tom, STATUS_NAVN, STATUS_TONE, VAKT_FLAGG_NAVN, filstorrelse } from '../dom.js';
import { feilboks, felt, knapp, kort, medTilstand, merkelapp, panel, rutenett, sidetopp,
  tomtilstand } from '../komponenter.js';

// En tom kø betyr «ingenting å gjøre». Feiler hentingen, må flaten si det i
// stedet — ellers tror saksbehandleren at køen er tom.
async function hent(sti) {
  const svar = await kall('GET', sti);
  if (!svar.ok) throw new Error(svar.data.feil || 'Vi fikk ikke kontakt med tjenesten.');
  return svar.data;
}

// Kortets tone sier om saken venter på DEG. I karenstid er ballen hos eieren,
// og da skal kortet være rolig.
const VENTER_PAA_HANDLING = ['under_verifisering', 'godkjent_1'];
const ATTEST_TONE = { godkjent: 'ok', avvist: 'fare' };

// Mono-etikett over en rad merkelapper: flaggene lå før som en klump rett
// etter etiketten, uten å si hvor gruppen begynte og sluttet.
function merkeblokk(etikett, merker, ...tekst) {
  return el('div', { class: 'merkeblokk' },
    el('p', { class: 'mono' }, etikett),
    el('div', { class: 'merkerad' }, ...merker),
    ...tekst);
}

export async function visKoe(rot) {
  tom(rot);
  const flate = el('div', { class: 'flate' });
  rot.append(flate);
  flate.append(sidetopp({ tittel: 'Verifiseringskø',
    undertekst: 'Du ser sakens metadata og attesten — aldri innholdet i hvelvet. '
      + 'To ulike saksbehandlere må godkjenne.' }));

  await medTilstand(flate, () => hent('/api/admin/koe'), (plass, data) => {
    const saker = data.saker || [];
    if (!saker.length) {
      plass.append(tomtilstand({ tittel: 'Køen er tom',
        tekst: 'Ingen saker venter på deg nå. Meldes et dødsfall, dukker saken opp her.' }));
      return;
    }
    // Rutenett: på bred skjerm skal køen ikke være én lang, smal kolonne.
    plass.append(rutenett(...saker.map((sak) => tegnSak(sak, rot))));
  });
}

function tegnSak(sak, rot) {
  const feilRom = el('div', {});
  const kortet = kort({
    tittel: `Dødsfall · meldt av ${sak.melder_navn || 'ukjent'}`,
    meta: `Kilde: ${sak.kilde} · Bekreftelser: ${sak.bekreftelser} · `
      + `Betrodde i hvelvet: ${sak.betrodde}`,
    merke: merkelapp({ tekst: STATUS_NAVN[sak.status] || sak.status,
      tone: STATUS_TONE[sak.status] || 'noytral' }),
    tone: VENTER_PAA_HANDLING.includes(sak.status) ? 'varsel' : 'noytral',
  });

  if (sak.fire_oyne_venter) {
    kortet.append(el('p', { class: 'meta' },
      'Godkjent én gang — krever en ANNEN saksbehandler.'));
  }

  // agentenes RÅD — beslutningen er alltid saksbehandlerens
  for (const v of sak.agent_vurderinger || []) {
    if (v.agent === 'vakt') {
      const flagg = v.vurdering.flagg || [];
      kortet.append(merkeblokk('Vaktagenten', flagg.length
        ? flagg.map((f) => merkelapp({ tekst: VAKT_FLAGG_NAVN[f] || f.replaceAll('_', ' '),
          tone: 'varsel' }))
        // «ingenting» er ikke et svar: agenten har sett på saken og ikke funnet noe.
        : [merkelapp({ tekst: 'Ingen anomalier', tone: 'ok' })]));
    } else if (v.agent === 'frigivelse') {
      const d = v.vurdering;
      const merker = d.utilgjengelig
        ? [merkelapp({ tekst: 'AI utilgjengelig — vurder manuelt' })]
        : [merkelapp({ tekst: d.ser_ut_som_attest ? 'ligner attest' : 'ligner IKKE attest',
          tone: d.ser_ut_som_attest ? 'ok' : 'fare' }),
        merkelapp({ tekst: d.navn_treff ? 'navn stemmer' : 'navn ikke funnet',
          tone: d.navn_treff ? 'ok' : 'varsel' })];
      kortet.append(merkeblokk('Attest-sjekk (AI-råd)', merker,
        !d.utilgjengelig && d.avvik?.length
          ? el('p', { class: 'meta' }, `Avvik: ${d.avvik.join('; ')}`) : null,
        !d.utilgjengelig && d.kommentar ? el('p', { class: 'meta' }, d.kommentar) : null));
    }
  }

  for (const a of sak.attester) {
    kortet.append(el('div', { class: 'rad' },
      el('span', { class: 'meta' }, `${a.filnavn} (${filstorrelse(a.storrelse)})`),
      el('div', { class: 'merkerad' },
        merkelapp({ tekst: a.status, tone: ATTEST_TONE[a.status] || 'noytral' }),
        el('a', { class: 'knapp k-stille k-liten', target: '_blank',
          href: `/api/admin/attester/${a.id}/fil` }, 'Åpne'))));
  }

  if (['under_verifisering', 'godkjent_1'].includes(sak.status)) {
    const grunn = felt({ etikett: 'Grunn ved avvisning',
      hjelp: 'Teksten leses av en pårørende. Skriv den slik du ville sagt den høyt.' });
    const godkjenn = knapp({ rolle: 'primaer',
      tekst: sak.status === 'godkjent_1' ? 'Godkjenn (andre signatur)' : 'Godkjenn attesten',
      onclick: async () => {
        const g = await kall('POST', `/api/admin/frigivelser/${sak.id}/godkjenn`);
        if (!g.ok) {
          tom(feilRom);
          feilRom.append(feilboks({ tekst: g.data.feil || 'Godkjenning feilet' }));
          return;
        }
        visKoe(rot);
      } });
    const avvis = knapp({ tekst: 'Avvis', rolle: 'fare', onclick: async () => {
      const overstyr = avvis.dataset.overstyr === '1';
      const a = await kall('POST', `/api/admin/frigivelser/${sak.id}/avvis`,
        { grunn: grunn.inn.value, overstyrKvalitet: overstyr });
      if (!a.ok) {
        tom(feilRom);
        feilRom.append(feilboks({ tekst: a.data.feil || 'Avvisning feilet' }));
        // Kvalitetsagenten foreslo en varsommere formulering — mennesket velger
        if (a.data.kanOverstyres) {
          if (a.data.forslag) {
            feilRom.append(knapp({ tekst: 'Bruk forslaget', rolle: 'stille', storrelse: 'liten',
              onclick: () => { grunn.inn.value = a.data.forslag; } }));
          }
          avvis.dataset.overstyr = '1';
          avvis.querySelector('span').textContent = 'Avvis likevel (overstyr)';
        }
        return;
      }
      visKoe(rot);
    } });
    kortet.append(feilRom, grunn, el('div', { class: 'knapperad' }, godkjenn, avvis));
  }

  if (sak.status === 'karenstid') {
    kortet.append(el('p', { class: 'meta' },
      `Karenstid til ${new Date(sak.karenstid_slutt).toLocaleString('nb-NO')}.`));
  }
  return kortet;
}

export async function visLogg(rot) {
  tom(rot);
  const flate = el('div', { class: 'flate' });
  rot.append(flate);
  flate.append(sidetopp({ tittel: 'Revisjonslogg',
    undertekst: 'Uforanderlig logg: hendelsestyper og referanser — aldri innhold.' }));

  await medTilstand(flate, () => hent('/api/admin/logg'), (plass, data) => {
    const logg = data.logg || [];
    if (!logg.length) {
      plass.append(tomtilstand({ tittel: 'Loggen er tom',
        tekst: 'Her kommer hver hendelse i systemet, i den rekkefølgen den skjedde.' }));
      return;
    }
    plass.append(panel({}, ...logg.map((rad) => kort({},
      el('div', { class: 'rad' },
        el('strong', {}, rad.hendelse),
        el('span', { class: 'meta' }, new Date(rad.tid).toLocaleString('nb-NO'))),
      el('p', { class: 'logglinje' }, `${rad.rolle || '—'} · ${JSON.stringify(rad.detaljer)}`)))));
  });
}
