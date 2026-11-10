STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-4-MODEL-CATALOG-Q1
GOAL: Katalog modeli 3D proceduralnych do odtworzenia w Rust (inwentarz 100% plików Three.js, pokrycie danymi, helpery i graf zależności, wycena, paczki z kolejnością, ocena wizualna, D-MOD-n).
ZMIANY/COMMIT: ocena commitu Operatora `1a03f837` (baza `dc4cfdb4`). Diff obejmuje wyłącznie 2 pliki z allowlisty. `git diff --check dc4cfdb4 1a03f837` jest czysty. Evaluator dopisuje tylko ten raport.
TESTY: weryfikacja niezależna na pinie `edb8fb56` (git show / git grep / ls-tree + skrypty Pythona w scratchpadzie Evaluatora).
RUNDY: 1/5
NASTĘPNY KROK: Operator, runda 2/5, ten sam ID. Zarzuty 1–7 muszą zostać naprawione, 8–10 poprawione albo jawnie uzasadnione.
DEPLOY/PUSH: NIE WYKONANO

## Co sprawdzono i co się zgadza

- Zbiór plików: `ls-tree` render daje 88, import three ma 80, poza `render/` jest 8. Lista 96 wierszy tabeli §1.1 porównana przez `comm` z `ls-tree` + 8 plików: zgodna 1:1.
- Wszystkie 96 wierszy porównano z zawartością blobów: LOC, flaga three, `new Mesh`, R1 i każdy token R3 (24 prymitywy). **0 rozbieżności.** Sumy LOC: render 59 319, poza render 62 722 (bez `main.ts` 23 372). Obie zgodne.
- §1.2: wszystkie 28 wierszy `git grep -c` (linie i liczba plików, w `render/` i poza nim) są zgodne.
- Importerzy plików `render/**` (bez komentarzy): zgodni z kolumną tabeli.
- Dane: `units.json` 75 (Kamień 10, Brąz 40, Żelazo 25), `buildings.json` 42, `wonders.json` cuda 19, parkowane 5, panstwa 15, `terrain-improvements.json` 22 (+`_meta`, `_miasto_zasieg_ref`).
- Pozostałe liczby i lokalizacje: `BUILDERS` 24, `buildWonderModel` 19 `case`, `buildCategoryModel` 20 `case` i 739 linii kodu, `^function getGeo` 88, 85 reguł `if` w `buildNamedUnit`, `NEW_BESPOKE_CATEGORIES` 8.
- Odwołania do linii są poprawne: `units.ts:794/998/1034/1068/1086/1389/1492/2143/3098/3700/4807/5559/5573/5700`, `mapRenderStyle.ts:40`, `cities.ts:229-249`, `miasto-braz.ts:866-873`, `settlementModel.ts:20-26`, stałe wariantów dekoracji.

## Zarzuty

1. **Fałszywy wynik wklejonej komendy (reguła anty-halucynacyjna).** §2.6 podaje: `git grep -n requestAnimationFrame edb8fb56 -- gra/src/render` → 0 trafień. Faktyczny wynik to 1 trafienie, `render/scene.ts:1477` (`new Promise(r => requestAnimationFrame(() => r()))`). Wniosek o braku pętli animacji może się utrzymać, ale wynik komendy jest nieprawdziwy.
2. **„206 wywołań `getGeo*`” to błędna liczba.** Wzorzec `\bgetGeo\w*\(` daje 206 wystąpień w `units.ts`, ale 88 z nich to definicje `function getGeo…(`. Wywołań jest **118**. Dokument nazywa 206 „wywołaniami” (§2.1).
3. **Martwy kod poza `render/` niewykryty.** `battle/manualBattle.ts` (1 433 LOC) ma **0 importerów** w `gra/src`. Wspominają go tylko `README-manualBattle.md`, komentarze `main.ts:27157,28490` i test `gra/tools`. Dokument traktuje go jako żywy BIT i umieszcza w paczce 14. Kolumna „Importerzy” dla 8 plików spoza `render/` ma wartość `n/d`, a pomiar był trywialny. Podobnie `render/countSceneOverlayCandidates.ts` ma 0 importerów w `gra/src` (używają go tylko `gra/tools/merge-decor-no-regress-test.cjs` i `scene-perf-diag.cjs`), a jest sklasyfikowany jako INF bez oznaczenia „tylko narzędzia/martwy”. Dispatch §4 wymaga podkreślenia, co jest martwe.
4. **Paczki nie pokrywają żywych plików.** Żaden zakres paczki (§4.2) nie obejmuje:
   - `jednostki-p1-rdzen.ts`: żywy, bo `units.ts:3921/3927/3939` wołają `newBuildMiecznik/Wlocznik/Procarz` w `buildCategoryModel`.
   - `improvements.ts`: żywy routing `buildImprovement`/`buildImprovementSectored`/`buildImprovementStack` (`:339/458/518`), wołany z `main.ts`. Ma 10 importerów, w tym logikę gry.
   - `bronzeCity.ts`: runtime'owe `ikonaIdToBronzeCiv`/`BRONZE_CIVS` dla `main.ts`, `battleScene.ts`, `cities.ts` i `settlementModel.ts`.
   - PODGL: `ui/unitMiniPreview.ts` jest żywy przez `cityPanel.ts:168`, `unitInfoCard.ts:33` i `entityCards/renderer.ts:19`. Do tego `wonderpreview/main.ts`.

   Kryterium „paczki z allowlistami” nie jest więc spełnione dla całego żywego zakresu.
