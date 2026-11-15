# P4.0 — Architektura renderera mapy: stan faktyczny, opcje, decyzje właściciela

**Temat:** R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1 · **Domena:** GAME · **Rola:** Operator (runda 3/5, obrona zarzutów Evaluatora r3 1–16)
**Pin web (referencja read-only):** `edb8fb56` (`git show edb8fb56:<ścieżka>`, `git grep ... edb8fb56 -- gra/src`)
**Historia dokumentu (SHA rozwiązywalne w repo):** r1 `cc694ac2e`, r2 (obrona 1–11) `fdad7bfc0`, oba na bazie `de46210b2`; r3 (ten stan) na bazie `origin/claude/rust-sivvrn` @ `ad14b7fbd`. SHA `f24c91e0` i `25a49386` z `LEDGER.md:111` nie istnieją w repo (`git cat-file -t f24c91e0` → `fatal: Not a valid object name`); treściowo odpowiadają im `cc694ac2e` i `fdad7bfc0` (`git log --all -- dyspozycje/autobot/runs/R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1`).
**Zakres:** wyłącznie odczyt i projekt. Zero kodu, zero buildu, zero zmian w `gra/**` i `rust-port/**`. `npm run build/dev` nie uruchamiano.

**Legenda dowodów:** `plik:linia` = odczyt `git show edb8fb56:<plik>` / `git grep ... edb8fb56` (dla `gra/src/**`; ścieżki w tabelach są względne wobec `gra/src/`); „cmd → wynik” = wklejony wynik komendy. Odwołania do dokumentów `dyspozycje/**` podają numer linii **na `ad14b7fbd`**, chyba że wskazano inny commit. `NIE_ZMIERZONO` = nie sprawdzono (nie wnioskuję z nazw).

---

## S. STATUS: SUPERSEDED — stan decyzji `D-REND-n` (aktualizacja r3, 2026-11-15)

**Ten dokument jest zapisem historycznym analizy z 2026-10-21.** Wszystkie decyzje `D-REND-1..8` zostały rozstrzygnięte przez właściciela, a D-REND-1 i D-REND-3 następnie **zmienione**. Rekomendacja „C (start jak A)” z §4 i lista „do zamknięcia przed P4.6” z §5 **nie obowiązują**. Fakty o webie (§0–§3) pozostają ważne jako opis pinu `edb8fb56` i jako wejście do tematów P4-3+.

| Decyzja | Rozstrzygnięcie pierwotne (`LEDGER.md:112,113`) | Stan obowiązujący | Dowód |
|---|---|---|---|
| D-REND-1 (gdzie renderer) | Three.js w webview Tauri | **Renderer w Rust (wgpu), modele 3D odtwarzane w Rust**; D-RR-1 = A (wgpu bezpośrednio), D-RR-2 = A (powierzchnia wgpu pod przezroczystym webview) | `LEDGER.md:117`, `:123` |
| D-REND-2 (granica DTO) | A — renderer czyta wyłącznie DTO z Rust | **Przestaje obowiązywać dla renderera** (renderer jest w Rust). UI w webview nadal wymaga kontraktu: UI-Q1 = A (kopia paneli weba + Vite) z bramką `src-tauri/frontend-v2/tools/check-no-logic-imports.mjs` | `LEDGER.md:117`, `:134`; `git ls-tree -r --name-only origin/rust-port/parity-v2 \| grep check-no-logic-imports` → `src-tauri/frontend-v2/tools/check-no-logic-imports.mjs` |
| D-REND-3 (picking) | A — raycast w webview (`input/picker.ts`) | **Picking w Rust (piksel→hex)**; domyślne orkiestratora D-RR-3 = CPU picking odtwarzający dziwactwa weba 1:1 | `LEDGER.md:117`, `:123` |
| D-REND-4 (modele proceduralne) | zostają w TS (zamknięte przez D-REND-1 z `:112`) | **Odtwarzane w Rust** (konsekwencja zmiany D-REND-1); katalog: `p4/P4-4-MODEL-CATALOG.md` | `LEDGER.md:112`, `:117`, `:127` |
| D-REND-5 (minimalny GPU) | — | Domyślne orkiestratora D-RR-5 = komunikat „brak GPU”, bez trybu software | `LEDGER.md:123` |
| D-REND-6 (harness 1:1) | — | Przeniesione do D-RR-6 (metryka 1:1) rozstrzyganej w RR-T11 | `LEDGER.md:123` |
| D-REND-7 (martwy kod) | — | D-RR-8 = A: portowany tylko styl `roblox`; `minecraftScene.ts`/`robloxScene.ts` poza zakresem | `LEDGER.md:123` |
| D-REND-8 (Three.js poza `render/`) | B — cały 3D (bitwa, cuda, miniatury) w P4 | **Bez zmian (B)** | `LEDGER.md:113`, `:117` |

**Stan Git potwierdzający zmianę:** `git ls-tree --name-only origin/rust-port/parity-v2 rust-port/renderer/src/` → `assets battle camera.rs cities core decor geom gpu.rs jsmath labels lib.rs material.rs models.rs models overlays.rs pick raster scene terrain text.rs units view.rs` (parity-v2 @ `95930b446`). Na `ad14b7fbd` istnieją dokumenty `p4/P4-3-RUST-RENDERER-ARCH.md` … `p4/P4-36-MOD14-BATTLE-3D.md` (`ls dyspozycje/rust-port/p4/` → 36 plików). P4.1 (DTO dla Three.js) i P4.2 (szkielet Three.js) — **unieważnione** (`LEDGER.md:117`).

**Konsekwencja dla czytelnika:** sekcje §4–§6 czytać jako uzasadnienie historyczne. Fakty z §1–§3 (picking jednostek przed terenem, wejścia rastrowe emblematów, mgła matrix-hide + instanceColor, sprzężenie `render/** → input/picker`) są wymaganiami 1:1 dla renderera Rust.

---

## 0. Sprostowanie

Wcześniejsze twierdzenie orkiestratora, że „mapa 3D to tylko płaskie assety 2D”, było **błędne**. Stan faktyczny na pinie `edb8fb56`:

