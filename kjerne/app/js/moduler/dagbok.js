/* Modul: Byggedagbok — DELT, live. Tidsnære bevis: faktabasert, aldri pynt.
   Egne linjer kan rettes (med versjonsvern) — aldri slettes. */
(function () {
  const { el, siFra, åpneArk, lukkArk, penDato, nårSiden, iDag, registrerModul, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '📓 Ny dagboklinje'));
    rot.append(el('div', { klasse: 'under' },
      'Dagboka er bevismateriale — kort og faktabasert. Hele laget ser linjen med en gang.'));
    const s = Kjerne.byggSkjema([
      { navn: 'prosjekt', etikett: 'Prosjekt', plass: 'f.eks. Krohgs gate 60', kreves: true },
      { navn: 'tekst', etikett: 'Hva skjedde?', type: 'textarea',
        plass: 'Utført arbeid, mannskap, vær, leveranser, hindringer, beskjeder …', kreves: true },
    ]);
    rot.append(s.rot);
    // Autopiloten: dagsutkast av dagens timer/varsler/tillegg — du godkjenner
    rot.append(el('button', { klasse: 'knapp svak', style: 'margin-top:8px;width:100%', onclick: async () => {
      try {
        const auto = await Api.hent('/api/dagbok/autopilot');
        if (!auto.antallKilder) return siFra('Ingen registreringer i dag ennå — autopiloten har ingenting å sy av');
        if (auto.prosjekt && !s.inputs.prosjekt.value) s.inputs.prosjekt.value = auto.prosjekt;
        s.inputs.tekst.value = auto.utkast;
        siFra(`Utkast sydd av ${auto.antallKilder} registrering(er) — les over og juster`);
      } catch (feil) { siFra(feil.message, true); }
    } }, '🪄 Sy dagens utkast (autopilot)'));
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.prosjekt || !v.tekst) return siFra('Prosjekt og tekst må med', true);
      try {
        const res = await Api.sendEllerKø('/api/dagbok',
          { dato: iDag(), prosjekt: v.prosjekt, tekst: v.tekst }, 'dagboklinje');
        lukkArk();
        siFra(res.sendt ? 'Linjen er i dagboka — hele laget ser den nå'
          : 'Ingen dekning — linjen ligger trygt i kø');
        Kjerne.oppdaterFane();
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Før i dagboka'));
    åpneArk(rot);
  }

  function rediger(l) {
    const rot = el('div');
    rot.append(el('h2', {}, 'Rett linjen'));
    const s = Kjerne.byggSkjema([{ navn: 'tekst', etikett: 'Tekst', type: 'textarea', verdi: l.tekst }]);
    rot.append(s.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      try {
        await Api.put('/api/dagbok/' + l.id, { tekst: s.verdier().tekst, versjon: l.versjon });
        lukkArk();
        siFra('Linjen er rettet');
        Kjerne.oppdaterFane();
      } catch (feil) {
        if (feil.status === 409 && feil.data?.linje) {
          siFra('Endret av noen andre imens — prøv igjen med ferske data', true);
          lukkArk(); Kjerne.oppdaterFane();
        } else siFra(feil.message, true);
      }
    } }, 'Lagre rettelsen'));
    åpneArk(rot);
  }

  async function vis(rot) {
    rot.textContent = '';
    const svar = await Api.hent('/api/dagbok?dager=14');
    const kort = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' }, el('h2', {}, '📓 Byggedagboka'),
        el('span', { klasse: 'niva' }, 'delt · live')),
      el('div', { klasse: 'under' }, 'Siste 14 dager. Tidsnære notater vinner tvister.'));
    const megNavn = Kjerne.meg()?.navn;
    if (!svar.linjer.length) kort.append(el('div', { klasse: 'under' }, 'Ingen linjer ennå.'));
    let sistDato = '';
    for (const l of svar.linjer) {
      if (l.dato !== sistDato) {
        sistDato = l.dato;
        kort.append(el('div', { klasse: 'mono', style: 'font-size:.6rem;letter-spacing:.14em;color:var(--dis);margin-top:12px' },
          penDato(l.dato).toUpperCase()));
      }
      const rad = el('div', { klasse: 'linje' },
        el('span', { klasse: 'hvem' }, (l.bruker_navn || '').split(' ')[0] + ' · ' + nårSiden(l.endret)),
        el('span', { style: 'flex:1' }, l.prosjekt + ': ' + l.tekst));
      if (l.bruker_navn === megNavn) {
        rad.append(el('button', { klasse: 'lenkeknapp', style: 'width:auto', onclick: () => rediger(l) }, 'rett'));
      }
      kort.append(rad);
    }
    kort.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: skjema }, 'Ny linje'));
    rot.append(kort);
    if (svar._fraCache) rot.append(el('div', { klasse: 'under' }, 'Uten dekning — viser sist lagrede data.'));
  }

  registrerModul('dagbok', { tittel: 'Dagbok', ikon: '📓', vis });
  registrerPluss({ modul: 'dagbok', tittel: '📓 Dagbok', under: '30 sek — gull ved tvist', gjør: skjema });
})();
