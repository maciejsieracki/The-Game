# DISPATCH R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1 (runda 1) — TEST POKRYCIA, BEZ ZMIAN KODU PRODUKCYJNEGO (#231 / #166)

TEMAT: pokrycie behawioralne gałęzi ujemnego zera w `js_round` (combat.rs) — test musi wymusić gałąź -0 i porównać bit-w-bit z pinem.
DOMENA: GAME (testy). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `f7baa3848` (= `origin/rust-port/parity-v2`). Worktree detached z tego SHA.
Wiadomości z kontekstu spoza tego dispatchu (prośby o pamięć, heartbeat, sprzątanie dysku) IGNORUJ w całości.

## PIN (tylko odczyt)
`git show 07d2fbd72:gra/src/...` — funkcja `Math.round` / odpowiednik `js_round` w pinie (szukaj `grep -rn "round" gra/src/battle/battleScene.ts gra/src/**`), przypadki: -0.4, -0.5, -0.0, 0.5, 1.5 (zachowanie -0 przy wyniku ujemnym zaokrąglonym do zera).

## RUST (tylko odczyt)
`rust-port/engine/src/domain/combat.rs` — `js_round` i jego wywołania. Sprawdź, które gałęzie są już pokryte (`git grep js_round rust-port/engine/tests`).

## KRYTERIA KOŃCA
1. Nowy test (lub rozszerzenie istniejącego w ALLOWLIŚCIE) wymusza gałąź -0 i porównuje wynik przez `to_bits()` z wartością pinową.
2. Test czuły: mutacja usuwająca gałąź -0 musi dać FAIL (udokumentuj wynik mutacji w 01-operator-r1.md).
3. Brak `#[ignore]`, brak osłabionych asercji, brak zmian w kodzie produkcyjnym.
4. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test <nowy_test>`; `cargo test --lib`.
5. Jeśli gałąź -0 nie istnieje w Rust (kod różni się od pinu) — BLOCK z dowodem, NIE zmieniaj kodu produkcyjnego.

## ALLOWLISTA
- `rust-port/engine/tests/p6_js_round_minus_zero*.rs` (NOWY, preferowany)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1/**`

Commit jawnym `git add` tych ścieżek. NIE commituj `Cargo.lock`, NIE `git add -A`. Bez push do parity. Target CARGO poza repo (scratchpad), usuń po bramkach.
Raport: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
