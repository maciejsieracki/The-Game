# DISPATCH R-RUSTPORT-P6-SLINGER-POKRYCIE-Q1 (runda 1) — zadania #164 i #163

TEMAT: (a) przywrócić pokrycie procarza (slingerRanged) w wektorach blow_full (spadło 4 → 1 po regeneracji); (b) podnieść próg asercji `lucznik_ranged` z 14 do 60 (zmierzone 69).
DOMENA: GAME (testy). BAZA: `c85e4e451` (czubek `origin/rust-port/parity-v2`). Worktree na `wip/R-RUSTPORT-P6-SLINGER-POKRYCIE-Q1`.
Pin (tylko odczyt): `git show 07d2fbd72:gra/src/game/combat.ts` i `battleScene.ts` — gałąź procarza (ranged).

## KROK 0 (obowiązkowy)
Uruchom `cargo test --test p6_siege_tactics_blow_full` na `c85e4e451`. Wypisz `slingerRanged` i `lucznikRanged` z `vectors.json`. Potwierdź asercję `lucznik_ranged >= 14` i brak asercji dla procarza.

## GOAL
(a) Generator `p6_siege_tactics_blow_full_gen.mjs` wymusza procarza w części przypadków, wzorem łuczników (szansa, bez zmiany innych gałęzi). Wektory regenerowane bajt-w-bajt z generatora. Pokrycie `slingerRanged >= 14` na 1200 wektorach.
(b) Asercja w `p6_siege_tactics_blow_full.rs`: `lucznik_ranged >= 60` oraz `slinger_ranged >= 14`. Nie osłabiać innych asercji.

## ALLOWLISTA
- `rust-port/engine/tests/p6_siege_tactics_blow_full_gen.mjs`
- `rust-port/engine/tests/p6_siege_tactics_blow_full_vectors/vectors.json` (tylko regeneracja)
- `rust-port/engine/tests/p6_siege_tactics_blow_full.rs` (tylko dwie asercje pokrycia)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SLINGER-POKRYCIE-Q1/01-operator-r1.md`
ZAKAZ: `src/**`, `gra/`, `Cargo.toml`, `Cargo.lock` (nie commitować).

## KRYTERIA KOŃCA
1. `slingerRanged >= 14` i `lucznikRanged >= 60` (liczby w raporcie).
2. Generator odtwarza vectors.json bajt-w-bajt.
3. Bramki EXIT 0: `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; `p6_siege_tactics_blow_full`; pełny `cargo test --no-fail-fast` (w tle, wynik z pliku). `CARGO_TARGET_DIR` poza repo, usuń po bramkach.
4. Brak `#[ignore]`, brak osłabionych asercji.

## NIE ROBIĆ
Zmian w `src/` (kod ma być bez zmian, zmienia się tylko pokrycie testu). Integracji, push do parity.

## RAPORT
`01-operator-r1.md`: STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH (NIE WYKONANO).
Commit BEZ linii `Co-Authored-By` z nazwą modelu. `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`. RUNDY: 1/5.
