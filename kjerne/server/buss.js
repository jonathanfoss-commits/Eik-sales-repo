// Hendelsesbussen bak live-laget (D3). In-process EventEmitter per org —
// riktig for én serverinstans; ved skalering byttes implementasjonen mot
// Postgres LISTEN/NOTIFY bak samme grensesnitt.
//
// SIKKERHETSKONTRAKT: hendelser inneholder ALDRI innhold — kun
// {modul, type, radId, versjon, av, tid}. Klienten henter selv raden via
// vanlig API, som håndhever RLS/datanivå. SSE-strømmen rollefiltreres i
// tillegg: hendelser merket sensitiv når ikke ansatt-rollen.
import { EventEmitter } from 'node:events';

const busser = new Map();
function buss(orgId) {
  if (!busser.has(orgId)) {
    const e = new EventEmitter();
    e.setMaxListeners(200); // én lytter per åpen fane i organisasjonen
    busser.set(orgId, e);
  }
  return busser.get(orgId);
}

export function publiser(orgId, hendelse) {
  buss(orgId).emit('hendelse', {
    modul: hendelse.modul,
    type: hendelse.type,
    radId: hendelse.radId || null,
    versjon: hendelse.versjon || null,
    av: hendelse.av || null,          // fornavn til «Ola · nå nettopp»-markeringen
    sensitiv: Boolean(hendelse.sensitiv),
    tid: new Date().toISOString(),
  });
}

export function abonner(orgId, lytter) {
  const e = buss(orgId);
  e.on('hendelse', lytter);
  return () => e.off('hendelse', lytter);
}
