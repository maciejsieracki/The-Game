# FINAL CONTROL r2 -- R-WEB-BUILDING-DEMOLISH-Q1 (WYBURZ #175)
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-DEMOLISH-Q1
GOAL: wyburzanie budynku z panelu miasta za połowę surowców (w dół); Pieniądz i Praca nie wracają; Mennica wg reguł właściciela; AI bez zmian.
ZMIANY/COMMIT: kandydat 948a8aedf; `git merge-base --is-ancestor b8d28d17f 948a8aedf` = tak. `git diff --stat b8d28d17f 948a8aedf` = 7 plików, wszystkie w dyspozycje/autobot/runs/R-WEB-BUILDING-DEMOLISH-Q1/ (10-operator, 30-obrona, 4 zrzuty PNG, wyburz-live.json); 205 wstawień, 0 usunięć. Kod gra/ identyczny z bazą b8d28d17f (kod r1 3a00fd6ca). Allowlista zachowana.
TESTY (własne uruchomienie, npm ci --ignore-scripts, surowe wyjście): tsc exit 0; building-demolish 36 pass/0 fail; mint-orphan 28/0; mint-capital-only 8/0; logic 213/213; tech-tree 20/0; research 33/0 (ALL GREEN); unit-replace 21/21; combat 6/6; ai-test 297 passed/0 failed.
OCENA ZARZUTÓW:
1. Ekonomia Mennicy na żywo -- ODDAL (uwaga). turn-economy.ts l.2228 i l.2871 liczą bonus przez ownersWithMennica(cities, builtByCity) (l.298); wyburzenie usuwa wpis z builtByCity (live: mennicaRemoved=true, builtAfter=[palac]); mint-orphan 28/0 i mint-capital-only 8/0 pokrywają logikę. Końca tury w żywej grze nie zmierzono -- NIE ZMIERZONO, ryzyko niskie.
2. Brak okna potwierdzenia na zrzucie -- ODDAL (ograniczenie narzędzia): natywny window.confirm; treść w wyburz-live.json dialogsAll (4 dialogi z podglądem zwrotu, np. Koszary: drewno +80, kamien +80; Pałac: brak). Odrzucenie Pałacu: builtAfter=builtBefore (unchanged=true), akceptacja Koszar: skarbiec 500->500 (Pieniądz nie wraca), lista budynków -1.
3. Zwrot vs ustawienie kosztu wg epoki -- ODDAL (uwaga): paidStockCostForBuilding używa buildingStockCost(def) bez ustawień, tej samej funkcji co płatność za budowę; interakcja z ustawieniem kosztu wg epoki NIE ZMIERZONO.
Dowód live: 4 kroki w wyburz-live.json, errors=[], demolish_buttons 3 -> 2 po wyburzeniu Koszar.
BLOKADY: brak techniczne. Otwarte wg zadania: runda 3 -- ZAKAZ wyburzania podczas oblężenia (odp. 28a, #181); do czasu rundy 3 wyburzanie w oblężeniu NIE jest blokowane, więc deploy dopiero po rundzie 3.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (dokumentacja/zrzuty), potem runda 3 (blokada oblężenia + test), dopiero po niej deploy.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (a) przy rundzie 3 rozważyć pomiar ekonomii Mennicy po końcu tury w żywej grze; (b) zrzut 02 jest wizualnie równy 01 (bez okna) -- zamierzone.
