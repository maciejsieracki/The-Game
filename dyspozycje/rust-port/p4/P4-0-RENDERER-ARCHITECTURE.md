# P4.0 — Architektura renderera mapy: stan faktyczny, opcje, decyzje właściciela

**Temat:** R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1 · **Domena:** GAME · **Rola:** Operator (runda 2/5, obrona zarzutów 1–11)
**Pin web (referencja read-only):** `edb8fb56` (`git show edb8fb56:<ścieżka>`, `git grep ... edb8fb56 -- gra/src`)
**Baza dokumentu:** `de46210b` (commit Operatora rundy 1: `f24c91e0`)
**Zakres:** wyłącznie odczyt i projekt. Zero kodu, zero buildu, zero zmian w `gra/**` i `rust-port/**`. `npm run build/dev` nie uruchamiano.

**Legenda dowodów:** `plik:linia` = odczyt `git show edb8fb56:<plik>` / `git grep ... edb8fb56`; „cmd → wynik” = wklejony wynik komendy. `NIE_ZMIERZONO` = nie sprawdzono w tej rundzie (nie wnioskuję z nazw).

---

## 0. Sprostowanie

Wcześniejsze twierdzenie orkiestratora, że „mapa 3D to tylko płaskie assety 2D”, było **błędne**. Stan faktyczny na pinie `edb8fb56`:

- Mapa web jest renderowana w **3D** przez **Three.js** (`gra/package.json:14` `"three": "^0.169.0"`; `gra/package-lock.json:1586-1588` → `three` `0.169.0`).
- Kamera: `THREE.PerspectiveCamera` (`gra/src/render/scene.ts:3078`; typ `gra/src/render/camera.ts:62`).
- Renderer: `THREE.WebGLRenderer` (`gra/src/render/scene.ts:1624`).
- `gra/src/render/**`: **88 plików** (`git ls-tree -r --name-only edb8fb56 -- gra/src/render | wc -l` → 88), **59 319 linii** (`git grep -c ''` i suma). Największe: `units.ts` 6 779, `scene.ts` 3 760, `mapRenderStyle.ts` 1 996, `jednostki-z3-plemiona.ts` 1 994.
- Modele 3D jako zasoby: 0 plików glb/gltf/fbx/obj (P1.11 §2/§5, `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`). Geometria jest **proceduralna**.

Płaskie assety 2D to ikony SVG (307), portrety JPG (45), hero PNG (2), muzyka MP3 (62) — P1.11 §2. Nie są mapą.

---

## 1. Co dziś rysuje mapę (pytanie 1)

### 1.1 Stos renderingu

