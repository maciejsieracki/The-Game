# SILNIK — Dokumentacja architektury dla dewelopera

> **Projekt:** „The Game" — przeglądarkowa gra 4X w stylu Cywilizacji (TypeScript + Vite + Three.js, build single-file do dwukliku `file://`).
> **Warstwa:** SILNIK (silnik / integracja / pętla tury / kanon). Autor: sesja Civ-Silnik. Stan: 2026-06-23.
> **Plik źródłowy silnika:** `gra/src/main.ts` (≈1234 linie). **Kanon:** `gra/Gra-podglad.html`.
> **Parametry:** pełne wartości w `SILNIK-parametry.xlsx` (ten sam katalog). Tu opisana jest struktura i reguły.

---

## 0. Jak czytać ten dokument

Dokument opisuje **całą warstwę silnika**: jak gra startuje, co dzieje się w każdej turze, które moduły są już wpięte, które czekają w kolejce i **jak je wpiąć**, skąd biorą się parametry (Excel → JSON → kod), jak budować i publikować kanon, oraz jak SILNIK styka się z innymi działami. Sekcje 4–9 to „jak to działa", sekcja 10–12 to parametry, 13–16 to operacje i reguły, 17 to interakcje międzydziałowe.

**Złota zasada warstwy:** logika gry jest **czysta** (bez DOM, bez THREE) i testowalna w Node; warstwy `render/*`, `ui/*`, `battle/*` trzymają DOM/THREE. `main.ts` jest **jedynym** miejscem, które skleja wszystko w pętlę tury i **jedynym** publisherem kanonu.

---

## 1. Cel i zakres warstwy SILNIK

SILNIK odpowiada za:

1. **Bootstrap gry** — wczytanie danych, generacja mapy, budowa sceny 3D, ustawienie jednostek startowych.
2. **Pętlę tury** — co dzieje się po naciśnięciu „N" (koniec tury): ekonomia miast, skarbiec/nauka gracza, auto-badania, odświeżenie mgły i HUD.
3. **Wpinanie gotowych modułów logiki** (`src/game/*`) do pętli tury — to główny ciąg prac (KROK 2–8).
4. **Publikację kanonu** `Gra-podglad.html` — wyłącznie SILNIK buduje i publikuje plik gry.

SILNIK **nie** pisze: renderu (`render/*` = MAPA), wnętrza bitwy (`battle/*` = Units/Battle), paneli (`ui/*` = UI), Exceli/JSON-ów danych (DANE/EKONOMIA/AI/MIASTO/Dyplomacja). SILNIK je **konsumuje i wpina**.

---

## 2. Architektura ogólna

```
gra/
  index.html              # wejście: inline łapacz błędów + <script type=module src=/src/main.ts>
  src/
    main.ts               # SILNIK: bootstrap + pętla tury + sklejanie + (przez vite) kanon
    data/loader.ts        # 13 importów JSON -> typowany GameData (synchronicznie, bez fetch)
    game/                 # CZYSTA logika (bez DOM/THREE):
      turn-economy.ts     #   [WPIĘTE] adapter ekonomii na turę
      playerState.ts      #   [WPIĘTE] skarbiec + nauka + auto-badania
      cities.ts           #   [WPIĘTE] zakładanie miast
      visibility.ts       #   [WPIĘTE] mgła wojny
      combat.ts           #   [WPIĘTE] walka §5l (auto-rozstrzyganie)
      economy.ts          #   [pośrednio] formuły ekonomii (przez turn-economy)
      production.ts       #   [KOLEJKA — osiągalny tylko przez panel UI]
      ai.ts               #   [KOLEJKA]
      victory.ts          #   [KOLEJKA]
      siege.ts            #   [KOLEJKA]
      diplomacy.ts        #   [KOLEJKA]
      culture-religion.ts #   [KOLEJKA]
      order.ts            #   [KOLEJKA]
      save.ts             #   [KOLEJKA]
      research.ts         #   [ORPHAN — duplikat playerState, do usunięcia]
      player-economy.ts   #   [ORPHAN — duplikat bankowania, do usunięcia]
      upkeep.ts, barbarians.ts, converters.ts   # [martwe — nikt nie importuje]
    render/ scene, units, cities, camera, hexutil   # THREE  (dział MAPA / Units)
    ui/ cityPanel, preBattle, uiParams              # DOM    (dział UI)
    battle/ battleScene, manualBattle, facing, ...  # THREE  (dział Units/Battle)
    units/setup.ts        # RuntimeUnit + ruch (Dijkstra) + placeStartingUnits
    map/generator.ts      # generacja mapy (mulberry32 + fBm)  (dział MAPA)
    input/picker.ts       # piksele -> heks
  data/*.json             # 15 plików danych (generowane z Exceli + ręczne)
  tools/                  # export-data.py (xlsx->json), *.cjs (testy)
  vite.config.ts          # build single-file (viteSingleFile + fixScriptTag)
```