- Mapa web jest renderowana w **3D** przez **Three.js** (`gra/package.json:14` `"three": "^0.169.0"`; `gra/package-lock.json:1586-1588` → `three` `0.169.0`).
- Kamera: `THREE.PerspectiveCamera` (`gra/src/render/scene.ts:3078`; typ `gra/src/render/camera.ts:62`).
- Renderer: `THREE.WebGLRenderer` (`gra/src/render/scene.ts:1624`).
- `gra/src/render/**`: **88 plików** (`git ls-tree -r --name-only edb8fb56 -- gra/src/render | wc -l` → 88), **59 319 linii** (`git grep -c ''` i suma). Największe: `units.ts` 6 779, `scene.ts` 3 760, `mapRenderStyle.ts` 1 996, `jednostki-z3-plemiona.ts` 1 994.
- Modele 3D jako zasoby: 0 plików glb/gltf/fbx/obj (P1.11 §2/§5, `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`). Geometria jest **proceduralna**.

Płaskie assety 2D to ikony SVG (307), portrety JPG (45), hero PNG (2), muzyka MP3 (62) — P1.11 §2. Nie są **geometrią** mapy, ale część z nich jest **wejściem renderera mapy**: portret JPG władcy i sigile SVG są rysowane do tekstur `CanvasTexture` emblematów jednostek i plakietek miast (§1.3).

---

## 1. Co dziś rysuje mapę (pytanie 1)

### 1.1 Stos renderingu

| Element | Dowód | Uwagi |
|---|---|---|
| Wersja Three.js | `gra/package.json:14`; lock `1586-1588` → 0.169.0 | Pin w lockfile |
| Renderer | `scene.ts:1624` `new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' })` | W `buildScene` (`scene.ts:1579`; tworzenie renderera `:1624`) **brak lokalnego try/catch**. Wyjątek jest jednak łapany wyżej: `buildScene` jest wołane w `main.ts:1883` wewnątrz `async function boot()` (`main.ts:1661`), której `try` zaczyna się w `:1662`, a `catch (err)` w `:39341` woła `showErr('FATAL: ' + …)`. Brak WebGL = **ekran FATAL**, nie niezłapany wyjątek; **trybu zastępczego mapy brak** (odczyt kodu, nie uruchomienie) |
| Pixel ratio | `scene.ts:1626`; `:3239` `effectivePixelRatio(...)` | Zależne od presetu wydajności |
| Kamera | `scene.ts:3078` `PerspectiveCamera`; `camera.ts` klasa `CameraController` | Yaw stały (`camera.ts:66`, `:123`); pan (drag, próg `DRAG_THRESHOLD_PX = 6`, `camera.ts:25`), zoom kółkiem (`camera.ts:218-219`), WASD i edge-pan (`camera.ts:247`) |
| Siatka hex (geometria) | `hexutil.ts:24` `HEX_R = 1.0`; `:32` `axialToWorld`; `:53` `worldToAxial`; `hexShape.ts` (kontur pointy-top w XZ) | `hexutil.ts` NIE importuje three (czysta matematyka) |
| Teren | `scene.ts:367` „InstancedMesh terenu — raycast pickingu heksów” | Prizmy terenu jako `InstancedMesh` |
| Mgła wojenna | **Obiekty** (jednostki, miasta, dekoracje): `fogDim.ts:16` `fogBrightnessForHex`, `:29` `applyFogDimToObject3D` (mnożenie `material.color`, `:38-41`). **Instancje terenu:** `scene.ts:1851` („Fog: matrix-hide (nieodkryte/miasto) + instanceColor-dim (explored)”), funkcja `applyTerrainFog` zdefiniowana w `scene.ts:3281` (wywołania m.in. `:3372`, `:3374`, `:3389`). Stan: `scene.ts:335-350` (`visible`/`explored` jako `Set<"q,r">`) | Mgła nie jest osobną warstwą: dla obiektów = mnożenie koloru materiału; dla terenu = ukrycie instancji przez macierz (nieodkryte/pod miastem) + przyciemnienie `instanceColor` (odkryte, niewidoczne) |
| Rzeki | `riverLod.ts`, `scene.ts:277` `interface RiverGeoBucket` (wstęgi `BufferGeometry`) | |
| LOD | `zoomLod.ts`; definicje `scene.ts:3237` `applyZoomGpuSettings`, `:3248` `applyZoomLodDecor` (wywołania m.in. `:3518`, `:3519`) | Dekoracje ukrywane wg zoomu |
| Jednostki | `units.ts` — klasa `UnitRenderer`, `sync(units, stackDisplay?, dimmedUnitIds?)` (`units.ts:6038-6041`) | §2 |
| Miasta | `cities.ts` (`CityRenderOptions`, `:277-300`: `getEra`, `getCiv`, `getLevel`, `getWalls` — callbacki do stanu) | |
| Cuda na mapie | `wonderRenderer.ts` (importuje `GameMap` z `../types/map`, `:5`); bryły w `wonderModels.ts` (ten sam moduł używa `wonderpreview/main.ts:10`, §1.4) | Pominięte w tabeli r2 (zarzut r3-11) |
| Nakładki | `rangeOverlay.ts`, `tradeRoutesOverlay.ts`, `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts`, `siegeMarker.ts`, `siegeCampSync.ts` | |
| Etykiety/plakietki | `unitStatPlate.ts`, `unitOwnerEmblem.ts` (`THREE.Sprite`, `:43-45`), `cityMapStatChip.ts`, `unitVeteranBadges.ts`, `unitUpgradeBadges.ts` | Tekstury z `<canvas>` |
| Picking | **Dwa etapy** (`main.ts:1894-1901` `pickMapTarget`): (1) **jednostki najpierw** — `unitRenderer.pickUnitIdAt(clientX, clientY, canvas, camera)` (`main.ts:1895`; metoda `units.ts:5867`, raycast w modele jednostek); trafienie → heks jednostki; (2) dopiero potem teren — `pickHexAt` (`main.ts:1885-1891`) → `input/picker.ts:175` `pixelToHex` (`THREE.Raycaster` `:192`, `intersectObjects` na meshach terenu `:196`, fallback płaszczyzną `:234`; `worldToAxial` `:49`), z callbackiem wysokości jednostek `unitRenderer.topYAt(q, r)` (`main.ts:1889`). Osobno: `pickVeteranBadgeUnitIdAt` (`units.ts:5900`, wołane w `main.ts:26235`) dla plakietek weterana | Sam `picker.ts` **nie** odtwarza wyników kliknięć weba — potrzebne są oba etapy i wysokości jednostek (zarzut r3-7) |

