STATUS: BLOCK
DOMAIN: GAME (POMIAR; kod gry nietkniety)
TEMAT: R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1
GOAL: pomiar 3 poziomow "Dyplomacja i wojna" (latwa/normalna/trudna), seed 4242 i 7, 90 tur, co 5; pin B2b.
ZMIANY/COMMIT: e5edebb45 (gra/tools/diplomacy-harder-measure-run.cjs: opcja --diplo-level, start przez __settingsLive.startNewGame z advanced.diplomacyWarLevel, odczyt getSettings po starcie i po wczytaniu slotu, pole diploLevel w kazdym wierszu i summary, TAG z sufiksem -lvl-<poziom>; gra/tools/diplomacy-harder-measure-hook-test.cjs: pin B2b do wartosci z data/diplomacy-harder-params.json, domyslnie true). Raport + surowe dane: dyspozycje/autobot/runs/R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1/.
TESTY: bundle z 83da0fb18 zbudowany poza repo (vite, 15 s, EXIT 0). NIE ZMIERZONO: tsc --noEmit, logic 213, tech-tree 20, research 33, unit-replace 21, combat 6, hook-testy z bundlem (21/0 oczekiwane), resume-test. Brak czasu/stabilnosci Chromium.
Pomiar: seed 4242, latwa: wiersze tur 5..75 (15 wierszy, jsonl.gz). Tury 80..90 i pozostale 5 biegow NIE WYKONANE.
  Odczyt surowy (latwa, seed 4242, all-flags 1): tura 30: wojny 0, sojusze AI-AI 0, zerwania zero-zaufania 0; tura 60: wojny 4, sojusze AI-AI 1, zerwania 6; tura 75: wojny 5, sojusze AI-AI 6, zerwania 16. Jednorazowy bieg, bez tabeli per poziom.
BLOKADY: (1) Chromium SIGSEGV przy wczytaniu slotu (tura 75): proby 2 i 3 nie przeszly (try 2 timeout 580 s, try 3 bez postepu). (2) Tempo tur spadlo z ~2 s do ~17 s i wyzej w 70-75. (3) Dokument POMIAR-POZIOMY-DYPLOMACJI-2026-11-20.md NIE powstal (brak danych dla 5 z 6 biegow).
RUNDY: 1/5
NASTEPNY KROK: wznowic seed 4242 latwa ze slotu dipl-measure-seed4242-all1-lvl-latwa (--stop-at 90, ten sam --out i --profile, MEASURE_CHROME_ARGS="--disable-gpu --mute-audio") w nowej rundzie; potem normalna/trudna i seed 7. Rozwazyc restart Chromium miedzy odcinkami.
DEPLOY/PUSH: NIE WYKONANO
