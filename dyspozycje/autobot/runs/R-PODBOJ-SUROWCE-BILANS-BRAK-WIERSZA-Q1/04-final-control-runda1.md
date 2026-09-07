STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1
GOAL: Popup "Bilans zdobycia" pokazuje wiersz(e) "surowce zdobyte" z city.surowce
przejmowanego miasta, zero zmiany mechaniki transferu, zero zmiany wiersza "Pula pracy".

ZMIANY/COMMIT: worktree `/home/user/wt-podboj-surowce-bilans`, gałąź
`autobot/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1`. Zweryfikowano SAMODZIELNIE na dysku
commity `1876c216` (kod), `a626bde2` (Operator), `cb510d8e` (Evaluator), `28314433`
(Obrona). Ten plik = Final Control rundy 1.

`git diff --stat c469c7b5..1876c216`: wyłącznie `gra/src/main.ts` (32+/2-) i
`gra/tools/miasto-zdobycie-raport-test.cjs` (60+/2-). `git diff --stat origin/main...HEAD`
(cały temat): dodatkowo wyłącznie własne raporty w
`dyspozycje/autobot/runs/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1/`. Zero dotknięcia
`gra/src/game/capital-capture.ts` i `gra/src/ui/cityCaptureNotice.ts` — potwierdzone
brakiem tych ścieżek w obu diffach.

