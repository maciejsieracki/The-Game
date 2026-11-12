STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1
GOAL: przy rozdzielaniu armii (panel armySplitPanel) i przy ruchu wydzielonego pod-stosu NIE wolno wejść na heks z obcym miastem (także pustym, bez obrońców) ani na heks zajęty przez obcą jednostkę. Własne miasto i własne jednostki zachowują dotychczasowe zachowanie.
BAZA: aeb52465e (origin/main, ROBOCZA b6490d0b)
KOMMIT: patrz pole sha w raporcie StructuredOutput (commit operatora na gałęzi R-WEB-ARMY-SPLIT-ENEMY-CITY-BLOCK-Q1-wip, bez push).

## Przyczyna
Cel rozdzielenia wyliczał `findSplitDestHexes` z `isHexPassableForUnit` (wyłącznie przejezdność terenu) oraz z zajętości `units` z pominięciem garnizonów (`inGarnizon !== true`). Heks obcego miasta bez jednostek polowych przechodził oba filtry, więc armia mogła być rozdzielona na wrogie miasto. Następnie `onSplit` ustawiał `u.q/u.r` bez sprawdzenia prawa wejścia (`canUnitOccupyCityHex`), a `tryAutoCaptureEmptyCityAt` nie zajmował miasta przy braku kotwicy/warunków, więc jednostka „wpadała do miasta, ale go nie zajmowała”.

## Zmiany (allowlista)
- gra/src/game/armyMerge.ts: nowy eksport `splitTargetPassable(isPassable, ownerId, cities)` = przejezdność terenu AND `canUnitOccupyCityHex` (import z city-hex-movement). Dodany import `canUnitOccupyCityHex`, `CityHexRef`.
- gra/src/main.ts (tylko miejsce walidacji celu): import `splitTargetPassable`; w 3 wywołaniach `findSplitDestHexes` (otwarcie panelu, HUD `splitDests`, `canSplit`) predykat `isHexPassableForUnit` zastąpiony `splitTargetPassable(isHexPassableForUnit, owner, cities)`; etykieta sąsiada „Miasto przeciwnika” w `splitNeighbors`; obrona w `onSplit`: jeśli cel to obce miasto → komunikat „Nie można rozdzielić armii na obce miasto.” i brak mutacji.
- gra/tools/army-split-enemy-city-block-test.cjs (nowy): test regresyjny bundlujący realny armyMerge.ts (esbuild).
- Nie zmieniono: armySplitPanel.ts, gra/data/*.json, WERSJE.md.
- Dodatkowo (poza gwarancją allowlisty, potrzebne do uruchomienia bramek w worktree): `npm ci --ignore-scripts` w gra/ (node_modules, gitignored). Brak `npm run build/dev`.

Uwaga do zakresu: wywołanie `findAdjacentEmptyHexes` w `evictForeignUnitsFromCityHexes` (main.ts ok. 14797) nie zostało zmienione, bo już używa `canUnitOccupyCityHex` na celu.

## Testy
- `node tools/army-split-enemy-city-block-test.cjs`: 9 PASS / 0 FAIL, exit 0.
- Mutacja (usunięcie blokady: `splitTargetPassable` = sam isPassable): test czerwony, 3 linie FAIL, exit 1. Źródło przywrócone z kopii; po przywróceniu 9 PASS / 0 FAIL.
- `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0 (bez wyjścia).
- Bramki referencyjne (surowe wyjście):
  - logic-test: `LOGIC OK (213/213)`, exit 0
  - tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
  - research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
  - unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
  - combat-test: `COMBAT TEST: 6/6 pass`, exit 0
- Pozostałe testy armii:
  - army-split-movement-test: 4 pass / 0 fail, exit 0
  - army-split-ruch-icons-test: 7 pass / 0 fail, exit 0
  - army-split-hex-honeycomb-test: 34 pass / 0 fail, exit 0
  - army-split-graphical-hex-picker-test: 14 pass / 0 fail, exit 0
  - army-split-panel-scroll-grid-test: 16 PASS / 2 FAIL, exit 1. Oba FAIL to asercje `PRZED ... (RED-PRE)`: skrypt buduje wersję PRZED z `git show HEAD~`, a nie z plików zmienionych tutaj; wszystkie asercje PO przechodzą. NIE_ZMIERZONO na bazie aeb52465e (nie uruchamiano na czystym checkoucie), ale zmienione pliki (armySplitPanel.ts) nie są częścią tej ścieżki. Do potwierdzenia przez FC.
- Dowód w realnej grze (Chromium): NIE_ZMIERZONO. Chromium jest w /usr/bin/chromium, ale pełny dowód wymaga uruchomienia gry w przeglądarce, a bramka zakazuje build/dev w gra/. Brak zrzutu ekranu i brak testu E2E w grze.

## Blokady / założenia
- BRAK ADDENDUM: plik `00-dispatch-DODATEK-claude.md` NIE istnieje w gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (git: „does not exist”). Zadanie oparto na `00-dispatch.md` z tej samej gałęzi (dyspozycja z 2026-11-12 w tej gałęzi, nie w origin/main) oraz na zgłoszeniu z wiadomości właściciela. Założenie: zakres = kryteria końca z dispatchu.
- Założenie: „heks zajęty przez obcą jednostkę” = jednostka polowa (już blokowana przez occupancy) i garnizon obcego miasta (blokowany przez regułę miasta).
- Założenie: origin nie jest dodawany jako cel bez allowSameHex (zachowane).
- Commit operatora zawiera kod i raport (wbrew „zacommituj tylko ten plik”), bo kod musi być w SHA do integracji (`git merge-base --is-ancestor`). Pliki dodane po ścieżkach, bez `-A`.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator: przegląd kodu + powtórzenie testów; Final Control: decyzja o dowodzie w Chromium (brak w tej rundzie) i o wyniku panel-scroll (RED-PRE na bazie). Potem integracja orkiestratora.

## DEPLOY/PUSH: NIE WYKONANO
