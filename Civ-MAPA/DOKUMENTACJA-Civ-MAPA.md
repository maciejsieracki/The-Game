# Dokumentacja techniczna — Dział MAPA / RENDER (Civ-MAPA) — „The Game"

> Wersja: 23.06.2026. Autor: sesja **Civ-MAPA** (architekt/render).
> Zakres: generowanie mapy świata, renderowanie terenu/rzek/biomów, miasta (epoka kamienia + brąz), nakładki surowcowe, podglądy, build.
> Stack: **TypeScript + Three.js (r0.169) + Vite (single-file build do `file://`)**. Mapa heksowa pointy-top, modele low-poly.
> Lane (pliki, których dotyka ten dział): `src/render/scene.ts`, `src/render/cities.ts`, `src/render/stoneCity.ts`, `src/render/bronzeCity.ts`, `src/render/resources.ts`, `src/render/hexutil.ts`, `src/map/*`. **NIE** dotyka: `main.ts` (SILNIK), `units.ts`/`battle/*` (UNITS/BITWA).

---

## 0. Słowniczek

| Termin | Znaczenie |
|---|---|
| Heks | Pojedyncze pole mapy (pryzm 6-boczny, pointy-top). Promień `HEX_R = 1.0`. |
| Teren bazowy (`TerenBazowy`) | Typ pola: Morze, Wybrzeze, Laka, Rownina, Pustynia, Wzgorza, Gory. |
| Nakładka (`Nakladka`) | Warstwa nad terenem: Las lub złoże surowca (glina/ruda/koń/owca/bydło/lama). |
| Wierzchołek (vertex) | Róg heksa; punkt styku 1–3 heksów. Rzeki płyną po wierzchołkach/krawędziach. |
| Kanon | `Gra-podglad.html` — oficjalny build gry; publikuje **wyłącznie SILNIK**. |
| Podgląd | Osobny build HTML do oceny (np. `Gra-podglad-MAPA.html`); buduje Civ-MAPA. |

---

## 1. Architektura i pliki

```
gra/
  src/
    types/
      hex.ts            # TerenBazowy, Nakladka, Hex, RzekaInfo, Widocznosc (model pola)
      map.ts            # GameMap (hexes, riverPaths, seed, wymiary)
    map/
      generator.ts      # generateMap() — składa przebiegi generacji
      gen-helpers.ts    # szum/teren/rzeki/złoża/starty (testowalne helpery)
    render/
      hexutil.ts        # axialToWorld, mapCenter, worldToAxial, HEX_R, SQRT3
      scene.ts          # buildScene() — TEREN + RZEKI + biomy + ocean + ramka + fog-of-war
      cities.ts         # CityRenderer (stary model; do podmiany na stoneCity/bronzeCity — SILNIK)
      stoneCity.ts      # buildStoneAgeCity() — miasta epoki KAMIENIA (10 poziomów)
      bronzeCity.ts     # buildBronzeCity() — miasta epoki BRĄZU per cywilizacja
      resources.ts      # buildResourceOverlay() — małe nakładki surowcowe
    mappreview/         # podgląd MAPY (teren+rzeki+miasta+surowce) -> Gra-podglad-MAPA.html
    citypreview/        # podgląd 10 poziomów miast KAMIENIA -> Gra-podglad-MIASTA.html
    bronzepreview/      # podgląd miast BRĄZU (Grecja/Rzym) -> Gra-podglad-MIASTA-BRAZ.html
  data/                 # *.json (czytane przez loader.ts; generowane z xlsx)
```

**Graf zależności (render):**
```
hexutil.ts  <—  scene.ts, stoneCity.ts(✗), bronzeCity.ts(✗), resources.ts(✗), cities.ts
types/hex.ts, types/map.ts  <—  scene.ts, generator.ts, resources.ts, cities.ts
generator.ts  ->  gen-helpers.ts
scene.ts  ->  THREE, hexutil, types
stoneCity.ts / bronzeCity.ts / resources.ts  ->  TYLKO THREE (+ resources.ts -> types/hex dla enum Nakladka)
mappreview/main.ts  ->  generator, scene, stoneCity, resources, hexutil, types
```
> **Ważne:** `stoneCity.ts`, `bronzeCity.ts` importują wyłącznie `three` — są niezależne od reszty (łatwe do testu/podglądu i do wpięcia w `CityRenderer`).

