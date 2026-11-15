# DISPATCH R-RUSTPORT-P4-1E-CITY-VIEW-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: P4-1E — producent widoku miast: `OwnerViewDto`, `CityViewDto`, `CityBadgeDto` (kontrakt P4-1-RENDER-DTO-CONTRACT §8, wiersz 1E).
MODEL: Operator (impl), Obrona, Evaluator, Final Control — wszystkie **Opus 5.5** (DTO renderera; zasada właściciela „wszystkie związane z opus 5,5").

ZASADA (CLAUDE.md zasada 11): NAJPIERW WEB. Pin `07d2fbd72`. Przed każdą decyzją gameplay czytasz web (`git show 07d2fbd72:gra/src/...`, `git grep`), dopiero potem Rust. Brak rozstrzygnięcia w webie = NIE_ZMIERZONO, nie zgaduj i nie pytaj.

GOAL: Moduł widoku miast w silniku: funkcja/funkcje czytające `PlayableState` (tylko odczyt) i zwracające typy z `civ-view-model` (crate `rust-port/view-model`, P4-1A, już na parity): `OwnerViewDto`, `CityViewDto`, `CityBadgeDto`. Źródła według kontraktu §8 1E: `format_city_map_label` (`rust-port/engine/src/domain/state.rs:1306`), `front_item` (`production_queue.rs:28`), `can_afford_building_stock` (`building_costs.rs:582`), `growthPercent` (`city_growth.rs`, web `population-growth-v85.ts:288`). Przed kodem potwierdź w webie, które pola `CityViewDto`/`CityBadgeDto` pochodzą z którego wyliczenia (pole → plik:linia webu). Typy DTO NIE są zmieniane — jeśli typ z kontraktu §3 czegoś brakuje, to BLOCK z opisem, nie edycja `view-model`.

BAZA: `origin/rust-port/parity-v2` = `a01363d5f`. Utwórz worktree z tej bazy (`git worktree add`, nie na gałęzi roboczej). Przed pracą: `git merge-base --is-ancestor a01363d5f HEAD`.

ALLOWLISTA (wszystko poza tym = FAIL):
- `rust-port/engine/src/domain/city_view.rs` — NOWY plik (nazwa dozwolona, zmiana wymaga zgody)
- `rust-port/engine/src/domain/mod.rs` — WYŁĄCZNIE dopisanie `pub mod city_view;` (w porządku alfabetycznym)
- `rust-port/engine/Cargo.toml` — WYŁĄCZNIE dopisanie jednej linii zależności: `civ-view-model = { path = "../view-model" }` (decyzja D-DTO-1=A: silnik zależy od view-model)
- `rust-port/engine/tests/view_city_*.rs` — NOWE pliki testów
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1E-CITY-VIEW-Q1/**`

ZERO ZMIAN W: `gra/**`, `rust-port/view-model/**`, `rust-port/renderer/**`, `src-tauri/**`, `rust-port/engine/src/bridge.rs`, `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/src/domain/save_load.rs`, `rust-port/engine/src/domain/state.rs` (tylko odczyt), `Cargo.lock` (zmieni się lokalnie po dodaniu zależności — NIE commitować).

BRAMKI (EXIT 0, czysty `CARGO_TARGET_DIR` poza repo, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`):
- `cargo fmt --check` w `rust-port/engine`
- `cargo clippy --all-targets -- -D warnings` w `rust-port/engine`
- `cargo test --all-targets` w `rust-port/engine` (pełny, bo zmiana zależności)
- `git diff --check`

KRYTERIA KOŃCA:
1. Funkcje producenta zwracają `CityViewDto`/`CityBadgeDto`/`OwnerViewDto` z wartościami zgodnymi z webem (każde pole z dowodem plik:linia webu w raporcie).
2. Testy: wektory z webu lub z pinu (nie ręczne liczby bez źródła), przypadki graniczne (brak kolejki produkcji, brak wzrostu, miasto bez budynków), round-trip JSON zwróconych typów.
3. Brak `#[ignore]`, brak osłabionych asercji, `forbid(unsafe_code)` nienaruszone.
4. Test mutacji: zmiana jednego wyliczenia w producencie musi wywołać FAIL (udokumentowane w raporcie).
5. Każdy NIE_ZMIERZONO jawnie w raporcie.

PROCES: Operator (impl) → Evaluator → (Obrona jeśli zarzuty) → Final Control. Commit z jawnym `git add` (nigdy `-A`). Bez push na parity, bez deployu, bez integracji. Commit bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
