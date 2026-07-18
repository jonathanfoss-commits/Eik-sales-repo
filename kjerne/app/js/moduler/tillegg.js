/* Modul: Tilleggsfangeren — «vi tar det på regning» fanget på 20 sekunder.
   DELT: hele laget ser hva som er avtalt; fakturagrunnlaget henter ledelsen
   i Sentral. Skjemaet bor i pluss-menyen; listen vises på Hjem. */
(function () {
  const { el, siFra, åpneArk, lukkArk, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '➕ Tilleggsarbeid'));
    rot.append(el('div', { klasse: 'under' },
      'Fang avtalen FØR den glemmes — muntlige tillegg som aldri faktureres er penger rett ut.'));
    const s = Kjerne.byggSkjema([
      { navn: 'prosjekt', etikett: 'Prosjekt', plass: 'f.eks. Krohgs gate 60', kreves: true },
      { navn: 'avtalt_med', etikett: 'Avtalt med', plass: 'f.eks. byggherre Berg' },
      { navn: 'tekst', etikett: 'Hva ble avtalt?', type: 'textarea',
        plass: 'f.eks. flytte sluk 40 cm — tas på regning', kreves: true },
    ]);
    rot.append(s.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.prosjekt || !v.tekst) return siFra('Prosjekt og avtale må med', true);
      try {
        const res = await Api.sendEllerKø('/api/tillegg', v, 'tillegg ' + v.prosjekt);
        lukkArk();
        siFra(res.sendt ? 'Tillegget er fanget — laget ser det nå' : 'Ingen dekning — ligger trygt i kø');
        Kjerne.oppdaterFane();
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Fang tillegget'));
    åpneArk(rot);
  }

  Kjerne.registrerModul('tillegg', { vis: async () => {}, skjema });
  registrerPluss({ modul: 'tillegg', tittel: '➕ Tillegg', under: '«vi tar det på regning»', gjør: skjema });
})();
