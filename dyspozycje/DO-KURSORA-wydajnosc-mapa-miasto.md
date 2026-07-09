# DO KURSORA — wydajność: klatkowanie pan/zoom + mulenie wejścia do miasta (duże mapy)

Data: 2026-07-08. Audyt: subagent Opus (INTEGRATOR), świeży klon `main`. Kod: `gra-robocza/srcKopiaMaster`.
Objaw (Maciej, Super Huge ~320k heksów): klatkuje przy przesuwaniu/zoomie kamery ORAZ przy wejściu do miasta („jakby przeliczał całą mapę”).
WAŻNE: pierwszy raport wydajności celował w KONIEC TURY (AI/pathfinding/workery) — to NIE ten objaw. Te dwa problemy to co innego (render + otwarcie miasta). Bramka: `tsc --noEmit`=0 + smoke; test na Super Huge z F9.

## PRZYCZYNA A — OTWARCIE MIASTA: 6 pełnomapowych skanów na jedno kliknięcie (główny objaw „mulenia miasta”)

Wejście: `openCityPanelForPlayer` (`main.ts:1694`) → `applyCityPanelWorldView(true)` + `showCityPanel` → `paintCityPanelSections` + `syncOkolicaOverlay`. Każdy skan to `Object.keys/entries(map.hexes)` + `key.split(',')` + `hexDistance` PER heks (320k), gdy realnie potrzeba ~700 pól (r15):

1. `game/okolica.ts:65` (`okolicaTiles`) ← `turn-economy.ts:411` (`cityWorkedTilesForEconomy`) ← `computeView` (cityPanel.ts:533, z `paintCityPanelSections:6596`).
2. `game/okolica.ts:65` znów ← `turn-economy.ts:448` (`workedHexCoordsForCity`) ← `renderOkolica` (cityPanel.ts:6613) ← hook `getWorkedTiles` (main.ts:2016).
3. `game/resource-access.ts:327` (`hexesInCitySight`) → `collectDepositPotential`/`getCityResourceAccessForCity:453` ← `renderSurowce` (cityPanel.ts:6661, BEZWARUNKOWO każda zakładka) ← hook `getResourceAccess` (main.ts:1926).
4. `game/okolica.ts:65` trzeci raz ← `okolicaWorkedKeySet`/`resolveWorkedTiles` (main.ts:1528) ← `syncOkolicaOverlay` (main.ts:1538).
5. `render/cityOkolicaOverlay.ts:193` (`collectRangeKeys`) ← `buildCityOkolicaOverlayGroup` ← `syncCityOkolicaOverlay` (main.ts:1538).
6. `render/scene.ts:2270` (`setFog`, pętla po `hexInstance`) ← `refreshFog()` w `applyCityPanelWorldView` (main.ts:1501) — a mgła przy otwarciu miasta się NIE zmienia → skan zbędny.

