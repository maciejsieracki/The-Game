# R-RUSTPORT-P4-1-L12-REVEAL-R1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-L12-REVEAL-R1
GOAL: `revealAllLand` i `riverRevealKeys` w DTO mapy (luki L1/L2) + adapter renderera + wektory pinu `07d2fbd72`.
BAZA: `1db08c170` (`origin/rust-port/parity-v2`, DODATEK r1). Gałąź robocza: `rust-port-wip/R-RUSTPORT-P4-1-L12-REVEAL-R1`.
ZMIANY/COMMIT: kod `06f3b6ce1` (raport: commit następny na tej gałęzi).
- `rust-port/view-model/src/map.rs` — nowy `FogRevealDto { reveal_all_land: bool, river_reveal_keys: Option<Vec<HexCoord>> }` (camelCase, `deny_unknown_fields`).
- `rust-port/renderer/src/view/fog.rs` — `FogReveal` (+ `FogRevealError`): `from_dto(map, &FogSets, &FogRevealDto)`, `show_ocean_backdrop`, `river_fog_active`; dokumentacja modułu.
- `rust-port/renderer/src/view/terrain.rs` — tylko komentarze (L1/L2 nie są już „poza DTO”).
- `rust-port/renderer/tests/reveal_l12.rs`, `reveal_l12_gen.mjs`, `reveal_l12_vectors/vectors.json` (28 scenariuszy).
- `Cargo.lock` nie commitowany (przywrócony). Commit jawnym `git add`, trailer bez nazwy modelu (#289).

## Co wynika z pinu (web najpierw)

| Element | Pin `07d2fbd72` | Rust |
|---|---|---|
| `revealAllLand` → `exploredForRender` | `main.ts:12864-12866`, `visibility.ts:241-251` (lądem jest wszystko poza `Morze`, `:215-226`) | już w producencie `refresh_fog` (`engine/.../state.rs`, FOG-VIEW) → kody `fog.state` |
| `useFogRender = fogOn \|\| revealAllLand` | `main.ts:13485` | `ViewerDto.fog_active` (FOG-VIEW) |
| opcja `landReveal` | `main.ts:13491-13492`; `scene.ts:3532` (`?? false`), `:3548` (tło oceanu), `:3654` (`lastAnyHidden` = mgła rzek) | `FogRevealDto.reveal_all_land` → `FogReveal::land_reveal`, `show_ocean_backdrop`, `river_fog_active` |
| `riverRevealKeys` | `main.ts:13493` = `startRevealKeysForRiverFog()` (`:13074-13080`): krąg startu `computeVisibleAt(...)` gdy `ME()` nie ma jeszcze miasta, inaczej `undefined`; `scene.ts:3531` (`?? null`), `:3431-3433`, `riverLod.ts:359-377` | `FogRevealDto.river_reveal_keys` → `FogReveal::river_reveal_keys` (`Option<HashSet<"q,r">>`, wejście `merged_river_visible_in_fog`) |
| gałąź bez mgły | `setFog(ALL_KEYS, ALL_KEYS)` bez opcji (`main.ts:13506`) | adapter: `land_reveal = false`, klucze `None` niezależnie od DTO |

**Odstępstwo od tekstu dispatchu (techniczne, wg zasady 11 „web najpierw”):** dispatch pkt 2 każe wyprowadzić `riverRevealKeys` z `rzeka_krawedzie`. Pin mówi inaczej: `scene.ts:1263-1264` — „hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce”, a jedyne źródło `riverRevealKeys` to `startRevealKeysForRiverFog()` (`main.ts:13074-13080`). Zaimplementowano wg pinu. Do wpisu orkiestratora w `REJESTR-RUST.md`.

## Decyzje techniczne (do REJESTR-RUST.md)

- Z-L12-1: osobna struktura `FogRevealDto` w `map.rs`, nie nowe pola w `FogViewDto`/`MapViewDto`. Powód: `FogViewDto { state }` jest budowany literałem w 9 miejscach poza allowlistą (`engine/src/domain/state.rs:1432`, testy `view-model` i `renderer`), a `MapViewDto` jest statyczny (raz na start, D-DTO-3 = B), podczas gdy obie wartości zmieniają się przy każdym `refreshFog`. Wpięcie do `RenderLayersDto` (`view-model/src/root.rs`) — poza allowlistą, patrz BLOKADY.
- Z-L12-2: `river_reveal_keys` w DTO = wartość `startRevealKeysForRiverFog()` w porządku kontraktu (`r`-major, `q`-minor); `Some(vec![])` ≠ `None` (pusty `Set` w JS jest prawdziwy).
- Z-L12-3: adapter odrzuca sprzeczności zamiast zgadywać: `RevealWithoutFog` (`reveal_all_land` przy `fog_active == false`, niemożliwe w pinie), `RevealNotApplied` (heks nie-`Morze` nieodkryty przy `reveal_all_land` = producent wysłał surowe `explored`), `RiverKeyOutsideMap`.
- Z-L12-4: `river_fog_active` i `show_ocean_backdrop` w adapterze odwzorowują `scene.ts:3548/3629/3654`; w Rust nie ma jeszcze sceny rzek z `lastAnyHidden`, więc to jest jedyne miejsce tej reguły.

## TESTY (EXIT kody, env: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

- `view-model`: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --all-targets --no-fail-fast` EXIT 0 (wszystkie zestawy ok).
- `renderer`: `cargo fmt --check` EXIT 0; `cargo clippy --all-targets -- -D warnings` EXIT 0; `cargo test --test reveal_l12` EXIT 0 (7/7); `cargo test --all-targets --no-fail-fast` EXIT 0 — 80 zestawów, 687 passed, 0 failed, 0 ignored.
- Generator: `node rust-port/renderer/tests/reveal_l12_gen.mjs --check` → `reveal_l12 vectors OK (28 scenarios)`; SHA-256 wycinków pinu w `sources`.
- Pokrycie wektorów (asercje w teście): `landReveal` 12/28, `riverRevealKeys != null` 15/28, kopia `explored` odrzucona 10/28, gałąź bez opcji (`nargs == 2`) 3/28, rzeki 307 wpisów (247 widocznych / 60 ukrytych), w tym ≥ 5 rozstrzyganych wyłącznie przez `riverRevealKeys`.
- `git diff --check` czysty. Dysk przed bramką pełną: 17 GB wolne.

## Mutacje (skrypt w scratchpadzie, `fog.rs` przywracany po każdej; po serii `cmp` = identyczny)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a) `revealAllLand` ignorowane | `land_reveal: dto.reveal_all_land` → `false` | FAIL: `reveal_matches_pinned_web_vectors` (`:132` landReveal), `reveal_requires_every_non_sea_hex_explored` |
| (b) `riverRevealKeys` puste | `river_reveal_keys` → `Some(HashSet::new())` | FAIL: `reveal_matches_pinned_web_vectors` (`:139` riverRevealKeys) |
| (c) kopia `explored` zamiast widoku | wyłączona kontrola `RevealNotApplied` | FAIL: `reveal_matches_pinned_web_vectors` (`:206` explored copy), `reveal_requires_every_non_sea_hex_explored` |

## BLOKADY / uwagi dla Evaluatora

1. Producent `FogRevealDto` po stronie silnika (`engine/src/domain/state.rs`, moduł `visibility::fog_view`: `reveal_all_land` z `FogViewInputs` + `startRevealKeysForRiverFog` = `compute_visible_at` przy `isAwaitingFirstPlayerCity`) — POZA allowlistą; zostawione do osobnego tematu. `FogViewInputs` nie niesie dziś `isAwaitingFirstPlayerCity`.
2. Wpięcie `FogRevealDto` do `RenderLayersDto` (`view-model/src/root.rs`, fikstury JSON) — POZA allowlistą; dziś typ jest dostępny jako `civ_view_model::map::FogRevealDto` (bez re-eksportu w `lib.rs`, też poza allowlistą).
3. Rozbieżność dispatch vs pin co do `rzeka_krawedzie` — opisana wyżej; decyzja techniczna orkiestratora.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (Sonnet): odtworzyć bramki i mutacje (a)/(b)/(c), sprawdzić wycinki pinu w generatorze (`--check`), ocenić Z-L12-1 i odstępstwo od pkt 2 dispatchu.
DEPLOY/PUSH: NIE WYKONANO
