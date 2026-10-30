STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1
GOAL: Port Pangei i kontynentow, partia 1 (erodePangeaBboxLowScoreRim :3551, carvePangeaLongSideGulfs :3606, applyLandFractionByContinent :3701; rebalanceLandFractionPangea :3667 RUNDA-2). Runda 2 (Operator-pomiary): weryfikator niezalezny, mutacje galezi sterujacych, dowody rownowaznosci, pomiar trafien na granicach, gate'y.
ZMIANY/COMMIT: kod bez zmian (baza 3d3b4aa8). Dokument `dyspozycje/rust-port/p6/P6-M06A6-LAD-MORZE-PANGEA.md` (sekcja "Runda 2 - pomiary", poprawka liczby hunkow dryfu 4 -> 8). Run: mut-runner-m06a6.py, measure-boundaries-m06a6.py, verify-regen-m06a6-r2.log, mutations-r2.log, measure-boundaries-r2.log, gate-fmt-r2.log, gate-clippy-r2.log, gate-test-r2.log. Commit pomiarow: patrz sekcja nizej.
TESTY:
- Weryfikator: ponowna generacja z pinu edb8fb56 - erode/carve/contfrac BAJTOWO IDENTYCZNE z repo (EXIT=0).
- fmt: EXIT=0 (gate-fmt-r2.log). clippy --all-targets -D warnings: EXIT=0 (gate-clippy-r2.log).
- test engine: EXIT=0, 1305 passed, 0 failed (gate-test-r2.log).
- Mutacje: 37; zabite 28; rownowazne 7 (dowody D1-D6); NIE-rownowazne bez zabojcy: 2 (K08, K09).
- diff --check: EXIT=0.
BLOKADY:
1. K08 - galaz guardu NaN sumy wynikow (`sum_all.is_nan()`) nieprzetestowana: 0 przypadkow z NaN w landScores. Kod zgodny z web (`|| 1`), brak testu.
2. K09 - tolerancja sortu kandydatow morse (`>` vs `>=` przy |Δscore| = 0.04) bez trafienia w miejscu decyzji mimo 164 par z dokladnie 0.04 w float. Wymagany przypadek: scores 0.0 i 0.04 (0.04 - 0.0 == 0.04 w float), odwrotna kolejnosc odleglosci od centrum.
3. rebalanceLandFractionPangea wymaga portu fillPangeaAnnularSeaCorridors (:4595) i ensurePangeaSingleContinent (:4375) - bez zmian z rundy 1.
RUNDY: 2/5
NASTĘPNY KROK: Operator-impl (ten sam ID, runda 3): dodac wektory z uruchomionego weba dla K08 (NaN w landScores) i K09 (tie 0.04 w sorcie morse) oraz testy; ponownie zmutowac K08/K09 (oczekiwane KILLED); potem Evaluator i Final Control. Bez oslabiania istniejacych testow.
DEPLOY/PUSH: NIE WYKONANO
