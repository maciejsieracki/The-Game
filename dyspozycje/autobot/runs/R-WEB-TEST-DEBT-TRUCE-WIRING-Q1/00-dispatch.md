# R-WEB-TEST-DEBT-TRUCE-WIRING-Q1 — TRUCETEST (#166): test okablowania main.ts dla pokoju po rozejmie (dług z FC TRUCEPRICE/TRUCEPRICE2/3)
STATUS: DISPATCH | DOMAIN: GAME (testy; zero zmian gra/src) | tag TRUCETEST | priorytet 3 (dług testowy; slot dopełniony na polecenie właściciela 2026-11-26)
GOAL: istnieje test, który wykonuje lub wiąże ze źródłem main.ts wszystkie węzły ścieżki „koniec rozejmu → oferta pokoju z ceną”: truceEndPorts() (declareWarAfterTruce, enqueueOffer, finalizePeace), enqueueTruceEndOffer, truceEndWindowFor, settleTruceEndPrice, port transferBasketItems, okno propozycji gracza po rozejmie; każda mutacja węzła (usunięcie wywołania, zamiana strony płatnika, pominięcie przelewu, zła kolejność portów) daje test CZERWONY.
BAZA: args.cand = origin/main (pełny SHA)
