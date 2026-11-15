# 02 — Evaluator (adwersarialny), runda 1 — R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN
GOAL: adapter terenu `MapViewDto`/`HexDynDto`/`FogSets` → `TerrainInput`, `MapHex`, `OverlayMap`, `OkolicaMap`, `TileYield`, mgła terenu (dispatch `00-dispatch.md`, runda 1)
ZMIANY/COMMIT: oceniany commit Operatora `3463c909a7c911528a376f658828936e9a94ea49` (gałąź lokalna `wip/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN-op-r1`), rodzic = baza `601ff304c` (`origin/rust-port/parity-v2`, zgodnie z dispatchem). Ten raport: jedyny plik dodany przez Evaluatora.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO

## 1. Allowlista (git diff --stat 601ff304c 3463c909a)

| Plik | Zmiana | Allowlista |
|---|---|---|
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN/01-operator-r1.md` | +74 | tak |
| `rust-port/renderer/src/view.rs` | +5 (`pub mod terrain;` + `pub use terrain::{…}`) | tak (tylko deklaracja i reeksporty — sprawdzone w diffie) |
| `rust-port/renderer/src/view/terrain.rs` | +272, nowy | tak |
| `rust-port/renderer/tests/view_adapter_terrain.rs` | +503, nowy | tak |

Brak zmian w `view-model`, `Cargo.toml`, `Cargo.lock`, `gra/`. Jeden commit nad bazą.

## 2. Bramki odtworzone przez Evaluatora (`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

| Bramka | EXIT | Wynik |
|---|---|---|
| `cargo fmt --check` | 0 | — |
| `cargo clippy --all-targets -- -D warnings` | 0 | bez ostrzeżeń |
| `cargo test --all-targets --no-fail-fast` | 0 | 65 zestawów, 518 passed, 0 failed, 0 ignored (zgodne z raportem Operatora) |
| `cargo test --lib` | 0 | 109 passed, 0 failed, 0 ignored |
| `cargo test --test view_adapter_terrain` | 0 | 16 passed |

`#[ignore]` w `src/view/**` i w nowym teście: brak (grep pusty). Osłabionych asercji nie znalazłem: wszystkie porównania są `assert_eq!` na pełnych strukturach/zbiorach (`MapHex`, `TerrainHex`, `HashSet`), bez `>=`/`is_some`.

## 3. Mutacje odtworzone przez Evaluatora (każda na kopii `src/view/terrain.rs`, plik przywrócony i sprawdzony `cmp`)

| Mutacja | EXIT | Testy czerwone |
|---|---|---|
| M1 pominięcie cudów w `solid_hidden_hexes` | 101 | 4 (`map_hexes_fog_off`, `map_hexes_full_fixture`, `solid_hidden_covers_…`, `solid_hidden_wonder_without_city`) |
| M2 `terraces: false` | 101 | 3 |
| M3 `seed: map.seed as i32` | 101 | 1 (`seed_goes_through_to_int32`) |
| M4 `covering_improvement` zawsze puste | 101 | 1 (`okolica_covering_improvement_only_where_set`) |
| M5 (dodatkowa) pominięcie ruin cudów | 101 | 4 |
| M6 (dodatkowa) `land_reveal` zawsze `false` | 101 | 1 (`apply_terrain_fog_matches_set_fog`) |
| M7 (dodatkowa) `OverlayMap.seed` po `to_int32` zamiast surowej liczby | 101 | 1 (`overlay_map_terrain_and_raw_seed`) |
| M8 (dodatkowa) pominięcie miast w `solid_hidden` | 101 | 3 |

Po mutacjach `git status` czysty (poza `Cargo.lock` regenerowanym przez cargo — przywrócony `git checkout`, nie commitowany).

## 4. Weryfikacja względem pinu `07d2fbd72`

- Wektory `seed` sprawdzone w Node (semantyka JS, nie ręcznie): `(2**32+5)|0 = 5`, `-1.5|0 = -1`, `NaN|0 = 0`, `2147483648|0 = -2147483648`, `-2147483649|0 = 2147483647` — zgodne z testem.
- `main.ts:4311-4313` `reapplyWonderHexDecorHides`: iteruje wszystkie `placedWorldWonders` (ruiny włącznie) — zgodne z `solid_hidden_hexes`.
- `main.ts:16209-16212` `reapplyCityHexDecorHides`: wszystkie miasta — zgodne. `cities` w pinie nie kurczy się (komentarz `main.ts:43517`), `placedWorldWonders` nie jest filtrowane, a `decorHiddenHexKeys` nie ma operacji odkrycia (`scene.ts:3145-3174`) — więc wyliczenie z bieżącego snapshotu nie gubi ukryć miast/cudów.
- `main.ts:5264` `hideDecorAtHex` dla placu budowy cudu — L5, poprawnie NIE wymyślone, komentarz w kodzie obecny.
- `main.ts:13485-13514` `refreshFog`: `useFogRender = fogOn || revealAllLand`, `setFog(vis, explored, {landReveal, riverRevealKeys})` / `setFog(ALL_KEYS, ALL_KEYS)` — zgodne z dokumentacją `apply_terrain_fog`. `scene.ts:3532-3548`, `:3643-3655`: `landReveal` wpływa tylko na `showOceanBackdrop`, `lastAnyHidden` i `applyZoomLodDecor`, wszystkie przez `anyHidden && !landReveal` — przy braku ukrytych heksów (mgła wyłączona) wynik niezależny od `land_reveal`, co test `apply_terrain_fog_off_is_all_keys` sprawdza równością całej sceny.
- `scene.ts:2465-2469` (tarasy tylko dla `Wzgorza`), `:3373-3376` (`styledDecor` → `solids_visible`) — zgodne.
- `scene.ts:2041` LCG używa `map.seed` bez `|0`, ale tylko przez `Math.imul` (wewnętrzny ToInt32) — `i32` w `TerrainInput` nie jest stratny. Bez zarzutu.

