# P4.22 — MOD-13 „misc”: wioska/obóz, oblężenie, niebo Roblox, nakładki zasięgu i tras (CPU)

STATUS: PASS (Operator, runda 1/5)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-22-MOD13-MISC-Q1
GOAL: Paczka MOD-13 z `P4-4-MODEL-CATALOG.md`: modele pomocnicze w Rust 1:1 z kodem weba — `wioska-oboz`, `siegeCampModels`, `siegeMarker`, `siegeCampSync` (część CPU), `rangeOverlay`, `tradeRoutesOverlay` (geometria CPU), `robloxCity` (TYLKO `addRobloxSkyDecor`). Nakładki jako bufory CPU, bez GPU; zgodność bitowa z uruchomionym kodem weba.
BAZA: `rust-port/parity-v2` @ `e1d69078` (worktree odłączony; w trakcie pracy `origin/rust-port/parity-v2` przesunął się na `6d77d02e` — integracja u orkiestratora).

## 1. Zakres i źródła (web `edb8fb56`)

| Plik web (LOC) | Funkcje | Moduł Rust | Importerzy w grze (dowód) |
|---|---|---|---|
| `render/wioska-oboz.ts` (342) | `buildWioska` `:153-239`, `buildObozBarbarzyncow` `:249-342`, `BARB_FACTION_COLOR` `:138`, `WIOSKA_OBOZ_LAYOUT` `:140-146` | `models::misc::wioska` | `main.ts:796,3006,3034` |
| `render/siegeCampModels.ts` (160) | `makeSiegeSoldiers` `:14-38`, `makeSiegeRam` `:40-72`, `makeSiegeTower` `:74-104`, `makeTent` `:106-115`, `buildSiegeCampGroup` `:124-158`, `DEFAULT_SIEGE_ATTACKER_COLOR` `:160` | `models::misc::siege` | `siegeMarker.ts:10-13` |
| `render/siegeMarker.ts` (262) | `SiegeMarkerRenderer` (`buildGroup` `:105-132`, `sync` `:148-229`, `pulse` `:232-239`), tekstura ⚔ `:35-49` | `models::misc::siege` | `main.ts:465,1949` |
| `render/siegeCampSync.ts` (47) | `readyMachinesForCity` `:7-11`, `machinesByCampHex` `:14-27`, `campOwnerByHex` `:30-47` | `models::misc::siege` | `main.ts:652` |
| `render/robloxCity.ts` (294) | TYLKO `addRobloxSkyDecor` `:270-294` (+ prywatne `rnd` `:7-13`) | `models::misc::sky` | `scene.ts:73,3071` |
| `render/rangeOverlay.ts` (909) | `buildRangeOverlayGroup` `:860-895`, `buildTerritoryBorderGroup` `:810-857`, style `:438-484`, stałe `:516-537` i wszystkie funkcje prywatne | `models::misc::range` | `main.ts:741-742,12737,12769,12795,12806`; `cityOkolicaOverlay.ts:11,260-270` |
| `map/territory-border.ts` (238) | `computeTerritoryBorderLoops` `:227-233` (+ `collect…` `:76-111`, `trace…` `:180-224`) | `models::misc::territory` | `rangeOverlay.ts:9-12` |
| `render/tradeRoutesOverlay.ts` (101) | `buildTradeRoutesOverlayGroup` `:77-87`, `buildRouteArc` `:43-74` | `models::misc::trade` | `main.ts:751,12597` |

Poza zakresem (decyzja w dispatchu / D-MOD-2): `buildRobloxCity` (`robloxCity.ts:62`), `buildRobloxRomeCity` (`:213`) — jedyny importer martwy `robloxScene.ts:12` (`P4-4-MODEL-CATALOG.md` §4, D-MOD-2). `dispose*` (zwalnianie GPU) — brak odpowiednika CPU.

## 2. Architektura