| Element | Dowód | Uwagi |
|---|---|---|
| Wersja Three.js | `gra/package.json:14`; lock `1586-1588` → 0.169.0 | Pin w lockfile |
| Renderer | `scene.ts:1624` `new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' })` | W zakresie funkcji `scene.ts:1599–1626` **brak try/catch** (`grep try` w `scene.ts`: najbliższe bloki `:1499–1529` i `:2206`). Brak WebGL = wyjątek bez ścieżki zastępczej w mapie. Zachowanie w runtime: NIE_ZMIERZONO |
| Pixel ratio | `scene.ts:1626`; `:3239` `effectivePixelRatio(...)` | Zależne od presetu wydajności |
| Kamera | `scene.ts:3078` `PerspectiveCamera`; `camera.ts` klasa `CameraController` | Yaw stały (`camera.ts:66`, `:123`); pan (drag, próg `DRAG_THRESHOLD_PX = 6`, `camera.ts:25`), zoom kółkiem (`camera.ts:218-219`), WASD i edge-pan (`camera.ts:247`) |
| Siatka hex (geometria) | `hexutil.ts:24` `HEX_R = 1.0`; `:32` `axialToWorld`; `:53` `worldToAxial`; `hexShape.ts` (kontur pointy-top w XZ) | `hexutil.ts` NIE importuje three (czysta matematyka) |
| Teren | `scene.ts:367` „InstancedMesh terenu — raycast pickingu heksów” | Prizmy terenu jako `InstancedMesh` |
| Mgła wojenna | `fogDim.ts:16` `fogBrightnessForHex`, `:29` `applyFogDimToObject3D` (mnożenie `material.color`, `:38-41`); `scene.ts:335-350` (`visible`/`explored` jako `Set<"q,r">`); `scene.ts:3389` `applyTerrainFog` | Mgła = zmiana kolorów materiałów, nie osobna warstwa |
| Rzeki | `riverLod.ts`, `scene.ts:~287` `RiverGeoBucket` (wstęgi `BufferGeometry`) | |
| LOD | `zoomLod.ts`; `scene.ts:3519` `applyZoomLodDecor`, `:3518` `applyZoomGpuSettings` | Dekoracje ukrywane wg zoomu |
| Jednostki | `units.ts` — klasa `UnitRenderer`, `sync(units, stackDisplay?, dimmedUnitIds?)` (`units.ts:6038-6041`) | §2 |
| Miasta | `cities.ts` (`CityRenderOptions`, `:277-300`: `getEra`, `getCiv`, `getLevel`, `getWalls` — callbacki do stanu) | |
| Nakładki | `rangeOverlay.ts`, `tradeRoutesOverlay.ts`, `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts`, `siegeMarker.ts`, `siegeCampSync.ts` | |
| Etykiety/plakietki | `unitStatPlate.ts`, `unitOwnerEmblem.ts` (`THREE.Sprite`, `:43-45`), `cityMapStatChip.ts`, `unitVeteranBadges.ts`, `unitUpgradeBadges.ts` | Tekstury z `<canvas>` |
| Picking | `input/picker.ts:175` `pixelToHex` — `THREE.Raycaster` (`picker.ts:192`), `intersectObjects` na meshach terenu (`:196`), fallback płaszczyzną (`:234`); `picker.ts:49` `worldToAxial` (czysta matematyka) | Wywoływane z `main.ts:1885` `pickHexAt` |

**Liczba plików `render/**` wg kategorii:** podział LOC na kategorie — NIE_ZMIERZONO (nie wnioskuję z nazw). Przybliżenie z nazw: ok. 30 plików modeli jednostek/miast, reszta scena/kamera/teren/dekoracje/nakładki/UI-overlay.

**Liczba plików `render/**` importujących `three`: 80 z 88** (`git grep -l "from 'three" edb8fb56 -- gra/src/render` → 80 plików; 88 − 80 = 8 bez importu three). Poprzednie twierdzenie „wszystkie 88” było **błędne** (zarzut 1).

Osiem plików `render/**` **bez** importu `three` (wynik: 88 − 80):
`countSceneOverlayCandidates.ts`, `hexutil.ts`, `minecraftScene.ts`, `perfDebugOverlay.ts`, `robloxScene.ts`, `siegeCampSync.ts`, `unitVitalsPalette.ts`, `zoomLod.ts`.
(Uwaga: `siegeCampSync.ts` i `countSceneOverlayCandidates.ts` są w §3.3 jako importerzy logiki, nie three.)

### 1.2 Styl „Minecraft”/„Roblox” — stan żywy vs martwy (zarzut 4)

Fakty z `git grep -n` na `edb8fb56`:

- **Martwe (0 importerów):** `minecraftScene.ts` (jedyna wzmianka to jego własny nagłówek `:2`); `robloxScene.ts` (tylko re-eksport `robloxCity`, `:12`; nikt go nie importuje).
- **Żywe (NIE są martwym kodem):**
  - `robloxCity.ts` ← `scene.ts:73` (import `addRobloxSkyDecor`), wywołanie `scene.ts:3071`;
  - `robloxImprovements.ts` ← `improvements.ts:9`, `scene.ts:89`;
  - `bronzeCityRoblox.ts`, `stoneCityRoblox.ts` ← `settlementModel.ts:7,9`; `settlementModel.ts` ← `cities.ts:31` i `main.ts:812`;
  - `styleResources.ts` ← `main.ts:649` (`buildStyledResourceOverlay`).
- Łącznie pliki `roblox*`/`minecraft*` mają 801 linii (`git grep -c ''` na nazwach; przybliżenie z poprzedniej rundy, do ponownego zliczenia w P4.6).

Zakres D-REND-7 (§6) jest więc **wyłącznie** `minecraftScene.ts` i `robloxScene.ts`.

### 1.3 Ważne fakty o kodzie renderera