---

## 2. Konwencje geometrii (twarda reguła)

- Heks = `THREE.CylinderGeometry(R, R, h, 6)` — **pointy-top** (pierwszy wierzchołek w +Z, theta=0). **ZERO `rotateY`** na heksach — rotacja rozjeżdża kafelkowanie. To reguła nienaruszalna.
- `axialToWorld(q, r, R)` (w `hexutil.ts`):
  - `x = R * √3 * (q + r/2)`
  - `z = R * 1.5 * r`
  - Sąsiedzi środków mają stałą odległość `R*√3` → kafelkowanie bez szczelin.
- 6 rogów heksa (środek `cx,cz`): `corner_k = (cx + R·sin(60°·k), cz + R·cos(60°·k))`, `k=0..5`. Rogi sąsiednich heksów pokrywają się dokładnie (używane do liczenia krawędzi rzek).
- `worldToAxial` — odwrotność (cube rounding) — do trafiania kliknięć/pozycji.
- `mapCenter(W,H,R)` — środek siatki (cel kamery).

---

## 3. Model danych

### `types/hex.ts`
```ts
enum TerenBazowy { Laka, Rownina, Wzgorza, Gory, Wybrzeze, Morze, Pustynia }   // string-enum: 'laka'...
enum Nakladka  { Brak, Las, ZlozeGliny, ZlozeRudy, ZlozeKonia, ZlozeOwiec, ZlozeBydla, ZlozeLamy }
interface Hex {
  coords: { q, r };
  terenBazowy: TerenBazowy;
  nakladka: Nakladka;
  ulepszenie, wlasciciel, wioska, widocznosc;
  rzeka: { obecna: boolean; krawedzie: number[] };  // krawedzie obecnie PUSTE (patrz §6)
}
```

### `types/map.ts`
```ts
interface GameMap {
  szerokoscQ: number; wysokoscR: number;
  hexes: Record<"q,r", Hex>;
  seed: number;
  riverPaths: { q, r }[][];   // każda rzeka = sekwencja środków heksów (źródło->ujście)
}
// generator zwraca GameMapWithStarts = GameMap & { startPositions?: {q,r}[] }
```

---

## 4. Generator mapy — `map/generator.ts` (+ `gen-helpers.ts`)

`generateMap(width=36, height=28, seed=42): GameMapWithStarts` — deterministyczny (mulberry32). Przebiegi:

1. **Teren bazowy + las** — dla każdego heksa: `fbm` (value-noise) × maska kontynentalna (elipsa: ląd w środku, morze przy krawędziach) → `classifyTerrain(...)` ustala `terenBazowy` i `nakladka` (las).
2. **1b. Pierścień wybrzeża (REGUŁA)** — *dodane przez Civ-MAPA*: każdy ląd sąsiadujący bezpośrednio z `Morze` jest zamieniany na `Wybrzeze`. Gwarancja: **każdy ląd graniczący z morzem ma ≥1 heks wybrzeża**; żaden ląd nie styka się wprost z głębokim morzem.
3. **Rzeki** — `generateRivers(hexes, w, h, rand, {maxRivers, minLen, maxLen, margin})` — śledzenie z Góry/Wzgórza w dół do morza. Wynik: `riverPaths` (sekwencje środków) **oraz** `hex.rzeka.obecna=true` na heksach trasy. `hex.rzeka.krawedzie` pozostaje `[]` (renderer liczy krawędzie sam — §6).
4. **Złoża** — `placeDeposits(hexes, seed)` — rzadkie nakładki złóż (glina/ruda/zwierzęta) per teren.
5. **Pozycje startowe** — `computeStartPositions(hexes, seed, {minCount, minDist, absMinDist})` — Poisson-disk-like, ≥5, parami oddalone.

**Parametry generatora (panel):** `DEFAULT_WIDTH=36`, `DEFAULT_HEIGHT=28`, `seed`, `maxRivers` (Civ-MAPA: **2→5**), `minLen=4`, `maxLen=40`, `margin=2`.