**Liczba plików `render/**` wg kategorii:** podział na kategorie i LOC per kategoria — NIE_ZMIERZONO w tym dokumencie (nie wnioskuję z nazw). Liczba „ok. 30 plików modeli” z r2 była wnioskiem z nazw i **została usunięta** (zarzut r3-11). Jedyna metryka zmierzona tu to metryka **szeroka i niekategoryzująca**: pliki `render/*.ts` z deklaracją `export function build…` **oraz** `new THREE.Group()` (`grep -lE "^export (async )?function build" *.ts | xargs grep -l "new THREE.Group()" | wc -l` na `git archive edb8fb56 gra/src` → **62**); obejmuje ona także nakładki i scenę (np. `rangeOverlay.ts`, `scene.ts`, `tradeRoutesOverlay.ts`), więc **nie** jest liczbą plików modeli. Pełny katalog modeli z regułami zliczania: `dyspozycje/rust-port/p4/P4-4-MODEL-CATALOG.md` §0–§1.

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
- Liczby linii (pomiar dokładny, nie przybliżenie; `wc -l` na `git archive edb8fb56 gra/src`):
  - wzorzec nazw `roblox*.ts` + `minecraft*.ts` (z prefiksem): `robloxCity.ts` 294 + `robloxImprovements.ts` 484 + `robloxScene.ts` 12 + `minecraftScene.ts` 11 = **801**;
  - wzorzec bez rozróżniania wielkości liter i pozycji (`ls | grep -i -E "roblox|minecraft"`) dodaje `bronzeCityRoblox.ts` 437 + `stoneCityRoblox.ts` 471 → razem **1 709** (6 plików);
  - `styleResources.ts` (499) nie pasuje do żadnego wzorca nazw, choć jest żywym plikiem stylu.

Zakres D-REND-7 (§6) jest więc **wyłącznie** `minecraftScene.ts` i `robloxScene.ts`.

### 1.3 Ważne fakty o kodzie renderera

- Tekstury to `CanvasTexture` z `<canvas>` (`cities.ts:718`, `cityMapStatChip.ts:1076`, `cityOkolicaOverlay.ts:210`, `siegeMarker.ts:46`, `unitOwnerEmblem.ts:349`, `unitStatPlate.ts:437`); brak `TextureLoader`/`GLTFLoader` (grep: brak trafień dla `GLTFLoader|OBJLoader|FBXLoader|TextureLoader|DRACOLoader` w `gra/src`). **Ale** na część tych canvasów rysowane są pliki rastrowe i SVG z assetów (niżej) — sformułowanie r2 „tekstury nie są plikami” było nieścisłe (zarzut r3-6).
- Ładowanie obrazów w `render/`: jedna funkcja `loadImageInto(url, onReady)` (`unitOwnerEmblem.ts:315-321`: `new Image()`, `img.src = url`), wołana przez **3 pliki** (`git grep -l loadImageInto edb8fb56 -- gra/src/render` → `unitOwnerEmblem.ts`, `cityMapStatChip.ts`, `unitUpgradeBadges.ts`):
  - **portret JPG władcy** na emblemacie jednostki: `unitOwnerEmblem.ts:386-388` `assets.leaderPortraitUrl(civ, octx.era)` → `loadImageInto(portrait, …)`; implementacja wstrzykiwana z `main.ts:8527` (`leaderPortraitUrl: (civId, era) => leaderPortraitUrl(civId, era)`), źródło `ui/leaderPortraits.ts:172` `import.meta.glob('../assets/portrety/*.jpg', …)`, funkcja `:195`;
  - **SVG przez `svgToDataUri`**: `unitOwnerEmblem.ts:368` (barbarzyńcy), `:378` (miasto-państwo), `:407` (sigil cywilizacji); `unitUpgradeBadges.ts:336`; `cityMapStatChip.ts:286` (`loadImageInto(src, …)` we wspólnej kolejce, gdzie `src` to `svgToDataUri` sigilu `:601` lub ikony produkcji `:651`, **albo portret władcy** `:624-626` — setter `setCityMapBadgeLeaderPortrait` `:338`, podpięty w `main.ts:8532`).
  - Wniosek dla portu: portrety JPG i sigile SVG z P1.11 są **wejściem renderera mapy**, nie tylko UI. „Źródło `url` NIE_ZMIERZONO” z r2 zostaje usunięte (zmierzone wyżej).
- Ikony/zasoby przez `import.meta.glob` z `ui/` — P1.11 §4 (`src/ui/icons/brandAssets.ts:23`).

### 1.4 Three.js poza `render/**` (zarzut 2)

`git grep -l -E "from ['\"]three" edb8fb56 -- gra/src` → **88 łącznie = 80 w `render/` + 8 poza nim** (r2 błędnie pisało tu „88 w `render/`”; zarzut r3-2):

| Plik (pin `edb8fb56`) | Linie pliku (`git grep -c ''`) | Użycie Three.js (dowód) |
|---|---:|---|
| `gra/src/battle/battleScene.ts` | 19 493 | `WebGLRenderer` `:3304`; `PerspectiveCamera(48,…)` `:3336`; `Raycaster` `:8579`; import `buildUnitModel` z `render/units` `:104`; import typu `BronzeCiv` `render/bronzeCity` `:117` |
| `gra/src/battle/manualBattle.ts` | 1 433 | `WebGLRenderer` `:567`; `PerspectiveCamera(48,…)` `:584`; `Raycaster` `:452`; import `render/hexutil` `:35`, `render/units` `:36` |
| `gra/src/battle/siegeWall.ts` | 1 047 | import `three` + typ `BronzeCiv` z `render/bronzeCity` `:17` |
| `gra/src/input/picker.ts` | 278 | `Raycaster` `:192`; wynik `InstancedMesh` z `scene.ts` (`:29`). Importy pliku: tylko `three` (`:20`) i typ `RuntimeUnit` (`:21`). **Odwrotnie** `render/**` importuje z niego: `cities.ts:44` i `units.ts:28` (`clientRectToNdc`), `scene.ts:123` (`refreshInstancedPickBounds`) — zależność jednokierunkowa, bez cyklu (§3.3) |
| `gra/src/main.ts` | 39 350 (plik mieszany, nie wszystkie linie 3D) | importy `render/**` m.in. `:60` (`buildScene`), `:151` (`CameraController`), `:155` (`UnitRenderer`), `:150` (`fogDim`), `:465`, `:629-657` (cities, siege, overlays) |
| `gra/src/ui/perfTestPanel.ts` | 677 | `WebGLRenderer` `:299-301` (test kontekstu i sonda); sonda `det.webgl2` `:176` (etykieta „WebGL 2” `:177`) |
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

