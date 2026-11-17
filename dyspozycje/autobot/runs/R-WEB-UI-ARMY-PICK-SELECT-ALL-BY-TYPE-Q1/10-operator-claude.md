# R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI armii, web)
TEMAT: R-WEB-UI-ARMY-PICK-SELECT-ALL-BY-TYPE-Q1
GOAL: nad listą jednostek przy zaznaczaniu armii — rząd chipów „zaznacz wszystkich <typ>” (np. „Łucznik ×50”, „Procarz ×4”). Klik zaznacza WSZYSTKIE jednostki tego typeId (nie rusza innych typów); ponowny klik odznacza. Chip pokazuje stan (brak / część `sel/total` / wszystkie). Działa w panelu podziału, w panelu scalania i w pasku zaznaczenia stosu (ten ostatni zasila „Zastąp” i „Rozwiąż”).
BAZA: origin/main = 4ac6654472fa97a046b4da9ffaf8ac5df90d75b9 (FALA 775, ARMYSPLIT w main ✓).
DISK przed startem: 9,7 GB wolne (próg ≥ 6 GB ✓).

## ZMIANY / COMMIT
Commit: patrz SHA w polu `sha` wyniku (czubek brancha `wf_742d80aa-fc9-1`, detach od 4ac66544).

Pliki:
- NOWE `gra/src/ui/armyTypeChips.ts` — czysta logika (bez stanu DOM): `groupUnitsByType` (po typeId, opcjonalnie bez generała), `armyTypeChipInfo` (none/part/all + tekst + aria), `toggleArmyTypeChip` (klik: nie wszystkie → dodaj wszystkie typu; wszystkie → usuń), budowa HTML przycisku/rzędu, `applyArmyTypeChipInfo` (aktualizacja bez przebudowy listy), `ARMY_TYPE_CHIP_CSS`.
- `gra/src/ui/armySplitPanel.ts` — rząd chipów nad listą „Wybierz jednostki do odłączenia” (poza przewijaną listą, więc zawsze widoczny); `sync()` aktualizuje chipy; klik → `toggleArmyTypeChip` + `sync()`. Reguła „na źródle musi zostać ≥1” działa bez zmian (chip zaznaczający cały stos blokuje „Rozdziel”).
- `gra/src/ui/armyMergePickPanel.ts` — rząd chipów nad „Jednostki do przeniesienia”; `renderInner()` przebudowuje chipy razem z listą.
- `gra/src/ui/hexContextTooltip.ts` — `buildUnitStackTypeChipsHtml` (eksport) — rząd chipów nad kartami stosu w pasku zaznaczenia (klasy `sp-unit-pick-btn sp-unit-type-chip`, `data-act="pick-type:<typeId>"`), CSS. Generał/wódz NIE liczy się do grupy typu (zgodnie z „Zaznacz wszystko”, które wyklucza generała).
- `gra/src/main.ts` — (a) `mergeUnitRow` dodaje `typeId`; (b) karty stosu w `buildArmyStackHudStateInner` dodają `typeId`; (c) akcja `pick-type:<typeId>` → `togglePickUnitTypeOnStack` (grupa = jednostki typeId w stosie bez generała; modyfikuje ten sam `stackPickState`, więc „Zastąp”/„Rozwiąż” widzą wynik); (d) import `toggleArmyTypeChip`.
- `gra/src/ui/armyStackHud.ts`, `gra/src/ui/armyMergePanel.ts` — tylko pole `typeId?: string` w typach (bez zmian zachowania).
- NOWY test `gra/tools/army-type-chips-test.cjs`.

UWAGA — odstępstwo od allowlisty (wymagane minimum, do oceny przez Evaluatora): `armyStackHud.ts`, `armyMergePanel.ts`, `hexContextTooltip.ts` i pięć punktów w `main.ts` spoza listy. Powód: dispatch każe dodać skróty „do KAŻDEGO takiego miejsca” — pasek stosu (hexContextTooltip) jest faktycznym miejscem wielokrotnego zaznaczania, a „Zastąp” czyta jego stan (`pickedUnitsOnStack`). `typeId` musi przejść z `RuntimeUnit` do UI, stąd typy i `mergeUnitRow`/karty.

`unitReplacePicker.ts` — NIE ZMIENIANY: to lista zamienników dla jednej karty (typy do wyboru), bez zaznaczania wielu jednostek; wielokrotne zaznaczanie do zamiany odbywa się w pasku stosu (obsłużone wyżej).

## TESTY
1. Typecheck: `node_modules/.bin/tsc --noEmit` → exit 0 (brak wyjścia).
2. Nowy test `node gra/tools/army-type-chips-test.cjs` → **40 pass, 0 fail**. Uruchamia PRAWDZIWE funkcje paneli (bundle esbuild + jsdom, bez regexów w źródle). Pokrywa: split (chip Łucznik zaznacza dokładnie 6 łuczników + domyślny generał; drugi klik odznacza; ręczne odznaczenie → część 3/4; klik w część dopina wszystkie; Wojownik z generałem; „Rozdziel” zwraca właściwy zbiór; blokada, gdy zaznaczony cały stos), merge (chip all → odznacza typ; „Połącz” zwraca wyłącznie zaznaczone), pasek stosu (`buildUnitStackTypeChipsHtml`: Łucznik 2/6, Procarz none, Wojownik ×2 bez generała).
3. Mutacja (kontrola czerwienią): `node gra/tools/army-type-chips-test.cjs --mutate` (pusta pętla w `toggleArmyTypeChip`) → **22 pass, 18 fail, exit 1** ✓ — testy realnie wykrywają wadę.
4. Bramki referencyjne (raw exit / wynik):
   - logic-test: exit 0
   - tech-tree-test: 20 pass, 0 fail
   - research-test: PASSED 33 / FAILED 0
   - unit-replace-test: exit 0
   - combat-test: COMBAT TEST 6/6 pass
   - load-game-regression-test: 34 PASS / 0 FAIL
