STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-EXEC-T2-MOVE-GATE-Q1
GOAL: Port trzech czystych bramek ruchu z pinu 07d2fbd72 (gra/src/battle/battleScene.ts) do modułu Rust `domain::player_order_move_gate`: blokada linii (_destAllowedByBlockade, 17809), krok zwarcia (_compactAttackAllowsStep, 8139, wrapper na compact_line_allows_advance), anty-cofanie automatu (_shouldAvoidAutoBacktrack, 8191). Wektory generowane przez wykonanie kodu z pinu.

BAZA: origin/rust-port/parity-v2 = 316ded4b7 (potwierdzone fetch). Worktree detached na 316ded4b7. Pin gra/src tylko do odczytu (git show 07d2fbd72:gra/src/battle/battleScene.ts oraz formationRules.ts).

ZMIANY/COMMIT (allowlista, bez zmian poza nią):
- rust-port/engine/src/domain/player_order_move_gate.rs (NOWY): trzy funkcje 1:1 z komentarzami plik:linia; typy GroupDoctrine, BlockadeSettings, CompactStepUnit, LineMember, GroupMeta, BacktrackUnit. Moduł czysty (bez stanu UI/sceny).
- rust-port/engine/src/domain/mod.rs: jedna linia `pub mod player_order_move_gate;`.
- rust-port/engine/tests/p6_player_order_move_gate.rs (NOWY): 10 testów opisowych (blokada atk/def, granica, anty-cofanie atk/def, krok boczny, krok w granicy i poza, ograniczenie linią poprzedniej rangi, wyłączenia Steady/konni/oblężnicze, meta grup) + 3 testy wektorowe (wszystkie 320 blockade, 2000 compact, 72 backtrack).
- rust-port/engine/tests/p6_player_order_move_gate_gen.mjs (NOWY): generator; wycina trzy metody + compactLineAllowsAdvance z pinu, zdejmuje typy (node:module.stripTypeScriptTypes), wykonuje je na atrapie this, liczy SHA-256 każdego fragmentu.
- rust-port/engine/tests/p6_player_order_move_gate_vectors/vectors.json (NOWY): wynik generatora (seed 20261116).
- dyspozycje/autobot/runs/R-RUSTPORT-P6-EXEC-T2-MOVE-GATE-Q1/01-operator-r1.md (ten raport).

FRAGMENTY PINU (SHA-256 wycinków, wykonane przez generator):
- _destAllowedByBlockade battleScene.ts:17809-17815  0775d0f91c034c187507a6b9d783417d8cafbbebfa7959f4d0dd804e07deea88
- _compactAttackAllowsStep battleScene.ts:8139-8172  96a3adcf5c2a2d83d6b9dce409bac957798cf256bcac6c1c5e72474d45530ee8
- _shouldAvoidAutoBacktrack battleScene.ts:8191-8196  99b2bc87346a6ac2c61565228457963bd148cc75004a5658d4ea4869f4e3ea43
- compactLineAllowsAdvance formationRules.ts:156-168  76467712b9d748ebb5b797b8a960f09a42e3b1109d01fe6979c12abb1651df6a

TESTY:
- Bramki (worktree rust-port/engine, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (po ostatniej zmiany kodu i po rustfmt)
  - cargo test --all-targets --no-fail-fast: EXIT 0; sumarycznie passed=3640 failed=0 ignored=1. Jedyny ignorowany test (p6_order_lane.rs:1530) jest w pliku sprzed tematu, poza allowlistą; nowe pliki nie zawierają #[ignore].
  - cargo test --test p6_player_order_move_gate: 13/13 ok.
- Mutacje (każda musi dać FAIL; po każdej przywrócono plik z kopii i zweryfikowano diff):
  - (a) odwrócenie warunku blokady (atk: `col <= block` -> `col > block`): FAIL, 2 testy (blockade_attacker_may_not_pass_its_block_column, blockade_matches_pinned_web_execution).
  - (b) pominięcie anty-cofania (`if next_progress < current_progress` -> `if false && ...`): FAIL, 3 testy (compact_step_backwards_is_forbidden_for_attacker/defender, compact_step_matches_pinned_web_execution).
  - (c) zmiana granicy zwarcia o 1 (argument line_reference_progress `current_progress` -> `current_progress + 1.0`): FAIL, 2 testy (compact_step_inside_and_on_boundary_is_allowed_for_first_rank, compact_step_matches_pinned_web_execution).
- Generator: 320 przypadków blokady (257 expected=true), 2000 przypadków kroku zwarcia (1369 true), 72 przypadki anty-cofania (15 true). Pokrycie gałęzi sprawdzane w teście: postęp dozwolony >=50, postęp zabroniony przez granicę >=50, cofnięcie zabronione >=50.

WYMAGANIA Z DISPATCHU - ODPOWIEDŹ PUNKT PO PUNKCIE:
- "blokada z zajętym kafelem i bez": NIE_DOTYCZY. Funkcja pinu (17809-17815) nie czyta zajętości kafla, tylko flagę blockadeActive i kolumnę blockadeCol. Pokryte: aktywna/nieaktywna, brak kolumny, granica, obie strony.
- "krok zwarcia wewnątrz/na granicy": pokryte (testy opisowe i wektory).
- "anty-cofanie: wejście na kafel z poprzedniej pozycji zabronione, inne dozwolone": pokryte. Uwaga: pin zabrania cofnięcia kolumny (postęp < bieżący), a nie wejścia na dokładnie poprzedni kafel; testy sprawdzają regułę z pinu.

BLOKADY / NOTATKI:
- Atrapy w generatorze (jawnie w polu `stubs` vectors.json): isSiegeUnit(bu) = bu.siege; _effectiveMetaForUnit(ru) = {doctrine: ru.effDoctrine}. Te dwie funkcje nie są wykonywane z pinu w tym temacie; w produkcji wołający musi podać ich wynik jako fakt (API tak jest zaprojektowane: siege i doctrine to argumenty).
- Nie zmieniano formation_rules.rs (compact_line_allows_advance wywołane wyłącznie z nowego modułu).
- Nie portowano _advanceStep ani _doctrineMoveDest (DOC-T4 / DOC-T8), zgodnie z NIE ROBIĆ.
- Cargo.lock wygenerowany przez cargo został usunięty i NIE jest w commicie.
- Brak pushu do rust-port/parity-v2; brak integracji; gra/ nietknięte.

RUNDY: 1/5 (runda 1, bez FAIL; brak eskalacji). Model: Operator = HAIKU.

NASTĘPNY KROK: Evaluator (Sonnet) i Final Control zgodnie z obiegiem; po FC integracja przez orkiestratora (sprawdzić `git merge-base --is-ancestor` względem SHA operatora przed integracją). Kolejne tematy K5DOC-T4 (pieszy szyk) mogą używać CompactStepUnit/LineMember z tego modułu.

DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi wip; push i integracja wyłącznie po autoryzacji orkiestratora).
