// Betrodd kontakt: meld dødsfall, last opp attest, bekreft, tilbakekall.
import { kall } from '../api.js';
import { el, tom, feilboks, okboks, STATUS_NAVN } from '../dom.js';

export async function vis(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Meld hendelse'),
    el('p', { class: 'undertekst' },
      'Du er betrodd kontakt. En melding starter en kontrollert prosess: attest, menneskelig verifisering og karenstid — eieren varsles i alle ledd.'));

  const svar = await kall('GET', '/api/melding/hvelv');
  for (const h of svar.data.hvelv || []) {
    const kort = el('div', { class: 'kort' });
    kort.append(el('h3', {}, `${h.eier_navn} sitt livsarkiv`));
    const rom = el('div', {});
    kort.append(rom);
    rot.append(kort);
    await tegnSak(rom, h, rot);
  }
  if (!(svar.data.hvelv || []).length) {
    rot.append(el('div', { class: 'kort' },
      el('p', { class: 'meta' }, 'Du er ikke betrodd kontakt i noe arkiv.')));
  }
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
      rom.append(el('p', {},
        el('span', { class: `merkelapp ${f.status === 'frigitt' ? 'aktiv' : 'stoppet'}` },
          STATUS_NAVN[f.status] || f.status)));
      if (f.status === 'avvist') {
        rom.append(el('p', { class: 'meta' }, `Avvist av saksbehandler: ${f.avvistGrunn || ''}`));
      }
    }
    rom.append(
      el('p', { class: 'meta' },
        'Å melde et dødsfall er en alvorlig handling. Meldingen loggføres, og alle kontakter og eieren selv varsles umiddelbart.'),
      el('button', { class: 'fare', onclick: async () => {
        if (!confirm(`Melde dødsfall for ${h.eier_navn}? Dette varsler alle tilknyttede.`)) return;
        const meldt = await kall('POST', '/api/hendelser', { hvelvId: h.hvelv_id });
        if (!meldt.ok) { rom.prepend(feilboks(meldt.data.feil || 'Melding feilet')); return; }
        vis(rot);
      } }, 'Meld dødsfall'));
    return;
  }

  const sak = await kall('GET', `/api/hendelser/${h.hendelse_id}`);
  const f = sak.data.frigivelse;
  rom.append(el('p', {},
    el('span', { class: 'merkelapp aktiv' }, STATUS_NAVN[f.status] || f.status)));

  if (['meldt', 'attest_lastet_opp'].includes(f.status)) {
    const fil = el('input', { type: 'file', accept: '.pdf,image/*' });
    const feilRom = el('div', {});
    rom.append(
      el('p', { class: 'meta' }, sak.data.attester.length
        ? `Attester mottatt: ${sak.data.attester.length}. Bekreftelser: ${sak.data.bekreftelser}.`
        : 'Last opp dødsattesten (PDF eller foto).'),
      feilRom, fil,
      el('button', { onclick: async () => {
        const valgt = fil.files[0];
        if (!valgt) return;
        const base64 = btoa(String.fromCharCode(...new Uint8Array(await valgt.arrayBuffer())));
        const opp = await kall('POST', `/api/hendelser/${h.hendelse_id}/attest`,
          { filnavn: valgt.name, mime: valgt.type || 'application/pdf', innholdBase64: base64 });
        if (!opp.ok) { tom(feilRom); feilRom.append(feilboks(opp.data.feil || 'Opplasting feilet')); return; }
        vis(document.getElementById('innhold'));
      } }, 'Last opp attest'));
  }

  if (['meldt', 'attest_lastet_opp', 'under_verifisering'].includes(f.status)) {
    const feilRom = el('div', {});
    rom.append(feilRom,
      el('button', { class: 'sekundaer', onclick: async () => {
        const b = await kall('POST', `/api/hendelser/${h.hendelse_id}/bekreft`);
        tom(feilRom);
        feilRom.append(b.ok ? okboks('Bekreftelsen din er registrert.')
          : feilboks(b.data.feil || 'Bekreftelse feilet'));
      } }, 'Bekreft meldingen (annen kontakt)'),
      el('button', { class: 'sekundaer', onclick: async () => {
        if (!confirm('Trekke meldingen tilbake?')) return;
        const t = await kall('POST', `/api/hendelser/${h.hendelse_id}/tilbakekall`);
        tom(feilRom);
        if (!t.ok) { feilRom.append(feilboks(t.data.feil || 'Kun melderen kan tilbakekalle')); return; }
        vis(document.getElementById('innhold'));
      } }, 'Trekk tilbake (kun melder)'));
  }

  if (f.status === 'karenstid') {
    rom.append(el('p', { class: 'meta' },
      `Karenstiden løper til ${new Date(f.karenstidSlutt).toLocaleString('nb-NO')}. Eieren kan stoppe frigivelsen frem til da.`));
  }
  if (f.status === 'avvist') {
    rom.append(el('p', { class: 'meta' }, `Avvist av saksbehandler: ${f.avvistGrunn || ''}`));
  }
}
