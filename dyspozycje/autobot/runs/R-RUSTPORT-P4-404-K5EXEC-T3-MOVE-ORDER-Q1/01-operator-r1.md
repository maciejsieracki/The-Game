# R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-404-K5EXEC-T3-MOVE-ORDER-Q1 (#404, krok T3)
GOAL: rozkaz ruchu `_performPlayerOrder` (`hold` / `none` / `move`, pin `07d2fbd72` `battleScene.ts:18280-18353`) i `_firstStepTowardMoveDestination` (`:18478-18527`) w Rust; rozkaz ruchu doktryny `skirmish` wykonywany w pętli bitwy zamiast tagu `doktryna-rozkaz-ruchu`.
ZMIANY/COMMIT: gałąź `rust-port-wip/404-move-order`, baza `origin/rust-port/parity-v2` = `6793a7da4`; commity `cd949c912` (WIP), `83246224a` (wektory bitew), SHA raportu — patrz ostatni commit gałęzi (`git log -1`).
TESTY: patrz §4.
BLOKADY: brak blokujących; uwagi N1–N4 (§6).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO

## 1. Web najpierw (pin `07d2fbd72`)

- `_performPlayerOrder` (`:18280-18353`): `hold` → `done()`; `_performSiegeManualOrder` (`:18286`, `false` dla `move`, `:18436`); `none` → `_executeGroupDoctrineStep` gdy `_isUnitDoctrineAuto && meta.doctrine !== 'manual'`, inaczej `done()`; `move`: cel = pozycja → `playerOrder = none`; `_adjacentEnemy` (`:17481-17484` = `_pickAdjacentTargetByPriority`) → `_doAttack`; krok zachłanny `sign(tc-q), sign(tr-r)`, obejście `(q+dc, r)`, `(q, r+dr)` z `_passableForUnit`/`occByKey`/unikiem cofania (`lastAutoMoveFrom` przy `_shouldAvoidAutoBacktrack`), inaczej BFS `_firstStepTowardMoveDestination(ru, tc, tr, 1024, allowFirstStep = compact tylko przy unikaniu cofania)`; bramka `_compactAttackAllowsStep` PRZED `nc === tc`, potem `_destAllowedByBlockade`; `_doMove(ru, nc, nr, cb)`, w callbacku `lastAutoMoveFrom = previousPosition`.
- Wartość zwracana `_performPlayerOrder` = `true` w każdej gałęzi (koniec funkcji `return true`).
- `_firstStepTowardMoveDestination`: BFS po `DIRS4` (N, E, S, W), limit `head < maxVisited`, pomijanie `lastAutoMoveFrom` dla doktryny AUTO `steady`, `allowFirstStep` tylko dla sąsiadów startu, cel albo pole ostrzału `firingTiles` (strzelec `rangedBase && canShoot && shootingEnabled`, romb Manhattan `ru.range` wokół żywych wrogów, bez pola wroga, w planszy).
- Ustalenie pinu: `_passableForUnit` poza planszą = `true` (`battle-terrain.ts:781-783`: `at()` zwraca Plains) — port modeluje to samo; BFS sprawdza granice przed `_passableForUnit`.
- Rozkaz ruchu doktryny `skirmish` (`:18110-18122`): `_executeSkirmishDoctrineStep` sprawdza już `_pickAdjacentTargetByPriority`, więc `_adjacentEnemy` w `move` jest w bitwie AUTO zawsze `null`; doktryna `skirmish` ≠ `steady`, więc unik cofania i bramka zwarcia są w bitwie AUTO bezczynne (pokryte wektorami kroku, §3b).

## 2. Port w Rust

- NOWY `rust-port/engine/src/domain/player_order_move.rs` (+ `mod.rs`): `firing_tiles`, `first_step_toward_move_destination`, `move_order_step` (decyzja gałęzi `move`: `ReachedTarget` / `Attack` / `NoRoute` / `CompactBlocked` / `BlockadeBlocked` / `Move{col,row,route,order_done,prev}`), `perform_player_order` (`hold` / `none` / `move`, `SiegeManual` i `Other` jako jawne „poza zakresem”), `perform_player_order_returns` (= `true`). Moduł czysty: plansza `MoveGrid`, bramki `MoveOrderGates`.
- `siege_tactics_loop.rs` (`ProdBody`):
  - `DoctrineAction::MoveOrder` przy `move_order_exec = true`: `move_order_start` (decyzja z bieżącego stanu ciała: `_adjacentEnemy` = K5DOC-T2 `pick_adjacent_target_by_priority`, `_compactAttackAllowsStep`/`_shouldAvoidAutoBacktrack` = K5EXEC-T2 przez `ProdAdvanceWorld`, blokada AUTO nieaktywna jak w `plan_doctrine_step`, `firingTiles` z `enemies_of`), cios wspólną ścieżką `attack_tail`, krok `_doMove` jako marsz krok po kroku `MarchKind::MoveOrder` (jeden krok, callback = `lastAutoMoveFrom` + `done()`; bez `march_incremental` — krok atomowy); brak terenu = jawny tag `rozkaz-ruchu-brak-terenu`.
  - zapis `move_orders: Vec<MoveOrderRecord>` (chwila, jednostka, pozycja, cel, decyzja, wynik BFS) — obserwacja dla testów.
  - `ProdOps::perform_player_order` zwraca wartość pinu (`true`); tryb ręczny nadal odcięty przed maszyną tagiem `tryb-reczny` (patrz N2).
