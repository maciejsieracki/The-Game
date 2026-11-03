STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-MAP-MODELS-SCALE-2X-Q1
GOAL: skala x2 wizerunkow WSZYSTKICH zloz/surowcow oraz ulepszen Fort i Posterunek na mapie swiata (3D); pozostale ulepszenia bez zmian.
ZMIANY/COMMIT: SHA w pierwszej linii komentarza commita (patrz `git log -1` brancha worktree-wf_9b5b33b2-4c6-1); baza = origin/main 1a2f1c721. Pliki: gra/src/render/resources.ts, gra/src/render/styleResources.ts, gra/src/render/improvements.ts, NOWY gra/tools/map-models-scale-2x-test.cjs, dyspozycje/autobot/runs/R-WEB-MAP-MODELS-SCALE-2X-Q1/** (raport, zrzuty, gate-*.txt).

## Znaleziska (plik:linia, stan bazowy)
- Zloza: wszystkie przechodza przez `buildStyledResourceOverlay` (styleResources.ts) -> main.ts:2998/3027 -> `compactDepositAtEdge` (main.ts:2850-2865), ktory normalizuje KAZDE zloze do stalej szerokosci (0.55 HEX_R; 0.34 na wzgorzach/gorach) i mnozy przez `userData.depositDisplayScale` (domyslnie 1). Skala NIE jest zapisana per model; jedyny wyjatek: kon mial juz x2 (resources.ts, styleResources.ts - 4 miejsca).
- Fort/posterunek: improvements.ts `buildImprovementSectored`: `model.scale.multiplyScalar(0.5)` (przed zmiana l.501) x `SECTOR_SCALE` 0.30. Droga/inne ulepszenia nie dostaja tego mnoznika.
- `main.ts` NIE jest na allowliscie, dlatego mnoznik wpieto przez `depositDisplayScale` (czytane przez main.ts bez edycji).

## Zmiana
- `RESOURCE_MODEL_SCALE = 2` (resources.ts) stosowany RAZ w nowym wrapperze `buildStyledResourceOverlay` (styleResources.ts): `depositDisplayScale = (dotychczasowe||1) * 2`. Dotyczy styli civ/roblox/minecraft i wszystkich zloz: konie, owce, bydlo, lama, glina, ruda (nakladka), miedz, zelazo, wegiel, sol, zloto, cyna.
- `FORT_OUTPOST_MODEL_SCALE = 2` (improvements.ts): fort/posterunek `0.5 * 2 = 1.0` (x SECTOR_SCALE).
- Skala rosnie wokol origin modelu (spod / podstawa); origin ustawiany jest w compactDepositAtEdge (x, baseY+relief+0.01, z-edgeR) i w sektorze (SECTOR_R) - NIE zmienia sie. Relief (`half` w compactDepositAtEdge) uzywa nowej skali, wiec model na wzgorzu nie wisi.

## Zalozenia
1. Kon: x2 WZGLEDEM obecnego stanu (juz powiekszonego x2 2026-07-29) => efektywnie 4x wzgledem pierwotnego modelu; "kazdy surowiec x2" wzgledem stanu biezacego. (Jesli wlasciciel chcial kon bez dodatkowego powiekszenia - jedna linia: wyjatek w wrapperze.)
2. "Kopalnia" = model zloza; ulepszenie Kopalnia nie zmienione (test: kopalnia_miedzi 1x, kamieniolom 1x, glinianka 1x itd.).
3. Dotyczy modeli w swiecie; minimapa/ikony paneli/karty nie zmienione (nie uzywaja tych builderow - NIE_ZMIERZONO w pelnej grze; zmiana tylko w tych 3 funkcjach).
4. "Drewno-zloze" i "kamien-zloze": w kodzie nie ma osobnego zloza drewna/kamienia na mapie (Las = osobna nakladka pominieta w rebuildResourceOverlays main.ts:3020; kamien to ulepszenie Kamieniolom) - brak do zmiany.

## TESTY (logi gate-*.txt w katalogu runu, kazdy z linia EXIT=)
- `node gra/tools/map-models-scale-2x-test.cjs --shots <dir>`: 153 PASS / 0 FAIL, EXIT=0. Prawdziwy render WebGL w Chromium (swiftshader), porownanie BAZA (git archive HEAD) vs PO: dla 12 typow zloz x 2 warianty (plaski/wzgorze) skala koncowa i bbox 2x, uziemienie proporcjonalne (minY w [-0.05,0.05], brak zawieszenia/zapadniecia); fort i posterunek bbox 2x, pozostale 11 ulepszen 1x; fort/posterunek mieszcza sie w promieniu heksa (R<=1.0).
- Regresje: `kopalnia-cyny-render-test.cjs` 23/0 PASS; `zloze-zloto-render-test.cjs` 7/0 PASS; `tsc --noEmit` EXIT=0. Brak testow z golden-wartosciami skali wymagajacych aktualizacji (grep depositDisplayScale|SECTOR_SCALE|compactDepositAtEdge w tools/: 0 goldenow).
- `web-memory-leaks-test.cjs` (wspomina buildStyledResourceOverlay): NIE_URUCHOMIONO. Szerszy glob `*render*|*resource*|*improvement*|*fort*|*mesh*|*visual*|*map-render*` (setki testow DOM/UI): NIE_URUCHOMIONO przed/po - te testy nie importuja zmienionych modulow (grep), wiec ryzyko niskie; do decyzji Evaluatora.
- FPS: harness 20 klatek swiftshader, przed/po: deposits 2.57/2.67 ms, forts 1.64/2.46, combo 2.18/1.90, close 0.67/0.72 (szum; liczba wierzcholkow/instancji bez zmian - skala nie zmienia geometrii). NIE_ZMIERZONO na pelnej mapie gry z tysiacami zloz (brak uruchamiania gry: zakaz npm run dev/build).

## Dowod wizualny
`zrzuty/przed-*.png`, `zrzuty/po-*.png` (<=25 kB kazdy): deposits (12 zloz, w tym kon/rudy/glina/sol), forts (fort, posterunek + farma/tartak/kamieniolom/pastwisko jako kontrola), combo (zloze + ulepszenie na jednym heksie, z szescianem-miastem w srodku), close (zblizenie). Render syntetyczny harnessem (1:1 kopia compactDepositAtEdge), NIE zrzut z pelnej gry.

## NOTES / ryzyka dla Evaluatora
- Kolizja wizualna: zloza dosuniete do polnocnej scianki (z-0.62) po x2 siegaja/przekraczaja krawedz heksa (widoczne na zrzucie close: kon wystaje na sasiada). Nie zmieniano edgeR/kolejnosci (zakres "tylko skala"); jesli to niepozadane - zwiekszyc DEPOSIT_EDGE_R w main.ts (poza allowlista; wymaga zgody).
- Zloza i ulepszenia w roznych sektorach/scianach (zloze: polnoc; fort: 180 stopni, kopalnia 0 stopni): combo nie wykazalo nakladania zloza na ulepszenie ani miasto w srodku (kadr po).
- Hitbox/raycast, mgla, cien: nie zmieniane; zloza sa Group/mesh w scenie (resourceOverlays), skala rodzica obejmuje wszystko; raycast po bryle skaluje sie automatycznie. NIE_ZMIERZONO w grze.
- Pelna wersja gry (gra-robocza) nie zbudowana ani nie wdrozona.

BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (wywolac pelna gre/zrzut z realnej mapy; zdecydowac o edgeR zloz i o szerszym globie regresji).
DEPLOY/PUSH: NIE WYKONANO
