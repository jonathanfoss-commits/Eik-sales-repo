// Beredskapsscore: hvor klart er arkivet egentlig?
//
// BEVISST REGELBASERT, ikke AI. Scoren skal være forklarlig og lik for alle:
// brukeren skal kunne se nøyaktig hvorfor den er 4 av 6, og hva som gjør den
// til 5. En AI-generert score ingen kan begrunne er verre enn ingen score.
//
// Den viser ÉN neste handling, aldri en liste over mangler. En liste over alt
// du ikke har gjort er grunnen til at folk lukker appen — og målgruppen her
// gruer seg til oppgaven fra før.
import { kall } from '../api.js';
import { el } from '../dom.js';
import { harMinNokkel } from '../frase.js';

const AAR = 365 * 24 * 3600_000;

// Rekkefølgen ER prioriteringen: den første uoppfylte regelen blir neste
// handling. Derfor står det som gjør arkivet BRUKBART før det som gjør det
// fullstendig — et arkiv uten betrodd kontakt kan aldri åpnes, uansett hvor
// mye som ligger i det.
function regler({ elementer, folk, rader, harNokkel }) {
  const nyeste = elementer.reduce(
    (t, e) => Math.max(t, new Date(e.endret || e.opprettet).getTime()), 0);
  return [
    { id: 'innhold', ok: elementer.length > 0,
      navn: 'Noe i hvelvet',
      gjor: 'Legg inn det første: hvor nøklene er, eller hvem som må varsles.' },
    { id: 'betrodd', ok: folk.some((k) => k.er_betrodd),
      navn: 'Minst én betrodd kontakt',
      gjor: 'Uten en betrodd kontakt kan ingen melde fra når det skjer. '
        + 'Legg til én du stoler på.' },
    { id: 'matrise', ok: rader.length > 0,
      navn: 'Noen er pekt ut som mottaker',
      gjor: 'Ingen får se noe ennå. Velg under «Hvem får hva» hvem som skal '
        + 'ha hva.' },
    { id: 'praktisk', ok: elementer.some((e) => e.kategori === 'praktisk'),
      navn: 'Det praktiske er dekket',
      gjor: 'Legg inn det praktiske — nøkler, strøm, hvem som tar kjæledyret. '
        + 'Det er dette de trenger første døgnet.' },
    { id: 'frase', ok: harNokkel,
      navn: 'Sikkerhetsfrase satt',
      gjor: 'Sett en sikkerhetsfrase, så kan du legge inn sensitivt innhold '
        + 'som bare du og mottakerne dine kan åpne.' },
    { id: 'ferskt', ok: nyeste > 0 && Date.now() - nyeste < AAR,
      navn: 'Gjennomgått siste året',
      gjor: 'Det er over et år siden noe ble oppdatert. Gå gjennom og bekreft '
        + 'at det fortsatt stemmer — et utdatert arkiv er verre enn ingen, '
        + 'fordi familien stoler på det.' },
  ];
}

export async function tegn(rot, elementer) {
  const [kontakter, matrise, harNokkel] = await Promise.all([
    kall('GET', '/api/kontakter'), kall('GET', '/api/matrise'), harMinNokkel()]);

  const liste = regler({
    elementer,
    folk: kontakter.data?.kontakter || [],
    rader: matrise.data?.matrise || [],
    harNokkel,
  });
  const oppfylt = liste.filter((r) => r.ok);
  const neste = liste.find((r) => !r.ok);

  const kort = el('div', { class: 'kort beredskap' },
    el('div', { class: 'mono' }, 'Beredskap'),
    el('div', { class: 'score' },
      String(oppfylt.length), el('span', { class: 'av' }, `av ${liste.length}`)),
    el('div', { class: 'stolper' },
      ...liste.map((r) => el('span', { class: `stolpe${r.ok ? ' fylt' : ''}`,
        title: r.navn }))));

  kort.append(neste
    ? el('p', { class: 'neste' }, el('strong', {}, `Neste: ${neste.navn}. `), neste.gjor)
    : el('p', { class: 'neste' },
      el('strong', {}, 'Arkivet er klart. '),
      'Vi minner deg om å gå gjennom det én gang i året — det er det som '
      + 'gjør at det fortsatt stemmer den dagen det trengs.'));

  rot.append(kort);
}
