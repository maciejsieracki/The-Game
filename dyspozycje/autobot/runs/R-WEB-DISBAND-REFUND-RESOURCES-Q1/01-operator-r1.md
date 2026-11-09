STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DISBAND-REFUND-RESOURCES-Q1
GOAL: Przy rozwiązaniu jednostki gracza (disbandPlayerUnit) wraca 100% surowców zużytych przy werbunku do puli państwa; pieniądz nie wraca; hint pokazuje zwrot surowców.
BAZA: origin/main = 8dbcd48f7 (FALA 567). Dispatch wskazywał 1493bb5c9 (FALA 566); main przesunął się o FALĘ 567, worktree zaczęty od aktualnego origin/main (HEAD = origin/main przed zmianą).

## 1. Diagnoza

- Skąd werbunek zdejmuje surowiec: pula PAŃSTWA (ownerResourceStockAll, suma po miastach ownera), pobór przez deductBuildingStockCostAcrossCities. Koszt = unitStockCost(units.json) (`Surowiec` / `Surowiec (ilość)`, +25 Koni dla Mount oprócz Rydwan (woły)). Ścieżki: purchaseRecruitmentUnit (gra/src/main.ts ~4624-4690, ~4736+) i zakup wsadowy (~4754-4792). Ta sama ścieżka dla AI (ownerId != 0).
- Ślad zużycia: brak dotąd. Dodano pole `stockPaid` na RuntimeUnit (gra/src/units/setup.ts), ustawiane w chwili ukończenia rekrutacji (main.ts ~38380, `unitStockCost(def)`, tylko gdy niepuste). Ta sama funkcja i te same dane co przy poborze, więc wartości są identyczne.
- Inne ścieżki rozwiązania (NIE zmieniano):
  - disbandOwnerUnits (main.ts ~33966, upadek stolicy / AI) — brak zwrotu, zgodnie z dispatchem.
  - „Zastąp” — mutuje typeId w miejscu (main.ts ~7801), koszt tylko w Pieniądzu. stockPaid zostaje z oryginalnej rekrutacji, więc rozwiązanie zwraca surowiec zapłacony za tę jednostkę przy werbunku. Mechanizm Zastąp nie zmieniony.
  - Zwolnienie jednostki z powodu bankructwa / utrzymania: NIE_ZMIERZONO — w tej analizie nie zlokalizowano osobnej ścieżki poza disbandPlayerUnit (wywołania ~24621/24633) i disbandOwnerUnits. Nie zmieniano; do weryfikacji w osobnym tematu.

## 2. Implementacja (ZMIANY-COMMIT)

- gra/src/game/building-stock-cost.ts: nowa czysta funkcja `disbandStockRefund(stockPaid)` — zwraca kopię wpisów dodatnich i skończonych; undefined/null/{} -> {}.
- gra/src/units/setup.ts: pole `stockPaid?: Record<string, number>` w RuntimeUnit (komentarz PL/EN). Zapisy są całymi obiektami jednostek, więc pole przeżywa save/load; stare zapisy nie mają pola -> brak zwrotu.
- gra/src/main.ts:
  - import disbandStockRefund;
  - recruit completion: `stockPaid: unitStockCost(def)` (gdy niepuste);
  - disbandPlayerUnit: po zwrocie Manpower, `creditOwnerResourceStock(cities, 0, key, amt, cap)` dla każdego wpisu z `disbandStockRefund(u.stockPaid)`, cap = `ownerResourceCap(cities, cityBuilt, 0, data, _menuDifficulty, ep)` (ten sam cap co produkcja; zwrot ponad cap przepada, jak przy produkcji — dispatch: clamp, zgłoszone);
  - hint: `… (miasto) · zwrot surowców: +2 Drewno, +1 Koń` — tylko surowce faktycznie dopisane (credited), etykiety z stockResourceLabel.
