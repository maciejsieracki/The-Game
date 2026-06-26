# Analiza: MAPA + RENDER + UNITS

Zakres przeanalizowany: `src/map/`, `src/render/`, `src/units/` plus powiązane konsumenci (`src/main.ts`, `src/movepreview/main.ts`, `src/game/visibility.ts`).

---

## 1. Map generation — `src/map/`

### `generator.ts` (213 l.) — orkiestrator deterministycznej generacji
- **Konwencja:** heksy POINTY-TOP aksjalne (q, r).
- **PRNG:** `mulberry32(seed)` + tablica permutacji (Fishera–Yatesa).
- **Przebieg 1:** teren bazowy z `fbm` (value-noise 4 oktawy) × maska lądowa zależna od `TypSwiata`: `'kontynenty' | 'pangea' | 'wyspy'`. Dodatkowe szumy góry/las/pustynia → `classifyTerrain`.
- **Przebieg 1b:** pierścień wybrzeża — każdy ląd sąsiadujący z `Morze` → `Wybrzeze`.
- **Przebieg 2:** rzeki (`generateRivers`, max 5, dł. 4–40) — deterministyczne śledzenie w dół od gór/wzgórz do morza.
- **Przebieg 3:** złoża mineralne (`placeDeposits`) — osobny strumień PRNG; ruda/glina/konie/węgiel.
- **Przebieg 4:** pozycje startowe (`computeStartPositions`, ≥5, min. dystans 5, relaksacja do 2) — Poisson-disk-like.
- **API rozmiarowe:** `generujSwiat(seed, rozmiar, typ)` — 5 rozmiarów (`malenki`…`ogromny`, do 168×119).
- **Status:** kompletny, deterministyczny, czysty (brak THREE/DOM).

### `gen-helpers.ts` (718 l.) — logika testowalna
- PRNG `mulberry32`, `buildPermTable`, `cosLerp`, `valueNoise2D`, `fbm`.
- Geometria: `HEX_DIRECTIONS`, `hexDistanceAxial`, `hexKey`.
- Maski lądowe: `landMaskAt` (oryg.), `landMaskKontynenty` (Gauss radialny + edge + warp), `landMaskPangea`, `landMaskWyspy`.
- `classifyTerrain` — progi elevation 0.07/0.14, góry >0.75, las >0.58.
- Rzeki: `traceRiver` (ELEVATION_RANK, schodzi do najniższego sąsiada), `generateRivers` (8 prób na rzekę, fallback falisty).
- `DEPOSIT_RULES` + `placeDeposits` (ruda→Wzgorza/Gory, glina→Laka/Wybrzeże/rzeka, konie→Równina, węgiel→pole `zloze`).
- `computeStartPositions` — deterministyczne tasowanie + greedy z luzowaniem minDist.
- **Status:** kompletny, czysty, samodzielny — spojny z `hexDistance()` z `units/setup.ts` (kopia).

### `clusters.ts` (347 l.) — rozmieszczenie typów cywilizacji (lane Civ-MAPA)
- **Algorytm:** środki Voronoi (greedy Poisson, min. 15 pól) → regiony → per-region Poisson-disk miast (min_dist adaptacyjny 4/6/8/9 wg rozmiaru, ~10 miast/klaster).
- **Skala:** 3/5/7/9 typów wg area (mała/średnia/duża/ogromna). Gracz = index 0.
- **Roster:** 9 kluczy z `civs.json` (grecy, rzymianie, chinczycy, inkowie, zulusi, egipt, sumerowie, celtowie, germanie).
- **Status:** kompletny, czysty, deterministyczny. `console.warn` przy za małych regionach.

### `territory.ts` (97 l.) — kontrakt terytorium (SILNIK)
- **Bramkowanie:** `isInTerritory(q, r, nodes)` — true jeśli heks w zasięgu dowolnego `CityNode`.
- **Zasięg:** fort=10 (stały), posterunek=5 (stały), miasto=`pop` (1:1, cap `CITY_RANGE_CAP=15`).
- **`axialDistance`** — dystans kubiczny.
- **Własność:** EKONOMIA owns formułę/cap; MAPA egzekwuje. **Brak zależności od THREE** — czysty kontrakt.
- **Status:** kompletny. **Brak renderowania konturu terytorium** w `scene.ts` (grep `territoryLine|drawTerritory|TerritoryOverlay` → 0 trafień) — tylko bramkowanie w `main.ts` (`canFoundCity`, zakładanie ulepszeń).

