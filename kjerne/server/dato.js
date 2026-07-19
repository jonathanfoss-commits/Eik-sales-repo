// «I dag» er alltid norsk tid: mellom midnatt og 02:00 er UTC-datoen
// gårsdagen, og både fristvakta og autopiloten skal følge byggeplassens
// klokke, ikke serverens. 'sv-SE' gir ISO-format (YYYY-MM-DD).
export const osloDato = () =>
  new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Oslo' });
