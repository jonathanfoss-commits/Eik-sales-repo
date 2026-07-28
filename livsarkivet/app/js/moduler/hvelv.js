// Eierens hvelv: elementer per kategori, opprett/endre/slett.
import { kall } from '../api.js';
import { el, tom, feilboks, KATEGORI_NAVN, KATEGORI_HJELP } from '../dom.js';
import { hentHvelvnokkel, gjenopprettMedKode, harMinNokkel, sikreMinNokkel } from '../frase.js';
import { krypterElement, dekrypterElement } from '../krypto.js';
import { tegn as tegnBeredskap } from './beredskap.js';

// Deling med eget forsikringsselskap. Vises KUN når kunden faktisk hører til
// et selskap — for en kunde som kom inn via livsarkivet.no finnes det ingen
// å dele med, og da skal kortet ikke stå der og forvirre.
async function tegnDeling(rot) {
  const svar = await kall('GET', '/api/deling');
  const selskap = svar.data?.selskap;
  if (!selskap) return;
  const { delinger = [], felttyper = {} } = svar.data;
  const aktive = new Map(delinger.map((d) => [d.felttype, d]));

  const kort = el('div', { class: 'kort' },
    el('h3', {}, `Delt med ${selskap.navn}`),
    el('p', { class: 'meta' },
      `Du bestemmer selv hva ${selskap.navn} får se. Resten av arkivet er stengt `
      + 'for dem — også etter at du er borte. Du kan trekke tilbake når som helst.'));

  for (const [type, etikett] of Object.entries(felttyper)) {
    const delt = aktive.get(type);
    // ingen placeholder: etiketten står rett over, og gjentakelsen støyer bare
    const felt = el('input', { type: 'text', value: delt?.verdi || '' });
    kort.append(el('div', { class: 'delingsrad' },
      el('label', {}, etikett),
      felt,
      delt
        ? el('button', { class: 'liten fare', onclick: async () => {
          if (!confirm(`Slutte å dele ${etikett.toLowerCase()} med ${selskap.navn}?`)) return;
          await kall('DELETE', `/api/deling/${delt.id}`);
          vis(rot);
        } }, 'Slutt å dele')
        : el('button', { class: 'liten sekundaer', onclick: async () => {
          if (!felt.value.trim()) return;
          await kall('POST', '/api/deling', { felttype: type, verdi: felt.value });
          vis(rot);
        } }, 'Del')));
  }
  rot.append(kort);
}

// De fem spørsmålene etterlatte faktisk bruker uker på å lete etter svar på.
//
// Merk at NEI er like verdifullt som ja — det er hele poenget. Alle arkiver
// registrerer det som finnes; ingen lar noen slutte å lete. Et bo der noen
// leter etter en bankboks som aldri fantes, koster like mye tid som ett der
// boksen finnes og ingen vet hvor.
const KJENTE = [
  { tittel: 'Testament', kategori: 'juridisk',
    ja: 'Hvor ligger originalen, og hvem er testamentfullbyrder?',
    nei: 'Jeg har ikke opprettet testament. Arven fordeles etter arveloven.' },
  { tittel: 'Bankboks', kategori: 'eiendeler',
    ja: 'Hvilken bank, hvilket boksnummer, og hvem har nøkkelen?',
    nei: 'Jeg har ingen bankboks.' },
  { tittel: 'Eiendeler i utlandet', kategori: 'eiendeler',
    ja: 'Hva, i hvilket land? Merk: dette krever advokat i det landet.',
    nei: 'Jeg har ingen konto, eiendom eller pensjon i utlandet.' },
  { tittel: 'Kryptovaluta', kategori: 'digitale_kontoer',
    ja: 'Hvilke lommebøker? Selve nøklene hører hjemme på sensitivt nivå.',
    nei: 'Jeg eier ingen kryptovaluta.' },
  { tittel: 'Lån mellom familie', kategori: 'juridisk',
    ja: 'Hvem skylder hvem hva, og hva var avtalen?',
    nei: 'Det er ingen muntlige lån eller forskudd på arv å ta hensyn til.' },
];

function tegnKjenteSporsmaal(rot, elementer, oppdater) {
  const svart = new Set(elementer.map((e) => e.tittel));
  const uavklart = KJENTE.filter((k) => !svart.has(k.tittel));
  if (!uavklart.length) return;

  const kort = el('div', { class: 'kort' },
    el('h3', {}, 'Kjente spørsmål'),
    el('p', { class: 'meta' },
      'Dette leter etterlatte etter. Svarer du nei, slipper de å lete — '
      + 'og det er like nyttig som et ja.'));

  for (const k of uavklart) {
    const feilRom = el('div', {});
    const lagre = async (innhold) => {
      const svar = await kall('POST', '/api/elementer',
        { kategori: k.kategori, nivaa: 'privat', tittel: k.tittel, innhold });
      if (!svar.ok) {
        feilRom.replaceChildren(feilboks(svar.data.feil || 'Kunne ikke lagre'));
        return;
      }
      oppdater();
    };
    const rad = el('div', { class: 'sporsmaal' },
      el('div', { class: 'rad' },
        el('strong', {}, k.tittel),
        el('div', { class: 'svarknapper' },
          el('button', { class: 'liten stille', onclick: () => {
            const felt = el('textarea', { placeholder: k.ja });
            rad.append(felt, el('button', { class: 'liten', onclick: () => {
              if (felt.value.trim()) lagre(felt.value);
            } }, 'Lagre'));
          } }, 'Ja'),
          el('button', { class: 'liten stille', onclick: () => lagre(k.nei) }, 'Nei'))),
      feilRom);
    kort.append(rad);
  }
  rot.append(kort);
}

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
  await tegnBeredskap(rot, elementer);
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
    // Veiledningen står ved siden av valget, ikke i en hjelpeside. Det er her
    // brukeren er i ferd med å skrive noe hen tror er bindende.
    const hjelp = el('p', { class: 'kategorihjelp' }, KATEGORI_HJELP[kategori.value] || '');
    hjelp.hidden = !KATEGORI_HJELP[kategori.value];
    kategori.addEventListener('change', () => {
      hjelp.textContent = KATEGORI_HJELP[kategori.value] || '';
      hjelp.hidden = !KATEGORI_HJELP[kategori.value];
    });
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
      el('label', {}, 'Kategori'), kategori, hjelp,
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
  tegnKjenteSporsmaal(rot, elementer, () => vis(rot));

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

  await tegnDeling(rot);

  // Dine data: portabilitet og sletterett
  rot.append(el('div', { class: 'kort' },
    el('h3', {}, 'Dine data'),
    el('p', { class: 'meta' },
      'Du kan ta med deg alt når som helst. Du får én fil du åpner i nettleseren — '
      + 'uten nett og uten oss. Skriv sikkerhetsfrasen i fila, så åpnes også det '
      + 'sensitive innholdet.'),
    el('a', { class: 'knapp', href: '/api/eksport', download: 'livsarkivet-eksport.html' },
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