- **Drzewo modelu = `models::unit_core::model::UnitModel`** (nowego typu drzewa nie dodano). `MiscModel` (`src/models/misc/model.rs`) opakowuje je i dokłada TYLKO to, czego drzewo P4.13 nie niesie, w wektorach równoległych indeksowanych tym samym `NodeId`/`MatId`:
  - `MiscMaterial` (Lambert / Basic / Sprite / LineBasic; kolor, `flatShading`, `transparent`, `opacity`, `depthWrite`, `depthTest`, `side`, `polygonOffset`, `map`) — lustrzany wpis w `tree.materials` (metalness/roughness = wypełniacz, Lambert/Basic ich nie mają);
  - `NodeInfo` (`castShadow`, `receiveShadow`, `renderOrder`, siatka `CircleGeometry`/`RingGeometry`, sprite) — `Geo`/`Prim` z P4.13 nie mają koła ani pierścienia, a `unit_core/**` jest poza allowlistą, więc węzły z kołem/pierścieniem/sprite'em to węzły drzewa z `mesh = None` + dane w `NodeInfo` (dispatch: „minimalny typ we własnym module”).
  - Geometria: `crate::geom` (P4.8) — box/cylinder/cone/sphere/icosahedron przez `Prim::build`, koło/pierścień przez `geom::circle_geometry`/`ring_geometry`. Bez zmian w `geom/**`.
- **Nakładki = `OverlayGroup`** (`src/models/misc/overlay.rs`): lista obiektów (`InstancedMesh`/`Mesh`/`LineSegments`/`Line`) z geometrią CPU (`geom::Mesh`, atrybuty `Float32` jak w webie, normalne z `compute_vertex_normals`), macierzami instancji `Float32` (`instanceMatrix`), parametrami materiału, `renderOrder`, `frustumCulled`, `name`, `userData` drapowania. Zero uploadu GPU.
- **`Math.*` przez `crate::jsmath`** (`js_sin/js_cos/js_atan2/js_hypot/js_hypot_n`); `jsmath_wiring` skanuje nowy kod i przechodzi. `rnd` nieba = `core::bronze::rnd` (identyczna funkcja jak `robloxCity.ts:7-13`, porównana źródłowo z `bronzeCity.ts:42-46`).
- **Semantyka JS odtworzona jawnie:** `toFixed(n)` (remis dziesiętny → od zera; `-0` bez znaku, mały ujemny ze znakiem; `overlay::js_to_fixed`, test na wartościach z node), `parseInt(s,10)` (białe znaki ECMAScript, znak, najdłuższy ciąg cyfr; `siege::js_parse_int10`), kolejność `Map`/`Set` (wektory w kolejności wstawienia), `Math.min/max` (`js_min/js_max`), clamp NaN/−0.
- **Zależność nieportowana — relief:** drapowanie `hugTerrainRelief` (`rangeOverlay.ts:383-436`) pobiera wysokość z `reliefSurfaceSampler` (`mapRenderStyle.ts:1107-1121`) → `powierzchniaReliefuY` (raycast w wariant bryły `teren-gory-wzgorza.ts`). To nie jest MOD-13, więc sampler jest wstrzykiwany (`range::ReliefSource`); `FlatRelief` (wszystkie `null`) jest identyczny z webem dla każdego terenu poza `Wzgorza`/`Gory`. Algorytm drapowania (siatka sektorów, cache `toFixed(4)`, odsunięcie po normalnej) jest zweryfikowany bitowo z analitycznym polem wysokości wstrzykniętym po obu stronach (§4).

## 3. ZAŁOŻENIA (luki dispatchu, przyjęte wartości domyślne)

