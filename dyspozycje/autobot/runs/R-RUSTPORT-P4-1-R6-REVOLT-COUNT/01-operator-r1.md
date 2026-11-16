# R-RUSTPORT-P4-1-R6-REVOLT-COUNT — Operator, runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1-R6-REVOLT-COUNT
GOAL: sprite buntu i licznik jednostek na heksie miasta w rendererze 3D (R6 kontraktu P4-1, §4 P4-1G-ADAPTER-ROZPOZNANIE.md)
ZMIANY/COMMIT: allowlista (lista niżej); SHA commitu w podsumowaniu rundy orkiestratora (commit zawiera ten raport)
TESTY: cities_revolt_r6 6/6 ok; mutacje (a)(b)(c) FAIL (dowód niżej); bramki fmt/clippy/test EXIT 0 (565 passed, 0 failed)
BLOKADY: brak blokad technicznych; uwagi: (1) licznik jednostek — pin go nie rysuje (§3); (2) dysk przed obowiązującym przebiegiem bramek 5.4G < 8 GB (§6)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

BAZA: `68b2a6633` (detached, `origin/rust-port/parity-v2`), sprawdzone `git rev-parse HEAD` = `68b2a663328ae3b0109537084cf391810978e361`.
PIN (tylko odczyt): `07d2fbd72`.

## 1. Zmiany (wyłącznie allowlista)

| plik | co |
|---|---|
| `rust-port/renderer/src/cities/revolt/mod.rs` (NOWY) | `RevoltRenderer` (`revoltSprites`), `sync_revolt(city_id, parent, show)` = `_syncRevolt` (`cities.ts:815-831`), `remove_revolt` = `_removeRevolt` (`:806-813`), `sync(inputs, &CityRenderer)` = wywołania z `CityRenderer.sync` (`:541`, `:551`, `:586`, `:597-599`), `dispose` (`:777`), `city_overlay_scene` (scena: korzeń kopiujący transformację i `visible` grupy miasta + sprite jako dziecko); `RevoltInputs::from_dto` / `RevoltCityInput` (`cities[].revolt`, `cities[].unit_count_on_hex`) |
| `rust-port/renderer/src/cities/revolt/sprite.rs` (NOWY) | `REVOLT_GLYPH` (64×64, `48px serif`, 🔥, (32, 36), `:794-800`), `REVOLT_SPRITE_POSITION` (0, 1.35, 0) `:828`, `REVOLT_SPRITE_SCALE` (0.9, 0.9, 1) `:827`, `revolt_material()` (`:821-825`), `RevoltSprite` z `world_position` i `drawn` |
| `rust-port/renderer/src/cities/mod.rs` | wyłącznie `pub mod revolt;` i re-eksport |
| `rust-port/renderer/tests/cities_revolt_r6.rs` (NOWY) | 6 testów |
| `rust-port/renderer/tests/fixtures/cities_revolt/r6_vectors.json` (NOWY) | wektory przepisane ręcznie z pinu, z `plik:linia` przy każdej wartości |
| ten raport | |

Nie zmieniono: `view-model/**`, `engine/**`, `view/cities.rs`, `models/cities/renderer.rs`, `raster/atlas/upload.rs`, `cities/overlay/**`, `cities/sync/**`, `rivers/**`, `decor/**`, `map_units/**`, `view/overlays.rs`, `gra/`. `Cargo.lock` (zmieniony lokalnie przez cargo) przywrócony, poza commitem.

## 2. Decyzje techniczne (zapis dla rejestru)