- **Proceduralnie, w kodzie.** `jednostki-p1-rdzen.ts` (7 eksportów), `jednostki-z1-mezopotamia.ts` (4), `units.ts` (klasa `UnitRenderer`, importowana przez `main.ts:155`). Bryły: `THREE.Mesh`/`BufferGeometry`; `mergeGeometries` z `three/examples/jsm/utils/BufferGeometryUtils.js` w **2 plikach** `render/**`: `scene.ts:32` i `riverLod.ts:30` (`git grep -l mergeGeometries edb8fb56 -- gra/src/render` → `riverLod.ts`, `scene.ts`).
- **Routing jednostka → model:** `units/setup.ts:239` `categoryOf(name, role, isSuper, typ)` (słowa kluczowe, `setup.ts:240-251`) jest wołane **w logice** przy tworzeniu jednostki; wynik trafia do gotowego pola `RuntimeUnit.category` (`setup.ts:44-45`). Renderer **nie** importuje `categoryOf` — czyta tylko pole (`units.ts:36` `import type { RuntimeUnit }`; w `render/**` `categoryOf` występuje wyłącznie w komentarzach, np. `units.ts:89`, `:110`, `:1078`). `units.ts` ma `switch` po kategorii (`case 'domyslny'` `units.ts:4762`). Uwaga: `categoryOf` importuje Three.js-owa miniatura `ui/unitMiniPreview.ts:6` (wołanie `:87`) — to plik spoza `render/**` (§1.4).
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
| Mapa / teren | `buildScene(map: GameMap, canvas, …)` (`scene.ts:1579`; odczyt `map.hexes` np. `:1592`) → `SceneResult` (`scene.ts:335-350`). Typ `GameMap` z `../types/map` importuje **13 plików** `render/**` (`git grep -l "types/map" edb8fb56 -- gra/src/render \| wc -l` → 13: `cities`, `cityOkolicaOverlay`, `countSceneOverlayCandidates`, `mapRenderStyle`, `minecraftScene`, `rangeOverlay`, `robloxScene`, `scene`, `siegeMarker`, `tradeRoutesOverlay`, `units`, `wonderRenderer`, `workerFieldOverlay`). (r2 błędnie wskazywało `scene.ts:1279` — to parametr `onSlice` funkcji rzecznej `renderLandRiversFromPaths`, `scene.ts:1266`; zarzut r3-3) | Generator mapy (`GameMap`) |
| Mgła | `scene.ts:~350` `visible`/`explored: Set<"q,r">` | Zbiory z logiki widoczności; z modułu `game/visibility` renderer importuje **wyłącznie stałą** `FOG_EXPLORED_BRIGHTNESS` (`fogDim.ts:7`, `scene.ts:75`) |
| Stan miast/obozów/oblężeń | `siegeCampSync.ts`, `siegeMarker.ts` | `game/siegeMachines` (§3.3) |
| Ulepszenia | `improvements.ts` | `game/terrain-improvements`, `map/road-network` (§3.3) |

### 3.2 Wyjście renderera (co render emituje) i porównanie z P2 (zarzut 8)

Render **nie emituje komend domenowych**. Zdarzenia użytkownika obsługuje `main.ts`; render dostarcza geometrię i trafienia:

| Zdarzenie | Miejsce | Komendy domenowe (kontrakt P2-5, `dyspozycje/rust-port/p2/P2-5-COMMANDS.md`) |
|---|---|---|
| Hit-test (jednostka, potem heks) | `main.ts:1894` `pickMapTarget` → `units.ts:5867` `pickUnitIdAt`, następnie `main.ts:1885` `pickHexAt` → `input/picker.ts:175` `pixelToHex` (§1.1) | (wynik pickera; sam nie jest komendą) |
| Klik na encję / heks (select) | `P2-8 §5` `onTileClick`; wiersz **U1** | `select_unit` (`unit_id: UnitId`) — U1 |
| Klik na heks = ruch | `main.ts:26036` `beginMoveSelectedUnitTo(destQ, destR)`; wiersz **U2** | `move_unit` (`unit_id`, `destination: HexCoord`) — U2 |
| **Klawisz B** na ostatnio najechanym/klikniętym heksie (nie klik) | `main.ts:36177` `if (e.key.toLowerCase() === 'b')`, `:36177–36205` → `tryFoundPlayerCityAt`; wiersz **B11** | `found_city` (alias B6) — B11 |
| Klik w bitwie ręcznej | `battleScene.ts` (onclick heks = ruch/atak); wiersz **W10** | akcje bitwy — W10 |
| Prawy klik | `main.ts:26209-26221` `contextmenu`: `preventDefault`, wyjścia wczesne (galeria/animacja/podsumowanie, `isPointOverCityPanelUi`), potem tylko `exitBuildMode()` **albo** `dismissPlayerUnitSelectionIfAny()` + `hideHexContextPanel()` | **Brak komendy domenowej** — wyłącznie warstwa UI (odczyt kodu; zastępuje NIE_ZMIERZONO z r2, zarzut r3-13) |
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

**Dokładne importowane symbole** (`grep -rn -E "^import .* from ['\"]\.\./(game|map|units)/" render` na `git archive edb8fb56 gra/src` → 26 linii jednowierszowych; importy wielowierszowe dociągnięte `grep -B8 "} from '../(game|map)/…'"`):