Redundancja: pola robocze liczone 3× (skany #1, #2, #4) — ten sam `resolveWorkedTiles` dla tego samego miasta.

FIX (wspólny #1–#5): zamiast `Object.keys/entries(map.hexes)` + filtr dystansu — **enumeruj lokalnie** heksy w promieniu:
```
for (let dq=-rad; dq<=rad; dq++)
  for (let dr=Math.max(-rad,-dq-rad); dr<=Math.min(rad,-dq+rad); dr++) {
    const h = map.hexes[`${cq+dq},${cr+dr}`]; if (h) ...   // lookup O(1)
  }
```
= O(rad²)≈700 zamiast 320k (~450×). Jeden helper `hexKeysWithinRadius(cq,cr,rad,map)` podmienia rdzeń w `okolicaTiles`, `hexesInCitySight`, `collectRangeKeys`.
Dodatkowo: policz worked-tiles RAZ na otwarcie i przekaż (usuwa #2, #4). Usuń `refreshFog()` z `applyCityPanelWorldView` (main.ts:1501, #6).
Uwaga wtórna: każdy `refresh()` panelu (ruch suwaka) ponawia skany #1–#3 → po fixie znika też zacinanie przy interakcji.

## PRZYCZYNA B — PAN/ZOOM: GPU rysuje całą mapę co klatkę (NIE raycasting)

Hipoteza „per-frame JS / raycasting hover” OBALONA: pick jest analityczny (`input/picker.ts pixelToHex` = `ray.intersectPlane(y=0)` + `worldToAxial`, O(1)); `mousemove` (main.ts:5884) bez jednostki od razu `return`; renderLoop (main.ts:8810–8974) i kamera (camera.ts:76–162) bez pętli po heksach; `setZoomLod` ma early-exit (scene.ts:2239); `refreshFog` nie jest per-frame.

Prawdziwy koszt:
1. **`frustumCulled = false` na wszystkich meshach** (`render/scene.ts:1236, 1252, 1270, …` + chunki terenu `scene.ts:1235/1827`) → Three.js nigdy nie odrzuca; GPU rysuje wszystkie 320k pryzmatów + dekor co klatkę, także poza ekranem. Chunkowanie istnieje, ale przy `frustumCulled=false` nic nie kuluje. **Dominujący koszt panningu.**
   FIX: `frustumCulled = true` na chunkach terenu (są już podzielone przestrzennie), lub ręczny culling `chunk.visible` wg frustuma kamery.
2. **Zoom-stutter:** `applyZoomLodDecor` (`render/scene.ts:2148`, z `setZoomLod`) na progu zoomu robi `setMatrixAt` per instancja + `instanceMatrix.needsUpdate` = re-upload całego bufora na GPU (~5 progów = ~5 szarpnięć). FIX: unikać pełnego re-uploadu (prekomputowane bufory per-LOD + przełączanie widoczności, lub aktualizacja tylko zmienionych zakresów).

## TOP 3 (najtaniej / największy zysk)
1. Lokalna enumeracja zamiast pełnego skanu w `okolicaTiles` (`game/okolica.ts:56`), `hexesInCitySight` (`game/resource-access.ts:~320`), `collectRangeKeys` (`render/cityOkolicaOverlay.ts:192`) — 5/6 skanów otwarcia miasta 320k→~700. **Największy zysk na „mulenie miasta”.**
2. `frustumCulled = true` / culling per-chunk terenu (`render/scene.ts:1236` + chunki). **Największy zysk na pan/zoom.**
3. Redundancja otwarcia: worked-tiles raz (kasuje #2, #4) + usuń `refreshFog()` z `applyCityPanelWorldView` (#6). Prawie darmowe.

## PUŁAPKI UTAJONE (nie odpalają się teraz, ale ryzyko)
- `resolveEmpireSnap` (`ui/cityPanel.ts:583`) fallback: pętla po WSZYSTKICH miastach gracza z `computeView` każde (= skan #1 × liczba miast). Ratuje hook `getEmpireHud` (main.ts:1974) zwracający non-null; gdy zwróci null → O(miasta×320k) na otwarcie.
- `collectCultureRangeHexKeys`/`collectReligionRangeHexKeys` (`map/range-hexes.ts:35, 78`): `for cities { for Object.keys(map.hexes) }` = O(miasta×N). Z `refreshRangeOverlays` (main.ts:2915). Gated flagami `cultureRangeVisible`/`religionRangeVisible` (domyślnie off) — ale z włączoną nakładką zasięgu otwarcie miasta dokłada O(miasta×320k). Też przejść na lokalną enumerację.

## Weryfikacja
F9 (overlay perf) na Super Huge: przed/po. Otwarcie miasta powinno przestać „przeliczać mapę”; pan/zoom — spadek draw calls po włączeniu cullingu. Bramka `tsc=0` + smoke (panel miasta działa, mgła/okolica/surowce poprawne).
