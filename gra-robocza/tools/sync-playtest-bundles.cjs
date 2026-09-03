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
  // Przywrócone P-REPO-2-BUNDLE-NIEODTWARZALNE-Q1 (2026-09-03): do 2026-07-27 te dwie
  // nazwy były synchronizowane tym samym mechanizmem "kopia Gra-ROBOCZA.html" co szóstka
  // wyżej (dowód: git log --all na obu plikach pokazuje identyczny blob SHA co
  // Gra-ROBOCZA.html w tych samych commitach aż do 74ad7f2a/2026-07-27), po czym
  // synchronizacja ustała i pliki zastygły na starej treści (md5 95021308) aż do
  // usunięcia w R-REPO-SPRZATANIE-SREDNIE-Q1 (commit 1f2b430f, 2026-08-26). Ten skrypt
  // sam w sobie NIGDY tych dwóch nazw nie znał (zweryfikowane: git log --all -p na tym
  // pliku nie zawiera ani razu "BITWA-DUZA"/"OBLEZENIE-DUZE") — synchronizował je inny,
  // nieznaleziony w repo mechanizm. Dopisanie tu przywraca ten sam efekt końcowy (plik
  // istnieje, jest AKTUALNYM bundlem gry pod nazwą trybu playtestu), ale NIE odtwarza
  // bajtowo historycznej, zamrożonej od 2026-07-27 treści (md5 95021308) — ta jest
  // nieodwracalnie tracona przy `git filter-repo`, patrz 01-recon-utrata.md w runie.
  'Gra-ROBOCZA-PLAYTEST-BITWA-DUZA.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-DUZE.html',
];
for (const n of names) {
  fs.copyFileSync(main, path.join(root, n));
  console.log('sync', n);
}
