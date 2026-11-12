STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1
GOAL: lucznikRanged >= 14 (przy >= 100 procarzy i >= 1200 przypadkach); asercje licznikow w p6_siege_tactics_blow_env.rs; wektory regenerowane generatorem z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75; zgodnosc 1200/1200.
BAZA: 19c13bb4e (FC K5I2B2-DLUG), detach; gałąź robocza rust-port-wip/R-RUSTPORT-P6-K5I2B2-POKRYCIE-Q1 (lokalna, bez push).
ZMIANY/COMMIT: kod+wektory SHA 738bf1238dd5da2ca4be1d25d66fae2176d67f87 (allowlista: p6_siege_tactics_blow_env.rs, p6_siege_tactics_blow_env_gen.mjs, p6_siege_tactics_blow_env_vectors/vectors.json; vectors.json 7 343 513 B, sha256 efbce73b3a8db0fafa502cc5a50d739b6a8c4db9de7380723a6fd65ef5b5f4c8). Bez zmian w src/, gra/, rust-port/engine/data/, Cargo.toml, Cargo.lock (Cargo.lock wygenerowany lokalnie, nie commitowany).
  Zmiana wag losowania (gen.mjs, unitDraw dla ciosu dystansowego): 70% procarze (Slinger), z reszty 50% lucznicy (LUCZNIK_IDX: Typ Distance, Jednostka zaczyna sie od "Łucznik", 5 z 75 wierszy), reszta jednorodnie. Przed zmiana: lucznikRanged=2, slingerRanged=136.
  Nowe liczniki w generatorze: wallNanInf, wallNegZeroBonus.
TESTY:
  - node p6_siege_tactics_blow_env_gen.mjs (Node v22.23.4): guardy SHA (fragmenty pinu, env, terrain, toCombatUnit, units.json) przeszly; total=1200; slingerRanged=116; lucznikRanged=29; wallNanInf=28; wallNegZeroBonus=0; nanCase=112; infCase=214; unitRowsUsed=75/75.
  - cargo fmt --check: OK (exit 0).
  - cargo clippy --all-targets -- -D warnings: OK (Finished, bez ostrzezen).
  - cargo test --test p6_siege_tactics_blow_env: 3 passed (zgodnosc_z_pinem_end_to_end: 1200/1200 zgodne z pinem).
  - cargo test --test p6_siege_tactics_blow_full: 3 passed.
  - cargo test --test p6_unit_power_maxnan: 2 passed.
  - cargo test --lib: 94 passed.
  - Toolchain: rustc 1.97.0 (2d8144b78 2026-07-07), cargo 1.97.0 (c980f4866 2026-06-30).
  - Asercje dodane w p6_siege_tactics_blow_env.rs: lucznik_ranged >= 14; wall_nan_inf > 0; neg_zero_cu > 0 (-0 w CombatUnit zwroconym przez toCombatUnit pinu: 45 przypadkow cuA/cuD). Liczniki wall_nan_inf i neg_zero_cu dodane do listy "kazda galaz > 0". slinger_ranged >= 100 istnialo i przechodzi.
  - (2) -0 w murze: NIE_ZMIERZONO. Przy biezacym generatorze wejscie muru (wallTotal) nie generuje -0, a wyjscie _wallBonusProcFor daje -0 w 0 przypadkach (wallNegZeroBonus=0); -0 zasertowano na poziomie CombatUnit pinu (cuA/cuD).
BLOKADY: brak blokad technicznych. Uwaga: wektory nie sa bajt-w-bajt z poprzednimi (zmiana wag zmienia zuzycie RNG); regeneracja zgodna z GOAL (3).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja wag, asercji i zgodnosci z pinem); po FC integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej, bez push).