- gra/tools/disband-refund-resources-test.cjs (nowy): 26 asercji.
- Pieniądz: disbandPlayerUnit nie wywołuje setOwnerTreasury (sprawdzane przez test źródła).

Commit: patrz sekcja DEPLOY-PUSH / SHA poniżej.

## 3. Decyzje założeniowe (luki rozstrzygnięte założeniem)

- Brak śladu (stockPaid) = zero zwrotu. Dotyczy: jednostek startowych, zdobytych w bitwie, przekazanych dyplomacją, barbarzyńców, starych zapisów. Dzięki temu nie ma zwrotu „za darmo” (dispatch pkt 4).
- Cap magazynu stosowany (dispatch pkt 2: „clamp, jeśli istnieje”). Ścieżka anulowania rekrutacji (cancelRecruitmentPurchase) celowo bez capu — NIE ruszano jej.
- Hint: nominatyw z STOCK_RESOURCE_LABEL („+2 Drewno”), ta sama konwencja co istniejący komunikat „Brakuje w magazynie: N Etykieta”. Odmiana dopełniaczowa („+2 drewna”, „+1 konia”) jest zawodna dla liczebników (koń: 1 koń / 2-4 konie / 5 koni), więc nie wprowadzano tabeli odmian. Do decyzji właściciela, jeśli ma być dopełniacz.
- Batch rozwiązania (disbandSelectedOrPickedUnits) nadal pokazuje swój komunikat zbiorczy, bez sumy surowców; hint z ostatniej jednostki nadpisuje poprzednie. Nie zmieniano.

## 4. TESTY (dokładne wyniki, uruchomione w worktree)

- `npx tsc --noEmit -p gra` -> EXIT 0 (bez błędów).
- `node gra/tools/disband-refund-resources-test.cjs` -> 26 passed, 0 failed (drewno Wojownik, brąz Włócznik, koń Mount; round-trip deduct->refund przywraca pulę dokładnie; Osadnik bez surowca -> {}; brak śladu -> {}; filtr wpisów; brak setOwnerTreasury w disbandPlayerUnit; hint „zwrot surowców” i stockResourceLabel; zachowany refundManpowerToEmpire; cancelRecruitmentPurchase bez zmian).
- `node gra/tools/logic-test.cjs` -> LOGIC OK (213/213).
- `node gra/tools/unit-stock-cost-test.cjs` -> 58 passed, 0 failed.
- `node gra/tools/manpower-test.cjs` -> 71 OK, 0 FAIL (regresja refundManpowerToEmpire).
- `node gra/tools/recruitment-cost-50-wood-test.cjs` -> 190 passed, 0 failed.
- `node gra/tools/building-queue-refund-test.cjs` -> 5 passed, 0 failed.
- `git diff --check` -> czysto.
- NIE_ZMIERZONO: weryfikacja w przeglądarce (realna rozgrywka, odczyt hintu na ekranie) — nie wykonano; zmiana nie jest wizualna poza tekstem hintu. Nie uruchamiano pozostałych testów rekrutacji (empire-mass-recruitment, recruit-*-real-render itp.).
- Instalacja: `npm ci` w gra/ worktree (node_modules 134 MB, poza repo / ignorowane).

## 5. BLOKADY

- Brak śladu stockPaid dla jednostek sprzed tej zmiany: w starych zapisach jednostki rekrutowane przed tą zmianą nie zwrócą surowca przy rozwiązaniu (świadome; zero „darmowego” zwrotu).
- Ścieżka rozwiązania z bankructwa/utrzymania: NIE_ZMIERZONO (patrz pkt 1).

## 6. RUNDY

1/5

## 7. NASTĘPNY KROK

Evaluator (Sonnet) — weryfikacja diff vs allowlista, testy z pkt 4; Final Control po PASS. Po FC: integracja orkiestratora (sprawdzić `git merge-base --is-ancestor <SHA operatora> <SHA FC>`).

## 8. DEPLOY/PUSH

NIE WYKONANO
