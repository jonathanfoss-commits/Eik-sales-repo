/* Modul: Hjem — dagens bilde: siste dagboklinjer (live), egne timer i dag,
   siste panelsvar. Alt innhold hentes bak RLS — aldri fra hendelser. */
(function () {
  const { el, penDato, nårSiden, tall, iDag, registrerModul } = Kjerne;

  async function vis(rot) {
    rot.textContent = '';
    const hilsen = el('div', { klasse: 'kort' },
      el('h2', {}, 'Hei, ' + (Kjerne.meg()?.navn.split(' ')[0] || '') + ' 👋'),
      el('div', { klasse: 'under' },
        'Alt laget registrerer, ser alle med en gang. Det som er privat eller sensitivt, ser bare de som skal.'));
    rot.append(hilsen);

    const [dagbokSvar, timerSvar, innspillSvar] = await Promise.allSettled([
      Api.hent('/api/dagbok?dager=3'),
      Api.hent('/api/timer'),
      Api.hent('/api/innspill'),
    ]);

    if (timerSvar.status === 'fulfilled') {
      const mine = (timerSvar.value.foringer || []).filter((f) => f.dato === iDag());
      const sum = mine.reduce((s, f) => s + Number(f.timer), 0);
      rot.append(el('div', { klasse: 'kort' },
        el('div', { klasse: 'kort-topp' }, el('h3', {}, '⏱ Timene dine i dag'),
          el('span', { klasse: 'niva privat' }, 'privat + ledelse')),
        el('div', { klasse: 'stor-tall' }, tall(sum) + ' t'),
        el('button', { klasse: 'knapp svak', onclick: () => Kjerne.visFane('timer') }, 'Før timer')));
    }

    if (dagbokSvar.status === 'fulfilled') {
      const kort = el('div', { klasse: 'kort' },
        el('div', { klasse: 'kort-topp' }, el('h3', {}, '📓 Siste fra dagboka'),
          el('span', { klasse: 'niva' }, 'delt · live')));
      const linjer = (dagbokSvar.value.linjer || []).slice(0, 4);
      if (!linjer.length) kort.append(el('div', { klasse: 'under' }, 'Ingen linjer ennå — vær den første.'));
      for (const l of linjer) {
        kort.append(el('div', { klasse: 'linje' },
          el('span', { klasse: 'hvem' }, (l.bruker_navn || '').split(' ')[0] + ' · ' + nårSiden(l.opprettet)),
          el('span', {}, l.prosjekt + ': ' + l.tekst.slice(0, 90) + (l.tekst.length > 90 ? '…' : ''))));
      }
      kort.append(el('button', { klasse: 'knapp svak', onclick: () => Kjerne.visFane('dagbok') }, 'Åpne dagboka'));
      rot.append(kort);
    }

    if (innspillSvar.status === 'fulfilled') {
      const besvarte = (innspillSvar.value.innspill || []).filter((i) => i.svar);
      if (besvarte.length) {
        rot.append(el('div', { klasse: 'kort' },
          el('h3', {}, '🗣 Siste svar fra teamet'),
          el('div', { klasse: 'linje' }, el('span', {},
            '«' + besvarte[0].tekst.slice(0, 70) + '» — ' + besvarte[0].svar.slice(0, 120)))));
      }
    }

    if (dagbokSvar.status === 'fulfilled' && dagbokSvar.value._fraCache) {
      rot.append(el('div', { klasse: 'under' }, 'Uten dekning — viser sist lagrede data.'));
    }
  }

  registrerModul('hjem', { tittel: 'Hjem', ikon: '⌂', vis });
})();
