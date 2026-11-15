# DISPATCH R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE (runda 1) — adapter mapy bitwy: `BattleSetupDto` → wejścia renderera (P4-1G / #235)

DOMENA: GRAFIKA / DTO renderera (mapa bitwy). MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `b90894920` (P4-1G Q1–Q3 zintegrowane; zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §3 (wiersze BattleSetupDto/BattleUnitsOpts/FortDto), §7 wiersz `R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE`.
DTO istnieje: `rust-port/view-model/src/battle.rs:119` (`BattleSetupDto`). Nie zmieniaj view-model.
Q1 (`view::*`, `to_int32` w `geom/js_num.rs`) jest zintegrowany — użyj, nie duplikuj. Q2 (teren) i Q3 (miasta) są zintegrowane — NIE dotykaj ich plików.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `BattleSetupDto` → `BattleUnitsOpts` (wejście renderera mapy bitwy).
2. `FortDto` → wejście fortu; `None` → `f64::INFINITY` (wg pinu; zweryfikuj plik:linia w `battleScene.ts`/`main.ts`).
3. Wartości pól zgodnie z pinem; brakujące dane w DTO → błąd adaptera (nie domyślna wartość), chyba że pin ma fallback — wtedy zapisz to w raporcie.

## WEKTORY / TESTY (`rust-port/renderer/tests/view_adapter_battle.rs`, NOWY)
- Fixture z wartościami oczekiwanymi z pinu (cytat plik:linia każdej wartości).
- `None` fortu → `INFINITY`; fort obecny → wartości 1:1.
- Mutacje (MUSZĄ dać FAIL): `None` → `0.0`; pominięcie pola fortu; zamiana stron w `BattleUnitsOpts`.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/renderer/src/view/battle.rs` (NOWY)
- `rust-port/renderer/src/view.rs` (TYLKO `pub mod battle;` i reeksporty)
- `rust-port/renderer/tests/view_adapter_battle.rs` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
