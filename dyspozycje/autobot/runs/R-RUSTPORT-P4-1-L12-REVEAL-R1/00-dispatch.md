# R-RUSTPORT-P4-1-L12-REVEAL-R1 — revealAllLand i riverRevealKeys w DTO mapy (PRIO-3D-11, #279/#337)

STATUS: dispatch orkiestratora. Opus (3D). Operator/Obrona Opus; Evaluator/FC Sonnet.
ZALEŻNOŚĆ: SPEŁNIONA. FOG-VIEW zintegrowany na `parity-v2` (`82db9b370`, FF 2026-11-17); F2 TERRITORY-RANGES zintegrowany (`1db08c170`).
BAZA: `origin/rust-port/parity-v2` = `1db08c170` (DODATEK r1, 2026-11-17). Przed startem: `git fetch origin && git checkout -B <gałąź> 1db08c170`.

## GOAL
Dodać do DTO mapy pola `revealAllLand` i `riverRevealKeys` (dziś brak w `MapViewDto`/`FogViewDto` jako producenta).
Web (pin `07d2fbd72`):
- `gra/src/game/visibility.ts:244-250` — `exploredSetForRender(explored, revealAllLand)`: bez `revealAllLand` kopia `explored`;
- `gra/src/main.ts:12804` — `revealAllLand` (dev/test, przełącznik M), `:13595` (`if (revealAllLand) fogOn = true`);
- `gra/src/render/scene.ts:1263-1264` — `rzeka_krawedzie` (klucze krawędzi rzek ujawnianych).
Stan Rust: `engine/src/domain/state.rs:1028-1034` ma już `reveal_all_land` w `explored_set_for_render`; brakuje wyprowadzenia do DTO i `riverRevealKeys`.

## ZAKRES
1. Dodać pola do DTO mapy (view-model) i producenta w adapterze (po FOG-VIEW: `FogViewDto` ma już mgłę ME()).
2. `riverRevealKeys` z web `scene.ts:1263-1264` — wyprowadzić z `rzeka_krawedzie` (tylko klucze krawędzi ujawnianych, zgodnie z komentarzem w pinie).
3. Test `renderer/tests/reveal_l12.rs`: wektory z pinu (generator `.mjs`) dla `revealAllLand` true/false i zbioru `riverRevealKeys`.
4. Mutacje FAIL: (a) `revealAllLand` ignorowane; (b) `riverRevealKeys` puste; (c) kopia `explored` zamiast widoku.

## ALLOWLISTA
`rust-port/view-model/src/map.rs` (pola), adapter mapy w `rust-port/renderer/src/view/`, `rust-port/renderer/tests/reveal_l12.rs`, generator `.mjs`, katalog runs.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test reveal_l12`, `cargo test --all-targets --no-fail-fast` (view-model i renderer).
Env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, usuń po bramkach. DYSK ≥ 12 GB przed bramką pełną.

## KRYTERIA KOŃCA
DODATEK r1: commity bez linii `Co-Authored-By` z nazwą modelu (orkiestrator usunął je w F2; reguła #289 i zasady sesji). Jeżeli narzędzie dołączy trailer, usuń go przed commitem.
Zielone bramki, mutacje FAIL, commit jawnym `git add`, bez `Cargo.lock`, trailer bez nazwy modelu (#289). Raport `01-operator-r1.md`. Nie pushować do parity.
