# R-RUSTPORT-P4-1-R6-WIRING-R1 — produkcyjne wpięcie RevoltRenderer::sync (#331, audyt L6)

STATUS: dispatch orkiestratora (Opus: grafika renderera; Operator i Obrona Opus, Evaluator i FC Sonnet wg skryptu).
DOMAIN: GAME=nie (renderer, wpięcie DTO → renderer). Gameplay bez zmian.

## GOAL
Podpiąć `RevoltRenderer::sync` (bunt miasta, sprite buntu) do ścieżki, którą już idzie `CityRenderer::sync`,
tak jak web: `_syncRevolt` po `cityRenderer.sync(cities, ...)` z tym samym `cities[]` (pin `render/cities.ts:541,551,586,597-599`).
Obecny stan (`origin/rust-port/parity-v2` = `26e3666bd`): `RevoltRenderer::sync(&mut self, inputs: &RevoltInputs, cities: &CityRenderer)`
(`rust-port/renderer/src/cities/revolt/mod.rs:152`) nie ma żadnego produkcyjnego wołającego. Jedyny wołający
`CityRenderer::sync` przez adapter to `rust-port/renderer/src/view/cities.rs:349` (`CityViewDto::sync` → `renderer.sync(&self.cities, o)`).

## BAZA (absolutny priorytet)
- Baza: `origin/rust-port/parity-v2` = `26e3666bd`. Worktree świeży: `git worktree add --detach <ścieżka> 26e3666bd`.

## ZAKRES KODU (wykonawca NIE wybiera poza tym)
1. W `rust-port/renderer/src/view/cities.rs` dodać metodę na adapterze miast, obok `sync` (linia ~347):
   `pub fn sync_revolt(&self, renderer: &mut RevoltRenderer, cities: &CityRenderer)` która buduje
   `RevoltInputs::from_dto(&self.cities)` i woła `renderer.sync(&inputs, cities)`. Kolejność: najpierw `sync`, potem `sync_revolt`.
2. Test integracyjny w `rust-port/renderer/tests/` (nowy plik `revolt_wiring_r6.rs`): sekwencja `view.sync(&mut city_renderer)` → `view.sync_revolt(&mut revolt, &city_renderer)`
   dla dwóch miast, jednego w buncie; asercje: sprite istnieje dla miasta w buncie, znika po usunięciu miasta z listy,
   kolejność (sync_revolt przed sync → sprite nie powstaje, bo grupa miasta jeszcze nie istnieje).
3. Nie zmieniać logiki `RevoltRenderer` ani `CityRenderer`. Nie zmieniać `cities/mod.rs` (unia z R5 zachowana).

## ALLOWLISTA
`rust-port/renderer/src/view/cities.rs`, `rust-port/renderer/tests/revolt_wiring_r6.rs`,
katalog `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R6-WIRING-R1/`. Nic innego.

## BRAMKI (EXIT 0 każda)
Katalog `rust-port/renderer`. Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` POZA repo (usuń po bramkach).
1. `cargo fmt --check`
2. `cargo clippy --all-targets -- -D warnings`
3. `cargo test --test revolt_wiring_r6`
4. `cargo test --all-targets --no-fail-fast` (timeout 1700 s), zero FAILED/panicked.
Dyski: ≥ 12 GB przed bramką 4 (`df -h /`); przy niższym: BLOCK INFRA z liczbą GB.

## KRYTERIA KOŃCA
1. Diff tylko w allowliście; wszystkie 4 bramki EXIT 0; liczba `test result: ok`.
2. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`. Trailer bez nazwy modelu (#289).
3. Raport `01-operator-r1.md` z SHA, `diff --stat`, wynikami bramek.

## NIE WOLNO
- Nie pushować do `rust-port/parity-v2` (FF robi orkiestrator po FC). Nie dotykać `gra/`. Nie wyłączać testów.
