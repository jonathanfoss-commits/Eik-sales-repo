/* Modul: Skrivemotoren — ferdige utkast rett i appen, uten at brukeren ser
   noen AI-leverandør. Evnene kommer fra tenant-konfigen via serveren.
   Personvern: teksten sendes KUN når brukeren aktivt trykker knappen. */
(function () {
  const { el, siFra, åpneArk, registrerPluss } = Kjerne;

  async function skjema() {
    let evner = {};
    let tilgjengelig = true;
    try {
      const svar = await Api.hent('/api/skriv/evner');
      evner = svar.evner || {};
      tilgjengelig = svar.tilgjengelig;
    } catch (feil) { return siFra(feil.message, true); }

    const rot = el('div');
    rot.append(el('h2', {}, '⚡ Lag utkast'));
    rot.append(el('div', { klasse: 'under' }, 'Dikter med mikrofonen på tastaturet, eller skriv rått — så ryddes det.'));
    const s = Kjerne.byggSkjema([
      { navn: 'evne', etikett: 'Hva skal skrives?', type: 'select',
        valg: Object.entries(evner).map(([id, e]) => ({ verdi: id, tekst: e.navn })) },
      { navn: 'tekst', etikett: 'Rått innhold', type: 'textarea', plass: 'alt du husker — navn, tall, datoer …' },
    ]);
    rot.append(s.rot);
    const ut = el('div', { klasse: 'utkast-ut', style: 'display:none' });
    const kopier = el('button', { klasse: 'knapp svak', style: 'display:none;margin-top:8px', onclick: () => {
      navigator.clipboard?.writeText(ut.textContent).then(() => siFra('Utkastet er kopiert — les over før du sender'));
    } }, 'Kopier');
    const knapp = el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.tekst) return siFra('Skriv eller dikter først', true);
      knapp.disabled = true;
      knapp.textContent = 'Skriver …';
      try {
        const svar = await Api.post('/api/skriv', { evne: v.evne, tekst: v.tekst });
        ut.textContent = svar.tekst;
        ut.style.display = 'block';
        kopier.style.display = 'inline-block';
        siFra('Utkastet er klart — les over før du sender');
      } catch (feil) {
        siFra(feil.message, true);
      } finally {
        knapp.disabled = false;
        knapp.textContent = '⚡ Lag utkast';
      }
    } }, '⚡ Lag utkast');
    if (!tilgjengelig) {
      rot.append(el('div', { klasse: 'under', style: 'color:var(--varsel)' },
        'Skrivemotoren er ikke koblet til på denne serveren ennå — knappen svarer med beskjed.'));
    }
    rot.append(knapp, ut, kopier);
    rot.append(el('p', { klasse: 'under', style: 'margin-top:10px' },
      'Teksten sendes kryptert kun når du trykker knappen — lagres ingen steder og brukes aldri til trening.'));
    åpneArk(rot);
  }

  Kjerne.registrerModul('skriv', { vis: async () => {} }); // ingen fane — bor i pluss-menyen
  registrerPluss({ modul: 'skriv', tittel: '⚡ Utkast', under: 'tilbud, varsel, purring …', gjør: skjema });
})();
