# Prioritering — til kveldsteamets ekspertpanel

*Fra lunsjtriagen. Verdi × innsats, høyest først. Panelet gjør endelig vurdering.*

1. ⚠ HASTER **Sentralkode-rotasjon uten kode i repo** *(fra Musk-reviewen 20. juli;
   koden var eksponert offentlig via GitHub Pages)* — bygg om admin.html/lab.html til å
   verifisere sentralkoden mot serverfunksjonen (innspill.js svarer 200/401) i stedet for
   lokalt PBKDF2-avtrykk, og fjern den hardkodede koden i innspill.js (kun PILOT_API_KODE
   fra miljøet). Da roterer Jonathan koden ved å sette én miljøvariabel i Netlify (begge
   siter) og dele den nye koden muntlig/SMS — ingen kode i repo eller chat noensinne.
   Personvernvakta + Frontend er riktige eksperter.
