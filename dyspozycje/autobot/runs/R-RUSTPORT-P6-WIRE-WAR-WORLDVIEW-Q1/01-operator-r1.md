STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-WORLDVIEW-Q1 (W2 z dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md)
GOAL: WarWorldView (referencje do PlayableState) + adaptery do typow wejsciowych modulow wojny: WarTargetCity/Unit, HomeWarCity/Unit, WaveCity/Unit, SiegeCity/Unit, EnterCity, ForcedWarNeighborCandidate. Adaptery czyste, deterministyczne, bez mutacji. Wektory z weba dla adapterow celu wojny.
BAZA: origin/rust-port/parity-v2 = 3e9434a53 (zawiera W1 war_turn_state.rs, state.war)
ZMIANY/COMMIT: 4db9c0e82 (5 plikow, +906): rust-port/engine/src/domain/mod.rs (+1 `pub mod war_world_view`), rust-port/engine/src/domain/war_world_view.rs (nowy), rust-port/engine/tests/p6_wire_war_view.rs (nowy), rust-port/engine/tests/p6_wire_war_view_gen.mjs (generator wektorow), rust-port/engine/tests/p6_wire_war_view_vectors.json (wektory z weba). Brak push.
TESTY:
- Wektory: generator Node v22.22.0 `--experimental-strip-types` na `git archive origin/main gra/src gra/data` (rozpakowane poza repo), wywoluje prawdziwe `buildWarCityTargets` z `gra/src/game/ai-war-target-select.ts`. 4 scenariusze (AI vs AI, AI vs gracz + barbarzynca, gracz jako atakujacy, czesciowy engage).
- `cargo test --test p6_wire_war_view`: 5 passed (w tym zgodnosc adapterow + build_war_city_targets z weba na 4 scenariuszach).
- `cargo test --lib`: 22 passed, 0 failed.
- `cargo test --test p6_wire_war_state`: 14 passed. `cargo test --test p6_repin_ai_war_vectors`: 4 passed.
- `cargo clippy --all-targets -- -D warnings`: Finished, 0 bledow.
- Format: `rustfmt --edition 2021 --check` na nowych plikach: czysto. `cargo fmt` na calym workspace NIE_ZMIERZONO.
- `git diff --check`: czysto. Build z CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w worktree (usuniety po bramce; Cargo.lock wygenerowany przez build usuniety, nie commitowany).
BLOKADY: brak blokad procesowych.
ZALOZENIA (do akceptacji, opisane w naglowku war_world_view.rs):
- Z1 wspolrzedne: x -> q, y -> r (jak playable.rs).
- Z2 founded_by, founded_by_owner, captured_from_owner_id, ma_mur, oblegane NIE sa w PlayableCity; widok przyjmuje mape CityWarExtras (klucz = id miasta), brak wpisu = domyslne. W W8 zrodlem ma byc City ekonomii (state.rs founded_by).
- Z3 PlayableUnit (tylko Warrior): is_field=true, embarked=false, oblega=None, ruch_left=movement.
- Z4 kategoria jednostki dla fal = "land" (web filtruje tylko "galera").
- Z5 sila jednostki (HomeWarUnit.strength) dostarczana przez wolajacego (strength_of).
- Z6 barbarzyncy nieobecne w PlayableState; wolajacy podaje is_barbarian.
- Z7 kandydaci sasiedzi: pozycja = stolica (fallback: pierwsze miasto). Konstrukcja kandydatow po stronie webu NIE_ZMIERZONO, wiec ten adapter nie ma wektorow zgodnosci.
- Id miast: PlayableCity.id (CityId u64) mapowane na string dekadowy; ids webu musza byc bez zer wiodacych (wykryte w trakcie testu, wektory poprawione).
NIE_ZMIERZONO / ograniczenia:
- Zgodnosc z webem wektorami dotyczy tylko buildWarCityTargets (adapter celu). Adaptery home/wave/siege/enter nie maja wektorow z weba; pokryte sa testami wlasnosci (pola, extras, kategoria, determinizm, brak mutacji).
- pick_forced_war_target_id i kandydaci sasiedzi bez wektorow weba.
- Liczba linii pliku ~265 (war_world_view.rs) i 195 (test): w limicie partii 600 LOC.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) i Final Control wedlug obiegu; decyzja orkiestratora o rozszerzeniu wektorow weba na adaptery home/wave/siege.
DEPLOY/PUSH: NIE WYKONANO
