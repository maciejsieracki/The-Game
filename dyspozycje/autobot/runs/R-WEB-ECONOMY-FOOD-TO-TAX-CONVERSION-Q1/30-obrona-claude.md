STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-FOOD-TO-TAX-CONVERSION-Q1
GOAL: Reczna, jednorazowa zamiana Żywności z zapasu imperium na Podatek, analogicznie do zamiany Pracy na Podatek (wymaga Targowiska, nie uruchamia się automatycznie, nie schodzi poniżej 0). Obrona po FAIL Evaluatora (6 zarzutów).
ZMIANY-COMMIT: baza f6b87fc5b (kandydat). Poprawki w allowliście: gra/src/game/empire-food.ts (createFoodTaxIo, resolveFoodTaxRate, FoodTaxIo; convertFoodReserveToTax zachowuje ułamek zapasu), gra/src/main.ts (hook onConvertOwnerFoodToTax deleguje do createFoodTaxIo/resolveFoodTaxRate zamiast inline; klamra zapasu przeniesiona do testowanego adaptera), gra/src/ui/empireDetailPanel.ts (limit i kurs czytane na żywo; po zamianie odświeżenie zapasu w panelu), gra/tools/food-to-tax-conversion-test.cjs (przepisany: mutacje = proces potomny tego samego testu).
ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ. Dowód z żywego Chromium NIE wykonany w tej rundzie: gra nie ma hooka __civTest do ustawienia zapasu Żywności imperium ani do otwarcia panelu imperium; zbudowanie scenariusza wymaga nowego hooka spoza allowlisty. Stan: NIE ZMIERZONO.
2. PRZYJMUJĘ. Hook w main.ts używa teraz createFoodTaxIo (empire-food.ts), a klamra setReserve i kolejka podatku są w module testowanym. Test G/adapter sprawdza zapas w strukturze states (klamra, nowy właściciel, brak stanu), kolejkę sumowaną (100+300=400) i kolejność markDirty przed refresh.
3. PRZYJMUJĘ. Mutacje nie mają już własnej listy asercji: każda mutacja uruchamia ten sam plik testu jako proces potomny na zmutowanej kopii empire-food.ts (FOOD_TAX_SRC_FILE). Mutant uznany za wykryty, gdy proces kończy się kodem != 0. Dodano 9 mutantów; wszystkie wykryte.
4. PRZYJMUJĘ. Test F: zapis/wczytanie zapasu (Array.from(entries) jak main.ts ~l.41924 i przywrót ~l.52180, JSON round-trip) daje 377 bez NaN po zamianie 123 z 500, oraz podatek 123 w kolejce po round-trip.
5. PRZYJMUJĘ. convertFoodReserveToTax: foodRemaining = poolExact - foodSpent (bez floor). Test E: 500,75 - 200 = 300,75.
6. PRZYJMUJĘ. Panel czyta zapas i kurs na żywo (liveFoodMax/liveFoodRate); po kliknięciu zamiany odświeża tekst „Pozostały zapas”, limit wejścia i stan przycisku bez zależności od updateHud. Brak zamrożonego max w HTML (sonda I).
DODATKOWO: resolveFoodTaxRate ma test fallbacku (brak wpisu trudności, brak sekcji budynki, kurs ujemny).
TESTY:
- tsc --noEmit (gra/): exit 0.
- node tools/food-to-tax-conversion-test.cjs: 71 PASS / 0 FAIL (w tym 9 mutantów, każdy wykryty przez proces potomny).
- logic-test: LOGIC OK (213/213), exit 0.
- tech-tree-test: 20 pass, 0 fail, exit 0.
- research-test: PASSED 33 / FAILED 0 / TOTAL 33, exit 0.
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- combat-test: All sanity checks passed, exit 0.
- labor-to-tax-conversion-gold-test: 58 passed, 0 failed, exit 0.
- work-tax-conversion-test: 10 assertions passed, exit 0.
- git diff --check: czysto.
- Chromium live: NIE ZMIERZONO (patrz zarzut 1).
BLOKADY: dowód live w Chromium (zarzut 1). Kurs Żywności nadal 1:1 — decyzja właściciela. Zamiana całego zapasu może wywołać głód wojska w następnej turze (bez zabezpieczenia, zgodnie z Pracą) — do decyzji właściciela. Typowa nadwyżka (cap Spichlerza 54 000) przy 1:1 daje co najwyżej 54 000 Podatku przed korupcją i suwakiem silnika; efekt po silniku NIE ZMIERZONO.
RUNDY: 2/5
NASTĘPNY KROK: Evaluator (ponowna ocena 6 zarzutów; zarzut 1 wymaga decyzji, czy dopuścić wniosek o hook scenariusza live albo zaakceptować NIE ZMIERZONO) → Final Control.
UWAGI-DLA-ORKIESTRATORA: w gra/ dowiązano symbolicznie node_modules do worktree wf_6ea5ebea-20b-2 (gra/node_modules jest w .gitignore; nie skopiowano, brak dodatkowego zużycia dysku). Do usunięcia przy sprzątaniu tego tematu (unlink symlinku, nie rm katalogu docelowego). Wolne miejsce na / przed startem: 3,7 GB.
DEPLOY/PUSH: NIE WYKONANO
