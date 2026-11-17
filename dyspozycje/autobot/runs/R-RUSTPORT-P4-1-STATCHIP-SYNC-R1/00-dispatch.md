# R-RUSTPORT-P4-1-STATCHIP-SYNC-R1 — StatChipUiState ↔ MapUiState i numery linii pinu (#324/#333, #325/#355)

STATUS: dispatch orkiestratora. Opus (renderer). Operator/Obrona Opus; Evaluator/FC Sonnet. Porządki po integracji Q5 i R5.
BAZA: `origin/rust-port/parity-v2` = `c120f2373` (sprawdź SHA parity przed startem).

## GOAL
1. Ujednolicić `StatChipUiState` z `MapUiState` (renderer): jeden model stanu UI nakładek, bez dwóch kopii. Stan i uwagi są w `REJESTR-RUST.md` (wpis R5, notatka „StatChipUiState to …”, ~linia 2820) — przeczytaj i zastosuj.
2. Poprawić numery linii pinu w komentarzach R5: `cities.ts:888/928/740`, `main.ts:2988` (wpis #325) oraz w dokumencie `P4-1G-ADAPTER-ROZPOZNANIE` (#355). Numery zweryfikuj na `07d2fbd72` (`git show 07d2fbd72:gra/src/render/cities.ts | sed -n '888p'` itd.) — przepisz tylko te, które są błędne.

## ZAKRES
- `renderer/src/cities/sync/stat_chips.rs` i `renderer/src/view/` — zamiana `StatChipUiState` na `MapUiState` (jeden typ), bez zmiany zachowania.
- Komentarze: tylko numery linii; żadnej zmiany logiki.
- Test `renderer/tests/cities_sync_stat_chips.rs` (11 testów R5) MUSI pozostać zielony bez zmiany asercji.

## ALLOWLISTA
`rust-port/renderer/src/cities/sync/stat_chips.rs`, `rust-port/renderer/src/view/`, `rust-port/renderer/src/` (tylko typ UI), `dyspozycje/rust-port/P4-1G-ADAPTER-ROZPOZNANIE*` (tylko numery linii), katalog runs. Nic więcej.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test cities_sync_stat_chips`, `cargo test --all-targets --no-fail-fast` (renderer).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usuń po bramkach. DYSK ≥ 12 GB przed bramką pełną.

## KRYTERIA KOŃCA
Zielone bramki, 11/11 testów R5 bez zmiany asercji, commit jawnym `git add`, bez `Cargo.lock`, trailer bez nazwy modelu (#289). Raport `01-operator-r1.md`. Nie pushować do parity.
