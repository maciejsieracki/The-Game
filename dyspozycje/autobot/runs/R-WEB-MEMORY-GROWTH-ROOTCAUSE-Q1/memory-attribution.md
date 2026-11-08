# R-WEB-MEMORY-GROWTH-ROOTCAUSE-Q1: co zajmuje pamięć i co z tym zrobiono (runda 1)

## Metoda
Chromium headless (`--js-flags=--expose-gc`, swiftshader), `?civTest=1`, seed 4242, mapa Standardowa/kontynenty,
mgła wyłączona, gracz tylko kończy turę (jak w `longrun-100-turns-leak-q1-measure.cjs`). Dwa pełne przebiegi po 100 tur,
każdy w jednym ciągłym procesie. PRZED: czysty `origin/main` 318c6ecdb. PO: ta zmiana. Bundle `vite build --minify false`
poza repo (żeby nazwy funkcji w profilach były czytelne). Narzędzie: `gra/tools/memory-growth-rootcause-q1-measure.cjs`.
- co 5 tur: sterta po `gc()` (`performance.memory`) oraz CDP `Runtime.getHeapUsage`: `usedSize` = obiekty V8,
  `backingStorageSize` = dane poza obiektami (bufory ArrayBuffer, źródło skryptu);
- w turach 1/30/60/100: przegląd sceny Three.js (`__memProbe`: grupy, unikalne geometrie, materiały i tekstury, bajty
  atrybutów), `renderer.info`, rozmiar zapisu gry (JSON) oraz próbkujący profil sterty (`HeapProfiler`, miejsca alokacji);
- w turach 60 i 100 (PRZED) oraz 100 (PO): pełna migawka sterty (heap snapshot), streszczona strumieniowo z drzewem
  dominatorów (`memory-growth-heapsnap-summary.cjs`). Same migawki usunięte, w repo leżą tylko `heapsnap-summary-*.json`.

Wynik sumy migawki zgadza się z miernikiem: 575,1 MB wobec 573 MB w t.100. `backingStorageSize` zawiera źródło skryptu
(158 MB), dlatego na rozbiciu niżej nie jest to tylko geometria.

## 1. Rozbicie pamięci PRZED (t.100 = 573 MB po GC)
| składnik | MB t.60 | MB t.100 | MB/turę t.60→100 | ocena | źródło |
|---|---|---|---|---|---|
| bufory geometrii zmergowanych meshy ulepszeń | 81,2 | 155,0 | **1,85** | render: nadmiarowy format (trójkąty bez indeksów, 24 B na wierzchołek; ~57 KB na heks) | `render/mergeDecor.ts` buildMergedMesh, wywołanie `main.ts` spawnImprovementMesh |
| źródło skryptu (zewnętrzny string UTF-16) | 158,2 | 158,3 | 0 | stała; bundle ~75 mln znaków ×2 B, bo zawiera litery spoza Latin-1 | `vite.config.ts` (poza allowlistą) |
| pozostałe stringi (zasoby/tekst bundla) | 68,4 | 68,8 | ~0 | stała | bundle |
| bufory nakładek złóż (zmergowane) | 27,2 | 21,8 | maleje | render, ten sam format co ulepszenia | `main.ts` maybeCollapseResourceOverlay |
| obiekty V8 modeli jednostek (Object3D/Material per jednostka, ~89 obiektów i ~17 materiałów na jednostkę) | ~57 | ~55 | 0 (stabilizuje się razem z liczbą jednostek po t.60) | render, potrzebny przy obecnej architekturze | `render/units.ts` buildUnitModel/UnitRenderer.sync |
| obiekty V8 modeli miast (10 927 obiektów, 2 349 materiałów w t.100) | ~24 | ~27 | 0,08 | render | `render/cities.ts`, `buildSettlementModel` |
| logika gry/AI: stan i pamięci podręczne | ~22 | ~31 | 0,2 | stan gry; zapis gry to tylko 1,29 MB JSON | `game/okolica.ts`, `game/resource-access.ts`, AI |
| kod (`code`) | 23,5 | 25,4 | 0,05 | V8 | — |