- **Z1 — linia modułu.** Dispatch: „dopisz TYLKO jedną linię `pub mod <twój_moduł>;`” do `lib.rs`, a allowlista: „jedna linia modułu w `src/models.rs`”. `lib.rs` ma już `pub mod models;`, moduł leży w `src/models/misc/**` → jedyna zmiana poza nowymi plikami: `src/models.rs` +1 linia `pub mod misc;`. `lib.rs` bez zmian (jak w P4.14 Z1).
- **Z2 — klucze heksów.** Web używa kluczy `"q,r"` i `hex.coords`; port przyjmuje `(i32, i32)` i zakłada `hex.coords == klucz` (tak buduje `generator.ts`). `HexKeySet` = `Set` (kolejność wstawienia, duplikaty pomijane).
- **Z3 — sprite ⚔.** Tekstura płótna jest opisana danymi (`siege::SIEGE_GLYPH`: 128×128, `bold 96px Arial`, `fillText('⚔', 64, 70)`, wyrównanie center/middle — zgodne z zapisem wywołań płótna z uruchomionego weba); rasteryzacja to D-MOD-6/tekst, NIE_ZMIERZONO tutaj.
- **Z4 — sceny.** Web dodaje chmury i znaczniki oblężenia wprost do `THREE.Scene`; port zwraca model (chmury = dzieci korzenia) i `SiegeMarkerRenderer.markers` w kolejności sceny. Test porównuje cały graf sceny (korzeń `Scene` + znaczniki), macierze świata liczone jak `updateMatrixWorld` od sceny.
- **Z5 — usuwanie obozów** przy kolejnym `sync`: web usuwa grupy obozów ze sceny (`siegeMarker.ts:167-177`); port obcina arenę węzłów/materiałów do stanu po `buildGroup` (`MiscModel::truncate`), co daje to samo drzewo.
- **Z6 — kolory jako `u32`.** `buildObozBarbarzyncow(color)` maskuje `color & 0xffffff`; port przyjmuje `u32` (ujemne liczby JS nieobsługiwane — gra podaje wyłącznie stałą `0xff4444`, `main.ts:3034`).

## 4. Weryfikacja (wzorzec P4.11)

Wektory referencyjne: **uruchomiony kod weba** `edb8fb56` (`git archive` do scratch poza repo), `three@0.169.0` (integrity `sha512-Ed906MA3…qUv0w==`, zgodna z `gra/package-lock.json@edb8fb56`), `esbuild@0.24.0`, node v22.22.0 (V8 `12.4.254.21-node.33`). Generator, bundler i shim: `rust-port/renderer/tests/fixtures/misc/{gen.ts,build.mjs,relief_shim.ts}`; instrukcja i SHA-256: `tests/fixtures/misc/README.md`. Dwa uruchomienia → identyczne SHA-256:

```
cf17ac9d66604ffd62c21835f990db9b1432315e1ea94947b66372e3c24de8e0  models.json   (1,27 MB)
06383e4d19e6abeb34b70be136e63b6260f8009796a35ad7c29c7f9de7e6be81  siege.json    (0,24 MB)
d590e026deac901f3a1f9ffc8ffbca5fa0f8075b1624e499a7520b7fb0d075a9  overlays.json (2,31 MB)
```

Razem 3,8 MB (< 8 MB, nic nie pominięto). Adaptacje harnessu (żadna linia weba nie jest zmieniona): (a) `relief_shim.ts` — tylko dla importu `./mapRenderStyle` w `rangeOverlay.ts`, `export *` prawdziwego modułu, opakowany wyłącznie `reliefSurfaceSampler` (tryb `real` = prawdziwa funkcja, `analytic` = pole zamknięte odtworzone w teście); (b) atrapa `document`/canvas rejestrująca wywołania rysowania sprite'a.

Porównanie (`tests/misc_web_parity.rs`, 9 testów) — **wszystko bitowo (`to_bits`)**, każda różnica = FAIL:

