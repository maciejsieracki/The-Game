# 3 dyspozycje wydajnościowe dla Kursora (wklejaj po kolei)

Jak używać: skopiuj CAŁĄ sekcję „DYSPOZYCJA 1", wklej Kursorowi, poczekaj aż zrobi + przetestuje + wgra. Potem tak samo 2, potem 3. Każda jest samodzielna i niezależna (można w tej kolejności; 1 i 3 dotyczą wejścia do miasta, 2 dotyczy renderu — kolejność 1→2→3 zalecana, ale dowolna działa).
Uwaga o numerach linii: pochodzą z audytu na klonie `main`; w aktualnym repo mogły się przesunąć — Kursor niech potwierdzi po NAZWIE funkcji, nie ślepo po linii.
Wspólna bramka każdej dyspozycji: `tsc --noEmit` = 0 + smoke; test na mapie Super Huge z overlayem F9 (przed/po).

═══════════════════════════════════════════════════════════════
## DYSPOZYCJA 1 — koniec pełnomapowych skanów przy OTWIERANIU MIASTA (mulenie miasta)
═══════════════════════════════════════════════════════════════

Problem: jedno otwarcie panelu miasta na dużej mapie (Super Huge ~320k heksów) uruchamia kilka niezależnych skanów `Object.keys(map.hexes)` / `Object.entries(map.hexes)` po CAŁEJ mapie + `hexDistance` per heks, gdy realnie potrzeba tylko pól w promieniu miasta (~700 przy r15). To ~2 mln iteracji na jedno kliknięcie — stąd „przeliczanie całej mapy".

Zadanie:
1. Dodaj helper enumerujący heksy LOKALNIE w promieniu (bez skanu całej mapy), np. w `game/okolica.ts`:
   ```ts
   export function hexKeysWithinRadius(cq: number, cr: number, rad: number, map: GameMap): string[] {
     const out: string[] = [];
     for (let dq = -rad; dq <= rad; dq++) {
       const lo = Math.max(-rad, -dq - rad), hi = Math.min(rad, -dq + rad);
       for (let dr = lo; dr <= hi; dr++) {
         const key = `${cq + dq},${cr + dr}`;
         if (map.hexes[key]) out.push(key);   // lookup O(1)
       }
     }
     return out;
   }
   ```
   (O(rad²)≈700 zamiast 320k → ~450× mniej.)
2. Podmień RDZEŃ pełnomapowego skanu na ten helper (wynik ma być identyczny — te same heksy w promieniu — tylko bez iteracji po całej mapie) w trzech funkcjach:
   - `game/okolica.ts` → `okolicaTiles` (ok. linia 56–65, pętla `for (const key of Object.keys(map.hexes))` + filtr `hexDistance <= rad`).
   - `game/resource-access.ts` → `hexesInCitySight` (ok. linia 320–327, `for (const [hexKey,hex] of Object.entries(map.hexes))` + filtr `> sight`).
   - `render/cityOkolicaOverlay.ts` → `collectRangeKeys` (ok. linia 192–193, `for (const key of Object.keys(map.hexes))` + filtr `<= range`).
3. Zachowaj promień z istniejącej logiki (r5/r10/r15 wg populacji — helper `cityRangeForPopulation`, nie zaszywaj na sztywno).

Weryfikacja: po zmianie w tych trzech funkcjach NIE ma `Object.keys(map.hexes)` ani `Object.entries(map.hexes)`. Otwórz miasto na Super Huge — okolica, „surowce w zasięgu" i pola robocze IDENTYCZNE jak przed, ale bez lagów. F9 przed/po. `tsc=0`.

═══════════════════════════════════════════════════════════════
## DYSPOZYCJA 2 — frustum culling terenu (klatkowanie PAN/ZOOM)
═══════════════════════════════════════════════════════════════

Problem: klatkowanie przy przesuwaniu/zoomie NIE jest od JS (hover/pick jest analityczny O(1), pętla renderu czysta). Przyczyna: `frustumCulled = false` jest ustawione na wszystkich meshach terenu i dekoru, więc Three.js NIGDY ich nie odrzuca — GPU rysuje wszystkie ~320k pryzmatów terenu + dekor CO KLATKĘ, także poza ekranem. Teren jest już chunkowany przestrzennie, ale przy wyłączonym cullingu chunkowanie nic nie kuluje.