TESTY (uruchomione SAMODZIELNIE w tym worktree, nie przepisane z cudzych raportów):
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/` → 0 błędów.
- `node tools/miasto-zdobycie-raport-test.cjs` → 105 passed, 0 failed (sekcja 13,
  13a-13i, zgodne z raportem Operatora/Evaluatora: +42 drewna, +7 żelaza, kamień=0 bez
  wiersza, barbarzyńca widzi +13 gliny z kontrolą 13g złoto nadal zablokowane, floor
  3.9→+3, brak `surowce` w wejściu = brak wyjątku).
- `node tools/eliminacja-lup-kwoty-test.cjs` → 35 passed, 0 failed.
- `node tools/capital-capture-test.cjs` → CAPITAL-CAPTURE-TEST OK (86/86).
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
- Żywy zrzut przeglądarki: nie wykonano w tej rundzie (jak w raporcie Operatora) —
  dispatch dopuszcza alternatywę "istniejąca bramka renderująca ten popup", spełnioną
  przez sekcję 8/13 `miasto-zdobycie-raport-test.cjs` (dowód strukturalny renderu
  wierszy). Nie traktuję braku zrzutu jako blokującego w tej rundzie — to samo ustalił
  Evaluator, bez sprzeciwu.

WERYFIKACJA ZARZUTU 1 (SAMODZIELNA, niezależna od grepów Evaluatora/Obrony):

(a) Twierdzenie "żaden kod nie modyfikuje city.surowce na ścieżce podboju między zmianą
ownerId a odczytem w buildCityCaptureReportRows()" — ZWERYFIKOWANE WŁASNYM
grepem/Readem, NIEZALEŻNIE od cudzych ustaleń:
  - `grep -n "\.surowce\s*=[^=]" gra/src -r` (całe źródło, nie tylko main.ts) daje
    DOKŁADNIE 5 trafień w całym repo: `main.ts:9441`, `main.ts:18602`,
    `building-stock-cost.ts:207`, `building-stock-cost.ts:245`, `cities.ts:769`.
  - `main.ts:9441` (case `surowiec_ilosc`, transfer koszyka dyplomatycznego jednorazowego)
    i `main.ts:18602` (`applyCyclicDeliveryOutcome`, handel cykliczny) — obie leżą w
    PĘTLACH przetwarzania aktywnych transakcji dyplomatycznych/handlowych, wołanych z
    osobnych miejsc silnika (rozliczenie tur/koszyka), NIE z żadnego z 3 lejków
    podboju/kapitulacji. Evaluator/Obrona zgłosiły tylko `9441` — NIEZALEŻNIE znalazłem
    też `18602` (ten sam gatunek: handel cykliczny), co NIE zmienia wniosku: oba są
    poza ścieżką podboju.
  - `building-stock-cost.ts:207/245` to gałęzie `if (!c.surowce) c.surowce = {}` wewnątrz
    `deductBuildingStockCostAcrossCities`/`creditOwnerResourceStock` — INICJALIZUJĄ puste
    pole TYLKO gdy go brak, nie nadpisują istniejącej zawartości. Sprawdziłem WSZYSTKIE
    wywołania `creditOwnerResourceStock`/`deductBuildingStockCostAcrossCities` w repo
    (main.ts:3803/3833/25911/28802/29149/32446, turn-economy.ts, citizen-resource-
    upkeep.ts) — żadne nie leży na ścieżce między zmianą `city.ownerId` a wywołaniem
    `buildCityCaptureReportRows()`. Jedyne wywołanie w SĄSIEDZTWIE walki
    (`main.ts:25911`, łup bojowy z zabitych jednostek) wykonuje się PRZED
    `applyCityCaptureToMap`/zmianą ownerId (linia 25911 vs 25943) i filtruje miasta po
    `ownerId === winOid` W MOMENCIE wywołania — zdobywane miasto ma wtedy JESZCZE stare
    ownerId, więc nie może paść jako cel tego credita.
  - `cities.ts:769` to gałąź sanitizacji WCZYTANEGO zapisu (`if (!city.surowce)
    city.surowce = {}`), wołana przy deserializacji, nie w trakcie tury/podboju.
  - Sprawdziłem też funkcje faktycznie wołane między `city.ownerId = …` a każdym z 4
    wywołań `buildCityCaptureReportRows()` (dla wszystkich 3 lejków: kapitulacja głodowa
    main.ts:13451→13567; stolica/eliminacja i zwykłe miasto przez
    `applyCityCaptureAfterBattle`→`applyCityCaptureToMap`→26682/26740/27152):
    `applyPostCaptureLawOnCapture`, `clearCityStateFlagOnCapture`,
    `triggerRebelProtectionWarConsequence`, `maybeResolve{Bronze,Stone,Iron}
    ForcedWarOnCityCapture` (w tym `finalizePeaceTreatyBetween` wołane z nich —
    Read-em potwierdzone: zero dotknięcia `surowce`), `seedCityOwnerDefaults`,
    `applyLiveSafeRationForCity`, `syncCityGarnizon`, `endMapSiege`,
    `onCityCapturedReligion` (culture-religion.ts — brak `surowce` w tym pliku),
    `sanitizeBuildQueue`/`sanitizeProductionQueue`/`filterQueue` (operują na
    `cityProd`, nie na `city.surowce`), `applyBarbarianAwareCapitalCapturePlunder`
    (capital-capture.ts — `grep surowce` na ten plik: 0 trafień). ŻADNA z tych funkcji
    nie modyfikuje `city.surowce`.
  Wniosek (a): twierdzenie PRAWDZIWE, zweryfikowane niezależnie i szerzej niż grep
  Evaluatora/Obrony (znalazłem dodatkowe miejsce zapisu, 18602, które również leży poza
  ścieżką) — odczyt PO zmianie ownerId w tym konkretnym kodzie jest funkcjonalnie
  tożsamy z odczytem PRZED, na WSZYSTKICH 3 lejkach podboju, nie tylko na tych
  sprawdzonych przez Evaluatora.

(b) Nowy wiersz surowców faktycznie działa — potwierdzone URUCHOMIENIEM sekcji 13
`miasto-zdobycie-raport-test.cjs` (patrz TESTY wyżej): 105/105 PASS z konkretnymi
liczbami (+42 drewna, +7 żelaza, kamień=0 bez wiersza, +13 gliny dla barbarzyńcy,
floor 3.9→+3, kompatybilność wsteczna bez `surowce`).

(c) `git diff --stat` względem bazy `c469c7b5` — tylko allowlist (main.ts,
tools/miasto-zdobycie-raport-test.cjs, własne raporty), zero
capital-capture.ts/cityCaptureNotice.ts — potwierdzone (patrz ZMIANY/COMMIT wyżej).

(d) `tsc --noEmit` + wszystkie testy z raportów — uruchomione SAMODZIELNIE, wszystkie
zielone, liczby identyczne z raportami Operatora/Evaluatora (patrz TESTY wyżej).

WERDYKT ZARZUTU 1: ODDAL. Sam fakt kolejności (odczyt PO ownerId, nie PRZED) jest
prawdziwy i Obrona go nie kwestionuje (PRZYJMUJE stan faktyczny) — ale zarzut jako
zarzut O DEFEKCIE WYMAGAJĄCYM NAPRAWY został obalony dowodem: cel, dla którego dispatch
żądał "PRZED" (`żeby pokazać dokładnie to, co miasto miało w magazynie w momencie
zdobycia` — cytat z dispatchu), jest w pełni osiągnięty, bo NIC na żadnej z 3 ścieżek
wykonania nie modyfikuje `city.surowce` między zmianą ownerId a odczytem — potwierdzone
NIEZALEŻNYM, szerszym (całe `gra/src`, nie tylko main.ts) przeszukaniem niż to, które
wykonali Evaluator i Obrona, plus żywym dowodem testowym z konkretnymi liczbami. Zmiana
kolejności odczytu byłaby kosmetyczna, zero-wpływowa na wynik, a jej wymuszenie
(dociągnięcie osobnego snapshotu do sygnatury) zwiększyłoby powierzchnię zmiany bez
korzyści — zgodnie z oceną Evaluatora/Obrony, teraz potwierdzoną niezależnie.

BLOKADY: brak.

RUNDY: 1/5 (Final Control nie zwiększa licznika).

NASTĘPNY KROK: integracja allowlist-only przez orkiestratora → READY_FOR_DEPLOY (poza
zakresem tej roli).

WERDYKTY: 1 -> ODDAL
DEPLOY/PUSH: NIE WYKONANO
