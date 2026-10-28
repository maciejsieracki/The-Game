# AutoBot Operator — continuation on current main

TEMAT: `R-ARMY-COMMANDER-UNIT-MARKERS-20261028`  
RUNDA OPERATORA: 3/5 (kontynuacja po Final Control R2)  
DATA: 2026-10-28  
STATUS OPERATORA: wykonanie i raportowanie zakończone; to nie jest werdykt Evaluatora ani Final Control.  
BAZA: `origin/main` / `HEAD` przed zmianami: `85f8c5f0e0aa6ff46aa8b85a03d0bc0c71d86268`  
WORKTREE: `/tmp/the-game-commander-markers-20261028`  
BRANCH: `codex/R-ARMY-COMMANDER-UNIT-MARKERS-20261028-integration`

## Recon i zakres

Na bazie `85f8c5f0` potwierdziłem, że `stoneGeneralUnitId(hasWheel)` i jego użycie w wyborze Wodza Kamienia są już na main. Nie przenosiłem `main.ts` ani `generals.ts`. Brakowało pozostałych zatwierdzonych zachowań: agregowanej flagi dowódcy, gwiazdy dowódcy, jej podłączenia do renderera, rozmiaru emblematu 4× i celowanego testu.

Przeniosłem zatwierdzone hunki z archiwalnego kandydata tylko do plików z allowlisty. Żaden hunk rekrutacji, BattleScene, AI ani inny hunk `main.ts` nie został przeniesiony. Test kandydata miał źródłową asercję selektora bazującą na niezgodnym kształcie `main.ts`; usunąłem wyłącznie tę asercję, bo selektor jest już na bazie i nie wchodzi w port. Zachowane są testy helpera `stoneGeneralUnitId(false/true)` oraz testy odznaki.

Allowlista tej kontynuacji: `armyMerge.ts`, `unitStatPlate.ts`, `unitVeteranBadges.ts`, `units.ts`, `commander-star-emblem-test.cjs` i dokumenty/obraz dowodowy w tym katalogu. W `main.ts` brak zmian. `gra/node_modules` jest lokalnym, ignorowanym symlinkiem do istniejącej instalacji zależności w `/workspace/all-topics-candidate`; nie jest częścią diffu.

## Dokładny diff produktu

- `gra/src/game/armyMerge.ts`: dodano `StackVitals.hasCommander` i wyliczenie `stack.some(unit => unit.isGeneral === true)`.
- `gra/src/render/unitVeteranBadges.ts`: dodano `applyUnitCommanderStar()`, osobną większą gwiazdę nad rzędem XP, znacznik hit-testu, idempotentne tworzenie i usuwanie po `false`.
- `gra/src/render/units.ts`: renderer przekazuje agregowane `vitals.hasCommander` dla reprezentanta; poza stosem używa `unit.isGeneral`.
- `gra/src/render/unitStatPlate.ts`: `PLATE_OWNER_ICON_SIZE` zmieniono z `0.20 * HEX_R` na `0.80 * HEX_R` (dokładnie 4×). Pozycja X dalej wylicza środek na podstawie nowego rozmiaru, więc prawa krawędź emblematu zostaje przy lewej krawędzi tabliczki.
- `gra/tools/commander-star-emblem-test.cjs`: testuje produkcyjne `stackVitals()` oraz `applyUnitCommanderStar()` przy braku dowódcy, dowódcy jako innym członku stosu i utracie dowódcy; zachowuje testy 3 gwiazdek XP, odrębnej gwiazdy, idempotencji, 4× emblematu i helpera selektora Stone.

Diff kodu względem bazy: 46 insertions / 6 deletions w 4 śledzonych plikach; nowy test jest plikiem allowlisty. `git diff --check` — PASS. Worktree zawiera wyłącznie wymienione pliki kodu/testu i artefakty tej rundy.

## Metryki wykonania

- `node gra/tools/commander-star-emblem-test.cjs`: **11 passed, 0 failed**.
- `cd gra && node ./node_modules/typescript/bin/tsc --noEmit`: **exit 0**, bez diagnostyk.
- `cd gra && node ./node_modules/vite/bin/vite.js build --outDir /tmp/commander-markers-dist --emptyOutDir`: **exit 0**, 916 modułów; `index.html` 69,924.84 kB (gzip 48,689.24 kB), build 18.36 s.
- `git diff --check`: **exit 0**.
- SHA-256 bieżących plików:
  - `gra/src/game/armyMerge.ts`: `df24c3444b64f400a7b67a17fd70f7b46fe148a1714bdfc28fde7edf1705555e`
  - `gra/src/render/unitStatPlate.ts`: `eaf02c268387b2469871112884d3548298281a5d95eb0cfe445670dc8aa13e3d`
  - `gra/src/render/unitVeteranBadges.ts`: `92501c79c7db678a3e0555c1ca045c109d10d7f15034091069ce6d17b31a0354`
  - `gra/src/render/units.ts`: `e4bb5b06384a8d25740da3919db8f2fd533e070a27e89b32da8d99db3004877f`
  - `gra/tools/commander-star-emblem-test.cjs`: `632f24dc37fd67976df3d152f26095f5994e52cacdeb83f9e71592eada04126a`

## Chromium i render

Otworzyłem produkcyjny single-file build w Chromium (`/usr/bin/chromium`) w rozdzielczości 1440×1000. Menu działa, konfiguracja nowej gry przechodzi do generowania mapy, ale po ponad 60 sekundach generator pozostawał na `6/10 · Rzeki — główne`; nie uzyskałem ekranu gotowej mapy z jednostką. W pierwszym otwarciu Chromium zgłosił 404 dla `/favicon.ico` (serwer podglądu nie zawiera tej ikony); sprawdzenie endpointu potwierdziło 404. To dotyczy faviconu i nie blokuje działania menu ani rozpoczęcia generatora.

Jako ograniczony renderowy dowód uruchomiłem komponenty produkcyjne `applyUnitStatPlate()` i `applyUnitCommanderStar()` w Chromium/WebGL SwiftShader, wraz z trzema produkcyjnymi gwiazdkami XP, na żetonie testowym pod kątem zbliżonym do widoku mapy. Zrzut 1440×900 jest w `06-chromium-component-preview.png`. Widać oddzielną gwiazdę Wodza nad 3 gwiazdkami XP i emblemat przy tabliczce. To dowodzi renderu tych komponentów, ale nie jest zrzutem jednostki w pełnym widoku gry ani bezpośrednim porównaniem dwóch wersji obrazów. Porównanie wymiaru jest liczbowe: `0.80 / 0.20 = 4`; anchor jest sprawdzany testem produkcyjnego źródła. Pełny ekran mapy i wizualny pomiar w mapie pozostają brakami do dalszej kontroli.

## Ograniczenia i przekazanie

- Brak baseline runu testu na czystym main: temat nie miał testu, więc nie podaję porównania liczby testów przed/po. Stan bazowy sprawdziłem przez `git show`/grep: brak odznaki i stała `0.20 * HEX_R`; selektor Stone już obecny.
- Brak ukończonej mapy w Chromium z powodu długiego generowania na 6/10; nie twierdzę, że screenshot komponentu zastępuje ten dowód.
- Raport nie rozstrzyga kryteriów Evaluatora, nie wydaje Final Control i nie autoryzuje integracji.
- Commit, push, integracja i deploy: nie wykonano.