> **Spec źródłowy:** `Spec-generator-mapy.md` (skalowanie mapy, regiony Woronoja, klastry cywilizacji, min. dystans miast ≥5). Logika rozmieszczania KLASTRÓW miast = wspólnie z SILNIK/AI (jeszcze nie zaimplementowane na mapie — patrz §13).

---

## 5. Renderer terenu — `scene.ts` → `buildScene(map, canvas): SceneResult`

Zwraca `{ scene, camera, renderer, center, dispose, setFog }`.

**Pipeline:**
1. **Renderer/scena:** `WebGLRenderer` (antialias, ACESFilmicToneMapping, exposure 1.05, PCFSoftShadowMap). Tło `0x87ceeb` (sky), `FogExp2(0x9fcfe6, 0.0075)`.
2. **Światła:** `HemisphereLight(0xd4eaff,0x5a5040,0.9)` + `DirectionalLight(0xfff0cc,1.4)` (słońce, cienie 2048²) + `DirectionalLight(0xbcd4ff,0.35)` (wypełnienie z przeciwnej strony — miększe cienie/bogatsze biomy).
3. **Heksy:** `InstancedMesh` per `TerenBazowy` (jedna geometria `CylinderGeometry(R*0.998, .., height, 6)` na typ). Wysokość/yOffset per teren (tabela `TERRAIN_VISUALS`).
4. **Kolor per kafelek:** `baseColor = jitteredTerrainColor(blendedTerrainHex(...), q, r, seed, isWater)`:
   - `blendedTerrainHex` — **miękkie przejścia biomów**: kolor terenu zmieszany ze średnią kolorów 6 sąsiadów (siła `0.18` ląd / `0.07` woda).
   - `jitteredTerrainColor` — deterministyczny jitter HSL per (q,r,seed) (woda słabszy), żeby duże obszary nie były płaską plamą.
5. **Nakładki terenu (InstancedMesh + per-hex):** las (kępa 3–5 stożków + pnie), śnieg+szczyt skalny na Górach, trawiasty kopiec + krzewy na Wzgórzach, piaszczysty pierścień na Wybrzeżu, wydmy na Pustyni, oaza (basen+palmy) ~1/6 pustyni.
6. **Ocean + ramka (F1):** płaszczyzna głębokiego oceanu (`DEEP_OCEAN_COLOR 0x163d5c`) pod całym światem + ramka świata (4 listwy `FRAME_COLOR 0x241c12`) wokół granic mapy.
7. **Rzeki:** patrz §6.
8. **Kamera:** perspektywiczna, ustawiona ukośnie nad środkiem mapy.
9. **`setFog(visible, explored)`** — fog-of-war: przelicza kolory instancji terenu (visible=1.0, explored=×0.45, unknown=`0x0b0d12`) i ukrywa/pokazuje nakładki + rzeki. W podglądzie wołane z `visible=wszystkie`.

**Paleta terenu `TERRAIN_VISUALS` (color / height / yOffset):**

| Teren | color | height | yOffset | top (=h+yOff) |
|---|---|---|---|---|
| Morze | 0x1f5a86 | 0.30 | 0.00 | 0.30 |
| Wybrzeze | 0x46a3d6 | 0.35 | 0.05 | 0.40 |
| Laka | 0x6aa53f | 0.40 | 0.05 | 0.45 |
| Rownina | 0xa9b257 | 0.45 | 0.08 | 0.53 |
| Pustynia | 0xd9c179 | 0.40 | 0.05 | 0.45 |
| Wzgorza | 0x4f7d34 | 0.55 | 0.10 | 0.65 |
| Gory | 0x9aa1a9 | 0.60 | 0.20 | 0.80 |

> **Reguła spójności:** tabela `top` musi być identyczna w `scene.ts` (TERRAIN_VISUALS) i `cities.ts`/`mappreview` (TERR_TOP) oraz przy stawianiu miast/surowców (Y = top + lift). Zmiana wysokości terenu = zmiana w obu miejscach.

---

## 6. Rzeki (`scene.ts`) — algorytm i reguły