---

## 2. 3D scene — `src/render/`

### `scene.ts` (~1155 l.) — `buildScene(map, canvas): SceneResult`
- **Geometria bazowa:** `CylinderGeometry(R, R, h, 6)` per teren-typ (pointy-top, bez rotacji) — `InstancedMesh` osobno per typ.
- **Wysokości/kolory:** `TERRAIN_VISUALS` — Morze 0.30, Góry 0.60 (+0.20 yOffset). Kolor per-kafelek z jitterem HSL (`hash2D`/`jitteredTerrainColor`) + blend biomów (`blendedTerrainHex`, lerp z średnią sąsiadów).
- **Dekoracje (InstancedMesh):** las (kępy 3–5 drzew: pień walec + korona stożek), śnieg na górach, krzewy na wzgórzach, skalny szczyt + śnieg, trawiasty kopiec na wzgórzach, plaża wybrzeża, wydmy, oazy (~1/6 pustyni: basen + palmy).
- **Rzeki:** graf rogów heksów (`buildVertexGraph`, `traceRiverVertices`) + ribbon `buildRibbonGeometry` (CatmullRom) z brzegami; wstęga wycięta w terenie (Y poniżej szczytu).
- **Atmosfera:** `HemisphereLight` + `DirectionalLight` (sun, cienie PCFSoft 2048²) + fill light; `FogExp2` sky; `ACESFilmicToneMapping`; ocean wokół + ramka planszy.
- **Return:** `{ scene, camera, renderer, center, dispose, setFog }`.
- **Status:** kompletny, wydajny (instancing), deterministyczny (LCG z `map.seed`).

### `camera.ts` (166 l.) — `CameraController`
- Własna obsługa (bez OrbitControls): pan (drag LMB / WASD/strzałki) + zoom (kółko).
- Stały kąt: elewacja 52°, azymut 0 (kamera z południa).
- `update()` co klatkę dla WASD; `dispose()` usuwa listenery.
- **Status:** kompletny.

### `hexutil.ts` (72 l.) — geometria aksjalna↔świat
- `HEX_R=1.0`, `SQRT3`.
- `axialToWorld(q, r)` → `{x = R·√3·(q+r/2), z = R·1.5·r}`, Y=0.
- `mapCenter(w, h)`, `worldToAxial(x, z)` (cube rounding).
- **Status:** kompletny, wspólny dla scene/units/cities/etc.

---

## 3. Fog of war

### `game/visibility.ts` (106 l.) — obliczenie
- `DEFAULT_SIGHT = 3`.
- `computeVisible(playerUnits, map, sight)` → `Set<"q,r">` (iteracja dq/dr w kwadracie sight, hex-distance filtr, tylko hexy w `map.hexes`).
- `addExplored(explored, visible)` — mutacja trwałego zbioru odkrytych.
- `allHexKeys(map)` — tryb „fog off" / reveal-all.
- **Status:** kompletny, czysty. Kontrakt: tylko jednostki gracza (ownerId===0).

### `scene.ts` `setFog(visible, explored)` (l. 1083–1151) — renderowanie mgły
- **3 poziomy:** visible → `baseColor` (factor 1.0); explored → `×0.45` (przyciemniony); unknown → `FOG_HIDDEN_COLOR 0x0b0d12`.
- **Prizmy terenu:** `mesh.setColorAt(index, color)` + `instanceColor.needsUpdate`.
- **Nakładki (las, śnieg, krzewy, szczyty, kopce, plaże, wydmy, oazy):** ukrycie przez macierz skali 0 (`ZERO_MATRIX`) dla nieodkrytych; przywrócenie oryginalnej macierzy z `*OrigMatrix`/`*HexKey` tablic.
- **Rzeki:** cała siatka widoczna gdy ≥1 hex na trasie widziany/odkryty (toggle `visible`).
- **Status:** kompletny, wydajny (macierz zamiast remove/add).

---

## 4. Unit movement (Dijkstra) — `src/units/setup.ts` (894 l.)

