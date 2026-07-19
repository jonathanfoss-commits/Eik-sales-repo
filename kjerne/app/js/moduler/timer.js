/* Modul: Timeføring — PRIVAT + LEDELSE. Én føring per prosjekt/dag; ny lagring
   retter den gamle. Store trykkflater, chips i stedet for tastatur. */
(function () {
  const { el, siFra, åpneArk, lukkArk, penDato, iDag, tall, registrerModul, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '⏱ Før timer'));
    rot.append(el('div', { klasse: 'under' }, 'Lagres én gang per prosjekt per dag — ny lagring retter.'));
    const s = Kjerne.byggSkjema([
      { navn: 'dato', etikett: 'Dato', type: 'date', verdi: iDag(), kreves: true },
      { navn: 'prosjekt', etikett: 'Prosjekt', plass: 'f.eks. Krohgs gate 60', kreves: true },
    ]);
    rot.append(s.rot);
    let verdi = 0;
    const visning = el('div', { klasse: 'stor-tall' }, '0 t');
    rot.append(el('label', { klasse: 'felt' }, 'Timer'));
    rot.append(visning);
    const chips = el('div', { klasse: 'knapp-rad' });
    for (const [tekst, delta] of [['−0,5', -0.5], ['+0,5', 0.5], ['+1', 1], ['7,5 t dag', 'sett']]) {
      chips.append(el('button', { klasse: 'knapp svak', onclick: () => {
        verdi = delta === 'sett' ? 7.5 : Math.max(0, Math.min(24, verdi + delta));
        visning.textContent = tall(verdi) + ' t';
      } }, tekst));
    }
    rot.append(chips);
    const notat = Kjerne.byggSkjema([{ navn: 'notat', etikett: 'Notat (valgfritt)', plass: 'til fakturering' }]);
    rot.append(notat.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.prosjekt) return siFra('Skriv prosjektet først', true);
      if (!(verdi > 0)) return siFra('Legg på timene med knappene', true);
      try {
        const res = await Api.sendEllerKø('/api/timer',
          { dato: v.dato, prosjekt: v.prosjekt, timer: verdi, notat: notat.verdier().notat || null },
          'timeføring ' + v.prosjekt);
        lukkArk();
        siFra(res.sendt ? tall(verdi) + ' t ført på ' + v.prosjekt
          : 'Ingen dekning — føringen ligger trygt i kø');
        Kjerne.oppdaterFane();
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Lagre'));
    rot.append(el('p', { klasse: 'under', style: 'margin-top:10px' },
      'Timene dine ser bare du og ledelsen — aldri kollegaene.'));
    åpneArk(rot);
  }

  async function vis(rot) {
    rot.textContent = '';
    const ledelse = Kjerne.erLedelse();
    const alle = ledelse && rot.dataset.alle === '1';
    const svar = await Api.hent('/api/timer' + (alle ? '?alle=1' : ''));
    const kort = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' },
        el('h2', {}, alle ? '⏱ Lagets timer denne uka' : '⏱ Timene dine denne uka'),
        el('span', { klasse: 'niva privat' }, 'privat + ledelse')),
      el('div', { klasse: 'stor-tall' }, tall(svar.sum) + ' t'));
    if (ledelse) {
      kort.append(el('button', { klasse: 'knapp svak', onclick: () => {
        rot.dataset.alle = alle ? '' : '1';
        vis(rot);
      } }, alle ? 'Vis bare mine' : 'Vis hele laget (ledelse)'));
    }
    rot.append(kort);

    const liste = el('div', { klasse: 'kort' });
    if (!svar.foringer.length) liste.append(el('div', { klasse: 'under' }, 'Ingen føringer ennå denne uka.'));
    for (const f of svar.foringer) {
      liste.append(el('div', { klasse: 'linje' },
        el('span', { klasse: 'hvem' }, penDato(f.dato) + (alle ? ' · ' + (f.bruker_navn || '').split(' ')[0] : '')),
        el('span', { style: 'flex:1' }, f.prosjekt + (f.notat ? ' — ' + f.notat : '')),
        el('b', {}, tall(f.timer) + ' t')));
    }
    liste.append(el('button', { klasse: 'knapp', style: 'margin-top:10px;width:100%', onclick: skjema }, 'Før timer'));
    rot.append(liste);
    if (svar._fraCache) rot.append(el('div', { klasse: 'under' }, 'Uten dekning — viser sist lagrede data.'));
  }

  registrerModul('timer', { tittel: 'Timer', ikon: '⏱', vis });
  registrerPluss({ modul: 'timer', tittel: '⏱ Timer', under: 'før dagens timer', gjør: skjema });
})();
