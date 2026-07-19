// Publiseringsvakta: håndhever versjonstriadene maskinelt.
//  Pilot:  VERSJON i app/index.html == app/versjon.json, og app/sw.js-cachen
//          MÅ være endret i samme commit som andre cachede app-filer.
//  Kjerne: VERSJON i kjerne/app/js/app.js == kjerne/app/versjon.json, og
//          cache-navnet i kjerne/app/sw.js == 'kjerne-v' + versjonen.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const feil = [];
const les = (sti) => readFileSync(sti, 'utf8');
const fang = (tekst, regex, hva) => {
  const m = tekst.match(regex);
  if (!m) { feil.push(`Fant ikke ${hva}`); return null; }
  return m[1];
};

// ── piloten ──
const pilotVersjon = fang(les('app/index.html'), /var VERSJON = "([^"]+)"/, 'VERSJON i app/index.html');
const pilotJson = JSON.parse(les('app/versjon.json')).versjon;
if (pilotVersjon && pilotVersjon !== pilotJson) {
  feil.push(`Pilot-triaden drifter: index.html sier ${pilotVersjon}, versjon.json sier ${pilotJson}`);
}

// sw-cache-regelen: endres cachede pilotfiler, må sw.js endres i samme commit.
// (HEAD^ finnes ikke på aller første commit — da hopper vi over diff-sjekken.)
let endrede = [];
try {
  endrede = execSync('git diff --name-only HEAD^ HEAD', { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
} catch { /* første commit / grunt utsjekk uten forelder */ }
const pilotCachede = endrede.filter((f) =>
  /^app\/(index\.html|rapport\.html|bli-med\.html|admin\.html|.*\.js|.*\.css|.*\.json)$/.test(f)
  && f !== 'app/sw.js' && f !== 'app/changelog.json' && f !== 'app/versjon.json');
if (pilotCachede.length && !endrede.includes('app/sw.js')) {
  feil.push(`Cachede pilotfiler er endret (${pilotCachede.join(', ')}) uten at app/sw.js er bumpet — gamle filer vil serveres fra cache`);
}

// ── kjernen ──
const kjerneVersjon = fang(les('kjerne/app/js/app.js'), /const VERSJON = '([^']+)'/, 'VERSJON i kjerne/app/js/app.js');
const kjerneJson = JSON.parse(les('kjerne/app/versjon.json')).versjon;
const kjerneCache = fang(les('kjerne/app/sw.js'), /const CACHE = '([^']+)'/, 'CACHE i kjerne/app/sw.js');
if (kjerneVersjon && kjerneVersjon !== kjerneJson) {
  feil.push(`Kjerne-triaden drifter: app.js sier ${kjerneVersjon}, versjon.json sier ${kjerneJson}`);
}
if (kjerneVersjon && kjerneCache && kjerneCache !== `kjerne-v${kjerneVersjon}`) {
  feil.push(`Kjerne-cachen drifter: sw.js sier ${kjerneCache}, forventet kjerne-v${kjerneVersjon}`);
}

if (feil.length) {
  console.error('PUBLISERINGSVAKTA STOPPER:\n- ' + feil.join('\n- '));
  process.exit(1);
}
console.log(`Publiseringsvakta: triadene holder (pilot ${pilotVersjon}, kjerne ${kjerneVersjon}).`);
