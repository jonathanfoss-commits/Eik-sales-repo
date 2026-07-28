// Betrodd kontakt: meld dødsfall, last opp attest, bekreft, tilbakekall.
import { kall } from '../api.js';
import { el, tom, STATUS_NAVN, STATUS_TONE } from '../dom.js';
import { feilboks, felt, knapp, kort, medTilstand, merkelapp, okboks, panel, sidetopp,
  tomtilstand } from '../komponenter.js';

async function hent(sti) {
  const svar = await kall('GET', sti);
  if (!svar.ok) throw new Error(svar.data.feil || 'Vi fikk ikke kontakt med tjenesten.');
  return svar.data;
}

function statusmerke(status) {
  return merkelapp({ tekst: STATUS_NAVN[status] || status, tone: STATUS_TONE[status] || 'noytral' });
}

export async function vis(rot) {
  tom(rot);
  const flate = el('div', { class: 'flate' });
  rot.append(flate);
  flate.append(sidetopp({ tittel: 'Meld hendelse',
    undertekst: 'Du er betrodd kontakt. En melding starter en kontrollert prosess: '
      + 'attest, menneskelig verifisering og karenstid — eieren varsles i alle ledd.' }));

  await medTilstand(flate, () => hent('/api/melding/hvelv'), async (plass, data) => {
    const hvelvene = data.hvelv || [];
    if (!hvelvene.length) {
      plass.append(tomtilstand({ tittel: 'Du er ikke betrodd kontakt ennå',
        tekst: 'Når noen gir deg den rollen i sitt livsarkiv, kan du melde fra herfra.' }));
      return;
    }
    const rommene = hvelvene.map(() => el('div', { class: 'sakrom' }));
    plass.append(panel({}, ...hvelvene.map((h, i) =>
      kort({ tittel: `${h.eier_navn} sitt livsarkiv` }, rommene[i]))));
    for (const [i, h] of hvelvene.entries()) await tegnSak(rommene[i], h, rot);
  });
}

const TERMINALE = ['avvist', 'blokkert', 'tilbakekalt', 'frigitt'];

async function tegnSak(rom, h, rot) {
  tom(rom);
  const kanMeldes = !h.hendelse_id || TERMINALE.includes(h.status);
  if (kanMeldes) {
    // vis utfallet av forrige sak (avvist grunn m.m.) over meldeknappen
    if (h.hendelse_id) {
      const forrige = await kall('GET', `/api/hendelser/${h.hendelse_id}`);
      const f = forrige.data.frigivelse;
      rom.append(el('div', { class: 'merkerad' }, statusmerke(f.status)));
      if (f.status === 'avvist') {
        rom.append(el('p', { class: 'meta' }, `Avvist av saksbehandler: ${f.avvistGrunn || ''}`));
      }
    }
    rom.append(
      el('p', { class: 'meta' },
        'Å melde et dødsfall er en alvorlig handling. Meldingen loggføres, og alle '
        + 'kontakter og eieren selv varsles umiddelbart.'),
      // Ikke en primærhandling: dette er ikke noe vi oppfordrer til.
      el('div', { class: 'knapperad' }, knapp({ tekst: 'Meld dødsfall', rolle: 'fare',
        onclick: async () => {
          if (!confirm(`Melde dødsfall for ${h.eier_navn}? Dette varsler alle tilknyttede.`)) return;
          const meldt = await kall('POST', '/api/hendelser', { hvelvId: h.hvelv_id });
          if (!meldt.ok) { rom.prepend(feilboks({ tekst: meldt.data.feil || 'Melding feilet' })); return; }
          vis(rot);
        } })));
    return;
  }

  const sak = await kall('GET', `/api/hendelser/${h.hendelse_id}`);
  const f = sak.data.frigivelse;
  rom.append(el('div', { class: 'merkerad' }, statusmerke(f.status)));

  if (['meldt', 'attest_lastet_opp'].includes(f.status)) {
    const fil = felt({ etikett: 'Dødsattest', type: 'file',
      hjelp: 'PDF eller bilde — et foto av attesten tatt med telefonen holder.' });
    fil.inn.setAttribute('accept', '.pdf,image/*');
    const feilRom = el('div', {});
    rom.append(
      el('p', { class: 'meta' }, sak.data.attester.length
        ? `Attester mottatt: ${sak.data.attester.length}. Bekreftelser: ${sak.data.bekreftelser}.`
        : 'Last opp dødsattesten (PDF eller foto).'),
      feilRom, fil,
      el('div', { class: 'knapperad' }, knapp({ tekst: 'Last opp attest', onclick: async () => {
        const valgt = fil.inn.files[0];
        if (!valgt) return;
        const base64 = btoa(String.fromCharCode(...new Uint8Array(await valgt.arrayBuffer())));
        const opp = await kall('POST', `/api/hendelser/${h.hendelse_id}/attest`,
          { filnavn: valgt.name, mime: valgt.type || 'application/pdf', innholdBase64: base64 });
        if (!opp.ok) { tom(feilRom); feilRom.append(feilboks({ tekst: opp.data.feil || 'Opplasting feilet' })); return; }
        vis(rot);
      } })));
  }

  if (['meldt', 'attest_lastet_opp', 'under_verifisering'].includes(f.status)) {
    const feilRom = el('div', {});
    rom.append(feilRom, el('div', { class: 'knapperad' },
      knapp({ tekst: 'Bekreft meldingen (annen kontakt)', rolle: 'sekundaer', onclick: async () => {
        const b = await kall('POST', `/api/hendelser/${h.hendelse_id}/bekreft`);
        tom(feilRom);
        feilRom.append(b.ok ? okboks('Bekreftelsen din er registrert.')
          : feilboks({ tekst: b.data.feil || 'Bekreftelse feilet' }));
      } }),
      knapp({ tekst: 'Trekk tilbake (kun melder)', rolle: 'stille', onclick: async () => {
        if (!confirm('Trekke meldingen tilbake?')) return;
        const t = await kall('POST', `/api/hendelser/${h.hendelse_id}/tilbakekall`);
        tom(feilRom);
        if (!t.ok) { feilRom.append(feilboks({ tekst: t.data.feil || 'Kun melderen kan tilbakekalle' })); return; }
        vis(rot);
      } })));
  }

  if (f.status === 'karenstid') {
    rom.append(el('p', { class: 'meta' },
      `Karenstiden løper til ${new Date(f.karenstidSlutt).toLocaleString('nb-NO')}. `
      + 'Eieren kan stoppe frigivelsen frem til da.'));
  }
  if (f.status === 'avvist') {
    rom.append(el('p', { class: 'meta' }, `Avvist av saksbehandler: ${f.avvistGrunn || ''}`));
  }
}
