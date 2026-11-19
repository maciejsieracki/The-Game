STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; domyślne wartości flag bez zmian)
TEMAT: R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1
GOAL: runner `--all-flags 0|1` + hak `__diploAllFlagsMeasure` + analizator OFF vs ON; pomiar 3 ziaren x 150 tur robi orkiestrator.
ZMIANY/COMMIT: kandydat 36fede45aa8b28901c13cf875553d66fa5aae4f9; baza 6b3458f6e3e219d576cfc2d47f6244513a04c804 jest przodkiem (merge-base --is-ancestor: tak). 9 plików, +605/-4: main.ts (+27, wyłącznie blok haków civTest obok __diploHarderMeasure), diplomacy-harder-measure-run.cjs, 3 nowe diplomacy-all-flags-measure-*.cjs, dowody i raporty w runs/<ID>/. Wszystko w allowliście; brak gra/data, WERSJE.md, gra-robocza/kanon, rust-port. `git diff --check` czysto.
TESTY (własne, surowe wyjście, worktree na 36fede45a):
- tsc --noEmit: 0 błędów (exit 0)
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- all-flags hook-test 34/0; analyze --selftest 21/0; counters --selftest 7/0
- harder-measure-hook-test: 14/0 bez bundla; z `--build 1` (realny bundle + Chromium) 21/0 (część B zielona)
- measure-forced-peace-test 13/13; measure-close-modals --selftest zielony (5)
- flagi: harder-unit 50/0, zero-trust 43/0, war-limit 48/0, alliance-strength 33/0, war-limit-analyze 17/0
- własna mutacja kopii analizatora (`>= 50` -> `> 50`): samotest 19 zielonych / 2 czerwone (zarzut 1 naprawiony)
- runner: `--all-flags 1 --harder 1` odrzucony komunikatem (zarzut 4 naprawiony)
- dowód: evidence-seed4242-all1.jsonl 44 wiersze, summary flagi wszystkie true (7 flag), counters poprawnego kształtu; t45: wojny równoległe maks 1, reszta 0
OCENA ZARZUTÓW: 1 naprawiony (potwierdzone mutacją); 2 częściowo — testy haka tekstowe, ale część behawioralna B (hak harder) zielona przy buildzie, a bieg dowodowy potwierdza setAll(true) -> 7 flag true; ścieżka setAll(false)/null nie jest behawioralnie zmierzona (UWAGA); 3 naprawiony (jsonl w commicie), bieg OFF niewykonany (poza zakresem tej rundy); 4 naprawiony; 5 naprawiony (analizator odrzuca niezgodne zestawy ziaren), ziarno 1234 NIE_ZMIERZONO.
BLOKADY: brak blokujących. Niewykonane z założenia: bieg OFF, 3 ziarna x 150 tur, ziarno 1234.
RUNDY: 1/5 (FC)
UWAGI-DLA-ORKIESTRATORA: (a) puszczać te same ziarna (4242/7/99) po obu stronach OFF i ON; ziarno 99 zamiast 1234 dopóki STALL1234 niezweryfikowany; (b) po pierwszym biegu OFF potwierdzić, że summary.flagi = wszystkie false; (c) jsonl dowodowy ma 44 wiersze dla 45 tur (endTurn 45) — kosmetyka; (d) dysk: 18 GB wolne, npm ci wykonany w worktree tego FC.
NASTĘPNY KROK: integracja orkiestratora (FF 36fede45a na main) -> pomiary OFF/ON.
DEPLOY/PUSH: NIE WYKONANO
