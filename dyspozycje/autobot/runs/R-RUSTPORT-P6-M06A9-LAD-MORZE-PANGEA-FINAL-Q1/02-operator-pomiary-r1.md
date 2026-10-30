STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A9-LAD-MORZE-PANGEA-FINAL-Q1
GOAL: Operator-pomiary na kodzie 7eb3c0ea (raport 5539e4b8): niezalezna regeneracja wektorow z pinu edb8fb56, trafienia graniczne, mutacje strukturalne z dowodami rownowaznosci, gate fmt/clippy/test z surowymi logami.
ZMIANY/COMMIT: dokument `dyspozycje/rust-port/p6/P6-M06A9-LAD-MORZE-PANGEA-FINAL.md` (rozdzial "Pomiary"); run: `mut-runner-pomiary.py`, `mut-results-pomiary.log`, `gate-fmt-pomiary.log`, `gate-clippy-pomiary.log`, `gate-test-pomiary.log`, ten raport. Kod i wektory bez zmian (SHA kodu 7eb3c0ea, raportu 5539e4b8, commit pomiarowy: patrz git log). Brak zmian w `landsea.rs`, `tests/`.
TESTY:
- Regeneracja wektorow z pinu (node, eksport `git archive edb8fb56 gra/src gra/data` do /tmp/claude-0/m06a9-pin): SHA-256 identyczne z repo dla fill/ratio/pangea (120/101/60 przyp.).
- Trafienia graniczne: `losowe-00022` ma dokladnie 40 suchych heksow (N, converted=12); prog-ladu 39/41 daje 0 zmian; mutanty na warunkach pasma (M01, M03, M04, M08) i progu 40 (M05) zabite.
- Mutacje: 21 mutantow, KILLED 15, RÓWNOWAZNE 3 (M02, M09, M19; dowody w dossier), NIE-ZABITE 3 (M07 nieekwiwalentny; M17 i M21 nieudowodnione).
- `cargo fmt -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test` (pelny silnik): 1400 passed, 0 failed, EXIT=0 (suma z logu).
- `git diff --check`: do wykonania przed commitem (patrz nizej).
BLOKADY:
- M07 (limit petli seaBand `maxW+2` -> `maxW`) PRZEZYWA i nie jest ekwiwalentny: brak wektora zatoki na granicy seaBand. Rodzina seaBand nie jest domknieta dowodowo.
- M17 (`dist < 0.01` -> `<=`) i M21 (`max_layers` -1) przezywaja; rownowaznosc nieudowodniona, brak wektora na granicy.
- Tabela M06A: 22 wiersze "dowod do potwierdzenia" bez zmian; "M06A KOMPLET" NIE zapisano.
- Dryf: dwa literaly `0.01` w webie (fill i radial) mapowane na jedno pole JSON `fill_dist_epsilon`; zapisane w dossier.
- Cargo.lock wygenerowany lokalnie (untracked) - NIE commitowany.
RUNDY: 1/5 (wywolanie pomiarowe w rundzie 1; po BLOCK wraca do Operatora-impl z ID tego samego tematu)
NASTEPNY KROK: Operator-impl r2: wektor zatoki seaBand (granica limitu maxW+2, wzor: run wody dlugosci maxW+1 w jedna strone przy bramie borderDepth) i dowod/wektor dla M17 i M21; potem ponowne pomiary i gate.
DEPLOY/PUSH: NIE WYKONANO
