STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DISBAND-REFUND-RESOURCES-Q1
GOAL: Rozwiązanie jednostki gracza zwraca 100% surowców zużytych przy werbunku do puli państwa; pieniądz nie wraca; hint pokazuje zwrot.
ZMIANY/COMMIT: kod do integracji = 09cc7755f (nad b13db5c62 nad 8dbcd48f7 = origin/main). Ten raport w commicie nad nim.
  git diff --name-only 8dbcd48f7..09cc7755f: 01-operator-r1.md, building-stock-cost.ts, main.ts, disband-refund-resources-test.cjs. Wszystko w allowliście.
TESTY (samodzielnie, na 09cc7755f): tsc --noEmit EXIT 0; disband-refund-resources-test 45/0; logic-test 213/213; unit-stock-cost-test 58/0; manpower-test 71 OK/0 FAIL; recruitment-cost-50-wood-test 190/0; building-queue-refund-test 5/0; git diff --check czysto.
  NIE_ZMIERZONO: przeglądarka (hint na ekranie); pełne wykonanie disbandPlayerUnit (closure w boot()); roundtrip zapisu w runtime (save.ts trzyma units jako tablicę RuntimeUnit bez whitelisty pól, więc pole stockPaid przechodzi).
WERDYKT ZARZUTÓW:
 1 setup.ts poza allowlistą: ODDAL (naprawione obroną; setup.ts nie występuje w diffie, typ w stockPaidOf w building-stock-cost.ts).
 2 test głównie źródłowy: ODDAL (sekcja H: zachowanie disbandStockRefundCredit/hint: pula państwa, cap, pełny magazyn, brak śladu, brak złota). Luka wykonania closure: NIE_ZMIERZONO.
 3 cap obcina zwrot: ODDAL (zgodne z dispatchem pkt 2; hint pokazuje kwotę po obcięciu; zgłoszone tutaj).
 4 stockPaid dla AI: ODDAL (zapis owner-agnostic, brak skutku; zwrot tylko w disbandPlayerUnit).
 5 hint w mianowniku: ODDAL (konwencja `N Etykieta` jak main.ts ~4640/4766/37490); odmiana = kosmetyka do decyzji właściciela, nie blokuje.
 6 baza 8dbcd48f7 zamiast 1493bb5c9: ODDAL (przodek, integracja czysta).
BLOKADY: brak. Jednostki bez śladu (startowe, zdobyte, stare zapisy) nie zwracają surowców (założenie dispatchu pkt 4). Bankructwo/utrzymanie i disbandOwnerUnits bez zmian.
RUNDY: 3/5 (operator r1, obrona r1, FC)
NASTĘPNY KROK: integracja orkiestratora: git merge-base --is-ancestor 09cc7755f <SHA FC>; origin/main = 8dbcd48f7 (FF). Względem origin/rust-port/parity-v2 (43f4064b0): niezależne, zmiana tylko webowa (gra/), brak kolizji; dług Rust: REPIN zwrotu surowców po wdrożeniu.
DEPLOY/PUSH: NIE WYKONANO