- Tekstury **nie są plikami**: `CanvasTexture` z `<canvas>` (`cities.ts:718`, `cityMapStatChip.ts:1076`, `cityOkolicaOverlay.ts:210`, `siegeMarker.ts:46`, `unitOwnerEmblem.ts:349`, `unitStatPlate.ts:437`). Brak `TextureLoader`/`GLTFLoader` (grep: brak trafień dla `GLTFLoader|OBJLoader|FBXLoader|TextureLoader|DRACOLoader` w `gra/src`).
- Jedyny zewnętrzny obraz ładowany w `render/`: `unitOwnerEmblem.ts:317-320` (`new Image()`, `img.src = url`). **Źródło `url` NIE_ZMIERZONO.**
- Ikony/zasoby przez `import.meta.glob` z `ui/` — P1.11 §4 (`src/ui/icons/brandAssets.ts:23`).

### 1.4 Three.js poza `render/**` (zarzut 2)

`git grep -l -E "from ['\"]three" edb8fb56 -- gra/src` → 88 w `render/` + **8 poza nim**:

| Plik (pin `edb8fb56`) | Linie pliku (`git grep -c ''`) | Użycie Three.js (dowód) |
|---|---:|---|
| `gra/src/battle/battleScene.ts` | 19 493 | `WebGLRenderer` `:3304`; `PerspectiveCamera(48,…)` `:3336`; `Raycaster` `:8579`; import `buildUnitModel` z `render/units` `:104`; import typu `BronzeCiv` `render/bronzeCity` `:117` |
| `gra/src/battle/manualBattle.ts` | 1 433 | `WebGLRenderer` `:567`; `PerspectiveCamera(48,…)` `:584`; `Raycaster` `:452`; import `render/hexutil` `:35`, `render/units` `:36` |
| `gra/src/battle/siegeWall.ts` | 1 047 | import `three` + typ `BronzeCiv` z `render/bronzeCity` `:17` |
| `gra/src/input/picker.ts` | 278 | `Raycaster` `:192`; wynik `InstancedMesh` z `scene.ts` (`:29`) |
| `gra/src/main.ts` | 39 350 (plik mieszany, nie wszystkie linie 3D) | importy `render/**` m.in. `:60` (`buildScene`), `:151` (`CameraController`), `:155` (`UnitRenderer`), `:150` (`fogDim`), `:465`, `:629-657` (cities, siege, overlays) |
| `gra/src/ui/perfTestPanel.ts` | 677 | `WebGLRenderer` `:299-301` (test kontekstu i sonda); sonda `det.webgl2` `:177` |
| `gra/src/ui/unitMiniPreview.ts` | 155 | `WebGLRenderer` `:32`; import `buildUnitModel` `render/units` `:5` |
| `gra/src/wonderpreview/main.ts` | 289 | `WebGLRenderer` `:60`; import `render/hexutil` `:9`, `render/wonderModels` `:10` |

**Skutek dla opcji A:** kopia `render/**` 1:1 nie obejmuje 3D bitwy ręcznej (`battleScene.ts`, `manualBattle.ts`), podglądu cudów, miniatur jednostek i sondy w `perfTestPanel.ts`. Są to osobne punkty użycia tego samego silnika. Dodano **D-REND-8** (§6).

### 1.5 Układ okna i viewport (P1-10, zarzut 5)

Przeczytano `dyspozycje/rust-port/p1/P1-10-VIEWPORTS.md` (`git show f24c91e0:…`, pin `edb8fb56`). Dla renderera wynika z niego:

- **Brak stałego rozmiaru okna:** canvas gry wypełnia viewport; `scene.ts:3112` `window.addEventListener('resize', onResize)`, `scene.ts:3117` `document.addEventListener('fullscreenchange', onResize)`; rozmiar startowy `scene.ts:1615-1616` (`canvas.clientWidth || innerWidth`).
- **UI responsywne punktowo:** 13 `@media` w 11 plikach (katalog P1-10 §1), brak globalnego układu mobilnego; panele oparte o stałe px z ograniczeniem do vw (`min(24vw,340px)` itd., P1-10 §2).
- **Konsekwencja dla P4:** webview Tauri musi mieć canvas wypełniający viewport i reagować na resize/fullscreen tak samo jak web (`scene.ts:3112/3117`). To wejście do testu P4.14 (D-REND-6).

