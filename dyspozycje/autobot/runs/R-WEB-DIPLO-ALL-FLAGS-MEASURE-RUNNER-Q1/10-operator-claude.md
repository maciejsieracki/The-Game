STATUS: PASS-WITH-NOTES
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; zachowanie gry bez zmian, flagi domyślnie OFF)
TEMAT: R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1
GOAL: Runner `--all-flags 0|1` i hak łączny do pomiaru wszystkich 6 flag dyplomacji (OFF vs ON), analizator, testy i dowodowy bieg ≤45 tur.
ZMIANY/COMMIT: baza origin/main 6b3458f6e. Allowlista zachowana:
- gra/src/main.ts: blok civTest `__diploAllFlagsMeasure` (setAll, status, zerwaniaZeroZaufania) obok `__diploHarderMeasure`.
- gra/tools/diplomacy-harder-measure-run.cjs: `--all-flags 0|1`, pliki `seed<S>-all<0|1>`, pole `allFlags`, `flagi`, `liczniki`; tryb `--harder` bez zmian.
- nowe gra/tools/diplomacy-all-flags-measure-counters.cjs (liczniki z par), -analyze.cjs (OFF vs ON, tury 25/50/75/100/125/150, NIE_ZMIERZONO), -hook-test.cjs (test haka/runnera/analizatora z mutacjami kopii).
- dyspozycje/autobot/runs/R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1/10-operator-claude.md i evidence-seed4242-all1.summary.json.
Commit: SHA w polu sha orkiestratora (commit po zapisie raportu).
TESTY:
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; unit-replace-test 21/21; combat-test OK.
- diplomacy-harder-measure-hook-test: 14 zielonych, 0 czerwonych (bez --build: część B pominięta).
- measure-forced-peace-test 13/13; measure-close-modals --selftest 5/5.
- ai-ai-alliance-tick-test 19/19 (mutanty 8/8); ai-ai-coalition-test ZIELONE; diplomacy-alliance-strength-unit-test 33/0; diplomacy-harder-unit-test 50/0; diplomacy-war-limit-unit-test 48/0; diplomacy-zero-trust-unit-test 43/0; ai-ai-alliance-measure-hook-test ZIELONY.
- diplomacy-all-flags-measure-hook-test: 24 zielonych, 0 czerwonych (mutacje kopii licznika i analizatora czerwone).
- Bieg dowodowy: seed 4242, `--all-flags 1 --player-ai 1`, 45 tur, 44 wiersze (tury 2–45), wallSec 287, stop=null. setAll(1) potwierdzone odczytem: wszystkie 7 flag true. Liczniki: t26 sojusze AI↔AI 0, NAP 0, zerwania 0; t45 wojny równoległe maks. 1, wojny łącznie 4, sojusze 0, zerwania 0.
- Bieg OFF (`--all-flags 0`) NIE wykonany: NIE_ZMIERZONO, analizator nie był uruchomiony na danych OFF vs ON.
BLOKADY: brak. Uwaga: w trybie --all-flags pola `harder` w wierszach = stan flagi z haka (nie flaga --harder).
RUNDY: 1/5
NASTĘPNY KROK: orkiestrator: bieg OFF i ON ≥3 ziaren × 150 tur (domyślnie seed 4242, 7, 99; seed 1234 nie sprawdzony pod kątem STALL1234). Komendy (z gra/, bundle poza repo, osobny profil na bieg):
  node tools/diplomacy-harder-measure-run.cjs --dist <abs-dist> --out <abs-out> --seed <S> --turns 150 --all-flags <0|1> --player-ai 1 --profile <abs-profil-S-flaga>
  w tle przez `setsid nohup ... &` (poza agentem); analiza: node tools/diplomacy-all-flags-measure-analyze.cjs --off <abs-out-OFF> --on <abs-out-ON>.
  Czas: 45 tur ≈ 290 s na tej maszynie (≈6 s/tura, rośnie z turą).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dysk: przed startem 22 GB wolnego (44% użycia), nic nie usunięto. Worktree wf_fbb87104-1ca-1 (1,1 GB) i /home/user/meas są poza tematem i nie były ruszane. /tmp ma 1,5 GB (nie moje, nie ruszane).
- Polecenia Bash z `cd <worktree> && git ...` i wieloczęściowe pipe'y z `cd /home/user/The-Game` są blokowane w tej izolacji worktree.