Różnica między migawkami t.60 a t.100 (+81,6 MB) w **86% (+69,8 MB) to `JSArrayBufferData`**, czyli bufory geometrii.
Wszystkie pozostałe klasy urosły łącznie o ok. 12 MB (kod +2, tablice +1,9, liczby +1,2, materiały, sprite'y…).
Po t.60 obiekty V8 przestają rosnąć (214 → 225 MB): jednostek jest stale ok. 440, liczba miast rośnie powoli.

Sprawdzone i bez wzrostu: DOM (1 300 węzłów, płasko), listenery DOM (`Memory.getDOMCounters` 259 → 320),
`renderer.info.textures` 31, liczba programów shaderów 36–38, canvasy DOM 2, mapy rendererów (`tokens`, `statTexCache`
itd.) równe liczbie jednostek lub miast. Wycieku (rosnącej kolekcji bez ograniczenia) nie znaleziono.
`wiarygodnoscZdarzeniaByOwner` (bez przycinania) ma poniżej 450 wpisów, więc nie ma znaczenia dla pamięci.

## 2. Naprawa (tylko pozycja o udowodnionym dużym udziale)
1. **`render/mergeDecor.ts` → `indexIdenticalVertices`**: przy scalaniu wierzchołki o bitowo identycznej pozycji
   i kolorze (Float32) są współdzielone przez bufor indeksów (Uint16 albo Uint32). Trójkąty i ich kolejność się nie
   zmieniają, a `flatShading` liczy normalną z pozycji. Działa dla każdego `collapseToMergedMesh`: ulepszenia, złoża,
   dekoracje startowe. Na realnych modelach ulepszeń geometria zajmuje 30,5% poprzedniej (`memory-growth-merge-index-test`, M1).
2. **`releaseMergedDecorCpuArraysAfterUpload`**, wołane tylko dla meshy ulepszeń: po wysłaniu do GPU kopia CPU jest
   zerowana, a sfera i prostopadłościan otaczający są liczone wcześniej. Po `webglcontextrestored` meshe ulepszeń są
   przebudowywane (`main.ts` rebuildImprovementMeshesAfterContextRestore). Działa tylko na meshach, które choć raz trafiły
   do kadru, więc w pomiarze ze stałą kamerą ma mały udział.

## 3. Wynik: ten sam seed, przebiegi PRZED i PO (load average 4–9 na 4 rdzeniach, podany w każdym wierszu `raw-*.jsonl`)
| tura | PRZED MB | PO MB | geometria ulepszeń PRZED/PO | złoża PRZED/PO | obiekty V8 PRZED/PO |
|---|---|---|---|---|---|
| 1 | 322 | 297 | 0 / 0 | 34,3 / 10,5 | 124 / 125 |
| 30 | 360 | 341 | 11,8 / 2,9 | 33,4 / 10,2 | 148 / 162 |
| 50 | 447 | 391 | — | — | 199 / 200 |
| 60 | **491** | **416** | 81,2 / 19,7 | 27,2 / 8,6 | 214 / 219 |
| 100 | **573** | **444** | 155,0 / 42,4 | 21,8 / 7,3 | 225 / 224 |

Nachylenie t.60→100: **2,05 → 0,70 MB/turę (2,9 razy mniej)**. t.50→100: 2,52 → 1,06 (2,4 razy mniej).
t.1→100: 2,53 → 1,48. Migawka t.100: `JSArrayBufferData` 190,8 → 63,3 MB. Trajektoria gry jest prawie identyczna
(t.1–t.45: te same liczby jednostek i miast), później rozjeżdża się o kilka procent (t.100: 439/102 wobec 409/106),
jak w poprzednim temacie LONGRUN.

Pozostały wzrost (ok. 0,7 MB/turę po t.60) to głównie nowe ulepszenia (~16 KB na heks zamiast ~57 KB) i nowe miasta.
To stan gry i jego render, nie śmieci.

## 4. Kandydaci NIEnaprawieni (z szacunkiem)
| kandydat | zysk | dowód | dlaczego nie teraz |
|---|---|---|---|
| bundle tylko w ASCII (źródło skryptu jako 1-bajtowy string) | **−71 MB stale od t.1** | ZMIERZONE: build produkcyjny 286 MB → 215 MB w t.1 (`raw-exp-*-t1.jsonl`), gra dochodzi do t.1 bez błędów | wymaga `vite.config.ts` (`esbuild.charset:'ascii'`) i ucieczek `\uXXXX` w literałach regex z polskimi literami (esbuild ich nie zamienia; 108 znaków); to poza allowlistą |
| scalenie modeli jednostek (~89 obiektów na jednostkę) | ~35–45 MB przy ~450 jednostkach | profil próbkujący: 55 MB obiektów pod `buildUnitModel` | animacje, plakietki, raycast i pierścienie na dzieciach modelu; temat architektoniczny |
| scalenie statycznych modeli miast | ~15–20 MB przy ~100 miastach | profil: 27 MB pod `buildSettlementModel`/CityRenderer | przebudowa przy zmianie fazy i buntu |
| wspólny materiał scalonych meshy zamiast osobnego na każdy heks | ~1–2 MB | 6 530 materiałów `MeshLambert` w t.100 (w tym ~2 700 meshy ulepszeń i ~1 400 złóż) | mgła przyciemnia `material.color` per heks |
| pamięci podręczne `hexesInCitySight`/`hexKeysWithinRadius` | ≤ 5 MB (próbkowanie, niska pewność) | profil próbkujący w t.100 | mała skala, możliwy artefakt próbkowania |