5. **Liczby modeli w paczkach 5–7 (10/39/22) nie odpowiadają zakresom tych paczek.** Pomiar przez importy `units.ts` i wnętrza opakowań:
   - `Wojownik z toporem` i `Procarz (Huaracoc)` (Brąz) mają geometrię w `jednostki-p2-inka.ts`, czyli w paczce 5 (Kamień).
   - `Łucznik akadyjski` i `Łucznik asyryjski` (Brąz) są w `jednostki-p3-dystans.ts`, też w paczce 5.
   - Oszczepnik, Łucznik i Zwiadowca (Kamień) idą przez `buildCategoryModel`, który jest w paczce 4.
   - `Jeździec chiński` i `Rydwan sumeryjski` zależą od `kon-nowy-model` z paczki 4.

   Dokument oznacza przydział jako NIE_ZMIERZONO (#8), choć da się go zmierzyć z importów `units.ts` (`:60-200`) i jednym przejściem po ciałach funkcji. Liczby „modeli w paczce” nie są powiązane z allowlistą.
6. **Graf zależności jest niepełny i nieodtwarzalny.** W §3.2 brakuje:
   - węzłów `camera.ts`, `perfDebugOverlay.ts`, `siegeCampSync.ts`, `countSceneOverlayCandidates.ts`, `input/picker.ts`, `ui/perfTestPanel.ts`;
   - krawędzi `main.ts` → `camera`, `perfDebugOverlay`, `siegeCampSync`, `teren-gory-wzgorza`, `mergeDecor`, `styleResources`, `unitOwnerEmblem`, `unitUpgradeBadges`, `settlementModel`, `bronzeCity`, `fogDim`, `mapRenderStyle`;
   - krawędzi `cities.ts` → `input/picker` i `battleScene.ts` → `input/picker`;
   - krawędzi `unitVeteranBadges` → `unitUpgradeBadges` → `unitStatPlate`.

   Krawędź „`ulepszenia-modele-p2/p3a/p3b` → `kon-nowy-model`” jest nieprawdziwa dla p2 i p3b (importuje tylko p3a). Brak też wzmianki o cyklu `improvements.ts` ↔ `robloxImprovements.ts`. Zdanie „Pełna lista krawędzi pochodzi z `graph.py`” odsyła do skryptu, którego nie ma w repo. Dispatch wymaga grafu „kto importuje kogo”, a nie szkicu.
7. **Pokrycie „75/75 dedykowanych, luk brak” sprawdzono tylko dla ścieżki mapy (nazwa PL).** `battleScene.ts` (4 wywołania) podaje `stats['Jednostka'] ?? bu.nazwa` z fallbackiem na nazwę **angielską** (`units.ts:1737-1745`). Komentarz `units.ts:~1727-1735` dokumentuje znany błąd trasy: „Iron Khopesh Warrior” trafia do modelu brązowego khopesh. `route.py` nie symulował nazw `Nazwa EN`. Wniosek o braku luk trzeba zawęzić do ścieżki mapy albo zmierzyć trasy EN.
8. **NIE_ZMIERZONO tam, gdzie wynik jest w cytowanej linii.** Liczba wariantów tarasów (#3): `tarasyWariantDlaHeksa(...): 0 | 3` (`tarasy-model.ts:106`), czyli 2 warianty (W0/W3).
9. **R2 opisane jako „wywołania”, ale zlicza też definicje helperów.** Przykłady: `wonderModels` 100 = 97 wywołań + 3 `function box/cyl/cone`, `bronzeCityRoblox` 72 = 70 + 2, `robloxImprovements` 63 = 60 + 3. Trzeba poprawić definicję w §0.2 albo liczby.
10. **Odtwarzalność.** Kluczowe liczby §2 (67 tras, 5 nieużywanych modeli, 21/21 opakowań, importerzy) pochodzą ze skryptów (`route.py`, `graph.py`, `ufn.py`…), których nie ma w repo ani w dokumencie. Dispatch wymaga przy każdej liczbie komendy i wyniku. Trzeba dołączyć skrypty do katalogu runu albo wkleić ich treść jako aneks.

## Uwagi (bez wpływu na werdykt)

- Allowlisty `<renderer>/…` jako placeholder zależny od P4.3 są akceptowalne, o ile zostanie to podtrzymane jako warunek dispatchu paczki.
- Gałąź `claude/sprawdzenie-funkcjonalnosci-ek4ra0` poszła do przodu (`a5ba86f3`), a baza commitu Operatora to `dc4cfdb4`. To sprawa do rozwiązania przy integracji.
- Deklarowana zależność paczki 10 nie wymienia paczki 13 (`rangeOverlay`), choć `cityOkolicaOverlay` jej używa. Kolejność fal tego nie psuje.
