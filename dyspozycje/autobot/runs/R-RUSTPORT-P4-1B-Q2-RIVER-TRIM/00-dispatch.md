# DISPATCH R-RUSTPORT-P4-1B-Q2-RIVER-TRIM (runda 1) — `trim_medium_tail_along_main` i `trim_medium_render_path_at_main` (P4-1B / #211)

DOMENA: GAME, DTO renderera → MODEL OPUS we wszystkich rolach.
BAZA (jedyna obowiązująca): `1b8b67173` (= `origin/rust-port/parity-v2`). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md` §3 „P4-1B-Q2” (odczytaj OBOWIĄZKOWO).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
- Port 1:1 `gen-helpers.ts:7623-7634` (`trimMediumTailAlongMain`) i `:8194-8203` (`trimMediumRenderPathAtMain`, eksportowana) do modułu rzek.
- `trim_medium_tail_along_main` jako `pub(crate)` — przyszły `finalizeMediumPath` (M07C, `rivers_c.rs`) też go użyje.
- NIE dotykaj `rivers_c.rs` (właściciel M07C).

## WEKTORY (generator na pinie)
- Generator `gen.mjs` wołający `trimMediumRenderPathAtMain` na pinie.
- Przypadki: `len < 3`; pusty `mainPaths`; ogon 0/1/2/≥3 heksów na `main`; tylko ostatni na `main`; tylko przedostatni na `main`; ścieżka cała na `main` (zostają 2 heksy); duplikaty w `mainPaths`.
- ≥ 150 wektorów, w tym ≥ 50 z faktycznym przycięciem.
- Strażnik SHA-256 wyciętych fragmentów pinu.
- Mutacja: warunek `&&` → `||` i próg `3` → `2` MUSZĄ dać FAIL.

## KRYTERIA KOŃCA
1. `rivers_a/render_trim.rs` (NOWY) z obiema funkcjami 1:1; `pub mod` / `pub use` (jedna linia) w `rivers_a.rs`.
2. Test `p4_1b_river_trim.rs` z wektorami; mutacje z pkt wyżej dają FAIL.
3. Bramki EXIT 0: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p4_1b_river_trim`, `cargo test --lib`.
4. Brak `#[ignore]`, brak osłabionych asercji. Brak wołającego produkcyjnego: zapisz jako NIE_ZMIERZONO (wołający w Q3).

## ALLOWLISTA (wyłącznie)
- `rust-port/engine/src/domain/mapgen/rivers_a/render_trim.rs` (NOWY)
- `rust-port/engine/src/domain/mapgen/rivers_a.rs` (jedna linia `pub mod` / `pub use`)
- `rust-port/engine/tests/p4_1b_river_trim.rs` (NOWY)
- `rust-port/engine/tests/p4_1b_river_trim_vectors/` (NOWY: `gen.mjs`, `vectors.json`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q2-RIVER-TRIM/**`

Commit jawnym `git add`. NIE commituj `Cargo.lock`. NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