Zadanie:
1. W `render/scene.ts` ustaw `frustumCulled = true` na meshach terenu (chunki — ok. linie 1235/1827) i na InstancedMeshach dekoru (ok. 1236, 1252, 1270 … — jest ich ~12). Znajdź wszystkie `frustumCulled = false` w scene.ts i przełącz na `true` dla terenu/dekoru.
2. Jeśli po włączeniu `frustumCulled=true` na InstancedMesh culling nie działa dobrze (bo bounding sphere obejmuje całą mapę i nic się nie kuluje), zrób ręczny culling PER-CHUNK: policz frustum kamery (`THREE.Frustum().setFromProjectionMatrix(cam.projectionMatrix × cam.matrixWorldInverse)`) i ustaw `chunk.visible = frustum.intersectsBox(chunk.boundingBox)` — w renderLoop lub na zmianę kamery (throttling OK). Upewnij się, że każdy chunk ma policzone `geometry.boundingBox`/`boundingSphere`.
3. UWAGA: nie ucinaj widocznych chunków — daj poprawny bounding (z marginesem na wysokość reliefu), żeby nic nie znikało w kadrze przy szybkim panie.

(Opcjonalnie, jeśli chcesz przy okazji zbić „zoom-stutter": `applyZoomLodDecor` ok. linia 2148 na każdym progu LOD robi `setMatrixAt` per instancja + `instanceMatrix.needsUpdate` = re-upload całego bufora na GPU. Można to zostawić na osobną iterację.)

Weryfikacja: pan/zoom na Super Huge wyraźnie płynniejszy; F9 — „draw calls" SPADA, gdy część mapy jest poza ekranem (przy `frustumCulled=false` draw calls są stałe niezależnie od kadru). Sprawdź, że nic nie znika w widocznym kadrze. `tsc=0`.

═══════════════════════════════════════════════════════════════
## DYSPOZYCJA 3 — usunięcie redundancji przy otwarciu miasta (tanie domknięcie)
═══════════════════════════════════════════════════════════════

Problem: przy jednym otwarciu miasta pola robocze (`resolveWorkedTiles`/`okolicaTiles`) liczone są TRZY razy niezależnie, a dodatkowo odpala się zbędny pełny skan mgły.

Zadanie:
1. Policz pola robocze miasta RAZ na otwarcie i przekaż/zcache'uj zamiast liczyć 3×. Trzy miejsca liczące to samo dla tego samego miasta:
   - `computeView` → `cityWorkedTilesForEconomy` (`game/turn-economy.ts` ~411),
   - hook `getWorkedTiles` → `workedHexCoordsForCity` (`game/turn-economy.ts` ~448, z `renderOkolica`),
   - `okolicaWorkedKeySet` → `resolveWorkedTiles` (`main.ts` ~1528, z `syncOkolicaOverlay`).
   Zrób jedno wyliczenie na otwarcie (memoizacja per `cityId` + wersja mapy/tura, albo policz raz w `openCityPanelForPlayer` i podaj dalej). Po Dyspozycji 1 każde jest już ~450× tańsze, ale i tak liczenie 1× zamiast 3× pomaga przy każdym `refresh()` panelu (ruch suwaka).
2. Usuń wywołanie `refreshFog()` z `applyCityPanelWorldView` (`main.ts` ~1501). Mgła przy samym otwarciu miasta się nie zmienia, a `refreshFog` robi pełny przebieg `setFog` (`render/scene.ts` ~2270) po wszystkich heksach. Zostaw `refreshFog` tam, gdzie widoczność realnie się zmienia (ruch jednostki, koniec tury, zdarzenia).

Weryfikacja: otwarcie miasta robi mniej pracy (F9); okolica i mgła nadal poprawne; mgła aktualizuje się prawidłowo po ruchu jednostki i turze. `tsc=0`.

═══════════════════════════════════════════════════════════════
Pełny audyt z dowodami: `dyspozycje/DO-KURSORA-wydajnosc-mapa-miasto.md`.
