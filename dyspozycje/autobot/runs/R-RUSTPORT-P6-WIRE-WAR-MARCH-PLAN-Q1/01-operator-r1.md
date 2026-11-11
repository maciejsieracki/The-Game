STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5)
GOAL: planer marszu wojennego per owner, zwraca komendy (`MarchCommand`), niczego nie wykonuje; kolejność: kampania generała -> obrona domu (`plan_home_war`) -> fala wymuszona (`plan_forced_war_wave`). Atak all-in capital NIE w tej rundzie (dług W8, brak RuchMapa w WarWorldView).
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` 0c88dd509 (branch p6-wire-war-march-plan). Allowlista:
- rust-port/engine/src/domain/ai_war_march_plan.rs (NOWY, 232 LOC wc -l)
- rust-port/engine/src/domain/mod.rs (+1 linia `pub mod ai_war_march_plan;`)
- rust-port/engine/tests/p6_wire_war_march.rs (NOWY, 378 LOC wc -l)
- dyspozycje/rust-port/p6/P6-WIRE-WAR-MARCH-PLAN.md (NOWY, pomiar sygnatur)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/01-operator-r1.md
Nie zmieniano war_world_view.rs ani war_turn_state.rs (addytywne akcesory niepotrzebne: planer czyta istniejące adaptery i `opaque`).
Commit: SHA w sekcji DEPLOY-PUSH / w historii gałęzi (patrz `git log -1` na p6-wire-war-march-plan).
TESTY:
- cargo fmt (rustfmt na nowych plikach): OK
- cargo clippy --all-targets -- -D warnings: OK, 0 ostrzeżeń
- cargo test --test p6_wire_war_march: 9 passed, 0 failed
- cargo test --lib: 28 passed, 0 failed
- cargo test --test p6_wire_war_state: 14 passed; p6_wire_war_view: 6 passed; p6_wire_war_forced_step: 24 passed; p6_wire_war_declare: 15 passed
- 0 nowych #[ignore]
- Wektory z weba dla planHomeWar/planForcedWarWave: NIE_ZMIERZONO (brak generatora .mjs dla tych funkcji)
BLOKADY: brak blokad. Założenia (nie BLOCK): Z1 wojna podawana przez wołającego (enemy_owners); Z2 is_own_territory i strength_of przez wołającego; Z3 histereza obrony domu świeża na wywołanie (trwała pamięć w W8); Z4 kontakt zakładany; Z5 fala bez jednostek obrony domu i locked; Z6 planWarAllInCapital niepodpięty (brak RuchMapa w widoku).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na branchu p6-wire-war-march-plan; Evaluator powinien zwrócić uwagę, że test "fala nie reużywa jednostek" przechodzi też gdy fala nie powstaje (inwariant, nie dowód planu); przed W8 dołożyć wektory z weba i wiring all-in capital.
DEPLOY/PUSH: NIE WYKONANO
