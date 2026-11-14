STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1 (#104 czesc 2, T1 z R-RUSTPORT-P6-ZLOZE-WIRING-ROZPOZNANIE-Q2)
GOAL: Wpiecie deaktywacji grantow zlozy (`zlozeGrants`) w produkcyjnej turze: D1 (wygasniecie umowy) i D6 (zerwanie za daninę, `res.broken`), parytet z pinem 07d2fbd72 (`main.ts` 24234, 24292-24294).
ZMIANY/COMMIT: baza 6acb1d81b, galaz wip/R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1. Allowlista:
  - rust-port/engine/src/domain/turn_war_dipl_steps.rs (+7 linii: wywolania deaktywacji w D1 i D6; reszta bez zmian)
  - rust-port/engine/tests/p6_zloze_wire_expire_tribute.rs (NOWY, test produkcyjnej tury run_war_turn)
  - rust-port/engine/tests/p6_zloze_wire_expire_tribute_gen.mjs (NOWY; wykonuje tekst pina deactivateZlozeGrantsForDeal, straznik SHA-256 ee1b1aab...)
  - rust-port/engine/tests/p6_zloze_wire_expire_tribute_vectors/vectors.json (NOWY)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-WIRE-EXPIRE-TRIBUTE-Q1/01-operator-r1.md (NOWY)
  Cargo.lock NIE commitowany (untracked, wygenerowany przez cargo).
  Miejsca produkcyjne (git grep): turn_war_dipl_steps.rs:923 (D1, po report.expired_deals.push) i :966-968 (D6, petla `for id in &res.broken`, po retain). Wywolanie w D6 obejmuje kazdy `id` z `res.broken`, takze bez pary w `tribute_break_pairs`. Brak zmian w diplomacy.rs, gra/, Cargo.toml.
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: EXIT 0 (114 passed)
  - cargo test --test p6_zloze_wire_expire_tribute: EXIT 0 (1 passed)
  - cargo test --test p6_wire_war_dipl_steps: EXIT 0 (8 passed)
  - cargo test --test p6_zloze_grants_state: EXIT 0 (8 passed)
  - cargo test --test p6_r7k7b_zloze_sync: EXIT 0 (3 passed)
  - Mutacja: po usunieciu obu wywolan z produkcji test p6_zloze_wire_expire_tribute pada ("d1-wygasniecie: active grantu z-wygasla"); kod przywrocony (diff 7 insertions).
  - Generator: node p6_zloze_wire_expire_tribute_gen.mjs <pin gra/src> <out> -> OK (SHA-256 zgodny).
  - git diff --check: czysty.
  Bramki uruchomione z CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 i CARGO_TARGET_DIR poza repo (scratchpad); target do usuniecia po bramkach.
BLOKADY: brak. Pin deaktywuje w D1 per wygasla umowa, w D6 per id z `broken`; implementacja robi to samo (bez dubla dla trybutu).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja wektorow i mutacji), potem Final Control. Integracja dopiero przez orkiestratora po FC.
DEPLOY/PUSH: NIE WYKONANO (brak push do parity-v2; tylko commit na galezi wip).