---

## 3. Bootstrap (start gry) — `main.ts boot()`

Kolejność wykonania (funkcja `boot()`):

1. **Łapacz błędów** (`window.onerror`/`unhandledrejection` → czerwona nakładka) — diagnostyka „bez czarnego ekranu".
2. `loadGameData()` → `data` (units + tech + parametry).
3. Jeśli `data.terrainMovement` → `configureTerrainMovement(costs, forestExtra)` (nadpisuje wbudowane domyślne koszty ruchu).
4. `SEED = 12345`; utworzenie `<canvas>` na całe okno; HUD (`#hud`) + pasek podpowiedzi.
5. `map = generateMap(36, 28, SEED)` — deterministyczna mapa.
6. `buildScene(map, canvas)` → `{ scene, camera, renderer, center, setFog }`.
7. `new CameraController(camera, canvas, center, {minDist:8, maxDist:160, keyPanSpeed:0.3})`.
8. `units = placeStartingUnits(map, data)` (osadnik gracza + wojownik z brązu obok + do 6 osadników AI, `ownerId` 1..6); `new UnitRenderer(scene, map)`.
9. `cities = []`; `new CityRenderer(scene, map)`; `cityRenderer.sync(cities)`.
10. Mgła: `explored = Set`, `fogOn = true`, `ALL_KEYS = allHexKeys(map)`.
11. Stan gry: `selectedId=null`, `reachable=Set`, `turn=1`, `player = createPlayerState()` (skarbiec/nauka, ownerId 0).
12. `updateHud()` + `refreshFog()`; podpięcie myszy/klawiatury; `renderLoop()`.

---

## 4. Pętla tury — klawisz „N" (rdzeń silnika)

**To jest serce SILNIKA.** Po `keydown` „N" wykonuje się dokładnie ta sekwencja (`main.ts` ~1011–1107):

```
N (koniec tury):
  1. jeśli galeria -> ignoruj
  2. „dośnij" animację ruchu (zapisz q/r, odejmij koszt)
  3. RESET RUCHU:  for u in units: u.ruchLeft = u.ruch
  4. wyczyść selekcję/podświetlenie/trasę
  5. turn++
  6. EKONOMIA MIAST (try):  econ = advanceCityEconomy(cities, map, data, 'normal')
       -> log agregatu; podpowiedź o wzroście/głodzie; cityRenderer.sync(cities)
  7. BANKOWANIE GRACZA (try):  dla econ.perCity gdzie ownerId===0:
       player.skarbiec += suma(pieniadz);  player.nauka += suma(nauka)
  8. AUTO-BADANIA:  step = researchStep(player, data.tech)
       -> dla step.completed: log + podpowiedź „Zbadano: …" (nowa epoka / Pieniądz ×10)
  9. updateHud()
 10. refreshFog()
```

**Co ważne:** `advanceCityEconomy` liczy plony **wszystkich** właścicieli (też AI), ale do skarbca trafiają **tylko** miasta gracza (`ownerId===0`). **W pętli NIE ma**: tury AI, kolejki produkcji, sprawdzania zwycięstwa, utrzymania (upkeep), oblężeń, dyplomacji, kultury/religii, Porządku ani zapisu — to wszystko moduły z kolejki (sekcja 6). To jest **mapa luk do wpięcia**.

### Klawiszologia i mysz (pełna)

