// Visningsruting: innlogging → faner etter rolle og relasjoner.
import { kall } from './api.js';
import { el, tom, feilboks } from './dom.js';
import * as hvelv from './moduler/hvelv.js';
import * as kontakter from './moduler/kontakter.js';
import * as matrise from './moduler/matrise.js';
import * as status from './moduler/status.js';
import * as melding from './moduler/melding.js';
import * as admin from './moduler/admin.js';
import * as etterlatt from './moduler/etterlatt.js';

const innhold = document.getElementById('innhold');
const faner = document.getElementById('faner');
const loggUtKnapp = document.getElementById('logg-ut');

const tilstand = { meg: null, harEtterlatt: false, fane: null };

loggUtKnapp.addEventListener('click', async () => {
  await kall('POST', '/api/auth/logg-ut');
  location.hash = '';
  start();
});

// ── Innlogging / registrering / invitasjonskode ──
function visInnlogging(visning = 'inn', feil = '') {
  document.body.classList.remove('etterlatt-modus');
  faner.hidden = true;
  loggUtKnapp.hidden = true;
  tom(innhold);

  const skjema = el('div', {},
    el('h1', {}, 'Livsarkivet'),
    el('p', { class: 'undertekst' },
      'Alt dine nærmeste trenger — frigitt kontrollert, aldri før.'),
    feil ? feilboks(feil) : null);

  if (visning === 'inn') {
    const epost = el('input', { type: 'email', placeholder: 'E-post', autocomplete: 'username' });
    const passord = el('input', { type: 'password', placeholder: 'Passord', autocomplete: 'current-password' });
    const totp = el('input', { type: 'text', placeholder: 'Engangskode (kun saksbehandlere)', inputmode: 'numeric', hidden: true });
    skjema.append(epost, passord, totp,
      el('button', { onclick: async () => {
        const svar = await kall('POST', '/api/auth/logg-inn',
          { epost: epost.value, passord: passord.value, totp: totp.value });
        if (svar.data.trengerTotp) { totp.hidden = false; totp.focus(); return; }
        if (!svar.ok) return visInnlogging('inn', svar.data.feil || 'Innlogging feilet');
        start();
      } }, 'Logg inn'),
      el('button', { class: 'sekundaer', onclick: () => visInnlogging('kode') }, 'Har du fått en kode?'),
      el('button', { class: 'sekundaer', onclick: () => visInnlogging('ny') }, 'Opprett ditt livsarkiv'));
  } else if (visning === 'ny') {
    const navn = el('input', { type: 'text', placeholder: 'Fullt navn', autocomplete: 'name' });
    const epost = el('input', { type: 'email', placeholder: 'E-post', autocomplete: 'username' });
    const passord = el('input', { type: 'password', placeholder: 'Passord (minst 10 tegn)', autocomplete: 'new-password' });
    skjema.append(navn, epost, passord,
      el('button', { onclick: async () => {
        const reg = await kall('POST', '/api/auth/registrer',
          { navn: navn.value, epost: epost.value, passord: passord.value });
        if (!reg.ok) return visInnlogging('ny', reg.data.feil || 'Registrering feilet');
        await kall('POST', '/api/auth/logg-inn', { epost: epost.value, passord: passord.value });
        start();
      } }, 'Opprett arkiv'),
      el('button', { class: 'sekundaer', onclick: () => visInnlogging('inn') }, 'Tilbake'));
  } else { // invitasjonskode
    const kode = el('input', { type: 'text', placeholder: 'Invitasjonskode' });
    const navn = el('input', { type: 'text', placeholder: 'Fullt navn', autocomplete: 'name' });
    const passord = el('input', { type: 'password', placeholder: 'Velg passord (minst 10 tegn)', autocomplete: 'new-password' });
    skjema.append(
      el('p', { class: 'undertekst' }, 'Noen har lagt deg til som kontakt i sitt livsarkiv.'),
      kode, navn, passord,
      el('button', { onclick: async () => {
        const svar = await kall('POST', '/api/auth/innlos-invitasjon',
          { kode: kode.value, navn: navn.value, passord: passord.value });
        if (!svar.ok) return visInnlogging('kode', svar.data.feil || 'Innløsning feilet');
        start();
      } }, 'Koble meg til'),
      el('button', { class: 'sekundaer', onclick: () => visInnlogging('inn') }, 'Tilbake'));
  }
  innhold.append(skjema);
}

// ── Faner ──
function byggFaner() {
  tom(faner);
  const meg = tilstand.meg;
  const liste = [];
  if (meg.rolle === 'admin') {
    liste.push(['koe', '🗂', 'Kø', admin.visKoe], ['logg', '📜', 'Logg', admin.visLogg]);
  } else {
    liste.push(
      ['hvelv', '🗄', 'Hvelv', hvelv.vis],
      ['kontakter', '👥', 'Kontakter', kontakter.vis],
      ['matrise', '🔀', 'Hvem får hva', matrise.vis],
      ['status', '🛡', 'Status', status.vis]);
    if (tilstand.betroddI?.length) liste.push(['melding', '🕯', 'Meld', melding.vis]);
    if (tilstand.harEtterlatt) liste.push(['etterlatt', '🤍', 'Til deg', etterlatt.vis]);
  }
  for (const [id, ikon, navn, vis] of liste) {
    faner.append(el('button', { 'data-fane': id, onclick: () => byttFane(id, vis) },
      el('span', { class: 'ikon' }, ikon), navn));
  }
  faner.hidden = false;
  return liste;
}

function byttFane(id, vis) {
  tilstand.fane = id;
  document.body.classList.toggle('etterlatt-modus', id === 'etterlatt');
  for (const knapp of faner.querySelectorAll('button')) {
    knapp.classList.toggle('valgt', knapp.dataset.fane === id);
  }
  location.hash = id;
  tom(innhold);
  vis(innhold, tilstand);
}

// ── Oppstart ──
async function start() {
  const meg = await kall('GET', '/api/meg');
  if (!meg.ok) return visInnlogging();
  tilstand.meg = meg.data.bruker;
  tilstand.betroddI = meg.data.betroddI || [];
  if (tilstand.meg.rolle !== 'admin') {
    const sjekk = await kall('GET', '/api/etterlatt');
    tilstand.harEtterlatt = (sjekk.data.elementer || []).length > 0;
  }
  loggUtKnapp.hidden = false;
  document.getElementById('topp-under').textContent =
    tilstand.meg.rolle === 'admin' ? 'saksbehandling' : tilstand.meg.navn;
  const liste = byggFaner();
  const oensket = location.hash.replace('#', '');
  const valgt = liste.find(([id]) => id === oensket) || liste[0];
  byttFane(valgt[0], valgt[3]);
}

start();
