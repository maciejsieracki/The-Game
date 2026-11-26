# R-WEB-MAP-RIVER-RENDER-VISUAL-Q1 — obrona Operatora, runda 2 (odpowiedź na zarzuty Evaluatora 0395cd57a)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (weryfikacja wizualna i pomiar, bez zmian kodu gry)
TEMAT: R-WEB-MAP-RIVER-RENDER-VISUAL-Q1 (tag RIVVISUAL)
GOAL: zamknąć zarzuty Evaluatora (1–8) dla kandydata 653f6737b (RIVERS3A, ff5223f99): zrzuty całej mapy i zbliżeń kamerą mapy, wyjaśnienie różnicy kandydat–baza, pomiar czasu klatki z większą próbą, bramki ogólne z liczbami.
BAZA: kandydat 653f6737b (gra/ identyczne z ff5223f99); baza 7148b2f4e.
ZMIANY-COMMIT: brak zmian w gra/**. Zmiany tylko w dyspozycje/: poprawiony skrypt pomiarowy `rivers-live-measure.cjs` (v2), nowy `bluecount.cjs`, nowe zrzuty i JSON-y (zoomb*, zoomc*, zooms1*, zooms2*, fpsb*, fpsc*, fpss2*), ten raport. Pliki cand-*/base-* z rundy 1 bez zmian (przywrócone z git po przypadkowym usunięciu).

## Odpowiedź na zarzuty

1. Brak zrzutu całej mapy (zarzut 1): PRZYJMUJĘ, poprawione. Poprzedni "zoom" w skrypcie klikał przyciski `−`/`+` HUD, które regulują skalę CAŁEJ gry (85–150%, `hud.ts`), a nie kamerę mapy. Kamera mapy (`render/camera.ts`) zmieniana jest kółkiem myszy na canvasie. Nowy skrypt: 40 kroków kółka w dół (clamp do maxDist) → `zoomb-cala-mapa.png`, `zoomc-cala-mapa.png` pokazują całą mapę z obwódką (pomarańczowa ramka) i pełny obszar lądu. Poprzednie nazwy "cala-mapa" z rundy 1 dotyczyły kadru 85%, nie całej mapy — przyjęte.
2. Brak zbliżenia 2× (zarzut 2): PRZYJMUJĘ, poprawione. Zbliżenia kołem myszy od widoku całej mapy: 6 kroków (≈0,46 odległości, ok. 2,2×), 12 kroków (≈4,6×), 18 kroków (≈10×). Te współczynniki wynikają z arytmetyki kroku kamery (×0,88 na krok, `camera.ts` zoomFactor 0,12), NIE z pomiaru bezpośredniego (brak haka do odczytu odległości kamery). Plik 8× (`*-zblizenie-8x.png`) pokazuje rzeki wyraźnie (jasnoniebieskie linie).
3. Trzy poziomy rzek nie zweryfikowane; brak rekomendacji grubości 0,30 (zarzut 3): PRZYJMUJĘ częściowo. Wykonano izolację poziomów: `?riverStage=1` (main), `?riverStage=2` (main+medium), domyślnie 3 (main+medium+tributary) na tym samym kadrze 8× (`zooms1-`, `zooms2-`, `zoomc-zblizenie-8x.png`). Liczba pikseli koloru rzeki w kadrze (miara ilości tuszu, `bluecount.cjs`): main 3152, dodatek medium +152 (+5%), dodatek tributary +428 (+13%). Wniosek: poziomy 2 i 3 są bardzo cienkie w tym zoomie; trzy poziomy NIE są jednoznacznie rozróżnialne wizualnie w tym kadrze. Rekomendacja: NIE zmieniam 0,30 w tej rundzie (zakaz zmian kodu tematu, a grubość to decyzja wizualna). Do decyzji właściciela (pytanie ABC — patrz UWAGI): czy poziom medium i dopływy mają być grubsze. Haka civTest do klasyfikacji nie użyto — izolację zrobiono parametrem `riverStage`, który istnieje w kodzie.
4. Niewyjaśniona regresja / różnica kandydat vs baza (zarzut 4): PRZYJMUJĘ, z wyjaśnieniem.
   - Mapy są identyczne: `git diff --stat 7148b2f4e ff5223f99 -- gra` obejmuje tylko `gra/src/render/scene.ts` i `gra/tools/river-render-levels-test.cjs` — generator nietknięty, seed 1 daje ten sam świat w obu buildach.
   - Różnice są w renderze: domyślny etap 2 (baza) → 3 (kandydat), oraz półszerokość medium 0,4/0,55/0,7 → 0,35–0,49 (`riverWidthMulForKind`), tributary stałe 0,3.
   - Pomiar tego samego kadru 8× (z wyjściem z banera „ZAŁÓŻ MIASTO”): baza 3323 px, kandydat domyślnie 3732 px, kandydat ?riverStage=2 3304 px. Kandydat jest stabilny (3732 w dwóch przebiegach); baza w pierwszym przebiegu bez wyjścia z banera dała 4483 px, co pokazuje, że liczba dla bazy NIE jest stabilna między przebiegami. Dlatego obserwacji Evaluatora "baza ma więcej linii" NIE odtworzono w tym samym kadrze; nie uważam jej za potwierdzoną regresję. Różnica kandydat−baza w tym kadrze: +12% tuszu rzek (dopływy +13%, zmiana grubości medium praktycznie neutralna: 3304 vs 3323).
   - Obserwacja Evaluatora była w innym kadrze (UI 95%, wcześniejszy build); nieprawomocna.
