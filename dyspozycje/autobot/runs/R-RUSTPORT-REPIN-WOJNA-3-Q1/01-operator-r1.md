STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-3-Q1
GOAL: Kontynuacja WOJNA-2: delta weba dc8a3adc..4bbef081d dla generałów/bitwy, integracja trybu bitwy i marszów z zapisem, hook marszu generała (generalQuickFollow <-> planned-march); wektory z pinu 4bbef081d.
ZMIANY/COMMIT: kod `51b791180` (`general_quick_follow.rs`, `pathfinding.rs` [2 helpery], `save_load.rs`, `tests/p6_repin_wojna_3_hook.rs`, `tests/p6_repin_wojna_3_vectors/hook.json` 665 kB, generator); dokumenty i logi: commit raportu (SHA poniżej w NASTĘPNYM KROKU). Dossier: `dyspozycje/rust-port/p6/P6-REPIN-WOJNA-3.md`. Poza allowlistą: brak (Cargo.lock wygenerowany przez cargo, niezacommitowany).
TESTY: `gate-fmt.txt` EXIT=0; `gate-clippy.txt` (--all-targets -D warnings) EXIT=0; `gate-test.txt` pełny `cargo test --no-fail-fast -j 2` EXIT=0, 260 binarek, 1981 passed / 0 failed; `git diff --check` czysty. Nowe: 7 testów `p6_repin_wojna_3_hook` (3 na 700 wektorach z weba). Weryfikator niezależny `verify-w3-hook.py` (python -I): 700/0 rozbieżności. Mutanty W3-M1..M16 (`mut-W3-*.log`): 16/16 zabite, brak równoważnych. Wektory R4 (`save-meta.json`) i R3 (`planned-march-general.json`) ponownie wygenerowane na pinie 4bbef081d: identyczne bajtowo.
WYNIKI:
1. Delta 6 plików: tylko `battleScene.ts:3471` (`_battleAwaitingOrders = true`). NIE-DOTYCZY silnika (brak pętli tur bitwy w Rust; renderer `picking.rs:1142` dostaje flagę jako parametr; `renderer/**` poza allowlistą) — kontrakt zapisany jako ZAŁOŻENIE. Bloki zapisu/odczytu w `main.ts` bajt-identyczne z dc8a3adc (po przesunięciu numeracji).
2. ZNALEZIONA ROZBIEŻNOŚĆ (naprawiona): wczytanie `plannedMarches` w formie webowej (obiekt kluczowany id) sortowało wpisy alfabetycznie (`serde_json::Value`), web zachowuje kolejność wstawiania (+ klucze-indeksy pierwsze). Test padał przed poprawką (przypadek 3). Poprawka: visitor mapy w `save_load.rs`.
3. Hook: `TrackedMarchDest` = alias `PlannedMarchDest` (jeden typ jak w webie); `sync_general_march_targets` (main.ts:28237-28250 + kolejka), `follow_off_clears` (main.ts:23497), `is_general_follow` (main.ts:13393), `MarchMap::to_save/from_entries`.
BLOKADY: brak. Uwaga środowiskowa: `/dev/shm` zajęte (~10 GB) przez inne worktree, `rustc` lib zabijany OOM; target na dysku `/home/user/cargo-target-w3` (usunięty po etapie).
ZAŁOŻENIA/NIE_ZMIERZONO: format zapisu Rust (lista) nie jest czytany przez web; `planGeneralFollowMarch` z prawdziwym `marchPathPlan`/mgłą — NASTĘPNA-PARTIA (planner = trait); NaN współrzędnych w łańcuchu hooka NIE_ZMIERZONO (wektory skończone; NaN generałów pokryte w R3).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (niezależna weryfikacja `verify-w3-hook.py`, mutanty, `cargo test`), następnie Obrona/Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