| Wejście | Akcja |
|---|---|
| **N** | Koniec tury (sekwencja wyżej) |
| **B** | Załóż miasto (zaznaczony osadnik gracza; `canFoundCity` → `foundCity`) |
| **T** | Bitwa testowa (Legionista vs Falanga → `showPreBattle` → AUTO `resolveCombat` / POLE `BattleScene`) |
| **G** | Galeria jednostek (po jednym tokenie na typ) |
| **F** | Przełącz mgłę wojny |
| **Esc** | Zamknij panel miasta |
| Mysz: klik | miasto → panel; jednostka gracza → selekcja + zasięg; heks w zasięgu → animowany ruch |
| Mysz: hover | podgląd trasy (`computePath` + `setPathRoute`) |

---

## 5. Moduły WPIĘTE (już w pętli/grze)

| Moduł | Rola | Co woła `main.ts` | Dział-właściciel |
|---|---|---|---|
| `game/turn-economy.ts` | Adapter ekonomii na turę (runtime `City`→`EconomyCity`, zapis populacji + `magazynZywnosci`) | `advanceCityEconomy(cities, map, data, 'normal')` → `EconomyTickResult` | EKONOMIA |
| `game/playerState.ts` | Skarbiec + nauka + auto-badania gracza | `createPlayerState()`, `researchStep(player, data.tech)` | SILNIK |
| `game/cities.ts` | Walidacja + zakładanie miast, nazwy | `canFoundCity`, `foundCity`, `cityName` | MIASTO |
| `game/visibility.ts` | Mgła wojny | `computeVisible`, `addExplored`, `allHexKeys`, `DEFAULT_SIGHT=3` | MAPA/SILNIK |
| `game/combat.ts` | Walka §5l (auto) | `resolveCombat(atk, def, {defenderTerrain})` | Units/Battle |
| `battle/battleScene.ts` | Taktyczna bitwa 3D | `new BattleScene({...}).play(cb)` | Units/Battle |
| `ui/cityPanel.ts` | Panel miasta (DOM) — **importuje `availableProduction` z `production.ts`** | `showCityPanel`, `hideCityPanel`, `isCityPanelOpen` | UI / MIASTO |
| `ui/preBattle.ts` | Ekran przed-bitwą (DOM) | `showPreBattle`, `hidePreBattle`, `isPreBattleOpen` | UI |
| `render/scene.ts` | Scena THREE + mgła | `buildScene(map, canvas)` → `setFog` | MAPA |
| `render/units.ts` | Tokeny jednostek (THREE) | `new UnitRenderer(...)`: `sync/setHighlight/setPathRoute/...` | Units/MAPA |
| `render/cities.ts` | Znaczniki miast | `new CityRenderer(...).sync(cities)` | MAPA |
| `render/camera.ts` | Kamera orbit/pan/zoom | `new CameraController(...).update()` | MAPA |
| `units/setup.ts` | RuntimeUnit + ruch (Dijkstra) | `placeStartingUnits`, `computeReachable`, `computePath`, `categoryOf`, … | SILNIK/Units |
| `input/picker.ts` | Piksele → heks | `pixelToHex`, `unitAt`, `keyOf` | SILNIK |
| `map/generator.ts` | Generacja mapy | `generateMap(36, 28, seed)` | MAPA |
| `data/loader.ts` | Dane JSON → typowany `GameData` | `loadGameData()` | SILNIK/DANE |

---

## 6. KOLEJKA — moduły gotowe, NIEWPIĘTE (KROK 2–8)

Wszystkie poniższe są **napisane, czyste, przetestowane**, ale **nie wpięte w pętlę tury** (poza `production.ts`, który jest osiągalny tylko przez panel UI, nie przez turę). Każdy ma **punkt wejścia na turę** (⟶). Zadaniem SILNIKA jest dodać dla każdego jeden blok `try` w handlerze „N" (wzorzec jak `advanceCityEconomy`), zbudować kanon i przejść bramkę testów.