5. Istniejące testy paneli armii (bez regresji):
   - army-split-besieging-no-siege-lock: 21/0; army-split-enemy-city-block: 14/0; army-split-graphical-hex-picker: 14/0; army-split-hex-honeycomb: 34/0; army-split-movement: 4/0; army-split-ruch-icons: 7/0
   - army-merge-bounce: 4/0; army-merge-colocated: 4/0; army-merge-separate-return: 16/0; army-merge-separate-return-mainguard: 73/0; army-merge-dismiss-bounce: 16/0; army-merge-stackgroupid: 11045/0; army-merge-split-direction-icons: PASS; army-merge-panel-list-visibility: 104/0; army-merge-panel-production-mount: 9/0; army-merge-panel-scroll-real-render: 27/0
   - army-panel-card-move-bar: passed; army-panel-recruit-remove: 21/0; army-panel-recruit-rally-general: 5 passed
6. Testy z FAIL, ale **istnieją identycznie na bazie 4ac66544** (sprawdzone na czystym eksporcie `git archive` tej bazy; zmiana ich nie dotyka):
   - army-split-panel-scroll-grid-test: 16 PASS / 2 FAIL — dwa asercje „PRZED (RED-PRE)” oczekują starego zachowania (scrollTop wraca do 0; brak siatki 3×5); na bazie wynik identyczny.
   - army-panel-general-label-multiselect-test: błąd builda esbuild — brak loadera `.svg?raw` w `brandAssets.ts` (ten sam dług co #427).
7. Żywy bieg w Chromium 1280×720, DPR 1 — PANELOWY (nie pełna gra): skrypt w scratchpad bundluje prawdziwe `armySplitPanel`/`armyMergePickPanel` i otwiera je z armią 56 jednostek (50 łuczników, 4 procarzy, 2 wojowników + generał). Wynik:
   - przed kliknięciem: `Łucznik ×50 [none]`, `Procarz ×4 [none]`, `Wojownik 1/3 [part]`; zaznaczone 1 (domyślny generał); scrollWidth 1280 = innerWidth 1280 (brak poziomego przewijania)
   - klik „Łucznik”: `Łucznik ×50 [all]`, zaznaczone 51; aria-pressed = true
   - drugi klik: `Łucznik ×50 [none]`, zaznaczone 1
   - „Rozdziel” po zaznaczeniu łuczników: onSplit = 51 id (50 łuczników + generał), reszta = [G1]
   - panel scalania: klik „Procarz” → `Procarz ×4 [none]`, zaznaczone 53 → wartości spójne z testem jednostkowym
   - zrzut split-1280x720-after-lucznik-chip.png: rząd chipów u góry nad siatką, bez zawijania i przepełnienia. Pliki: `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/live-chips/split-1280x720-after-lucznik-chip.png` oraz `.../merge-1280x720-after-procarz-chip.png`.
   - NIE ZMIERZONO: pełna gra w Vite (`npm run build` zakazany) i żywy bieg paska stosu (`sidePanelHud`/`hexContextTooltip`) w grze — tylko test jednostkowy i HTML. Do weryfikacji w grze przez Evaluatora/właściciela.

## BLOKADY
Brak blokad technicznych. Notatki:
- Chipy pokazują `typeId` tam, gdzie wiersze podziału/scalania mają `name = typeId` (`mergeUnitRow` ustawia name na surowe typeId, jak dotąd) — etykieta chipa w grze może więc wyglądać jak surowe ID („Lucznik ×50”), a nie „Łucznik”. Zachowanie wiersza jest istniejące; nie zmieniałem (poza zakresem). Do decyzji orkiestratora (powiązane z R-WEB-UI-RAW-IDS).

## RUNDY
1/5 (runda 1, Operator HAIKU 5.5).

## NASTĘPNY KROK
Evaluator (SONNET): przegląd diffu (w tym odstępstwo od allowlisty opisane wyżej), uruchomienie `army-type-chips-test.cjs` i mutacji, weryfikacja w grze (pasek stosu, którego nie ruszyłem w live).

## UWAGI-DLA-ORKIESTRATORA
- Dispatch i DODATEK leżały na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na `origin/main` (tam ścieżka nie istnieje) — odczytane z gałęzi.
- Testy `army-merge-panel-scroll-real-render-test` nadpisują TRACKED zrzut `dyspozycje/autobot/runs/R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1/06-production-robocza-150-percent.png` (worktree stawał się brudny po samym uruchomieniu testu). Przywrócony `git restore`, nie jest w commicie. Warto, żeby test nie zapisywał do repo.
- Brak stałej listy testów w repo (grep po nazwach testów nie znajduje rejestru poza runami). Nowy test jest w `gra/tools/army-type-chips-test.cjs`.
- Test `army-panel-general-label-multiselect-test` wymaga loadera SVG w swoim buildzie (dług podobny do #427).
- `gra/node_modules` zainstalowany w worktree tylko na potrzeby tsc/testów (gitignored); usunięty po pracy.

## DEPLOY/PUSH
NIE WYKONANO (Operator nie pushuje na main, nie integruje, nie deployuje).
