STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TOWER-TARGET-Q1
GOAL: Przeniesienie pickTowerTarget (wybór celu wieży oblężniczej) z pinu 07d2fbd72 do Rust jako czystej funkcji z wektorami zgodności; bez wpinania w pętlę (wpięcie = osobny temat).
ZMIANY/COMMIT: kod bazy b0ba891fb (= origin/rust-port/parity-v2 po INTEG-B20), gałąź lokalna wf-wip/R-RUSTPORT-P6-TOWER-TARGET-Q1.
  Commit kodu: b2e284cf14e509e5e88db59f244c5b6e580b4847 (allowlista: rust-port/engine/src/domain/siege_tactics_tower.rs, rust-port/engine/tests/p6_tower_target.rs, rust-port/engine/tests/p6_tower_target_gen.mjs, rust-port/engine/tests/p6_tower_target_vectors/vectors.json).
  Mod.rs bez zmian (moduł siege_tactics_tower był już zadeklarowany). Cargo.toml, Cargo.lock (wygenerowany lokalnie, niezcommitowany i usunięty), gra/, origin/main, WERSJE.md, siege_tactics_loop.rs - bez zmian.
  Wejście: pub struct TowerTarget { q: i64, r: i64, hp: f64, dead: bool } i pub fn pick_tower_target(tower_q, tower_r, range: f64, enemies: &[TowerTarget]) -> Option<usize> (None = -1 z pinu).
TESTY:
  - rustc 1.97.0 (2d8144b78 2026-07-07), cargo 1.97.0 (c980f4866 2026-06-30), node v22.23.4.
  - cargo fmt --check: PASS (exit 0).
  - cargo clippy --all-targets -- -D warnings: PASS (exit 0).
  - cargo test --lib: PASS, 94 passed, 0 failed.
  - cargo test --test p6_tower_target: PASS, 2 passed (zgodnosc na 600 wektorach z pinu; reguły jawne).
  - cargo test --test p6_siege_tactics_tower: PASS, 12 passed (regresja K3, bez zmian).
  - Wektory: rust-port/engine/tests/p6_tower_target_vectors/vectors.json, wygenerowane przez rust-port/engine/tests/p6_tower_target_gen.mjs, który WYKONUJE doslowny tekst pinu (city-towers.ts pickTowerTarget; battleScene.ts _fireSiegeTowers, _destroyTowerAtRow) przez git show. Straznik SHA-256 fragmentow: 1321c316517057e97159f84ce0688edf9837cd63a6507ca8d484d2b2637b3ffc. Generator deterministyczny (dwa uruchomienia = ten sam sha256 pliku b27a269e078160fe6cd9b4a79a170f46d55abeaa465d4d0acb3fa2df1c26c83a).
  - Liczba przypadkow: 600 (>= 150). Rozklad (z pinu, meta.categories): pick 267, none 333, tie:dist 49, tie:hp 38, tie:full 11, range:edge 147, dead:skipped 78, self:skipped 43, hp:nan 49, range:nan 16.
  - Porownanie Rust<->pin: indeks wyboru identyczny dla 600/600 przypadkow (zero rozbieznosci, kod nie byl poprawiany). Rozklad kategorii po stronie Rust przeliczony z wejsc i zgodny z pinem.
  - Stagger: zmierzony w pinie = 180 ms (battleScene.ts, w _fireSiegeTowers: `stagger += 180`, delay pierwszego strzalu = 0). Pomiar harnessu: 40 scenariuszy, 69 strzalow, wszystkie roznice miedzy kolejnymi zaplanowanymi strzalami = 180 ms.
  - Mutacja testu (czulosc na zmiane reguly) NIE_ZMIERZONO w tej rundzie.
BLOKADY: brak blokad technicznych. Poza zakresem (celowo, wg dispatchu): wpiecie pick_tower_target i fire_siege_towers do siege_tactics_loop.rs / pętli bitwy (temat #96/#116 po stronie planu), port _fireOneTower (strzał, rzut, projektyl), zegar 180 ms (bez implementacji zegara).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (weryfikacja wektorów: czy pin wykonany doslownie, straznik SHA, brak osłabienia asercji) → Final Control → integracja przez orkiestratora (poza tym tematem; bez push w tym kroku).
DEPLOY/PUSH: NIE WYKONANO (commit tylko lokalnie na gałęzi wf-wip/R-RUSTPORT-P6-TOWER-TARGET-Q1; brak push do rust-port/parity-v2, origin/main; brak integracji).

Uwagi do commitu: zgodnie z dispatchem commit nie zawiera nazwy modelu; zawiera linię Claude-Session.
