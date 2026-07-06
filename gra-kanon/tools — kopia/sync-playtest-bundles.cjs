/** Kopiuje Gra-podglad.html -> wszystkie PLAYTEST-*.html (ten sam bundel, inna nazwa = inny tryb). */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const main = path.join(root, 'Gra-podglad.html');
if (!fs.existsSync(main)) {
  console.error('Brak', main);
  process.exit(1);
}
const names = [
  'Gra-podglad-PLAYTEST-WALKA.html',
  'Gra-podglad-PLAYTEST-ODSKOK.html',
  'Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-podglad-PLAYTEST-MAPA.html',
  'Gra-podglad-PLAYTEST-MIASTO.html',
];
for (const n of names) {
  fs.copyFileSync(main, path.join(root, n));
  console.log('sync', n);
}
