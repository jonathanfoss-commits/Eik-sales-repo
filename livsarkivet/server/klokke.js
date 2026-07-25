// Injiserbar klokke: forretningslogikken tar imot `naa` som parameter og
// henter aldri tiden selv — slik kan testene fryse og spole tiden.
export function naa() {
  return new Date();
}
