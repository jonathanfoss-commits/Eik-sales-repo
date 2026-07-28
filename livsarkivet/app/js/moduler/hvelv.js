// Eierens hvelv: elementer per kategori, opprett/endre/slett.
import { kall } from '../api.js';
import { el, tom, KATEGORI_NAVN, KATEGORI_HJELP } from '../dom.js';
import { hentHvelvnokkel, gjenopprettMedKode, harMinNokkel, sikreMinNokkel } from '../frase.js';
import { krypterElement, dekrypterElement } from '../krypto.js';
import {
  kort, knapp, felt, tomtilstand, feilboks, okboks, sidetopp, panel, rutenett, medTilstand,
} from '../komponenter.js';
import { tegn as tegnBeredskap } from './beredskap.js';

// Deling med eget forsikringsselskap. Vises KUN når kunden faktisk hører til
// et selskap — for en kunde som kom inn via livsarkivet.no finnes det ingen
// å dele med, og da skal kortet ikke stå der og forvirre.
function tegnDeling(rot, deling, oppdater) {
  const selskap = deling?.selskap;
  if (!selskap) return;
  const { delinger = [], felttyper = {} } = deling;
  const aktive = new Map(delinger.map((d) => [d.felttype, d]));

  const boks = kort({
    tittel: `Delt med ${selskap.navn}`,
    meta: `Du bestemmer selv hva ${selskap.navn} får se. Resten av arkivet er stengt `
      + 'for dem — også etter at du er borte. Du kan trekke tilbake når som helst.',
  });

  for (const [type, etikett] of Object.entries(felttyper)) {
    const delt = aktive.get(type);
    // ingen placeholder: etiketten står rett over, og gjentakelsen støyer bare
    const verdifelt = felt({ etikett, verdi: delt?.verdi || '' });
    boks.append(el('div', { class: 'delingsrad' },
      verdifelt,
      el('div', { class: 'knapperad' },
        delt
          ? knapp({ tekst: 'Slutt å dele', rolle: 'fare', storrelse: 'liten', onclick: async () => {
            if (!confirm(`Slutte å dele ${etikett.toLowerCase()} med ${selskap.navn}?`)) return;
            await kall('DELETE', `/api/deling/${delt.id}`);
            oppdater();
          } })
          : knapp({ tekst: 'Del', rolle: 'sekundaer', storrelse: 'liten', onclick: async () => {
            if (!verdifelt.inn.value.trim()) return;
            await kall('POST', '/api/deling', { felttype: type, verdi: verdifelt.inn.value });
            oppdater();
          } }))));
  }
  rot.append(boks);
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

  const boks = kort({
    tittel: 'Kjente spørsmål',
    meta: 'Dette leter etterlatte etter. Svarer du nei, slipper de å lete — '
      + 'og det er like nyttig som et ja.',
  });

  for (const k of uavklart) {
    const feilRom = el('div', {});
    let svarfelt = null;
    const lagre = async (innhold) => {
      const svar = await kall('POST', '/api/elementer',
        { kategori: k.kategori, nivaa: 'privat', tittel: k.tittel, innhold });
      if (!svar.ok) {
        feilRom.replaceChildren(feilboks({ tekst: svar.data.feil || 'Kunne ikke lagre' }));
        return;
      }
      oppdater();
    };
    const rad = el('div', { class: 'sporsmaal' },
      el('div', { class: 'rad' },
        el('strong', {}, k.tittel),
        el('div', { class: 'svarknapper' },
          knapp({ tekst: 'Ja', rolle: 'stille', storrelse: 'liten', onclick: () => {
            // Andre trykk skal ikke legge et TOMT felt oppå det du allerede
            // har skrevet i. Første versjon la til et nytt tekstfelt hver gang,
            // så et dobbelttrykk kastet teksten uten å si fra.
            if (svarfelt) { svarfelt.inn.focus(); return; }
            svarfelt = felt({ etikett: k.ja, flerlinje: true });
            rad.append(svarfelt, el('div', { class: 'knapperad' },
              knapp({ tekst: 'Lagre', rolle: 'sekundaer', storrelse: 'liten', onclick: () => {
                if (svarfelt.inn.value.trim()) lagre(svarfelt.inn.value);
              } })));
            svarfelt.inn.focus();
          } }),
          knapp({ tekst: 'Nei', rolle: 'stille', storrelse: 'liten',
            onclick: () => lagre(k.nei) }))),
      feilRom);
    boks.append(rad);
  }
  rot.append(boks);
}

