STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-3-Q1
GOAL: Przeniesc do Rust delte weba `dc8a3adc..4bbef081d` (generalowie, bitwa): zapis trybu bitwy i marszow generala, hook `generalQuickFollow` <-> `planned-march`, wektory z pinu `4bbef081d`.
ZMIANY/COMMIT: SHA do integracji = `7371690a7` (kod `51b791180`, dokumenty `fff01ad85`, obrona `7371690a7`, baza `5f618f748` = origin/rust-port/parity-v2). Ten dokument: commit osobny, tylko docs.

WERDYKT PER ZARZUT:
1. Generator nie odtwarzal sie z czystego `git archive` (import `./generals`): ODDAL (naprawione w obronie). Generator sam podmienia import na kopii w WORK_DIR (asercja: dokladnie 1 wystapienie), runbook w `P6-REPIN-WOJNA-3.md` §4 (linia 41). Zweryfikowane: grep w generatorze i dokumencie. Zero zmian w kodzie Rust miedzy `51b791180` a `7371690a7` (`git diff --name-only` zawiera wylacznie `dyspozycje/**`).
2. Brak pelnego `cargo test` i wszystkich 16 mutantow u Evaluatora: ODDAL. Logi operatora sa spojne i kod Rust niezmieniony po nich: `gate-test.txt` 260 binarek, 1981 passed, 0 failed, jedna linia `EXIT=0`; `gate-fmt/clippy` po jednej linii `EXIT=0`; mutanty M1..M16 - kazdy log ma `FAILED` i `EXIT=101` (16/16). Nie uruchamialem ponownie pelnego testu ani mutantow (NIE_ZMIERZONO osobiscie).
Zadnego NAPRAW, zadnego DO DECYZJI CZLOWIEKA.

TESTY (wlasne, FC):
- `git diff --name-only 5f618f748 HEAD`: tylko allowlista (general_quick_follow.rs, pathfinding.rs, save_load.rs, tests/p6_repin_wojna_3_hook.rs, hook.json, P6-REPIN-WOJNA-3.md, katalog runu). Zero `gra/**`, `Cargo.toml`, `renderer/**`. `git diff --check` czysty.
- `cargo test -j 2 --test p6_repin_wojna_3_hook`: 7 passed, 0 failed.
- `cargo test -j 2 --lib`: 22 passed. `cargo fmt --check`: czysto.
- `python3 -I verify-w3-hook.py hook.json`: cases=700 fails=0.
- Logi gate: po jednej linii `EXIT=`.
- Target na `/dev/shm/w3fc`, usuniety; `Cargo.lock` usuniety.

BLOKADY: brak
NIE_ZMIERZONO / ZALOZENIA (bez zmian): NaN wspolrzednych w lancuchu hooka; `planGeneralFollowMarch` z prawdziwym plannerem (NASTEPNA-PARTIA); format zapisu Rust jako lista (web go nie czyta); `battleScene.ts:3471` NIE-DOTYCZY silnika.
RUNDY: 1/5 (Final Control)
NASTEPNY KROK: integracja orkiestratora. Kolejnosc wzgledem origin/rust-port/parity-v2 (`5f618f748`): fast-forward/cherry-pick `51b791180`, `fff01ad85`, `7371690a7`, potem commit FC; przed integracja ponownie fetch (inne tematy 8I/M07B3 rownolegle - rebase i powtorzenie bramek fmt/clippy/test po rebase).
DEPLOY/PUSH: NIE WYKONANO
