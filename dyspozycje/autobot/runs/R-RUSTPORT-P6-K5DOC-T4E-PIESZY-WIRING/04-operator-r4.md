# Operator r4: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (T4e-0)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (wpięcie ruchu pieszego w ProdBody, zakres T4e-0)
GOAL: podpiąć jeden krok ruchu (`krok -> do_move_effects`) w `ProdBody`: koszt per jednostka (`mounted`), zajętość `occ_by_key` (D3), jawny błąd `MissingTerrain` bez wartości domyślnej (D1). Zakres T4e-0 wg DODATKU r2/r3/r4; pełny `_advanceStep` 1-10 zostaje w T4e-1.
BAZA: `origin/rust-port/parity-v2` = `c120f2373` (worktree detached, zgodnie z DODATKIEM r4). PIN: `07d2fbd72` (tylko odczyt).

ZMIANY/COMMIT:
- `rust-port/engine/src/domain/siege_tactics_move_effects.rs`: WYŁĄCZNIE nowy trait `MoveTerrain` (passable, move_cost, is_ford, cavalry_multiplier). Żadnych innych zmian w pliku.
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (ProdBody):
  - pola `terrain: Option<Box<dyn MoveTerrain>>` i `occ_by_key: HashMap<CellKey, String>`; `occ_by_key` seedowane z pozycji jednostek w `ProdBody::new` (`seed_occupancy`);
  - `MissingTerrain` (błąd) i `MoveStepResult { move_left, outcome }`;
  - adapter `ProdMoveWorld` (implementuje `MoveWorld`): koszt `_moveCostForUnit` (`battleScene.ts:7436-7443`) z `mounted` z `ActivateUnit`; `update_facing` = no-op (#107);
  - `ProdBody::with_terrain`, `ProdBody::occ_by_key`, `ProdBody::move_step(unit, col, row, refused, move_left, autobatch) -> Result<MoveStepResult, MissingTerrain>`.
- `rust-port/engine/tests/p6_k5doc_t4e.rs` (NOWY): 6 testów (wektory, brak terenu, koszt kawaleria/piechota, brod, seed zajętości, kolejność efektów).
- `rust-port/engine/tests/p6_k5doc_t4e_gen.mjs` (NOWY): generator; WYKONUJE tekst pina `_doMove` (`:8685-8776`) i `_moveCostForUnit` (`:7436-7443`) przez TypeScript; straże wycinków (SHA-256 wycinków w wektorze).
- `rust-port/engine/tests/p6_k5doc_t4e_vectors/vectors.json` (NOWY): 313 przypadków (36 odmów, 141 kawaleria, 152 planowanie), wygenerowane przez `node p6_k5doc_t4e_gen.mjs`.
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/04-operator-r4.md` (ten raport).
- NIE zmieniano: `Cargo.lock`, `gra/`, `renderer/`, `view-model/`, `siege_tactics_advance.rs`, `siege_tactics_move_effects.rs` poza traitem.
- Trailery commitu: bez nazwy modelu (#289).

DECYZJE (wykonane wg rozstrzygnięć orkiestratora, nie podejmowane przez wykonawcę):
- D1: trait `MoveTerrain`; `ProdBody.terrain: Option<Box<dyn MoveTerrain>>`; brak danych = `Err(MissingTerrain)` przed jakąkolwiek mutacją (także przy odmowie, bo wejście do adaptera jest wymagane).
- D2: czas kroku (`STEP_GAP_MS`) nie wchodzi do `do_move_effects`; `LoopBody` nietknięty.
- D3: `occ_by_key` w `ProdBody`, aktualizowane przez `MoveWorld::occ_mut`.
- D4: w tej rundzie tylko T4e-0 (jeden krok, bez `_advanceStep` 1-10).
- Koszt per jednostka: `mounted` czytane z `ActivateUnit` tej jednostki; mnożnik kawalerii z `MoveTerrain::cavalry_multiplier`; `Infinity` gdy nieprzejezdne lub mnożnik nieskończony.

TESTY:
- `cargo fmt -p civ-engine -- --check`: czysto (exit 0 po `rustfmt --edition 2021` na zmienionych plikach).
- `cargo clippy -p civ-engine --all-targets -- -D warnings`: exit 0.
- `cargo test -p civ-engine --test p6_k5doc_t4e`: 6/6 ok.
- Generator: `node rust-port/engine/tests/p6_k5doc_t4e_gen.mjs` -> OK, 313 przypadków (pin zgodny z wartościami nazwanymi).
- `cargo test -p civ-engine --all-targets --no-fail-fast` (CARGO_TARGET_DIR poza repo, `timeout 1800`): exit 0; 521 plików testowych, 3887 passed, 0 failed.
- Mutacje (każda MUSI dać FAIL; kod przywrócony z kopii, `cmp` = zerowy diff):
  - (a) pominięcie aktualizacji `occ_mut` w `do_move_effects`: FAIL (`pin_vectors_match_move_step`, `facing_is_called_last_after_occupancy_update`).
  - (b) brak błędu `MissingTerrain` (wartość domyślna `move_left - 1`): FAIL (`missing_terrain_is_explicit_error_without_mutation`).
  - (c) odwrócenie kolejności occ/facing (facing przed zajętością): FAIL (`facing_is_called_last_after_occupancy_update`).
  - (d) `mounted` ignorowane (koszt piechoty dla jazdy): FAIL (`cavalry_and_foot_pay_different_cost_on_forest`, `pin_vectors_match_move_step`).
- Dysk: 16 GB wolne przed bramkami (61% użycia); targety w scratchpadzie, do usunięcia po zapisie raportu.

BLOKADY / NIE_ZMIERZONO:
- `update_facing` w adapterze jest no-op: `_updateFacing` (`battleScene.ts:8334`) to dług #107 (zablokowany), zgodnie z DODATKIEM r4. Kolejność wywołania jest testowana przez rejestrator `MoveWorld`, nie przez stan facing.
- `cavalryTerrainMultiplier` (`gra/src/game/combat.ts:756`) NIE jest wykonywany z pina: generator używa tabeli `CAV_TABLE` (Las=2, Gory=Infinity, reszta=1) wg komentarza pina. Wykonanie `combat.ts` wymagałoby `findTerrainEntry`/`normTerrain` i danych `terrain-combat.json`; poza wycinkami pina tej rundy.
- `terrainMap` (passable, moveCost, combatTerrainName, at) jest stubem w generatorze; wartości kafelków pochodzą z wektora.
- `move_step` nie ma jeszcze produkcyjnego wołającego: `ProdBody` nie jest podpięte do `SiegeLoop` (#113), a `_advanceStep` (krok 1-10, T4e-1) nie jest wpięte. Test end-to-end sekwencji tury z ruchem pieszego pochodzi z testów `p6_k5doc_t4e`, nie z pętli produkcyjnej.
- `occ_by_key` jest seedowane wszystkimi jednostkami z `ProdBody::new` (także martwymi, jeśli takie przyjdą); web seeduje zajętość przy rozstawieniu. Brak testu dla jednostek martwych przy starcie (nie występuje w obecnych wejściach).
- Identyfikator jednostki w `occ_by_key` = `unit_tag` (`atk<i>` / `def<i>`), nie `bu.nazwa`; spójne z `ProdBody::names` tylko przy domyślnych nazwach.

RUNDY: 4/5 (dispatch r4; r1-r3 bez kodu lub niewykonane wg dispatchu)
NASTĘPNY KROK: Evaluator (Sonnet) na zakres T4e-0 i Final Control; po FC integracja orkiestratora. Osobny temat T4e-1 (`_advanceStep` 1-10, kawaleria, brody) dopiero po integracji T4e-0.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi `rust-port-wip/p6-k5doc-t4e-r4-op`; bez push do parity-v2).
