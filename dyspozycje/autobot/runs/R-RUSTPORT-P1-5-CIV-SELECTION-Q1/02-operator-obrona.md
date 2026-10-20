STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-5-CIV-SELECTION-Q1
GOAL: P1.5 — obrona Operatora wobec zarzutów Evaluatora (runda 1/5), pin main=edb8fb56.
ZMIANY/COMMIT: `dyspozycje/rust-port/p1/P1-5-CIV-SELECTION.md` (§2 Brąz, §3 pomiar układu, §4 klik, §6 404);
`dyspozycje/rust-port/p1/screenshots/P1-5-civ-selection-03-braz.png`, `...-04-klik-grecy.png`;
`dyspozycje/autobot/runs/R-RUSTPORT-P1-5-CIV-SELECTION-Q1/evidence-dom-measure.json`, `02-operator-obrona.md`.
SHA: brak (nie commitowano). Zapis tylko w allowliście.
TESTY: Świeży klon w scratchpadzie (`p1-5-def`), checkout edb8fb56, `npm ci` OK, Vite bezpośrednio na porcie 5190
(`--strictPort`), Chromium 1194, viewport 1600×900. Ponowny przebieg trzech epok z DOM i pomiarem.
`git status gra/data` = 0 linii (oryginalne repo). Vite ubity, port 5190 zamknięty.
Z1 (klik bez dowodu): PRZYJĘTE, uzupełnione. `click.before`=Rzymianie, `click.after`=Grecy, `click.selectedCards`=[Grecy]; zrzut 04.
Z2 (Brąz tylko z badge): PRZYJĘTE, uzupełnione. Zrzut 03-braz.png (14 kart), DOM: `cardCount`=14, lista 14 nazw. Zgodne z civs.json (8 kamień + 6 wpisów epokaWejscia=braz = 14; zelazo=15).
Z3 (mieści się bez przewijania): PRZYJĘTE, zawężone i zmierzone. Siatka kart kończy się na y=715 (w 900 px) — to prawda.
Ekran jako całość NIE mieści się bez przewijania: `.detail` 5386 px, przewijanie w `.civ-newgame.hero-flow` (overflow auto, scrollHeight 5731 vs 900). Strona (`documentElement`) = 900, więc przewijanie jest wewnętrzne. Dopisane w doc jako znalezisko.
BLOKADY: brak. Nowe znalezisko (do P1.16/P5): kolumna szczegółów 5386 px i wewnętrzne przewijanie ekranu. Anomalia 404 (1× w przebiegu startującym od Kamienia, 0 w pozostałych): hipoteza `/favicon.ico` (curl → 404), niepotwierdzona w przeglądarce, odłożona do P1.16.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (runda 2) weryfikuje zrzuty 03/04 i `evidence-dom-measure.json`; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
