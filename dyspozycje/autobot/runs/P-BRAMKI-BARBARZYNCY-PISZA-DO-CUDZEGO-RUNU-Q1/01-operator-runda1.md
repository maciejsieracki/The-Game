# P-BRAMKI-BARBARZYNCY-PISZA-DO-CUDZEGO-RUNU-Q1 — Operator, runda 1

Baza potwierdzona `git log -1` w worktree: `63f4167e` (dispatch), origin/main.

## Ustalenie faktycznego zakresu (grep + realny przebieg — nie tylko statyczna lektura)

`grep -rl "R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1" gra/tools/` zwraca 4 pliki, nie 3:
`barb-karencja-czas-trwania-real-render-test.cjs`, `barbarian-cooperation-grace-test.cjs`,
`barbarian-cooperation-grace-maints-wiring-test.cjs` i
`dyplo-przemarsz-checkbox-przycisk-real-render-test.cjs`. Czwarty plik ma tylko wzmianki
komentarzowe (linie odsyłające do tego tematu jako "rodziny" UI) — zero zapisu, poza
allowlistą i poza tematem, pominięty.

Uruchomiłem WSZYSTKIE trzy nazwane bramki i sprawdziłem `git status --short` w całym repo
po każdej — a nie tylko przeczytałem kod:

- `barbarian-cooperation-grace-test.cjs`: 30 PASS/0 FAIL, zero zapisu jakiegokolwiek pliku
  (bundluje tylko do `__dirname`, brak Chromium/screenshotów). Drzewo czyste.
- `barbarian-cooperation-grace-maints-wiring-test.cjs`: 29 PASS/0 FAIL, analogicznie —
  zero zapisu do jakiegokolwiek katalogu runów. Drzewo czyste.
- `barb-karencja-czas-trwania-real-render-test.cjs`: PRZED zmianą realnie zapisywał 3 PNG
  do `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/dowody/` (potwierdzone
  logiem `[zrzut] .../R-DYPLO-.../dowody/*.png`) — jedyny z trzech, który faktycznie łamie
  guard. `git status --short` po przebiegu wyszedł pusty tylko dlatego, że pliki są już
  śledzone z identyczną zawartością bajt w bajt (deterministyczny render, animacje wyłączone)
  — sam fakt zapisu do cudzego katalogu (dowolna przyszła zmiana treści = brudne drzewo)
  jest defektem niezależnie od tego.

Wniosek: dispatch trafnie zidentyfikował plik-sprawcę, ale dwie bramki `barbarian-
cooperation-grace*` nigdy nie pisały do tego katalogu (nie mają Chromium/screenshotów w
ogóle) — nie wymagały zmiany. Naprawiłem wyłącznie faktyczny defekt.

## Zmiana (WYŁĄCZNIE `barb-karencja-czas-trwania-real-render-test.cjs`)

- Dodano `const os = require('os');`.
- `SHOT_DIR` zmieniony z twardej ścieżki `dyspozycje/autobot/runs/R-DYPLO-.../dowody/` na
  `fs.mkdtempSync(path.join(os.tmpdir(), \`bkct-dowody-${process.pid}-\`))` — wzorzec z
  `n12-zrzuty-zywy-chromium.cjs` i tematu `P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1` (`57c327d9`).
- Zero zmian logiki/asercji/`shot()`/pozostałego kodu.

## Testy (po zmianie)

- `barb-karencja-czas-trwania-real-render-test.cjs`: **13 PASS, 0 FAIL** (identyczna liczba
  asercji co przed zmianą — sprawdzone `grep -n "check("`). Zrzuty trafiają do
  `/tmp/bkct-dowody-<pid>-XXXXXX/*.png`.
- `barbarian-cooperation-grace-test.cjs`: 30 PASS/0 FAIL (bez zmian, referencyjnie).
- `barbarian-cooperation-grace-maints-wiring-test.cjs`: 29 PASS/0 FAIL (bez zmian, referencyjnie).
- `git status --short` w CAŁYM repo po uruchomieniu wszystkich trzech: wyłącznie
  ` M gra/tools/barb-karencja-czas-trwania-real-render-test.cjs`. Zero śladu w
  `dyspozycje/autobot/runs/R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1/**`.
- `tsc --noEmit`: zielony (exit 0).
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19,
  `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 —
  wszystkie zielone.

## GOAL pkt 4 (kopia do własnego `dowody/`)

Nie zrobione — priorytet dispatchu ("PRIORYTETEM jest zaprzestanie pisania do cudzego,
śledzonego katalogu") jest zrealizowany; ten temat nie ma własnego katalogu `dowody/`
utworzonego przed pracą, a tworzenie nowego śledzonego katalogu tylko po to, by dublować
zrzuty, nie jest wymagane przez BINARNE KRYTERIUM SUKCESU. Pozostawiam do decyzji ABC, jeśli
właściciel jednak chce trwały ślad PNG w repo.
