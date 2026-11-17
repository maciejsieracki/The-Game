# DISPATCH R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (runda 1) — wpięcie ruchu pieszego w ProdBody (#315, odblokowuje #123)

DOMENA: GAME (Rust, engine). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET. BEZ zmian w renderer/ i gra/.
BAZA (jedyna): `origin/rust-port/parity-v2` = `760be5187` (zawiera T4a `312`, T4b `313`, T4c `314`, T4 `258`). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_advanceStep` (decyzja pieszego, kroki 1–10), `_doMove` (ok. 8685–8776), `_stepToward`, `_bfsFirstStep`. Każdy wektor z `plik:linia` pinu.
RUST (istniejące, nie przepisuj): `rust-port/engine/src/domain/siege_tactics_pathstep.rs` (T4a), `siege_tactics_advance.rs` (T4b: `advance_step_decide`, trait `AdvanceWorld`, `AfterStep::Schedule`), `siege_tactics_move_effects.rs` (T4c: `do_move_effects`, trait `MoveWorld`), `siege_tactics_loop.rs:1092` (`ProdBody<R: RollSource>`).

## CEL
Podpiąć ruch pieszego (krok `advance_step_decide` → `do_move_effects`) w `ProdBody`, tak aby tura pieszej jednostki wykonywała ruch z efektami (occByKey, koszt terenu, facing). Decyzja orkiestratora: koszt ruchu liczony PER JEDNOSTKA (zależy od `mounted`), nie stałą wartością z pinu dla całej grupy.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (wiring ProdBody)
- `rust-port/engine/src/domain/mod.rs` (tylko jeśli nowy moduł)
- `rust-port/engine/tests/p6_k5doc_t4e*.rs`, `p6_k5doc_t4e_gen.mjs`, `p6_k5doc_t4e_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/**`

## NIE ROBIĆ
- Nie zmieniaj `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, `siege_tactics_advance.rs`/`_move_effects.rs` poza ich publicznym API (jeśli wymagana zmiana — BLOCK z uzasadnieniem).
- Nie dodawaj nazwy modelu do trailerów commitów.
- Nie używaj `#[ignore]` ani osłabiania asercji.

## BRAMKI (engine, crate civ-engine w `rust-port/engine`)
- `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- Przed bramkami i przed każdą mutacją: `df -h /`. Wymagane ≥ 8 GB. Przy < 8 GB: BLOCK INFRA z liczbą GB, bez uruchamiania na pół.
- `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5doc_t4e`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`, wynik do pliku). Kody wyjścia w raporcie.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) pominięcie kosztu terenu w ruchu; (b) odwrócenie kolejności efektów (facing przed occByKey); (c) koszt stały zamiast per `mounted`. Każdą przywróć z kopii, potwierdź zerowy diff.

## KRYTERIA KOŃCA
1. Wektory z pinu zielone; mutacje FAIL; wiring ProdBody pokryty testem end-to-end (sekwencja tury z ruchem pieszego).
2. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.

## DODATEK r2 (orkiestrator, po BLOCK r1: brak kodu z powodu czterech decyzji technicznych D1–D4)
Decyzje podejmuje orkiestrator (reguła 8). Wykonawca NIE wybiera.
- BAZA r2: `origin/rust-port/parity-v2` = `760be5187`. Worktree MUSI być przełączony na tę bazę (r1 zostawiła detached na `d44d5b982`). Nie rozpoczynaj od worktree r1.
- D1 (dane terenu dla ProdBody): wprowadź trait `MoveTerrain` w `siege_tactics_move_effects.rs` (passable, move_cost, is_ford, combat_terrain_name, mnożnik kawalerii). ProdBody dostaje pole `terrain: Option<Box<dyn MoveTerrain>>`. Gdy `None` i ruch jest wymagany → zwróć jawny błąd (`MissingTerrain`), NIE domyślną wartość. Dane terenu dostarcza adapter; w testach — implementacja testowa.
- D2 (czas kroku): `do_move_effects` nie dostaje czasu. Czas kroku (STEP_GAP_MS = 70 z pinu `battleScene.ts:1011`) liczy adapter (zgodnie z wariantem synchronicznym `siege_walk_to`). Nie zmieniaj `LoopBody` w tej rundzie.
- D3 (occByKey): pole `occ_by_key` w `ProdBody` (mapa zajętości wg klucza pola). Zainicjalizowane przez konstruktor; aktualizowane przez `do_move_effects` przez `MoveWorld::occ_mut`.
- D4 (podział): ta runda realizuje WYŁĄCZNIE **T4e-0**: typ `MoveTerrain`, pola `terrain` i `occ_by_key` w `ProdBody`, wiring ruchu w jednej ścieżce (krok → `do_move_effects`) z wektorami dla passable i occ. **T4e-1** (pełne `_advanceStep` 1–10, mutacje, kawaleria, brody) to osobny temat po integracji T4e-0.
- Bramki i mutacje jak w r1 (fmt, clippy -D warnings, `p6_k5doc_t4e`, `--all-targets`, mutacje a/b/c). Mutacje dla T4e-0: (a) pominięcie `occ_mut` update; (b) brak błędu `MissingTerrain` (domyślna wartość); (c) odwrócenie kolejności occ/facing.
- DYSK: ≥ 8 GB przed startem (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.
- Trailery commitów: BEZ nazwy modelu (#289).
- Raport `02-operator-r2.md`; commit jawnym `git add`, bez `Cargo.lock`, bez push do parity.

## DODATEK r3 (orkiestrator, po BLOCK INFRA r2: patch nieskompilowany, bramki i mutacje nie wykonane)
Rozstrzygnięcia orkiestratora na pytania z Obrony/FC r2 (reguła 8). Wykonawca NIE wybiera.
- BAZA r3: `origin/rust-port/parity-v2` = `760be5187`. Worktree przełączony detached na tę bazę.
- PATCH: zastosuj `wip-r2-nieskompilowane.patch` z commita `a60791ba2` (gałąź `rust-port-wip/p6-k5doc-t4e-r2-op`) przez `git apply`; jeśli nie nakłada się, przepisz zmiany ręcznie na bazie. Nie kopiuj kodu z worktree r1/r2.
- ALLOWLISTA (rozszerzona jednorazowo): `rust-port/engine/src/domain/siege_tactics_move_effects.rs` — WYŁĄCZNIE dodanie traitu `MoveTerrain` (D1). Żadnych innych zmian w tym pliku.
- GRANICA T4e-0 / T4e-1 (rozstrzygnięcie): wiring jednego kroku ruchu (`krok → do_move_effects`) w `move_step` WCHODZI do T4e-0 (zgodnie z D4). Pełny `_advanceStep` 1–10 zostaje w T4e-1.
- KOSZT PER JEDNOSTKA (rozstrzygnięcie): pole `mounted` w `ProdMoveWorld`; `move_cost` używa `cavalryTerrainMultiplier` dla jazdy zgodnie z pinem `battleScene.ts:7436-7443`. WCHODZI do T4e-0. Test rozróżniający jazdę od piechoty jest wymagany.
- update_facing w adapterze: no-op akceptowany jako znany dług (#107); odnotuj w raporcie, nie naprawiaj.
- WEKTORY: MUSZĄ pochodzić z generatora `rust-port/engine/tests/p6_k5doc_t4e_gen.mjs` (wykonanie tekstu pina `battleScene.ts` `_doMove` ok. 8685–8776 przez TypeScript), zapisanego do `p6_k5doc_t4e_vectors/vectors.json`. Ręcznie wpisane wartości NIE są dopuszczone. Każdy wektor z `plik:linia` pinu.
- MUTACJE (MUSZĄ dać FAIL): (a) pominięcie `occ_mut` update; (b) brak błędu `MissingTerrain` (domyślna wartość); (c) odwrócenie kolejności occ/facing; (d) `mounted` ignorowane (koszt piechoty dla jazdy).
- DYSK: ≥ 8 GB przed startem i przed każdą mutacją (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.
- Trailery commitów: BEZ nazwy modelu (#289). Raport `03-operator-r3.md`; commit jawnym `git add`, bez `Cargo.lock`, bez push do parity.

## DODATEK r4 (orkiestrator, 2026-11-17: baza przesunięta; r3 nie został uruchomiony)
Rozstrzygnięcia D1–D4 z DODATKU r2 i r3 OBOWIĄZUJĄ BEZ ZMIAN (wykonawca NIE wybiera). Zmienia się wyłącznie baza.
- BAZA r4: `origin/rust-port/parity-v2` = `c120f2373` (zawiera K5DOC-T1, T3, T4a–c, R6, renderer). Worktree detached na `c120f2373`.
- PATCH: nie stosować ślepo `wip-r2-nieskompilowane.patch` z `a60791ba2`. Przepisać zmiany ręcznie na nowej bazie wg D1–D4 i r3 (MoveTerrain, pola `terrain`/`occ_by_key`, wiring jednego kroku w `move_step`, `mounted` w `ProdMoveWorld`).
- ZAKRES: wyłącznie T4e-0 (jak w r3). Pełny `_advanceStep` 1–10 zostaje w T4e-1.
- ALLOWLISTA: jak w r3 (`siege_tactics_move_effects.rs` tylko dla traitu `MoveTerrain`; `siege_tactics_loop.rs` — ProdBody; testy `p6_k5doc_t4e*`; generator `p6_k5doc_t4e_gen.mjs`; katalog runs).
- BRAMKI i MUTACJE: jak w r3 (fmt, clippy `-D warnings`, `p6_k5doc_t4e`, `--all-targets --no-fail-fast`; mutacje a/b/c/d z DODATKU r3 MUSZĄ dać FAIL).
- DYSK: ≥ 8 GB przed startem i przed każdą mutacją (`df -h /`). Przy < 8 GB: BLOCK INFRA z liczbą GB.
- Trailery commitów: BEZ nazwy modelu (#289). Raport `04-operator-r4.md`; commit jawnym `git add`, bez `Cargo.lock`, bez push do parity.