| Test | Zakres | Wynik |
|---|---|---|
| `models_match_web` | 34 przypadki: wioska; obóz (domyślny + 4 kolory, w tym `0xff00ff00` → maska); żołnierze 0/1/4/5; taran; wieża; obóz oblężniczy ×18 (9 kierunków `faceDir` w tym `(0,0)` i ułamkowy, 5 list machin w tym `undefined`/`[]`/3 machiny, 4 kolory); niebo ×4 (lite/pełne, span 0..160). 1 624 węzły / 1 301 meshy / 26 202 trójkąty. Per węzeł: rodzaj, rodzic, `position`/`quaternion`/`scale`, `matrixWorld`, castShadow/receiveShadow/renderOrder, typ+vtx+tri+hash FNV geometrii, wszystkie parametry materiału + kolor liniowy; per model: liczba meshy, trójkątów, sygnatura, bbox | 50 440 skalarów + 27 510 sprawdzeń, **0 różnic** |
| `siege_marker_matches_web` | 4 kroki `sync` (+`pulse` 1,7 / 0,25 / 3,0): obozy z machinami, złe klucze `"bad"`, miasto bez pozycji, zmiana zbioru, ponowne dodanie, pusty zbiór; cały graf sceny po każdym kroku (162/79/66/1 węzłów) | 9 424 skalary + 5 010 sprawdzeń, **0** |
| `siege_sync_matches_web` | 8 przypadków `siegeCampSync` (round-robin z duplikatem klucza, `parseInt` na `' 3'`, `'+3'`, `'\t1'`, NBSP, `'3abc'`, `'-'`, `'x'`, 3 części) + zapis płótna sprite'a | 4 + 18, **0** |
| `range_overlay_matches_web` | 252 przypadki: 18 zbiorów heksów (dyski promień 0..4 i 1..3, pierścienie z dziurą, wyspy, L, styk narożny, heksy spoza mapy, klastry 25/40, pusty) × 6 stylów (kultura, religia, kopalnia-hug, pas, pas+hug, bez `yOffset`) × mapy (`flat`+relief prawdziwy, `mixed`+analityczny, `noseed`+analityczny dla hug); per obiekt: rodzaj, nazwa, renderOrder, frustumCulled, materiał, vtx/tri/index, hash FNV (pozycje+normalne+indeksy), bbox, macierze instancji, `userData` | 41 168 + 9 705, **0** |
| `territory_loops_match_web` | 18 zbiorów → pętle obwodu (punkty) | 952 skalary, **0** |
| `territory_border_matches_web` | 7 przypadków `buildTerritoryBorderGroup` (z/bez relacji, własne szerokości/przezroczystość, pas 0, puste terytorium, klastry niewypukłe) | 288 + 470, **0** |
| `trade_routes_match_web` | 3 listy tras (ląd/morze, ta sama, długa z sufitem 1,6, heks spoza mapy, pusta) | 84 + 132, **0** |
| `quadratic_bezier_matches_three` | 24 × `QuadraticBezierCurve3.getPoints(28)` three r169 w f64 (atrybut `Float32` trasy ukrywałby 1 ulp) | 2 088, **0** |
| `to_fixed_on_hex_corners_is_sign_stable` | klucze `borderVertexKey` wspólnych rogów sąsiadów w oknie 41×41 | 3 362 klucze, zgodne |

Plus test jednostkowy `overlay::tests::to_fixed5_matches_node` (wartości wypisane przez node v22.22.0, w tym remisy `0.015625`, `0.03125`).

### 4.1 Mutacje (czy testy coś łapią)

Skrypt `dyspozycje/autobot/runs/R-RUSTPORT-P4-22-MOD13-MISC-Q1/mut.py` (podmiana → `cargo test --test misc_web_parity --lib` → przywrócenie). **13/16 wykrytych**; 3 przeżyły i są **równoważne semantycznie** (nie da się ich wykryć żadnym wejściem weba):

