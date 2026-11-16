# DISPATCH R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1 (runda 1) — wektory pinu dla AUTO bez oblężenia: V5, V6, V15, V16 (#118)

DOMENA: GAME (bitwa, tryb AUTO bez oblężenia). MODEL: HAIKU (Operator), SONNET (Evaluator, Final Control), HAIKU (Obrona) — silnik gry, reguła projektu.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `b3c0b2209` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/autobot/runs/R-RUSTPORT-P6-AUTO-SCOPE-ROZP-Q1/01-rozpoznanie.md` (tabela V1–V16 i §„Kolejność”, pkt 1: „Wektory V1, V5, V6 można napisać od razu”), zakres po korekcie Obrony #234 (`c19ac8b17`).
Kod: moduł K5G (`rust-port/engine/src/domain/siege_tactics_*`, faza wsadowa `autoBatchPhase`), istniejący test K5G.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES (TYLKO te cztery wektory)
- **V5** `auto-batch-zakonczenie-tury` — `_finishAutoBatchPhase` (pin `battleScene.ts:5961`) + `_checkEnd`: atakujący wygrywa w fazie atakującego.
- **V6** `auto-batch-halt-token` — `_haltAutoBattleTurn` (pin `battleScene.ts:17333`): przerwanie w połowie fali, spóźniony callback nie zmienia stanu.
- **V15** (NOWY, z rozpoznania §„Testy”) — `_executeQueuedOrders` (pin `battleScene.ts:3603`): kolejka rozkazów wykonywana w kolejności wstawienia.
- **V16** (NOWY) — `_ffEnterAuto` (pin `battleScene.ts:3709`): wejście w tryb AUTO przy przewijaniu.

NIE w zakresie (zostają w kolejce, NIE_ZMIERZONO): V1, V2 (zależą od #112 — doktryna, pin `:6091-6097`), V7–V8 (#112, #148), V9–V13 (#109/#147), tryb ręczny `_toggleManualMode` (`:17348`) i `_performPlayerOrder` (`:18280`) — brak tematu w kolejce; zgłoś jako lukę, nie portuj.

## WYMAGANIA
1. Wartości oczekiwane z pinu wyciągnięte przez generator (`git show 07d2fbd72:gra/src/battle/battleScene.ts` lub uruchomienie w środowisku TS, jeśli dostępne), z plik:linia przy każdym przypadku. Strażnik SHA-256 wyciętych fragmentów pinu.
2. Każdy wektor porównuje wynik portu Rust z wartością pinu. Port istnieje — NIE zmieniaj kodu źródłowego.
3. Jeśli port różni się od pinu: **BLOCK** z dowodem (plik:linia pinu, wartość oczekiwana, wartość Rust). NIE poprawiaj kodu źródłowego (allowlista).
4. Mutacje (MUSZĄ dać FAIL): (a) przerwanie fali ignorowane (V6); (b) kolejność rozkazów odwrócona (V15); (c) wejście AUTO bez przewijania (V16).

## KRYTERIA KOŃCA
1. Cztery grupy wektorów zielone (lub BLOCK z dowodem), mutacje FAIL, wyniki w raporcie.
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` (pełny test, nie wycinek). Kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian w `src/`.

## ALLOWLISTA
- `rust-port/engine/tests/p6_k5_auto_vectors*.rs` (NOWE)
- `rust-port/engine/tests/p6_k5_auto_vectors/**` (NOWE: generator i wektory, jeśli potrzebne)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5-AUTO-WEKTORY-Q1/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
