STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A2-LAD-MORZE-RESZTA-Q1
GOAL: Partia 1 RUNDA-2 M06A (4 symbole: removeInlandWaterPools, fillEnclosedWaterByLandNeighbors, removeSmallInlandWaterPools, removeInlandSeaPools) - weryfikacja niezalezna, mutacje, bramki.
ZMIANY/COMMIT: baza operatora-impl c5d51408 (detached). Dodane w tej roli: `dyspozycje/rust-port/p6/P6-M06A2-LAD-MORZE-RESZTA.md` (sekcja "Pomiary r1", poprawka trafien fill), `runs/.../02-operator-pomiary-r1.md`, `runs/.../gate-*-r1v.log`, `runs/.../mut-M01..M16*.log`. Kod nie zmieniony (`landsea.rs` po mutacjach przywrocony, `git diff` pusty). Push NIE wykonany.
TESTY:
- Weryfikator: generator `gen-m06a2-vectors.mjs` uruchomiony ponownie z `git archive edb8fb56` -> `web-vectors.json` IDENTYCZNY bajt-w-bajt (cmp). Wynik: counts 89/117/90/71, sha ab934703... zgodny z meta.
- cargo fmt --check: EXIT=0 (`gate-fmt-r1v.log`)
- cargo clippy --all-targets -- -D warnings: EXIT=0 (`gate-clippy-r1v.log`)
- cargo test: EXIT=0, passed=1232 failed=0 (`gate-test-r1v.log`)
- Mutacje (16): 13 KILLED asercja/zawieszenie-wykryte, 1 SURVIVED rownowazne (M04: brak `if n==0 break`), 2 SURVIVED nierownowazne (M02 limit przebiegow 7, M03 limit 9). Szczegoly: tabela w dokumencie M06A2 sekcja "Pomiary r1".
- Trafienia progow (boundary_rel z pliku): fill -1:7 / 0:8 / +1:6; pool -1:8 / 0:8 / +1:8.
BLOKADY:
- LUKA POKRYCIA: limit przebiegow `FILL_ENCLOSED_MAX_PASSES=8` (web :4191) nie jest osiagany przez zadne wektory (M02/M03 przezywaja). Zalozenie Z-6 w dokumencie: nie blokuje partii 1; wektor lancucha >=8 przebiegow musi wejsc w partii 2/rundzie 2.
- Rozbieznosc raportu Operatora-impl: podane trafienia fill 6/7/6 nie zgadzaja sie z plikiem (7/8/6). Poprawione w dokumencie.
- Test pętli BFS (`remove_small_inland_water_pools`) nie ma watchdoga: usuniecie `visited` daje zawieszenie zamiast asercji (M09). Zalecenie: limit iteracji w tescie lub asercja na czas.
- Cargo.lock wygenerowany przy budowie i usuniety (nie commitowany). Wspoldzielony katalog targetu `cargo-target-shared/wf_806cd4d4-c64-2` usuniety po zakonczeniu.
- RUNDA-2 nadal 21 wierszy (lista w dokumencie); partia 2 bez zmian.
RUNDY: 2/5 (runda Operator-pomiary liczona jako kontynuacja rundy 1 tematu)
NASTEPNY KROK: Evaluator (niezalezna ocena z tym dowodem) -> Final Control; przed zamknieciem partii 1: dodac wektor limitu przebiegow (M02/M03) i watchdog w tescie BFS.
DEPLOY/PUSH: NIE WYKONANO