---

## 2. Skąd modele 3D jednostek (pytanie 2)

- **Proceduralnie, w kodzie.** `jednostki-p1-rdzen.ts` (7 eksportów), `jednostki-z1-mezopotamia.ts` (4), `units.ts` (klasa `UnitRenderer`, importowana przez `main.ts:155`). Bryły: `THREE.Mesh`/`BufferGeometry`; `mergeGeometries` z `three/examples/jsm/utils/BufferGeometryUtils.js` (`scene.ts:32` i drugi plik — `git grep`).
- **Routing jednostka → model:** `units/setup.ts:239` `categoryOf(name, role, isSuper, typ)` (słowa kluczowe, `setup.ts:240-251`); `units.ts` ma `switch` po kategorii (`case 'domyslny'` `units.ts:4762`).
- **Pokrycie unikalnym modelem:** `units.ts:100-116` (komentarze o dedykowanych modelach, np. `buildZelazoJezdziecOszczepami`). Ile z ok. 100+ typów ma unikalną bryłę — NIE_ZMIERZONO.
- **Miniatura 3D jednostki (UI):** `ui/unitMiniPreview.ts` — patrz §6, D-REND-5.
- **Zewnętrznych zasobów 3D:** brak (§1.3).

---

## 3. Granica danych renderer ↔ logika (pytania 3 i 8)

### 3.1 Wejście do renderera (co render czyta)

| Wejście | Kontrakt / miejsce | Źródło w logice |
|---|---|---|
| Jednostki | `units.ts:6038` `sync(units: RuntimeUnit[], …)` | `units/setup.ts:40` `RuntimeUnit` (`id, ownerId, typeId, category, q, r, ruch, …, battlesSurvived`) |
| Miasta | `cities.ts:277-300` `CityRenderOptions`: `getEra`, `getCiv`, `getLevel`, `getWalls` | Callbacki do stanu gry |
| Mapa / teren | `scene.ts:335-350` `SceneResult` + `buildScene` (`scene.ts:1279` `onSlice`) | Generator mapy |
| Mgła | `scene.ts:~350` `visible`/`explored: Set<"q,r">` | `game/visibility` (§3.3) |
| Stan miast/obozów/oblężeń | `siegeCampSync.ts`, `siegeMarker.ts` | `game/siegeMachines` (§3.3) |
| Ulepszenia | `improvements.ts` | `game/terrain-improvements`, `map/road-network` (§3.3) |

### 3.2 Wyjście renderera (co render emituje) i porównanie z P2 (zarzut 8)

Render **nie emituje komend domenowych**. Zdarzenia użytkownika obsługuje `main.ts`; render dostarcza geometrię i trafienia:

| Zdarzenie | Miejsce | Komendy domenowe (kontrakt P2-5, `dyspozycje/rust-port/p2/P2-5-COMMANDS.md`) |
|---|---|---|
| Hit-test heksa | `input/picker.ts:175` `pixelToHex` → `main.ts:1885` `pickHexAt` | (wynik pickera; sam nie jest komendą) |
| Klik na encję / heks (select) | `P2-8 §5` `onTileClick`; wiersz **U1** | `select_unit` (`unit_id: UnitId`) — U1 |
| Klik na heks = ruch | `main.ts:26036` `beginMoveSelectedUnitTo(destQ, destR)`; wiersz **U2** | `move_unit` (`unit_id`, `destination: HexCoord`) — U2 |
| Klik na ostatnio najechany heks (skrót B) | `main.ts:36177–36205` → `tryFoundPlayerCityAt`; wiersz **B11** | `found_city` (alias B6) — B11 |
| Klik w bitwie ręcznej | `battleScene.ts` (onclick heks = ruch/atak); wiersz **W10** | akcje bitwy — W10 |
| Prawy klik | `main.ts:26209` `contextmenu` | NIE_ZMIERZONO (brak wiersza mapującego w P2-5 dla prawego kliku) |
| Klik vs pan | `main.ts:26337` `mouseup`; próg `camera.ts:25` | (warstwa UI, nie komenda) |

Wniosek: wszystkie kliki sterujące stanem mają wiersze w P2-5 (U1, U2, B11, W10). Pełne mapowanie 174 callbacków `main.ts` jest poza zakresem tego tematu (P2-5 §2.13). Render nie dodaje własnych komend.

