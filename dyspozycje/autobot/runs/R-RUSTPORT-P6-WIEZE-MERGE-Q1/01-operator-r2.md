STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-MERGE-Q1 (etap 1, runda r2 po dodatku dispatchu z 14.11)
GOAL: produkcyjna pętla oblężenia (`fire_siege_towers`) wybiera cel wieży przez `pick_tower_target`
  (`siege_tactics_tower.rs:486`), a `SiegeEnv` niesie dane wież (wiersze, towerRange, wallTileHp) wg pinu
  `battleScene.ts` (`_fireSiegeTowers` :4208-4219, `_fireOneTower` :4223, `pickTowerTarget` :4230).
ZMIANY/COMMIT: baza a381dd13f; gałąź wip/R-RUSTPORT-P6-WIEZE-MERGE-Q1-r2; commit kodu dce632e4f
  (kod + testy + generator + wektory). Raport w osobnym commicie następującym po nim.
  Allowlista zachowana:
  - src/domain/siege_tactics_loop.rs: pola SiegeEnv tower_rows/tower_range/wall_tile_rows; LoopBody::unit_cell
    (domyślnie None), ProdBody::unit_cell (activate.q/r); fire_towers_by_pick wołany z fire_siege_towers
    (linia 176: pick_tower_target).
  - tests/p6_siege_tactics_loop.rs, tests/p6_siege_tactics_loop_resume.rs: tylko dopisane pola w literałach SiegeEnv.
  - tests/p6_tower_target_wiring.rs (NOWY), tests/p6_tower_target_wiring_gen.mjs (NOWY),
    tests/p6_tower_target_wiring_vectors/vectors.json (NOWY, 400 przypadków).
  - siege_tactics_turnseq.rs i siege_tactics_tower.rs NIE zmienione (sygnatura bez zmian).
  Brak zmian w gra/, origin/main, Cargo.toml. Cargo.lock wygenerowany przez cargo, nie dodany do commita.
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0 (po cargo fmt, zmiany tylko w moich plikach).
  - cargo clippy --all-targets -- -D warnings: EXIT 0.
  - cargo test --lib: 114 passed, 0 failed, EXIT 0.
  - cargo test --test p6_tower_target_wiring: 6 passed (wektory vs pin, 5 testów wiringu), EXIT 0.
  - cargo test --test 'p6_siege*': wszystkie binarki ok, EXIT 0.
  - Liczniki niepustości z wektorów (zgodne z JSON, sprawdzane w teście): hit 132, none 268,
    dead_matters 42, range_matters 186, own_tile_present 11, tie_break 12, nan_range 13, inf_range 16.
  - Generator: node 22.23.4, WEB_ROOT = git archive 07d2fbd72 gra/src; SHA-256 city-towers.ts
    cc715ed61f65cb0b11fe38efe80e6c6a1742feefec2c0bb5e6ce142a4da8cbd4; fragment pickTowerTarget
    56a196fe638705e1883506e315b059116268e49b20b679a90db1448ebe3da333.
  - Kryteria 3: brak #[ignore], brak osłabionych asercji, brak martwego wrappera.
BLOKADY: brak blokad etapu 1. Poza zakresem etapu 2 (NIE zrobione w tym commicie):
  - odroczenie wystrzału (SeqEvent::Schedule, stagger 180 ms, `_schedule(RANGED_FLY_MS)`);
  - strzał wieży przez single_blow_full i syntetyczny strzelec (wiersz towerShooterRow);
  - usunięcie placeholdera `dead = true`: w ścieżce z wierszami wieży placeholder trafia wybrany cel;
    bez wierszy działa stary placeholder na `SiegeEnv::tower` (zachowany, bo testy z `tower` muszą przechodzić);
  - `_destroyTowerAtRow`: wieża bez kafla muru jest tylko pomijana, nie usuwana.
  - Uwaga modelowa: wybory wież są liczone przy starcie tury, przed trafieniami. W pinie wynika to z odroczenia
    180 ms i czasu lotu pocisku. Odwzorowanie tego czasu to etap 2.
  - LoopBody::unit_cell ma domyślną implementację None: ciało bez pozycji (ScriptedBody w testach) nie jest
    celem wież. Produkcyjne ProdBody zwraca pozycję. Nie ma jeszcze produkcyjnego wywołania SiegeLoop
    (K5LOOP-WIRING), więc wiring działa na poziomie modułu.
  - Konflikt z dispatchem: sekcja „NIE WOLNO” zabraniała nazwy modelu w treści commita, a nagłówek sesji
    nakazuje dopisać Co-Authored-By: Claude Haiku 5.5. Wybrano linię z nagłówka sesji.
RUNDY: 1/5 (r2 wg dodatku; r1 zakończona BLOCK bez kodu, FAIL FC r1)
NASTĘPNY KROK: Evaluator r2 na dce632e4f (weryfikacja wektorów, liczników i zakresu etapu 1); potem Final Control.
  Etap 2 jako osobny dispatch: odroczenie 180 ms + strzał _singleBlow + usunięcie placeholdera.
DEPLOY/PUSH: NIE WYKONANO