| KROK | Moduł | Punkt wejścia na turę (⟶) | Co robi |
|---|---|---|---|
| **2** | `production.ts` | `advanceProduction(prod, pracaPerTurn)` → `{prod, completed}` | Kolejka produkcji miasta; postęp wg Pracy; ukończenie dodaje budynek/jednostkę (≤1/turę) |
| **3** | `ai.ts` | `decideAITurn(playerId, units, cities, map, data, opts)` → `AICommand[]` | Decyzje rywali: ruch/zakładanie/atak/budowa → lista komend do wykonania |
| **3** | `victory.ts` | `checkVictory(input)` → `VictoryResult \| null` | Zwycięstwo: dominacja typu cyw / nauka / przegrana |
| **4** | `siege.ts` | `resolveSiegeAttack(attacker, city, opts)` → `SiegeAttackResult` | Oblężenie: mury/teren/milicja, zdobycie miasta |
| **5** | `diplomacy.ts` | `aiDiplomacyStance(ai, other, rel, ctx)` → `AIDiplomacyStance` | Relacje (zaufanie/respekt/status), zdarzenia dyplomatyczne |
| **5** | `culture-religion.ts` | `accumulateCulture(...)`, `spreadReligion(...)` | Granice kulturowe + zadowolenie; dominacja/konwersja religii |
| **5** | `order.ts` | `evaluateOrder(inputs, params?)` → `{order, tier, effects}` | Porządek = waga·Szczęście + waga·Prawo; progi T1/T2 → kary/bonusy |
| **6** | `save.ts` | `serializeGame/saveToLocal/loadFromLocal` (zdarzeniowo, nie co turę) | Zapis/odczyt stanu (units/cities/tura/explored) + sloty |

### Wzorzec wpięcia (przykład — KROK 2 produkcja)

W handlerze „N", po bloku ekonomii, dodać blok `try`:
1. Każde miasto ma swój `CityProduction` (`{kolejka, postep}`). Dla każdego miasta: `const r = advanceProduction(city.prod, pracaTegoMiasta)`.
2. Jeśli `r.completed` → dodaj budynek/jednostkę (jednostka kosztuje `populationCostOf` populacji), zaktualizuj render.
3. `city.prod = r.prod`. Budowanie/zarządzanie kolejką (UI) jest po stronie **UI** (`cityPanel.ts` woła `availableProduction/enqueue/dequeue`) — SILNIK robi tylko **postęp na turę + ukończenie**.

> **DoD każdego kroku:** `vite build` OK + `smoke` + `battle-smoke` + `logic` + `combat` zielone + funkcja realnie działa → publikacja jednego świeżego `Gra-podglad.html` (pełna bramka).

---

## 7. Orphany i pliki martwe (higiena — KROK 8)

- `game/research.ts` — pełny silnik badań; **zastąpiony** przez `playerState.researchStep`. Importowany przez **nikogo** (zweryfikowane grepem). Do usunięcia.
- `game/player-economy.ts` — agregacja skarbca + **upkeep**; zastąpiony inline-bankowaniem w `main.ts`. Importowany przez **nikogo**. Do usunięcia. (Uwaga: to jedyne miejsce z logiką utrzymania — przy wpinaniu upkeepu w przyszłości warto z niego odzyskać wzory.)
- `game/upkeep.ts`, `game/barbarians.ts`, `game/converters.ts` — obecne w repo, importowane przez nikogo (martwe do czasu wpięcia).

> Usuwać dopiero po potwierdzeniu i przy działającym buildzie (weryfikacja, że nic się nie psuje).

---

## 8. Pipeline danych i parametrów (Excel → JSON → kod)

```
*.xlsx  --(gra/tools/export-data.py)-->  gra/data/*.json  --(import w loader.ts/cities.ts/...)-->  silnik
```

`export-data.py` czyta Excele z katalogu projektu i zapisuje JSON-y w `gra/data/`. Każdy eksport jest w `try/except` (przy błędzie zostawia istniejący JSON). Mapowanie:

