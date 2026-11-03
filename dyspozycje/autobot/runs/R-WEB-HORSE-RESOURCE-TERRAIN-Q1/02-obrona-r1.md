STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-HORSE-RESOURCE-TERRAIN-Q1
GOAL: Złoże konia nigdy na lesie przy generowaniu mapy; liczba koni zachowana; reszta mapy bez zmian.
ROLA: Operator (obrona), runda 1/5, odtworzono z 6743fd633.

ODPOWIEDZI NA ZARZUTY
1. Wyspy 4/8 ziaren: PRZYJMUJĘ CZĘŚCIOWO. Pełna generacja (rzeki włączone) trwa >9,7 min na mapę przy load ~6 na 4 rdzeniach (próba 4 ziaren wyspy przerwana timeoutem 585 s). Dodałem pomiar szybkim wariantem (rzeki off, jak w pangea-land-determinism-test), 12 map: ziemia/kontynenty/wyspy x ziarna 1,42,99,7777. Wynik (gate-hexes-diff-fast.txt): koni przed = po w 12/12, koni na lesie po = 0 w 12/12, różnice heksów tylko w polach zloze/nakladka/nakladki (diffOutsideZlozeNakladka=0 w 12/12). Łącznie wyspy zmierzone na 8 ziarnach (4 pełne z r1: 42,123,777,11 + 4 szybkie: 1,42,99,7777; ziarna pełne i szybkie to różne konfiguracje, nie ta sama mapa). Pełny wariant dla ziaren 7/2026/99/314 pozostaje NIE_ZMIERZONO.
2. Regresje: PRZYJMUJĘ. Uruchomiono: pangea-land-determinism-test: na bazie PASS, po poprawce FAIL (hashe `hexes` ziemia/kontynenty/wyspy zmienione celowo, bo hash obejmuje złoża). To realny brak Operatora r1. Poprawka: EXPECTED zaktualizowane (12 kluczy) z uzasadnieniem w komentarzu; po aktualizacji EXIT=0 (gate-pangea-determinism.txt). capital-sep-unit-test 44/0 EXIT=0. cluster-plan-name-test 2/4 fail IDENTYCZNIE na bazie 57a7ada40 (niezwiązane, gate-cluster-plan-name-base-identical.txt). map-gen-regression-test: NIE_ZMIERZONO, przekracza 580 s (sama standardowa generacja 231 s). capital-sep-pangea, cluster-start/spread: nie uruchomione (te same długie generacje); ryzyko niskie, bo teren/rzeki/pozycje startowe identyczne (20/20 pełnych + 12/12 szybkich).
3. Histogram Stadniny tylko syntetyczny: ODRZUCAM zarzut wady, PRZYJMUJĘ ograniczenie. Dispatch wymagał histogramu odmów; zmierzono przyczynę dominującą (552/552 odmów = koń pod lasem, 0 innych przyczyn w 936 przypadkach, w tym 0 odmów z własności heksa i kolizji, bo zbudowany stan nie ma obcych właścicieli). Inne cywilizacje/ery i kolizje z ulepszeniami są poza pomiarem; nie znaleziono błędu w improvement-build.ts. NIE_ZMIERZONO dla realnej rozgrywki; do Evaluatora/Final Control.
4. Łąka/trawa: ODRZUCAM jako wadę. Założenie jawne: generator stawia konia na Równinie (istniejąca reguła DEPOSIT_RULES.konie), trawa nie istnieje jako teren, łąka nie jest generatorem używana. Do akceptacji orkiestratora.
5. Zapisy z koniem pod lasem: ODRZUCAM (poza allowlistą, dispatch zakazuje usuwania złóż z zapisów). Rekomendacja bez zmian: osobny temat.
6. Raport ~700 słów: PRZYJMUJĘ, kosmetyczne. Ten raport jest zwięzły.

ZMIANY/COMMIT: gra/tools/pangea-land-determinism-test.cjs (EXPECTED 12 kluczy), logi gate-*.txt, ten raport. Kod źródłowy bez zmian względem 3aac69141. SHA w sekcji końcowej commita (git log -1).
TESTY: patrz wyżej. Skrypt pomiarowy diff.cjs w scratchpadzie (bundle przed/po przez no-op relocateForestHorses).
BLOKADY: NIE_ZMIERZONO: wyspy pełne 7/2026/99/314; map-gen-regression, capital-sep-pangea, cluster-start/spread; realny histogram Stadniny. Zapisy (osobny temat). Wpis LEDGER o repinie mapgen (krok relocate_forest_horses; zmiana hashów także w pangea-land-determinism-test).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator/Final Control; orkiestrator akceptuje założenie terenu i luki NIE_ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