### 3.3 Sprzężenie render ↔ `game/`/`map/`/`units/` (zarzut 3)

`git grep -n -E "from ['\"]\.\./(game|map|units)/" edb8fb56 -- gra/src/render` → **17 plików** (poprzednio błędnie 12):

| Plik `render/` | Importowany moduł logiki |
|---|---|
| `cities.ts` | `../game/cities` (type), `../game/human-owners`, `../game/display-names`, `../game/production` (type+value), `../game/building-stock-cost` |
| `cityMapStatChip.ts` | `../game/production` (type) |
| `cityOkolicaOverlay.ts` | `../game/okolica`, `../game/terrain-improvements`, `../game/human-owners`, `../units/setup` |
| `countSceneOverlayCandidates.ts` | `../game/terrain-improvements`, `../units/setup` |
| `droga-6-ramion.ts` | `../map/road-network` |
| `fogDim.ts` | `../game/visibility` |
| `improvements.ts` | `../map/road-network` |
| `mapRenderStyle.ts` | `../map/gen-helpers` |
| `rangeOverlay.ts` | `../map/territory-border` |
| `robloxImprovements.ts` | `../map/road-network` |
| `scene.ts` | `../game/terrain-improvements`, `../game/visibility`, `../map/gen-helpers` |
| `siegeCampModels.ts` | `../game/siegeMachines` (type) |
| `siegeCampSync.ts` | `../game/siegeMachines` (type) |
| `siegeMarker.ts` | `../game/siegeMachines` (type) |
| `unitUpgradeBadges.ts` | `../game/unit-building-bonuses`, `../game/veteran` |
| `unitVeteranBadges.ts` | `../game/veteran` |
| `units.ts` | `../game/human-owners`, `../units/setup` (type), `../game/armyMerge` (type) |

Liczba plików na moduł (poprawiona): `game/production` = **2** (`cities.ts`, `cityMapStatChip.ts`), nie 3. Pozostałe: `game/terrain-improvements` 3, `game/siegeMachines` 3, `game/human-owners` 3, `units/setup` 3, `map/road-network` 3, `game/visibility` 2, `game/veteran` 2, `map/gen-helpers` 2, `game/cities` 1, `game/display-names` 1, `game/okolica` 1, `game/building-stock-cost` 1, `game/unit-building-bonuses` 1, `game/armyMerge` 1, `map/territory-border` 1.

**Wniosek:** 1:1 kopia `render/**` przeniesie do frontendu **logikę domenową** (`game/production`, `game/visibility`, `game/veteran`, `units/setup.categoryOf`). Część importów to typy (`import type`) — czy to czysta matematyka czy reguły, NIE_ZMIERZONO dla każdego z 17 plików (§7 pkt 4).

### 3.4 Relacja z kontraktem P2 i zasadami planu (zarzut 11)

- `P2-2-GAMESTATE-CONTRACT.md:16` — `GameState` = wyłącznie stan rozgrywki, bez stanu renderu i UI. Stan potrzebny rendererowi musi być **osobnym modelem widoku (DTO)** generowanym z `GameState` w Rust.
- Zasada „zero lokalnej symulacji w JS/frontend” to **`PLAN-PORT-RUST-TAURI-20261020.md` §4, P5.13** (`:192`). Zakaz „drugiej uproszczonej gry” to **§1 pkt 4**. Poprzednie odwołanie do P2.7 było błędne: P2.7 dotyczy serializacji save.
- `P2-8-TAURI-ADAPTER.md:59` — adapter Tauri renderuje wyłącznie stan z Rust (`renderGameState`, `main.js:712-716`). Ścieżki `main.js` w bieżącym HEAD nie zlokalizowano (NIE_ZMIERZONO).
- `P1-17B-UI-CLASSIFICATION.md:12` twierdzi, że mapa po stronie Tauri to siatka DOM (`#game-map`, `role="grid"`). Grep `game-map|role="grid"` w `HEAD:rust-port/` nie dał trafień. **Twierdzenie P1-17B:12 NIE zweryfikowane** — dane do sprawdzenia w P0/P2, nie fakt.

---

## 4. Opcje architektury (pytanie 4, zarzuty 9 i 10)