| Mutacja | Wynik |
|---|---|
| `HUG_RELIEF_SURFACE_LIFT` 0.012→0.0121 | wykryta (range) |
| wyłączenie cache wysokości reliefu | **przeżyła — równoważna**: punkty siatki sektorów są odległe o ≥ 0,97/4, więc dwa różne punkty nigdy nie mają tego samego klucza `toFixed(4)`, a wspólne wierzchołki sąsiednich sektorów liczą się tym samym wyrażeniem (`c·i + 0` vs `0 + c·j`) → cache nie zmienia wartości. Zachowany dla wierności 1:1. |
| `pickNextEdge`: `cross < bestCross` → `>` | **przeżyła — równoważna**: w siatce heksów każdy wierzchołek należy do 3 wzajemnie sąsiednich heksów, więc stopień wierzchołka w grafie obwodu ≤ 2 i gałąź wyboru spośród ≥ 2 opcji jest w webie nieosiągalna (także dla heksów spoza mapy — wtedy stopień spada do 1). Zachowana 1:1. |
| `"-0.00000"` fix w kluczu wierzchołka | wykryta (loops, border, sign-stable) |
| kolor namiotu `>> 1` → `>> 2` | wykryta (models, marker) |
| `MARKER_LIFT * 0.5` → `0.4` | wykryta (marker) |
| opacity `pulse` `2.4` → `2.5` | wykryta (marker) |
| sól `rnd` nieba 33→34 | wykryta (models) |
| promień placyku wioski 0.165→0.166 | wykryta (models) |
| `0.06 * k / 2` → `0.06 * (k / 2)` | **przeżyła — równoważna**: dzielenie przez 2 jest dokładne, `k ∈ {0,1,2}` |
| kolejność sumy Béziera | wykryta (bezier; przed dodaniem testu f64 przeżywała przez rzutowanie na `Float32` — luka zamknięta) |
| mianownik mitry `0.5` → `0.6` | wykryta (border) |
| bisekcja 12 → 11 kroków | wykryta (border) |
| pas `+0.004` → `+0.005` | wykryta (range) |
| reguła remisu `toFixed` | wykryta (unit) |
| znak `+` w `parseInt` | wykryta (sync; przed dodaniem klucza `'+3,-4'` przeżywała — luka zamknięta) |

## 5. Co ocenić wzrokiem po RR-T5 (NIE_ZMIERZONO — wymaga GPU)

1. Wioska i obóz barbarzyńców na heksie (skala 1.0, `rotY` 0.10 / −0.15) obok miasta — proporcje, czytelność z góry, flat shading Lambert.
2. Kolor proporca/płachty obozu (`0xff4444`) przy różnym oświetleniu.
3. Obóz oblężniczy: skala 0.42, obrót ku miastu (`atan2`), taran/wieża, namioty w kolorze przyciemnionym `(c & 0xfefefe) >> 1`.
4. Znacznik oblężenia: dysk (`depthTest:false`, opacity 0.42), pierścień (DoubleSide, pulsowanie skali 0.56–1.0), sprite ⚔ (rasteryzacja glifu `bold 96px Arial` — wymaga rasteryzatora tekstu D-MOD-6), kolejność rysowania 80/81/82/85/90.
5. Chmury Roblox (transparent 0.9, flat) — wysokość 2.5–6.5+0.08·span, gęstość lite/pełna.
6. Nakładki zasięgu kultury/religii (tint DoubleSide + linia 1 px WebGL — szerokość linii w wgpu!), pas `borderBandWidth`, płachta kopalni oblekająca relief (polygonOffset −2/−2, depthTest włączony) — wymaga portu samplera reliefu (`teren-gory-wzgorza.ts`).
7. Pasy granic państw (tożsamość 0,45 + relacja 0,225, wsunięte do środka), sortowanie przezroczystości (y-bump 0.004/0.008) na styku dwóch cywilizacji.
8. Łuki tras handlowych (`THREE.Line` 1 px, opacity 0.85, renderOrder 7, bez frustum culling) — szerokość linii w wgpu.

## 6. Ryzyka i propozycje

