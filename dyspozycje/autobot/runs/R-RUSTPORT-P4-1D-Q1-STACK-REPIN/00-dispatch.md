# DISPATCH R-RUSTPORT-P4-1D-Q1-STACK-REPIN (runda 1) — reprezentant stosu i `StackVitals.has_commander` na `@07` (P4-1D / #213)

DOMENA: GAME, DTO renderera (stosy). MODEL: OPUS we wszystkich rolach.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1D-UNIT-ROZPOZNANIE.md` §3 „P4-1D-Q1” (OBOWIĄZKOWO) oraz §1 wiersze o `army_merge` (recruitment.rs:691-713, :727-738).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
- `pick_stack_representative` → reguła `pickStackLeader` z pinu (pula bojowa, gdy niepusta; cywil nie zostaje reprezentantem, gdy w stosie jest jednostka bojowa).
- `StosJednostka` + pole `category: String` i `is_general: Option<bool>` (web `isGeneral?`).
- `StackVitals.has_commander` = `stack.any(is_general == Some(true))`.
- Aktualizacja odwołań linii do pinu `@07`.
- Literały `StosJednostka { ... }` w `engine/src` i `engine/tests`: TYLKO mechaniczne dopisanie nowych pól (wyliczona lista w raporcie, NIE_ZMIERZONO liczby do policzenia przed startem przez `git grep "StosJednostka {"`).

## WEKTORY (`@07`, z uruchomionego webu/pinu)
Generator `gen.mjs` wykonujący `stack-leader.ts` i `armyMerge.ts::computeStackDisplay/stackVitals` z pinu, strażnik SHA-256 wyciętych fragmentów. Przypadki: stos sam cywilny; cywil z wyższym atakiem niż bojowy (cywil NIE jest reprezentantem); remis ataku z porównaniem id w UTF-16; `hasCommander` true/false/undefined; garnizon i pole na tym samym heksie; jawny `stackGroupId` na dwóch heksach. Stare wektory `edb8fb56` zostają dla przypadków niezmienionych (diff = 0).

## KRYTERIA KOŃCA
1. Reprezentant i `has_commander` zgodne z pinem `@07` we wszystkich wektorach nowych i starych.
2. Mutacja „cywil jako reprezentant” daje FAIL.
3. Bramki EXIT 0: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --lib`, `cargo test --test p6_5a_display`, nowy test wektorów.
4. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą (poza mechanicznymi literałami z listy).

## ALLOWLISTA
- `rust-port/engine/src/domain/recruitment.rs` (wyłącznie moduł `army_merge`)
- `rust-port/engine/tests/p6_5a_display.rs`
- `rust-port/engine/tests/p6_5a_vectors/**` (NOWE: `gen.mjs`, `vectors.json`)
- mechaniczne literały `StosJednostka {` w `rust-port/engine/src` i `rust-port/engine/tests` (lista w raporcie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1D-Q1-STACK-REPIN/**`

Commit jawnym `git add`. NIE commituj `Cargo.lock`. NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
