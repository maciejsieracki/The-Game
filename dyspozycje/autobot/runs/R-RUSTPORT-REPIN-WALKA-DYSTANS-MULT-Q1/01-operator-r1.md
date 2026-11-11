STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1
GOAL: REPIN web FALA 603 (R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1, a259012fa): mnoznik pocisku z combat-params.json (Slinger x3, Lucznik x2), celnosc max(wreczna, dystansowa), zaokraglenie, podloga 1, mnoznik w mocy polowej. Zakres r1: formuly i parametr w Rust; petla walki i fieldPower poza zakresem (patrz BLOKADY).
ZMIANY/COMMIT: 7be18d597 (kod + testy + wektory), baza 43f4064b0 (rust-port/parity-v2, detached). Allowlista: rust-port/engine/data/combat-params.json, src/data/units_combat.rs (pole parametru, patrz ZALOZENIA), src/domain/mod.rs, src/domain/unit_power.rs (nowy), tests/p6_repin_dystans_formulas.rs, tests/p6_repin_dystans_vectors/*, dyspozycje/rust-port/p6/P6-REPIN-DYSTANS-MULT.md, dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1/*. Poza allowlista: nic. gra/, WERSJE.md, Cargo.toml, renderer, src-tauri nietkniete.
TESTY:
- Pomiar: w Rust brak petli walki ze strzalami, brak missileAttack w walce, brak fieldPower/unit_power, brak battle/ (tabela P6-REPIN-DYSTANS-MULT.md §2). Web: combat.ts:476/485/1036-1059, unit-power.ts:26/122, battleScene.ts:8964.
- Wektory: generowane z kodu weba (git archive origin/main gra/src gra/data, esbuild 0.24.2, Node 22.22.0): 19 typow, 2400 strzalow + 80 polowek, 8 celnosci, 6 hitChanceTw, 4 hitChanceTw z celnoscia.
- cargo fmt --check: rc 0.
- cargo clippy --all-targets -- -D warnings: Finished, 0 bledow.
- cargo test --lib: 22 passed, 0 failed (baseline 22).
- cargo test --test data_compliance: 40 passed, 0 failed (baseline 40, liczniki N1/N2 bez zmian).
- cargo test --test p6_repin_dystans_formulas: 8 passed, 0 failed, 0 ignored (nowe).
BLOKADY:
- Mnoznik NIE jest podpiety do walki: resolve_combat (domain/combat.rs:319) to model sily bez strzalow. Wymaga osobnego tematu (port rund strzalow) albo decyzji wlasciciela.
- fieldPower/armyFieldPower nie portowane (brak modulu unit_power w Rust).
- Brak testow wpływu na wyniki calej bitwy (NIE_ZMIERZONO).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) i Final Control (Sonnet) na commicie 7be18d597; decyzja orkiestratora, czy domknac podpiecie do walki (osobny temat) przed READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

ZALOZENIA (do akceptacji):
1. Pole `ranged_damage_mult` dodane do CombatParamsFile (src/data/units_combat.rs), bo deny_unknown_fields wywracaloby parsowanie. Traktowane jako zakres "data/**".
2. Wartosci mnoznikow jako i64 w Rust (round-trip N2 pozostaje 0).
3. Hit chance w wektorach z hitBonus = 0.
