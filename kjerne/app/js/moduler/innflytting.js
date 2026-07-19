/* Modul: Innflyttingen — importerer eksporten fra den gamle appen
   (app/eksport.html på Netlify). Forhåndsvisning før import, kvittering etter.
   Tap av pilotdata er ikke akseptabelt: alt som ikke importeres, listes åpent. */
(function () {
  const { el, siFra, åpneArk, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '📦 Innflytting fra den gamle appen'));
    rot.append(el('div', { klasse: 'under' },
      '1) Åpne eksport-siden i den gamle appen · 2) Kopier eksporten · 3) Lim inn her.'));
    const felt = el('textarea', { klasse: 'felt', placeholder: 'Lim inn eksporten (JSON) her …',
      style: 'min-height:120px' });
    rot.append(felt);
    const forhånd = el('div', { klasse: 'under', style: 'margin-top:8px' });
    rot.append(forhånd);
    felt.addEventListener('input', () => {
      try {
        const data = JSON.parse(felt.value);
        const timer = Array.isArray(data.timer) ? data.timer.length : 0;
        const andre = Object.keys(data).filter((k) => !['timer', 'eksportert', 'versjon'].includes(k));
        forhånd.textContent = `Klart til import: ${timer} timeføring(er) (privat + ledelse)` +
          (andre.length ? ` · ${andre.length} andre felt følges opp i kvitteringen` : '');
      } catch { forhånd.textContent = felt.value.trim() ? 'Ikke gyldig eksport ennå — lim inn hele teksten.' : ''; }
    });
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      let data;
      try { data = JSON.parse(felt.value); } catch { return siFra('Lim inn hele eksporten først', true); }
      try {
        const svar = await Api.post('/api/innflytting', { data });
        const k = svar.kvittering;
        const linjer = [`✓ ${k.timer.inn} timeføring(er) importert` +
          (k.timer.hoppet ? ` (${k.timer.hoppet} fantes fra før / ugyldige)` : '')];
        for (const h of k.hoppetOver) linjer.push(`— ${h.felt}: ${h.antall} stk. ikke importert (${h.hvorfor})`);
        rot.append(el('div', { klasse: 'utkast-ut' }, linjer.join('\n')));
        siFra('Innflyttingen er utført — se kvitteringen');
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Importer'));
    åpneArk(rot);
  }

  Kjerne.registrerModul('innflytting', { vis: async () => {} }); // ingen fane
  registrerPluss({ modul: 'innflytting', tittel: '📦 Innflytting', under: 'hent pilotdataene dine', gjør: skjema });
})();