- **R1 — sampler reliefu.** `ReliefSource` dla `Wzgorza`/`Gory` wymaga portu `powierzchniaReliefuY` (`teren-gory-wzgorza.ts`, raycast w bryłę wariantu). Port samplera należy do MOD-03 (`P4-4-MODEL-CATALOG.md` §4.2 wiersz 3: `teren-gory-wzgorza` → `<renderer>/decor/**`), czyli do tematu P4.17 (`src/decor/**`), a NIE do nowego tematu. To korekta po uwadze 1 Evaluatora r1, zgodna z `P4-12-MOD01-CORE.md` Z2. Zależność integracyjna: po wejściu P4.17 podpiąć jego sampler jako `range::ReliefSource` i dodać wektor `relief=real` na mapie z `Wzgorza`/`Gory`. Do tego czasu `FlatRelief` jest dokładny poza tymi dwoma terenami.
- **R2 — linie 1 px.** `LineSegments`/`Line` WebGL mają stałą szerokość 1 px; wgpu nie ma szerokich linii — decyzja ścieżki rysowania w RR-T5.
- **R3 — rasteryzacja sprite'a ⚔** — D-MOD-6.
- **R5 — `toFixed`.** `overlay::js_to_fixed(x, digits)` uogólnia `core::jsnum::js_to_fixed3` (P4.12). Przeniesienie do `core` wykracza poza allowlistę tego tematu, bo `src/core/**` należy do P4.12. Równoważność dla `digits = 3` przypina test `overlay::tests::to_fixed_d3_equals_core_to_fixed3`: siatka 1/256 na [−7, 7] obejmuje wszystkie remisy dziesiętne. Dzięki temu konsolidacja w osobnym temacie albo przy integracji jest mechaniczna. To dług techniczny z uwagi 2 Evaluatora r1.
- **R6 — współdzielony scratch.** W r1 `git archive edb8fb56` rozpakowało się przez pomyłkę do katalogu `web/` innego agenta i nadpisało `web/gra` plikami z pinu `edb8fb56`. Treść jest identyczna tylko wtedy, gdy tamten agent też pracował na `edb8fb56`. Tego nie da się już sprawdzić (NIE_ZMIERZONO), bo katalog nie istnieje. Do orkiestratora: potwierdzić pin i SHA-256 wektorów tematu, który używał tego scratcha (uwaga 3 Evaluatora r1). Wektory MOD-13 nie zależą od tamtego katalogu: Evaluator zregenerował je z czystego `git archive` i dostał identyczne SHA-256.
- **R4 — baza.** `origin/rust-port/parity-v2` przesunął się na `6d77d02e` w trakcie pracy; jedyna zmiana współdzielona to 1 linia `src/models.rs` (konflikt jednej linii rozwiązuje orkiestrator).

## 7. Allowlista i granice

Zmienione/nowe pliki: `rust-port/renderer/src/models/misc/{mod,model,overlay,wioska,siege,sky,territory,range,trade}.rs` (nowe), `rust-port/renderer/src/models.rs` (+1 linia), `rust-port/renderer/tests/misc_web_parity.rs` (nowy), `rust-port/renderer/tests/fixtures/misc/{README.md,gen.ts,build.mjs,relief_shim.ts,models.json,siege.json,overlays.json}` (nowe), ten dokument, `dyspozycje/autobot/runs/R-RUSTPORT-P4-22-MOD13-MISC-Q1/{01-operator-r1.md,mut.py}`. Bez zmian: `gra/**`, `src-tauri/**`, `rust-port/engine/**`, `src/{geom,pick,assets,camera,terrain}/**`, `src/models/{unit_core,wonders}/**`, `lib.rs`, `Cargo.toml`, `Cargo.lock`. Zero nowych zależności, brak `unsafe` (`forbid(unsafe_code)` obowiązuje). Brak `npm run build/dev`; web uruchamiany wyłącznie w scratch poza repo (scratch usunięty po pracy).

## 8. Bramki — pełne surowe logi

Uruchomione z katalogu `rust-port/renderer`, `CARGO_TARGET_DIR` w scratch (świeży katalog), skrypt:

```bash
{ cargo fmt --all -- --check; echo "EXIT=$?"; } > fmt.log 2>&1
{ cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"; } > clippy.log 2>&1
{ cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"; } > clippy_gpu.log 2>&1
{ cargo test --locked --all-targets; echo "EXIT=$?"; } > test.log 2>&1
```

(Pierwsze uruchomienie w pustym `CARGO_TARGET_DIR`; `cargo clippy` bez `gpu` kompiluje crate bez zależności, stąd krótki log.)

