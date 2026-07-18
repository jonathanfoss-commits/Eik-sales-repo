/* API-klient med offline-kø: GET-svar mellomlagres lokalt (viser sist lagrede
   data uten dekning), og registreringer (POST) legges i kø og sendes automatisk
   når nettet er tilbake. Bygget for byggeplasser med dårlig dekning.

   Køen er datagrunnlag og behandles deretter:
   - hver post får en klient-id (idempotensnøkkel) — serveren dedupliserer,
     så et brutt svar aldri gir dobbeltføring
   - poster beholdes ved nettfeil OG serverfeil (5xx/429); kun avviste
     forespørsler (4xx) tas ut av køen, og da med tydelig beskjed
   - posten fjernes fra køen én og én, aldri ved å overskrive hele køen
   - tømming er reentrans-sikret (kan trygt trigges fra flere hendelser) */
(function () {
  const KØ_NØKKEL = 'kjerne-ko';
  const CACHE_PREFIKS = 'kjerne-cache:';

  const nyKlientId = () =>
    (crypto.randomUUID ? crypto.randomUUID()
      : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));

  function lesKø() {
    try { return JSON.parse(localStorage.getItem(KØ_NØKKEL) || '[]'); } catch { return []; }
  }
  function skrivKø(kø) {
    try { localStorage.setItem(KØ_NØKKEL, JSON.stringify(kø)); return true; }
    catch { return false; }
  }
  function fjernFraKø(klientId) {
    skrivKø(lesKø().filter((p) => p.body?.klient_id !== klientId));
  }

  async function rå(metode, sti, body) {
    const res = await fetch(sti, {
      method: metode,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !sti.endsWith('/api/login')) {
      window.Kjerne?.visLogin?.();
    }
    if (!res.ok) {
      const feil = new Error(data.feil || `Feil (${res.status})`);
      feil.status = res.status;
      feil.data = data;
      throw feil;
    }
    return data;
  }

  const beholdIKø = (feil) =>
    !feil.status || feil.status >= 500 || feil.status === 429 || feil.status === 401;

  async function hent(sti) {
    try {
      const data = await rå('GET', sti);
      try { localStorage.setItem(CACHE_PREFIKS + sti, JSON.stringify(data)); } catch {}
      return data;
    } catch (feil) {
      if (feil.status) throw feil;
      const lagret = localStorage.getItem(CACHE_PREFIKS + sti);
      if (lagret) return { ...JSON.parse(lagret), _fraCache: true };
      throw feil;
    }
  }

  async function sendEllerKø(sti, body, beskrivelse) {
    body = { ...body, klient_id: nyKlientId() };
    try {
      return { sendt: true, data: await rå('POST', sti, body) };
    } catch (feil) {
      if (!beholdIKø(feil)) throw feil;
      const kø = lesKø();
      kø.push({ sti, body, beskrivelse, tid: new Date().toISOString() });
      if (!skrivKø(kø)) {
        throw new Error('Fikk ikke lagret registreringen lokalt (fullt lager). ' +
          'Prøv igjen når du har dekning — ingenting er sendt.');
      }
      return { sendt: false };
    }
  }

  let tømmer = false;
  async function tømKø() {
    if (tømmer) return 0;
    tømmer = true;
    let sendt = 0;
    const avvist = [];
    try {
      for (const post of lesKø()) {
        try {
          await rå('POST', post.sti, post.body);
          sendt++;
          fjernFraKø(post.body.klient_id);
        } catch (feil) {
          if (beholdIKø(feil)) continue;
          avvist.push(`${post.beskrivelse || 'registrering'}: ${feil.message}`);
          fjernFraKø(post.body.klient_id);
        }
      }
    } finally {
      tømmer = false;
    }
    if (avvist.length) {
      window.Kjerne?.siFra?.(`${avvist.length} køet registrering(er) ble avvist av serveren — ${avvist[0]}`, true);
    }
    return sendt;
  }

  window.Api = {
    hent,
    post: (sti, body) => rå('POST', sti, body),
    put: (sti, body) => rå('PUT', sti, body),
    slett: (sti) => rå('DELETE', sti),
    sendEllerKø,
    tømKø,
    køLengde: () => lesKø().length,
  };
})();
