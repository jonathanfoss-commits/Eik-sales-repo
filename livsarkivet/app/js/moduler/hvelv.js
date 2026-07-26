// Eierens hvelv: elementer per kategori, opprett/endre/slett.
import { kall } from '../api.js';
import { el, tom, feilboks, KATEGORI_NAVN } from '../dom.js';
import { hentHvelvnokkel, gjenopprettMedKode, harMinNokkel, sikreMinNokkel } from '../frase.js';
import { krypterElement, dekrypterElement } from '../krypto.js';

export async function vis(rot) {
  tom(rot);
  rot.append(el('h1', {}, 'Hvelvet ditt'),
    el('p', { class: 'undertekst' },
      'Det dine nærmeste vil trenge. Ingenting deles før en verifisert hendelse og karenstid.'));

  // abonnementsstatus — redigering portes, aldri frigivelse eller lesing
  const abo = (await kall('GET', '/api/abonnement')).data.abonnement;
  if (abo && !abo.aktivNaa) {
    const boks = el('div', { class: 'melding-feil' },
      el('p', {}, 'Prøveperioden er over. Alt du har lagt inn er trygt, og frigivelsen til dine nærmeste påvirkes aldri — men for å gjøre endringer må abonnementet aktiveres.'));
    if (abo.stripeKlar) {
      boks.append(el('button', { onclick: async () => {
        const svar = await kall('POST', '/api/abonnement/checkout');
        if (svar.ok && svar.data.url) location.href = svar.data.url;
      } }, 'Aktiver abonnement'));
    }
    rot.append(boks);
  } else if (abo?.status === 'proveperiode') {
    rot.append(el('p', { class: 'meta' },
      `Prøveperiode til ${new Date(abo.proveperiodeSlutt).toLocaleDateString('nb-NO')}.`));
  }

  // nøkkelkort: uten eget nøkkelpar kan ingen dele sensitivt innhold med deg
  if (!(await harMinNokkel())) {
    rot.append(el('div', { class: 'kort' },
      el('h3', {}, 'Sett sikkerhetsfrase'),
      el('p', { class: 'meta' },
        'Trengs for at andre skal kunne dele sensitivt innhold med deg. Frasen forlater aldri enheten din.'),
      el('button', { class: 'liten', onclick: async () => {
        if (await sikreMinNokkel()) vis(rot);
      } }, 'Sett frase nå')));
  }

  const svar = await kall('GET', '/api/hvelv');
  const elementer = svar.data.elementer || [];
  const liste = el('div', {});
  rot.append(liste);

  function tegnListe() {
    tom(liste);
    if (!elementer.length) {
      liste.append(el('div', { class: 'kort' },
        el('h3', {}, 'Tomt ennå'),
        el('p', { class: 'meta' }, 'Start med det praktiske: strøm, forsikring, hvor viktige papirer ligger.')));
    }
    let forrigeKategori = null;
    for (const e of elementer) {
      if (e.kategori !== forrigeKategori) {
        liste.append(el('h2', {}, KATEGORI_NAVN[e.kategori] || e.kategori));
        forrigeKategori = e.kategori;
      }
      liste.append(el('div', { class: 'kort' },
        el('div', { class: 'rad' },
          el('div', {}, el('h3', {}, e.tittel),
            el('div', { class: 'meta' }, `nivå: ${e.nivaa}`)),
          el('button', { class: 'liten sekundaer', onclick: () => tegnSkjema(e) }, 'Endre'))));
    }
  }

  const skjemaBoks = el('div', {});
  rot.append(skjemaBoks);

  function tegnSkjema(eksisterende) {
    tom(skjemaBoks);
    const e = eksisterende || {};
    const kategori = el('select', {},
      ...Object.entries(KATEGORI_NAVN).map(([verdi, navn]) =>
        el('option', { value: verdi, selected: e.kategori === verdi }, navn)));
    const nivaa = el('select', {},
      el('option', { value: 'privat', selected: !['delt', 'sensitiv'].includes(e.nivaa) }, 'Privat'),
      el('option', { value: 'delt', selected: e.nivaa === 'delt' }, 'Delt'),
      el('option', { value: 'sensitiv', selected: e.nivaa === 'sensitiv' },
        'Sensitiv (krypteres — bare du og valgte mottakere kan åpne)'));
    const tittel = el('input', { type: 'text', placeholder: 'Tittel', value: e.tittel || '' });
    const innholdFelt = el('textarea', { placeholder: 'Det de trenger å vite …' });
    innholdFelt.value = e.kryptert ? '' : (e.innhold || '');
    const feilRom = el('div', {});
    if (e.kryptert) {
      innholdFelt.placeholder = 'Kryptert — trykk «Lås opp» for å se innholdet';
      feilRom.append(el('button', { class: 'liten sekundaer', onclick: async () => {
        const hn = await hentHvelvnokkel();
        if (!hn) return;
        try {
          innholdFelt.value = await dekrypterElement(hn, e.innhold, e.nokkel_ref);
        } catch { feilRom.append(feilboks('Kunne ikke låse opp innholdet')); }
      } }, 'Lås opp'));
    }

    skjemaBoks.append(el('div', { class: 'kort' },
      el('h3', {}, e.id ? 'Endre element' : 'Nytt element'),
      feilRom,
      el('label', {}, 'Kategori'), kategori,
      el('label', {}, 'Nivå'), nivaa,
      tittel, innholdFelt,
      el('button', { onclick: async () => {
        const kropp = { kategori: kategori.value, nivaa: nivaa.value,
          tittel: tittel.value, innhold: innholdFelt.value };
        // sensitivt krypteres HER — serveren ser aldri klarteksten
        if (nivaa.value === 'sensitiv') {
          const hn = await hentHvelvnokkel();
          if (!hn) return;
          const kryptert = await krypterElement(hn, innholdFelt.value);
          kropp.innhold = kryptert.innhold;
          kropp.nokkelRef = kryptert.nokkelRef;
          kropp.kryptert = true;
        }
        const svar = e.id
          ? await kall('PUT', `/api/elementer/${e.id}`, { ...kropp, versjon: e.versjon })
          : await kall('POST', '/api/elementer', kropp);
        if (!svar.ok) { tom(feilRom); feilRom.append(feilboks(svar.data.feil || 'Lagring feilet')); return; }
        vis(rot);
      } }, 'Lagre'),
      e.id ? el('button', { class: 'fare', onclick: async () => {
        if (!confirm('Slette elementet?')) return;
        await kall('DELETE', `/api/elementer/${e.id}`);
        vis(rot);
      } }, 'Slett') : null,
      el('button', { class: 'sekundaer', onclick: () => { tom(skjemaBoks); tegnNyKnapp(); } }, 'Avbryt')));
  }

  const nyKnappBoks = el('div', {});
  rot.append(nyKnappBoks);
  function tegnNyKnapp() {
    tom(nyKnappBoks);
    nyKnappBoks.append(el('button', { onclick: () => { tegnSkjema(); tom(nyKnappBoks); } },
      '+ Legg til element'));
  }

  tegnListe();
  tegnNyKnapp();

  rot.append(el('button', { class: 'lenkeknapp', onclick: gjenopprettMedKode },
    'Glemt sikkerhetsfrasen? Bruk gjenopprettingskoden'));

  // Bytt passord
  const passordFeil = el('div', {});
  const gammelt = el('input', { type: 'password', placeholder: 'Nåværende passord', autocomplete: 'current-password' });
  const nytt = el('input', { type: 'password', placeholder: 'Nytt passord (minst 10 tegn)', autocomplete: 'new-password' });
  rot.append(el('div', { class: 'kort' },
    el('h3', {}, 'Bytt passord'),
    el('p', { class: 'meta' }, 'Andre enheter blir logget ut når du bytter.'),
    passordFeil, gammelt, nytt,
    el('button', { class: 'sekundaer', onclick: async () => {
      const svar = await kall('POST', '/api/auth/passord',
        { gammelt: gammelt.value, nytt: nytt.value });
      tom(passordFeil);
      if (!svar.ok) { passordFeil.append(feilboks(svar.data.feil || 'Bytte feilet')); return; }
      gammelt.value = ''; nytt.value = '';
      passordFeil.append(el('div', { class: 'melding-ok' }, 'Passordet er byttet.'));
    } }, 'Lagre nytt passord')));

  // Dine data: portabilitet og sletterett
  rot.append(el('div', { class: 'kort' },
    el('h3', {}, 'Dine data'),
    el('p', { class: 'meta' },
      'Du kan ta med deg alt når som helst. Eksporten inneholder også de '
      + 'frasepakkede nøklene, så du kan åpne sensitivt innhold utenfor tjenesten.'),
    el('a', { class: 'knapp', href: '/api/eksport', download: 'livsarkivet-eksport.json' },
      'Last ned alt'),
    el('button', { class: 'fare', onclick: async () => {
      if (!confirm('Slette kontoen og HELE arkivet? Dette kan ikke angres, og '
        + 'dine nærmeste får da ingenting.')) return;
      const passord = prompt('Skriv passordet ditt for å bekrefte slettingen:');
      if (!passord) return;
      const svar = await kall('POST', '/api/konto/slett', { passord });
      if (!svar.ok) { alert(svar.data.feil || 'Sletting feilet'); return; }
      alert('Kontoen og arkivet er slettet.');
      location.hash = '';
      location.reload();
    } }, 'Slett kontoen min')));
}