### fmt.log

```text
EXIT=0
```

### clippy.log

```text
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_63260a26-711-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.73s
EXIT=0
```

### clippy_gpu.log

```text
   Compiling proc-macro2 v1.0.107
   Compiling unicode-ident v1.0.27
   Compiling quote v1.0.47
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
   Compiling thiserror v2.0.21
   Compiling autocfg v1.5.1
   Compiling libm v0.2.16
    Checking equivalent v1.0.3
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking libloading v0.8.9
   Compiling zerocopy v0.8.63
   Compiling libc v0.2.191
    Checking log v0.4.34
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
    Checking unicode-width v0.2.2
   Compiling pkg-config v0.3.34
    Checking once_cell v1.21.4
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking bit-vec v0.9.1
   Compiling parking_lot_core v0.9.12
   Compiling ash v0.38.0+1.3.281
    Checking bit-set v0.10.0
   Compiling wayland-sys v0.31.11
    Checking codespan-reporting v0.13.1
    Checking bytemuck v1.25.2
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking static_assertions v1.1.0
    Checking smallvec v1.16.3
    Checking allocator-api2 v0.2.21
    Checking naga-types v30.0.1
    Checking raw-window-handle v0.6.2
   Compiling zerocopy-derive v0.8.63
    Checking arrayvec v0.7.8
    Checking scopeguard v1.2.0
   Compiling khronos-egl v6.0.0
    Checking lock_api v0.4.14
    Checking wgpu-types v30.0.1
    Checking hashbrown v0.16.1
    Checking dlib v0.5.3
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking profiling v1.0.18
    Checking renderdoc-sys v1.1.0
    Checking glow v0.17.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling document-features v0.2.12
   Compiling wgpu v30.0.1
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_63260a26-711-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 49.85s
EXIT=0
```

### test.log

```text
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_63260a26-711-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 15.51s
     Running unittests src/lib.rs (<scratch>/target-clean/debug/deps/civ_renderer-3390857ab33a1fe3)

running 8 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test jsmath::words::tests::words_round_trip ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::misc::overlay::tests::to_fixed5_matches_node ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_nturns.rs (<scratch>/target-clean/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
test new_game_frees_everything_and_restarts_identically ... ok
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
test leak_m3_also_retains_battle_scene_resources ... ok
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.13s

     Running tests/assets_registry.rs (<scratch>/target-clean/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test owned_guards_count_references ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test live_report_lists_labels ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test reference_counting_frees_on_last_release ... ok
test scope_releases_everything_it_created_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/camera_web_parity.rs (<scratch>/target-clean/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test fixture_covers_every_branch ... ok
test camera_controller_matches_web_100_percent ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/core_web_parity.rs (<scratch>/target-clean/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test bronze_city_types_match_web ... ok
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
test vitals_match_web ... ok
test hexutil_matches_web ... ok
test zoom_lod_matches_web ... ok
test merge_decor_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/cpu_sanity.rs (<scratch>/target-clean/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (<scratch>/target-clean/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test parity_cone ... ok
test parity_curve ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_box ... ok
test parity_ops ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_cylinder ... ok
test parity_polyhedron ... ok
test parity_extrude ... ok
test parity_shape ... ok
test parity_sphere ... ok
test trs_matches_manual_composition ... ok
test parity_torus ... ok
test parity_tube ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/gpu_probe.rs (<scratch>/target-clean/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/jsmath_v8_parity.rs (<scratch>/target-clean/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test acos_matches_v8 ... ok
test atan_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test cos_matches_v8 ... ok
test log_matches_v8 ... ok
test sin_matches_v8 ... ok
test atan2_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test tan_matches_v8 ... ok
test hypot_matches_v8 ... ok
test pow_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.06s

     Running tests/jsmath_wiring.rs (<scratch>/target-clean/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test terrain_rotation_uses_v8_trig ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.12s

     Running tests/misc_web_parity.rs (<scratch>/target-clean/debug/deps/misc_web_parity-f6fc6b6b2b7c3c19)

running 9 tests
test siege_marker_matches_web ... ok
test siege_sync_matches_web ... ok
test quadratic_bezier_matches_three ... ok
test territory_loops_match_web ... ok
test to_fixed_on_hex_corners_is_sign_stable ... ok
test territory_border_matches_web ... ok
test trade_routes_match_web ... ok
test models_match_web ... ok
test range_overlay_matches_web ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.72s

     Running tests/pick_golden.rs (<scratch>/target-clean/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test world_to_axial_both_variants_match_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.69s

     Running tests/terrain_web_parity.rs (<scratch>/target-clean/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test fog_hides_unknown_and_dims_explored ... ok
test js_pow_special_cases_follow_v8 ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/unit_core_json.rs (<scratch>/target-clean/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (<scratch>/target-clean/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok
test norm_name_and_culture_match_the_web ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.35s

     Running tests/unit_core_trig.rs (<scratch>/target-clean/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (<scratch>/target-clean/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.47s

     Running tests/wonders_web_parity.rs (<scratch>/target-clean/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

EXIT=0
```

