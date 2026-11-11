STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1
GOAL: Port fazy dyplomacji tury (galaz hamulca, `runDiplomacyTurnTick` gra/src/main.ts l.24229): brake AI<->AI, licznik kryzysu, dobra wola, sortowanie kolejki, wybor deklarujacego, ai_ai_pairs; plus blokady akcji, brama oblezenia, cooldown odrzucen, oferty miasta za pokoj.
ZMIANY/COMMIT: baza rust-port/parity-v2 = a4087f332; pin web = origin/main = 07d2fbd72f758705f8e1d59cc4968027ffbafe75.
  Nowe: rust-port/engine/src/domain/ai_diplomacy_turn.rs (234 LOC), rust-port/engine/tests/p6_wire_war_diplo.rs (429 LOC),
  rust-port/engine/tests/p6_wire_war_diplo_gen.mjs (214 LOC, generator wektorow z weba: esbuild 0.24.2 poza repo),
  rust-port/engine/tests/p6_wire_war_diplo_vectors/primitives.json (946 LOC), phase.json (1016 LOC),
  dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-DIPLO-TURN-Q1/01-operator-r1.md.
  Zmienione: rust-port/engine/src/domain/mod.rs (+1 linia `pub mod ai_diplomacy_turn;`).
  Cargo.lock wygenerowany lokalnie, NIE commitowany. SHA commita: NIE_ZMIERZONO (commit wykonuje orkiestrator/operator po tej rundzie; patrz NASTEPNY KROK).
  Poza allowlista: nic.
TESTY:
  - cargo fmt --check (nowe pliki + mod.rs): OK (exit 0).
  - cargo clippy --all-targets -- -D warnings: OK (exit 0).
  - cargo test --lib: 28 passed, 0 failed.
  - cargo test --test p6_wire_war_diplo: 12 passed, 0 failed (primitives 10 + phase 6 scenariuszy na wektorach weba + brake_crisis_step).
  - Sasiednie: p6_wire_war_declare, _declare_peace, _state, _state_snapshot, _forced_step, _march_core, _march_adapter, _march_vectors: wszystkie zielone.
  - Wektory: transkrypcja galezi brakeOn `runDiplomacyTurnTick` zbudowana na funkcjach z gra/src/game/diplomacy-tick-war-brake.ts (bundle z pinu). Tick relacji pary jest wejsciem scenariusza (relation_after_tick), nie jest odtwarzany.
  - Scenariusze fazy: ai_ai_five_turns_declare (kolejka i wybor deklarujacego), player_stronger_no_auto_war (D7: gracz nie wypowiada z hamulca), counter_reset_on_recovery, gate_and_peace_lock_delay (bramka R1/R2 i blokada pokoju odraczaja deklaracje), dobra_wola_countdown, resume_from_saved_counters.
  - Brak #[ignore], brak osłabionych asercji.
  - Bramki pominiete: brak. Tests w tle: brak (wszystko < 120 s).
BLOKADY:
  1. GOAL nie jest zrealizowany w calosci. Zrobione: brake AI<->AI, licznik kryzysu (krok per para + krok gracz<->AI), dobra wola (galaz ON), kolejka wojen z progu, wybor deklarujacego (D7), ai_ai_pairs.
  2. NIEZROBIONE w tej rundzie: blokady akcji (`resolve_diplomacy_action_lock` — istnieje w diplomacy_locks.rs, nie podpiete w ai_diplomacy_turn), brama oblezenia (diplomacy_siege_war_gate.rs), cooldown odrzucen z kluczem `miasto_za_pokoj` (diplomacy_rejection_cooldown.rs — stale i klucz istnieja, brak wiazania z faza tury), oferty miasta za pokoj (ai_peace_city_offer.rs — istnieje, brak wiazania). Kryterium 1 (kazda funkcja z GOAL ma test na wektorach) NIE jest spelnione dla tych czterech punktow. Moduly istnieja i maja wlasne testy z poprzednich partii; nie dodawalem duplikatow.
  3. Galaz OFF (`isDiploTickWarBrakeEnabled() == false`, tickDobraWolaOnRelation) NIE jest modelowana: caller musi wybrac galaz. `run_brake_phase` zaklada ON.
  4. Efekty deklaracji wojny (breakTreatiesOnWar, applyAllianceObligationsOnWar, zdarzenie 'wojna_wypowiedziana', zarejestrujWypowiedzenie, recordWarDeclarationEvent, tributeNegotiations) NIE sa w tym module: `declarations` zwracane do callera (W4/W8).
  5. Ostrzezenia/komunikaty UI (showHintMessage) pominiete: poza zakresem silnika.
  6. Podpiecie do petli tury Rust = W8 (ostatnia partia, zgodnie z P6-WIRE-WAR-TURN-PLAN). Zaleznosc jawna, nie ukryta.
  7. ZALOZENIA adaptacji (opisane w kodzie): klucz pary (min,max); brakujace parametry w mapach wejsciowych -> zaufanie NaN (reset), sila 0.0, n = +inf (web nie ma brakow).
  8. W wektorach `parseCrisisCounters` porownanie jako zbior (kolejnosc nie jest kontraktem, zgodnie z brake.rs).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (Sonnet) ma zweryfikowac: (a) zakres wobec kryterium 1, czyli czy punkty 2 (blokady, brama, cooldown, oferty) maja zostac w tym temacie czy przejsc do osobnego tematu; (b) wektory generowane z pinu 07d2fbd72. Decyzja zakresu dla wlasciciela, jesli Evaluator uzna ja za ABC.
DEPLOY/PUSH: NIE WYKONANO
