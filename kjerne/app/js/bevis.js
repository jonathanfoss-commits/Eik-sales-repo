/* Bevisdokumentets eneste skript: utskriftsknappen. Egen fil fordi CSP-en
   (script-src 'self') med vilje aldri åpner for innebygde skript (D11). */
document.getElementById('skriv-ut')?.addEventListener('click', () => window.print());