- `siege_battle_session.rs`: `body.move_order_exec = true` (sesja produkcyjna; jedna linia, uzasadnienie: wzorzec `march_incremental`, D-404-OP-1). Plik spoza wymienionej allowlisty — konieczny, by tag zniknął w produkcji.
- **D-404-OP-1 (decyzja techniczna Operatora, do zatwierdzenia):** `ProdBody::move_order_exec` domyślnie `false` = kontrakt starszych testów ciała, których wektory generowano z ATRAPĄ `_performPlayerOrder` (`p6_k5doc_t8_gen.mjs:262-263`: zapis celu + `done()`): `p6_k5doc_t8`, `p6_k5loop_siege_atk_a/b` zostają bez zmian (pliki wektorów i asercje nietknięte). Sesja ustawia `true`. Alternatywa (zmiana tych testów na wykonanie ruchu) wymagałaby regeneracji wektorów T8 — zakaz „istniejące pliki wektorów bez zmian treści”.

## 3. Wektory pinu (generator `p6_k5loop_wiring_a_gen.mjs`, strażnik SHA-256 `3eeeb760…` nietknięty)

a) `WIRING_A_MOVE_ORDER_VECTORS=1` → `move_order_vectors.json` (MD5 `00b72d41f9f37312d601a21fb478f9df`): **32 pełne bitwy oblężenia** z doktryną `skirmish` części atakujących (pole `ru.unitDoctrine` przed `play()`; scenariusze bez strzelców w `skirmish`, generator odrzuca strzelca, bo `_applySkirmishFlagsForUnit` byłoby poza wektorem): **24 w czasie rzeczywistym** (klatki 16 ms, porównanie bajt w bajt z chwilami) + 8 bliźniaków przewijania `_skip`. Ślad rozkazów `orders` = opakowania `_performPlayerOrder`/`_firstStepTowardMoveDestination`/`_doMove`/`_doAttack`; zdarzenia C/R/K/D jak #412. Atrapa renderu: `_makeOrderArrow` (obiekty three.js strzałki rozkazu; atrapa `Vector3` nie ma `length()`).
   - Uzasadnienie zestawu (D-404-3): 24 bazy = mury / palisada / mury+baszta / cytadela, teren Równina / Las / Wzgórza / Góry / rzeka, piechota, jazda, falanga, włócznicy, mieszanie `skirmish` + `steady`, tłum (8–10 jednostek → obejście BFS przez własne szeregi). Pokrycie zmierzone: rozkazów `move` 12 808, `move` przez BFS 166, `done` z BFS bez drogi 4 079, 17 bitew ze zdarzeniami (ciosy, wieże, wyłom, rout). Czas generatora: 4 części × ~23–27 min (czas rzeczywisty pinu ~3–15 min na bitwę).
   - Przewijanie: oś czasu tury 1 różni się o znany artefakt sterownika generatora (PRE-SKIP-RAF, `R-RUSTPORT-P6-K5LOOP-FRAME-QUANT-Q1/01-operator-r1.md` §5; zmierzone tu: drugi rozkaz pin 944 ms vs Rust 560 ms) — bliźniaki `_skip` porównywane bez chwil (decyzje, kolejność zdarzeń, wynik bajt w bajt).
b) `WIRING_A_MOVE_ORDER_STEPS=1` → `move_order_step_vectors.json` (MD5 `d90c1973fa5eba83f30d5963102ab8b2`): 3 sceny pinu, **900** przypadków `move`, **402** wywołań `_firstStepTowardMoveDestination` wprost (limit 1…1024, `allowFirstStep`, strzelcy), **120** `hold`/`none`. Decyzje = tekst pinu; wejścia predykatów spoza kroku zapisane.
c) Istniejące pliki wektorów (`vectors.json`, `speed_vectors.json`, `speed_change_vectors.json`, `tower_due_order_vectors.json`, `pin_data.json`) — bez zmian (`git diff --stat 6793a7da4` dotyka tylko 2 nowych plików).