## 5. Odchylenie Operatora od dosłownego brzmienia dispatchu (`HexDynDto.nakladka` nieużyte)

Sprawdzone: przyjmuję. Dispatch pkt 2 wymienia `nakladka`, ale §7 dokumentu rozpoznania (wiersz Q2) definiuje `solid_hidden` wyłącznie „z `cities[]`/`wonders[]`”. W pinie ukrycia niezależne od miast/cudów są zdarzeniowe (wycinka: `main.ts:16801`, `:17014`, `:42967`; ulepszenia: `syncImprovementDecorForHex` `:16877-16946`) i nie da się ich odtworzyć z końcowego stanu `nakladka` bez reguł gry. Wywiedzenie ich w adapterze byłoby wymyślaniem — słusznie zapisane jako NIE_ZMIERZONO.

## 6. Zarzuty (ponumerowane; żaden nie blokuje PASS — uwagi do decyzji orkiestratora)

1. **Brak wołającego w Rust i brak jawnie zapisanej zależności.** `terrain_data`, `map_hexes`, `overlay_map`, `okolica_map`, `tile_yield`, `apply_terrain_fog`, `terrain_scene_options` są wołane wyłącznie z `tests/view_adapter_terrain.rs` (grep po `src/`: zero trafień poza `view/terrain.rs` i reeksportem). Konsumentem ma być nieistniejący integrator sceny (dokument rozpoznania §4, R1/R2), nie W8 — ale ani `view.rs`, ani `view/terrain.rs` nie zapisują tej zależności. Do rejestru `NIEPODPIETE-MODULY` / REJESTR-RUST: „adapter Q2 bez wołającego do czasu R1/R2”.
2. **Luka parytetu `solid_hidden` dla ukryć zdarzeniowych (wycinka lasu, `syncImprovementDecorForHex` — m.in. bryła wzgórza/góry pod ulepszeniem niezachowującym rzeźby).** Po zintegrowaniu renderer pokaże bryłę/dekor tam, gdzie pin ją chowa. Propozycja Operatora (pole `decor_hidden` w `HexDynDto` liczone przez producenta) jest rozsądna, ale to zmiana kontraktu DTO (poza allowlistą tego tematu) — wymaga osobnego tematu P4-1B/P4-1 i wpisu luki obok L5.
3. **Wektory testowe są ręcznie zbudowaną fixture (z odnośnikami plik:linia), nie wygenerowane z pinu.** Dla adaptera mapującego pola 1:1 i wymagań dispatchu („wartości oczekiwane z definicji pinu, zapisz źródło”) to wystarcza; jedyne wartości obliczeniowe (`seed`) zweryfikowałem w Node. Uwaga dla FC, nie zarzut blokujący.
4. **Drobne braki pokrycia (nieblokujące):** brak przypadku `RiverPathDto.kind = None` i rzeki z pustą listą heksów w teście `terrain_data`; brak kontroli zduplikowanych `coord` w `map.hexes` (dispatch tego nie wymaga; `OverlayMap.hexes` jako `HashMap` po cichu scaliłby duplikaty).
5. **L1/L2** (`revealAllLand`, `riverRevealKeys`) poprawnie zapisane jako NIE_ZMIERZONO; przypadek `fogOn=false ∧ revealAllLand=true` (`main.ts:13485`) jest niewyrażalny przez `FogSets::from_dto(…, fog_active)` — zależność od tematu #254 (P4-1 L1/L2). Bez zarzutu wobec Operatora.

## 7. Werdykt

PASS-WITH-NOTES. Kryteria końca dispatchu 1–4 spełnione i odtworzone niezależnie (bramki EXIT 0, 4 wymagane mutacje + 4 dodatkowe dają FAIL, L5 i L1/L2 jako NIE_ZMIERZONO, brak `#[ignore]`, zero zmian poza allowlistą). Zarzuty 1–2 do rejestru orkiestratora.

TESTY: jak w §2 i §3.
BLOKADY: brak blokujących; luki L1, L2, L5 i zarzut 2 jako NIE_ZMIERZONO.
NASTĘPNY KROK: Obrona Operatora → Final Control.