Legenda: „1:1” = zgodność wizualna z webem; „testy” = automatyczny i screenshotowy test (P4.14). Rozmiary w tabeli to rozmiar **plików** (LOC z §1.1 i §1.4), nie zmierzona liczba linii 3D; estymacja czasu jest **NIE_ZMIERZONO** w tej rundzie.

**Zakres do przeniesienia (rozmiar):**
- `render/**`: 88 plików, 59 319 LOC; 80 importuje three.
- Three.js poza `render/**`: 8 plików; suma LOC bez `main.ts` = 23 372 (`battleScene` 19 493 + `manualBattle` 1 433 + `siegeWall` 1 047 + `picker` 278 + `perfTestPanel` 677 + `unitMiniPreview` 155 + `wonderpreview` 289 — plik-rozmiar, nie linie 3D). `main.ts` 39 350 LOC, część 3D — udział NIE_ZMIERZONO.
- Modele proceduralne (~30 plików, §1.1).

| | **A — Three.js w webview + silnik Rust przez komendy Tauri** | **B — renderer w Rust (wgpu/Bevy lub inny) + przepisanie modeli** | **C — hybryda: A w fazie 1, B warunkowo w fazie 2** |
|---|---|---|---|
| Co się kopiuje/przepisuje | `render/**` (59 319 LOC) + 8 plików 3D poza `render/` (§1.4) po adaptacji importów; Three.js 0.169.0 | Cała geometria proceduralna + tekstury `CanvasTexture` + sprite'y + picking + mgła przez kolor + bitwa 3D + miniatury + wonderpreview | Jak A; Rust dostaje DTO, a wybrane fragmenty (np. teren) mogą przejść w fazie 2 |
| Koszt wdrożenia | **Średni–wysoki.** Kopia plików ze zmianą importów + refaktor 17 plików importujących logikę (§3.3) + decyzja o zakresie 3D bitwy (D-REND-8). Czas: NIE_ZMIERZONO | **Wyższy niż A** o cały zakres przepisania na inny silnik (rozmiar: te same 59 319 + 23 372 LOC do odtworzenia). Odpowiedniki prymitywów (`CanvasTexture`, `Sprite`, `InstancedMesh`, mgła przez kolor) w wybranym silniku Rust — **NIE_ZMIERZONO** (nie zbadano ekosystemu; nie twierdzę ani że są, ani że nie ma) | Jak A w fazie 1; faza 2 warunkowa, koszt NIE_ZMIERZONO |
| Ryzyko 1:1 (wizualnie) | **Niskie** w zakresie `render/**` (ten sam kod, ten sam Three.js); różnice wynikają z webview (Chromium vs WebView2/WebKit — NIE_ZMIERZONO) | **Wysokie** — każda różnica oświetlenia, materiałów, AA, tekstu w canvas, mgły to nowy finding w P8 | Niskie w fazie 1 |
| Ryzyko „drugiej uproszczonej gry” | **Średnie**, jeśli nie zrobi się granicy DTO (§3.3). Przy DTO — niskie | **Wysokie** — przepisywanie bryły „na oko” jest dokładnie tym, co zakazuje plan (§1 pkt 4) | Niskie przy DTO |
| WebGL w webview docelowych | Web **zakłada WebGL2**: `perfTestPanel.ts:177` („WebGL 2 — Nowoczesny render dostępny”), `perfTestPanel.ts:185` („gra działa na WebGL 2”). Wsparcie WebGL2 w WebView2 (Win) i WebKit (macOS/Linux): **NIE_ZMIERZONO**. Mapa web bez try/catch przy braku WebGL (`scene.ts:1599–1626`, §1.1) | Brak zależności od przeglądarki (natywny GPU); wymaga okna natywnego/overlay pod HUD-DOM | Jak A |
| Fallback bez WebGL | Mapa: **brak** (`scene.ts:1624`). Miniatura jednostki: **tak** — tekst zamiast 3D (§6, D-REND-5) | Zależy od projektu; NIE_ZMIERZONO | Jak A |
| Wydajność | Taka jak web (ten sam pipeline); IPC na klatkę zerowe, jeśli DTO zmienia się rzadko | Potencjalnie lepsza — NIE_ZMIERZONO | Start jak A; B tylko po wyniku P10 |
| Picking | Raycast w webview (`picker.ts:192`), wynik hexa → Rust; `worldToAxial` (`picker.ts:49`) można przenieść do Rust | W Rust (natywnie) | Jak A |
| Test screenshotowy (P4.14) | Playwright na buildzie web możliwy (P1.9, `P1-9-MAP-HUD-PANELS.md` §1). Sterowanie webview Tauri — NIE_ZMIERZONO | Nowy harness od zera | Jak A |
| Zgodność z zasadą „Rust trzyma stan” | Tak, przy DTO | Tak | Tak |
| Wpływ na HUD/UI (117 plików `.ts` w `ui/`, `git ls-tree` + `grep -c '\.ts$'` → 117) | Brak — HUD w DOM w webview | Wymaga warstwy overlay albo nadal webview | Jak A |

