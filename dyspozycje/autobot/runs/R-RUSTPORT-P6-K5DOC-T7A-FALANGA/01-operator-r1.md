STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7A-FALANGA (runda 1, Operator; FALANGA: `_phalanxAction`, `_phalanxLineFront`, `_phalanxStep`, #261 część A, K5DOC-T7a)
GOAL: czyste funkcje falangi w Rust (is_phalanx, phalanx_line_front, phalanx_action_decide, phalanx_step_decide) zgodne z pinem 07d2fbd72, z wektorami wykonanymi przez TypeScript i mutacjami.
ZMIANY/COMMIT: kod 0964e67a1 (P6 K5DOC-T7a); raport = osobny commit na gałęzi roboczej (detached HEAD worktree wf_30e2308d-50d-1, baza f85622878). Pliki (allowlista): rust-port/engine/src/domain/siege_tactics_phalanx.rs (NOWY, 261 linii); rust-port/engine/src/domain/mod.rs (+1 linia `pub mod siege_tactics_phalanx;`); rust-port/engine/tests/p6_k5doc_t7a.rs (NOWY); rust-port/engine/tests/p6_k5doc_t7a_gen.mjs (NOWY); rust-port/engine/tests/p6_k5doc_t7a_vectors/vectors.json (NOWY). Cargo.lock NIE dodany. Bez zmian w gra/, siege_tactics_activate.rs, siege_tactics_loop.rs, diplomacy.rs, unit_replace_defs.rs.
TESTY:
- Generator: node rust-port/engine/tests/p6_k5doc_t7a_gen.mjs EXIT 0. Wykonuje pin przez TypeScript (sprawdzone straznikami linii i sha256 wycinkow). Wektory: is_phalanx 15, line_front 8, action 24.
- cargo test --test p6_k5doc_t7a: 10 passed, 0 failed (po rustfmt; przed rustfmt tez 10/10). EXIT 0.
- cargo fmt --check -p civ-engine: EXIT 0 (po rustfmt na 2 nowych plikach).
- MUTACJE (kazda FAIL, modul przywracany z kopii po kazdej):
  (a) PHALANX_LEAD_TOLERANCE 2 -> 3: FAIL, 3 testy (constants_match_pin, action_matches_pinned_vectors, tolerance_boundary_two_moves_three_holds).
  (b) pominiety filtr primary_ranged (`if false && e.primary_ranged`): FAIL, 2 testy (action_matches_pinned_vectors, primary_ranged_enemy_is_skipped).
  (c) negacja galezi kategorii (`cat == "falanga"` -> `cat != "falanga"`) w is_phalanx: FAIL, 1 test (is_phalanx_matches_pinned_vectors).
- NIE URUCHOMIONO (BLOKADA INFRA, patrz BLOKADY): cargo clippy --all-targets -- -D warnings; cargo test --all-targets --no-fail-fast (EXIT kodow: NIE_ZMIERZONO).
BLOKADY:
1. DYSK: bramki clippy i pelnego cargo test wymagaja df >= 8 GB. Zmierzone wolne miejsce na / w trakcie sesji: 8,3 GB (start), 4,5 GB, 3,5 GB, 7,3 GB (koniec). Moj CARGO_TARGET_DIR (scratchpad t7a_target) mial 299 MB; spadek pochodzi od innych procesow na tym samym dysku. Zgodnie z dispatchem: BLOCK (INFRA). Bramki do powtorzenia po zwolnieniu dysku do >= 8 GB.
2. BRAK PLIKU ROZPOZNANIA: `git show f85622878:dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE/01-rozpoznanie.md` nie istnieje (sprawdzone ls-tree). Ustalenie o sciezce wywolania wzieto z DECYZJI w dispatchu (tryb reczny `_manualMode` przez `_phalanxAction`; tryb auto `steady` przez `_executeGroupDoctrineStep` pomija falange). NIE_ZMIERZONO wzgledem rozpoznania.
3. ROZBIEZNOSC DISPATCH vs PIN (zapisane, nie wymyslone):
  - Dispatch wymienia wynik `Schedule`. W pinie `_phalanxStep` wola `_doMove(ru, nc, nr, () => { done(); })` (`:6635`): po ruchu jest tylko `done()`, bez `_schedule`. Wariant Schedule NIE istnieje w falandze i NIE zostal dodany. Po ruchu koniec kroku = efekt wolajacego.
  - Dispatch wymienia `move cost przez MoveWorld` jako wejscie PhalanxWorld. Koszt terenu czyta wylacznie `do_move_effects` (T4c); decyzja falangi go nie potrzebuje (pin nie czyta kosztu w `_phalanxStep`, tylko `_passableForUnit`), wiec nie dodano go do traitu.
  - `AdvanceStep` (wynik poza dispatchem): galaz pina `lineFront === null` wola `_advanceStep`, ktory nie jest tym modulem (T4b). Zwracany jest jako wariant, wolajacy wykonuje `advance_step_decide`.
DECYZJE TECHNICZNE (orkiestrator, wpis do REJESTR-RUST wg zasady 8 — NIE_ZMIERZONO w rejestrze, bo rejestru nie dotykano):
  - norm_name = siege_tactics_classify::norm_name (pokrywa NFD dla U+00C0..U+017F). Pelny Unicode NFD poza zakresem; dla nazw falang (ASCII i polskie diakrytyki) wystarcza.
  - PhalanxIdent: kategoria/Jednostka/nazwa jako Option<String>; `stats` pominiete (Jednostka==null i stats==undefined daja to samo w `?? nazwa`).
RUNDY: 1/5 (ostatni werdykt: brak; to jest runda Operatora, bez Evaluatora).
NASTEPNY KROK: (1) zwolnic dysk do >= 8 GB i powtorzyc: cargo clippy --all-targets -- -D warnings oraz cargo test --all-targets --no-fail-fast w rust-port/engine (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunac po bramkach); (2) Evaluator (Sonnet) i Final Control na tym commicie; (3) wiring (kiedy wolac _phalanxAction) zostaje w T8/#113 — poza tym tematem.
DEPLOY/PUSH: NIE WYKONANO (brak push do rust-port/parity-v2 i claude/rust-sivvrn zgodnie z dispatchem; brak integracji).
