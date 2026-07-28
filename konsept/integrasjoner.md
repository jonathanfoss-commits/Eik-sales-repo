# Integrasjonskatalog — Lærling som verktøyet til «alt»

*Utredet 28. juli 2026 av tre parallelle utredere (økonomi, kommunikasjon,
byggebransje-data) på Jonathans lanserings-bestilling. Ramme: ≤500 kr/mnd,
lokal-først er lov nummer én. Prioritet = verdi for Ole Fabian ÷ innsats.*

## Bygg nå (gratis, liten innsats, høy verdi)

1. **🔔 Web Push på iOS** — «TEST er klar til godkjenning» og purrepåminnelser
   rett på telefonen, helt gratis (VAPID + Netlify-funksjon, ingen tredjepart).
   Virker siden iOS 16.4 når appen ligger på hjemskjermen (det gjør den).
   Ærlig begrensning: iOS kan drepe abonnementet etter 1–2 ukers inaktivitet —
   «best effort», aldri eneste varsling for NS 8407-frister. Krever et lite
   server-lager for push-endepunkter (kun URL-er, aldri innhold) — **flagges
   for Jonathans godkjenning (lokal-først-unntak)**. Innsats: 2–3 kvelder.
2. **🌦 Vær i byggedagboken (MET/Yr, gratis)** — vær er standardfelt i dagbok
   som bevismateriale (værhindring, forsering). Locationforecast for i dag,
   Frost for etterregistrering; klient-side med IndexedDB-cache, avrundet
   posisjon. Innsats: 1 kveld.
3. **📍 Kartverket adresse-API (gratis, ingen nøkkel)** — adressesøk gir
   gnr/bnr + koordinat rett inn i tilbud/SHA-plan, og gir vær-oppslaget
   punktet sitt. Bygges sammen med 2. (Full Matrikkel med eierforhold krever
   avtale — ikke nå.)

## Bygg når behovet er bekreftet i pilotloggen

4. **💰 Regnskap: forfalte fakturaer inn i purretrappen** — steg 0 er å SPØRRE
   OLE FABIAN hvilket system OP Bygg bruker. Tripletex (vanligst i bygg-SMB,
   har også timegrunnlag-API — dikterte timer kan bli fakturagrunnlag) eller
   Fiken (API 99 kr/mnd, kun faktura-metadata). Én lesefunksjon, aldri lagring.
   Bygg kun mot systemet de faktisk har.
5. **🏢 «UE-sjekken» (Brønnøysund, gratis)** — orgnr-oppslag før UE-kontrakt:
   konkurs, avvikling, mva-registrering. Ærlig i UI: sier ingenting om
   skatterestanser (krever skatteattest). Liten jobb — men vent på signal om
   at OP Bygg kontraherer UE-er ofte.
6. **📱 SMS (Sveve)** — norsk, prepaid ~0,5–1 kr/SMS uten månedspris. Kun hvis
   push (1) viser seg utilstrekkelig, eller purring-per-SMS etterspørres.
   Krever konto med BankID (Jonathan).

## Utsatt med begrunnelse

- **E-post-sending fra appen:** mailto:/Kopier beholdes i pilot — avsender må
  være Ole Fabians egen adresse for tillit, og han beholder utboks/tråd i Mail.
  Den dagen sending bygges: **Brevo** (fransk, EU-servere, gratis 300/dag) —
  ikke Resend/Postmark (US-lagring). Samme beslutning som 19. juli: utsatt.
- **Vipps i purringer:** proffkunder betaler via KID; betalingslenke roter til
  avstemmingen. Manuell Vipps-lenke kan limes inn ved forbrukerkrav — null kode.
- **EHF/Peppol:** regnskapssystemet sender EHF ferdig. Lærling lager grunnlaget,
  aldri forsendelsen.
- **E-signering (Posten ~18 kr/signering):** aksept per e-post er bindende nok i
  praksis; størst personvernfotavtrykk av alt utredet (kontrakt + BankID hos
  tredjepart). Revurderes første gang en aksept faktisk bestrides.
- **Boligmappa:** sterkest for rørlegger/elektriker; totalentreprenør leverer
  FDV samlet ved overtakelse. Bedre: Lærling genererer FDV-oversikten selv fra
  varemottak + dagbok (lokal, gratis) — kandidat til backloggen.
- **Abonnerbar kalender-feed:** krever frister på server (bryter lokal-først),
  iOS oppdaterer feeds tregt. Dagens lokale .ics + push dekker behovet.

## Anbefalt rekkefølge (alle inne i budsjett — 0–99 kr/mnd)

Push-varsler → vær+adresse i dagbok/tilbud → regnskapsoppslag (etter svar fra
Ole Fabian) → UE-sjekken. SMS og e-post ligger klare som beslutninger, ikke
som kode. To spørsmål tas i lanseringsmøtet: hvilket regnskapssystem, og
kontraherer dere UE-er ofte?