5. FPS bez wartości dowodowej (zarzut 5): PRZYJMUJĘ częściowo. Pomiar powtórzony: kadr 8×, 5 powtórzeń × 20 s, rAF, ten sam kadr w każdym buildzie, Chromium headless na programowym GL (SwiftShader). Wyniki (średnia FPS z 5 powtórzeń; rozrzut):
   - baza 7148b2f4e: 1,208 fps (0,965–1,419), średnia klatki 844 ms
   - kandydat domyślnie (3 poziomy): 1,229 fps (1,187–1,283), 814 ms
   - kandydat ?riverStage=2: 1,262 fps (1,228–1,323), 793 ms
   Różnica kandydat−baza +1,7%: w granicy szumu (rozrzut bazy ±20%). Koszt warstwy dopływów (3 vs 2): −2,6%: w granicy szumu kandydata (±3%). NIE ZMIERZONO: koszt na prawdziwym GPU; koszt przy 8 i 146 dopływach (zakres z blokady 2) — NIE ZMIERZONO, bo liczba dopływów w tej mapie jest stała i zmiana wymaga haka lub zmiany generatora (poza zakresem tematu). Wcześniejsze przebiegi 2× (~1,6 fps) nie zostały zachowane jako pliki i nie są tu dowodem.
6. Bramki ogólne oznaczone "NIE URUCHOMIONO" (zarzut 6): PRZYJMUJĘ, uruchomione teraz na 653f6737b (patrz TESTY).
7. Skrypt z ustaloną ścieżką playwright do innego worktree (zarzut 7): PRZYJMUJĘ, naprawione. `rivers-live-measure.cjs` i `bluecount.cjs` ładują pakiety przez `path.resolve(__dirname, '../../../gra/node_modules/...')`. Usunięto zrzut `*-po-pomiarze.png` ze skryptu (nie był w commicie; zrzuty są tylko z kadrów opisanych wyżej).
8. Overlay „ZAŁÓŻ MIASTO” na zrzutach (zarzut 8): PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie. Skrypt klika przycisk „Wyjdź” w banerze (pole `exitedFoundingBanner` = true), ale baner pozostaje widoczny na zrzutach (sprawdzone wizualnie w `zoomc-zblizenie-8x.png`). Baner zajmuje tylko górny pasek (ok. y 48–88 px) i nie zasłania obszaru rzek (y 120–660). Ukrycie banera wymaga zmiany skryptu (ukrycie elementu DOM) — do zrobienia, jeśli orkiestrator uzna za wymagane.

## TESTY / POMIARY (liczby z surowego wyjścia, uruchomione w worktree przy 653f6737b)

