# LOG OPTYMALIZACJI FPS / WYDAJNOŚCI — gra „The Game"

Cel pliku (prośba Macieja 2026-07-09): pamiętać **co już zoptymalizowano**, gdzie to siedzi w
kodzie, i **czy przy czyszczeniu/refaktorze trzeba będzie powtórzyć** — bo część optymalizacji
to nie osobne moduły, tylko wpięcia w duże pliki (`scene.ts`, `main.ts`), które łatwo zgubić
przy przepisywaniu.

Baseline PRZED zwierzętami/dekoracjami (F9, cam dist 9, LOD 0):
**FPS 57 · draw 37 · tri 6 711 044 · mesh 38 889 · inst 328 805 · fog 1,9 ms.**
(Wcześniej, przed pracami FPS: 10 FPS przy największej mapie; fog 41,4 ms.)

Legenda „przy czyszczeniu": 🟥 = zginie przy przepisaniu pliku, trzeba świadomie odtworzyć ·
🟨 = częściowo w osobnym module (bezpieczniejsze) · 🟩 = samodzielny moduł/plik (przetrwa).

---

## 1. Founding perf — kandydat-set (D13) 🟨
- **Co:** zakładanie miasta liczyło `getQualifyingHexes` skanując ~320k `Object.values(map.hexes)` ×19 typów ulepszeń przy budowaniu HUD. Zbudowano raz `candidateHexKeys` (terytorium+ring+drogi+placed) i iteruje kandydatów.
- **Efekt:** ~5,2 s → ~1,67 s przy zakładaniu miasta.
- **Gdzie:** `gra/src/map/improvement-build.ts` (`createImprovementBuildApi`, `candidateHexKeys`, `getQualifyingHexes`).
- **Przy czyszczeniu:** jeśli przepisywany improvement-build — ODTWORZYĆ kandydat-set (inaczej wraca skan 320k).

## 2. Merge dekoracji do 1 mesha (lewar 1) 🟥
- **Co:** grupy dekoracji per-heks (dziesiątki boxów: zwierzęta/budynki/wybrzeże) zwijane w JEDEN mesh ze zmergowaną BufferGeometry + vertex colors (kolor materiału wpieczony w wierzchołki → mgła działa jak wcześniej). Zredukowało liczbę obiektów Mesh (główny koszt CPU: traversal+culling+macierze).
- **Efekt:** mesh **1,3 mln → 39k**, FPS **10 → 52**.
- **Gdzie:** `gra/src/render/mergeDecor.ts` (`collapseToMergedMesh`); wołane w `scene.ts` (styledOverlays, po pętli heksów) i `main.ts` (resourceOverlays, spawnImprovementMesh).
- **Przy czyszczeniu:** 🟥 wpięcia w `scene.ts`/`main.ts` łatwo zgubić przy przepisaniu tych plików. Sam `mergeDecor.ts` przetrwa, ale trzeba PONOWNIE go wołać na grupach dekoracji. Walidacja: `merge-test` (12/12).

## 3. matrixAutoUpdate off na statycznych meshach (lewar 3 + rozszerzenie) 🟥
- **Co:** statyczne obiekty nie liczą `updateMatrix` co klatkę. (a) zmergowane meshe dekoracji (`mergeDecor.ts` ustawia `m.matrixAutoUpdate=false`), (b) grupy overlayów (`ov.matrixAutoUpdate=false; ov.updateMatrix()`), (c) wszystkie statyczne InstancedMeshe terenu — globalny `scene.traverse` na końcu `buildScene` ustawia `matrixAutoUpdate=false` na `isInstancedMesh` (pomija oceanMesh — jego `position.y` zmienia się w setFog).
- **Gdzie:** `mergeDecor.ts` (linia z `m.matrixAutoUpdate`), `scene.ts` (traverse przed `return`, oraz przy styledOverlays), `main.ts` (resourceOverlays/spawnImprovementMesh).
- **Przy czyszczeniu:** 🟥 traverse w `scene.ts` i wpięcia w `main.ts` — odtworzyć przy przepisaniu.

## 4. setFog DIFF — iteruj tylko zmienione heksy 🟥
- **Co:** `setFog` iterował całe `hexInstance` (~320k) 2–3× na każde odsłonięcie (dirty-set pomijał GPU, ale nie iterację). Teraz: `anyHidden` early-exit; główna pętla iteruje **symetryczną różnicę `visible` vs poprzednie wywołanie** (przy ruchu jednostki = kilka heksów). Wystarcza sam `visible`, bo `explored` rośnie tylko o aktualnie widoczne i nigdy nie maleje → każde przejście mgły zmienia przynależność do `visible`. Pełny przebieg tylko przy 1. wywołaniu / zmianie kontekstu ocean-backdrop (`revealAllLand`).
- **Efekt:** **fog 41,4 ms → 1,9 ms**.
- **Gdzie:** `gra/src/render/scene.ts` (`setFog`, `prevVisible`, `keysToScan`).
- **Przy czyszczeniu:** 🟥 core mgły — odtworzyć diff przy przepisaniu setFog. UWAGA korektność: zależy od inwariantu „explored rośnie tylko przez addExplored(vis)". Gdyby doszła eksploracja bez widoczności (np. wspólne pole sojuszników), diff po samym `visible` przestaje wystarczać — dołożyć diff po explored.

