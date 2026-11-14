STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1 (zadanie #104, część 1 z 2)
GOAL: Stan dyplomacji w Rust przechowuje granty złóż (`zlozeGrants`) jako jawne pole `DiplomacyState::zloze_grants` i udostępnia operacje stanu: `suspend` przy wojnie oraz `deactivate` przy wygaśnięciu umowy, zgodne z pinem 07d2fbd72. Wiring do ścieżki produkcyjnej tury/handlu NIE należy do tego tematu (część 2 w #104).
ZMIANY/COMMIT: BAZA = a381dd13f. Sprawdzenie `git merge-base --is-ancestor a381dd13f HEAD` dało FAŁSZ (HEAD worktree 5304bbab8 na gałęzi worktree-wf_4c2b7e55-cfa-1 nie zawiera a381dd13f); zgodnie z dispatchem przestawiono na a381dd13f, gałąź wip/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1. Allowlista: rust-port/engine/src/domain/diplomacy.rs (zmodyfikowany, +40/-2), rust-port/engine/tests/p6_zloze_grants_state.rs (nowy), rust-port/engine/tests/p6_zloze_grants_state_gen.mjs (nowy), rust-port/engine/tests/p6_zloze_grants_state_vectors/vectors.json (nowy), dyspozycje/autobot/runs/R-RUSTPORT-P6-ZLOZE-GRANTS-STATE-Q1/01-operator-r1.md (nowy). Cargo.lock wygenerowany przez cargo i usunięty, NIE commitowany.
TESTY:
  - cargo fmt --check: EXIT 0 (jednorazowy cargo fmt, wyłącznie pliki tematu)
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (po poprawkach w pliku testu: układ komentarzy doc i konstrukcja stanu przez literał struktury)
  - cargo test --lib: EXIT 0 (114 passed, 0 failed)
  - cargo test --test p6_zloze_grants_state: EXIT 0 (7 passed: vectors_meet_minimum_counts_and_pin; suspend_zloze_grants_for_war_matches_pin_vectors (240 przypadków); deactivate_zloze_grants_for_deal_matches_pin_vectors (200 przypadków); state_methods_delegate_to_pure_functions; state_without_zloze_grants_field_loads_as_empty_list; zloze_grant_round_trip_uses_camel_case_and_omits_missing_deal_id; vector_grants_round_trip_through_json)
  - cargo test --test p6_r7k7b_zloze_sync (regresja): EXIT 0 (3 passed)
  - Generator p6_zloze_grants_state_gen.mjs uruchomiony na tekście pina 07d2fbd72 (gra/src/game/diplomacy-pn-engine.ts, SHA-256 ee1b1aabffd4fdf906ce260084f80ad5da055c64912b6eda86306ba261d89257, zgodny): OK suspend=240 deactivate=200.
  - git diff --check: EXIT 0.
  - Bez #[ignore], bez osłabionych asercji.
  - CARGO_TARGET_DIR poza repo (w scratchpadzie), do usunięcia po zapisie raportu.
BLOKADY: brak blokad po stronie tego tematu.
  - Uwaga dla FC: pole `zloze_grants` w DiplomacyState serializuje się pod kluczem snake_case `zloze_grants` (spójnie z sąsiednimi polami `relations`, `deals`), a nie `zlozeGrants` jak na pinie. Klucze wewnątrz ZlozeGrant są camelCase zgodnie z dispatchem. Ewentualny rename klucza stanu to osobna decyzja w części 2.
  - Brak wołającego w produkcji jest DOZWOLONY w tym temacie (wiring = #104 część 2). Metody DiplomacyState::suspend_zloze_grants_for_war i DiplomacyState::deactivate_zloze_grants_for_deal nie mają jeszcze wołającego w src/.
  - Komentarz w diplomacy.rs (sekcja R-RUSTPORT-P6-WIRE-WAR-R7K7B) zaktualizowany: pole dodane świadomie, z odniesieniem do dispatchu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 weryfikuje kryteria końca z dispatchu (wektory z pina, SHA-256, allowlista, bramki EXIT 0); następnie Final Control; integracja po FC przez orkiestratora (poza tym tematem).
DEPLOY/PUSH: NIE WYKONANO