export async function vis(rot) {
  tom(rot);
  rot.append(sidetopp({
    tittel: 'Hvelvet ditt',
    undertekst: 'Det dine nærmeste vil trenge. Ingenting deles før en verifisert '
      + 'hendelse og karenstid.',
  }));

  // Alt flaten trenger hentes i ett — da kan medTilstand vise skjelett mens det
  // står på, og en feilboks med «Prøv igjen» hvis linjen ryker.
  const hent = async () => {
    const [abo, hvelv, deling, harNokkel] = await Promise.all([
      kall('GET', '/api/abonnement'),
      kall('GET', '/api/hvelv'),
      kall('GET', '/api/deling'),
      harMinNokkel(),
    ]);
    return {
      abo: abo.data.abonnement,
      elementer: hvelv.data.elementer || [],
      deling: deling.data,
      harNokkel,
    };
  };

  await medTilstand(rot, hent, async (plass, data) => {
    const { abo, elementer, harNokkel } = data;
    const nett = rutenett();
    plass.append(nett);

    // abonnementsstatus — redigering portes, aldri frigivelse eller lesing
    if (abo && !abo.aktivNaa) {
      const boks = feilboks({ tekst: 'Prøveperioden er over. Alt du har lagt inn er trygt, og frigivelsen til dine nærmeste påvirkes aldri — men for å gjøre endringer må abonnementet aktiveres.' });
      boks.classList.add('bred');
      if (abo.stripeKlar) {
        boks.append(knapp({ tekst: 'Aktiver abonnement', rolle: 'sekundaer', onclick: async () => {
          const svar = await kall('POST', '/api/abonnement/checkout');
          if (svar.ok && svar.data.url) location.href = svar.data.url;
        } }));
      }
      nett.append(boks);
    } else if (abo?.status === 'proveperiode') {
      nett.append(el('p', { class: 'undertekst bred' },
        `Prøveperiode til ${new Date(abo.proveperiodeSlutt).toLocaleDateString('nb-NO')}.`));
    }

    const beredskapRom = el('div', {});
    nett.append(beredskapRom);
    await tegnBeredskap(beredskapRom, elementer);

    // nøkkelkort: uten eget nøkkelpar kan ingen dele sensitivt innhold med deg
    const gjenopprett = knapp({ tekst: 'Bruk gjenopprettingskode', rolle: 'stille',
      storrelse: 'liten', onclick: gjenopprettMedKode });
    nett.append(harNokkel
      ? kort({ tittel: 'Sikkerhetsfrase',
        meta: 'Glemt frasen? Gjenopprettingskoden setter en ny.' },
      el('div', { class: 'knapperad' }, gjenopprett))
      : kort({ tittel: 'Sett sikkerhetsfrase',
        meta: 'Trengs for at andre skal kunne dele sensitivt innhold med deg. '
          + 'Frasen forlater aldri enheten din.' },
      el('div', { class: 'knapperad' },
        knapp({ tekst: 'Sett frase nå', rolle: 'sekundaer', storrelse: 'liten',
          onclick: async () => { if (await sikreMinNokkel()) vis(rot); } }),
        gjenopprett)));

    // Elementlisten er flatens hovedsak og får hele bredden; skjemaet under den
    // holdes på lesebredde — et tekstfelt på 1180 px er ingen forbedring.
    const listeRom = el('div', { class: 'bred stabel' });
    nett.append(listeRom);
    const skjemaBoks = el('div', { class: 'smal' });
    const nyKnappBoks = el('div', { class: 'smal' });

    function tegnListe() {
      tom(listeRom);
      if (!elementer.length) {
        listeRom.append(tomtilstand({
          tittel: 'Tomt ennå',
          tekst: 'Start med det praktiske: strøm, forsikring, hvor viktige papirer ligger.',
        }));
      }
      // Kategoriene flyter i et rutenett i stedet for å stables. De fleste har
      // ett eller to elementer, så stablet ble desktop én lang venstrekolonne
      // med to tredeler av flaten tom.
      const grupper = new Map();
      for (const e of elementer) {
        if (!grupper.has(e.kategori)) grupper.set(e.kategori, []);
        grupper.get(e.kategori).push(e);
      }
      const rist = el('div', { class: 'kategoririst' });
      for (const [kategori, i] of grupper) {
        rist.append(panel({ tittel: KATEGORI_NAVN[kategori] || kategori },
          ...i.map((e) => kort({
            tittel: e.tittel,
            meta: `nivå: ${e.nivaa}`,
            merke: knapp({ tekst: 'Endre', rolle: 'sekundaer', storrelse: 'liten',
              onclick: () => tegnSkjema(e) }),
          }))));
      }
      listeRom.append(rist, skjemaBoks, nyKnappBoks);
    }

    function tegnSkjema(eksisterende) {
      tom(skjemaBoks);
      // Skjemaets «Lagre» er skjermens primærknapp mens den står åpen, så
      // «Legg til element» viker til man avbryter eller lagrer.
      tom(nyKnappBoks);
      const e = eksisterende || {};
      const kategori = el('select', { id: 'skjema-kategori' },
        ...Object.entries(KATEGORI_NAVN).map(([verdi, navn]) =>
          el('option', { value: verdi, selected: e.kategori === verdi }, navn)));
      const nivaa = el('select', { id: 'skjema-nivaa' },
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
      const tittel = felt({ etikett: 'Tittel', verdi: e.tittel || '' });
      const innholdFelt = felt({ etikett: 'Innhold', flerlinje: true,
        plassholder: 'Det de trenger å vite …' });
      innholdFelt.inn.value = e.kryptert ? '' : (e.innhold || '');
      const feilRom = el('div', {});
      if (e.kryptert) {
        innholdFelt.inn.placeholder = 'Kryptert — trykk «Lås opp» for å se innholdet';
        feilRom.append(knapp({ tekst: 'Lås opp', rolle: 'sekundaer', storrelse: 'liten', onclick: async () => {
          const hn = await hentHvelvnokkel();
          if (!hn) return;
          try {
            innholdFelt.inn.value = await dekrypterElement(hn, e.innhold, e.nokkel_ref);
          } catch { feilRom.append(feilboks({ tekst: 'Kunne ikke låse opp innholdet' })); }
        } }));
      }

      skjemaBoks.append(kort({ tittel: e.id ? 'Endre element' : 'Nytt element' },
        feilRom,
        el('div', { class: 'felt' },
          el('label', { for: 'skjema-kategori' }, 'Kategori'), kategori, hjelp),
        el('div', { class: 'felt' },
          el('label', { for: 'skjema-nivaa' }, 'Nivå'), nivaa),
        tittel, innholdFelt,
        el('div', { class: 'knapperad' },
          knapp({ tekst: 'Lagre', onclick: async () => {
            const kropp = { kategori: kategori.value, nivaa: nivaa.value,
              tittel: tittel.inn.value, innhold: innholdFelt.inn.value };
            // sensitivt krypteres HER — serveren ser aldri klarteksten
            if (nivaa.value === 'sensitiv') {
              const hn = await hentHvelvnokkel();
              if (!hn) return;
              const kryptert = await krypterElement(hn, innholdFelt.inn.value);
              kropp.innhold = kryptert.innhold;
              kropp.nokkelRef = kryptert.nokkelRef;
              kropp.kryptert = true;
            }
            const svar = e.id
              ? await kall('PUT', `/api/elementer/${e.id}`, { ...kropp, versjon: e.versjon })
              : await kall('POST', '/api/elementer', kropp);
            if (!svar.ok) {
              tom(feilRom);
              feilRom.append(feilboks({ tekst: svar.data.feil || 'Lagring feilet' }));
              return;
            }
            vis(rot);
          } }),
          e.id ? knapp({ tekst: 'Slett', rolle: 'fare', onclick: async () => {
            if (!confirm('Slette elementet?')) return;
            await kall('DELETE', `/api/elementer/${e.id}`);
            vis(rot);
          } }) : null,
          knapp({ tekst: 'Avbryt', rolle: 'sekundaer',
            onclick: () => { tom(skjemaBoks); tegnNyKnapp(); } }))));
    }

    function tegnNyKnapp() {
      tom(nyKnappBoks);
      nyKnappBoks.append(knapp({ tekst: '+ Legg til element',
        onclick: () => tegnSkjema() }));
    }

    tegnListe();
    tegnNyKnapp();
    tegnKjenteSporsmaal(nett, elementer, () => vis(rot));
    tegnDeling(nett, data.deling, () => vis(rot));

    // Bytt passord
    const passordFeil = el('div', {});
    const gammelt = felt({ etikett: 'Nåværende passord', type: 'password',
      autocomplete: 'current-password' });
    const nytt = felt({ etikett: 'Nytt passord', hjelp: 'Minst 10 tegn.', type: 'password',
      autocomplete: 'new-password' });
    nett.append(kort({ tittel: 'Bytt passord',
      meta: 'Andre enheter blir logget ut når du bytter.' },
    passordFeil, gammelt, nytt,
    el('div', { class: 'knapperad' },
      knapp({ tekst: 'Lagre nytt passord', rolle: 'sekundaer', onclick: async () => {
        const svar = await kall('POST', '/api/auth/passord',
          { gammelt: gammelt.inn.value, nytt: nytt.inn.value });
        tom(passordFeil);
        if (!svar.ok) {
          passordFeil.append(feilboks({ tekst: svar.data.feil || 'Bytte feilet' }));
          return;
        }
        gammelt.inn.value = ''; nytt.inn.value = '';
        passordFeil.append(okboks('Passordet er byttet.'));
      } }))));

    // Dine data: portabilitet og sletterett
    nett.append(kort({ tittel: 'Dine data',
      meta: 'Du kan ta med deg alt når som helst. Du får én fil du åpner i nettleseren — '
        + 'uten nett og uten oss. Skriv sikkerhetsfrasen i fila, så åpnes også det '
        + 'sensitive innholdet.' },
    el('div', { class: 'knapperad' },
      el('a', { class: 'knapp k-sekundaer', href: '/api/eksport',
        download: 'livsarkivet-eksport.html' }, 'Last ned alt'),
      knapp({ tekst: 'Slett kontoen min', rolle: 'fare', onclick: async () => {
        if (!confirm('Slette kontoen og HELE arkivet? Dette kan ikke angres, og '
          + 'dine nærmeste får da ingenting.')) return;
        const passord = prompt('Skriv passordet ditt for å bekrefte slettingen:');
        if (!passord) return;
        const svar = await kall('POST', '/api/konto/slett', { passord });
        if (!svar.ok) { alert(svar.data.feil || 'Sletting feilet'); return; }
        alert('Kontoen og arkivet er slettet.');
        location.hash = '';
        location.reload();
      } }))));
  }, { linjer: 5 });
}