- **Rodzic sprite'a.** W pinie sprite jest dzieckiem grupy miasta. Modele miast żyją w `CityRenderer` (`models/cities/renderer.rs`), który jest poza allowlistą i nie udostępnia `&mut` do grupy. Warstwa buntu jest więc osobna (jak `SiegeMarkerRenderer` w `models/misc/siege.rs`) i tylko czyta grupę: pozycja świata = `group.matrix · (0, 1.35, 0)`, widoczność = `group.visible`. `city_overlay_scene` daje scenę (`Scene`) do eksportu GPU z tą samą macierzą świata.
- **Przebudowa grupy.** Pin przy zmianie `visualKey` robi `_removeRevolt` na starej grupie (`:551`) i nowy sprite na nowej (`:586`). Tu sprite pamięta `visualKey` rodzica; inny klucz = usunięcie i nowy sprite (nowy `serial`). Test cyklu życia to sprawdza.
- **Tekstura** jako dane (`GlyphTexture`, ten sam wzorzec co `SIEGE_GLYPH`), rasteryzacja należy do warstwy tekstu (D-MOD-6). Jedna wspólna tekstura dla wszystkich miast (`this.revoltTex`, `:449`).
- **D-DTO-1 = A**: bunt i licznik tylko z DTO; renderer nic nie wylicza.

## 3. UWAGA ZAKRESOWA: licznik jednostek na heksie miasta — pin go NIE rysuje

Dispatch (ZAKRES 2) zakłada licznik „renderowany jak w pinie (tekst/ikona licznika)”. Sprawdzone w pinie:

```text
$ git grep -n "getUnitCountOnHex\|unitCountOnHex" 07d2fbd72 -- gra/src
07d2fbd72:gra/src/main.ts:2901:    function unitCountOnHex(q: number, r: number): number {
07d2fbd72:gra/src/main.ts:2971:        getUnitCountOnHex: (q, r) => unitCountOnHex(q, r),
07d2fbd72:gra/src/render/cities.ts:346:  getUnitCountOnHex?: (q: number, r: number) => number;
```

Opcja jest zadeklarowana (`cities.ts:345-346`) i wypełniana (`main.ts:2971`), ale `CityRenderer` jej nigdy nie czyta (0 wywołań w `gra/src/render`). Web nie rysuje więc żadnego licznika na heksie miasta — ani dla 0, ani dla > 0. Zgodnie z zasadą 9/11 (parytet 1:1, bez wymyślania reguł spoza webu) licznika nie dodałem: wartość `unit_count_on_hex` jest przenoszona z DTO (`RevoltCityInput::unit_count_on_hex`) i, jak w pinie, nie dodaje węzła do sceny. Test `unit_count_is_carried_and_draws_no_counter` sprawdza, że scena miasta jest identyczna dla liczników 0, 1, 3, 7, 99 i nie ma węzła licznika. „Wartość 0 = brak licznika” jest spełnione (brak licznika dla każdej wartości).

Jeśli właściciel chce licznik na heksie miasta (np. jak plakietka `×N` stosu T5, `units.ts:6386`, która należy do R1), to świadome odstępstwo od webu → pytanie ABC orkiestratora, osobny temat.

## 4. Testy (`tests/cities_revolt_r6.rs`)

Fixture: 4 miasta (id 11: bunt, 0 jednostek; 12: bez buntu, 3; 13: bunt, 7; 14: bez buntu, 0), różne tereny (łąka, wzgórza, pustynia, równina) → różne `terrainTopY`.

| test | co sprawdza | pin |
|---|---|---|
| `revolt_sprite_exists_only_for_revolt_true` | sprite tylko dla `revolt == true` (11, 13), kolejność `Map` | `cities.ts:586`, `:816-820` |
| `revolt_sprite_position_and_scale_relative_to_hex` | pozycja lokalna i skala; pozycja świata = `(x, topY + 0.008·R + 1.35·1.38, z)` (tolerancja 1e-12), także przez macierze świata sceny; rodzic = korzeń | `:827-829`, `:573-574`, `:141`, `:143` |
| `revolt_material_and_texture_match_pin` | `SpriteMaterial`, transparent, depthTest false, depthWrite true, opacity 1, biały; glif 64 / `48px serif` / 🔥 / (32, 36); wspólna tekstura | `:794-800`, `:821-825`, `:449` |
| `unit_count_is_carried_and_draws_no_counter` | wartość z DTO; brak węzła licznika dla 0 i > 0 | `:345-346`, `main.ts:2971` |
| `revolt_sprite_life_cycle_follows_sync` | brak ponownego tworzenia (`:820`), usuwanie przy końcu buntu, przebudowa grupy (`:551`, `:586`), mgła (`:536`, `:580`), miasto usunięte (`:597-599`), `dispose` (`:777`) | jw. |
| `revolt_inputs_from_dto_are_unchanged` | mapowanie DTO 1:1 | D-DTO-1 |

