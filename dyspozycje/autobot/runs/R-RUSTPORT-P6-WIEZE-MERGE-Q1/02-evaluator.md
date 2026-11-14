STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIEZE-MERGE-Q1 (etap 1, r2)
GOAL: pick_tower_target w produkcyjnym fire_siege_towers + SiegeEnv z danymi wież (etap 1); strzał/odroczenie = etap 2
ZMIANY/COMMIT: oceniono 7caff90c0 (kod dce632e4f) na bazie a381dd13f; allowlista zachowana (7 plików, brak gra/, Cargo.toml/lock)
TESTY (Evaluator, własne uruchomienie, rust-port/engine, CARGO_TARGET_DIR poza repo):
- cargo fmt --check EXIT 0
- cargo clippy --all-targets -- -D warnings EXIT 0
- cargo test --lib 114 passed EXIT 0
- cargo test --test p6_tower_target_wiring 6 passed EXIT 0
- cargo test --test 'p6_siege*' wszystkie binarki ok EXIT 0
- generator .mjs odtworzony na `git archive 07d2fbd72`: wynik bajt-w-bajt identyczny z vectors.json (strażnik SHA-256 pliku i fragmentu działa); brak #[ignore]
BLOKADY: brak

ZARZUTY (ponumerowane):
1. [średni] Wektory z pinu pokrywają tylko czystą funkcję pick_tower_target (400 przypadków), a ta była już zaportowana wcześniej. Warstwa wiringu (filtr żywych atakujących, mapowanie hp/dead, unit_cell, kolejność wież, wall_tile_rows) jest testowana 5 testami ręcznymi, nie wektorami wykonanymi z pinu (_fireOneTower). Dla etapu 2 wymagany generator wykonujący _fireSiegeTowers/_fireOneTower.
2. [średni] Produkcyjne wołanie (siege_tactics_loop.rs:176) jest nieosiągalne produkcyjnie: nic poza testami nie ustawia tower_rows/tower_range/wall_tile_rows (ProdBody/SiegeLoop bez wołającego, K5LOOP-WIRING). Kryterium "wołający w src/" spełnione literalnie, ale ścieżka jest martwa do czasu wpięcia; należy to jawnie zapisać w rejestrze.
3. [średni] LoopBody::unit_cell domyślnie None: jednostka bez pozycji jest po cichu pomijana, a pin bierze wszystkie żywe atakujące. Cicha rozbieżność zamiast błędu; ProdBody czyta activate.q/r — brak dowodu, że te pola są aktualizowane po ruchu (nic w src ich nie zapisuje poza konstrukcją), więc pozycje mogą być stale.
4. [niski] Wiersz wieży bez kafla muru jest pomijany bez efektu; pin woła _destroyTowerAtRow (usuwa wieżę). Udokumentowane jako etap 2, ale wieża pozostaje w tower_rows i w kolejnych turach też nic nie robi (zgodne wynikowo, brak stanu destroyed).
5. [niski] Brak odwzorowania strażników pinu: finished, towerShooterRow (brak wiersza strzelca = brak strzałów), t.destroyed. fire_towers_by_pick strzela także gdy w pinie nie byłoby strzelca.
6. [niski] Wybory liczone na starcie tury; pin liczy je w odstępach 180 ms (po wcześniejszych trafieniach). Rozbieżność udokumentowana, usuwana w etapie 2.
7. [niski] Placeholder dead=true dla wybranego celu zostaje (dopuszczone dispatchem etapu 1; raport napisał wprost, że strzał/odroczenie NIE zrobione). Jedna wieża strzelająca dwa razy w ten sam cel jest możliwa (picks mogą się dublować) — w pinie drugi strzał trafia w już ranny cel, tu efekt idempotentny.
8. [informacyjny] Commit zawiera Co-Authored-By z nazwą modelu wbrew zakazowi z dispatchu; operator zgłosił konflikt z nagłówkiem sesji.

WERDYKT: żaden zarzut nie łamie kryteriów etapu 1; bramki EXIT 0, generator odtwarzalny, allowlista czysta. PASS-WITH-NOTES (zarzuty 1-3 do uwzględnienia w etapie 2 / K5LOOP-WIRING).
RUNDY: 1/5 oceny r2
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO
