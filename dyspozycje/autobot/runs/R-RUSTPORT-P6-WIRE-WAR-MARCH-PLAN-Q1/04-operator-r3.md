STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1 (W5)
GOAL: planer marszu per owner (`plan_war_march` -> `Vec<MarchCommand>`): kampania -> dom -> fala -> all-in; niczego nie wykonuje.
RUNDY: 3/5 (Operator Sonnet 5.5; uzasadnienie: generator wektorow z weba = wiele sciezek, po dwoch rundach Haiku). Baza: 654b778b7.
(Plik nazwany 04-operator-r3.md, zeby nie nadpisac 01-operator-r1.md.)

ZMIANY-COMMIT: patrz SHA w nocie orkiestratora / `git log` galezi `w5march-r3` (jawny `git add`, bez push).
Kod `ai_war_march_plan.rs` bez zmian (308 LOC). Zmiany to testy, wektory, generator, dokument:
- `rust-port/engine/tests/p6_wire_war_march.rs` (689 LOC) USUNIETY -> podzial:
  `p6_wire_war_march_core.rs` 578 LOC, `p6_wire_war_march_adapter.rs` 301 LOC, `p6_wire_war_march_vectors.rs` 274 LOC (wc -l; kazdy <= 600).
- `rust-port/engine/tests/p6_wire_war_march_vectors.json` (500 scenariuszy z weba).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-MARCH-PLAN-Q1/gen-w5-march-vectors.mjs` (generator + przepis w naglowku).
- `dyspozycje/rust-port/p6/P6-WIRE-WAR-MARCH-PLAN.md` (sekcje 2, 4, 5).
war_world_view.rs / war_turn_state.rs nietkniete.

ZADANIA FC r2:
1. Wektory z uruchomionego weba: ZROBIONE dla planHomeWar i planForcedWarWave (esbuild-bundle prawdziwych funkcji z origin/main
   cffe39cb9, seed 5005, 500 scenariuszy: 472 rozkazy domu [12 attack / 452 approach / 8 hold], 97 fal, 44 z aktywna fala,
   37 z historia, 10 dom+fala). Test porownuje 1:1 komendy Home i ForcedWave rdzenia (kolejnosc, cele, unit/move/deferred ids,
   origin/rally, sektor, tura). Zgodnosc za pierwszym razem. planWarAllInCapital i buildWarCityTargets: jawne uzasadnienie w doc
   (maja wlasne wektory z weba: p6_repin_wojna_d_*, p6_wire_war_view_vectors.json; W5 testuje wpiecie, nie dubluje wektorow nav).
2. Test adaptera z wrogiem i niepustym opaque: `waves_from_state_reads_waves_and_history`, `adapter_enemy_and_opaque_state_changes_wave_target`
   (historia fal zmienia cel fali 2 -> 3).
3. Asercja kolejnosci: `commands_come_in_order_campaign_home_wave_all_in` (wszystkie 4 rodzaje, rangi niemalejace).
4. Podzial pliku testowego: ZROBIONE (powyzej).
5. Bramki: patrz TESTY.

TESTY (uruchomione samodzielnie, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w worktree):
- `cargo fmt --check`: OK. `cargo clippy --all-targets -- -D warnings`: OK.
- lib 28 passed; core 12; adapter 5; vectors 1; p6_wire_war_state 14; _state_snapshot 8; _view 6; _forced_step 24; _declare 15; _declare_peace 7;
  0 failed, 0 ignored, 0 nowych #[ignore].
- Wynik pozytywny testow wektorowych NIE byl sprawdzany mutacja (NIE_ZMIERZONO czulosc na mutanty).

BLOKADY: brak. ZALOZENIA: nazwa raportu 04 zamiast 01 (nie nadpisywac historii); Z3/Z4 zostaja do W8 (opisane w doc).
NASTEPNY KROK: Evaluator r3 -> Final Control; po PASS integracja kodu operatora na origin/rust-port/parity-v2.
DEPLOY/PUSH: NIE WYKONANO
