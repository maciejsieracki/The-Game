STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-UI-2-G-Q1
GOAL: Repin UI-2-G dla #26 `cityPanel.ts`: przepiąć bloki K01–K09 z pinu `edb8fb56` na web `86d510c66`, potem K09C/K09D (jeśli zmieszczą się w rundzie).

ZMIANY/COMMIT:
- Branch `rp-ui2g-q1-r2` od commita Operatora r1 `d049f45a6`.
- `984694e12` (kod): pozostałe 136 markerów (30 plików) przepięte, 19/19 DRIFT, więc razem 25/25. Do tego K03, delegaty nowych nazw webu, weryfikatory, harnessy, mutacje, CONTENT w `npm run check` i `repin-ui2g-rangemap.json`.
- `0ab54695a` (dokument): `P5-REPIN-UI-2.md`, wiersze #26 i nowa §7.
- Zmiany tylko w allowliście. `gra/**`, `src/controller/**`, `src-tauri/src/**`, `Cargo.*` i `WERSJE.md` bez zmian.

ODPOWIEDZI NA ZARZUTY:
- Z1 PRZYJMUJĘ. K05B, K06B (z ↑↓✕), K07A, K07B, K08A–E i K09A są w całości na webie: 322 markery, wszystkie `86d510c66`. K03 ma 3 adaptacje DTO. K02 i K04 nie wymagały zmian (§7.1).
  - K09C/K09D: ODRZUCAM zrobienie ich w tym ID. Dowód: `showCityPanelFromDto` ma 0 wywołań, a kontroler i silnik leżą poza allowlistą. Jawny delegat jest w §7.4.
- Z2 PRZYJMUJĘ.
  - `renderBuildList` przekazuje `brakZasobow`.
  - `getManpowerMultipliers` i `costMult` trafiają do K05B. Fixture k05b ma wariant `costMult≠maxMult`, a mutant `jedn-rekrut-costmult` jest zabity.
  - Luka wiringu kontrolera jest zmierzona (`wiring.gap`). Lista nazw z właścicielami (K09C/P6/UI-2-D) jest w §7.4.
- Z3 PRZYJMUJĘ. k06b, k07a i k09a są zielone. Przyczyny przypisane: K09B r2 `0a1761d80` i K08B r1 `82049d69b`.
- Z4 PRZYJMUJĘ. Wpis K06A ma `why` przypisujące go do K09B r2, w tej samej klasie co wpisy K06B i K09A (§7.2). Akceptacja należy do Final Control.
- Z5 PRZYJMUJĘ. `npm run check` uruchamia 21 bramek treści (CONTENT). Mutacje treści w 4 partiach: 4/4 dały FAIL `check`.
- Z6 PRZYJMUJĘ. `pinFile` pochodzi z sha1 bloba wejścia. Na webie: `(86d510c66)`.

TESTY (web = `git archive 86d510c66`, pin = `git archive edb8fb56`):
- `tsc --noEmit`: 0 błędów.
- `npm run check`: EXIT 0. Wynik: kblocks 37 plików, 322 zakresy, `treść_bramek=21`. `git diff --check`: czysto.
- Weryfikatory: 20/20 zielone na webie, 20/20 czerwone na pinie. `--web-dir PIN`: CONTENT 20/20 FAIL.
- Harnessy na webie: 36/37. `run-k02-styles` różni się tylko przez #14 `unitRecruitCard.ts` (UI-2-C). Po izolacji tego pliku daje 14/0.
- Mutacje na webie:
  - k05b 93/93, k05b-dto 8/8;
  - k06b, k07a, k07b: survived 0;
  - k08a i k08b-rail: 22 zabite + 1 równoważna; k08b-title 11/11, k08c-podzial 10/10, k08c-wiring 14/14;
  - k08d: 6+11, 10, 16, 21;
  - k08e: 12+15;
  - k09a 42/42 (1 NIE_ZMIERZONO), k09b 28/28.
- `run-repin-ui2g` (Chromium 141): 9216/0, PNG równe, ERR 0, sha fixtury bez zmian.

BLOKADY: technicznych brak.
- Nota: Chromium/PNG dla bloków r2 NIE_ZROBIONE. Dowodem są harnessy jsdom pin-exec i bramki CONTENT.
- GPU i natywne okno Tauri: NIE_ZMIERZONO.

RUNDY: 2/5

NASTĘPNY KROK: Evaluator r2, potem Final Control. K09C/K09D w osobnym ID (§7.4).

DEPLOY/PUSH: NIE WYKONANO