### mut.log (§4.1)

```text
('DETECTED', 'src/models/misc/range.rs', 'pub const HUG_RELIEF_SURFACE_LIFT: f64 = 0.012;', ['range_overlay_matches_web', 'result:'])
('SURVIVED', 'src/models/misc/range.rs', '        if let Some(&h) = self.cache.get(&key) {            ', [])
('SURVIVED', 'src/models/misc/territory.rs', '(best.is_none() || cross < best_cross || best_cross <= 1e-8)', [])
('DETECTED', 'src/models/misc/territory.rs', 'if s == "-0.00000" {', ['territory_border_matches_web', 'territory_loops_match_web', 'to_fixed_on_hex_corners_is_sign_stable', 'result:'])
('DETECTED', 'src/models/misc/siege.rs', '(opts.attacker_color & 0x00fe_fefe) >> 1', ['siege_marker_matches_web', 'models_match_web', 'result:'])
('DETECTED', 'src/models/misc/siege.rs', 'let y = top_y(cq, cr) + MARKER_LIFT * 0.5;', ['siege_marker_matches_web', 'result:'])
('DETECTED', 'src/models/misc/siege.rs', 'let opacity = 0.82 + 0.18 * js_sin(time_sec * 2.4);', ['siege_marker_matches_web', 'result:'])
('DETECTED', 'src/models/misc/sky.rs', 'let scale = 1.4 + rnd(n, 33.0) * 2.8;', ['models_match_web', 'result:'])
('DETECTED', 'src/models/misc/wioska.rs', 'radius: 0.165,', ['models_match_web', 'result:'])
('SURVIVED', 'src/models/misc/wioska.rs', 'let h = 0.34 + 0.06 * f64::from((i * 37) % 3) / 2.0;', [])
('DETECTED', 'src/models/misc/trade.rs', 'k * k * p0 + 2.0 * (1.0 - t) * t * p1 + t * t * p2', ['quadratic_bezier_matches_three', 'result:'])
('DETECTED', 'src/models/misc/range.rs', 'let denom = js_max(1.0 + (a.0 * b.0 + a.1 * b.1), 0.5);', ['territory_border_matches_web', 'result:'])
('DETECTED', 'src/models/misc/range.rs', '                for _ in 0..12 {', ['territory_border_matches_web', 'result:'])
('DETECTED', 'src/models/misc/range.rs', 'let y = hex_y + 0.004;', ['range_overlay_matches_web', 'result:'])
('DETECTED', 'src/models/misc/overlay.rs', 'let body = if scaled.fract() == 0.0 && scaled % 2.0 == 1.0 &', ['models::misc::overlay::tests::to_fixed5_matches_node', 'result:'])
('DETECTED', 'src/models/misc/siege.rs', "        Some(b'+') => (false, &t[1..]), ", ['siege_sync_matches_web', 'result:'])
```
