// Visningsruting: innlogging → faner etter rolle og relasjoner.
import { kall } from './api.js';
import { el, tom, feilboks } from './dom.js';
import { ikon } from './ikoner.js';
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

const tilstand = { meg: null, harEtterlatt: false, fane: null, miljo: {} };

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

  // Overskriften sto «Livsarkivet» — som allerede står i toppfeltet rett over.
  // Her er det bedre brukt på hva tjenesten faktisk gjør.
  const skjema = el('div', {},
    el('h1', {}, 'Alt dine nærmeste trenger'),
    el('p', { class: 'undertekst' },
      'Frigitt kontrollert når det skjer — aldri før, og aldri til andre '
      + 'enn dem du har pekt ut.'),
    feil ? feilboks(feil) : null);

  // Selskapets egen innlogging står FØRST: det er veien kundene deres kjenner,
  // og for etterlatte er et passord til «enda en tjeneste» en terskel de
  // kanskje aldri kommer over.
  if (visning === 'inn' && tilstand.miljo.sso) {
    skjema.append(
      el('a', { class: 'knapp', href: '/api/auth/oidc/start' },
        `Logg inn med ${tilstand.miljo.merkevare?.navn || 'selskapet ditt'}`),
      el('p', { class: 'meta' }, 'eller med e-post og passord:'));
  }

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
      el('button', { class: 'stille', onclick: () => visInnlogging('kode') }, 'Har du fått en kode?'),
      // vises bare når selvregistrering er åpen — ellers er den en blindvei
      tilstand.miljo.registrering
        ? el('button', { class: 'stille', onclick: () => visInnlogging('ny') }, 'Opprett ditt livsarkiv')
        : null,
      el('button', { class: 'lenkeknapp', onclick: () => visInnlogging('glemt') }, 'Glemt passord?'));
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
  } else if (visning === 'glemt') {
    const epost = el('input', { type: 'email', placeholder: 'E-post', autocomplete: 'username' });
    const kode = el('input', { type: 'text', placeholder: 'Kode fra e-posten' });
    const passord = el('input', { type: 'password', placeholder: 'Nytt passord (minst 10 tegn)', autocomplete: 'new-password' });
    const meldingRom = el('div', {});
    skjema.append(
      el('p', { class: 'undertekst' }, 'Vi sender en engangskode til e-posten din.'),
      meldingRom, epost,
      el('button', { class: 'sekundaer', onclick: async () => {
        const svar = await kall('POST', '/api/auth/glemt', { epost: epost.value });
        meldingRom.replaceChildren(el('div', { class: 'melding-ok' }, svar.data.melding || 'Sjekk e-posten.'));
      } }, 'Send kode'),
      kode, passord,
      el('button', { onclick: async () => {
        const svar = await kall('POST', '/api/auth/nullstill', { kode: kode.value, passord: passord.value });
        if (!svar.ok) return visInnlogging('glemt', svar.data.feil || 'Nullstilling feilet');
        visInnlogging('inn');
      } }, 'Sett nytt passord'),
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
    liste.push(['koe', 'koe', 'Kø', admin.visKoe], ['logg', 'logg', 'Logg', admin.visLogg]);
  } else {
    liste.push(
      ['hvelv', 'hvelv', 'Hvelv', hvelv.vis],
      ['kontakter', 'kontakter', 'Kontakter', kontakter.vis],
      ['matrise', 'matrise', 'Hvem får hva', matrise.vis],
      ['status', 'status', 'Status', status.vis]);
    if (tilstand.betroddI?.length) liste.push(['melding', 'meld', 'Meld', melding.vis]);
    if (tilstand.harEtterlatt) liste.push(['etterlatt', 'etterlatt', 'Til deg', etterlatt.vis]);
  }
  for (const [id, ikonnavn, navn, vis] of liste) {
    faner.append(el('button', { 'data-fane': id, onclick: () => byttFane(id, vis) },
      el('span', { class: 'ikon' }, ikon(ikonnavn)), navn));
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
  // Hver fane får sitt EGET rom, ikke #innhold direkte.
  //
  // Fanevisningene er asynkrone: de henter data og skriver innholdet sitt
  // etterpå. Skrev alle til #innhold, rakk den forrige fanen å legge sitt
  // innhold inn i den nye visningen når man byttet før lastingen var ferdig —
  // og da sto «Status» som overskrift med hele hvelvet under, med nødbremsen
  // dyttet 2000 piksler ned. Generalprøven fanget det; det skjer hver gang man
  // trykker litt raskt, altså i en demo på dårlig nett.
  //
  // Med et eget rom fjerner neste tom(innhold) det gamle rommet fra DOM-en, og
  // en forsinket skriving havner i en frakoblet node der ingen ser den.
  const rom = el('div', {});
  innhold.append(rom);
  vis(rom, tilstand);
}

// ── Miljøet: demoadvarsel og om selvregistrering er åpen ──
async function hentMiljo() {
  tilstand.miljo = (await kall('GET', '/api/miljo')).data || {};
  const merke = tilstand.miljo.merkevare;
  if (merke?.navn && merke.navn !== 'Livsarkivet') {
    // White-label: selskapet eier flaten, vi står som leverandør under.
    document.querySelector('#topp .merke strong').textContent = merke.navn;
    document.title = merke.navn;
    if (merke.avsender) {
      document.getElementById('topp-under').dataset.avsender = merke.avsender;
    }
  }
  if (merke?.aksent) document.documentElement.style.setProperty('--aksent', merke.aksent);
  if (!tilstand.miljo.demo) return;
  document.getElementById('topp').before(el('div', { class: 'miljobanner' },
    el('strong', {}, 'Testmiljø'),
    ' — alle som har lenken kan logge inn som demokontoene. '
    + 'Legg aldri inn ekte opplysninger her.'));
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

await hentMiljo();
start();
