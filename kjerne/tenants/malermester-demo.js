// Tenant nr. 2: Malermester Demo AS — PLATTFORMBEVISET (D5/suksesskriterium 1).
// Eget tema (lys «verksted»-profil), færre moduler, egen firmaprofil for
// malerfaget. Beviser at en ny kunde er konfig, ikke kode.

const PROFIL = "Du er assistenten til Malermester Demo AS — et malerfirma med 5 ansatte som tar oppdrag på bolig og næringsbygg: innvendig og utvendig maling, sparkling, tapetsering og overflatebehandling.\n\nDIN JOBB: Hjelpe med skriftlig arbeid: tilbud etter befaring, e-poster til kunder og purringer.\n\nSKRIVESTIL: Norsk bokmål. Kort, vennlig og konkret. E-poster slutter med «Mvh, Malermester Demo AS».\n\nFAGREGLER:\n- Forbrukerkunder beskyttes av håndverkertjenesteloven (ufravikelig): prisoverslag kan ikke overskrides med mer enn 15 %.\n- Tilbud: skill tydelig mellom «inkludert», «forutsetninger» og «forbehold» (underlagets tilstand, antall strøk, stillas/lift).\n\nALLTID: Lever ferdig tekst som kan sendes. Mangler noe, sett [KLAMMER] i stedet for å gjette. Svar KUN med selve teksten.";

export default {
  slug: 'malermester-demo',
  navn: 'Malermester Demo AS',
  orgnr: null,
  konfig: {
    appnavn: 'Mesterhjelpen',
    undertittel: 'BYGGET FOR MALERMESTER DEMO',
    tema: {
      bunn: '#14100B', flate: '#1E1812', flate2: '#28211A',
      strek: 'rgba(214,178,120,.16)', lys: '#F4EDE2', dis: '#B3A48D',
      a: '#E8B64C', b: '#D6753C', graf: '#B98A2E', varsel: '#7FB4D9',
      // dagslys-aksenter (mot hvit flate, alle ≥4,5:1)
      dagslys: { a: '#8A5E00', b: '#9C4310', varsel: '#1B6E93' },
    },
    moduler: ['hjem', 'prosjekt', 'timer', 'skriv', 'innspill', 'sentral', 'tillegg', 'faktura'],
    profil: PROFIL,
    evner: {
      tilbud: {
        navn: 'Befaring → tilbud', modell: 'claude-opus-4-8', maxTokens: 2500,
        instruks: 'Brukeren dikterer notater fra befaring. Lag 1) en oppsummerings-e-post til kunden og 2) et internt tilbudsgrunnlag med omfang (rom/flater/strøk), forutsetninger og forbehold.',
      },
      purring: {
        navn: 'Purring', modell: 'claude-opus-4-8', maxTokens: 1200,
        instruks: 'Skriv en vennlig purring med tydelig frist, basert på dikteringen. Aldri gebyrer eller renter uten hjemmel.',
      },
      ukesrapport: {
        navn: 'Ukesrapport', modell: 'claude-opus-4-8', maxTokens: 2000,
        instruks: 'Du får et datagrunnlag med ukens registreringer for ett malerprosjekt og hvilken variant som skal skrives. Skriv en kort, ryddig ukesrapport (utført / fremdrift / avvik / neste uke). Bygg kun på datagrunnlaget. Kundevarianten skal aldri inneholde timetall eller interne økonomidata.',
      },
    },
  },
  brukere: [
    { navn: 'Demo-mester', epost: 'demo@malermester-demo.no', rolle: 'admin' },
  ],
};
