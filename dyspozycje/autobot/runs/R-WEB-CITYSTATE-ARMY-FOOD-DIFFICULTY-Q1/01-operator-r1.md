STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1
GOAL: Zużycie żywności armii i ułamek atrycji głodu liczone wg poziomu trudności WŁAŚCICIELA (miasto-państwo -> cityStateDifficulty, gracz/AI -> menu), jak utrzymanie w advanceCityEconomy (FALA 548).
ZMIANY/COMMIT: 04fc798fd (baza origin/main 8dad78b3a). Pliki: gra/src/game/turn-economy.ts, gra/src/main.ts, gra/tools/citystate-army-food-difficulty-test.cjs (nowy). Raport: 01-operator-r1.md (commit w tej gałęzi).
  Uwaga do allowlisty: empire-food.ts NIE został zmieniony. Wybrano resolver modułowy w turn-economy.ts (setArmyFoodUpkeepResolver), żeby nie wychodzić poza allowlistę.

POMIAR (przed poprawką, plik:linia):
| Miejsce | Parametr trudności | Dla miasta-państwa | Status |
| main.ts ~36916 advanceEmpireFood (tick) | loadUpkeepParams(_menuDifficulty) -> kosztArmii | menu (ROZBIEŻNOŚĆ) | NAPRAWIONE |
| main.ts ~36827 auto-wyżywienie kosztArmiiForOwner | upkeepParams (menu) | menu (ROZBIEŻNOŚĆ) | NAPRAWIONE (przez resolver) |
| main.ts ~20610 / ~20786 podgląd, owner 0 | upkeep gracza | gracz | bez zmian |
| main.ts ~36953 atrycja glod_wojska_hp_frac | efParams (menu) | menu (ROZBIEŻNOŚĆ) | NAPRAWIONE |
| econ-params: zywnosc_jednostka_ruch | easy 1 / normal 1 / hard 2 | efekt liczbowy: TAK | bez zmian (dane) |
| econ-params: zywnosc_jednostka_oboz | 0,38 / 0,5 / 0,62 | efekt liczbowy: TAK | bez zmian (dane) |
| econ-params: glod_wojska_hp_frac | 0,06 / 0,08 / 0,10 | efekt liczbowy: TAK | bez zmian (dane) |
| econ-params: glod_wojska_stat_mult, glod_wojska_karencja_tur | 0,75 / 3 we wszystkich poziomach | efekt = 0 (zgłoszone) | bez zmian |

ZMIANA: militaryFoodConsumptionWithSpichlerz używa upkeep właściciela, gdy zainstalowano resolver; bez resolvera zachowanie identyczne. main.ts ustawia resolver w boot() (cache po poziomie). Gracz i AI: wynik identyczny jak dotąd.

TESTY:
- tsc --noEmit: exit 0
- logic-test.cjs: 213/213
- ai-test.cjs: 289 passed, 0 failed
- upkeep-difficulty-per-owner-test.cjs (FALA 548 citystate-upkeep): 19 passed, 0 failed
- citystate-army-food-difficulty-test.cjs (nowy): 22 PASS / 0 FAIL (CS=hard vs menu=normal: CS płaci 2x ruch, obóz 0,62/0,5, gracz i AI bez zmian, advanceEmpireFood kosztArmii per owner, CS=menu bez efektu, hp_frac per poziom)
- army-hunger-combat-test 13/0; auto-wyzywienie-kosztarmii-kryterium-test 18/0; empire-food-b5-test 34/0
- glod-wojska-karencja-test.cjs: 29 PASS / 10 FAIL. Dług PRZED tą zmianą (nie wynika z niej): test oczekuje mnożnika x1, a R_STAWKI_FALA1_FALA2_MULT (x4, src/game/r-stawki-strojenie.ts) jest już w kodzie. Ścieżka bez resolvera jest identyczna z dotychczasową. Nie naprawiano (poza tematem).
- Nie uruchamiano: npm run build/dev (zakaz). Brak testu wizualnego (zmiana liczbowa, bez UI).

BLOKADY:
- Pozostałe rozbieżności (poza allowlistą, do decyzji): UI karty jednostki (main.ts ~6625 glodWojskaHpFrac), panel oblężenia (~33215), podpowiedź (~16731) i ~37160 nadal czytają ułamek z trudności MENU. Dla miast-państw różni się tylko wyświetlany procent; liczby atrycji liczone wg właściciela.
- Racje ludności miast-państw (buildRationParams w efParams.rationParams) nadal wg menu. To nie jest żywność armii, więc nie ruszano.
- Decyzja balansowa (nie zgadywano): czy ułamek atrycji w UI ma być wg właściciela. Wymaga decyzji właściciela (ABC), jeśli orkiestrator chce to domknąć.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) i Final Control: sprawdzić allowlistę (turn-economy.ts jest na liście, empire-food.ts nie jest), diff 04fc798fd, testy jw.
DEPLOY/PUSH: NIE WYKONANO
