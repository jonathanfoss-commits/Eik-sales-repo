// Ikoner som inline SVG i én strektykkelse, ikke emoji.
//
// Emoji tegnes av operativsystemet i full farge: 👥 ble knallblå og 🔀 knallrosa
// oppå en flate som ellers er dempet mørk skifer — og i etterlattemodus, som er
// lys og lun, ble de det aller mest påtrengende på skjermen hos et menneske i
// sorg. Disse arver farge fra teksten og oppfører seg som typografi.
const NS = 'http://www.w3.org/2000/svg';

// 24×24, strek 1.5, ingen fyll — samme visuelle vekt som brødteksten rundt.
const STIER = {
  hvelv: ['M5 20V10a7 7 0 0 1 14 0v10', 'M12 14v3', 'M12 10.5a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Z'],
  kontakter: ['M9 5.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z',
    'M3 19.5c0-3.3 2.7-5.4 6-5.4s6 2.1 6 5.4',
    'M16.6 7.4a2.4 2.4 0 1 1 0 4.8', 'M16.4 14.7c2.7.3 4.6 2.2 4.6 4.8'],
  matrise: ['M5 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', 'M19 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    'M19 15a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z', 'M7 11 17 7.6', 'M7 13l10 3.4'],
  status: ['M12 3.2 19 6v5.6c0 4.4-3 8.2-7 9.6-4-1.4-7-5.2-7-9.6V6Z'],
  meld: ['M12 3.2c1.7 1.7 2.5 3 2.5 4.1a2.5 2.5 0 0 1-5 0c0-1.1.8-2.4 2.5-4.1Z',
    'M12 9.3v2', 'M9.2 11.3h5.6v9.5H9.2Z'],
  etterlatt: ['M12 20.4S5 16 5 11.2a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 4.8-7 9.2-7 9.2Z'],
  koe: ['M4.5 13.2h3.8l1.4 2.6h4.6l1.4-2.6h3.8', 'M4.5 13.2 7 5.8h10l2.5 7.4v4.8a1.6 1.6 0 0 1-1.6 1.6H6.1a1.6 1.6 0 0 1-1.6-1.6Z'],
  logg: ['M5 6.5h14', 'M5 11.5h14', 'M5 16.5h9'],
};

export function ikon(navn) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '22');
  svg.setAttribute('height', '22');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of STIER[navn] || []) {
    const sti = document.createElementNS(NS, 'path');
    sti.setAttribute('d', d);
    svg.append(sti);
  }
  return svg;
}
