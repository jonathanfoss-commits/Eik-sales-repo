/* Modul: Prosjektrommet — alt laget registrerer, samlet per prosjekt: én
   tidslinje, status-chips som driver handling, bevisdokument på én knapp og
   ukesrapport sydd av ukens ekte data. Ingen egen registrering — rommet ER
   summen av de andre modulene, nivåfiltrert bak RLS. */
(function () {
  const { el, siFra, åpneArk, lukkArk, penDato, nårSiden, registrerModul } = Kjerne;

  let valgt = null;   // prosjektnavn — null = listen
  let valgtOrg = null; // slug: valget nullstilles ved utlogging/annen tenant
                       // (granskingsfunn: A-tenantens prosjektnavn må aldri
                       // henge igjen når B logger inn på samme enhet)

  const SLAG = {
    dagbok: { ikon: '📓', navn: 'Dagbok' },
    varsel: { ikon: '⚠️', navn: 'Varsel' },
    tillegg: { ikon: '➕', navn: 'Tillegg' },
    timer: { ikon: '⏱', navn: 'Timer' },
  };

  function chip(tekst, klasse) {
    return el('span', { klasse: 'niva' + (klasse ? ' ' + klasse : ''), style: 'margin-right:6px' }, tekst);
  }

  function ukesrapportArk(prosjekt) {
    const rot = el('div');
    rot.append(el('h2', {}, '🗓 Ukesrapport — ' + prosjekt));
    rot.append(el('div', { klasse: 'under' },
      'Sys av ukens registreringer (dagbok, varsler, tillegg). Rapporten foreslås — du leser over og sender selv.'));
    const erLedelse = ['admin', 'pilotleder'].includes(Kjerne.meg()?.rolle);
    const ut = el('div', { klasse: 'utkast-ut', style: 'display:none' });
    const lag = (variant, knapp) => async () => {
      knapp.disabled = true;
      knapp.textContent = 'Skriver …';
      try {
        const svar = await Api.post('/api/prosjekter/ukesrapport', { prosjekt, variant });
        ut.textContent = svar.tekst;
        ut.style.display = 'block';
        kopierKnapp.style.display = 'block';
        kopierKnapp.onclick = () => navigator.clipboard?.writeText(svar.tekst)
          .then(() => siFra('Rapporten er kopiert — lim inn der du sender den'));
      } catch (feil) { siFra(feil.message, true); }
      knapp.disabled = false;
      knapp.textContent = knapp._tekst;
    };
    const bh = el('button', { klasse: 'knapp', style: 'margin-top:10px;width:100%' }, '📤 Til byggherren');
    bh._tekst = '📤 Til byggherren';
    bh.addEventListener('click', lag('byggherre', bh));
    rot.append(bh);
    if (erLedelse) {
      const led = el('button', { klasse: 'knapp svak', style: 'margin-top:8px;width:100%' },
        '🔒 Intern (m/ timer og tillegg)');
      led._tekst = '🔒 Intern (m/ timer og tillegg)';
      led.addEventListener('click', lag('ledelse', led));
      rot.append(led);
    }
    const kopierKnapp = el('button', { klasse: 'knapp svak', style: 'margin-top:8px;width:100%;display:none' }, 'Kopier');
    rot.append(ut, kopierKnapp);
    åpneArk(rot);
  }

  async function visProsjekt(rot, navn) {
    const svar = await Api.hent('/api/prosjekter/tidslinje?prosjekt=' + encodeURIComponent(navn));
    rot.textContent = '';
    const kort = el('div', { klasse: 'kort' });
    kort.append(el('button', { klasse: 'lenkeknapp', style: 'width:auto', onclick: () => {
      valgt = null; Kjerne.visFane('prosjekt');
    } }, '← Alle prosjekter'));
    kort.append(el('div', { klasse: 'kort-topp' }, el('h2', {}, '🏗 ' + navn),
      el('span', { klasse: 'niva' }, 'live')));

    if (svar.frist) {
      kort.append(el('div', { klasse: 'under' },
        `Overtakelse ${penDato(svar.frist.overtakelse)} — fristvakta teller ned mot sluttoppstilling og søksmål.`));
    }

    kort.append(el('button', { klasse: 'knapp', style: 'margin-top:10px;width:100%', onclick: () => {
      window.open('/api/prosjekter/bevis?prosjekt=' + encodeURIComponent(navn), '_blank');
    } }, '📄 Lag bevisdokument'));
    kort.append(el('button', { klasse: 'knapp svak', style: 'margin-top:8px;width:100%',
      onclick: () => ukesrapportArk(navn) }, '🗓 Sy ukesrapport'));
    rot.append(kort);

    const tidslinje = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' }, el('h3', {}, 'Tidslinjen'),
        el('span', { klasse: 'niva' }, svar.hendelser.length + ' hendelser')));
    if (!svar.hendelser.length) tidslinje.append(el('div', { klasse: 'under' }, 'Ingen registreringer ennå.'));
    let sistDato = '';
    for (const h of svar.hendelser) {
      if (h.dato !== sistDato) {
        sistDato = h.dato;
        tidslinje.append(el('div', { klasse: 'mono',
          style: 'font-size:.6rem;letter-spacing:.14em;color:var(--dis);margin-top:12px' },
          penDato(h.dato).toUpperCase()));
      }
      const s = SLAG[h.slag] || { ikon: '·', navn: h.slag };
      const detaljer = [];
      if (h.slag === 'varsel') detaljer.push((h.type === 'endringsvarsel' ? 'endringsvarsel' : 'varemottak') +
        ' · ' + h.status + (h.svarfrist ? ' · svarfrist ' + penDato(h.svarfrist) : ''));
      if (h.slag === 'tillegg') detaljer.push((h.avtaltMed ? 'avtalt med ' + h.avtaltMed + ' · ' : '') + h.status);
      tidslinje.append(el('div', { klasse: 'linje' },
        el('span', { klasse: 'hvem' }, s.ikon + ' ' + (h.av || '').split(' ')[0] + ' · ' + nårSiden(h.tid)),
        el('span', { style: 'flex:1' }, h.tekst.slice(0, 140) + (h.tekst.length > 140 ? '…' : '') +
          (detaljer.length ? ' — ' + detaljer.join(' ') : ''))));
    }
    rot.append(tidslinje);
  }

  async function vis(rot) {
    const slug = Kjerne.org()?.slug;
    if (slug !== valgtOrg) { valgt = null; valgtOrg = slug; }
    if (valgt) return visProsjekt(rot, valgt);
    const svar = await Api.hent('/api/prosjekter');
    rot.textContent = '';
    const kort = el('div', { klasse: 'kort' },
      el('div', { klasse: 'kort-topp' }, el('h2', {}, '🏗 Prosjektrommet'),
        el('span', { klasse: 'niva' }, 'live')),
      el('div', { klasse: 'under' },
        'Alt laget registrerer, samlet per prosjekt — automatisk. Trykk deg inn for tidslinje, bevisdokument og ukesrapport.'));
    if (!svar.prosjekter.length) {
      kort.append(el('div', { klasse: 'under' },
        'Ingen prosjekter ennå — de dukker opp av seg selv når dagbok, timer eller varsler føres.'));
    }
    for (const p of svar.prosjekter) {
      const rad = el('div', { klasse: 'linje', style: 'cursor:pointer' });
      const t = el('span', { style: 'flex:1' }, el('b', {}, p.prosjekt), el('br'));
      t.append(chip(p.dagboklinjer + ' dagbok'));
      if (p.aapneVarsler) t.append(chip(p.aapneVarsler + ' åpne varsler', 'privat'));
      if (p.aapneTillegg) t.append(chip(p.aapneTillegg + ' ufakturerte tillegg', 'privat'));
      if (p.dagerTilSluttoppstilling != null) {
        t.append(chip(p.dagerTilSluttoppstilling >= 0
          ? 'sluttoppstilling om ' + p.dagerTilSluttoppstilling + ' d'
          : 'sluttoppstilling UTLØPT',
        p.dagerTilSluttoppstilling <= 14 ? 'sensitivt' : ''));
      }
      rad.append(t, el('span', { klasse: 'hvem' }, nårSiden(p.sist)));
      rad.addEventListener('click', () => { valgt = p.prosjekt; Kjerne.visFane('prosjekt'); });
      kort.append(rad);
    }
    rot.append(kort);
  }

  registrerModul('prosjekt', { tittel: 'Prosjekt', ikon: '🏗', vis,
    lytter: ['dagbok', 'timer', 'tillegg', 'varsler', 'frister'] });
})();
