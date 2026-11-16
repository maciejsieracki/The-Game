STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0
GOAL: Dodać stan doktryny jednostki (pola `unitDoctrine`, `groupId`, `rangedKite`, `shootingEnabled`, `dryCol`, `heldAfterFallback`, `lastAutoMoveFrom`, `antiCavSpear`, `mounted`, wejścia preferencji celów) z wartościami domyślnymi z pinu oraz czystą funkcję `_forwardCol` i typ `GroupDoctrine`, bez zmiany zachowania istniejących ścieżek.
ZMIANY/COMMIT: commit na gałęzi `K5DOC-PROD-UNIT-STAN-T0-wip` (SHA w sekcji DEPLOY/PUSH poniżej; commit po zapisie raportu). Baza: `origin/rust-port/parity-v2` = `1a4982574` (worktree detached, potem gałąź robocza). Pliki:
  - `rust-port/engine/src/domain/siege_tactics_doctrine_state.rs` (NOWY): `GroupDoctrine` (5 wariantów, `parse`), `BattleUnitClass`, `ProdDoctrineState` z `Default` (wartości z pinu podpisane plik:linia), `forward_col`.
  - `rust-port/engine/src/domain/mod.rs`: wyłącznie `pub mod siege_tactics_doctrine_state;`.
  - `rust-port/engine/src/domain/siege_tactics_loop.rs`: pole `doctrine: [Vec<ProdDoctrineState>; 2]` w `ProdBody`, inicjalizacja w `ProdBody::new` (domyślne wartości), accessor `ProdBody::doctrine(UnitRef)` (tylko odczyt), `use`.
  - `rust-port/engine/tests/p6_k5doc_state.rs` (NOWY): 8 testów.
  - `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0/01-operator-r1.md` (ten raport).
  Cargo.lock NIE dodany (nieśledzony, wygenerowany przez cargo).
TESTY:
  - `cargo fmt --check` (rust-port/engine): EXIT 0.
  - `cargo clippy --all-targets -- -D warnings`: EXIT 0.
  - `cargo test --all-targets --no-fail-fast`: EXIT 0; łącznie passed=3632, failed=0, ignored=1 (ignorowany test istniał wcześniej; nie dodałem `#[ignore]`). Nowy plik `p6_k5doc_state`: 8/8 ok.
  - Mutacja (a) `shooting_enabled` domyślnie `false`: FAIL (test `domyslne_pola_doktryny_zgodne_z_pinem`, assertion `atk.shooting_enabled`). Przywrócono.
  - Mutacja (b) `forward_col` z odwróconym znakiem (`col - advance_dir*steps`): FAIL (3 testy kierunkowe i clamp). Przywrócono; `cmp` potwierdza identyczność z wersją oryginalną.
  - Katalog celu cargo: poza repo (scratchpad `target-k5doc-t0`), do usunięcia po bramkach.
BLOKADY:
  - ODSTĘPSTWO OD DISPATCHU (uzasadnione): dispatch każe dodać pola do `ProdUnit`. Literał `ProdUnit` znajduje się też w `rust-port/engine/tests/p6_k5loop_outcome_pin.rs:173`, który NIE jest w allowliście (`p6_siege_tactics_loop_body*.rs` tego nie obejmuje). Dodanie pola do `ProdUnit` przerwałoby kompilację tego pliku. Stan doktryny trzymam więc w `ProdBody` (konstruktor `ProdBody::new` ustawia wartości domyślne), a `ProdUnit` i `ActivateUnit` pozostały nietknięte. Zmiana w `ProdUnit` wymaga decyzji orkiestratora (rozszerzenie allowlisty o `p6_k5loop_outcome_pin.rs`), jeśli następny temat ma czytać te pola z `ProdUnit`.
  - Pola `mounted` i `antiCavSpear` mają w pinie wartość wyliczaną z klasy jednostki (`isMounted(bu)`, `isAntiCavSpear(bu)`, battleScene.ts:4557-4558). Operator nie przenosi tej logiki (poza zakresem T0); domyślnie `false`, a wyliczenie przypisze adapter spawnu w przyszłym temacie.
  - Pole `attackDirection` (C-FLANK, pin ~2043) nie było na liście dispatchu i nie zostało dodane.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje zgodność wartości domyślnych i vektorów `_forwardCol` z pinem `gra/src/battle/battleScene.ts` (pin `07d2fbd72`, ścieżka w pinie to `gra/src/battle/battleScene.ts`, nie `gra/src/battleScene.ts`); decyzja o ProdUnit vs ProdBody wg BLOKADY powyżej.
DEPLOY/PUSH: NIE WYKONANO (brak push; gałąź robocza lokalna; parity-v2 nietknięte; origin/main nietknięte; gra/ nietknięte).
