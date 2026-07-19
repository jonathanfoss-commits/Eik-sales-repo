/* Modul: Fristvakta — overtakelsesdato inn, preklusive nedtellinger ut
   (NS 8407: sluttoppstilling 2 mnd., søksmål 8 mnd.). DELT; listen på Hjem. */
(function () {
  const { el, siFra, åpneArk, lukkArk, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '⏳ Fristvakta'));
    rot.append(el('div', { klasse: 'under' },
      'Oversittes de preklusive fristene, er kravet tapt uansett kvalitet. Registrér overtakelsen — appen teller ned.'));
    const s = Kjerne.byggSkjema([
      { navn: 'prosjekt', etikett: 'Prosjekt', kreves: true },
      { navn: 'overtakelse', etikett: 'Overtakelsesdato', type: 'date', kreves: true },
    ]);
    rot.append(s.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.prosjekt || !v.overtakelse) return siFra('Prosjekt og dato må med', true);
      try {
        const res = await Api.sendEllerKø('/api/frister', v, 'frist ' + v.prosjekt);
        lukkArk();
        siFra(res.sendt ? 'Fristvakta teller ned for ' + v.prosjekt : 'Ingen dekning — ligger trygt i kø');
        Kjerne.oppdaterFane();
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Start nedtellingen'));
    åpneArk(rot);
  }

  Kjerne.registrerModul('frister', { vis: async () => {}, skjema });
  registrerPluss({ modul: 'frister', tittel: '⏳ Fristvakt', under: 'overtakelse → nedtelling', gjør: skjema });
})();
