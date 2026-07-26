// Zero-knowledge-krypto for sensitiv-tier (ADR-001, godkjent av Jonathan).
// Ren WebCrypto — kjører uendret i nettleseren OG i Node-testene (samme API).
// Serveren ser BARE det som kommer ut herfra: salt, iv og chiffertekst.
//
// Nøkkelhierarki:
//   sikkerhetsfrase ──PBKDF2──► frasenøkkel ──pakker──► hvelvnøkkel (tilfeldig)
//   hvelvnøkkel ──pakker──► elementnøkkel (tilfeldig per element)
//   elementnøkkel ──AES-GCM──► innholdet
//   gjenopprettingsnøkkel = delA (vises eieren ÉN gang) XOR delB (i databasen)
//     ──pakker──► hvelvnøkkel  (begge deler kreves — serveren alene kan intet)
//   mottaker: ECDH P-256 — elementnøkkelen pakkes til mottakerens offentlige
//     nøkkel med engangs-nøkkelpar; privatnøkkelen ligger frasepakket hos
//     mottakeren selv. Serveren kan aldri åpne deponiet.
const subtle = globalThis.crypto.subtle;
const tilfeldig = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fraB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

const PBKDF2_ITERASJONER = 310000;

async function fraseNokkel(frase, salt) {
  const materiale = await subtle.importKey('raw', new TextEncoder().encode(frase),
    'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERASJONER, hash: 'SHA-256' },
    materiale, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function pakkMed(nokkel, raa) {
  const iv = tilfeldig(12);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, nokkel, raa);
  return { iv: b64(iv), ct: b64(ct) };
}

async function utpakkMed(nokkel, pakke) {
  return new Uint8Array(await subtle.decrypt(
    { name: 'AES-GCM', iv: fraB64(pakke.iv) }, nokkel, fraB64(pakke.ct)));
}

const somAes = (raa, bruk = ['encrypt', 'decrypt']) =>
  subtle.importKey('raw', raa, 'AES-GCM', false, bruk);

// ── Hvelvnøkkel: opprett, lås opp, gjenopprett ──

// Lager alt eieren trenger ved første sensitive element. Returnerer det som
// skal til serveren (pakket) og det som skal til brukeren (gjenopprettingskode
// — vises ÉN gang).
export async function opprettHvelvnokler(frase) {
  const hvelvRaa = tilfeldig(32);
  const salt = tilfeldig(16);
  const fn = await fraseNokkel(frase, salt);
  const gjenoppretting = tilfeldig(32);
  const delA = tilfeldig(32);
  const delB = new Uint8Array(32);
  for (let i = 0; i < 32; i++) delB[i] = gjenoppretting[i] ^ delA[i];
  const gn = await somAes(gjenoppretting);
  return {
    tilServer: {
      salt: b64(salt),
      iterasjoner: PBKDF2_ITERASJONER,
      hvelvnokkel_pakket: await pakkMed(fn, hvelvRaa),
      gjenoppretting_pakket: await pakkMed(gn, hvelvRaa),
      gjenoppretting_del_b: b64(delB),
    },
    gjenopprettingskode: b64(delA), // til utskrift — finnes aldri på serveren
  };
}

export async function laasOppHvelvnokkel(frase, lagret) {
  const fn = await fraseNokkel(frase, fraB64(lagret.salt));
  return somAes(await utpakkMed(fn, lagret.hvelvnokkel_pakket));
}

// Tapt frase: gjenopprettingskoden (delA) + serverens delB → hvelvnøkkelen,
// som pakkes om med ny frase. Serverens del alene er verdiløs.
export async function gjenopprettHvelvnokkel(gjenopprettingskode, lagret, nyFrase) {
  const delA = fraB64(gjenopprettingskode);
  const delB = fraB64(lagret.gjenoppretting_del_b);
  const gjenoppretting = new Uint8Array(32);
  for (let i = 0; i < 32; i++) gjenoppretting[i] = delA[i] ^ delB[i];
  const gn = await somAes(gjenoppretting);
  const hvelvRaa = await utpakkMed(gn, lagret.gjenoppretting_pakket);
  const salt = tilfeldig(16);
  const fn = await fraseNokkel(nyFrase, salt);
  return {
    tilServer: { salt: b64(salt), iterasjoner: PBKDF2_ITERASJONER,
      hvelvnokkel_pakket: await pakkMed(fn, hvelvRaa),
      gjenoppretting_pakket: lagret.gjenoppretting_pakket,
      gjenoppretting_del_b: lagret.gjenoppretting_del_b },
  };
}

// ── Elementer: krypter/dekrypter med elementnøkkel pakket av hvelvnøkkelen ──

export async function krypterElement(hvelvnokkel, klartekst) {
  const elementRaa = tilfeldig(32);
  const en = await somAes(elementRaa);
  return {
    innhold: JSON.stringify(await pakkMed(en, new TextEncoder().encode(klartekst))),
    nokkelRef: JSON.stringify(await pakkMed(hvelvnokkel, elementRaa)),
  };
}

export async function dekrypterElement(hvelvnokkel, innhold, nokkelRef) {
  const en = await somAes(await utpakkMed(hvelvnokkel, JSON.parse(nokkelRef)));
  return new TextDecoder().decode(await utpakkMed(en, JSON.parse(innhold)));
}

// ── Mottakere: eget nøkkelpar, privatnøkkelen frasepakket hos dem selv ──

export async function opprettNokkelpar(frase) {
  const par = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const salt = tilfeldig(16);
  const fn = await fraseNokkel(frase, salt);
  const privRaa = new TextEncoder().encode(JSON.stringify(
    await subtle.exportKey('jwk', par.privateKey)));
  return { tilServer: {
    offentlig: await subtle.exportKey('jwk', par.publicKey),
    salt: b64(salt), iterasjoner: PBKDF2_ITERASJONER,
    privat_pakket: await pakkMed(fn, privRaa),
  } };
}

async function delEcdhNokkel(privatnokkel, offentligJwk) {
  const pub = await subtle.importKey('jwk', offentligJwk,
    { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  return subtle.deriveKey({ name: 'ECDH', public: pub }, privatnokkel,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

// Eieren pakker elementnøkkelen til en mottakers offentlige nøkkel med et
// ENGANGS-nøkkelpar (kun engangs-offentlig-delen lagres — perfekt forover-
// hemmelighold per deponi).
export async function pakkTilMottaker(hvelvnokkel, nokkelRef, mottakerOffentligJwk) {
  const elementRaa = await utpakkMed(hvelvnokkel, JSON.parse(nokkelRef));
  const engangs = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const felles = await delEcdhNokkel(engangs.privateKey, mottakerOffentligJwk);
  return JSON.stringify({
    engangs_offentlig: await subtle.exportKey('jwk', engangs.publicKey),
    pakke: await pakkMed(felles, elementRaa),
  });
}

export async function aapneSomMottaker(frase, minNokkelLagret, deponi, innhold) {
  const fn = await fraseNokkel(frase, fraB64(minNokkelLagret.salt));
  const privJwk = JSON.parse(new TextDecoder().decode(
    await utpakkMed(fn, minNokkelLagret.privat_pakket)));
  const priv = await subtle.importKey('jwk', privJwk,
    { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const d = JSON.parse(deponi);
  const felles = await delEcdhNokkel(priv, d.engangs_offentlig);
  const en = await somAes(await utpakkMed(felles, d.pakke));
  return new TextDecoder().decode(await utpakkMed(en, JSON.parse(innhold)));
}
