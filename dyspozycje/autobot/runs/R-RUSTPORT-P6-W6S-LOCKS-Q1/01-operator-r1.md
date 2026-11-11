STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-W6S-LOCKS-Q1 (W6 wariant A, punkt 1: blokady akcji dyplomacji, runda 1/5, Operator)
GOAL: port `resolveDiplomacyActionLock` (web) do `rust-port/engine/src/domain/diplomacy_locks.rs` z testem behawioralnym na wektorach pinu oraz mapowaniem wywołań webu na Rust albo jawną zależność do W8.
ZMIANY/COMMIT:
- Kod operatora: `3c5a20e9b` (gałąź `R-RUSTPORT-P6-W6S-LOCKS-Q1-wip/operator-r1`, baza `origin/rust-port/parity-v2` = `f207ea6b1`, worktree detached).
- Dodane (allowlista): `rust-port/engine/tests/p6_w6s_locks.rs` (3 testy), `rust-port/engine/tests/p6_w6s_locks_gen.mjs` (generator), `rust-port/engine/tests/p6_w6s_locks_vectors/locks.json` (3000 wierszy, 2,4 MB).
- NIE zmieniano: `diplomacy_locks.rs` (port już istniał, działa zgodnie z testami), `mod.rs`, `gra/**`, `origin/main`, `WERSJE.md`, `Cargo.toml`, `Cargo.lock` (wygenerowany przez cargo, NIE commitowany, pozostaje untracked).
- Pin web: `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (wypakowany `git archive ... gra/src gra/data` poza repo, bundle esbuild 0.24.0 poza repo, Node v22.23.4).
- Generator: `node rust-port/engine/tests/p6_w6s_locks_gen.mjs --web <work>/web/gra/src --esbuild <work>/esb/node_modules/esbuild --work <work>/bundle --out rust-port/engine/tests/p6_w6s_locks_vectors/locks.json` (ziarno PRNG stałe, wynik: rows=3000 locked=1421 active=143). Wektory generowane z wywołań webu, nie ręcznie.
- Raport: ten plik, commit kodu wyżej (SHA raportu w wiadomości commita).

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- `rustfmt --edition 2021 tests/p6_w6s_locks.rs` — zastosowany; `cargo fmt --check` dla plików tematu: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0, 0 ostrzeżeń.
- `cargo test --lib`: EXIT 0, 28 passed, 0 failed, 0 ignored.
- `cargo test --test p6_w6s_locks`: EXIT 0, 3 passed, 0 failed, 0 ignored (`resolve_diplomacy_action_lock_matches_pinned_web_vectors`, `vectors_cover_every_case_and_outcome`, `action_15_without_vassal_is_locked_with_web_note`).
- `git diff --check`: czysto. `#[ignore]` w pliku testu: 0.
- Pokrycie wektorów: każda akcja 2..15 i gałąź default (`1`, `16`, `0`, ``, `x`); stany open / locked-req / locked-plain / active; kinds zaufanie/respekt/stan.
- Logi lokalne (poza repo): `<scratchpad>/w6s/test-p6.log`, `clippy.log`, `test-lib.log`.
- NIE_ZMIERZONO: porównania z uruchomioną grą w przeglądarce (nie dotyczy testu logiki); nie uruchamiano pełnego `cargo test` (tylko `--lib` i wskazany test integracyjny, zgodnie z kryteriami); nie mierzono wydajności.
- Istniejący test `p6_dyplomacja_multiwar3_e.rs` (2500 wierszy z `origin/main`, wcześniejszy pin) nie był uruchamiany w tej rundzie.

BLOKADY:
- Kryterium 1 (wywołania webu): jedyne wywołanie `resolveDiplomacyActionLock` w pinie to `gra/src/game/diplomacy-audience-actions.ts:83` (wewnątrz `buildAudienceActionsList`), importowane przez `gra/src/main.ts:409` (import funkcji) i `gra/src/ui/diplomacyAudience.ts:59`. Po stronie Rust NIE istnieje odpowiednik budowy listy akcji audiencji (`grep -rln audience rust-port --include=*.rs` = pusto), więc funkcja w Rust NIE ma wołającego.
- Zależność do W8 (jawna): podpięcie `resolve_diplomacy_action_lock` pod budowę listy akcji audiencji (`buildAudienceActionsList` -> Rust) oraz pętlę tury należy do W8. Ten temat NIE dodaje wołającego w Rust. Mapowanie: `diplomacy-audience-actions.ts:83` -> W8 (brak odpowiednika), reguły `restrictToBasicActions` / `playerDiplomacyActionAllowed('war'|'trade')` z tej samej pętli -> poza zakresem tego tematu (W8).
- Rozbieżność z dispatchem: dispatch podaje wywołania w `main.ts ~17504–18209, 20272, 20656, 36735`. W pinie `git grep resolveDiplomacyActionLock` nie znajduje tam żadnego wywołania (w `main.ts` tylko import, linia 1195, i komentarz, linia 25124). Mapowanie oparte na faktycznym pinie, nie na numerach z dispatchu. Do weryfikacji przez Evaluatora.
- Brak wywołania w Rust oznacza, że kryterium „co najmniej jeden wołający” jest spełnione tylko przez zależność W8 (zgodnie z dopuszczoną alternatywą w dispatchu).

RUNDY: 1/5 (Operator, runda 1), ostatni werdykt: brak (pierwsza runda)
NASTĘPNY KROK: Evaluator (R-RUSTPORT-P6-W6S-LOCKS-Q1, kod `3c5a20e9b`): sprawdzić wektory względem pinu (ponowne wygenerowanie generatorem), mapowanie wywołań (kryterium 1) i zależność W8.
DEPLOY/PUSH: NIE WYKONANO (push wyłącznie gałęzi roboczej `R-RUSTPORT-P6-W6S-LOCKS-Q1-wip/operator-r1`; `rust-port/parity-v2` i `origin/main` nietknięte).
