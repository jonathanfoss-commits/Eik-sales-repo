// Versjonstriaden: VERSJON i app/js/app.js, app/versjon.json og cache-navnet i
// app/sw.js skal ALDRI drifte — regelen håndheves av denne testen, ikke hukommelse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROT = path.resolve(import.meta.dirname, '..');

test('versjonstriaden er samstemt', () => {
  const appJs = fs.readFileSync(path.join(ROT, 'app/js/app.js'), 'utf8');
  const versjonJson = JSON.parse(fs.readFileSync(path.join(ROT, 'app/versjon.json'), 'utf8'));
  const sw = fs.readFileSync(path.join(ROT, 'app/sw.js'), 'utf8');

  const vApp = appJs.match(/const VERSJON = '([^']+)'/)?.[1];
  const vSw = sw.match(/const CACHE = 'kjerne-v([^']+)'/)?.[1];

  assert.ok(vApp, 'fant VERSJON i app.js');
  assert.equal(versjonJson.versjon, vApp, 'versjon.json == app.js');
  assert.equal(vSw, vApp, 'sw.js-cachen == app.js');
});

test('service worker precacher alle modulfiler som finnes', () => {
  const sw = fs.readFileSync(path.join(ROT, 'app/sw.js'), 'utf8');
  for (const m of (sw.match(/'\.\/[^']+'/g) || []).map((s) => s.slice(3, -1))) {
    assert.ok(fs.existsSync(path.join(ROT, 'app', m)), 'precachet fil finnes: ' + m);
  }
  for (const fil of fs.readdirSync(path.join(ROT, 'app/js/moduler'))) {
    assert.ok(sw.includes(`'./js/moduler/${fil}'`), 'modulen er precachet: ' + fil);
  }
});
