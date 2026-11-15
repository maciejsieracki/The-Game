STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: partia 2 z 4 (zuzycie + handel w ksiedze "Skad zapasy"); kryteria DODATEK 1 pkt 1-4
ZMIANY/COMMIT: oceniany kandydat a8aa4c3fc (potomek ad10b891b/060e0be6b; merge-base z origin/main = 3d1670626; origin/main ff090714d NIE scalony). Diff vs 3d1670626: 12 plikow (resource-ledger.ts, turn-economy.ts, building-stock-cost.ts, main.ts +26/-9, cityPanel.ts, econ-params.json, 2 testy, raporty). Allowlista OK. Ten raport: jedyny dodany plik.
TESTY (surowe, kandydat a8aa4c3fc): tsc --noEmit EXIT 0; resource-ledger-test 1030/0; resource-ledger-consume-test 30/0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; git diff --check 3d1670626..a8aa4c3fc czysty. Czerwone: building-upkeep-resources-test 47/1, citizen-resource-upkeep-test 122/2 -- IDENTYCZNIE na bazie 3d1670626 (dlug bazowy, nie regresja). Chromium: NIE DOTYCZY (brak UI w tej partii). Hash/perf: NIE ZMIERZONO (partia 4).
ROZSTRZYGNIECIE ZARZUTOW:
1 NAPRAW: brak "Umowa wymiany z <civ>" i "Warzelnia (<miasto>)" (kryterium (b), DODATEK pkt 2); handel poza ksiega.
2 NAPRAW: test zgodnosci nie przechodzi realnej sciezki gry (DODATEK pkt 3 wymaga realnej sciezki, nie fixture); test (7) to tylko strazmik tekstowy wpiecia.
3 NAPRAW: poza ksiega zostaja handel, reconcileOwnerResourceCaps/Mennica (partia 2) oraz lup, prezent, zdobycie/oddanie miasta (partia 3); zmiana magazynu != suma ksiegi dla "wszystkich 9 surowcow" (pkt 1). Okno pending nie jest w zapisie gry (znana luka, partia 3).
4 NAPRAW (czesciowo): perf poza zakresem (partia 4), ale DODATEK pkt 3 wymaga hasha "z ksiega i bez" juz w partii 2.
5 ODDAL jako ZALOZENIE przyjete: nadwyzka ponad koszty trafia do ostatniej czesci; wymaga jednej linii w dokumentacji, nie blokuje.
6 ODDAL: dispatch wymaga nazw budynku/miasta tylko dla produkcji.
7 ODDAL: bialy znak naprawiony w a8aa4c3fc (diff --check czysty); slad r1 jest w historii git.
8 ODDAL: dlug bazowy zweryfikowany samodzielnie (47/1 i 122/2 na 3d1670626 i na kandydacie).
DO DECYZJI CZLOWIEKA: main.ts ~40152 (E3c, "PYTANIE 53=B, 2026-07-25") fizycznie przesuwa braz/zelazo/cegle szlakiem handlowym, a decyzja #311 (2026-11-14) mowi "szlak tylko premia, bez przesuwania zapasow", DODATEK: szlak NIE jest zrodlem. Kod obecny zmienia magazyn poza ksiega -> rozjazd ksiegi gwarantowany do czasu decyzji: (A) usunac E3c zgodnie z #311 (zmiana regul gry, osobny temat), (B) ksiegowac przeplyw szlaku wbrew DODATKOWI. Orkiestrator: pytanie ABC do wlasciciela.
Co dobre w kandydacie (do zachowania): helper ze zwracanym `taken`, alokacja allocateTakenToLedgerParts, okno pending dla budowy/rekrutacji, brak wplywu na wynik gry w ocenionych sciezkach, testy zielone.
BLOKADY: zarzuty 1-4 (zakres partii 2 niedomkniety); decyzja szlaku E3c vs #311.
RUNDY: FC runda 2 -> kandydat partii 2 FAIL; potrzebna runda 3 tego samego ID (partia 2b) po decyzji ABC o szlaku, na bazie a8aa4c3fc + merge origin/main ff090714d; w allowliscie dwa testy tekstowe main.ts (building-upkeep-resources, citizen-resource-upkeep) jesli zmieniane wywolania.
NASTEPNY KROK: ABC szlak -> runda 3: handel (Umowa wymiany, Warzelnia), reconcile caps/Mennica w ksiedze, test zgodnosci w realnej sciezce >=3 ziarna x 30 tur z mutacja i hashem z/bez ksiegi, potem partie 3-4.
UWAGI-DLA-ORKIESTRATORA: baza w dispatchu 060e0be6b vs faktyczny merge-base 3d1670626 vs origin/main ff090714d -- rozbieznosc; nie integrowac a8aa4c3fc (FAIL). npm ci w gra/ worktree FC do sprzatniecia.
DEPLOY/PUSH: NIE WYKONANO
