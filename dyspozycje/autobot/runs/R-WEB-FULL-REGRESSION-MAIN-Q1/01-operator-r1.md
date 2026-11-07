STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FULL-REGRESSION-MAIN-Q1
GOAL: Pelny przebieg testow i bramek webowej gry na origin/main 9b019a7d8 (FALA 532), jeden raport zbiorczy A-E z podzialem na regresje nowe, dlugi przedistniejace, flaky, INFRA/TIMEOUT, zielone.
ZMIANY/COMMIT: wylacznie dyspozycje/autobot/runs/R-WEB-FULL-REGRESSION-MAIN-Q1/** (REPORT.md, results.csv, results-*.csv, rerun-*.csv, bisect-A.txt, gate-tsc.txt, notes-przebieg.txt, logs*/). Zero zmian w gra/**. SHA: patrz commit "R-WEB-FULL-REGRESSION-MAIN-Q1: Operator r1 raport" (git log tego brancha).
TESTY: inwentarz 1082; zmierzone 916; E=711, A=10, A?=17, B=133, C=5, D=40, NIE_ZMIERZONO=166 (161 testow przegladarkowych nieuruchomionych — budzet czasu przy load 13-21). tsc --noEmit: 0 bledow. Szczegoly: REPORT.md.
BLOKADY: obciazenie hosta (inne sesje), wolne miejsce na dysku 2.3-6 GB, Chromium/SwiftShader ~3-6 min na test; ref bez GPU. Pelnego przebiegu przegladarkowego nie ukonczono.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja klasyfikacji A/B, zgodnosc z allowlista); decyzja orkiestratora o dokonczeniu 161 testow przegladarkowych na nieobciazonej maszynie.
DEPLOY/PUSH: NIE WYKONANO
