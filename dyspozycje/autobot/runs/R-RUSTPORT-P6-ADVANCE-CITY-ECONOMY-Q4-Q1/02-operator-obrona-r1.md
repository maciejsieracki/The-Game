STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1
GOAL: Port 1:1 pętli miast `advanceCityEconomy` (pin `4bbef081d`) + spłata długu z -Q1 (`simulateResourcePipelineForPreview`); odstępstwo = ZAŁOŻENIE.

ZMIANY/COMMIT: baza Operatora `69cec74ba`; kod, wektory, dowody, doc: `dab374310048e8a0dda5164a212f17a84d626c69`; raport: następny commit. Worktree `/home/user/The-Game/.claude/worktrees/wf_34613405-855-3`. Nowe: `turn_economy_preview.rs`, `tests/p6_adv_q4_preview.rs`, `q4b.json`, `q4c.json`, generator/weryfikator/mutacje -Q4b. Zmienione istniejące: `mod.rs` (1 linia `pub mod`), `tests/p6_adv_q4_pipeline.rs` (mój plik z R1), doc Q4. Zero zmian w `gra/**`, `Cargo.toml`, `WERSJE.md`.

ODPOWIEDZI NA ZARZUTY
1. Dług -Q4b: PRZYJMUJĘ. `simulate_resource_pipeline_for_preview` zaportowane 1:1 z `:1389-1560`, niemutujące (test `assert_eq!(cities, before)`). Wektory z uruchomionego weba (eksport `__simPreview` doklejony esbuildem w pamięci). `q4.json` regenerowany BAJT W BAJT (`cmp`, md5 `a7e17b6d...`). 642 scenariusze bazowe + 1348 własnych (4073 miasta), bitowo zgodne. Doc: sek. 3b, 4.
2. Weryfikator nie liczy plonów, zdrowia, `kosztRacji`, `wzrostProcent`: ODRZUCAM jako błąd, PRZYJMUJĘ jako lukę. Dla -Q4b dodałem `verify-p6-adv-q4b-preview.py` (`python3 -I`, bez Rust): 54 scenariusze, 192 sprawdzenia, 0 rozbieżności, kontrola negatywna wykrywa. Tylko klasy bez bogatego terenu. Dla pętli Q4 luki zostają jawne (NIE_ZMIERZONO, doc sek. 3), bo wymagają niezależnej implementacji tabel terenu i budynków.
3. Mutanty: PRZYJMUJĘ. L135 usunięty z liczby (no-op). L122 zmierzony w trybie ręcznym (`q4c.json`, 139 miast ręcznych, pop 0 i 0,4), nadal przeżywa, dowód `okolica/auto.rs:104-105`; L126 zostaje z dowodem. Pierwsza próba -Q4b dała 64 % zabitych: wektory nie obserwowały capu, kolejności konwerterów ani Soli. Dopisane klasy (`prevres`, `prevz`, `prevempty`, `prevmag`, `prevgate`, `prevsol`, `prevt`) podniosły do 39/50. Znaleziony i naprawiony błąd generatora (współdzielony obiekt `ownerMaps` przenosił bramkę między scenariuszami). 11 ocalałych ma dowody plik:linia (doc sek. 6b): brutto 78,0 %, netto 100 % (39/39). Brutto < 90 %, próg spełniony wariantem "ekwiwalenty z dowodem".
4. Z-Q4-3 i resolver Mennicy: PRZYJMUJĘ jako uwagę do -Q5, zapisane w doc sek. 5 razem z Z-Q4b-1..4.

TESTY: `cargo fmt --check`, `clippy --all-targets -D warnings`, `git diff --check`: EXIT=0 (`gate-*-obrona.txt`). Pełny `cargo test -j 2` w shardach PO ostatniej zmianie kodu: 22 + 502 + 451 + 357 + 316 + 405 = 2053/0 (baza 2050 + 3 testy: manual, preview, loop). Każdy log ma jedną linię `EXIT=`.

BLOKADY: brak. NIE_ZMIERZONO: wejścia terenowe podglądu poza klasami `prevsol/prevempty/prevmag` liczone tylko web<->Rust; `bagno` zdrowia; wiązanie z `ai_turn` (-Q5).

ZAŁOŻENIA DO AKCEPTACJI WŁAŚCICIELA: Z-Q4-1..7 oraz Z-Q4b-1..4 (m.in. limit 6 MB per plik: 7,92 MB łącznie).

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator R2, Final Control; osobno -Q5.
DEPLOY/PUSH: NIE WYKONANO
