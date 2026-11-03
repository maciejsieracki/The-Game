STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOCLEAR-RIVER-FOREST-PRIORITY-Q2
ROLA: Operator (obrona) r1; baza commit Operatora 5aaa14883

Zarzut 1 (test e nierealistyczny, ON: wycinka rzeczna bez farmy): PRZYJMUJE ZASTRZEZENIE, ODRZUCAM POPRAWKE KODU.
 - Zmierzone w tescie (e2): ON 3/3 wycinki rzeczne, 0 farm w 12 turach; OFF 3/3 farm.
 - Proba poprawki (wyjatek `farma` na heksie rzeki bez lasu, Zywnosc): e2 GREEN, ale lamie 3 testy regresji poza allowlista:
   autoclear-priority-q1 (2 FAIL), autoimprove-stages-q1 (4 FAIL), ai-food-improvement-priority-stages (EXIT=1). Logi: attempt-farmexc-*.
   Kod produkcyjny cofniety do 5aaa14883 (bez zmian). Ograniczenie opisane testem (e2) jako pin + DECYZJA_WYMAGANA.
Zarzut 2 (koszt zbiorczy): ZMIERZONE (test g, 12 tur): ON wycinek 13 (3 rzeczne), farm 4; OFF wycinek 46, farm 91. kosztWyrab (log pickera) = 2.5 Pracy/heks.
Zarzut 3 (etykieta): ZMIERZONE (test f): decyzje scope=las verdict=wybrany reason "E2 wycinka (rzeka+las) spelnia bramki", detail.naRzece=true, przy ON i OFF. W UI: NIE_ZMIERZONO.
Zmiany: tylko gra/tools/autoclear-river-forest-priority-test.cjs (e/e2/f/g). Test: 19 OK / 0 FAIL, EXIT=0.
Bramki PO (gate-R2-*): 14 testow EXIT=0, tsc EXIT=0.
DECYZJA_WYMAGANA (orkiestrator): (1) farma bez obywatela na wycietym heksie rzeki przy ON wymaga zmiany filtra + testow poza allowlista; (2) K2.