## 5. Cienie na żądanie (shadowMap.autoUpdate=false) 🟥
- **Co:** shadow pass ≈ drugi przebieg całej geometrii co klatkę (przy 6,7 mln tri = duży koszt). W world-space cienie NIE zmieniają się przy panie/idle kamery. `renderer.shadowMap.autoUpdate=false`; `needsUpdate=true` tylko przy realnej zmianie casterów: setup/pierwszy render, `setFog` (gdy `touchedMeshes>0`), `applyZoomGpuSettings` (powrót do bliskiego LOD), pętla `main.ts` (`isAnimating`/`galleryOn`), `spawnImprovementMesh`.
- **Gdzie:** `scene.ts` (setup renderera, `applyZoomGpuSettings`, koniec `setFog`), `main.ts` (pętla renderu przed `renderer.render`, `spawnImprovementMesh`).
- **Efekt:** zysk vertex przy panie kamery (najczęstsza czynność) — cienie tylko na presecie `high`.
- **Przy czyszczeniu:** 🟥 rozsiane po `scene.ts`+`main.ts`. Jeśli dojdzie NOWE źródło ruchu casterów (nowa animacja 3D, terraform), DODAĆ `needsUpdate=true` w tym miejscu, inaczej cień utknie.

## 6. Minimapa — cache + skip mgły + klik→kamera 🟨
- **Co:** `getMinimapData` alokowała ~320k obiektów/wywołanie; teraz cache statycznej struktury (q/r/teren) raz per mapa, pętla mutuje tylko fog+ownerColor. Rysowanie pomija heksy „hidden" (tło = kolor mgły). Klik w minimapę → kamera (`computeMinimapLayout` wspólny dla rysowania i kliku, dokładna inwersja pointy-top).
- **Gdzie:** `gra/src/map/minimap.ts` (cache), `gra/src/ui/minimapHud.ts` (layout+klik), `main.ts` (`onMinimapClick`→`camCtrl.focusAt`).
- **Przy czyszczeniu:** 🟨 głównie w osobnych plikach minimapy; `onMinimapClick` w main.ts do odtworzenia.

## 7. Smoke — naprawa false-negative (async-poll) 🟩
- **Co:** smoke sprawdzał kryteria SYNCHRONICZNIE zanim async `buildScene` się skończył → fałszywy fail (rafCount=0) na bundlach z instancingiem. Dodano `unhandledRejection` + pętlę poll (`await setImmediate` aż `rafCount>0`).
- **Gdzie:** `gra/tools/smoke.cjs`.
- **Przy czyszczeniu:** 🟩 samodzielne narzędzie — nie ruszać bez powodu.

## 8. Eksperyment B — `?nobottom` (pryzm bez dna) 🟩
- **Co:** baza heksów bez dolnej ścianki (`hexPrismNoBottomGeo`) domyślnie; toggle `?nobottom=0` = pełny walec (pomiar B). Zostaje włączone.
- **Gdzie:** `scene.ts` (`B_NO_BOTTOM`).

---

## ZOSTAŁO (świadomie odłożone)

### CHUNKI / culling per-region 🟥 — NA SAM KONIEC
- **Co:** baza terenu + góry/wzgórza mają `frustumCulled=false` (cała mapa rysowana — celowy fix B0.6 „zalany ląd"). To trzyma tri ~6,7 mln na dużej mapie niezależnie od zoomu. Chunki = podział mapy na regiony (osobne InstancedMesh per chunk) z bounding-per-chunk + frustum culling → mniej rysowanej geometrii.
- **Dlaczego odłożone (Maciej 2026-07-09):** „mam mocny komputer, inni gracze mogą mieć problem bez chanków" — WAŻNE dla słabszych maszyn, ale ryzykowne wg historii B0.6 (pop-in/gaps). Wymaga: bounding-per-chunk + toggle `?culling=0` + test wizualny.
- **To jedyny lever atakujący wprost 6,7 mln tri (vertex-bound). pixelRatio NIE pomoże (nie fragment-bound).**

### Mikrodekor łąk/równin — DODAJE tri (świadomie)
- `dekor-laki-rowniny.ts` (8 InstancedMesh, LOD 0–1, ~45% pustych) dokłada trójkątów na bliskim zoomie. Baseline „przed" wyżej = punkt odniesienia gdyby FPS spadło za mocno → wtedy zmniejszyć gęstość (`DEKOR_UDZIAL_PUSTYCH`) lub obniżyć `DEKOR_LOD_MAX_POZIOM`.
- Uwaga: fog dekoru (`applyTerrainFog`) skanuje instancje dekoru przy każdym `setFog` na LOD 0–1 → może lekko podnieść `fog ms` na bliskim zoomie (nadal << 41 ms). Gdyby przeszkadzało: chunki albo diff dla dekoru.

## LINIA KANONU / GIT (na 2026-07-09)
- Kanon FPS na GitHubie: `a1dce24d` (+push `3b96812`). Prace tej sesji (fog/matrixAutoUpdate/cienie/minimapa + DEKOR + ZASADY E1–E5) = commity lokalne na `main`, deploy ROBOCZA `f69d1b0b`. Promocja do kanonu + push: osobno, po teście Macieja.