## 4. Testy (CARGO_TARGET_DIR w scratchpadzie, CARGO_INCREMENTAL=0, debug=0)

- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `tests/p4_404_move_order.rs` (nowy): 4/4 — `rozkaz_ruchu_move_zgodny_z_pinem` (900/900; pokrycie m.in. cel=pozycja 44, sąsiedni wróg 409, zachłanny prosty 21 / skośny 193, obejście kolumna 52 / rząd 22, BFS ruch 25, BFS brak drogi 23, blokada zwarcia 63, blokada linii 48, unik cofania w ruchu 66, pola ostrzału niepuste 153), `pierwszy_krok_bfs_zgodny_z_pinem` (402/402; limit<1024: 321, allowFirstStep 213, firingTiles 60, steady-lastAutoMoveFrom 74), `rozkaz_hold_none_zgodny_z_pinem` (120/120), `pola_ostrzalu_brzegi`.
- `tests/p6_k5loop_wiring_a_pin.rs::rozkaz_ruchu_doktryny_bitwy_wektory_pinu_bajt_w_bajt`: 32/32 (ślad rozkazów, strumień zdarzeń, wynik, `unported` puste — tag `doktryna-rozkaz-ruchu` nie występuje).
- Pełny `cargo test --all-targets --no-fail-fast` (engine): EXIT 0 — 4377 passed, 0 failed, 1 ignored (ignorowany test sprzed tematu; ten temat nie dodaje `#[ignore]`). Baza #406 raportowała 4372 zielone; +5 nowych testów.

## 5. Mutanty (16, wszystkie ZABITE)

| # | mutant | test zabijający |
|---|---|---|
| M01 | brak unikania cofania | p4_404 move |
| M02 | limit BFS `head > max` | p4_404 BFS |
| M03 | limit rozkazu 1023 | p4_404 move |
| M04 | odwrócona kolejność bramek | p4_404 move |
| M05 | brak firingTiles | p4_404 |
| M06 | pominięty `_adjacentEnemy` | p4_404 move |
| M07 | zły znak `dr` | p4_404 move |
| M08 | brak `allowFirstStep` | p4_404 |
| M09 | brak bramki `steady` BFS | p4_404 BFS |
| M10 | cel tylko po kolumnie (`order_done`) | p4_404 move |
| M11 | brak `previousPosition` | p4_404 move |
| M12 | obejście: rząd przed kolumną | p4_404 move |
| M13 | firingTiles z martwymi | p4_404 |
| M14 | BFS ignoruje zajętość | p4_404 |
| M15 | ciało: rozkaz niewykonany (stary tag) | bitwy |
| M16 | ciało: `done()` bez końca kroku | bitwy (chwile) |

Skrypt: `scratchpad/p404/mut.py` (poza repo).

## 6. Uwagi / NIE_ZMIERZONO

- N1: Unik cofania, bramka zwarcia, `_adjacentEnemy` i krok skośny są w bitwie AUTO nieosiągalne dla rozkazu doktryny `skirmish` (§1) — pokryte wektorami kroku (3b), nie wektorami bitew.
- N2: Tryb ręczny gracza (`manual_mode`) w ciele nadal tag `tryb-reczny`: `ProdBody` nie trzyma `ru.playerOrder` gracza ani kolejki UI (D-404-1, T5/H4). Treść `hold`/`none`/`move` jest portowana i testowana w `player_order_move.rs`.
- N3: Bliźniaki przewijania porównywane bez chwil (PRE-SKIP-RAF, znany dług sterownika).
- N4: Blokada linii (`_generalSettings.blockadeActive`) w ciele = nieaktywna (UI panelu generała) — jak `plan_doctrine_step`; wartość aktywna pokryta wektorami kroku.
- NIE_ZMIERZONO: client i renderer (nie zmieniane, D-404-4); wydajność bitew z rozkazem ruchu w kliencie.

## 7. Mapa pozostałych kroków #404 (pin `battleScene.ts`)

- T4 `attackMove` / `attack`: `_performPlayerOrder` `:18354-18428`, `_attackMovePath` `:18533-18560`, `_canStrikeTargetFrom` `:8487-8493`.
- H3 `_performSiegeManualOrder` `:18435-18475` (w tym `_siegeSafeApproach`).
- T5 stan rozkazów gracza w ciele (`ru.playerOrder`, `_executeUnitsImmediate` → `_performPlayerOrder`), tryb ręczny `_activateUnit` `:6066-6071`, zdjęcie tagu `tryb-reczny`.
- H4 / T6–T7: wpięcie kolejki rozkazów (`player_order_queue.rs`, T1) i mostu klienta; `_refreshQueuedOrderVisuals` `:11520` (render).