| Moduł | Symbole (plik:linia) | Rodzaj |
|---|---|---|
| `game/visibility` | `FOG_EXPLORED_BRIGHTNESS` (`fogDim.ts:7`, `scene.ts:75`) | stała |
| `units/setup` | `type RuntimeUnit` (`units.ts:36`), `hexDistance` (`cityOkolicaOverlay.ts:16`), `isWaterTerrain` (`countSceneOverlayCandidates.ts:9`) | typ + 2 helpery geometrii/terenu |
| `game/human-owners` | `HUMAN_OWNER_PRIMARY` (`units.ts:29`, `cities.ts:25`, `cityOkolicaOverlay.ts:15`) | stała |
| `map/road-network` | `ROAD_MASK_FULL` (`improvements.ts:14`, `robloxImprovements.ts:25`); `ROAD_ARM_WIDTH_RATIO`, `ROAD_NODE_RADIUS_RATIO`, `roadArmLength`, `roadMaskArms`, `roadMaskHasNode`, `roadMaskIsLonePatch`, `roadPortRotationY` (`droga-6-ramion.ts:39-47`) | stałe + geometria maski drogi |
| `game/siegeMachines` | `type SiegeMachineKind` (`siegeCampSync.ts:4`, `siegeCampModels.ts:6`, `siegeMarker.ts:8`) | typ |
| `game/production` | `type ProductionKind` (`cityMapStatChip.ts:7`), `type CityProduction, ProductionItem` (`cities.ts:39`), **`frontItem`** (`cities.ts:40`) | typy + 1 funkcja kolejki |
| `game/veteran` | **`veteranStarCount`**, `type VeteranProgress` (`unitVeteranBadges.ts:104`, `unitUpgradeBadges.ts:96`) | funkcja reguły (liczba gwiazdek) |
| `game/terrain-improvements` | **`improvementKeysForHex`** (`scene.ts:74`, `countSceneOverlayCandidates.ts:8`), **`hexHasCoveringTerrainImprovement`** (`cityOkolicaOverlay.ts:14`) | odczyt stanu ulepszeń |
| `game/okolica` | **`hexKeysWithinRadius`**, `type TileYield` (`cityOkolicaOverlay.ts:13`) | geometria + typ |
| `game/display-names` | **`formatCityMapLabel`** (`cities.ts:26`) | formatowanie etykiety |
| `game/cities`, `game/armyMerge` | `type City` (`cities.ts:24`), `type StackDisplayInfo` (`units.ts:37`) | typy |
| `map/gen-helpers` | **`climateZoneAt`** (`mapRenderStyle.ts:8`); **`landRiverRenderPath`, `mediumRiverRenderPath`, `trimMediumRenderPathAtMain`** (`scene.ts:118-122`) | funkcje mapy (strefa klimatu, ścieżki rzek) |
| `map/territory-border` | **`computeTerritoryBorderLoops`**, `type BorderLoopPoint` (`rangeOverlay.ts:9-12`) | geometria granic |
| `game/unit-building-bonuses` | **`armorPathBadgeLevel`**, **`softPathBadgeLevel`**, `type UnitBuildingProgress`, `type UnitPathBadgeLevel` (`unitUpgradeBadges.ts:90-95`) | funkcje reguły (poziom plakietki) |
| `game/building-stock-cost` | **`canAffordBuildingStock`** (`cities.ts:41-43`) | funkcja reguły (stać/nie stać) |

**Wniosek (poprawiony, zarzut r3-4):** wniosek r2 był przesadzony. Renderer **nie** importuje `categoryOf` (kategoria to gotowe pole `RuntimeUnit.category`, §2), a z `game/visibility` bierze tylko stałą jasności. Kopia `render/**` przeniosłaby do frontendu przede wszystkim **typy i stałe** oraz kilka **funkcji pochodnych od stanu** (pogrubione wyżej; reguły gry sensu stricto to m.in. `veteranStarCount`, `armorPathBadgeLevel`/`softPathBadgeLevel`, `canAffordBuildingStock`, `frontItem`; reszta to geometria/odczyt mapy). To one, a nie „logika domenowa” jako całość, wymagają wartości z modelu widoku albo czystych helperów po stronie renderera.

**Sprzężenie `render/** → input/picker` (zarzut r3-9, pominięte w r2):** `cities.ts:44` i `units.ts:28` importują `clientRectToNdc`, `scene.ts:123` importuje `refreshInstancedPickBounds` z `../input/picker`. `picker.ts` importuje tylko `three` (`:20`) i typ `RuntimeUnit` (`:21`) — zależność jest jednokierunkowa (bez cyklu), ale **kopia samego `render/**` bez `input/picker.ts` się nie zbuduje**. Dotyczy to opisu opcji A w §4 i zakresu D-REND-3.

### 3.4 Relacja z kontraktem P2 i zasadami planu (zarzut 11)

- `P2-2-GAMESTATE-CONTRACT.md:16` — `GameState` = wyłącznie stan rozgrywki, bez stanu renderu i UI. Stan potrzebny rendererowi musi być **osobnym modelem widoku (DTO)** generowanym z `GameState` w Rust.
- Zasada „zero lokalnej symulacji w JS/frontend” to **`PLAN-PORT-RUST-TAURI-20261020.md` §4, P5.13**: linia **`:284` na `ad14b7fbd`** (`grep -n "P5.13"` → `284:- P5.13 Podłączenie do kontraktu z P2 — zero lokalnej symulacji w JS/frontend.`); na `de46210b2` była to linia `:192` (plan rozrósł się o sekcje §0a–§0c). Zakaz „drugiej uproszczonej gry” to **§1 pkt 4** (`:117` na `ad14b7fbd`). Poprzednie odwołanie do P2.7 było błędne: P2.7 dotyczy serializacji save.
- `P2-8-TAURI-ADAPTER.md:59` — adapter Tauri renderuje wyłącznie stan z Rust. Frontend Tauri leży w **`src-tauri/`**, nie w `rust-port/` (r2 szukało w złej ścieżce; zarzut r3-5): `git show origin/rust-port/parity-v2:src-tauri/frontend/main.js | grep -n "game-map\|function renderGameState"` → `15:const gameMap = document.querySelector('#game-map');`, `712:function renderGameState(state) {`.
- `P1-17B-UI-CLASSIFICATION.md:12` twierdzi, że mapa po stronie Tauri to siatka DOM (`#game-map`, `role="grid"`). **Twierdzenie jest PRAWDZIWE:** `git show origin/rust-port/parity-v2:src-tauri/frontend/index.html | sed -n 244p` → `<div id="game-map" class="game-map" role="grid" aria-label="Mapa świata"></div>`. (Niezależnie potwierdził to P4.5: `LEDGER.md:120`.)
- **Precedens dla D-REND-2 (pominięty w r2):** `src-tauri/frontend-v2/` na `origin/rust-port/parity-v2` to kopia paneli UI weba + Vite (decyzja UI-Q1 = A, `LEDGER.md:134`) z bramką `src-tauri/frontend-v2/tools/check-no-logic-imports.mjs` (`git ls-tree -r --name-only origin/rust-port/parity-v2 | grep check-no-logic-imports`). Granica „frontend bez importów logiki” jest więc egzekwowana narzędziem dla UI — to ten sam mechanizm, którego wymagałaby opcja A dla renderera.

