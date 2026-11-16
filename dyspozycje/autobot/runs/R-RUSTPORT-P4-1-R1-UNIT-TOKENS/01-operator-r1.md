# R-RUSTPORT-P4-1-R1-UNIT-TOKENS — Operator, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer 3D, żetony jednostek mapy strategicznej)
TEMAT: R-RUSTPORT-P4-1-R1-UNIT-TOKENS
GOAL: port `UnitRenderer` z `gra/src/render/units.ts` @ `07d2fbd72` (sync, setHighlight, clearHighlight, setSelectionHex, setPathRoute, obwódka wodza + applyGeneralRingLod, dispose) do nowego modułu `rust-port/renderer/src/map_units/` oraz siatki żetonów dla `UnitPickModel.meshes`.
BAZA: `origin/rust-port/parity-v2` = `0fccd8dbf6960635676f908d902570c68c8770ec` (worktree detached, sprawdzone `git rev-parse HEAD`).
ZMIANY/COMMIT: jeden commit Operatora na detached HEAD od `0fccd8dbf` (SHA w odpowiedzi Workflow; raport jest w tym samym commicie, więc nie zawiera własnego SHA); pliki: `rust-port/renderer/src/lib.rs` (1 linia), `rust-port/renderer/src/map_units/{mod,token,general_ring,overlays,consts}.rs` (NOWE), `rust-port/renderer/tests/map_units_tokens.rs` (NOWY), ten raport. Bez `Cargo.lock`.
TESTY: patrz §3–§4.
BLOKADY: brak (dysk: przed bramkami chwilowo 6,9–7,8 GB < 8 GB — bramki wstrzymane do zwolnienia miejsca przez inne procesy; start bramek przy 17 GB wolnego)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (bez push do parity).

## 1. Zakres i pliki (allowlista)