**Rekomendacja:** **C (start jak A).** Uzasadnienie: (1) cel P4 to 1:1, a jedynym źródłem wizualnej prawdy jest istniejący kod Three.js; (2) B przepisuje ~83 000 LOC plików (`render/` + 3D poza nim) na nowy silnik przed ustaleniem kontraktu P2 — ryzyko „drugiej gry”; (3) granica DTO (Rust = stan, webview = rysowanie) spełnia zasady projektu; (4) decyzja o B zapada po pomiarze P10. **Rekomendacja nie jest rozstrzygnięciem** — wymaga D-REND-1..3 i D-REND-8.

Warunek przyjęcia rekomendacji: **D-REND-2** (granica DTO), **D-REND-3** (picking) i **D-REND-8** (zakres 3D poza `render/`) rozstrzygnięte przed P4.6.

---

## 5. Co dalej

- Przed P4.6: zamknąć `D-REND-1..3` i `D-REND-8`. Bez tego nie wiadomo, czy DTO istnieje (P2), gdzie leży picking i czy 3D bitwy jest w zakresie P4.
- P4.14 (test) wymaga decyzji `D-REND-6` (harness).
- P4.11 (assety) nie dotyczy modeli 3D (brak plików), dotyczy ikon/portretów/muzyki z P1.11.

---

## 6. Decyzje właściciela `D-REND-n` (NIE rozstrzygane po cichu)

- **D-REND-1 — Gdzie żyje renderer mapy.** Opcje: A, B, C (§4). Rekomendacja operatora: **C**.
- **D-REND-2 — Granica DTO.** Czy render czyta wyłącznie model widoku z Rust (rekomendowane), czy dopuszczamy importy logiki z `game/`/`map/`/`units/` po wydzieleniu czystych helperów. Dotyczy **17 plików** z §3.3 (typy i wartości rozdzielone tam, gdzie to możliwe).
- **D-REND-3 — Picking.** Hit-test w webview (Raycaster na `InstancedMesh`, wynik hex → Rust) czy w Rust (matematyka `pixelToHex` bez raycastu)? Czy zachowujemy ten sam algorytm co web (`picker.ts`), co daje identyczne wyniki kliknięć.
- **D-REND-4 — Modele proceduralne.** Zostają w TS (A/C) czy przepisywane do Rust (B)? Dotyczy ok. 30 plików modeli i 59 319 LOC `render/**`.
- **D-REND-5 — Minimalny poziom GPU/WebGL.** Mapa web nie ma fallbacku (`scene.ts:1624`, brak try/catch). Miniatura jednostki ma fallback tekstowy: `ui/unitMiniPreview.ts:55,91` (`catch` → `null`), `ui/unitInfoCard.ts:74` („Render 3D niedostępny w tym środowisku”), styl `unitInfoCard.ts:362,397-398` i token `--tg-render-fallback` (`ui/icons/brand/tokens.css:40`). Dodatkowo `ui/entityCards/renderer.ts:1138` zawiera komentarz „FALLBACK bez WebGL” — treść tej ścieżki NIE_ZMIERZONO. Pytanie: akceptujemy brak mapy na urządzeniu bez WebGL2 (zgodnie z webem) czy wymagamy trybu zastępczego?
- **D-REND-6 — Harness do testu 1:1 (P4.14).** Playwright na buildzie web (jak P1.9), test w webview Tauri (WebDriver), czy oba? Wpływa na koszt P4.14. Dotyczy też resize/fullscreen (`scene.ts:3112/3117`, P1-10 §3).
- **D-REND-7 — Martwy kod „Minecraft”.** Dotyczy **wyłącznie** `minecraftScene.ts` (0 importerów) i `robloxScene.ts` (tylko re-eksport, 0 importerów). Pliki **żywe** (`robloxCity.ts`, `robloxImprovements.ts`, `bronzeCityRoblox.ts`, `stoneCityRoblox.ts`, `styleResources.ts`; §1.2) **nie są przedmiotem tej decyzji i nie są kandydatami do usunięcia**. Pytanie: czy `minecraftScene.ts` i `robloxScene.ts` są w zakresie portu (P1 1:1 ich nie wymaga, bo nie są wywoływane), czy wyłączamy je z katalogu? Wymaga potwierdzenia właściciela, bo mogą być celowym trybem zachowanym w kodzie.
- **D-REND-8 — Zakres Three.js poza `render/**`.** Czy w zakresie P4 (renderer mapy) są: 3D bitwa ręczna (`battle/battleScene.ts`, `battle/manualBattle.ts`, `battle/siegeWall.ts`), podgląd cudów (`wonderpreview/main.ts`), miniatury jednostek (`ui/unitMiniPreview.ts`), sonda/test w `ui/perfTestPanel.ts`? Jeśli nie — w jakim temacie (P5/P8) są rozliczane? Dotyczy 8 plików i ok. 23 372 LOC (§1.4, §4).