- **`RuntimeUnit`** — `id, ownerId, typeId, category, q, r, ruch, ruchLeft`.
- **`keyOf(q, r)`** = `"q,r"`, **`hexDistance`** = cube max(|dq|,|dr|,|ds|).
- **`placeStartingUnits(map, data)`** — osadnik gracza (najlepszy hex najbliżej centrum) + wojownik z mieczem (ring-1/ring-2 obok osadnika) + do 6 rywali AI (LCG Fisher–Yates, min_dist 5→2 z relaksacją).
- **`categoryOf(name, role, isSuper)`** — 18 kategorii (osadnik, miecznik, wlocznik, lucznik, procarz, oszczepnik, maczuga, topor, konnica, rydwan, falanga, legionista, obleżnicza, galera, zwiadowca, robotnik, super, domyślny); NFD + ł→l.
- **`configureTerrainMovement(costs, forestExtra)`** — data-driven, wartości ≥90 = Infinity.
- **`terrainMoveCost(hex)`** — Laka/Równina/Pustynia=1, Wzgórza=2, Wybrzeże/Morze/Góry=Infinity; Las=+1.
- **`RIVER_MOVE_BONUS = 4`** — bonus do budżetu gdy start na rzeką.
- **`computeReachable(unit, map, occupied)` (Dijkstra)** — binary min-heap, `dist` map, koszt wejścia = `terrainMoveCost`, blokada impassable/occupied, budżet = `ruchLeft` (+bonus rzeki). **Reguła MIN.1 POLE:** każdy przyległy passable nie-occupied hex zawsze w zbiorze gdy `budget≥1` (zależnie od kosztu). Zwraca `Set` bez hexa startu.
- **`computePath(unit, map, destQ, destR, occupied)` (Dijkstra)** — parent pointers + rekonstrukcja; cel zawsze passable jako krok końcowy (ignoruje occupied). Zwraca `[first-step,…,dest]`, `[]` gdy unreachable.
- **`pathCost(path, map)`** — suma kosztów, brak hexa=0.
- **`listUnitTypes(data)`** — galeria (dedupe po nazwie).
- **Status:** kompletny, czysty (brak THREE/DOM), deterministyczny, dobrze udokumentowany.

### Prototyp ruchu — `movepreview/main.ts` (~1381 l.)
Osobny entry point (`vite.movepreview.config.ts`), niezależny od `main.ts`. Pathfinding Dijkstra z `terrain-movement.json`, reguła MIN.1 POLE, podgląd ścieki z numerami TUR, animacja lerp, stacking z billboardem, hook ZoC, test oblężenia (miasto z murem, garnizon, atak z marszu vs bitwa polowa). **Konsumentuje** `generateMap`, `buildScene`, `buildUnitModel`, `buildBronzeCity`, `axialToWorld`.

---

## 5. UnitRenderer — `src/render/units.ts` (~7640 l.)

- **Token:** Roblox R6-style box avatar (~0.55·HEX_R) — głowa/torso/2×arm/2×leg/szyja/oczy; per-category gear (niskopoly). `buildUnitModel(category, ownerColor, unitName)` z per-culture wariantami (Legionista, Falanga, uThulwana, …).
- **Paleta właścicieli:** `OWNER_COLORS` 8 kolorów (gracz=gold 0xffd54a).
- **Wysokość terenu:** `TERRAIN_TOP` (MUSI zgadzać się z `TERRAIN_VISUALS` w scene.ts) — top Y = `height + yOffset`.
- **`UnitRenderer` (l. 7224–7639):** klasa z publicznym API:
  - `sync(units)` — aktualizuje tokeny, przebudowuje gdy `category` się zmieni (`userData['cat']`).
  - `setTokenWorldPosition(id, x, y, z)` — dla animatora ruchu.
  - `topYAt(q, r)` — Y wierzchu terenu.
  - `setHighlight(hexes)` — dyski hex (CylinderGeometry 6, MeshBasic, opacity 0.35, kolor 0x66ccff).
  - `clearHighlight()` — dispose materiałów.
  - `setPathRoute(hexes)` — TubeGeometry (CatmullRom, gold 0xffe27a, opacity 0.9) + kropki + TorusGeometry na celu (0xff8c00).
  - `clearPathRoute()` / `dispose()` — pełne zwalnianie GPU (~60 shared geometries).
