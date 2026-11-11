STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-TICKDIPLO-BORDER-EPOCH-Q1
GOAL: parytet tickDiplomacy: kara graniczna wg epoki (Kamien -2 / Braz -3 / Zelazo -4) w Rust TickContext; generator emituje epoki 2 i 3; test behawioralny z wektorami z pinu.
ZMIANY/COMMIT: gałąź lokalna rust-port/p6-tickdiplo-border-epoch-q1-wip, commit kodu 625a3e9eb (tylko allowlista: rust-port/engine/src/domain/diplomacy.rs, rust-port/engine/tests/p6_tickdiplo.rs, rust-port/engine/tests/p6_tickdiplo_gen.mjs, rust-port/engine/tests/p6_tickdiplo_vectors/tick.json). Cargo.lock nie commitowany. Baza: origin/rust-port/parity-v2 = 8bb118dc7. Nie pushowano do rust-port/parity-v2, nie integrowano, gra/ nietknięte.
  Zmiany w kodzie:
  - TickContext.common_border_delta: Option<f64> (odpowiednik web karaWspolnaGranicaDelta; None = epoka 1 = params.common_border_trust_per_turn = -2).
  - DiplomacyParams: common_border_trust_per_turn_bronze = -3.0, common_border_trust_per_turn_iron = -4.0 (zgodne z pinem).
  - shared_border_penalty_for_epochs(ea, eb, params): max(ea,eb) >= 3 -> Zelazo, >= 2 -> Braz, inaczej baza (odpowiednik web sharedBorderPenaltyForEpochs).
  - compute_trust_delta: gdy common_border, dodaje common_border_delta.unwrap_or(baza).
  Wektory: generator (esbuild 0.24.0 poza repo; web wyekstrahowany z pina 07d2fbd72f758705f8e1d59cc4968027ffbafe75 przez git archive poza repo) generuje 2000 wierszy; epoki 0..4 wylosowane, delta = sharedBorderPenaltyForEpochs z pina. Pokrycie: domyslna 141, Braz(-3) 78, Zelazo(-4) 230. Regeneracja identyczna, md5 tick.json = 4cc0ebe15e7aaf0a01f40ef9ae70d8ac (dwa niezalezne przebiegi).
TESTY:
  - cargo fmt --check: EXIT 0 (cargo fmt objął tylko pliki tematu).
  - cargo clippy --all-targets -- -D warnings: EXIT 101 na commicie 625a3e9eb (patrz BLOKADY). Z tymczasową poprawką poza allowlistą: EXIT 0.
  - cargo test --lib: EXIT 0, 28 passed (na commicie).
  - cargo test --test p6_tickdiplo: EXIT 0, 1 passed (tick_pair_matches_pinned_web_tick_diplomacy_on_vectors, 2000 wierszy).
  - cargo test --test diplomacy: EXIT 101 na commicie (ten sam błąd kompilacji co clippy); z tymczasową poprawką poza allowlistą: EXIT 0, 32 passed.
  Zmienne: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo.
BLOKADY:
  1. Poza allowlistą: rust-port/engine/tests/diplomacy.rs:70 tworzy TickContext bez `..Default::default()`. Dodanie pola common_border_delta łamie kompilację testu `diplomacy` i clippy --all-targets. Potrzebna jedna linia w tym pliku: `common_border_delta: None,` po `common_border: true,` (zachowanie bez zmian: None = -2). Tymczasowo zastosowana tylko do weryfikacji, potem wycofana (plik nie jest w commicie). Wymagane: rozszerzenie allowlisty albo zgoda na tę linię, potem ponowne bramki.
  2. Push do origin wip-gałęzi został odrzucony przez classifier uprawnień (External System Writes); nie ponawiano. Gałąź istnieje tylko lokalnie w worktree.
  3. NIE_ZMIERZONO poza zakresem: zanik urazów, wygasanie traktatów, relacjaOgolna, stanWojny (jak w nagłówku testu).
RUNDY: 1/5 (Operator)
NASTĘPNY KROK: orkiestrator rozszerza allowlistę o rust-port/engine/tests/diplomacy.rs (jedna linia) albo wskazuje poprawkę w r2; potem Evaluator + Final Control dla kodu (SHA z gałęzi wip) i pełne bramki.
DEPLOY/PUSH: NIE WYKONANO (brak push do rust-port/parity-v2, brak integracji i deployu; push wip odrzucony)