Reprezentacja danych (`riverPaths`) to sekwencje **środków** heksów, ale render ma być **po KRAWĘDZIACH** (granicach pól). Wyprowadzanie krawędzi ze środków jest niejednoznaczne na prostych odcinkach (objazdy „U"), dlatego rzeka jest **trasowana po grafie WIERZCHOŁKÓW**:

- **Graf wierzchołków** `buildVertexGraph(map, R)` — klucz `vKey = round(x*50),round(z*50)`; każdy vertex zna sąsiednie heksy. `vNeighbors` = rogi sąsiednie po obwodzie heksów (krawędzie).
- **Trasa** `traceRiverVertices(map, R, verts, source)`:
  1. start = najwyższy róg heksa-źródła (`riverPaths[k][0]`, góra/wzgórze);
  2. spływ: w każdym kroku do **najniższego** sąsiedniego wierzchołka (`vElev` = średnia rangi terenu sąsiadów: Morze 0, Wybrzeze 1, ląd 2, Wzgorza 3, Gory 4);
  3. **STOP gdy wierzchołek styka się z WODĄ** (Morze **lub** Wybrzeze) → to jest ujście. **REGUŁA:** rzeka kończy się przy pierwszym kontakcie z wodą; nie pełznie wzdłuż wybrzeża.
- **Wysokość rzeki:** Y = **max(top sąsiednich heksów) + uniesienie** (`-RIVER_DEPTH_BELOW`, czyli +0.02). **REGUŁA:** max (nie min) — żeby rzeka nigdy nie znikała pod wyższym heksem. (Prawdziwe wcięte koryto = osobny task, wymaga nacinania geometrii heksów.)
- **Wstęga:** `buildRibbonGeometry(pts, halfWidth, seg)` — płaska wstęga CatmullRom, kolor `RIVER_COLOR 0x4a93c4` + `emissive 0x2a6fa0` (żeby nie była czarna w cieniu).
- **DELTA u ujścia:** na heksie-ujściu (ostatni ląd) z końca nurtu rozchodzi się **wachlarz cienkich strug** do środków krawędzi tego heksa, które graniczą z wodą (5–6 strug). **REGUŁA:** delta tylko na lądzie/granicy, nie wchodzi na heksy wody; **bez** rysowania wzdłuż krawędzi wybrzeża (to wyglądało jak rzeka biegnąca brzegiem).

**Parametry rzek (panel):** `RIVER_WATER_HALF_WIDTH=0.20`, `RIVER_BANK_HALF_WIDTH` (brzeg usunięty — patrz dług techniczny), `RIVER_DEPTH_BELOW=-0.02` (uniesienie), `RIVER_COLOR=0x4a93c4`, emissive `0x2a6fa0`, delta halfWidth `0.055`, `maxRivers` (w generatorze).

> **Dług techniczny:** w pliku jest jeszcze martwy `buildRiverEdgePoints` (poprzednia wersja po krawędziach, niewpięta) + nieużywane stałe `RIVER_BANK_*` po usunięciu brzegu. Do sprzątnięcia; nie blokuje builda (esbuild).

---

## 7. Miasta — epoka KAMIENIA — `stoneCity.ts`

`buildStoneAgeCity(level: 1..10, ownerColor: number, withWalls = false): THREE.Group`

**Reguły rozwoju:**
- **L1–5: prymityw** — lepianki/szałasy (gliniany walec + stożkowa strzecha).
- **L6–10: cegła** — co 3. budynek to prostokątny domek z cegły mułowej.
- **Centrum = świątynia.** L6+ = **megalit** (krąg stojących kamieni + dolmen/ołtarz), rośnie ze `scale`. L3–5 = ognisko (palenisko + płomień), L4–5 dodatkowo proto-kamienie (2 stojące kamienie).
- **Sztandar wodza** (kolor właściciela) od L5.
- **MURY niezależne od poziomu** (`withWalls`) — gracz buduje je osobno; przy `true` dokładany jest kamienny wał z bramą wokół osady **na dowolnym poziomie**. Dlatego dla podglądu generujemy 2 warianty: 10 poziomów z murem i 10 bez.

**Parametry (panel):**
- `hutCount` per poziom: `[1, 2, 3, 5, 7, 9, 12, 15, 18, 22]`.
- `spread = 0.12 + L*0.05` (promień osady), `hutR = 0.06` (promień chaty).
- Pierścienie: `[[5, spread*0.55], [8, spread*0.85], [16, spread*1.12]]` (limit, promień).
- Progi: ognisko `L>=3`, proto-kamienie `L>=4`, sztandar `L>=5`, świątynia-megalit `L>=6`, chata wodza `L>=8`.
- Kolory: glina `0x8a6a45`, strzecha `0xc2a262/0x9a7d44`, cegła `0xb07a52/0x84573a`, kamień `0x9a8c70/0x77694f`.

---

## 8. Miasta — epoka BRĄZU — `bronzeCity.ts`

`buildBronzeCity(civ: 'grecja'|'rzym', level: 1..10, ownerColor, withWalls=false): THREE.Group`

**Reguły:** każda cywilizacja ma własny **styl domów** i **świątynię-centrum**; 10 poziomów; mury niezależne (`withWalls`). Świątynia w centrum od L1, rośnie (`tScale = 0.8 + (L-1)*0.06`). Domy w pierścieniach (jak kamień), sztandar wodza.

| Cyw | Domy | Świątynia (centrum) |
|---|---|---|
| **Grecja** | białe kubiczne (płaski dach), `wall 0xe9e4d6 / roof 0xd9d3c2` | biała: stylobat + **kolumnada dookoła** + entablatura + **trójkątny fronton/gable** (Partenon) |
| **Rzym** | białe ściany + **czerwone dachówki** spadziste (`wall 0xe7ddc7 / roof 0xb5532f`) | na **podium**, kolumny z frontu + cella + **czerwony gable** |

**Wspólne helpery:** `peristyle(...)` (rzędy kolumn-cylindrów wzdłuż prostokąta), `gableRoof(w,d,apexH,mat)` (dach dwuspadowy = 3-segmentowy prizm `CylinderGeometry(rr,rr,d,3)` obrócony, skalowany w X do szerokości), `bronzeWall(spread)` (kamienny wał + brama).

**Parametry (panel):** `hutCount` per poziom `[2,3,5,7,9,12,15,18,22,26]`, `spread=0.13+L*0.05`, pierścienie `[[6,.62],[10,.9],[18,1.15]]×spread`, `tScale`, palety per-cyw.

> **Następne cyw (na tym samym wzorze):** Sumer (cegła + zikkuraty/wieże), Egipt (cegła nad Nilem), Aztek (schodkowe piramidy). Dodajemy kolejne `case` do `BronzeCiv` + builder świątyni/domu.

---

## 9. Surowce / nakładki — `resources.ts`

`buildResourceOverlay(nakladka: Nakladka): THREE.Group | null` — zwraca **mały** model (mniejszy niż jednostka, ~0.1–0.18 R), dekoracja heksa stawiana lekko z boku środka. `null` dla `Brak`/`Las`.

| Nakładka | Model | Główne kolory |
|---|---|---|
| ZlozeKonia | koń (body+szyja+głowa+4 nogi+ogon) | brąz 0x6b4a2b |
| ZlozeOwiec | owca (wełniana kula + głowa + nogi) | wełna 0xefe9df |
| ZlozeBydla | krowa (body+łaty+rogi+nogi) | brąz+biel |
| ZlozeLamy | lama (długa szyja) | tan 0xc9a877 |
| ZlozeGliny | 3 dzbany | terakota 0xb5774a |
| ZlozeRudy | skały + żyła rudy | szary 0x6e6e76 + 0xb08d3a |

**Reguła:** surowiec musi być **wyraźnie mniejszy niż jednostka** (skala odniesienia z UNITS — patrz §13).

---

## 10. Podglądy + 11. Build & deploy

Każdy podgląd = osobny katalog `src/<x>preview/` (index.html z łapaczem boot-error + `<canvas>`, `main.ts`, `vite.<x>.config.ts`). Sterowanie: **drag=obrót, kółko=zoom, WASD/strzałki=przesuw**.

| Podgląd | Zawartość | Plik wynikowy |
|---|---|---|
| `mappreview` | teren+rzeki+miasta(kamień)+surowce na świecie | `Gra-podglad-MAPA.html` |
| `citypreview` | 10 poziomów miast kamienia (2 rzędy: bez/z murem) | `Gra-podglad-MIASTA.html` |
| `bronzepreview` | Grecja+Rzym (4 rzędy: bez/z murem) | `Gra-podglad-MIASTA-BRAZ.html` |

**Build (podgląd):** `npx vite build --config src/<x>preview/vite.<x>.config.ts` → `dist-<x>/src/<x>preview/index.html` → `cp` do `Gra-podglad-*.html`.
**Reguły builda:** start owinięty w `DOMContentLoaded` (single-file: skrypt rusza przed DOM → inaczej `canvas=null`). `emptyOutDir:false` + ręczne `rm -rf dist-*` (vite rimraf pada na mountcie OneDrive). **NIE** `npm run build` / `export-data.py` (felerny prebuild z obcą ścieżką + blokada OneDrive na `dist/`).
**Pułapka OneDrive (sandbox):** pliki zapisane narzędziem (Write/Edit) bywają ucięte/zdehydratowane w bashu → buduj z kopii edytowanej **bashem** (`sed`/`cat`), deployuj `cp`. (Szczegóły w pamięci dewelopera.)

---

## 12. Parametry → Excel → JSON (panel sterowania)

Wszystkie liczby z §4–9 trafiają do **`Parametry-Civ-MAPA.xlsx`** (zakładki: Teren, Rzeki, Biomy-swiatlo, Miasta-kamien, Miasta-braz, Surowce, Mapowanie-JSON). Każdy wiersz: **moduł · parametr · wartość · zakres · jednostka · opis · docelowy JSON (plik + klucz)**.

**Proponowane pliki JSON (do wczytania przez renderer; obecnie wartości są zaszyte w TS — refactor do zrobienia):**
- `data/render-terrain.json` — paleta + wysokości terenu (TERRAIN_VISUALS).
- `data/render-rivers.json` — szerokości/uniesienie/kolor/delta/maxRivers.
- `data/render-biomes.json` — blend, jitter, światła, mgła, ocean, ramka.
- `data/cities-stone.json` — hutCount[], spread, pierścienie, progi, kolory.
- `data/cities-bronze.json` — per-cyw palety, hutCount[], tScale.
- `data/resources.json` — skale/kolory nakładek.
> Spójnie z istniejącym panelem `Plony-terenow.xlsx → terrain-yields.json/terrain-movement.json` (plony/koszty ruchu — to osobny, gameplayowy panel, nie wizualny).

---

## 13. Interakcje z innymi działami (do potwierdzenia ze zdjęciem struktury)

| Dział | Interakcja / kontrakt |
|---|---|
| **SILNIK** (integrator, `main.ts`, kanon) | (1) `main.ts` JUŻ używa `buildScene` → teren/rzeki wchodzą do kanonu przez **rebuild**. (2) `CityRenderer` (`cities.ts`) podmienia stary model na `buildStoneAgeCity`/`buildBronzeCity` — **level = poziom rozwoju miasta**, `withWalls = czy gracz wybudował mury**, `civ = typ cywilizacji**, `ownerColor = kolor gracza`. (3) Renderowanie **surowców** na heksach wg `hex.nakladka` (wzór: pętla z `mappreview/main.ts`). (4) Wybór **epoki** (kamień/brąz) decyduje, którego buildera miasta użyć. |
| **DANE-CYW** (`civs.json`) | dostarcza listę cywilizacji + ich kolory/typy → mapowanie `civ -> styl miasta` (Grecja/Rzym/Sumer/...). Owner color palette wspólna z `units.ts`/`cities.ts`. |
| **UNITS** (`units.ts`, modele jednostek) | **skala odniesienia**: surowce i detale miasta muszą być mniejsze niż jednostka. Wysokości terenu (TERRAIN_TOP) wspólne — jednostki siadają na `top` (jak miasta). |
| **LOGIKA / AI** | rozmieszczanie **klastrów miast** na mapie (N typów × ~10, regiony Woronoja, min. dystans ≥5 — `Spec-generator-mapy.md`) = wspólnie. „Gniazda" (obozy/spawny, ref. obóz epoki kamienia) — **lane do przypisania przez mastera** (model mógłby powstać tu w render, logika spawnu w AI/LOGIKA). |
| **UI** | HUD/menu (makiety gotowe) — czyta stan, nie ingeruje w render świata. |
| **EPOKI / TECH** | drzewko technologii przełącza epokę → zmiana stylu miast (kamień→brąz) i odblokowanie poziomów rozwoju. |

> **Potwierdzona struktura sesji/działów (23.06):** Civ-Master, Civ-SILNIK, **Civ-MIASTO**, Civ-Dane Cywilizacji (DANE), Civ-Units/Battle (UNITS), Civ-EKONOMIA, Civ-Dyplomacja, Civ-UI, Civ-AI opponent intelligence (AI).
>
> ⚠️ **GRANICA Civ-MAPA ↔ Civ-MIASTO (kluczowa):** Civ-MAPA dostarcza **wizualne buildery** miast — `buildStoneAgeCity(level,owner,withWalls)`, `buildBronzeCity(civ,level,owner,withWalls)` (kontrakt: wejście = stan, wyjście = `THREE.Group`). **Civ-MIASTO** trzyma **STAN i LOGIKĘ** miasta: poziom rozwoju (1–10), czy mury wybudowane, cywilizacja, produkcja, ludność — i woła builder z aktualnym stanem.
> - **Civ-EKONOMIA**: produkcja → wzrost → poziom miasta (steruje, którego wariantu buildera użyć).
> - **Civ-AI opponent intelligence**: rozmieszczanie **klastrów miast** (N typów × ~10, Woronoj, min. dystans ≥5 — `Spec-generator-mapy.md`) + „gniazda"/obozy (logika spawnu w AI; **model wizualny może powstać w Civ-MAPA**).
> - **Civ-Dane Cywilizacji**: `civs.json` → `civ -> styl miasta` + kolory gracza.
> - **Civ-Dyplomacja / Civ-UI**: brak bezpośredniej zależności od renderu świata (UI czyta stan).
>
> **Otwarte pytania do mastera (w MAPA-DO-MASTERA.md):** (1) buildery miast zostają w `render/` (Civ-MAPA) czy przechodzą do Civ-MIASTO? (2) „gniazda" — model w Civ-MAPA, logika w AI? (3) kto wpina render miast/surowców do kanonu — SILNIK czy MIASTO?

---

## 14. Reguły projektowe (zebrane, twarde)

1. Heksy **pointy-top, ZERO rotateY** — nigdy nie rotować geometrii heksa.
2. Tabela wysokości terenu (`top`) **spójna** w scene.ts i wszędzie, gdzie coś siada na heksie (miasta, surowce, jednostki).
3. **Każdy ląd graniczący z morzem ma ≥1 heks wybrzeża** (pierścień wybrzeża w generatorze).
4. Wybrzeże = **jasny lazur** (nie białe). Rzeka = **jasny błękit** (nie czarna), zawsze widoczna (Y=max sąsiadów+lift).
5. Rzeka **kończy się przy pierwszym kontakcie z wodą**; **nie** biegnie wzdłuż wybrzeża; na heksie-ujściu **delta-wachlarz** na lądzie.
6. Miasta: **10 poziomów**, warianty **z murem i bez** (mur niezależny od poziomu). Centrum = **świątynia charakterystyczna dla cywilizacji**.
7. Epoka kamienia: L1–5 prymityw (lepianki), L6–10 cegła; brąz: per-cyw style.
8. Surowce = **małe nakładki** (mniejsze niż jednostka), dekoracja heksa.
9. Podglądy budujemy osobno (`Gra-podglad-*.html`); **kanon publikuje wyłącznie SILNIK**.

## 15. Dług techniczny / TODO (Civ-MAPA)

- [ ] Sprzątnąć `scene.ts`: usunąć martwy `buildRiverEdgePoints` + nieużywane `RIVER_BANK_*`.
- [ ] Wynieść parametry render do JSON (§12) + skrypt eksportu z `Parametry-Civ-MAPA.xlsx`.
- [ ] Rzeka jako realny „dół" (nacinanie geometrii heksów wzdłuż rzeki) — opcjonalne, większa zmiana.
- [ ] Klastry miast na mapie (z SILNIK/AI) wg `Spec-generator-mapy.md`.
- [ ] Brąz: dokończyć po akceptacji Grecji/Rzymu → Sumer/Egipt/Aztek.
- [ ] Wpięcie do gry (SILNIK): `CityRenderer` → stoneCity/bronzeCity; surowce na heksach.