---

## 4. Opcje architektury (pytanie 4, zarzuty 9 i 10) — ZAPIS HISTORYCZNY

> **SUPERSEDED (§S):** tabela i rekomendacja poniżej to analiza z 2026-10-21. Właściciel wybrał najpierw A (`LEDGER.md:112-113`), a potem zmienił decyzję na **B — renderer w Rust (wgpu)** (`LEDGER.md:117`). Rekomendacja „C” **nie obowiązuje**. Poprawki r3 w tabeli dotyczą wyłącznie faktów o webie.

Legenda: „1:1” = zgodność wizualna z webem; „testy” = automatyczny i screenshotowy test (P4.14). Rozmiary w tabeli to rozmiar **plików** (LOC z §1.1 i §1.4), nie zmierzona liczba linii 3D; estymacja czasu jest **NIE_ZMIERZONO** w tej rundzie.

**Zakres do przeniesienia (rozmiar):**
- `render/**`: 88 plików, 59 319 LOC; 80 importuje three.
- Three.js poza `render/**`: 8 plików; suma LOC bez `main.ts` = 23 372 (`battleScene` 19 493 + `manualBattle` 1 433 + `siegeWall` 1 047 + `picker` 278 + `perfTestPanel` 677 + `unitMiniPreview` 155 + `wonderpreview` 289 — plik-rozmiar, nie linie 3D). `main.ts` 39 350 LOC, część 3D — udział NIE_ZMIERZONO.
- Modele proceduralne: liczba plików modeli w tym dokumencie NIE_ZMIERZONO (liczba „~30” z r2 usunięta jako wniosek z nazw, §1.1); katalog: `p4/P4-4-MODEL-CATALOG.md`.
- Do kopii w opcji A należy doliczyć `input/picker.ts` (278 LOC), bo `render/**` go importuje (§3.3).

| | **A — Three.js w webview + silnik Rust przez komendy Tauri** | **B — renderer w Rust (wgpu/Bevy lub inny) + przepisanie modeli** | **C — hybryda: A w fazie 1, B warunkowo w fazie 2** |
|---|---|---|---|
| Co się kopiuje/przepisuje | `render/**` (59 319 LOC) + 8 plików 3D poza `render/` (§1.4, w tym **wymagany** `input/picker.ts`) po adaptacji importów; Three.js 0.169.0; wejścia rastrowe (portrety JPG, sigile SVG, §1.3) | Cała geometria proceduralna + tekstury `CanvasTexture` + sprite'y + picking + mgła przez kolor + bitwa 3D + miniatury + wonderpreview | Jak A; Rust dostaje DTO, a wybrane fragmenty (np. teren) mogą przejść w fazie 2 |
| Koszt wdrożenia | **Średni–wysoki.** Kopia plików ze zmianą importów + refaktor 17 plików importujących logikę (§3.3) + decyzja o zakresie 3D bitwy (D-REND-8). Czas: NIE_ZMIERZONO | **Wyższy niż A** o cały zakres przepisania na inny silnik (rozmiar: te same 59 319 + 23 372 LOC do odtworzenia). Odpowiedniki prymitywów (`CanvasTexture`, `Sprite`, `InstancedMesh`, mgła przez kolor) w wybranym silniku Rust — **NIE_ZMIERZONO** (nie zbadano ekosystemu; nie twierdzę ani że są, ani że nie ma) | Jak A w fazie 1; faza 2 warunkowa, koszt NIE_ZMIERZONO |
| Ryzyko 1:1 (wizualnie) | **Niskie** w zakresie `render/**` (ten sam kod, ten sam Three.js); różnice wynikają z webview (Chromium vs WebView2/WebKit — NIE_ZMIERZONO) | **Wysokie** — każda różnica oświetlenia, materiałów, AA, tekstu w canvas, mgły to nowy finding w P8 | Niskie w fazie 1 |
| Ryzyko „drugiej uproszczonej gry” | **Średnie**, jeśli nie zrobi się granicy DTO (§3.3). Przy DTO — niskie | **Wysokie** — przepisywanie bryły „na oko” jest dokładnie tym, co zakazuje plan (§1 pkt 4) | Niskie przy DTO |
| WebGL w webview docelowych | Web **zakłada WebGL2**: sonda `perfTestPanel.ts:176` (`det.webgl2`), etykieta `:177` („WebGL 2 — Nowoczesny render dostępny”), `:185` („gra działa na WebGL 2”). Wsparcie WebGL2 w WebView2 (Win) i WebKit (macOS/Linux): **NIE_ZMIERZONO**. Brak WebGL w webie → wyjątek z `scene.ts:1624` łapany w `boot()` (`main.ts:1662`/`:39341`) → ekran FATAL (§1.1) | Brak zależności od przeglądarki (natywny GPU); wymaga okna natywnego/overlay pod HUD-DOM | Jak A |
| Fallback bez WebGL | Mapa: **brak trybu zastępczego** — ekran `FATAL` z `showErr` (`main.ts:39342`). Miniatura jednostki: **tak** — tekst zamiast 3D (§6, D-REND-5) | Zależy od projektu; NIE_ZMIERZONO | Jak A |
| Wydajność | Taka jak web (ten sam pipeline); IPC na klatkę zerowe, jeśli DTO zmienia się rzadko | Potencjalnie lepsza — NIE_ZMIERZONO | Start jak A; B tylko po wyniku P10 |
| Picking | Raycast w webview — **jednostki najpierw** (`units.ts:5867`), potem teren (`picker.ts:192`) z wysokościami jednostek (§1.1); wynik hexa → Rust | W Rust (natywnie); dla 1:1 musi odtworzyć oba etapy i `pickVeteranBadgeUnitIdAt` | Jak A |
| Test screenshotowy (P4.14) | Playwright na buildzie web możliwy (P1.9, `P1-9-MAP-HUD-PANELS.md` §1). Sterowanie webview Tauri — NIE_ZMIERZONO | Nowy harness od zera | Jak A |
| Zgodność z zasadą „Rust trzyma stan” | Tak, przy DTO | Tak | Tak |
| Wpływ na HUD/UI (117 plików `.ts` w `ui/`, `git ls-tree` + `grep -c '\.ts$'` → 117) | Brak — HUD w DOM w webview | Wymaga warstwy overlay albo nadal webview | Jak A |

