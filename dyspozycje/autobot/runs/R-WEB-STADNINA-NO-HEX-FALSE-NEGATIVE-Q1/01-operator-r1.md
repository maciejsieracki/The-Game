STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-STADNINA-NO-HEX-FALSE-NEGATIVE-Q1
GOAL: Stadnina nie zgłasza fałszywego „Brak heksów w twoim terytorium" gdy złoże konia leży w terytorium gracza; komunikat odmowy mówi prawdziwy powód.

## Przyczyna (dowód)
`createImprovementBuildApi` (gra/src/map/improvement-build.ts, `candidateHexKeys`, dawniej ~:1438) budował zbiór kandydatów WYŁĄCZNIE z `state.cityNodes` (zasięg miasta +1). Od R-WEB-OUTPOST-FORT-TERRITORY-Q1 (2026-10-31) posterunek (r=3)/fort (r=5) tworzą twarde terytorium w `state.territoryNodes` (main.ts:4994 `buildAllTerritoryNodes`; main.ts:14513 `playerCityNodes` = tylko miasta). Złoże konia w terytorium posterunku/fortu poza pierścieniem miast nie było kandydatem, choć `inPlayerTerritory()` je akceptowało -> `getQualifyingHexes('stadnina')=[]` -> dawne :1489 „Brak heksów w twoim terytorium". Dotyczy każdego ulepszenia; najczęściej widoczne przy złożach.

## Warunki odrzucenia stadniny (qualifies, improvement-build.ts)
1. brak heksu w mapie; 2. `existing.includes('stadnina')` (już zbudowana/w kolejce); 3. poza terytorium gracza (`inPlayerTerritory`); 4. teren bazowy != Łąka/Równina (`case 'stadnina'`); 5. `isLivestockAllowed` (dla 'kon' zawsze true); 6. `isLivestockUnlockedForPlacement` (livestock-unlock.ts: złoże na heksie LUB trasa handlowa LUB magazyn >= 50); 7. heks poza `candidateHexKeys` — TO zadziałało w zgłoszonej sytuacji. Tech sprawdzany w listTypes przed hintem (bez zmian). Mgła: qualifies jej nie sprawdza (wpływ NIE_ZMIERZONO).

Założenia: (a) `hex.nakladka` jest jednowartościowe — złoże konia i Las wykluczają się w danych (gen-helpers.ts:12153: ZlozeKonia tylko na Równinie); „koń pod lasem" nie występuje, reguła Las/stadnina bez zmian. (b) Koń na Wzgórzach nie powstaje z generatora; reguł terenu NIE zmieniam (zakaz zmian reguł), zamiast tego komunikat „wymaga łąki lub równiny". (c) Fort/posterunek gracza = jego terytorium, tak jak miasto.

## Zmiany
- gra/src/map/improvement-build.ts: wyeksportowane `buildCandidateHexKeys(state, margin)` (miasta + węzły terytorium NALEŻĄCE do gracza), nowe `getStadninaBuildBlockReason` (brak miasta / złoże poza terytorium / wszystkie złoża już ze stadniną / zły teren / „Wymagane złoże konia na twoim terytorium (albo 50 koni…, masz N)"), podpięte w listTypes dla `stadnina`. Koszt, tech, produkcja, reguły Lasu bez zmian. Wspólny predykat `qualifies` zachowany (AI/auto-improvements go używają bez zmian). Uwaga dla orkiestratora: skan kandydatów AI (ai.ts:~2589) jest per-miasto i nie obejmuje terytorium fortów — poza allowlistą predykatu, NIE zmieniony.
- NOWY gra/tools/stadnina-hex-candidates-test.cjs (bundle w /dev/shm, mutacja przez plugin esbuild).

## Testy
- stadnina-hex-candidates-test: pass=15 fail=0 EXIT=0. Mutacja (usunięcie filtra węzłów terytorium) -> koń w terytorium posterunku NIE jest kandydatem i panel jest zablokowany (objaw ze zgłoszenia). RED na czystym origin/main: TypeError (brak eksportu); behawioralny RED daje mutacja.
- tsc --noEmit: EXIT=0.
- Regresje PO (EXIT=0): stadnina-las, stadnina-kon-koszt, hex-tooltip-stadnina-kopalnia-cyny, map-improvement-qualify, improvement-territory-gate, oboz-lowiecki-wymaga-tartaku, hodowla-las, food-hodowla, auto-improvements, ai-improvements, pending-improvements, improvement-adapter-resource-note, auto-fort-claim.
- PRZED=PO identyczne (preegzystujące): oboz-lowiecki-las-test 19 FAIL (EXIT=1), deposit-building-gate-test 1 FAIL (EXIT=1).
- Pomiar w żywej grze (Chromium): NIE_ZMIERZONO — wymaga vite build (zakaz `npm run build`), a hooki testowe nie nadają terytorium posterunku; pomiar wykonano realnymi funkcjami gry (createImprovementBuildApi.listTypes/getQualifyingHexes) w teście.

BLOKADY: brak (poza NIE_ZMIERZONO Chromium)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
