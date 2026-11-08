STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-STADNINA-KONIE-STARE-ZAPISY-Q1
GOAL: W starych zapisach heks z `zloze==='konie'` (koń pod lasem) ma być złożem konia dla Stadniny, bez migracji danych i bez zmian generatora.

ZMIANY/COMMIT: SHA w sekcji "COMMIT" na końcu (commit na bazie origin/main 2d9b6aac8, bez push).
Pliki (gra/):
- src/game/terrain-improvements.ts -- NOWY jedyny predykat `hexHasHorseDeposit({nakladka, zloze})`: `ZlozeKonia` LUB `zloze.trim().toLowerCase()==='konie'`; `improvementHidesDepositOnHex('stadnina')` używa go.
- src/game/livestock-unlock.ts -- predykat przeniesiony do terrain-improvements (cykl importów: livestock-unlock już importuje terrain-improvements), re-eksport pod starą nazwą; typy `hex` w `improvementMatchesLivestockDeposit` / `isLivestockUnlockedForPlacement` rozszerzone o `zloze?`.
- src/map/improvement-build.ts:803 (`depositAllowsPlayerImprovement`, case stadnina) -> predykat. Linia ~1488 (`getStadninaBuildBlockReason`) i kwalifikator (via `isLivestockUnlockedForPlacement`) już go wołały.
- src/ui/hexContextTooltip.ts:469 -> predykat (zgłoszone: plik używa predykatu).
- src/main.ts:15212 (koszt 50 koni "stadnina poza złożem") -> predykat; inaczej stary zapis płaciłby 50 koni mimo złoża.
- tools/hex-tooltip-stadnina-kopalnia-cyny-test.cjs -- aktualizacja regex-pin (stała `STADNINA_NARROW_LINE`) na nową literalną linię; uzasadnienie: semantyka nowych map bez zmian, linia przepisana na wspólny predykat.
- tools/stadnina-konie-stare-zapisy-test.cjs -- NOWY test.
Nie ruszono: gen-helpers.ts, ai.ts, battle/**, gra-robocza/**, WERSJE.md, rust-port/**, src-tauri/**, wymagań lasu/tartaku. cityPanel.ts / city-hex-clear.ts / terrain-improvements `isKeptDeposit` nie sprawdzają złoża konia po `zloze` (nie dotyczą). main.ts:15621 (podgląd demo, "nie dotyczy zwykłej gry") celowo pominięty.

ZMIERZ PRZED (plik:linia, baseline 2d9b6aac8): improvement-build.ts:803 i terrain-improvements.ts:409 (`nakladka===ZlozeKonia`), livestock-unlock.ts:68 (`hexHasHorseDeposit`, nakladka only; używany w :78, :170 i improvement-build.ts:1488), hexContextTooltip.ts:469, main.ts:15212. Wszystkie tylko po nakładce.

TESTY:
- RED (baseline src, STADNINA_SRC): gate-red-przed.txt -- 7 OK / 20 FAIL; kluczowe: stary zapis (Las+zloze konie) NIE jest kandydatem Stadniny, `isLivestockUnlockedForPlacement` odrzuca, ikona złoża nieukrywana. UWAGA: w sekcji (A) na baseline predykat nie jest eksportowany z terrain-improvements, więc te FAIL to częściowo artefakt eksportu; właściwy RED to sekcje (B)(C).
- GREEN (po): gate-green-po.txt -- 29 OK / 0 FAIL (stary zapis, nowa mapa, brak złoża, wielkość liter/spacje " Konie "/"KONIE", las bez złoża, inne złoże, "kon", Wzgórza, magazyn 50, mutacja czerwieni).
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- REGRESJE PO == PRZED: stadnina-hex-candidates 15/0; stadnina-kon-koszt, stadnina-las, map-improvement-qualify, improvement-territory-gate, improvement-adapter-resource-note, oboz-lowiecki-wymaga-tartaku, pending-improvements, improvement-era-scaling (144/0), auto-improvements, ai-improvements -- EXIT=0; hex-tooltip-stadnina-kopalnia-cyny EXIT=0 po aktualizacji pinu (przed aktualizacją FAIL tylko pin); horse-resource-terrain (--types=kontynenty --seeds=42): 9 OK/0 FAIL.
- oboz-lowiecki-las-test: 72 OK / 19 FAIL, ZEROWA różnica vs baseline (identyczny zbiór FAIL, diff pusty) -- błąd poprzedzający (poza zakresem).
- NIE_ZMIERZONO: testy live w Chromium (stadnina-kon-koszt-live, oboz-lowiecki-las-znika-render, improvement-build-highlight-live); pełna macierz horse-resource-terrain (8 ziaren x 3 typy); tooltip na runtime dla starego zapisu (tylko regex-pin + wspólny predykat).

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (uruchomić nowy test + mutację, ocenić pominięcie main.ts:15621 i NIE_ZMIERZONO live).
DEPLOY/PUSH: NIE WYKONANO

COMMIT: fde1050fa (kod+test+raport; ten wiersz dopisany w kolejnym commicie raportu)
