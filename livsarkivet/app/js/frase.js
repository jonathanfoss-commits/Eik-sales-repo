// Sikkerhetsfrase-hjelperen: låser opp (eller oppretter) nøkler og husker de
// opplåste nøklene KUN i minnet — aldri i lagring, aldri til serveren.
import { kall } from './api.js';
import { opprettHvelvnokler, laasOppHvelvnokkel, gjenopprettHvelvnokkel,
  opprettNokkelpar } from './krypto.js';

let hvelvnokkel = null;   // opplåst CryptoKey — kun i minnet
let minNokkel = null;     // eget nøkkelmateriale (lagret form)

// Eierens hvelvnøkkel: oppretter ved første bruk (viser gjenopprettingskoden
// ÉN gang), ellers låser opp med frasen.
export async function hentHvelvnokkel() {
  if (hvelvnokkel) return hvelvnokkel;
  const svar = await kall('GET', '/api/krypto/hvelvnokler');
  if (!svar.data.finnes) {
    const frase = prompt('Velg en sikkerhetsfrase for sensitivt innhold (minst 12 tegn).\nDen forlater ALDRI enheten din — uten den (eller gjenopprettingskoden) kan ingen, heller ikke vi, åpne innholdet.');
    if (!frase || frase.length < 12) { alert('Frasen må ha minst 12 tegn.'); return null; }
    const { tilServer, gjenopprettingskode } = await opprettHvelvnokler(frase);
    await kall('PUT', '/api/krypto/hvelvnokler', tilServer);
    alert(`GJENOPPRETTINGSKODE (vises kun nå — skriv den ned og oppbevar den trygt):\n\n${gjenopprettingskode}`);
    hvelvnokkel = await laasOppHvelvnokkel(frase, tilServer);
    return hvelvnokkel;
  }
  const frase = prompt('Sikkerhetsfrasen din:');
  if (!frase) return null;
  try {
    hvelvnokkel = await laasOppHvelvnokkel(frase, svar.data.nokler);
    return hvelvnokkel;
  } catch {
    alert('Feil sikkerhetsfrase.');
    return null;
  }
}

// Tapt frase: gjenopprettingskoden + serverens del → ny frase.
export async function gjenopprettMedKode() {
  const svar = await kall('GET', '/api/krypto/hvelvnokler');
  if (!svar.data.finnes) { alert('Ingen nøkler å gjenopprette.'); return; }
  const kode = prompt('Gjenopprettingskoden din (fra utskriften):');
  const nyFrase = prompt('Ny sikkerhetsfrase (minst 12 tegn):');
  if (!kode || !nyFrase || nyFrase.length < 12) return;
  try {
    const { tilServer } = await gjenopprettHvelvnokkel(kode.trim(), svar.data.nokler, nyFrase);
    await kall('PUT', '/api/krypto/hvelvnokler', tilServer);
    hvelvnokkel = await laasOppHvelvnokkel(nyFrase, tilServer);
    alert('Frasen er byttet. Innholdet ditt er tilgjengelig igjen.');
  } catch {
    alert('Gjenoppretting feilet — sjekk koden.');
  }
}

// Eget nøkkelpar (for å kunne MOTTA sensitivt innhold).
export async function sikreMinNokkel() {
  if (minNokkel) return minNokkel;
  const svar = await kall('GET', '/api/krypto/min-nokkel');
  if (svar.data.finnes) { minNokkel = svar.data.nokkel; return minNokkel; }
  const frase = prompt('Velg en sikkerhetsfrase (minst 12 tegn) — den trengs for at andre skal kunne dele sensitivt innhold med deg, og forlater aldri enheten din.');
  if (!frase || frase.length < 12) { alert('Frasen må ha minst 12 tegn.'); return null; }
  const { tilServer } = await opprettNokkelpar(frase);
  await kall('PUT', '/api/krypto/min-nokkel', tilServer);
  minNokkel = tilServer;
  return minNokkel;
}

export async function harMinNokkel() {
  if (minNokkel) return true;
  return (await kall('GET', '/api/krypto/min-nokkel')).data.finnes === true;
}