| Excel | → JSON | Dział |
|---|---|---|
| `Jednostki.xlsx` (Jednostki/Countery/Teren) | `units.json`, `counters.json`, `terrain-combat.json` | Units |
| `Budynki.xlsx` | `buildings.json` | MIASTO/EKONOMIA |
| `Surowce.xlsx` | `resources.json` | EKONOMIA |
| `Technologie-drzewko.xlsx` | `tech.json` | SILNIK/DANE |
| `Cywilizacje.xlsx` | `civs.json` (`{cywilizacje, start_gry}`) | DANE |
| `Plony-terenow.xlsx` | `terrain-yields.json`, `terrain-movement.json` | MAPA/EKONOMIA |
| `Dyplomacja.xlsx` | `diplomacy.json` | Dyplomacja |
| `Ekonomia-parametry.xlsx` | `econ-params.json` | EKONOMIA |
| `Spoleczenstwo-parametry.xlsx` | `society-params.json` | MIASTO (zdrowie/szczescie/kultura/religia/porzadek) |
| `AI-parametry.xlsx` | `ai-params.json` | AI |
| (ręcznie/targeted) | `miasto-params.json`, `ui-params.json` | MIASTO / UI |

> **PUŁAPKA:** `npm run build` ma hook `prebuild = npm run data`, który odpala `export-data.py` i **nadpisuje wszystkie JSON-y** (m.in. cudzy `civs.json`). Dlatego SILNIK **NIGDY** nie używa `npm run build` — buduje `vite` bezpośrednio (sekcja 13). `miasto-params.json` i `ui-params.json` **nie** przechodzą przez `loader.ts` — są importowane wprost przez `cities.ts`, `production.ts`, `ui/uiParams.ts`.

---

## 9. Parametry — gdzie są i jak je zmieniać

Pełna lista parametrów (z wartościami easy/normal/hard, jednostką, opisem, efektem i statusem) jest w **`SILNIK-parametry.xlsx`**. Struktura:

- **`econ-params.json`** — bloki `ekonomia_miasta`, `budynki`, `teren_mapa`, `globalne`. Każdy klucz to wiersz `{easy, normal, hard, jednostka, opis}`.
- **`society-params.json`** — bloki `zdrowie`, `szczescie`, `kultura`, `religia`, `porzadek` + lista `religie_cywilizacji`. Ta sama struktura difficulty.
- **`ai-params.json`** — płaskie `{wartosc, sekcja, opis}` (bez podziału na trudność; trudność jest osobnymi kluczami `trudnosc_poziomN_*`).
- **`miasto-params.json`** / **`ui-params.json`** — pojedyncze wartości `{wartosc, jednostka, opis}`.

**Aby zmienić parametr:** edytujesz wartość w Excelu działu (np. `Ekonomia-parametry.xlsx`), uruchamiasz `export-data.py` **tylko dla swojego Excela/JSON-a** (nie cały, by nie nadpisać cudzych), a SILNIK przy najbliższym buildzie wciąga nowy JSON. `SILNIK-parametry.xlsx` jest **lustrem/sterownikiem** — pokazuje wszystkie parametry silnika i ich źródłowy klucz JSON.

### 9.1 Parametry ZASZYTE w kodzie (kandydaci do wyniesienia do JSON)

To ważna lista długu technicznego — wartości, które „powinny" być w JSON, ale są literałami w TS:

