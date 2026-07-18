// AI-gatewayens kostnadsregning og vaktposter — uten nettverk.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { beregnKostOre, validerEvne, TILLATTE_MODELLER } from '../server/ai/gateway.js';

test('kostnad regnes riktig for kvalitetsmodellen (opus-4-8)', () => {
  // 1M input + 1M output = $5 + $25 = $30 → 315 kr → 31 500 øre
  const ore = beregnKostOre('claude-opus-4-8', { input_tokens: 1e6, output_tokens: 1e6 });
  assert.equal(ore, 31500);
});

test('cache-lesing er ~10 % av input-prisen', () => {
  const uten = beregnKostOre('claude-opus-4-8', { input_tokens: 1e6, output_tokens: 0 });
  const med = beregnKostOre('claude-opus-4-8', { input_tokens: 0, cache_read_input_tokens: 1e6, output_tokens: 0 });
  assert.equal(med, uten / 10);
});

test('haiku er billig-modellen', () => {
  const opus = beregnKostOre('claude-opus-4-8', { input_tokens: 1e5, output_tokens: 1e5 });
  const haiku = beregnKostOre('claude-haiku-4-5', { input_tokens: 1e5, output_tokens: 1e5 });
  assert.ok(haiku < opus / 4, 'haiku skal være vesentlig billigere');
});

test('ukjent modell gir 0 øre — og validerEvne nekter den', () => {
  assert.equal(beregnKostOre('claude-tullemodell', { input_tokens: 1e6, output_tokens: 0 }), 0);
  assert.throws(() => validerEvne('x', { instruks: 'i', modell: 'claude-tullemodell' }),
    /uten prisoppføring/);
});

test('validerEvne krever instruks og modell', () => {
  assert.throws(() => validerEvne('x', null), /Ukjent AI-evne/);
  assert.throws(() => validerEvne('x', { modell: TILLATTE_MODELLER[0] }), /Ukjent AI-evne/);
});