**Rekomendacja z 2026-10-21 (NIEAKTUALNA — §S; obowiązuje B, `LEDGER.md:117`):** **C (start jak A).** Uzasadnienie historyczne: (1) cel P4 to 1:1, a jedynym źródłem wizualnej prawdy jest istniejący kod Three.js; (2) B przepisuje ~83 000 LOC plików (`render/` + 3D poza nim) na nowy silnik przed ustaleniem kontraktu P2 — ryzyko „drugiej gry”; (3) granica DTO (Rust = stan, webview = rysowanie) spełnia zasady projektu; (4) decyzja o B zapada po pomiarze P10. **Rekomendacja nie jest rozstrzygnięciem** — wymaga D-REND-1..3 i D-REND-8.

Warunek przyjęcia rekomendacji (historyczny): **D-REND-2** (granica DTO), **D-REND-3** (picking) i **D-REND-8** (zakres 3D poza `render/`) rozstrzygnięte przed P4.6 — **spełniony** decyzjami z `LEDGER.md:112-113`, potem zmieniony (`:117`).

---

## 5. Co dalej (aktualizacja r3)

- Lista „przed P4.6 zamknąć D-REND-1..3 i D-REND-8” z r2 jest **zamknięta** — wszystkie decyzje rozstrzygnięte (§S). Dalsze prace prowadzą tematy P4-3 (architektura renderera Rust) i następne (`dyspozycje/rust-port/p4/P4-3…P4-36`), kod w `origin/rust-port/parity-v2:rust-port/renderer/`.
- Fakty z tego dokumentu przydatne jako wymagania 1:1 dla renderera Rust: dwuetapowy picking (jednostki → teren, §1.1), wejścia rastrowe emblematów i plakietek (§1.3), mgła terenu matrix-hide + `instanceColor` vs mgła obiektów przez `material.color` (§1.1), zachowanie przy braku GPU w webie = ekran FATAL (§1.1).
- P4.11 (assety): portrety JPG i sigile SVG z P1.11 są **wejściem renderera mapy** (§1.3), nie tylko UI.

---

## 6. Decyzje właściciela `D-REND-n` — treść pytań z 2026-10-21 (wszystkie ROZSTRZYGNIĘTE, stan w §S)

- **D-REND-1 — Gdzie żyje renderer mapy.** Opcje: A, B, C (§4). Rekomendacja operatora z r1/r2: C. **Rozstrzygnięcie: najpierw A (`LEDGER.md:112`), zmienione na B — wgpu w Rust (`LEDGER.md:117`, D-RR-1 = A w `:123`).**
- **D-REND-2 — Granica DTO.** Czy render czyta wyłącznie model widoku z Rust (rekomendowane), czy dopuszczamy importy logiki z `game/`/`map/`/`units/` po wydzieleniu czystych helperów. Dotyczy **17 plików** z §3.3 (typy i wartości rozdzielone tam, gdzie to możliwe) oraz importu `input/picker` (§3.3). Precedens: bramka `check-no-logic-imports.mjs` dla UI w `src-tauri/frontend-v2/` (§3.4). **Rozstrzygnięcie: A (`LEDGER.md:113`); po zmianie D-REND-1 przestaje obowiązywać dla renderera (`:117`).**
- **D-REND-3 — Picking.** Hit-test w webview (Raycaster, wynik hex → Rust) czy w Rust (piksel→hex)? Uwaga r3: web ma **dwa etapy** — jednostki (`units.ts:5867` `pickUnitIdAt`) przed terenem (`picker.ts`), plus `pickVeteranBadgeUnitIdAt` (§1.1); sam algorytm `picker.ts` nie daje identycznych wyników kliknięć. **Rozstrzygnięcie: A (`LEDGER.md:113`), zmienione na picking w Rust (`:117`); domyślne D-RR-3 = CPU picking 1:1 (`:123`).**
- **D-REND-4 — Modele proceduralne.** Zostają w TS (A/C) czy przepisywane do Rust (B)? Dotyczy modeli w 59 319 LOC `render/**` (liczba plików modeli: `P4-4-MODEL-CATALOG.md`; „ok. 30” z r2 usunięte). **Rozstrzygnięcie: odtwarzane w Rust (konsekwencja `LEDGER.md:117`).**
- **D-REND-5 — Minimalny poziom GPU/WebGL.** Mapa web nie ma trybu zastępczego: wyjątek z `scene.ts:1624` kończy się ekranem `FATAL` z `boot()` (`main.ts:1662`/`:39341`). Miniatura jednostki ma fallback tekstowy: `ui/unitMiniPreview.ts:55,91` (`catch` → `null`), `ui/unitInfoCard.ts:74` („Render 3D niedostępny w tym środowisku”), styl `unitInfoCard.ts:362,397-398` i token `--tg-render-fallback` (`ui/icons/brand/tokens.css:40`). `ui/entityCards/renderer.ts:1138-1150` to **wyłącznie komentarz i reguła CSS** formatowania tekstu fallbacku (`font-size:11px`, zawijanie, specyficzność `(0,4,0)`) — nie osobna ścieżka renderu (odczyt kodu; zastępuje NIE_ZMIERZONO z r2). **Rozstrzygnięcie: domyślne D-RR-5 = komunikat „brak GPU”, bez trybu software (`LEDGER.md:123`).**
- **D-REND-6 — Harness do testu 1:1 (P4.14).** Playwright na buildzie web (jak P1.9), test w webview Tauri (WebDriver), czy oba? Dotyczy też resize/fullscreen (`scene.ts:3112/3117`, P1-10 §3). **Stan: przeniesione do D-RR-6 (metryka 1:1, RR-T11; `LEDGER.md:123`).**
- **D-REND-7 — Martwy kod „Minecraft”.** Dotyczy **wyłącznie** `minecraftScene.ts` (0 importerów) i `robloxScene.ts` (tylko re-eksport, 0 importerów). Pliki **żywe** (`robloxCity.ts`, `robloxImprovements.ts`, `bronzeCityRoblox.ts`, `stoneCityRoblox.ts`, `styleResources.ts`; §1.2) **nie są przedmiotem tej decyzji i nie są kandydatami do usunięcia**. Pytanie: czy `minecraftScene.ts` i `robloxScene.ts` są w zakresie portu (P1 1:1 ich nie wymaga, bo nie są wywoływane), czy wyłączamy je z katalogu? Wymaga potwierdzenia właściciela, bo mogą być celowym trybem zachowanym w kodzie. **Rozstrzygnięcie: D-RR-8 = A — portowany tylko styl `roblox`; `minecraftScene.ts`/`robloxScene.ts` poza zakresem (`LEDGER.md:123`).**
- **D-REND-8 — Zakres Three.js poza `render/**`.** Czy w zakresie P4 (renderer mapy) są: 3D bitwa ręczna (`battle/battleScene.ts`, `battle/manualBattle.ts`, `battle/siegeWall.ts`), podgląd cudów (`wonderpreview/main.ts`), miniatury jednostek (`ui/unitMiniPreview.ts`), sonda/test w `ui/perfTestPanel.ts`? Jeśli nie — w jakim temacie (P5/P8) są rozliczane? Dotyczy 8 plików i ok. 23 372 LOC (§1.4, §4). **Rozstrzygnięcie: B — cały 3D wchodzi do P4 (`LEDGER.md:113`), bez zmian po `:117`.**