---

## 7. Lista niezmierzonych (`NIE_ZMIERZONO`)

1. Podział LOC `render/**` na kategorie (nie wnioskuję z nazw).
2. Pełne pokrycie unikalnych modeli jednostek (ile z typów ma dedykowaną bryłę, a ile fallback).
3. Źródło `url` w `unitOwnerEmblem.ts:317-320`.
4. Które z 17 importów logiki (§3.3) to czysta matematyka/typy, a które reguły.
5. Wsparcie WebGL2 w WebView2/WebKit (wiedza zewnętrzna; w repo jest tylko założenie webu: `perfTestPanel.ts:177,185`).
6. Lokalizacja `main.js` i frontendu Tauri w HEAD (§3.4).
7. Wydajność A vs B (brak pomiaru; P10).
8. Czy Playwright może sterować webview Tauri (§4, P4.14).
9. Czas/estymacja kosztu A i B (dni/tygodnie) — brak metody w tej rundzie; podane są tylko rozmiary plików.
10. Odpowiedniki prymitywów Three.js (`CanvasTexture`, `Sprite`, `InstancedMesh`, mgła przez kolor) w silnikach Rust — nie zbadano.
11. Zachowanie mapy web przy braku WebGL w runtime (brak try/catch w `scene.ts:1599–1626` — wnioskowane z kodu, nie uruchomione).
12. Treść ścieżki „FALLBACK bez WebGL” w `ui/entityCards/renderer.ts:1138`.
13. Udział linii 3D w `main.ts` (39 350 LOC).

---

## 8. Metoda

- Odczyt wyłącznie przez `git show edb8fb56:…`, `git grep … edb8fb56 -- gra/src` i `git ls-tree -r --name-only edb8fb56 -- …`. Zero checkoutu `gra/`, zero `npm`.
- Pliki `render/**`: `git ls-tree -r --name-only edb8fb56 -- gra/src/render` → 88.
- Importy `three` w `render/**`: `git grep -l "from 'three" edb8fb56 -- gra/src/render` → 80; poza `render/` → 8 (`git grep -l -E "from ['\"]three" edb8fb56 -- gra/src`, minus `render/`).
- Importy logiki z `render/**`: `git grep -n -E "from ['\"]\.\./(game|map|units)/" edb8fb56 -- gra/src/render` → 17 plików.
- Pliki UI: `git ls-tree -r --name-only edb8fb56 -- gra/src/ui | grep -c '\.ts$'` → 117.
- Martwe moduły: `git grep -n 'minecraftScene'` / `'robloxScene'` na `edb8fb56` — tylko własne pliki.
- Komendy poprawiono w tej rundzie (zarzuty 1, 3, 7): poprzednie wyliczenia 88/12/105 odrzucono.
