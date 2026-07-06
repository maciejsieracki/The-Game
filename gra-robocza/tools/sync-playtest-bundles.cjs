/** Kopiuje Gra-ROBOCZA.html -> wszystkie PLAYTEST-*.html (ten sam bundel, inna nazwa = inny tryb). */
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const main = path.join(root, 'Gra-ROBOCZA.html');
if (!fs.existsSync(main)) {
  console.error('Brak', main);
  process.exit(1);
}
const names = [
  'Gra-ROBOCZA-PLAYTEST-WALKA.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-ROBOCZA-PLAYTEST-MAPA.html',
  'Gra-ROBOCZA-PLAYTEST-MIASTO.html',
];
for (const n of names) {
  fs.copyFileSync(main, path.join(root, n));
  console.log('sync', n);
}
