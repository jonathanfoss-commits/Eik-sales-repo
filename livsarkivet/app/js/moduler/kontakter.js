// Kontaktregisteret: hvem som kan varsle (betrodd) og hvem som kan motta.
import { kall } from '../api.js';
import { el, tom } from '../dom.js';
import {
  kort, knapp, felt, merkelapp, tomtilstand, feilboks, okboks, sidetopp, rutenett, medTilstand,
} from '../komponenter.js';

export async function vis(rot) {
  tom(rot);
  rot.append(sidetopp({
    tittel: 'Kontakter',
    undertekst: 'Betrodde kontakter kan melde fra hvis noe skjer deg. Mottakere får '
      + 'det du velger i «Hvem får hva».',
  }));

  await medTilstand(rot,
    // kall() kaster bare når linjen ryker. Uten egen melding står nettleserens
    // engelske «Failed to fetch» i feilboksen på en flate som ellers er bokmål.
    async () => (await kall('GET', '/api/kontakter').catch(() => {
      throw new Error('Vi fikk ikke kontakt med tjenesten. Kontaktene dine er trygge.');
    })).data.kontakter || [],
    (plass, folk) => {
      const nett = rutenett();
      plass.append(nett);

      if (!folk.length) {
        const tom0 = tomtilstand({
          tittel: 'Ingen kontakter ennå',
          tekst: 'Legg til én du stoler på. Uten en betrodd kontakt er det ingen '
            + 'som kan melde fra når det skjer.',
        });
        tom0.classList.add('bred');
        nett.append(tom0);
      }

      for (const k of folk) {
        const kodeRom = el('div', {});
        nett.append(kort({
          tittel: k.navn,
          meta: k.epost + (k.relasjon ? ` · ${k.relasjon}` : ''),
        },
        el('div', { class: 'knapperad' },
          k.er_betrodd ? merkelapp({ tekst: 'Betrodd', tone: 'ok' }) : null,
          k.koblet
            ? merkelapp({ tekst: 'Koblet til konto' })
            : merkelapp({ tekst: 'Ikke koblet', tone: 'varsel' })),
        el('div', { class: 'knapperad' },
          !k.koblet ? knapp({ tekst: 'Inviter', rolle: 'sekundaer', storrelse: 'liten', onclick: async () => {
            const inv = await kall('POST', `/api/kontakter/${k.id}/invitasjon`);
            tom(kodeRom);
            kodeRom.append(inv.ok
              ? okboks(`Invitasjonskode (vises kun nå): ${inv.data.kode}. Delt på e-post hvis oppsatt — ellers gi den til ${k.navn} selv.`)
              : feilboks({ tekst: inv.data.feil || 'Kunne ikke lage invitasjon' }));
          } }) : null,
          knapp({ tekst: 'Fjern', rolle: 'fare', storrelse: 'liten', onclick: async () => {
            if (!confirm(`Fjerne ${k.navn}?`)) return;
            await kall('DELETE', `/api/kontakter/${k.id}`);
            vis(rot);
          } })),
        kodeRom));
      }

      const navn = felt({ etikett: 'Navn' });
      const epost = felt({ etikett: 'E-post', type: 'email' });
      const relasjon = felt({ etikett: 'Relasjon', hjelp: 'For eksempel datter eller bror.' });
      const betrodd = el('input', { type: 'checkbox', id: 'ny-betrodd' });
      const feilRom = el('div', {});
      nett.append(kort({ tittel: 'Ny kontakt' },
        feilRom, navn, epost, relasjon,
        el('div', { class: 'sjekk' }, betrodd,
          el('label', { for: 'ny-betrodd' }, 'Betrodd — kan melde fra om dødsfall')),
        el('div', { class: 'knapperad' },
          knapp({ tekst: 'Legg til', onclick: async () => {
            const svar = await kall('POST', '/api/kontakter', {
              navn: navn.inn.value,
              epost: epost.inn.value,
              relasjon: relasjon.inn.value,
              erBetrodd: betrodd.checked,
            });
            if (!svar.ok) {
              tom(feilRom);
              feilRom.append(feilboks({ tekst: svar.data.feil || 'Lagring feilet' }));
              return;
            }
            vis(rot);
          } }))));
    }, { linjer: 3 });
}
