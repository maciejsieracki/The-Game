STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1
GOAL: tryb reczny gracza w ciele bitwy (czesc A): stan, wykonanie rozkazow, kolejka; dowod = wektory kroku z wykonania tekstu pinu 07d2fbd72
ZMIANY/COMMIT: oceniony kod 72aa1f21d (galaz claude/rust-417a-h4, baza 617185ba8 jest przodkiem, OK). Allowlista: siege_prod_manual.rs (nowy), mod.rs, siege_tactics_loop.rs, tests/p4_417a_manual_mode_state.rs, 01-operator-r1.md. Brak plikow spoza allowlisty, brak zmian w gra/, generatorze .mjs i istniejacych wektorach. Brak #[ignore] w diffie (0).
TESTY: odtworzone przez Evaluatora: cargo fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; test p4_417a_manual_mode_state 31/31; pelny cargo test --all-targets --no-fail-fast EXIT 0, 562 sekcji, 4420 passed, 0 failed, 1 ignored (bazowy). Zgodne z raportem Operatora.
BLOKADY: kryteria 2, 3, 4 dispatchu niespelnione; 4 mutanty przezyly
RUNDY: ocena r1/5
NASTEPNY KROK: Obrona (Sonnet) i runda 2 Operatora: wektory kroku z pinu + zabicie mutantow
DEPLOY/PUSH: NIE WYKONANO

## Zarzuty

1. KRYTERIUM 2/3/4 NIESPELNIONE (D-417A-3). Operator sam to przyznaje (NIE_ZMIERZONO pkt 1): brak nowych trybow generatora i plikow wektorow w p6_k5loop_wiring_a_pin_vectors/. 31 testow to testy reczne z oczekiwaniami "wyliczonymi z tekstu pinu", nie wektory z WYKONANIA tekstu pinu. Dispatch wymaga wektorow kroku (jak attack_order_step_vectors.json) dla ciala: rozkazy hold/none/move/attack/attackMove/oblezenie reczne oraz kolejka execute_units_immediate (busy-gate, acted, wizualia). Brak porownania fx `_siegeSafeApproach` z pinem (kryterium 2) i progow pokrycia rozbitych na dead/fadingOut/routed/cel=pozycja (kryterium 4).
2. MUTANTY PRZEZYLY (Evaluator, plik produkcyjny siege_prod_manual.rs, test p4_417a_manual_mode_state): 12 mutantow, 7 zabitych, 1 nie kompiluje (M10), 4 PRZEZYLY (31/31 zielone):
   - M4: run_of_move, BlockadeBlocked: `order_done.then_some(PlayerOrder::None)` -> `None`.
   - M8: side_ix: `BattleSide::Defender => 1` -> `=> 0` (rozkazy obroncy aliasuja atakujacego); brak testow gracza po stronie obroncy.
   - M11: SiegeManualStep::WalkwayStrike -> zawsze Done (gałąź pomostu bez testu efektu).
   - M12: SiegeManualStep::RamTower{handled} -> None.
   Kryterium 5 (>=10 mutantow zabitych lub rownowaznych z uzasadnieniem) nie jest spelnione; zaden z przezywajacych nie jest rownowazny.
3. Luki zadeklarowane przez Operatora i potwierdzone: krokowy marsz (march_incremental) dla rozkazow gracza bez testu; SiegeLoop z trybem recznym E2E bez testu; ram_tower_step/tower_climb/infantry_to_tower w trybie recznym bez testu; blokada generala (D-417A-7) niepokryta.
4. Pozytywne: predykaty N1/N2 z #416 (ProdAttackEnv, siege_threats_now + siege_safe_approach_goal, ranged_target_in_range_js) liczone w ciele zamiast brane z pinu; domyslnie wylaczone (manual.exec=false daje tag tryb-reczny jak dotad); istniejace wektory bez regresji (pelny test zielony).

## Werdykt
FAIL: kryteria 2-4 (rdzen dowodu) i 5 (mutanty) niespelnione. Kod kompiluje sie i nie powoduje regresji, ale brak dowodu zgodnosci z pinem na poziomie kroku. Runda 2: tryby generatora za flaga srodowiska (straznik SHA-256 3eeeb760... bez zmian) i wektory kroku dla ciala; testy dla strony obroncy, BlockadeBlocked, WalkwayStrike, RamTower.
