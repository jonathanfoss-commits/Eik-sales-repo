// 100 % dekning av tilstandsmaskinen: HVER kombinasjon av (fra, til, aktør)
// prøves mot en HÅNDSKREVET fasitliste — dobbelt bokholderi, så en glipp i
// overgangstabellen ikke kan gjemme seg bak sin egen definisjon.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TILSTANDER, TERMINALE, AKTORER, kanGaa, fireOyneOk, klarForVerifisering, erUtlopt }
  from '../server/frigivelse.js';

// Fasit: de ENESTE lovlige overgangene, skrevet for hånd (ikke avledet av tabellen).
const FASIT = [
  ['meldt', 'attest_lastet_opp', 'kontakt'],
  ['meldt', 'tilbakekalt', 'melder'],
  ['attest_lastet_opp', 'under_verifisering', 'system'],
  ['attest_lastet_opp', 'tilbakekalt', 'melder'],
  ['under_verifisering', 'godkjent_1', 'admin'],
  ['under_verifisering', 'avvist', 'admin'],
  ['under_verifisering', 'tilbakekalt', 'melder'],
  ['godkjent_1', 'karenstid', 'admin'],
  ['godkjent_1', 'avvist', 'admin'],
  ['karenstid', 'blokkert', 'eier'],
  ['karenstid', 'frigitt', 'system'],
];
const fasitNokkel = new Set(FASIT.map((f) => f.join('→')));

test('full matrise: hver (fra, til, aktør)-kombinasjon matcher fasitlisten', () => {
  let provde = 0;
  for (const fra of TILSTANDER) {
    for (const til of TILSTANDER) {
      for (const aktor of AKTORER) {
        provde++;
        const forventet = fasitNokkel.has([fra, til, aktor].join('→'));
        assert.equal(kanGaa(fra, til, aktor), forventet,
          `kanGaa(${fra}, ${til}, ${aktor}) skulle vært ${forventet}`);
      }
    }
  }
  // tellesjekk: hele rommet er faktisk prøvd
  assert.equal(provde, TILSTANDER.length ** 2 * AKTORER.length);
  assert.equal(TILSTANDER.length, 9);
  assert.equal(AKTORER.length, 5);
});

test('terminale tilstander tar ingen overganger i det hele tatt', () => {
  assert.deepEqual(TERMINALE.sort(), ['avvist', 'blokkert', 'frigitt', 'tilbakekalt']);
  for (const fra of TERMINALE) {
    for (const til of TILSTANDER) {
      for (const aktor of AKTORER) {
        assert.equal(kanGaa(fra, til, aktor), false);
      }
    }
  }
});

test('ukjente tilstander og aktører avvises', () => {
  assert.equal(kanGaa('tull', 'frigitt', 'system'), false);
  assert.equal(kanGaa('karenstid', 'tull', 'system'), false);
  assert.equal(kanGaa('karenstid', 'frigitt', 'hacker'), false);
  assert.equal(kanGaa(undefined, undefined, undefined), false);
});

test('eier-blokkering finnes KUN i karenstid', () => {
  for (const fra of TILSTANDER) {
    const lov = kanGaa(fra, 'blokkert', 'eier');
    assert.equal(lov, fra === 'karenstid', `blokkert fra ${fra}`);
  }
});

test('tilbakekall er stengt fra og med første godkjenning', () => {
  for (const fra of TILSTANDER) {
    const lov = AKTORER.some((a) => kanGaa(fra, 'tilbakekalt', a));
    const forventet = ['meldt', 'attest_lastet_opp', 'under_verifisering'].includes(fra);
    assert.equal(lov, forventet, `tilbakekall fra ${fra}`);
  }
});

test('frigitt kan bare nås av system, fra karenstid', () => {
  for (const fra of TILSTANDER) {
    for (const aktor of AKTORER) {
      const lov = kanGaa(fra, 'frigitt', aktor);
      assert.equal(lov, fra === 'karenstid' && aktor === 'system');
    }
  }
});

// ── Fire-øyne ──
test('fire øyne: to ulike admin-er kreves', () => {
  assert.equal(fireOyneOk('a1', 'a2'), true);
  assert.equal(fireOyneOk('a1', 'a1'), false);   // samme admin to ganger: nei
  assert.equal(fireOyneOk(null, 'a2'), false);
  assert.equal(fireOyneOk('a1', null), false);
  assert.equal(fireOyneOk(null, null), false);
});

// ── To-kilde-regelen ──
test('to kilder: attest kreves alltid', () => {
  assert.equal(klarForVerifisering({ harAttest: false, antallBetrodde: 1 }), false);
  assert.equal(klarForVerifisering({ harAttest: false, antallBetrodde: 3, harUavhengigBekreftelse: true }), false);
});

test('to kilder: én betrodd kontakt → attest + fire-øyne er nok', () => {
  assert.equal(klarForVerifisering({ harAttest: true, antallBetrodde: 1, harUavhengigBekreftelse: false }), true);
});

test('to kilder: flere betrodde → uavhengig bekreftelse kreves', () => {
  assert.equal(klarForVerifisering({ harAttest: true, antallBetrodde: 2, harUavhengigBekreftelse: false }), false);
  assert.equal(klarForVerifisering({ harAttest: true, antallBetrodde: 2, harUavhengigBekreftelse: true }), true);
});

// ── Karenstid-utløp med injisert klokke ──
test('erUtlopt: grensene sekundet før, på og etter slutt', () => {
  const slutt = new Date('2026-07-21T12:00:00Z');
  const f = { status: 'karenstid', karenstid_slutt: slutt.toISOString() };
  assert.equal(erUtlopt(f, new Date(slutt.getTime() - 1000)), false);
  assert.equal(erUtlopt(f, slutt), true);
  assert.equal(erUtlopt(f, new Date(slutt.getTime() + 1000)), true);
});

test('erUtlopt: aldri i andre tilstander eller uten sluttidspunkt', () => {
  const naa = new Date('2027-01-01T00:00:00Z');
  for (const status of TILSTANDER.filter((t) => t !== 'karenstid')) {
    assert.equal(erUtlopt({ status, karenstid_slutt: '2026-01-01T00:00:00Z' }, naa), false);
  }
  assert.equal(erUtlopt({ status: 'karenstid', karenstid_slutt: null }, naa), false);
});
