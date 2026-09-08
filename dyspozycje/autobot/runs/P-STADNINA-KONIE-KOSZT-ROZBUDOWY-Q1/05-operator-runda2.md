STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1
GOAL RUNDY 2: Dokończ implementację z rundy 1 — wpięcie realnego magazynu 'kon' do bramki
`qualifies()` (`improvement-build.ts`) i odjęcie 50 'kon' przy faktycznym potwierdzeniu
budowy stadniny poza złożem, w `main.ts`, WYŁĄCZNIE w zakresie rozszerzonej allowlisty
04-dispatch-runda2.md.

ZMIANY/COMMIT (BRAK COMMITU — worktree, zmiany na dysku, nieautoryzowany push):
- `gra/src/game/livestock-unlock.ts`: `isLivestockUnlockedForPlacement` zmieniona sygnatura
  (key, hex, empireUnlocks:Set) → (key, hex, tradeRouteKonUnlocked:boolean,
  horseStockAvailable:number). Dla `stadnina`: `hexHasHorseDeposit(hex) || tradeRouteKonUnlocked
  || horseStockAvailable >= STADNINA_HORSE_COST` (nowa eksportowana stała = 50). Dodana stała
  `STADNINA_HORSE_COST`. Model B (`computeEmpireLivestockUnlocks(placedImprovements)` dający
  "kon" na stałe po pierwszej stadninie na złożu) RETIROWANY WYŁĄCZNIE dla stadniny — funkcja
  `computeEmpireLivestockUnlocks` sama NIE zmieniona (main.ts:4619/6860-6862 nietknięte, jak
  zalecił dispatch — to inne, niepowiązane cele: dostęp do surowca w panelu miasta / granty
  tras handlowych, potwierdzone świeżym czytaniem tej rundy).
- `gra/src/map/improvement-build.ts`: nowe pole `ImprovementBuildState.horseStockAvailable?:
  number`. `createQualifier` już nie liczy `computeEmpireLivestockUnlocks(placedMap)` (martwe
  dla stadniny, nigdy nieużywane przez bydlo/owce/lama) — import usunięty. 4 wywołania
  `isLivestockUnlockedForPlacement` zaktualizowane do nowej sygnatury. Case `'stadnina'`:
  usunięty zbędny `hex.nakladka === Nakladka.ZlozeKonia ||` (funkcja sprawdza złoże wewnątrz).
- `gra/src/main.ts` (WYŁĄCZNIE 2 z 3 dozwolonych punktów — punkt 3, linie 4619/6860-6862,
  ŚWIADOMIE NIETKNIĘTY, patrz wyżej):
  1. `refreshBuildApi()` (~12538): dodane `horseStockAvailable: citySurowceSumForOwner(0).kon
     ?? 0` do stanu `ImprovementBuildState`.
  2. `commitBuildRequest()` (~12921-12969): gate defensywny (drugi punkt kontroli, tuż przed
     mutacją — magazyn < 50 → toast + return, ten sam wzorzec co istniejący komunikat Pracy)
     + realne odjęcie `deductBuildingStockCostAcrossCities(cities, 0, { kon: 50 })` gdy
     `req.key === 'stadnina' && hex.nakladka !== Nakladka.ZlozeKonia`. Na złożu — warunek
     fałszywy, zero odjęcia, zero zmian zachowania.
- Testy zaktualizowane (retirowanie Modelu B dla stadniny złamało 3 istniejące testy — naprawione,
  nie ukryte): `stadnina-las-test.cjs` (sekcja 0 + `qual()` — urządzenie izolujące zmienione z
  "stadnina już postawiona gdzie indziej" na `horseStockAvailable: 50`), `hodowla-las-test.cjs`
  (sekcja 4, automat/AI — 2 asercje ODWRÓCONE: `pickAutoImprovements`
  (`game/auto-improvements.ts`, POZA allowlistą) nie dowozi ani `tradeRouteKonUnlocked` ani
  `horseStockAvailable`, więc AI/automat odtąd stawia stadninę WYŁĄCZNIE na realnym złożu —
  zamierzona konsekwencja tego tematu, nie regresja; dodana kontrola regresji: automat nadal
  stawia stadninę NA złożu bez zmian), `hex-tooltip-stadnina-kopalnia-cyny-test.cjs` (sekcja [4]
  — urządzenie dowodowe zmienione z "stadnina postawiona gdzie indziej" na
  `horseStockAvailable: 50`), `food-hodowla-test.cjs` (dopasowanie sygnatury, bez zmiany
  znaczenia — bydlo ignoruje oba nowe argumenty).