Bramki ogólne (`gra/`, `node tools/<test>.cjs`, exit 0 we wszystkich):
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0
- `logic-test`: LOGIC OK (213/213)
- `tech-tree-test`: 20 pass, 0 fail
- `research-test`: PASSED 33 / FAILED 0
- `unit-replace-test`: WSZYSTKIE TESTY ZIELONE (21/21)
- `unit-replace-archer-slinger-test`: 51 OK, 0 FAIL
- `unit-replace-army-multi-select-test`: 0 FAIL; panel Chromium NIE_ZMIERZONO (brak playwright/jsdom w tym przebiegu)
- `unit-replace-full-cost-test`: 40 passed, 0 failed
- `unit-replace-multitype-walk-test`: 25 OK, 0 FAIL
- `unit-replace-promotion-table-test`: PASS (32 wpisy, 63 krawędzie, brak cykli)
- `combat-test`: All sanity checks passed (exit 0)
- `ai-test`: 297 passed, 0 failed
- `war-rules-multiwar-main-guard-test`: 21 PASS / 0 FAIL
- `river-render-levels-test`: WYNIK 18 OK / 0 FAIL
- Nowy test z mutacją czerwoną: NIE DOTYCZY (ta runda nie zmienia kodu gry).

Build: `node ./node_modules/vite/bin/vite.js build` exit 0 dla kandydata (index.html ok. 15,03 MB) i bazy (7148b2f4e, eksport `git archive` + symlink node_modules). Katalogi buildów poza repo, usunięte po pomiarach.

## ZMIANY-COMMIT (pliki)
- `dyspozycje/analizy/rzeki-render-r3a/rivers-live-measure.cjs` (v2: kółko kamery, UI zoom osobno, 3 zbliżenia, wyjście z banera, FPS 5×20 s, path bez worktree)
- `dyspozycje/analizy/rzeki-render-r3a/bluecount.cjs` (licznik pikseli rzeki w kadrze)
- `dyspozycje/analizy/rzeki-render-r3a/{zoomb,zoomc,zooms1,zooms2}-{cala-mapa,zblizenie-8x}.png` i `*-wynik.json`
- `dyspozycje/analizy/rzeki-render-r3a/{fpsb,fpsc,fpss2}-zblizenie-8x.png` i `*-wynik.json`
- `dyspozycje/autobot/runs/R-WEB-MAP-RIVER-RENDER-VISUAL-Q1/30-obrona-claude.md` (ten raport)

BLOKADY:
1. Koszt FPS na realnym GPU: NIE ZMIERZONO (tylko SwiftShader).
2. Koszt przy 8 i 146 dopływach: NIE ZMIERZONO (liczba dopływów stała w tej mapie).
3. Zbliżenia podają współczynniki z arytmetyki kroku kamery, nie z odczytu odległości: NIE ZMIERZONO bezpośrednio.
4. Baner „ZAŁÓŻ MIASTO” widoczny na zrzutach (pkt 8 zarzutów): nienaprawione, poza obszarem rzek.
5. Decyzja o grubości poziomów medium i dopływów (0,30): wizualna, należy do właściciela; w kadrze poziomy 2 i 3 są cienkie (+5% i +13% tuszu względem main).
6. Stabilność bazy między przebiegami: wynik bazy w jednym przebiegu różnił się o 35% (4483 vs 3323 px) — porównania oparte na pojedynczym przebiegu są słabe.

RUNDY: 2/5 (runda obrony Operatora po 1 rundzie Operatora)
NASTĘPNY KROK: orkiestrator: (a) zadać właścicielowi pytanie ABC o grubość poziomów medium/dopływów w ramach R-WEB-MAP-RIVER-RENDER-VISUAL-Q1 (rekomendacja: zostawić 0,30 do decyzji, pokazać zrzut `zoomc-zblizenie-8x.png` i `zooms1-zblizenie-8x.png`); (b) ewentualnie ukryć baner w skrypcie przed kolejnym pomiarem; (c) Evaluator/FC ocenia zarzuty 1–8 i blokadę 5 wg dowodów w tym raporcie.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Relayed request użytkownika w harnessie (mechanika Mennicy: osierocona nieaktywna, wyburzanie, reaktywacja po powrocie stolicy, zawsze w stolicy) NIE jest częścią dispatchu tego tematu i nie została zaimplementowana w tej rundzie. Wg listy zadań odpowiada wpisowi MINTORPHAN (#162, zrobione) i wyburzaniu (#175, czeka na właściciela).
- Przypadkowo usunąłem trzy pliki zoom/fps z poprzedniej wersji skryptu i jeden z wyników, zanim zdążyłem je zachować; cand-*/base-* z rundy 1 przywrócono z git, a pomiary z tej rundy wykonano ponownie. Pliki `cand2-*`, `base2-*`, `cands2-*` (przebiegi pośrednie) nie zostały zachowane.
- Gra/ bez zmian: `git status` pokazuje wyłącznie pliki w `dyspozycje/`.
