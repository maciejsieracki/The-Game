STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1
GOAL: „Koszty jednostek" (Niski ×1 / Normalny ×2 / Wysoki ×4) mnoży utrzymanie jednostek: Pieniądz, surowce i żywność; wartości kart = wartości silnika.
ZMIANY-COMMIT: kandydat 28f19d134 -> poprawki obrony, SHA w polu sha. Pliki: gra/src/game/economy-upkeep.ts (+unitPieniadzUpkeepCardValue, +unitResourceUpkeepCardAmount), gra/src/ui/unitInfoCard.ts, gra/src/ui/entityCards/unitAdapter.ts, gra/src/ui/cityPanel.ts (karta Utrzymania Pieniądza z silnika), gra/tools/unit-upkeep-cost-pace-test.cjs (+sekcje kart i skan okablowania). Logika silnika bez zmian.
TESTY: tsc --noEmit: 0 błędów. unit-upkeep-cost-pace-test: 81 ok / 0 FAIL (przed rundą obrony: 61 ok / 0 FAIL). Zielone (rc=0): logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat OK, ai-unit-replace-same-rules 45/0, ekonomia-5x-inwariant 280/0, unit-upkeep-era-scale 24/0, econ-era-rebalance 38/0, upkeep 91/0, upkeep-difficulty-per-owner 19/0, unit-resource-upkeep 7/0, glod-wojska-karencja 40/0, resource-gross-net-converter-inputs 18/0, citizen-resource-upkeep 124/0, unit-epoch-cost 57/0, entity-card-contract 75/0, entity-cards-resource-icons 26/0, entity-cards-yield-icons 27/0, unit-card-stats-engine-canon OK, unit-detail-card-entitycard-migration 40/0, recruitment-cost-50-wood 190/0, unit-card-3d-preview-coverage 18/0, ai-city-garrison-min-one 38/0.
CZERWONE NIE ZWIĄZANE Z ZMIANĄ (zweryfikowane na bazie 48b94c5 przez git archive, ten sam wynik): building-upkeep-resources-test 47/1 (D10: karta polskich etykiet), empire-food-b5-test 2 FAIL (Bronze/Iron auto ration clamp).
BLOKADY: (a) POMIAR smoke AI 90 tur seed 4242 PRZED/PO NIE ZMIERZONO. Powód: tools/ai-economy-measure-upkeep-onoff.cjs wymaga bundle i przebiegu w Chromium (ponad 200 s w rundzie 1; README: 6–50 s/turę), nie da się go zamknąć w foregroundowych wywołaniach po 590 s bez tła; wznowienie (kryterium c) jest czerwone. Do zrobienia w VERIFY-LIVE.
BLOKADY (b): piny istniejących testów NIE zmienione do Normalnego (patrz odpowiedź ODRZUCAM niżej).
RUNDY: 2/5
NASTĘPNY KROK: FC (zmienione 4 pliki produkcyjne + 1 test); pomiar w VERIFY-LIVE.
UWAGI-DLA-ORKIESTRATORA:
- Zmiana widoczna w grze także przy Niskim: karta „Utrzymanie Pieniądza/turę" pokazywała surową wartość units.json (np. Procarz 1), a silnik liczy tabela × epoka × R_STAWKI ×4 × tempo (Procarz Niski = 8). Karta pokazuje teraz liczbę silnika. Dispatch wymagał tej samej liczby co silnik, więc to zamierzone, ale zmienia liczby na kartach.
- Harness pomiaru: tryb startu w main.ts (ok. l.32327, 34331, 34525) ma na sztywno kosztJednostekPace: 'niski'. Pomiar „Normalny" tym harnessem zmierzy Niski, dopóki tego ustawienia nie zmienię lub nie podam parametru.
- Poza allowlistą (akceptacja FC): empire-food.ts, no-negative-stocks.ts, cityPanel.ts (karta Utrzymania Pieniądza i chipy surowców jednostek).
- Liczby z testu (silnik): Falanga Pieniądz Niski 32 / Normalny 64 / Wysoki 128; Procarz 8 / 16 / 32; Wojownik 4 / 8 / 16.
- Stare zapisy bez pola kosztJednostekPace = Niski (main.ts, ustawienie 'niski').
ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. PRZYJMUJĘ, poprawione. Karty Pieniądza (unitInfoCard, unitAdapter, cityPanel) i surowca (unitInfoCard, unitAdapter) biorą wartość z silnika (unitPieniadzUpkeepCardValue, unitResourceUpkeepCardAmount) z tempem. Test: karty = silnik dla Kamień/Brąz/Żelazo × 3 tempa.
2. PRZYJMUJĘ, NIE ZMIERZONO (patrz BLOKADY (a)).
3. CZĘŚCIOWO. Okablowanie: PRZYJMUJĘ, dodano skan źródeł (12 funkcji silnika w 7 plikach; każde wywołanie musi nieść tempo; test zielony, ponad 20 wywołań). Piny: ODRZUCAM zmianę na Normalny z dowodem: istniejące testy wołają funkcje bez parametru, czyli świadomie w ścieżce Niskiego (stare zapisy), i przechodzą z własnymi wartościami (unit-upkeep-era-scale 24/0, econ-era-rebalance 38/0, upkeep 91/0, glod 40/0, ekonomia-5x 280/0). Normalny pokrywa nowy test (81/0).
4. PRZYJMUJĘ jako notę, bez zmiany kodu. Poza allowlistą jest też cityPanel.ts (patrz UWAGI).
5. ODRZUCAM z dowodem: rejestracja resolvera jest w main.ts:14811 (setKosztJednostekPaceResolver przy starcie gry). Prognoza produkcji (turn-economy.ts, productionForecastOnly) wraca przed liczeniem utrzymania (return l.2906), więc brak tempa w prognozie nie zmienia liczb utrzymania.
DEPLOY/PUSH: NIE WYKONANO
