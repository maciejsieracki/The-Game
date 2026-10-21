# P4.0 — Architektura renderera mapy: stan faktyczny, opcje, decyzje właściciela

**Temat:** R-RUSTPORT-P4-0-RENDERER-ARCHITECTURE-Q1 · **Domena:** GAME · **Rola:** Operator (runda 1/5)
**Pin web (referencja read-only):** `edb8fb56` (`git show edb8fb56:<ścieżka>`, `git grep ... edb8fb56 -- gra/src`)
**Baza dokumentu:** `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (`de46210b`)
**Zakres:** wyłącznie odczyt i projekt. Zero kodu, zero buildu, zero zmian w `gra/**` i `rust-port/**`. `npm run build/dev` nie uruchamiano.

**Legenda dowodów:** `plik:linia` = odczyt `git show edb8fb56:<plik>`; „cmd → wynik” = wklejony wynik komendy. `NIE_ZMIERZONO` = nie sprawdzono w tej rundzie.

---

## 0. Sprostowanie

Wcześniejsze twierdzenie orkiestratora, że „mapa 3D to tylko płaskie assety 2D”, było **błędne**. Stan faktyczny na pinie `edb8fb56`:

- Mapa web jest renderowana w **3D** przez **Three.js** (`gra/package.json:14` `"three": "^0.169.0"`; `gra/package-lock.json:1586-1588` → `three` `0.169.0`).
- Kamera to `THREE.PerspectiveCamera` (`gra/src/render/scene.ts:3078`; typ `camera.ts:62`).
- Renderer to `THREE.WebGLRenderer` (`gra/src/render/scene.ts:1624`).
- `gra/src/render/**` to **88 plików TypeScript, 59 319 linii** (`git grep -c '' edb8fb56 -- gra/src/render`, suma kolumny). Największe: `units.ts` 6 779, `scene.ts` 3 760, `mapRenderStyle.ts` 1 996, `jednostki-z3-plemiona.ts` 1 994.
- Brak plików 3D jako zasobów: 0 plików glb/gltf/fbx/obj (P1.11 §2/§5, `dyspozycje/rust-port/p1/P1-11-ASSET-CATALOG.md`). Geometria jest **proceduralna**, budowana w kodzie.

Prawdziwe „płaskie” assety to ikony SVG (307), portrety JPG (45), hero PNG (2), muzyka MP3 (62) — P1.11 §2. To one są 2D, nie mapa.

Plik `dyspozycje/rust-port/LEDGER.md:108` zawiera już wpis korekty; ta sekcja go potwierdza z dowodami.

---

## 1. Co dziś rysuje mapę (pytanie 1)

### 1.1 Stos renderingu

| Element | Dowód | Uwagi |
|---|---|---|
| Wersja Three.js | `gra/package.json:14`; lock `1586-1588` → 0.169.0 | Pin w lockfile, nie tylko zakres |
| Renderer | `scene.ts:1624` `new THREE.WebGLRenderer({ canvas, antialias, powerPreference: 'high-performance' })` | Bez fallbacku 2D w `render/` (grep `WebGL` w `gra/src` nie wykazał ścieżki bez WebGL poza `perf/hardwareProfile.ts:182-190` — **sonda**, nie renderer) |
| Pixel ratio | `scene.ts:1626` `Math.min(devicePixelRatio, preset.pixelRatioMax)`; `:3239` `effectivePixelRatio(...)` | Zależne od presetu wydajności |
| Kamera | `scene.ts:3078` `PerspectiveCamera`; `camera.ts` klasa `CameraController` (309 linii) | Yaw **stały** (`camera.ts:66`, `:123` „kamera zawsze patrzy z SE”); sterowanie: pan (drag, próg `DRAG_THRESHOLD_PX = 6`, `camera.ts:25`), zoom kółkiem (`camera.ts:218-219`), WASD i edge-pan (`camera.ts:247`) |
| Siatka hex (geometria) | `hexutil.ts:24` `HEX_R = 1.0`; `:32` `axialToWorld`; `:53` `worldToAxial`; `hexShape.ts` (kontur pointy-top w XZ, `hexRingPointsXZ`, `appendPointyTopHex`) | Obrót `mesh.rotation.x = -π/2` (komentarz `hexShape.ts:~12`) |
| Teren | `scene.ts:367` „InstancedMesh terenu — raycast pickingu heksów” | Prizmy terenu jako `InstancedMesh`; kolory zmieniane przez mgłę |
| Mgła wojenna | `fogDim.ts:16` `fogBrightnessForHex`, `:29` `applyFogDimToObject3D` (mnożenie `material.color` przez jasność, `:38-41`); `scene.ts:335-350` (kontrakt: `visible`/`explored` jako zbiory `"q,r"`); `scene.ts:3389` `applyTerrainFog` | Mgła to **zmiana kolorów materiałów**, nie osobna warstwa |
| Rzeki | `riverLod.ts`, `scene.ts:~287` `RiverGeoBucket` (wstęgi `BufferGeometry`) | Rzeki zawsze pełnym kolorem (`scene.ts:350-357`) |
| LOD | `zoomLod.ts`; `scene.ts:3165`, `:3519` `applyZoomLodDecor`, `:3518` `applyZoomGpuSettings` | Dekoracje ukrywane wg zoomu |
| Jednostki | `units.ts` — klasa `UnitRenderer`, metoda `sync(units, stackDisplay?, dimmedUnitIds?)` (`units.ts:6038-6041`) | Patrz §2 |
| Miasta | `cities.ts` (`CityRenderOptions`, `cities.ts:277-300`: `getEra`, `getCiv`, `getLevel`, `getWalls` — callbacki do stanu) | |
| Nakładki | `rangeOverlay.ts`, `tradeRoutesOverlay.ts`, `cityOkolicaOverlay.ts`, `workerFieldOverlay.ts`, `siegeMarker.ts`, `siegeCampSync.ts` | Sprite z `CanvasTexture` |
| Etykiety/plakietki | `unitStatPlate.ts`, `unitOwnerEmblem.ts` (`THREE.Sprite`, `unitOwnerEmblem.ts:43-45`), `cityMapStatChip.ts`, `unitVeteranBadges.ts`, `unitUpgradeBadges.ts` | Tekstury generowane z `<canvas>` |
| Picking | `input/picker.ts:175` `pixelToHex` — `THREE.Raycaster` (`picker.ts:192`), `intersectObjects` na meshach terenu (`:196`), fallback przez płaszczyznę (`:234`); `picker.ts:49` `worldToAxial` (czysta matematyka) | Wywoływane z `main.ts:1885` `pickHexAt` |
| Liczba plików `render/**` wg nazwy (przybliżenie, `NIE_ZMIERZONO` dokładnie) | ok. 30 plików modeli jednostek/miast (`jednostki-p*`, `jednostki-z*`, `*-opus5`, `braz-*`, `kamien-*`, `zelazo-*`, `hastati-*`, `galera-model`, `kon-nowy-model`, `swinia-trzoda`, `pastwisko-modele`, `siegeCampModels`), reszta: scena/kamera/teren/dekoracje/nakładki/UI-overlay | Podział LOC wg kategorii **NIE_ZMIERZONO** (próba w tej rundzie nie przeszła weryfikacji komendy; nie wnioskuję z nazw) |

### 1.2 Zdjęcie stanu (co jest faktycznie w `render/`)

- `render/` nie jest jednolitym silnikiem: zawiera **dwa warianty stylu** — „Minecraft” i „Roblox” (`minecraftScene.ts`, `robloxScene.ts`, `robloxCity.ts`, `robloxImprovements.ts`, `bronzeCityRoblox.ts`, `stoneCityRoblox.ts`, `mapRenderStyle.ts`, `styleResources.ts`). Łącznie pliki `roblox*`/`minecraft*` mają **801 linii** (`git grep -c ''` na nazwach).
- Martwy kod (dowód przez `git grep` importów na `edb8fb56`):
  - `minecraftScene.ts` — **brak importerów** (jedyny plik zawierający nazwę to on sam).
  - `robloxScene.ts` — brak importerów poza samym plikiem (re-eksportuje `robloxCity`, `robloxScene.ts:12`).
  - Żywe: `robloxCity.ts` ← `scene.ts:73` (`addRobloxSkyDecor`); `bronzeCityRoblox.ts`, `stoneCityRoblox.ts` ← `settlementModel.ts:7,9`.
  - Stąd D-REND-7 (§6).

### 1.3 Ważne fakty o kodzie renderera

- Tekstury **nie są plikami**: `CanvasTexture` tworzone z `<canvas>` (`cities.ts:718`, `cityMapStatChip.ts:1076`, `cityOkolicaOverlay.ts:210`, `siegeMarker.ts:46`, `unitOwnerEmblem.ts:349`, `unitStatPlate.ts:437`). Nie ma `TextureLoader` ani `GLTFLoader` (grep: brak trafień dla `GLTFLoader|OBJLoader|FBXLoader|TextureLoader|DRACOLoader` w `gra/src`).
- Jedyny zewnętrzny obraz ładowany w `render/`: `unitOwnerEmblem.ts:317-320` (`new Image()`, `img.src = url`). **Źródło `url` NIE_ZMIERZONO.**
- Zasoby/ikony w render przez `import.meta.glob` z `ui/` — P1.11 §4 (`src/ui/icons/brandAssets.ts:23`). Zależność od Vite.

---

## 2. Skąd modele 3D jednostek (pytanie 2)

- **Proceduralnie, w kodzie.** Dowody: `jednostki-p1-rdzen.ts` (7 eksportów), `jednostki-z1-mezopotamia.ts` (4), `units.ts` (eksportowana klasa `UnitRenderer`, importowana przez `main.ts:155`; reszta to metody i `switch`). Budowanie bryły przez `THREE.Mesh`/`BufferGeometry`, `mergeGeometries` z `three/examples/jsm/utils/BufferGeometryUtils.js` (2 pliki, `git grep`).
- **Routing jednostka → model:** `units/setup.ts:239` `categoryOf(name, role, isSuper, typ)` klasyfikuje po słowach kluczowych (`super`, `osadnik`, `robotnik`, `zwiadowca`, `galera`, …; `setup.ts:240-251`). `units.ts` ma `switch` po kategorii (`case 'domyslny'` `units.ts:4762`, i kategorie: `maczuga`, `topor`, `konnica`, `rydwan`, `super` — `units.ts:7`).
- **Pokrycie „unikalnym modelem”:** `units.ts:100-116` (komentarze): dla części jednostek dodano dedykowane modele (np. `buildZelazoJezdziecOszczepami`, `buildZelazoKonnicaLancowaAsyryjska`), wcześniej wspólny fallback `case 'konnica'`. Część jednostek nadal idzie przez `categoryOf` → wspólny kształt kategorii. **Pełne pokrycie (ile z ok. 100+ typów jednostek ma unikalną bryłę) — NIE_ZMIERZONO.** Nie wnioskuję z nazw plików.
- **Zewnętrznych zasobów 3D:** brak (§1.3).

---

## 3. Granica danych renderer ↔ logika (pytanie 3)

### 3.1 Wejście do renderera (co render czyta)

| Wejście | Kontrakt / miejsce | Źródło w logice |
|---|---|---|
| Jednostki | `units.ts:6038` `sync(units: RuntimeUnit[], stackDisplay?, dimmedUnitIds?)` | `units/setup.ts:40` `RuntimeUnit`: `id, ownerId, typeId, category, q, r, ruch, ruchLeft, inGarnizon?, fortifyRuchSnapshot?, hp?, hpMax?, defLossesThisTurn?, oblegaCityId?, replaceUsedThisTurn?`, pola embarkacji, `battlesSurvived` (weterani) |
| Miasta | `cities.ts:277-300` `CityRenderOptions`: `getEra(ownerId)`, `getCiv(ownerId)`, `getLevel(cityId)`, `getWalls(cityId)` | Callbacki do stanu gry (funkcje, nie dane) |
| Mapa / teren | `scene.ts:335-350` `SceneResult` + `buildScene` (`scene.ts:1279` `onSlice`) | Dane mapy z generatora |
| Mgła | `scene.ts:~350` `visible: Set<"q,r">`, `explored: Set<"q,r">` | `game/visibility` (importowane przez render, §3.3) |
| Stan miast/obozów/oblężeń | `siegeCampSync.ts`, `siegeMarker.ts` | `game/siegeMachines`, `game/production` (§3.3) |
| Ulepszenia | `improvements.ts` | `game/terrain-improvements` (§3.3) |

### 3.2 Wyjście renderera (co render emituje)

Render **nie emituje komend domenowych**. Zdarzenia użytkownika obsługuje `main.ts`, a render dostarcza tylko geometrię i trafienia:

| Zdarzenie | Miejsce | Komentarz |
|---|---|---|
| Hit-test heksa | `input/picker.ts:175` `pixelToHex` → `main.ts:1885` `pickHexAt` | Wywoływane z `main.ts:13039`, `:26720` |
| Klik (mouseup) | `main.ts:26337` `canvas.addEventListener('mouseup', …)` | Rozróżnia klik od pana przez `DRAG_THRESHOLD_PX` (`camera.ts:25`) |
| Prawy klik | `main.ts:26209` `contextmenu` | |
| Blokada pana | `camera.ts:38-52` predykaty `blockPointerAt` / blokada zoomu (`main.ts` dostarcza) | Kamera wie o panelach UI |
| Edge-pan | `camera.ts:247-260`, wyłączony gdy kursor poza canvasem | |

### 3.3 Sprzężenie render ↔ `game/` (ryzyko dla „zero lokalnej symulacji”)

Grep `from '../game/…'`, `from '../map/…'`, `from '../units/…'` w `render/**` (`git grep -l`, na `edb8fb56`): **12 plików** importuje moduły logiki. Wykryte importy (liczba plików w nawiasach):

- `../game/terrain-improvements` (3), `../game/siegeMachines` (3), `../game/production` (3), `../game/human-owners` (3), `../game/visibility` (2), `../game/veteran` (2), `../game/unit-building-bonuses` (1), `../game/okolica` (1), `../game/display-names` (1), `../game/cities` (1), `../game/building-stock-cost` (1), `../game/armyMerge` (1)
- `../map/road-network` (3), `../map/gen-helpers` (2), `../map/territory-border` (1)
- `../units/setup` (3) — `RuntimeUnit`, `categoryOf`

**Wniosek:** 1:1 kopia `render/**` do webview przeniesie **logikę domenową** (`game/production`, `game/visibility`, `game/veteran`, `units/setup.categoryOf`) do frontendu. To jest sprzeczne z P2.7/P5.13 i zasadą „zero lokalnej symulacji w JS” (`PLAN-PORT-RUST-TAURI-20261020.md` §1 pkt 4, §4 P5.13). Każda opcja z §4 musi to rozwiązać (przez DTO z Rust albo przez wydzielenie czystych helperów). `NIE_ZMIERZONO`: które z 12 importów to czysta matematyka, a które logika reguł.

### 3.4 Relacja z kontraktem P2

- `P2-2-GAMESTATE-CONTRACT.md:16` — `GameState` = **wyłącznie stan rozgrywki**, bez stanu renderu i UI. Zatem stan potrzebny rendererowi (pozycje, kolory, flagi widoczności) musi być **osobnym modelem widoku (view model / DTO)** generowanym z `GameState` w Rust, nie częścią `GameState`. To jest konkluzja projektowa tej rundy.
- `P2-8-TAURI-ADAPTER.md:59` — adapter Tauri renderuje wyłącznie stan z Rust (`renderGameState`, `main.js:712-716`). **Ścieżki `main.js` w bieżącym HEAD nie zlokalizowano** (`NIE_ZMIERZONO`).
- `P1-17B-UI-CLASSIFICATION.md:12` twierdzi, że obecna mapa po stronie Tauri to „siatka DOM (`#game-map`, `role="grid"`), a nie renderer”. Grep `game-map|role="grid"` w `HEAD:rust-port/` nie dał trafień; frontend Tauri nie został zlokalizowany w tej rundzie. **Twierdzenie P1-17B:12 NIE zweryfikowane** — potraktować jako dane do sprawdzenia w P0/P2, nie jako fakt.

---

## 4. Opcje architektury (pytanie 4)

Legenda „1:1” = zgodność wizualna z webem; „testy” = możliwość testu automatycznego i screenshotowego (P4.14).

| | **A — Three.js w webview + silnik Rust przez komendy Tauri** | **B — renderer w Rust (wgpu / Bevy) + przepisanie modeli** | **C — hybryda: A teraz z twardą granicą DTO, B tylko jeśli P10 tego wymaga** |
|---|---|---|---|
| Co się kopiuje/przepisuje | `render/**` (59 319 linii TS) po adaptacji importów; Three.js 0.169.0 (pin z lockfile) | Cała geometria proceduralna (~30 plików modeli + scena/teren/mgła/LOD/rzeki/etykiety) do Rust; tekstury `CanvasTexture` do Rust; picking do Rust | Jak A; Rust dostaje model widoku (DTO), a w razie potrzeby przenosi wybrane fragmenty (np. terenu) |
| Koszt wdrożenia | **Średni.** Kopia 1:1 + refaktor 12 importów logiki na DTO | **Bardzo wysoki.** 59k linii do odtworzenia w innym silniku; brak gotowego odpowiednika `CanvasTexture`/`Sprite`/`InstancedMesh`/`fogDim` | Jak A w fazie 1; faza 2 warunkowa |
| Ryzyko 1:1 (wizualnie) | **Niskie.** Ten sam kod, ten sam Three.js; różnice wynikają tylko z webview | **Wysokie.** Oświetlenie, materiały, antialiasing, tekst w canvas, mgła przez kolor — każda różnica to nowy „finding” w P8 | Niskie w fazie 1 |
| Ryzyko „drugiej uproszczonej gry” | **Średnie**, jeśli nie zrobi się granicy DTO (§3.3). Przy DTO — niskie | **Wysokie** — przepisywanie bryły „na oko” jest dokładnie tym, co zakazuje plan (§1 pkt 4) | Niskie |
| WebGL w webview docelowych | Wymaga WebGL2 w WebView2 (Win) i WebKit (macOS/Linux). Web ma sondę WebGL2 (`perf/hardwareProfile.ts:182-190`) i **nie ma** 2D-fallbacku → ta sama zależność | Brak zależności od przeglądarki (natywny GPU), ale wymaga okna natywnego/overlay pod DOM-HUD | Jak A |
| Wydajność | Taka jak web (ten sam pipeline); bez dodatkowego narzutu IPC na klatkę, jeśli DTO zmienia się rzadko | Potencjalnie lepsza, nie zmierzono | Start jak A; B tylko po wyniku P10 |
| Picking | Raycast w webview (`picker.ts`), wynik hexa → Rust; `worldToAxial` (czysta matematyka, `picker.ts:49`) może być w Rust | W Rust (natywnie) | Jak A |
| Test screenshotowy (P4.14) | Możliwy: Playwright na tym samym buildzie co web (P1.9 już je wykonał: `P1-9-MAP-HUD-PANELS.md` §1). Różnica: webview Tauri ≠ Chromium — wymaga testu w webview (`NIE_ZMIERZONO`, czy da się sterować) | Nowy harness od zera (brak gotowego) | Jak A |
| Zgodność z zasadą „Rust trzyma stan” | Tak, przy DTO | Tak | Tak |
| Wpływ na HUD/UI (105 plików `ui/`) | Brak — HUD w DOM w webview, jak w web | Wymaga osobnej warstwy (overlay) albo nadal webview | Jak A |

**Rekomendacja:** **C (start jak A).** Uzasadnienie: (1) cel P4 to 1:1, a jedynym źródłem wizualnej prawdy jest istniejący kod Three.js; (2) B przepisuje 59k linii na nowy silnik przed ustaleniem kontraktu P2 — to dokładnie ryzyko „drugiej gry”; (3) granica DTO (Rust = stan, webview = rysowanie) spełnia zasady projektu; (4) decyzja o B zapada dopiero na podstawie pomiaru P10, nie z góry.

Warunek przyjęcia rekomendacji: **D-REND-2** (granica DTO) i **D-REND-3** (picking) muszą być rozstrzygnięte przed P4.6.

---

## 5. Co dalej

- Przed P4.6: zamknąć `D-REND-1..3`. Bez tego nie wiadomo, czy DTO istnieje (P2) i gdzie leży picking.
- P4.14 (test) wymaga decyzji `D-REND-6` (harness).
- P4.11 (assety) nie dotyczy modeli 3D (brak plików), dotyczy ikon/portretów/muzyki z P1.11.

---

## 6. Decyzje właściciela `D-REND-n` (NIE rozstrzygane po cichu)

- **D-REND-1 — Gdzie żyje renderer mapy.** Opcje: A, B, C (§4). Rekomendacja orkiestratora/operatora: **C**.
- **D-REND-2 — Granica DTO.** Czy render czyta wyłącznie model widoku wygenerowany w Rust (rekomendowane), czy dopuszczamy importy logiki z `game/`/`units/` po wydzieleniu czystych helperów. Dotyczy 12 plików z §3.3.
- **D-REND-3 — Picking.** Hit-test w webview (Raycaster na `InstancedMesh`, wynik hex → Rust) czy w Rust (matematyka `pixelToHex` przepisana, bez raycastu)? Czy zachowujemy ten sam algorytm co web (`picker.ts`), co daje identyczne wyniki kliknięć.
- **D-REND-4 — Modele proceduralne.** Zostają w TS (opcja A/C) czy są przepisywane do Rust (B)? Dotyczy ok. 30 plików modeli i 59k linii.
- **D-REND-5 — Minimalny poziom GPU/WebGL.** Web nie ma fallbacku 2D. Czy akceptujemy brak mapy na urządzeniu bez WebGL2 (zgodnie z webem) czy wymagamy dodatkowego trybu? Dotyczy webview Win/macOS/Linux.
- **D-REND-6 — Harness do testu 1:1 (P4.14).** Playwright na buildzie web (jak P1.9), test w webview Tauri (WebDriver), czy oba? Wpływa na koszt P4.14.
- **D-REND-7 — Martwy kod stylów „Minecraft”/„Roblox”.** `minecraftScene.ts` nie ma importerów; `robloxScene.ts` nie ma importerów poza sobą. Czy są w zakresie portu (P1 1:1 ich nie wymaga, bo nie są wywoływane), czy wyłączamy je z katalogu? Wymaga potwierdzenia właściciela, bo może to być celowy tryb zachowany w kodzie.

---

## 7. Lista niezmierzonych (`NIE_ZMIERZONO`)

1. Podział LOC `render/**` na kategorie (wykonanie komendy zakończyło się odmową środowiska; nie wnioskuję z nazw).
2. Pełne pokrycie unikalnych modeli jednostek (ile z typów ma dedykowaną bryłę, a ile fallback).
3. Źródło `url` w `unitOwnerEmblem.ts:317-320`.
4. Które z 12 importów logiki (§3.3) to czysta matematyka, a które reguły.
5. Obsługa WebGL2 w WebView2/WebKit (zewnętrzny fakt, nie sprawdzony w tej rundzie).
6. Lokalizacja `main.js` i frontendu Tauri w HEAD (§3.4).
7. Wydajność A vs B (brak pomiaru; P10).
8. Czy Playwright może sterować webview Tauri (§4, P4.14).

---

## 8. Metoda

- Odczyt wyłącznie przez `git show edb8fb56:…` i `git grep … edb8fb56 -- gra/src`. Zero checkoutu `gra/`, zero `npm`.
- Liczby LOC: `git grep -c '' edb8fb56 -- gra/src/render` + sumowanie. Liczba plików: 88 (`git ls-tree -r --name-only edb8fb56 -- gra/src/render`).
- Importy `three`: 88 plików (`git grep -l "from 'three" edb8fb56 -- gra/src` → 88).
- Importy logiki z `render/`: `git grep -l "from '../game/" …` + `from '../map/` + `from '../units/` → 12 plików (pełna lista §3.3).
- Martwe moduły: `git grep -l 'minecraftScene'` / `'robloxScene'` na `edb8fb56` → tylko własne pliki.