| Wartość | Miejsce | Uwaga |
|---|---|---|
| `SEED = 12345` | `main.ts` | seed mapy |
| `DRAG_THRESHOLD=6 px`, `ANIM_SEG_DUR=0.14 s`, `TOKEN_LIFT`, gallery layout | `main.ts` | UI/animacja |
| Kamera `minDist:8, maxDist:160, keyPanSpeed:0.3` | `main.ts` | |
| `szanseAtkPct = clamp(50 + (Atk−Obrona)*5, 10, 90)` | `main.ts` (podgląd) i `combat.ts` (kanon §5l) | **wzór trafienia zaszyty** |
| `baseDamage = max(1, Atak−Pancerz+Przebicie) + Uderzenie`; counter ×1.5; teren Wzgórza 1.5 / Góry 1.75 / Las 1.5 / rzeka atak ×0.75; `maxRounds=30` | `combat.ts` | **walka §5l NIE jest data-driven** mimo że `terrain-combat.json` istnieje |
| `TERRAIN_YIELDS` + `RIVER_MODIFIER` + `FOREST_MODIFIER` | `economy.ts` | **duplikat `terrain-yields.json`** w kodzie |
| baza progu wzrostu `10 + ludnosc*coeff` (to „10") | `economy.ts` | offset zaszyty; współczynnik z JSON |
| `DEFAULT_SIGHT=3` | `visibility.ts` | zasięg widzenia |
| `RIVER_MOVE_BONUS=4` | `setup.ts` | bonus startu na rzece |
| `TARGET_AI=6, MIN_AI=3, ABS_MIN_DIST=2`, minDist=5 | `setup.ts` | rozstawienie AI |
| Stałe oblężeń / dyplomacji | `siege.ts`, `diplomacy.ts` | moduły z kolejki (mają częściowo własne param-loadery) |

> Rekomendacja architekta: przy wpinaniu walki-z-mapy (KROK 4) i AI (KROK 3) ujednolicić źródło prawdy — albo wszystko z JSON, albo świadomie zostawić §5l w kodzie i **usunąć** martwy `terrain-combat.json` z pipeline, by nie sugerował data-driven.

---

## 10. Build i publikacja kanonu

**Skrypty `package.json`:** `data`=`python3 tools/export-data.py`; `predev/prebuild`=`npm run data`; `dev`=`vite`; `build`=`vite build`; `typecheck`=`tsc --noEmit`.

**`vite.config.ts` (kanon):** `viteSingleFile()` + własny `fixScriptTag()` (post-build), który (1) usuwa `crossorigin` i (2) zmienia `type="module"`→`type="text/javascript"` — żeby IIFE działał z `file://` bez CORS/czarnego ekranu. Build: `format:'iife'`, `inlineDynamicImports:true`, `assetsInlineLimit:∞` → jeden samodzielny HTML w `gra/dist/index.html` → to jest kanon `gra/Gra-podglad.html`.

### 10.1 Komenda budowania (OBOWIĄZUJĄCA w SILNIK)

```bash
cd gra
./node_modules/.bin/vite build --outDir /tmp/civ-dist --emptyOutDir   # NIE npm run build (prebuild kasuje JSON!)
# bramka:
node tools/smoke.cjs /tmp/civ-dist/index.html
node tools/battle-smoke.cjs /tmp/civ-dist/index.html
node tools/logic-test.cjs
node tools/combat-test.cjs
# publikacja (dopiero po zielonej bramce):
cp /tmp/civ-dist/index.html ../Gra-podglad.html
```

**Dlaczego `--outDir /tmp`:** OneDrive blokuje `unlink` w `gra/dist/` (`EPERM`), więc `vite` nie może wyczyścić katalogu wyjściowego. Budujemy do `/tmp` (dysk lokalny piaskownicy) i kopiujemy gotowy plik do kanonu.

---

## 11. Pułapki operacyjne OneDrive (krytyczne dla buildu)

Folder jest synchronizowany OneDrive. Piaskownica (bash) bywa **nieświeża**:

1. **Re-dehydratacja / nieświeży mount** — `wc -l`/`vite` widzą plik **ucięty** (np. „Unexpected end of file" / „Unterminated string literal"), choć w chmurze jest kompletny. **Diagnoza:** otwórz plik narzędziem **Read** (czyta chmurę) — jeśli pokazuje pełną treść = to tylko nieświeży mount, **NIE sklejaj/nadpisuj** pliku. **Naprawa:** Read (hydracja) + odczekać + powtórzyć build; albo Maciej: „Always keep on this device" na całym `gra/` (z `data/`) / Ctrl+S danego pliku.
2. **EPERM na `dist/`** — patrz 10.1 (build do `/tmp`).
3. **Build pełnego grafu** — kanon kompiluje się tylko, gdy **wszystkie** importowane pliki są świeże; jeśli inny dział właśnie edytuje plik z grafu (np. `cityPanel.ts`), build pada do czasu jego zsynchronizowania/zapisania. SILNIK **nie rekonstruuje** cudzych plików — czeka na hydrację.

> Zasada żelazna: **NIE sklejać/nadpisywać plików**, **NIE edytować `main.ts` bez weryfikującego buildu**, **NIE publikować niezweryfikowanego kanonu**.

---

## 12. Reguły lane SILNIK (dla każdego, kto wchodzi w tę warstwę)

- `src/main.ts` oraz publikacja `Gra-podglad.html` = **tylko** SILNIK. Inni nie dotykają `main.ts`.
- SILNIK edytuje wyłącznie: `main.ts`, wpięcia `game/*` (cienka warstwa kleju), `playerState.ts`. **Nie** dotyka `render/*`, `battle/*` (wnętrze), `ui/*` (panele), Exceli/JSON-ów danych.
- Tworzyć nowe czyste pliki `game/*.ts` może każdy; wpina je SILNIK.
- Po każdej zmianie: build + bramka testów; po fali — jeden świeży kanon.
- Kod ASCII (polskie znaki przez `\uXXXX` lub komentarze ASCII).
- Kanał z masterem: dyspozycje w `dyspozycje/SILNIK.md`, raporty w `dyspozycje/SILNIK-DO-MASTERA.md` (+ to samo w czacie do Maciej).

---

## 13. Status `order.ts` (rozwiązane)

Test `logic-test`: „order: loadOrderParams scales by difficulty (easy T1=−1, hard T1=1)". Diagnoza: dane (`society-params.json` → `porzadek.porzadek_prog_t1 = {easy:−1, normal:0, hard:1}`) **są poprawne**, a kod (`order.ts:222`) **poprawnie** rozpakowuje blok `society.porzadek` i `pick()` zwraca wartość per trudność. Wynik „162/163" był ze **starej migawki** (przed synchronizacją danych/kodu). **Po stronie SILNIK nic do poprawy** — potwierdzić 163/163, gdy `logic-test` znów się skompiluje.

---

## 14. Słownik typów rdzenia

- **`RuntimeUnit`** (`units/setup.ts`): `id, ownerId (0=gracz,1..N=AI), typeId, category, q, r, ruch, ruchLeft`.
- **`City`** (`game/cities.ts`): `id, ownerId, q, r, name, population, magazynZywnosci?`. Celowo „rzadki" — `economy.ts`/`siege.ts`/`culture-religion.ts` mapują go na własne, bogatsze kształty (`EconomyCity`, `SiegeCity`, `CultureCity`).
- **`PlayerState`** (`playerState.ts`): `skarbiec, nauka, zbadane:Set, badana, era, pieniadzMnoznik (×10 po Walucie)`.
- **`GameData`** (`loader.ts`): `units, buildings, resources, tech, civs, terrainYields, terrainCombat, counters, diplomacy, econParams, aiParams, societyParams, terrainMovement`.
- **`EconomyTickResult`/`CityEconomyTick`** (`turn-economy.ts`): agregat HUD + plony per miasto.
- **`Hex`/`GameMap`** (`types/*`): heks z terenem/nakładką/ulepszeniem/rzeką; mapa `hexes:Record<"q,r",Hex>` + `riverPaths`.

---

## 15. Interakcje z innymi działami (mapa współpracy)

Działy (wg sidebara): **Master, EKONOMIA, Dyplomacja, Dane Cywilizacji (DANE), Units/Battle, MAPA, Silnik, UI, MIASTO, AI**. SILNIK jest integratorem — styka się z każdym:

| Dział | Co wnosi (pliki/dane) | Styk z SILNIKIEM |
|---|---|---|
| **Master** | orkiestracja, `dyspozycje/*`, recenzja kanonu | Wydaje dyspozycje (`SILNIK.md`); SILNIK raportuje (`SILNIK-DO-MASTERA.md`); master recenzuje każdą dostawę wg DoD |
| **EKONOMIA** | `economy.ts` (formuły), `Ekonomia-parametry.xlsx`→`econ-params.json` | SILNIK woła `advanceCityEconomy` (adapter `turn-economy.ts`) co turę; konsumuje `econParams`. **Styk:** `turn-economy.ts` to klej SILNIK↔EKONOMIA. Uwaga: `TERRAIN_YIELDS` zaszyte w `economy.ts` dublują `terrain-yields.json` |
| **MIASTO** | `cities.ts`, `production.ts`, `order.ts`, `culture-religion.ts`, `miasto-params.json`, `buildings.json`, `Schemat-dzialania-miasta.md` | SILNIK wpina produkcję (KROK 2), Porządek + kulturę/religię (KROK 5) w pętlę; MIASTO dostarcza formuły miasta. **Styk:** panel miasta (UI) pokazuje stan; granica: SILNIK = postęp na turę, MIASTO = formuły |
| **Units/Battle** | `units.json`, `Jednostki.xlsx`, `render/units.ts`, `battle/*`, `combat.ts`, `counters.json` | SILNIK konsumuje `units.json` (statystyki), woła `resolveCombat` + `BattleScene`. **Styk:** różnicowanie jednostek na mapie (`typeId` → `buildUnitModel`) to 1-linijkowa zmiana **po stronie Units** w `render/units.ts`; SILNIK potem przebudowuje kanon. SILNIK nie tyka wnętrza `battle/*` |
| **MAPA** | `map/generator.ts`, `render/scene.ts`, `render/*`, `gen-helpers.ts`, `terrain-*.json` | SILNIK woła `generateMap` + `buildScene`; konsumuje `terrain-movement`/`yields`. MAPA jest właścicielem renderu i generatora — SILNIK tylko inicjuje i `sync`-uje |
| **AI** | `ai.ts`, `AI-parametry.xlsx`→`ai-params.json`, `Spec-AI.md` | SILNIK wpina `decideAITurn` w pętlę (KROK 3) i **wykonuje** zwrócone `AICommand[]` (ruch/zakładanie/atak/budowa). AI dostarcza decyzje + parametry archetypów/trudności |
| **Dyplomacja** | `diplomacy.ts`, `Dyplomacja.xlsx`→`diplomacy.json` | SILNIK wpina `aiDiplomacyStance` + panel (KROK 5); Dyplomacja dostarcza model relacji i zdarzeń |
| **DANE (Cywilizacje)** | `civs.json`, `Cywilizacje.xlsx`, religie | SILNIK konsumuje `civs` (start gry, typy cyw) — używane przez `placeStartingUnits`, `victory` (dominacja typu), `culture-religion`. DANE rozszerza do 50 cyw |
| **UI** | `ui/cityPanel.ts`, `ui/preBattle.ts`, `ui/uiParams.ts`, `ui-params.json`, makiety HUD/nowa-gra | SILNIK woła `showCityPanel`/`showPreBattle`; `cityPanel` importuje `production.availableProduction`. **Styk:** wpięcie paneli/HUD do `main.ts` ustalane SILNIK↔UI; kolejka produkcji: SILNIK = silnik, UI = panel. Nowa gra (KROK 7) = flow startu od UI, wpięcie od SILNIK |

### 15.1 Najważniejsze punkty styku (do pilnowania)

1. **`render/units.ts`** — współdzielony: Units edytuje (hełmy/typy), SILNIK tylko przebudowuje kanon. Nie edytować równolegle (OneDrive last-writer-wins).
2. **`cityPanel.ts`** — UI/MIASTO; importuje `production.ts`; w grafie kanonu, więc jego niedokończona edycja blokuje build SILNIKA.
3. **`turn-economy.ts`** — klej SILNIK↔EKONOMIA; jeśli zmienia się sygnatura `economy.ts`, trzeba zgrać adapter.
4. **`civs.json` / `units.json`** — jeśli DANE/Units re-eksportują, SILNIK wciąga przy buildzie; nie odpalać pełnego `export-data.py` (nadpisze cudze).

---

## 16. Skrót dla nowego dewelopera (TL;DR)

1. Gra startuje w `boot()`; logika gry jest czysta, render/UI/battle trzymają THREE/DOM.
2. **Cała żywa logika tury** to dziś: ekonomia miast + bankowanie gracza + auto-badania (klawisz „N"). Reszta czeka.
3. Twoja praca jako SILNIK = **wpinać** kolejne moduły z `src/game/*` w handler „N" (KROK 2→8), po każdym build+testy+kanon.
4. Buduj `vite` bezpośrednio do `/tmp`, kopiuj do `Gra-podglad.html`. Nigdy `npm run build`.
5. Parametry: zmieniasz w Excelu działu → `export-data.py` (selektywnie) → JSON → build. `SILNIK-parametry.xlsx` to mapa wszystkich parametrów silnika.
6. Przy „uciętym pliku" w buildzie — to OneDrive, nie korupcja: Read + czekaj + retry; nie sklejaj.