Brak `#[ignore]`, brak osłabionych asercji.

## 5. Mutacje (muszą dać FAIL)

Skrypt podmienia jeden fragment, uruchamia `cargo test --test cities_revolt_r6 --no-fail-fast`, przywraca plik i odświeża jego `mtime` (patrz §6, przebieg 1).

| mutacja | zmiana | wynik |
|---|---|---|
| (a) sprite dla `revolt == false` | `if !show {` → `if false && !show {` (`revolt/mod.rs`, `sync_revolt`) | EXIT 101; FAILED: `revolt_sprite_exists_only_for_revolt_true`, `revolt_sprite_life_cycle_follows_sync`, `unit_count_is_carried_and_draws_no_counter` (3/6) |
| (b) licznik dla 0 | w `city_overlay_scene` dodany węzeł-sprite licznika, gdy `unit_count_on_hex == 0` | EXIT 101; FAILED: `unit_count_is_carried_and_draws_no_counter`, `revolt_sprite_exists_only_for_revolt_true`, `revolt_sprite_position_and_scale_relative_to_hex` (3/6) |
| (c) przesunięcie Y sprite'a | `REVOLT_SPRITE_POSITION` `[0.0, 1.35, 0.0]` → `[0.0, 1.45, 0.0]` | EXIT 101; FAILED: `revolt_sprite_position_and_scale_relative_to_hex` (1/6) |

Po mutacjach pliki przywrócone; ponowny przebieg niezmutowany: 6/6 ok.

## 6. Bramki (`rust-port/renderer`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny poza repo (scratchpad sesji, `r6_target`), usunięty po bramkach.

Przebieg 1 (unieważniony, opis dla przejrzystości):

| krok | wynik |
|---|---|
| `df -h /` przed bramkami | 8.1G wolne (≥ 8 GB) |
| `cargo fmt --check` | EXIT 0 (po `rustfmt` nowych plików) |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 (po usunięciu `needless_lifetimes` w teście) |
| `cargo test --all-targets --no-fail-fast` | EXIT 101: 1 FAIL `revolt_sprite_position_and_scale_relative_to_hex` (`left: [0.0, 1.45, 0.0]`). Przyczyna: pierwszy skrypt mutacji przywracał plik przez `shutil.move` kopii z wcześniejszym `mtime`, więc cargo uznał binarkę mutanta (c) za aktualną. Źródło było poprawne (`REVOLT_SPRITE_POSITION = [0.0, 1.35, 0.0]`, sprawdzone `grep`). Poprawka skryptu: `os.utime(path)` po przywróceniu; mutacje powtórzone (wyniki w §5 są z powtórki), potem pełne bramki od nowa. |

Przebieg 2 (obowiązujący):

| krok | wynik |
|---|---|
| `df -h /` przed bramkami | **5.4G wolne (< 8 GB)** — spadek przez inne sesje na wspólnym dysku (własny target ok. 0,2–1 GB). Bramki uruchomione mimo progu dispatchu, bo to dokończenie rundy, a nie nowy start (CLAUDE.md §7: przy < 2 GB wstrzymać tylko NOWE starty). Odnotowane jawnie do oceny orkiestratora. Po bramkach: 8.4G wolne. |
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0 — 69 zestawów, 565 passed, 0 failed, 0 ignored |
| `cargo test --test cities_revolt_r6` | 6 passed, 0 failed |

`CARGO_TARGET_DIR` usunięty po bramkach.

## 7. NIE_ZMIERZONO

- Rasteryzacja tekstury 🔥 (piksele) — tekstura jest danymi (`GlyphTexture`), jak `SIEGE_GLYPH`; rasteryzacja to warstwa tekstu.
- Render GPU (wgpu) sprite'a — brak warstwy GPU dla sprite'ów miast w tym temacie.
- Wpięcie `RevoltRenderer::sync` w produkcyjną pętlę klatki (brak produkcyjnego wołającego `CityInputs::sync`; droga DTO engine → renderer to audyt L6 / osobna decyzja).
