/* Modul: Innspillsløkka — 💡 idé / 🐞 skurrer / 👍 funker. DELT; innholdet er
   aktivt sendt av brukeren (eneste innholds-unntaket i personvernregelen). */
(function () {
  const { el, siFra, åpneArk, lukkArk, registrerPluss } = Kjerne;

  function skjema() {
    const rot = el('div');
    rot.append(el('h2', {}, '💡 Si fra til teamet'));
    rot.append(el('div', { klasse: 'under' },
      'Innspillet ditt går rett til teamet som bygger appen — og hele laget ser det.'));
    const s = Kjerne.byggSkjema([
      { navn: 'type', etikett: 'Hva slags innspill?', type: 'select', valg: [
        { verdi: 'ide', tekst: '💡 Idé — noe appen burde kunne' },
        { verdi: 'skurrer', tekst: '🐞 Noe skurrer' },
        { verdi: 'funker', tekst: '👍 Dette funker' }] },
      { navn: 'tekst', etikett: 'Innspillet', type: 'textarea', kreves: true },
    ]);
    rot.append(s.rot);
    rot.append(el('button', { klasse: 'knapp', style: 'margin-top:12px;width:100%', onclick: async () => {
      const v = s.verdier();
      if (!v.tekst) return siFra('Skriv innspillet først', true);
      try {
        const res = await Api.sendEllerKø('/api/innspill', v, 'innspill');
        lukkArk();
        siFra(res.sendt ? 'Sendt — teamet ser det med en gang' : 'Ingen dekning — ligger trygt i kø');
      } catch (feil) { siFra(feil.message, true); }
    } }, 'Send innspillet'));
    åpneArk(rot);
  }

  Kjerne.registrerModul('innspill', { vis: async () => {} }); // ingen egen fane
  registrerPluss({ modul: 'innspill', tittel: '💡 Innspill', under: 'idé, skurr eller skryt', gjør: skjema });
})();
