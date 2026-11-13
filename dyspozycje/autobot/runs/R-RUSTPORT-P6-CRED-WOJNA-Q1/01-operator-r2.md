STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-CRED-WOJNA-Q1 (CRED-WOJNA, zadanie #103), runda Operatora 2/5 (dodatek r2 do dispatchu)
GOAL: (a) pełne pokrycie ścieżek wejścia w wojnę hakiem P4 wg pinu 07d2fbd72 (tylko w zakresie allowlisty r2); (b) test 3 tur S3 dla umowa_handlowa porównany z wektorami pinu. Wynik: (b) ZROBIONE; (a) NIE w całości, patrz tabela ścieżek i BLOKADY.
ZMIANY/COMMIT: baza 15d85c2ee (wip/R-RUSTPORT-P6-CRED-WOJNA-Q1). Kod produkcyjny `rust-port/engine/src` BEZ ZMIAN w tej rundzie. Nowe pliki (allowlista r2):
  - rust-port/engine/tests/p6_cred_wojna_gen.mjs (generator: wykonuje tekst pinu w esbuild+node, straznik SHA-256 plików pinu i każdego wyciętego fragmentu `FRAG_SHA`),
  - rust-port/engine/tests/p6_cred_wojna_vectors/vectors.json (wektory z pinu: 160 haków P4, 60 sekwencji kolejności D4/D8, 20 przypadków S3 x 3 tury),
  - rust-port/engine/tests/p6_cred_wojna_vectors.rs (4 testy, bez #[ignore], bez osłabionych asercji).
  Cargo.lock wygenerowany przez cargo w worktree: NIE commitowany.
TESTY (wszystko na 15d85c2ee + te pliki; CARGO_TARGET_DIR poza repo; zmierzone):
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (po zamianie złożonego typu na alias `Snap`)
  - cargo test --lib: 94 ok, EXIT 0
  - cargo test --test p6_cred_wojna: 7 ok
  - cargo test --test p6_credibility: 15 ok
  - cargo test --test p6_wire_war_pipeline: 7 ok
  - cargo test --test p6_cred_wojna_vectors: 4 ok (hook_p4_counter_matches_pin_for_all_cases, p4_milestones_and_last_war_match_pin_in_both_orders, s3_trade_stream_umowa_handlowa_three_turns_matches_pin, vectors_carry_pin_and_guard_hashes)
  - cargo test --no-fail-fast (cały crate): 3190 passed, 0 failed, EXIT 0
  - Mutacja kontrolna: w `note_war_declarations` zamieniono `note_war_entered(a, b, turn)` na `note_war_entered(a, a, turn)` -> test hook_p4_counter_matches_pin_for_all_cases FAILED (3 pozostałe OK). Plik przywrócony z kopii; `git diff -- rust-port/engine/src` puste.
  - Liczniki niepustości wektorów (z generatora, potwierdzone przez testy): hook: 160 przypadków, 147 zapisało licznik obu stron, 13 par z barbarzyńcą; kolejność: 375 kroków z kamieniem P4 > 0, 306 kroków różnych między kolejnością pinu a odwrotną; S3: 50 tur z wpisem strumienia handlu, 10 tur przerwanych dostawą.
  - Walidacja generatora: SHA-256 plików pinu (main.ts e80f9cb4..., diplomacy-credibility.ts, diplomacy-treaties.ts, types/diplomacy.ts, difficulty-cost.ts, diplomacy.ts, diplomacy-peace-lock.ts, diplomacy-pn-engine.ts, barbarians.ts, data/diplomacy.json) OK; SHA-256 wyciętych fragmentów (16 funkcji, m.in. chargeWarDeclarationCredibility 5a29e9f6...) OK.

NAPRAWY ZARZUTÓW r2 (z dodatku):
  1. >=150 wektorów z pinu dla haka P4 i testu S3: ZROBIONE (160 haków; S3 3 tury na 20 przypadkach). Generator wykonuje TEKST pinu (chargeWarDeclarationCredibility i zależności wycięte z main.ts), nie port Rusta.
  2. Kolejność D4/D8 względem P4: ZROBIONE. Wektory pinu w obu kolejnościach (pin: D4 przed D8; odwrotna: D8 przed D4). Test sprawdza, że Rust zgadza się z pinem w obu kolejnościach i że kolejność ma wpływ na wynik. Kolejność w produkcji: `run_dipl_steps` (turn_war_pipeline.rs:370, zawiera D4) przed `note_war_declarations` (turn_war_pipeline.rs:422), zgodnie z pinem.

ZAKRES DOWODU HAKA (kryterium 1 dispatchu) — wykaz ścieżek pin vs Rust (numery linii wg 15d85c2ee i 07d2fbd72):
  | Pin (main.ts) | Ścieżka pinu | Rust (15d85c2ee) | Status |
  | 12223-12224 | skutek P4: licznik obu stron | `CredibilityRegistry::note_war_entered` (credibility.rs:854), `note_war_declarations` (turn_war_dipl_steps.rs:875-895) | POKRYTE, testami wektorowymi |
  | 41931 | wojna wymuszona w pętli AI (stoneForceWarTargetId / ironForceWarTargetId) -> chargeWarDeclarationCredibility(ownerId, targetId) | `declare_forced_wars` (war_turn_declare.rs:105) — BEZ wołania haka (grep: jedyne wołanie haka to turn_war_pipeline.rs:422) | NIE POKRYTE. Plik poza allowlistą r2 (war_turn_declare.rs). Mapowanie na `declare_forced_wars` wnioskowane z nazw (do potwierdzenia). |
  | 13168 | playerDeclareWarOnOwner -> chargeWarDeclarationCredibility(ME(), ownerId) | brak wołania (declare_war w diplomacy_truce_flow.rs:239/247 bez haka) | NIE POKRYTE. Poza zakresem r2 (#120). |
  | 13205 | ownerDeclareWarOn -> chargeWarDeclarationCredibility(attackerId, defenderId) | brak wołania | NIE POKRYTE. Poza zakresem r2 (#120). |
  | 23806 | joinAllyToWar (skipN2AllianceDefense) | brak wołania | NIE POKRYTE. Poza zakresem r2 (#120). |
  | 40441 | wypowiedzenie klastra (csOwnerId, ME()) | brak wołania | NIE POKRYTE. Poza zakresem r2 (#120). |
  | (gałąź z hamulca) | AI-AI i gracz-AI z may_declare, BrakePhaseOutput::declarations | turn_war_pipeline.rs:415-422 -> note_war_declarations | POKRYTE |

  Zastrzeżenia do hamulca: Rust `note_war_entered` modeluje WYŁĄCZNIE licznik P4 obu stron (z barbarzyńcą: pominięcie, jak guard pinu). Gałęzie N1/N2 haka (kary zdrady, odwet, kasowanie oferty pokoju, zapis `truceUntilTurn`) są w pinie, ale w Rust ich brak w tym haku. Te skutki NIE są porównywane przez testy (NIE_ZMIERZONO w tym temacie; wektory generatora je liczą, test ich nie sprawdza).

BLOKADY:
  (1) Kryterium 1 NIE spełnione w całości: wojna wymuszona (pin 41931 -> declare_forced_wars, war_turn_declare.rs:105) nie woła haka. Wpięcie wymaga zmiany `war_turn_declare.rs`, którego NIE MA na allowliście r2. Decyzja orkiestratora: (a) rozszerzyć allowlistę o war_turn_declare.rs i wpiąć hak, albo (b) przenieść do #120 razem z 13168/13205/23806/40441.
  (2) Sprzeczność źródeł — NIE_ZMIERZONO: dodatek r2 mówi, że FC r1 = FAIL z zarzutami 1-6. W gałęzi `origin/rust-port-wip/R-RUSTPORT-P6-CRED-WOJNA-Q1-fc` (6a4fc2d51) FC r1 to PASS-WITH-NOTES ("brak zmian kodu", bazy 23e33793e), a jego twierdzenie „wojna wymuszona pokryta (war_turn_declare.rs:116)” NIE zgadza się z kodem 15d85c2ee (brak haka w war_turn_declare.rs). Zarzuty 1-2 z dodatku wykonano; nie weryfikowano, skąd dokładnie wzięto zarzuty FC r1 (plik 03-final-control.md z tą treścią nie istnieje w 15d85c2ee).
  (3) Baza dodatku: dodatek twierdzi, że 15d85c2ee jest przodkiem origin/claude/rust-sivvrn — FAŁSZ (`merge-base --is-ancestor` = nie). 15d85c2ee JEST przodkiem origin/rust-port/parity-v2 (169 commitów w przód). Użyto SHA 15d85c2ee zgodnie z dodatkiem.
  (4) Nazwa raportu: zlecenie mówi „01-operator-r1.md”, dodatek r2 mówi „01-operator-r2.md (nie nadpisuj r1)”. Zapisano 01-operator-r2.md; r1 nietknięty.
  (5) Alias `umowa_handlowa` -> `LegacyTradeAgreement` (credibility.rs:597-598): ZOSTAWIONY, zgodnie z dodatkiem (pkt „DO DECYZJI CZŁOWIEKA”). S3 testowany wprost na `StreamDealKind::LegacyTradeAgreement`. Zgodność semantyki potwierdzona pinem: `updateWiarygodnoscStreamsThisTurn` (main.ts) daje strumień handlu dla `umowa_handlowa` tylko gdy wszystkie dostawy są w porządku, tak jak `LegacyTradeAgreement` w `stream_active_tuples`.
  (6) Stary generator `p6_credibility_gen.mjs` wołał hak P4 PRZED D4 w tej samej turze (kolejność odwrotna do pinu). Nie ruszano go (poza allowlistą, wektory `p6_credibility` zostają). Nowe wektory kolejności są pinu.
  (7) Wiring zlozeGrants, wypowiedzenie gracza/sojusz/klaster: poza zakresem (jak w dodatku).

RUNDY: 2/5 (Operator r2, Haiku). Kolejna runda tylko po decyzji z BLOKADY (1).
NASTĘPNY KROK: Orkiestrator: decyzja BLOKADY (1) (allowlista war_turn_declare.rs vs #120) i rozstrzygnięcie (2). Evaluator r2 na tym SHA: sprawdzić wektory (generator + SHA fragmentów), mutacje testów i zakres ścieżek.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na wip/R-RUSTPORT-P6-CRED-WOJNA-Q1; bez push, bez integracji, bez parity, bez gra/, bez origin/main).
