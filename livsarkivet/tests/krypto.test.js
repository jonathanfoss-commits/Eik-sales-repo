// Nivå 3 — kryptomodulen (ren, uten DB): rundturer for eier og mottaker,
// gjenoppretting ved tapt frase, og negativtestene som beviser at
// servermaterialet ALENE aldri er nok.
import test from 'node:test';
import assert from 'node:assert/strict';
import { opprettHvelvnokler, laasOppHvelvnokkel, gjenopprettHvelvnokkel,
  krypterElement, dekrypterElement, opprettNokkelpar, pakkTilMottaker,
  aapneSomMottaker } from '../app/js/krypto.js';

const KLARTEKST = 'Koden til safen er 1234. Bankboks i DNB, avtalenr 998877.';

test('eier: krypter → dekrypter rundtur med riktig frase', async () => {
  const { tilServer } = await opprettHvelvnokler('min lange sikkerhetsfrase');
  const hn = await laasOppHvelvnokkel('min lange sikkerhetsfrase', tilServer);
  const { innhold, nokkelRef } = await krypterElement(hn, KLARTEKST);
  assert.ok(!innhold.includes('safen'), 'chifferteksten lekker ikke klartekst');
  assert.equal(await dekrypterElement(hn, innhold, nokkelRef), KLARTEKST);
});

test('negativ: feil frase åpner ingenting', async () => {
  const { tilServer } = await opprettHvelvnokler('riktig frase her');
  await assert.rejects(laasOppHvelvnokkel('feil frase her!', tilServer));
});

test('negativ: SERVERMATERIALET alene kan ikke dekryptere (zero-knowledge)', async () => {
  const { tilServer } = await opprettHvelvnokler('hemmelighet serveren aldri ser');
  const hn = await laasOppHvelvnokkel('hemmelighet serveren aldri ser', tilServer);
  const { innhold, nokkelRef } = await krypterElement(hn, KLARTEKST);

  // alt serveren har: tilServer + innhold + nokkelRef. Forsøk uten frasen:
  const serverAlt = JSON.stringify({ tilServer, innhold, nokkelRef });
  assert.ok(!serverAlt.includes('safen') && !serverAlt.includes('998877'),
    'klartekst finnes ingen steder i servermaterialet');
  await assert.rejects(laasOppHvelvnokkel('', tilServer), 'tom frase feiler');
  // gjenopprettingsdel B alene (uten del A som kun eieren har) er verdiløs:
  await assert.rejects(
    gjenopprettHvelvnokkel(tilServer.gjenoppretting_del_b, tilServer, 'ny frase 123456'),
    'del B brukt som kode feiler — begge deler kreves');
});

test('gjenoppretting: tapt frase → kode del A + serverens del B → nytt innhold tilgjengelig', async () => {
  const { tilServer, gjenopprettingskode } = await opprettHvelvnokler('frasen jeg kommer til å glemme');
  const hn1 = await laasOppHvelvnokkel('frasen jeg kommer til å glemme', tilServer);
  const { innhold, nokkelRef } = await krypterElement(hn1, KLARTEKST);

  // frasen er tapt — gjenopprett med koden og sett ny frase
  const { tilServer: nyLagring } = await gjenopprettHvelvnokkel(
    gjenopprettingskode, tilServer, 'min helt nye frase');
  const hn2 = await laasOppHvelvnokkel('min helt nye frase', nyLagring);
  assert.equal(await dekrypterElement(hn2, innhold, nokkelRef), KLARTEKST,
    'gammelt innhold åpner med ny frase — uten re-kryptering');
  // og den gamle frasen er død mot den nye lagringen
  await assert.rejects(laasOppHvelvnokkel('frasen jeg kommer til å glemme', nyLagring));
});

test('mottaker: deponi pakket til offentlig nøkkel åpner kun med mottakers frase', async () => {
  const { tilServer } = await opprettHvelvnokler('eierens frase 12345');
  const hn = await laasOppHvelvnokkel('eierens frase 12345', tilServer);
  const { innhold, nokkelRef } = await krypterElement(hn, KLARTEKST);

  const { tilServer: mottakerNokkel } = await opprettNokkelpar('mottakerens egen frase');
  const deponi = await pakkTilMottaker(hn, nokkelRef, mottakerNokkel.offentlig);
  assert.ok(!deponi.includes('safen'), 'deponiet lekker ikke klartekst');

  assert.equal(
    await aapneSomMottaker('mottakerens egen frase', mottakerNokkel, deponi, innhold),
    KLARTEKST);
  await assert.rejects(
    aapneSomMottaker('feil frase hos mottaker', mottakerNokkel, deponi, innhold));
});

test('mottaker: en ANNEN mottakers nøkkelpar åpner ikke deponiet', async () => {
  const { tilServer } = await opprettHvelvnokler('eierens frase 12345');
  const hn = await laasOppHvelvnokkel('eierens frase 12345', tilServer);
  const { innhold, nokkelRef } = await krypterElement(hn, KLARTEKST);
  const { tilServer: riktig } = await opprettNokkelpar('frase A');
  const { tilServer: feilPar } = await opprettNokkelpar('frase B');
  const deponi = await pakkTilMottaker(hn, nokkelRef, riktig.offentlig);
  await assert.rejects(aapneSomMottaker('frase B', feilPar, deponi, innhold));
});