- **Status:** kompletny, rozbudowany (realism pass + vivid palette), zarządzanie pamięcią poprawne.

---

## 6. Połączenia modułów (w `main.ts`)

```startLine:43:58
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from './map/generator';
import { buildScene } from './render/scene';
import { CameraController } from './render/camera';
import { HEX_R, axialToWorld, worldToAxial } from './render/hexutil';
import { placeStartingUnits, computeReachable, computePath, listUnitTypes, pathCost, configureTerrainMovement, hexDistance, categoryOf } from './units/setup';
import type { RuntimeUnit } from './units/setup';
import { UnitRenderer } from './render/units';
import { computeVisible, addExplored, allHexKeys, DEFAULT_SIGHT } from './game/visibility';
import { isInTerritory } from './map/territory';
import type { CityNode } from './map/territory';
```

**Pipeline startowy:** `generateMap` → `buildScene` → `CameraController` → `UnitRenderer` → render loop.
**Tura (fog):** `computeVisible` → `addExplored` → `setFog(vis, explored)` (lub `setFog(ALL_KEYS, ALL_KEYS)` gdy fog off).
**Ruch jednostki:** selekcja → `computeReachable` → `UnitRenderer.setHighlight(reachable)`; hover → `computePath` → `setPathRoute([start,…path])`; ruch → `setTokenWorldPosition` + odliczenie `pathCost`.
**Terytorium:** `main.ts` buduje `cityNodes` (l. 1550) → `isInTerritory` bramkuje `canFoundCity`/ulepszenia. **Brak renderowania konturu** (widoczne w grep — 0 trafień).

---

## 7. Status per moduł (tabela)

| Moduł | Linie | Status | Uwagi |
|---|---|---|---|
| `map/generator.ts` | 213 | Kompletny | Deterministyczny, 3 typy świata, 5 rozmiarów |
| `map/gen-helpers.ts` | 718 | Kompletny | Czysty, testowalny, spoilny z setup.ts |
| `map/clusters.ts` | 347 | Kompletny | Voronoi + Poisson, lane Civ-MAPA |
| `map/territory.ts` | 97 | Kompletny (bramkowanie) | Brak renderowania konturu |
| `render/scene.ts` | ~1155 | Kompletny | Instancing, fog, dekoracje, rzeki-vertex |
| `render/camera.ts` | 166 | Kompletny | Własne pan/zoom (bez OrbitControls) |
| `render/hexutil.ts` | 72 | Kompletny | Wspólny konwerter aksjal↔świat |
| `render/units.ts` | ~7640 | Kompletny | UnitRenderer + R6 avatars + per-culture |
| `game/visibility.ts` | 106 | Kompletny | Fog computation, czysty |
| `units/setup.ts` | 894 | Kompletny | Dijkstra (reachable + path), MIN.1 POLE |
| `movepreview/main.ts` | ~1381 | Prototyp | Osobny entry, Dijkstra + ZoC + oblężenie |

---

**Luki / TODO do ewentualnego pick-upu:**
1. **Brak renderowania konturu terytorium** — `territory.ts` tylko bramkuje; linia obrysu zasięgu miasta nie jest rysowana ( komentarz modułu mówi „MAPA egzekwuje + rysuje linię", ale rysowanie nie istnieje w `scene.ts`).
2. **`movepreview/main.ts`** jest prototypem równoległym do `main.ts` — duplikuje logikę Dijkstra/ZoC; kandydat do konsolidacji z `units/setup.ts`.
3. **`TERRAIN_TOP` w `units.ts` musi ręcznie zgadzać się z `TERRAIN_VISUALS` w `scene.ts`** — brak współdzielonego źródła (ryzyko rozjazdu).

**Podsumowanie:** Moduły mapy/renderu/jednostek są kompletne i spójnie połączone w `main.ts`. Mapa: deterministyczna generacja (PRNG + fBm + 3 typy świata) + terytorium (bramkowanie, brak renderowania). Render: pełna scena 3D Three.js z instancingiem, dekoracjami, mgłą 3-poziomową. Ruch: Dijkstra z binary-heap, regułą MIN.1 POLE i bonusem rzeki. UnitRenderer: R6-box avatary per-kategoria/kultura + highlight + path route.
