# DISPATCH R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0 (runda 1) — pola stanu doktryny w `ProdUnit` (T0 z rozpoznania #112)

DOMENA: GAME (struktura stanu jednostki bitwy oblężniczej, bez zmiany zachowania). MODEL: OPERATOR HAIKU, OBRONA HAIKU, EVALUATOR SONNET, FINAL CONTROL SONNET.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `1a4982574` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5LOOP-DOCTRINA-ROZP-Q1/01-rozpoznanie.md` §5 (T0, fala 1) oraz wpis F4 w §2 (lista pól stanu, których `ProdUnit` nie ma).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## CEL
Dodać do `ProdUnit` (`rust-port/engine/src/domain/siege_tactics_loop.rs:736`) pola stanu wymagane przez przyszłe ciała doktryny (T1–T9): `unitDoctrine`, `groupId`, `rangedKite`, `shootingEnabled`, `dryCol`, `heldAfterFallback`, `lastAutoMoveFrom`, `antiCavSpear`, `mounted`, wejścia preferencji celów (domyślnie „brak”). Dodać czystą funkcję `_forwardCol` (pin `battleScene.ts:6748`, C6 z rozpoznania). ZERO zmiany zachowania istniejących ścieżek.

## ZAKRES (co dokładnie)
1. Pola w `ProdUnit` i/lub w `ActivateUnit` (wybierz to, co minimalnie pasuje do istniejących konstruktorów). Typy: `Option<…>` lub wartości domyślne zgodne z pinem (`unitDoctrine: null` → `None`, `groupId: null` → `None`, `shootingEnabled` domyślnie `true`, bo pin sprawdza `!== false`).
2. Nowy moduł `rust-port/engine/src/domain/siege_tactics_doctrine_state.rs`: typ `GroupDoctrine` (pin `battleScene.ts:1938`: defensive/steady/aggressive/skirmish/manual) i funkcja `_forwardCol` (pin 6748) jako czysta funkcja z wektorami.
3. Konstruktory `ProdUnit` w testach dostosowane do nowych pól (wartości domyślne, bez zmiany oczekiwanych wyników).
4. Każdą nową wartość domyślną podpisz komentarzem z plik:linia pinu.

## NIE ROBIĆ
- Żadnej zmiany logiki `ProdBody`, `ProdOps`, `activate_unit` ani maszyny K5H. Pola mają być tylko czytane przez przyszłe tematy.
- Żadnego portu `_executeGroupDoctrineStep`, `_priorityScore`, `_cavalryAction` ani `_bestKiteShotStep` (to T2', T5a, T6, T4).
- Nie zmieniaj `gra/`.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (TYLKO struktura `ProdUnit`, konstruktory i ewentualny `use`)
- `rust-port/engine/src/domain/siege_tactics_doctrine_state.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (wyłącznie linia `pub mod siege_tactics_doctrine_state;`)
- `rust-port/engine/tests/p6_siege_tactics_loop_body*.rs` (dopasowanie konstruktorów)
- `rust-port/engine/tests/p6_k5doc_state*.rs` (NOWE, wektory `_forwardCol` i `GroupDoctrine`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0/**`

## WEKTORY
- `_forwardCol` (pin 6748): co najmniej 4 przypadki z plik:linia pinu (kierunek dodatni, ujemny, granica, zero).
- `GroupDoctrine`: pięć wariantów, parsowanie z napisu pina.
- Test domyślnych wartości nowych pól: `shootingEnabled == true`, `unitDoctrine == None`, `groupId == None` z komentarzem pinu.
- Mutacje (MUSZĄ dać FAIL): (a) `shootingEnabled` domyślnie `false`; (b) `_forwardCol` z odwróconym znakiem.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny test, nie wycinek). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
