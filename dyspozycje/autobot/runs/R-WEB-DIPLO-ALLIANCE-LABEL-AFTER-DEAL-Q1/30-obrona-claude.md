# R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1 — obrona Operatora (runda 2, Haiku 5.5)
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-LABEL-AFTER-DEAL-Q1 (tag ALLYCLEAN, odp. 7A)
GOAL: po usunięciu umowy sojuszu relacja pary przestaje być „sojusz”; nie psuć etykiety sojuszu, którą utrzymuje umowa lub stały status same-civ major AI ↔ MP.
BAZA: aab11df4a (kandydat) → poprawki w commicie 93d6f9d71 (detached HEAD, bez pusha na main).
ZMIANY/COMMIT: 93d6f9d71; pliki: gra/src/game/diplomacy-treaties.ts, gra/src/main.ts, gra/tools/alliance-label-clean-test.cjs (+ ten raport). Bez git add -A.

## Odpowiedzi na zarzuty Evaluatora
1. PRZYJMUJĘ (regres same-civ). Potwierdzone w kodzie: pary major AI ↔ same-civ MP mają status „sojusz” bez umowy (startRelationForAiMajorSameCivCityState, maintainAiMajorSameCivRelation), a reconcile ustawiał je na „pokoj”. Poprawka: isStaleAllianceStatus dostał parametr `exempt` (domyślnie false); reconcileAllianceStatusAfterDeals wyklucza pary, dla których isAiMajorToSameCivCityStatePair(a,b,pairOpts) === true. Test H: isStaleAllianceStatus([], 1, 2, 'sojusz', true) === false. Test I: exempt para nie jest resetowana.
2. PRZYJMUJĘ (test tylko tekstowy dla main.ts). Logika wyboru par przeniesiona do czystej funkcji alliancePairsToReset(state, owners, getStatus, isExempt) w diplomacy-treaties.ts; main.ts tylko stosuje wynik. Testy I–J wykonują tę funkcję na danych (wiele par, kolejność owners, wojna, aktywna umowa). Test G sprawdza tekstem, że reconcile wywołuje alliancePairsToReset z wyłączeniem same-civ. Mutacja ciała reconcile na `return;` jest zabita (G: FAIL=1). Pozostała luka: main.ts nie jest ładowalny w node (harness Chromium pada, #90), więc zachowanie wywołania w main.ts sprawdza tylko test tekstowy.
3. ODRZUCAM z dowodem (częściowo): w tym środowisku gra/node_modules nie istniało przed rundą. Po `npm ci --ignore-scripts` (71 pakietów): `npx tsc --noEmit -p tsconfig.json` → exit 0, wyjście puste (0 błędów). Zgodne z zarzutem Evaluatora (0 błędów); raport pierwszej rundy o 177 błędach nie został potwierdzony w tym stanie node_modules.
4. PRZYJMUJĘ jako korektę opisu (bez zmiany kodu). Wywołania reconcile po trybucie i wasalizacji nie usuwają sojuszu (usuwają tylko umowę trybutu/wasala); są tam jako zabezpieczenie. Pokrycie ścieżek usunięcia sojuszu: wygaśnięcie, odmowa wezwania, odmowa obrony sojusznika. Wojna nadpisuje status na „wojna” (reconcile tego nie rusza).
5. PRZYJMUJĘ (zachowanie zaakceptowane). Stare zapisy ze statusem „sojusz” bez umowy (poza parami same-civ, które są teraz wyłączone) zostaną wyczyszczone przy najbliższym wywołaniu reconcile. Nie dodano migracji przy wczytaniu.

## Pomiar (dispatch)
Liczba sojuszy AI przed/po: NIE ZMIERZONO. Powód: runner limits-measure / diplomacy-harder-measure wymaga Chromium (w tej sesji znany crash, #90); nie uruchamiano. Próg DECISION_REQUIRED (>30% spadku) nie został sprawdzony.

## TESTY
- tsc (gra/): `npx tsc --noEmit -p tsconfig.json` → exit 0, wyjście puste (0 błędów), po edycji main.ts i diplomacy-treaties.ts.
- alliance-label-clean-test.cjs: PASS=26 FAIL=0 (było 18 w rundzie 1).
- Mutacje (każda przywrócona do HEAD):
  - usunięcie `if (exempt) return false;` w isStaleAllianceStatus → FAIL=2 (H, I).
  - warunek exempt w main.ts zastąpiony przez `() => false` → FAIL=1 (G).
  - ciało reconcileAllianceStatusAfterDeals → `return;` → FAIL=1 (G).
- Testy starych kontraktów (alliance-*, ai-ai-alliance-*, diplo-*, limits-measure, alliance-limit-ai-t66) NIE URUCHAMIANE w tej rundzie. Nie zmieniano żadnej istniejącej asercji.

## BLOKADY
- Brak pomiaru liczby sojuszy AI (Chromium).
- Brak uruchomienia testów sojuszy/dyplomacji poza nowym testem.

## RUNDY
2/5 (runda obrony 1 — poprawki po zarzutach Evaluatora).

## NASTĘPNY KROK
Evaluator: ponowna weryfikacja 93d6f9d71 (alliance-label-clean-test, tsc, wybrane testy sojuszy) → Final Control.

## UWAGI-DLA-ORKIESTRATORA
- gra/node_modules zainstalowane na czas bramek; do usunięcia po bramkach (dysk był 4,1 GB wolne przed instalacją).
- Znaleziska poza zakresem: brak.

DEPLOY/PUSH: NIE WYKONANO
