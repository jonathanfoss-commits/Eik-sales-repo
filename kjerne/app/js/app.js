/* Plattformkjernen — appskall: innlogging (m/ invitasjon og TOTP), tenant-tema,
   modul-lasting, live-laget (SSE), faner, ark, toast og felles hjelpere.
   Kjernen kjenner ingen kunde: navn, farger og modulvalg kommer fra /api/meg.
   VERSJON bumpes samtidig i versjon.json og sw.js (cache-navnet) — de tre må aldri drifte. */
window.Kjerne = (function () {
  const VERSJON = '0.3.1';
  let meg = null;   // { navn, rolle }
  let org = null;   // { slug, navn, appnavn, undertittel, tema, moduler }
  const moduler = {};   // id -> { tittel, ikon, vis: async (rot) => {}, påHendelse?: (h) => {} }
  const plussValg = [];

  // ── DOM-hjelpere ──
  const $ = (id) => document.getElementById(id);
  function el(tag, attrs = {}, ...barn) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'klasse') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) n.setAttribute(k, v);
    }
    for (const b of barn.flat()) {
      if (b == null) continue;
      n.append(b.nodeType ? b : document.createTextNode(b));
    }
    return n;
  }

  let toastTimer;
  function siFra(tekst, erFeil) {
    const t = $('toast');
    t.textContent = '';
    t.append(...(erFeil ? [] : [Object.assign(document.createElement('b'), { textContent: '✓ ' })]), tekst);
    t.classList.toggle('feil', Boolean(erFeil));
    t.classList.add('vis');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('vis'), 3200);
  }

  function åpneArk(innhold) {
    const rot = $('ark-innhold');
    rot.textContent = '';
    rot.append(innhold);
    document.body.classList.add('ark-apen');
  }
  function lukkArk() { document.body.classList.remove('ark-apen'); }

  const datoFmt = new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' });
  const penDato = (iso) => (iso ? datoFmt.format(new Date(String(iso).slice(0, 10) + 'T12:00:00')) : '');
  // lokal dato — toISOString() er UTC og gir feil dag 00:00–02:00 norsk tid
  const iDag = () => new Date().toLocaleDateString('sv-SE');
  const tall = (n) => String(Math.round(Number(n || 0) * 10) / 10).replace('.', ',');
  const nårSiden = (iso) => {
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 90) return 'nå nettopp';
    if (s < 3600) return Math.round(s / 60) + ' min siden';
    if (s < 86400) return Math.round(s / 3600) + ' t siden';
    return penDato(iso);
  };

  // Skjema-hjelper: [{navn, etikett, type, valg, verdi, plass, kreves}] → {rot, inputs, verdier()}
  function byggSkjema(felter) {
    const rot = el('div');
    const inputs = {};
    for (const f of felter) {
      const wrapper = el('div');
      wrapper.append(el('label', { klasse: 'felt', for: 'f-' + f.navn }, f.etikett + (f.kreves ? ' *' : '')));
      let inp;
      if (f.type === 'select') {
        inp = el('select', { klasse: 'felt', id: 'f-' + f.navn });
        for (const v of f.valg) inp.append(el('option', { value: v.verdi ?? v }, v.tekst ?? v));
        if (f.verdi != null) inp.value = f.verdi;
      } else if (f.type === 'textarea') {
        inp = el('textarea', { klasse: 'felt', id: 'f-' + f.navn, placeholder: f.plass || '' });
        if (f.verdi != null) inp.value = f.verdi;
      } else {
        inp = el('input', {
          klasse: 'felt', id: 'f-' + f.navn, type: f.type || 'text',
          placeholder: f.plass || '', inputmode: f.inputmode,
          step: f.type === 'number' ? f.step || '0.5' : undefined,
        });
        if (f.verdi != null) inp.value = f.verdi;
      }
      inputs[f.navn] = inp;
      wrapper.append(inp);
      rot.append(wrapper);
    }
    return {
      rot, inputs,
      verdier() {
        const ut = {};
        for (const [navn, inp] of Object.entries(inputs)) ut[navn] = inp.value.trim();
        return ut;
      },
    };
  }

  // ── tenant-tema: konfig → CSS-variabler (white-label i praksis).
  //    Dagslys-modus: nøytral lys grunnpalett med MØRKE aksenter — tenantens
  //    mørk-tema-aksenter er bygget for mørk flate og faller under 4,5:1 på
  //    hvitt. Tenanten kan overstyre via tema.dagslys; alle standardverdier
  //    her er kontrastmålt ≥4,5:1 mot både #FFFFFF og #E9EDEC.
  //    Valget er brukerens og huskes lokalt (kjerne-tema). ──
  const LYS_PALETT = { bunn: '#F2F5F4', flate: '#FFFFFF', flate2: '#E9EDEC',
    strek: 'rgba(15,45,40,.15)', lys: '#101D18', dis: '#4E645D',
    a: '#147A52', b: '#0F6B7A', varsel: '#8A5800', alarm: '#B3261E', aksentTekst: '#FFFFFF' };
  const MORK_STANDARD = { alarm: '#ff5a48', aksentTekst: '#08090c' };
  const erDagslys = () => localStorage.getItem('kjerne-tema') === 'lys';
  function brukTema(tema = {}) {
    const grunnlag = erDagslys()
      ? { ...LYS_PALETT, ...(tema.dagslys || {}) }
      : { ...MORK_STANDARD, ...tema };
    const rot = document.documentElement.style;
    const kart = { bunn: '--bunn', flate: '--flate', flate2: '--flate-2', strek: '--strek',
      lys: '--tekst', dis: '--dis', a: '--aksent', b: '--aksent-b', varsel: '--varsel',
      alarm: '--alarm', aksentTekst: '--aksent-tekst' };
    for (const [n, cssVar] of Object.entries(kart)) if (grunnlag[n]) rot.setProperty(cssVar, grunnlag[n]);
    document.documentElement.classList.toggle('dagslys', erDagslys());
    const metaTema = document.querySelector('meta[name="theme-color"]');
    if (metaTema && grunnlag.bunn) metaTema.setAttribute('content', grunnlag.bunn);
  }

  // ── faner: bygges av modulregisteret ∩ org.moduler ──
  function byggFaner() {
    const bar = $('tabs');
    bar.textContent = '';
    const boks = $('faner');
    boks.textContent = '';
    for (const id of org.moduler) {
      const m = moduler[id];
      if (!m || !m.tittel) continue; // moduler uten fane (f.eks. skriv i ark)
      if (m.kunLedelse && !['admin', 'pilotleder'].includes(meg?.rolle)) continue;
      bar.append(el('button', { klasse: 'tab', 'data-fane': id, onclick: () => visFane(id) },
        el('span', { klasse: 'tab-ikon', 'aria-hidden': 'true' }, m.ikon || '•'), m.tittel));
      boks.append(el('div', { klasse: 'fane', id: 'fane-' + id }));
    }
  }

  // Re-render er serialisert per fane: to samtidige vis() (hendelses-burst
  // mens fanen alt laster) ville tømt og appendet dobbelt (kodegjennomgang
  // funn 7). «stille» = hendelsesdrevet oppdatering: uten scrollhopp.
  const visKjorer = {};
  function visFane(navn, stille) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('aktiv', t.dataset.fane === navn));
    document.querySelectorAll('.fane').forEach((f) => f.classList.toggle('aktiv', f.id === 'fane-' + navn));
    if (!stille) scrollTo(0, 0);
    const rot = $('fane-' + navn);
    if (!moduler[navn]) return;
    if (visKjorer[navn]) { visKjorer[navn].dirty = true; return; }
    const kjør = { dirty: false };
    visKjorer[navn] = kjør;
    moduler[navn].vis(rot)
      .catch((feil) => siFra(feil.message, true))
      .finally(() => {
        visKjorer[navn] = null;
        if (kjør.dirty) visFane(navn, true);
      });
  }
  const aktivFane = () => document.querySelector('.tab.aktiv')?.dataset.fane;

  // ── live-laget: SSE med polling-reserve (D3) ──
  let sse = null, sseFeil = 0, pollTimer = null;
  function kobleLive() {
    if (sse) sse.close();
    try {
      sse = new EventSource('/api/hendelser');
      sse.onmessage = (ev) => {
        sseFeil = 0;
        let h;
        try { h = JSON.parse(ev.data); } catch { return; }
        håndterHendelse(h);
      };
      sse.onerror = () => {
        sseFeil++;
        // CLOSED = EventSource gjenoppretter ALDRI selv (f.eks. 401 ved utløpt
        // sesjon) — start polling straks og prøv ny tilkobling om 15 s
        const fatal = sse && sse.readyState === EventSource.CLOSED;
        if ((fatal || sseFeil >= 2) && !pollTimer) {
          pollTimer = setInterval(() => { const f = aktivFane(); if (f) visFane(f, true); }, 30_000);
        }
        if (fatal && meg) setTimeout(() => { if (meg) kobleLive(); }, 15_000);
      };
      sse.onopen = () => { sseFeil = 0; if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };
    } catch { /* EventSource mangler — polling-reserven tar over via onerror-løpet */ }
  }
  function håndterHendelse(h) {
    // «Ola · nå nettopp»-markeringen i toppen — aldri innhold, kun hvem/hva.
    if (h.av && h.av !== meg?.navn) {
      const live = $('live-status');
      live.textContent = `${h.av} · ${etikett(h.modul)} · nå nettopp`;
      live.classList.add('vis');
      clearTimeout(live._t);
      live._t = setTimeout(() => live.classList.remove('vis'), 6000);
    }
    moduler[h.modul]?.påHendelse?.(h);
    // er fanen for modulen åpen, hent ferskt innhold (bak RLS — aldri fra hendelsen)
    if (aktivFane() === h.modul) visFane(h.modul, true);
  }
  const etikett = (m) => ({ timer: 'førte timer', dagbok: 'skrev i dagboka',
    varsler: 'meldte avvik', innspill: 'sendte innspill', godkjenninger: 'stemte' }[m] || m);

  // ── innlogging ──
  function visLogin() {
    if (sse) { sse.close(); sse = null; }
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    $('login').hidden = false;
    $('skall').hidden = true;
  }
  async function etterLogin() {
    const svar = await Api.hent('/api/meg');
    meg = svar.bruker;
    org = svar.org;
    brukTema(org.tema);
    $('app-navn').textContent = org.appnavn;
    $('app-under').textContent = org.undertittel || org.navn;
    document.title = org.appnavn;
    $('login').hidden = true;
    $('skall').hidden = false;
    $('meg-chip').textContent = meg.navn.split(' ')[0].toUpperCase() + ' ▾';
    byggFaner();
    visFane(org.moduler[0]);
    kobleLive();
    const sendt = await Api.tømKø();
    if (sendt) siFra(`${sendt} registrering(er) fra køen er sendt inn`);
  }

  async function loggInn() {
    const feilEl = $('login-feil');
    feilEl.style.display = 'none';
    try {
      const svar = await Api.post('/api/login', {
        epost: $('login-epost').value.trim(),
        passord: $('login-passord').value,
        totp: $('login-totp').value.trim() || undefined,
      });
      if (svar.trengerTotp) {
        $('login-totp-rad').hidden = false;
        feilEl.textContent = 'Skriv inn engangskoden fra autentiseringsappen';
        feilEl.style.display = 'block';
        return;
      }
      await etterLogin();
    } catch (feil) {
      feilEl.textContent = feil.message;
      feilEl.style.display = 'block';
    }
  }

  async function registrerNy() {
    const feilEl = $('reg-feil');
    feilEl.style.display = 'none';
    try {
      await Api.post('/api/registrer', {
        kode: $('reg-kode').value.trim(),
        navn: $('reg-navn').value.trim(),
        epost: $('reg-epost').value.trim(),
        passord: $('reg-passord').value,
      });
      // registrert — logg rett inn
      const svar = await Api.post('/api/login', {
        epost: $('reg-epost').value.trim(), passord: $('reg-passord').value,
      });
      if (svar.bruker) await etterLogin();
    } catch (feil) {
      feilEl.textContent = feil.message;
      feilEl.style.display = 'block';
    }
  }

  // ── oppstart ──
  async function start() {
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    $('ark-bak').addEventListener('click', lukkArk);
    $('ark-lukk').addEventListener('click', lukkArk);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lukkArk(); });
    $('meg-chip').addEventListener('click', () => {
      const rot = el('div');
      rot.append(el('h2', {}, meg?.navn || ''));
      const s = byggSkjema([
        { navn: 'gammelt', etikett: 'Gammelt passord', type: 'password' },
        { navn: 'nytt', etikett: 'Nytt passord (minst 10 tegn)', type: 'password' },
      ]);
      rot.append(el('button', { klasse: 'knapp svak', style: 'margin-top:8px;width:100%', onclick: () => {
        localStorage.setItem('kjerne-tema', erDagslys() ? 'mork' : 'lys');
        brukTema(org?.tema || {});
        lukkArk();
        siFra(erDagslys() ? 'Dagslys-modus på — bytt tilbake samme sted' : 'Tilbake til mørk modus');
      } }, erDagslys() ? '🌙 Mørk modus' : '☀️ Dagslys-modus'));
      rot.append(el('h3', { style: 'margin-top:14px' }, 'Bytt passord'), s.rot);
      rot.append(el('button', { klasse: 'knapp', style: 'margin-top:10px;width:100%', onclick: async () => {
        try {
          await Api.post('/api/passord', { gammelt: s.inputs.gammelt.value, nytt: s.inputs.nytt.value });
          lukkArk();
          siFra('Passordet er byttet');
        } catch (feil) { siFra(feil.message, true); }
      } }, 'Bytt passord'));
      rot.append(el('button', { klasse: 'knapp svak', style: 'margin-top:16px;width:100%', onclick: async () => {
        await Api.post('/api/logout').catch(() => {});
        meg = null;
        lukkArk();
        visLogin();
      } }, 'Logg ut'));
      åpneArk(rot);
    });
    $('login-knapp').addEventListener('click', loggInn);
    $('login-passord').addEventListener('keydown', (e) => { if (e.key === 'Enter') loggInn(); });
    $('login-totp').addEventListener('keydown', (e) => { if (e.key === 'Enter') loggInn(); });
    $('reg-knapp').addEventListener('click', registrerNy);
    $('vis-registrering').addEventListener('click', () => {
      $('login-boks').hidden = true; $('reg-boks').hidden = false;
    });
    $('vis-innlogging').addEventListener('click', () => {
      $('reg-boks').hidden = true; $('login-boks').hidden = false;
    });
    $('vis-glemt').addEventListener('click', () => {
      $('login-boks').hidden = true; $('glemt-boks').hidden = false;
    });
    $('glemt-tilbake').addEventListener('click', () => {
      $('glemt-boks').hidden = true; $('login-boks').hidden = false;
    });
    $('glemt-knapp').addEventListener('click', async () => {
      const m = $('glemt-melding');
      try {
        const svar = await Api.post('/api/glemt', { epost: $('glemt-epost').value.trim() });
        m.textContent = svar.melding;
        m.style.display = 'block';
      } catch (feil) {
        m.textContent = feil.message;
        m.style.display = 'block';
      }
    });
    $('null-knapp').addEventListener('click', async () => {
      const feilEl = $('glemt-feil');
      feilEl.style.display = 'none';
      try {
        await Api.post('/api/nullstill', {
          kode: $('null-kode').value.trim(), passord: $('null-passord').value });
        $('glemt-boks').hidden = true;
        $('login-boks').hidden = false;
        siFra('Nytt passord er satt — logg inn');
      } catch (feil) {
        feilEl.textContent = feil.message;
        feilEl.style.display = 'block';
      }
    });

    $('pluss').addEventListener('click', () => {
      const rot = el('div');
      rot.append(el('h2', {}, 'Ny registrering'));
      rot.append(el('div', { klasse: 'under' }, 'Rett fra lomma — alt tåler dårlig dekning'));
      const rutenett = el('div', { klasse: 'hurtig-rutenett' });
      for (const valg of plussValg) {
        if (valg.modul && !org.moduler.includes(valg.modul)) continue;
        rutenett.append(el('button', { klasse: 'hurtig', onclick: () => { lukkArk(); valg.gjør(); } },
          el('b', {}, valg.tittel), el('span', {}, valg.under)));
      }
      rot.append(rutenett);
      åpneArk(rot);
    });

    addEventListener('online', async () => {
      document.body.classList.remove('er-offline');
      const sendt = await Api.tømKø();
      if (sendt) siFra(`Dekning igjen — ${sendt} registrering(er) sendt inn`);
    });
    addEventListener('offline', () => document.body.classList.add('er-offline'));
    if (!navigator.onLine) document.body.classList.add('er-offline');

    try {
      await etterLogin();
    } catch {
      visLogin();
    }
  }

  // Oppstart når alle modulskriptene har registrert seg (script-rekkefølgen
  // garanterer det før DOMContentLoaded). Ingen inline-script — CSP-en er streng.
  document.addEventListener('DOMContentLoaded', () => {
    start().catch((feil) => console.error('Oppstartsfeil:', feil));
  });

  return {
    VERSJON,
    start, visLogin,
    el, siFra, åpneArk, lukkArk, byggSkjema,
    penDato, iDag, tall, nårSiden,
    meg: () => meg,
    org: () => org,
    erLedelse: () => meg && ['admin', 'pilotleder'].includes(meg.rolle),
    erAdmin: () => meg && meg.rolle === 'admin',
    registrerModul: (navn, modul) => { moduler[navn] = modul; },
    registrerPluss: (valg) => plussValg.push(valg),
    oppdaterFane: () => { const f = aktivFane(); if (f) visFane(f); },
    visFane,
  };
})();