| Plik | Co |
|---|---|
| `rust-port/renderer/src/lib.rs` | wyłącznie `pub mod map_units;` |
| `rust-port/renderer/src/map_units/mod.rs` | `MapUnitRenderer`: `sync` (`units.ts:6095-6263`), `_applyStackDisplay` + ikony cierpienia (`:6266-6371`), `_syncGeneralRing` / `_removeGeneralRing` (`:6915-6940`), `applyGeneralRingLod` (`:5787-5791`), `setTokenWorldPosition` (`:6498-6509`), `topYAt` (`:6515-6518`), `_tokenPlacement` / `_applyCityTokenStyle` (`:5982-6002`), `setHighlight` / `clearHighlight` (`:6524-6568`), `setSelectionHex` / `clearSelectionHex` (`:6571-6602`), `setPathRoute` / `clearPathRoute` (`:6608-6744`), `dispose` (`:6747-6759`), `pick_models()` (siatki dla `UnitPickModel`, `pick/mod.rs:181-189`) |
| `rust-port/renderer/src/map_units/token.rs` | `MapToken` (grupa żetonu + `userData`), `_attachOwnerRing` (`:6008-6043`), `_applyDeferredDim` (`:6060-6086`), wejścia nakładek (`TokenOverlays`: gwiazda dowódcy, rząd odznak, gwiazdki, tabliczka, `×N`, czaszka/moneta) |
| `rust-port/renderer/src/map_units/general_ring.rs` | port 1:1 `render/generalHexRing.ts` (pętla 18 krawędzi, pas, `generalRingWorldWidth`, `generalRingY`) |
| `rust-port/renderer/src/map_units/overlays.rs` | `HighlightLayer`, `SelectionMarker`, `PathRoute` (rura `CatmullRomCurve3` + `TubeGeometry`, kropki, torus, etykiety tur) |
| `rust-port/renderer/src/map_units/consts.rs` | literały `UnitRenderer` z `units.ts` (z numerami linii) |
| `rust-port/renderer/tests/map_units_tokens.rs` | 17 testów (fixture'y `UnitViewDto` / `StackViewDto` ręczne) |

Nie portowano `topYAt` jako osobnej logiki pickingu ani `pickUnitIdAt` (są: `TerrainPickScene::top_y_at`, `ray_to_unit`) — `MapUnitRenderer::top_y_at` to ten sam wzór (`Terrain::top_y`, `pick/terrain.rs:123-126`) potrzebny wewnątrz renderera (pozycje żetonu, dysków, trasy, pasa wodza). Nie dotykano `view/**`, `view-model/**`, `engine/**`, `battle/**`, `cities/**`, `gra/`.

## 2. Decyzje techniczne (do rejestru)

- **D-R1-1 (wejście `sync`):** `MapUnitRenderer::sync(&[UnitViewDto], Option<&StackViewDto>)` przyjmuje rekordy DTO wprost (dispatch: „żetony z UnitViewDto / StackViewDto”); `dimmedUnitIds` = pole `UnitViewDto.dimmed`. Właściciel = `OwnerRef::legacy_i64()` (`i64`, bez błędu przepełnienia; rezolwery `Fn(i64)`). Pozostałe metody przyjmują wartości renderera jak web (heksy, `i64` właściciela, krycie, `PathRouteOptions`). Tłumaczenie `overlays.*` (reachable / build_highlight / selection / path_route) → te metody zostaje w Q6 (`view/units.rs`).
- **D-R1-2 (model żetonu):** web woła `buildUnitModel(cat, color, typeId)` (typeId jako `unitName`); tu `model_for_or_category(typeId, category)` + `build_model` (D-MOD-9 = A, tabela 77 typów sprawdzana względem `legacy_route` w `tests/unit_core_model_rule.rs`); nieznany typ → model kategorii + `MapToken.unknown_type` (D-NM-14).
- **D-R1-3 (optymalizacje pamięci webu):** `MaterialContentPool`, `GeometryContentPool`, `mergeUnitStaticParts`, `_mergeDeferredToken`, `SmallPartLod` nie zmieniają tego, co rysowane, ani stanu klasy — nieportowane (każdy żeton ma własną `Scene`).
- **D-R1-4 (sprite'y i odznaki):** tabliczka, gwiazda dowódcy, rząd odznak, gwiazdki, `×N`, czaszka głodu, moneta deficytu i etykiety tur trasy są trzymane jako WEJŚCIA (wartości przekazywane w pinie do `applyUnitStatPlate` / `applyUnitCommanderStar` / `applyUnitUpgradeBadgeRow` / `applyUnitVeteranBadgeStarCount` / `_make*Sprite`) — drzewa i tekstury buduje istniejące `units::overlay` w warstwie GPU. Logika wyboru (vitals stosu vs wartości jednostki, `hpMax: undefined` bez vitals, para ikon) jest portowana i testowana.
- **D-R1-5 (`dispose`):** jak web — trasa, podświetlenie, żetony, pasy wodzów; pierścień zaznaczenia NIE jest czyszczony (web też go nie czyści, `:6747-6759`).
- **D-R1-6 (domyślny kolor):** `ownerColor(id)` dla ujemnego id daje w webie `undefined` (JS `%` zachowuje znak) → Three zostawia biel; tu `0xffffff`. W grze `setOwnerColorFn(civColorFn)` zawsze nadpisuje domyślny.
- **D-R1-7 (picking):** `pick_models()` = widoczne żetony w kolejności `Map`, wszystkie siatki trójkątne poddrzewa (także niewidoczne dzieci), strona materiału z pierwszego materiału siatki. Pas wodza nie jest pickowalny (`mesh.raycast = () => {}`).

## 3. Testy (`tests/map_units_tokens.rs`, 17 testów, każdy z `units.ts:linia` / `generalHexRing.ts:linia`)

- liczba żetonów = liczba jednostek w stosie (3), widoczny tylko reprezentant, `×3` na reprezentancie; bez stosu wszystkie widoczne (`:6100-6170`, `:6266-6304`);
- `forceVisibleUnitId` (`:6275`); usuwanie i przebudowa z przesunięciem na koniec `Map` (`:6123-6150`, `:6245-6256`);
- położenie: relief wzgórza, heks miasta (offset `cos/sin(π/2)·0.38`, skala 1.22, `renderOrder` 55) (`:5982-6002`);
- pierścień właściciela i wojny (`:6008-6043`), domyślna postawa (`:5850-5851`);
- przyciemnienie odroczenia: próg 0.45, pierścień 0.42 bez zmian, przywrócenie bazy, idempotencja (`:6060-6086`);
- tabliczka i odznaki: vitals stosu vs wartości jednostki, `hpMax`/`fieldPowerM` = brak bez vitals (`:6206-6237`);
- ikony cierpienia pojedyncze i w parze (`:6340-6371`);
- wódz ma obwódkę: kolor właściciela, wysokość = najwyższy z 7 heksów + 0.05, ukryta z żetonem, `hasCommander` stosu nadpisuje `isGeneral`, znika z jednostką (`:6208-6211`, `:6241-6243`, `:6259-6262`, `:6915-6932`);
- LOD pasa: `generalRingWorldWidth`, przepisanie tylko przy zmianie (`generalHexRing.ts:189-213`); pętla 18 krawędzi, normalne jednostkowe na zewnątrz, 324 współrzędne (`:6`, `:60-122`, `:141`);
- `setHighlight` / `clearHighlight`: dysk na heks (Set — duplikat raz), krycie domyślne i `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`, zastąpienie, czyszczenie, pusty zbiór (`:6524-6568`);
- `setSelectionHex` (`:6571-6591`);
- `setPathRoute`: trasa n heksów = 1 rura (65 × 9 wierzchołków) + n − 2 kropek + 1 torus (NIE n − 1 segmentów — tak jest w pinie), < 2 heksów = nic; etykiety tur i `turnLabel` (`:6608-6684`);
- `dispose` (`:6747-6759`); `pick_models` + `ray_to_unit` (`pick/mod.rs:181-193`, `units.ts:5933`).

Wynik: `cargo test --test map_units_tokens` → 17 passed, 0 failed.

## 4. Mutacje (wymagane FAIL)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a) obwódka wodza wyłączona | `let has_cmd = has_cmd && false;` na początku `sync_general_ring` | FAIL: 3 testy (`general_has_the_seven_hex_band`, `general_band_width_follows_the_camera`, `dispose_releases_tokens_bands_highlight_and_route`), 14 passed |
| (b) `clearHighlight` nie czyści | ciało `clear_highlight` bez `self.highlight = None` | FAIL: 2 testy (`highlight_set_replace_and_clear`, `dispose_releases_…`), 15 passed |
| (c) `dispose` nie zwalnia siatek | `dispose` bez `tokens.clear()` / `order.clear()` | FAIL: 1 test (`dispose_releases_tokens_bands_highlight_and_route`), 16 passed |

Po każdej mutacji plik przywrócony z kopii (`cmp` = identyczny).

## 5. Bramki (`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo)

| Bramka | Kod wyjścia | Wynik |
|---|---|---|
| `df -h /` przed bramkami | — | 17G wolne (wcześniej 6,9–7,8G: bramek nie uruchamiano, odczekano) |
| `cargo fmt --check` | 0 | czysto (nowe pliki sformatowane `rustfmt --edition 2021`, tylko pliki z allowlisty) |
| `cargo clippy --all-targets -- -D warnings` | 0 (po poprawce `neg_cmp_op_on_partial_ord` w `general_ring.rs`; pierwszy przebieg 101) | 0 ostrzeżeń |
| `cargo test --all-targets --no-fail-fast` | 0 | 84 binarki testowe, 684 passed, 0 failed, 0 ignored; w tym `map_units_tokens` 17/17 |

`CARGO_TARGET_DIR` (scratchpad, 479 MB) usunięty po bramkach.

## 6. Uwagi / NIE_ZMIERZONO

- Brak wektorów z uruchomienia webu (bez `npm` w `gra/`): wartości oczekiwane wyliczone ręcznie z literałów pinu. Bit-w-bit pozycji pasa wodza względem `Float32Array` webu — NIE_ZMIERZONO.
- Picking pomija `LineLoop` i sprite'y żetonu (tabliczka/odznaki to dane, nie siatki tego modułu); web `intersectObjects` testuje także sprite'y — wpływ na trafienia NIE_ZMIERZONO.
- `Cargo.lock` zmienia się lokalnie przy budowie (dopisanie `civ-view-model`/`serde_json` istniejących zależności) — nie commitowany, przywrócony.
