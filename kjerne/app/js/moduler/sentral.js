/* Modul: Kommandosentralen — kun ledelsen (fanen vises ikke for ansatte, og
   serveren/RLS håndhever uansett). AI-kost er kun for admin [JONATHAN]. */
(function () {
  const { el, siFra, nårSiden, registrerModul } = Kjerne;

  async function vis(rot) {
    rot.textContent = '';
    if (!Kjerne.erLedelse()) {
      rot.append(el('div', { klasse: 'kort' }, el('div', { klasse: 'under' }, 'Kommandosentralen er for ledelsen.')));
      return;
    }
    const svar = await Api.hent('/api/sentral');

    const aktivitet = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' }, el('h2', {}, '⚙ Kommandosentralen'),
        el('span', { klasse: 'niva sensitivt' }, 'ledelsen')),
      el('div', { klasse: 'under' },
        `Dagboklinjer siste uke: ${svar.dagbokSisteUke} · hendelser siste 14 dager:`));
    for (const h of svar.hendelser.slice(0, 8)) {
      aktivitet.append(el('div', { klasse: 'linje' },
        el('span', { style: 'flex:1' }, h.hendelse), el('b', {}, String(h.antall))));
    }
    rot.append(aktivitet);

    // Innspill med svar-mulighet
    const innspillSvar = await Api.hent('/api/innspill');
    const innspillKort = el('div', { klasse: 'kort' }, el('h3', {}, '💡 Innspill fra laget'));
    const åpne = (innspillSvar.innspill || []).filter((i) => !i.svar).slice(0, 6);
    if (!åpne.length) innspillKort.append(el('div', { klasse: 'under' }, 'Ingen ubesvarte innspill.'));
    for (const i of åpne) {
      const rad = el('div', { klasse: 'linje' },
        el('span', { style: 'flex:1' },
          ({ ide: '💡', skurrer: '🐞', funker: '👍' }[i.type] || '') + ' ' + i.tekst.slice(0, 90)),
        el('span', { klasse: 'hvem' }, (i.bruker_navn || 'ukjent').split(' ')[0]));
      rad.append(el('button', { klasse: 'lenkeknapp', style: 'width:auto', onclick: async () => {
        const svarTekst = prompt('Svar til laget (vises i appen):');
        if (!svarTekst) return;
        await Api.post(`/api/innspill/${i.id}/svar`, { svar: svarTekst })
          .then(() => { siFra('Svaret er ute i appen'); Kjerne.oppdaterFane(); })
          .catch((feil) => siFra(feil.message, true));
      } }, 'svar'));
      innspillKort.append(rad);
    }
    rot.append(innspillKort);

    // To-nøkkel: stem på plattformversjonen (autentisert audit-rad)
    const stemmer = await Api.hent('/api/godkjenninger');
    const godkjKort = el('div', { klasse: 'kort' }, el('h3', {}, '🗳 Godkjenning (to nøkler)'),
      el('div', { klasse: 'under' }, 'Stemmen din er knyttet til innloggingen — ingen åpne skjemaer.'));
    for (const s of (stemmer.stemmer || []).slice(0, 5)) {
      godkjKort.append(el('div', { klasse: 'linje' },
        el('span', { style: 'flex:1' }, `${s.versjon}: ${s.stemme === 'godkjent' ? '✓ godkjent' : '✗ avvist'} av ${s.bruker_navn}`),
        el('span', { klasse: 'hvem' }, nårSiden(s.tid))));
    }
    godkjKort.append(el('div', { klasse: 'knapp-rad' },
      el('button', { klasse: 'knapp', onclick: () => stem('godkjent') }, 'Godkjenn v' + Kjerne.VERSJON),
      el('button', { klasse: 'knapp svak', onclick: () => stem('avvist') }, 'Avvis')));
    async function stem(valg) {
      await Api.post('/api/godkjenninger', { versjon: 'v' + Kjerne.VERSJON, stemme: valg })
        .then(() => { siFra('Stemmen er registrert'); Kjerne.oppdaterFane(); })
        .catch((feil) => siFra(feil.message, true));
    }
    rot.append(godkjKort);

    // Invitasjoner
    const invKort = el('div', { klasse: 'kort' }, el('h3', {}, '👷 Inviter ansatt'),
      el('div', { klasse: 'under' }, 'Koden vises ÉN gang — gi den direkte (SMS/muntlig).'));
    invKort.append(el('button', { klasse: 'knapp svak', onclick: async () => {
      const svar2 = await Api.post('/api/sentral/invitasjon', { rolle: 'ansatt' })
        .catch((feil) => { siFra(feil.message, true); return null; });
      if (svar2) {
        // i ark — koden vises ÉN gang og skal ikke viskes ut av en live-oppdatering
        Kjerne.åpneArk(el('div', {},
          el('h2', {}, '👷 Invitasjonskode'),
          el('div', { klasse: 'utkast-ut' }, svar2.kode),
          el('p', { klasse: 'under', style: 'margin-top:10px' },
            `Gyldig i ${svar2.gyldigDager} dager. Gi den direkte (SMS/muntlig) — koden vises kun nå.`)));
      }
    } }, 'Lag invitasjonskode'));
    rot.append(invKort);

    // Brukere + nullstilling (reserven når e-post ikke er satt opp)
    try {
      const brukereSvar = await Api.hent('/api/sentral/brukere');
      const brukerKort = el('div', { klasse: 'kort' }, el('h3', {}, '🔑 Brukere og passord'),
        el('div', { klasse: 'under' }, 'Står noen fast? Lag nullstillingskode — vises ÉN gang, gis direkte.'));
      for (const b of brukereSvar.brukere) {
        const rad = el('div', { klasse: 'linje' },
          el('span', { style: 'flex:1' }, b.navn),
          el('span', { klasse: 'hvem' }, b.rolle));
        rad.append(el('button', { klasse: 'lenkeknapp', style: 'width:auto', onclick: async () => {
          const svar3 = await Api.post('/api/sentral/nullstill', { brukerId: b.id })
            .catch((feil) => { siFra(feil.message, true); return null; });
          if (svar3) {
            Kjerne.åpneArk(el('div', {},
              el('h2', {}, '🔑 Nullstillingskode — ' + svar3.navn),
              el('div', { klasse: 'utkast-ut' }, svar3.kode),
              el('p', { klasse: 'under', style: 'margin-top:10px' },
                `Gyldig i ${svar3.gyldigTimer} timer. ${svar3.navn} bruker den under «Glemt passord?» → «Har du fått kode?».`)));
          }
        } }, 'nullstill'));
        brukerKort.append(rad);
      }
      rot.append(brukerKort);
    } catch { /* ikke-kritisk for sentralen */ }

    // AI-kost — kun admin; 403 for pilotleder er korrekt og forventet.
    if (Kjerne.erAdmin()) {
      try {
        const kost = await Api.hent('/api/sentral/ai-kost');
        const kr = (o) => (Number(o) / 100).toFixed(2).replace('.', ',') + ' kr';
        const kostKort = el('div', { klasse: 'kort' },
          el('div', { klasse: 'kort-topp' }, el('h3', {}, '🧮 AI-kost denne måneden'),
            el('span', { klasse: 'niva sensitivt' }, 'kun admin')),
          el('div', { klasse: 'stor-tall' }, kr(kost.mndOre)),
          el('div', { klasse: 'under' },
            `${kost.mndKall} kall · budsjett ${kr(kost.budsjettOre)} — stopper automatisk ved taket`));
        for (const e of kost.perEvne) {
          kostKort.append(el('div', { klasse: 'linje' },
            el('span', { style: 'flex:1' }, `${e.evne} (${e.modell})`),
            el('b', {}, kr(e.ore) + ' · ' + e.kall + ' kall')));
        }
        rot.append(kostKort);
      } catch (feil) { siFra(feil.message, true); }
    }
  }

  registrerModul('sentral', { tittel: 'Sentral', ikon: '⚙', kunLedelse: true, vis });
})();