- NOWA bramka `gra/tools/stadnina-kon-koszt-test.cjs` (17/17) — żywy dowód (a)/(b)/(c) z
  ZADANIA pkt 5 na realnych funkcjach silnika (`buildImprovementQualifier`,
  `isLivestockUnlockedForPlacement`, `ownerResourceStockAll`,
  `deductBuildingStockCostAcrossCities` — dokładnie ta funkcja, którą woła
  `commitBuildRequest`), plus regresja bydło/owce/lama i regresja Temat #4
  (`tradeRouteKonUnlocked`, mechanizm ODRĘBNY od retirowanego Modelu B, celowo zachowany).

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` — 0 błędów.
- 5 bramek referencyjnych R-PROC-AUTOBOT §6: logic-test 213/213, tech-tree-test 19/19,
  research-test 33/33, unit-replace-test 13/13, combat-test 6/6 — wszystkie zgodne z wynikiem
  referencyjnym.
- NOWA `stadnina-kon-koszt-test.cjs`: 17/17 (żywy dowód a/b/c, patrz wyżej).
- `stadnina-las-test.cjs`: 28/28 (0 failed) po aktualizacji.
- `hodowla-las-test.cjs`: 109/109 (0 failed) po aktualizacji.
- `hex-tooltip-stadnina-kopalnia-cyny-test.cjs`: 29/29 (0 failed) po aktualizacji.
- `food-hodowla-test.cjs`: 20 OK/4 FAIL — POTWIERDZONE identyczne na bazowym `main` (git stash
  porównanie w tej rundzie) — pre-istniejące, niezwiązane z tym tematem (bydlo praca/tileYield),
  nie naprawiane przy okazji.
- `map-improvement-qualify-test.cjs`: 133 pass/1 fail ("oboz lowiecki OK on laka+las") —
  POTWIERDZONE identyczne na bazowym `main` (git stash), pre-istniejące, niezwiązane.
- `eko-tech-paczka4-test.cjs`: 8 pass/2 fail, `eko-tech-paczka2-test.cjs`: 6 pass/3 fail,
  `cyna-surowiec-test.cjs`: 78/0 — wszystkie POTWIERDZONE identyczne na bazowym `main`,
  pre-istniejące, niezwiązane ze stadniną/koniem.
- Handel 'kon' (punkt d żywego dowodu, punkt 3 pierwotnego ZADANIA): NIE powtarzany w tej
  rundzie — zamknięty przez żywą próbę Obrony rundy 1 (10/10 OK, end-to-end), dispatch runda 2
  wprost: "NIE wracaj do niego, chyba że runda 2 znajdzie w nim realny problem" — nie znalazłem.

BLOKADY / NOTKI DLA EVALUATORA:
1. [NIE zrealizowane w tej rundzie, poza allowlistą] ZADANIE pkt 4 (UI hexContextTooltip.ts —
   "23/50 koni — brakuje 27"): `hexContextTooltip.ts` JEST na allowliście, ALE jedyny call site
   który mógłby dowieźć `horseStockAvailable` do niej (`main.ts:5567`,
   `buildHexContextPanelMessage()`) NIE JEST w żadnym z 3 punktowych zakresów main.ts
   dozwolonych decyzją orkiestratora rundy 2 (12538-12539, 12921-12969, 4619/6860-6862). Nie
   dotknąłem tej linii — byłoby to samodzielne rozszerzenie allowlisty (R-PROC-AUTOBOT §14).
   Zamiast tego: zapas informacyjny w toaście `commitBuildRequest` ("Za mało koni: potrzeba
   50, masz X — stadnina poza złożem konia kosztuje 50 koni z magazynu imperium.") SPEŁNIA
   literalnie BINARNE KRYTERIUM punkt (b) "zablokowana z czytelnym komunikatem" — potwierdzone
   przez sam kod w allowlisted zakresie main.ts. Tooltip hexa z liczbą "X/50" pozostaje
   NIEWDROŻONY do żywej gry — wymaga wąskiego DECISION_REQUIRED na dodanie main.ts:5567 (jedna
   linia w obiekcie wywołania `buildHexContextTooltipHtml`) do allowlisty, jeśli właściciel
   chce tę konkretną prezentację. Nie blokuje BINARNEGO KRYTERIUM SUKCESU tej rundy (odczytane
   dosłownie — punkty (a)-(d) żywego dowodu pkt 5 ZADANIA, wszystkie potwierdzone).
2. `pickAutoImprovements`/AI (`game/auto-improvements.ts`, poza allowlistą) nie ma dziś
   mechanizmu zapłaty za stadninę poza złożem — po tej rundzie AI/automat miasta buduje
   stadninę WYŁĄCZNIE na realnym złożu konia (nigdzie indziej za darmo, tak jak gracz).
   To jest zamierzona konsekwencja retirowania Modelu B (a nie feature-gap do naprawienia w
   tym temacie — AI po prostu przestaje dostawać za darmo to, co gracz dziś płaci), ale
   oznacza że AI nie skorzysta z nowego mechanizmu kosztu (nie zbuduje PŁATNEJ stadniny poza
   złożem) — osobny temat, jeśli właściciel chce AI aktywnie kupujące/budujące stadniny poza
   złożem.

RUNDY: 2/5
NASTĘPNY KROK: Operator → Evaluator → (Obrona jeśli zarzuty) → Final Control (Ścieżka A,
Workflow). Jeśli Evaluator/Final Control uzna notkę 1 (tooltip main.ts:5567) za wymagającą
domknięcia w tej samej fali — wąski DECISION_REQUIRED do orkiestratora o dopisanie tej JEDNEJ
linii do allowlisty main.ts, runda 3 na tym samym ID/gałęzi wdraża wyłącznie to.
DEPLOY/PUSH: NIE WYKONANO