---

## 7. Lista niezmierzonych (`NIE_ZMIERZONO`)

1. Podział LOC `render/**` na kategorie (nie wnioskuję z nazw; katalog modeli: `P4-4-MODEL-CATALOG.md`).
2. Pełne pokrycie unikalnych modeli jednostek (ile z typów ma dedykowaną bryłę, a ile fallback) — w tym dokumencie; zob. P4-4.
3. ~~Źródło `url` w `unitOwnerEmblem.ts:317`~~ — **ZMIERZONE w r3** (§1.3): data URI SVG (`svgToDataUri`) oraz URL portretu JPG z `ui/leaderPortraits.ts:172/:195`, wstrzykiwany z `main.ts:8527/:8532`.
4. ~~Które importy logiki to typy/stałe, a które reguły~~ — **ZMIERZONE w r3** dla wszystkich 17 plików na poziomie symboli (§3.3).
5. Wsparcie WebGL2 w WebView2/WebKit (wiedza zewnętrzna; w repo jest tylko założenie webu: `perfTestPanel.ts:176,177,185`). Po zmianie D-REND-1 na wgpu — nieistotne dla renderera mapy.
6. ~~Lokalizacja `main.js` i frontendu Tauri~~ — **ZMIERZONE w r3** (§3.4): `src-tauri/frontend/` i `src-tauri/frontend-v2/` na `origin/rust-port/parity-v2`.
7. Wydajność A vs B (brak pomiaru; P10).
8. Czy Playwright może sterować webview Tauri (§4, P4.14).
9. Czas/estymacja kosztu A i B (dni/tygodnie) — brak metody w tym dokumencie; wycena: `P4-3-RUST-RENDERER-ARCH.md` (`LEDGER.md:122`).
10. Odpowiedniki prymitywów Three.js w silnikach Rust — nie zbadano tutaj; zob. `P4-3-RUST-RENDERER-ARCH.md`.
11. ~~Zachowanie mapy web przy braku WebGL~~ — **ODCZYTANE Z KODU w r3** (§1.1): ekran FATAL przez `boot()` `main.ts:1662`/`:39341`. Nie uruchamiano (zakaz buildu weba).
12. ~~Treść „FALLBACK bez WebGL” w `ui/entityCards/renderer.ts:1138`~~ — **ODCZYTANE w r3** (§6 D-REND-5): komentarz + CSS `:1138-1150`.
13. Udział linii 3D w `main.ts` (39 350 LOC).

---

## 8. Metoda

- Odczyt wyłącznie przez `git show edb8fb56:…`, `git grep … edb8fb56 -- gra/src` i `git ls-tree -r --name-only edb8fb56 -- …`. Zero checkoutu `gra/`, zero `npm`.
- Pliki `render/**`: `git ls-tree -r --name-only edb8fb56 -- gra/src/render` → 88.
- Importy `three` w `render/**`: `git grep -l "from 'three" edb8fb56 -- gra/src/render` → 80; poza `render/` → 8 (`git grep -l -E "from ['\"]three" edb8fb56 -- gra/src`, minus `render/`).
- Importy logiki z `render/**`: `git grep -n -E "from ['\"]\.\./(game|map|units)/" edb8fb56 -- gra/src/render` → 17 plików.
- Pliki UI: `git ls-tree -r --name-only edb8fb56 -- gra/src/ui | grep -c '\.ts$'` → 117.
- Martwe moduły: `git grep -n 'minecraftScene'` / `'robloxScene'` na `edb8fb56` — tylko własne pliki.
- Komendy poprawiono w r2 (zarzuty 1, 3, 7): poprzednie wyliczenia 88/12/105 odrzucono.
- **r3 (2026-11-15):** odczyt pinu przez `git archive edb8fb56 gra/src | tar -x` do katalogu tymczasowego poza repo, potem `grep -n`/`sed -n`/`wc -l`; stan decyzji z `dyspozycje/rust-port/LEDGER.md` na `ad14b7fbd`; stan Tauri i renderera Rust przez `git show`/`git ls-tree` na `origin/rust-port/parity-v2` (`95930b446`). Zero buildu, zero `npm`, zero `cargo`.
- Importerzy `../types/map` w `render/**`: `grep -l "types/map" render/*.ts | wc -l` → 13.
- Wołający `loadImageInto`: `grep -rln loadImageInto render` → 3 pliki.
- `mergeGeometries`: `grep -rln mergeGeometries render` → `riverLod.ts`, `scene.ts`.
