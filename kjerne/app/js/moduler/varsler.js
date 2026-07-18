/* Modul: Varsler — varemottak-avvik og endringsvarsler. DELT, live, med
   statusløp så ingenting dør i en innboks. */
(function () {
  const { el, siFra, åpneArk, lukkArk, nårSiden, registrerModul, registrerPluss } = Kjerne;
  const NESTE = { meldt: 'sendt', sendt: 'svart', svart: 'rettet' };
  const ETIKETT = { meldt: 'MELDT', sendt: 'SENDT', svart: 'SVART', rettet: 'RETTET', kreditert: 'KREDITERT' };

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '📦 Nytt varsel'));
    rot.append(el('div', { klasse: 'under' },
      'Varemottak: meld avviket FØR du signerer følgeseddelen. Endring: varsle byggherren SAMME DAG (NS 8407).'));
    const s = Kjerne.byggSkjema([
      { navn: 'type', etikett: 'Type', type: 'select', valg: [
        { verdi: 'varemottak', tekst: 'Varemottak — avvik i leveranse' },
        { verdi: 'endringsvarsel', tekst: 'Endringsvarsel — NS 8407' }] },
      { navn: 'prosjekt', etikett: 'Prosjekt', kreves: true },
      { navn: 'leverandor', etikett: 'Leverandør / byggherre' },
      { navn: 'tekst', etikett: 'Hva gjelder det?', type: 'textarea', kreves: true },
    ]);
    rot.append(s.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.prosjekt || !v.tekst) return siFra('Prosjekt og tekst må med', true);
      try {
        const res = await Api.sendEllerKø('/api/varsler', v, 'varsel ' + v.prosjekt);
        lukkArk();
        siFra(res.sendt ? 'Varselet er logget — laget ser det nå' : 'Ingen dekning — ligger trygt i kø');
        Kjerne.oppdaterFane();
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Logg varselet'));
    åpneArk(rot);
  }

  async function vis(rot) {
    rot.textContent = '';
    const svar = await Api.hent('/api/varsler');
    const kort = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' }, el('h2', {}, '📦 Varsler og avvik'),
        el('span', { klasse: 'niva' }, 'delt · live')));
    if (!svar.varsler.length) kort.append(el('div', { klasse: 'under' }, 'Ingen varsler — godt tegn.'));
    for (const v of svar.varsler) {
      const rad = el('div', { klasse: 'linje' },
        el('span', { klasse: 'niva' }, ETIKETT[v.status] || v.status),
        el('span', { style: 'flex:1' },
          (v.type === 'endringsvarsel' ? '⚠ ' : '') + v.prosjekt +
          (v.leverandor ? ' · ' + v.leverandor : '') + ': ' + v.tekst.slice(0, 80)),
        el('span', { klasse: 'hvem' }, (v.bruker_navn || '').split(' ')[0] + ' · ' + nårSiden(v.opprettet)));
      if (NESTE[v.status]) {
        rad.append(el('button', { klasse: 'lenkeknapp', style: 'width:auto', onclick: async () => {
          await Api.post(`/api/varsler/${v.id}/status`, { status: NESTE[v.status] })
            .then(() => Kjerne.oppdaterFane())
            .catch((feil) => siFra(feil.message, true));
        } }, '→ ' + ETIKETT[NESTE[v.status]].toLowerCase()));
      }
      kort.append(rad);
    }
    kort.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: skjema }, 'Nytt varsel'));
    rot.append(kort);
  }

  registrerModul('varsler', { tittel: 'Varsler', ikon: '📦', vis });
  registrerPluss({ modul: 'varsler', tittel: '📦 Varsel', under: 'avvik eller endring', gjør: skjema });
})();
