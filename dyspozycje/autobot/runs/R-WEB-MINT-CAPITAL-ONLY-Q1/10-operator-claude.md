# R-WEB-MINT-CAPITAL-ONLY-Q1 — raport Operatora (runda 1/5, HAIKU 5.5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MINT-CAPITAL-ONLY-Q1 (MINTCAPITAL, odp. 8A właściciela 2026-11-26)
GOAL: bonus Mennicy (Waluta+Mennica) działa na całą cywilizację, liczony RAZ, tylko z Mennicy stojącej w aktualnej stolicy; Mennica poza stolicą nie działa.
BAZA: b1e4e04ab3af27a1241282d5cea1e9a97c2d4617 (origin/main), detach.

## ZMIANY (allowlista)
- gra/src/game/turn-economy.ts: `ownersWithMennica` (teraz `export`) liczy Mennicę tylko w mieście będącym stolicą ownera (ta sama heurystyka co `isCapital` w silniku: pierwsze miasto ownera w `cities`). Set = bonus raz na cywilizację.
- gra/src/ui/cityPanel.ts: `ownerHasMennica` sprawdza Mennicę wyłącznie w `cfg.getCapitalCityId(ownerId)` (autorytatywna stolica z main.ts), zamiast „gdziekolwiek w imperium”. Zmiana tylko w logice, bez nowej etykiety UI.
- gra/tools/waluta-mennica-test.cjs: asercja §13 „Stary zapis: Mennica w regionalnym mieście WCIAZ aktywuje mnożnik” kodowała stary kontrakt. Zmieniona na równość z „stolica bez Mennicy” (mnożnik 1). Uzasadnienie: nowa reguła odp. 8A. To jedyna zmieniona asercja.
- gra/tools/mint-capital-only-test.cjs (NOWY): 6 przypadków na `ownersWithMennica` (bonus ze stolicy; brak bonusu poza stolicą; zmiana stolicy znosi bonus do zbudowania nowej; dwie Mennice = jeden bonus; mutacja czerwona).

## TESTY (surowe wyniki)
- `npx tsc --noEmit` → exit 0, 0 linii wyjścia
- mint-capital-only-test → 6 PASS / 0 FAIL
- Mutacja realna (w `turn-economy.ts` usunięty warunek `isCapital`) → mint-capital-only-test: 3 PASS / 3 FAIL (wykryta); po przywróceniu 6/0
- waluta-mennica-test → 61 passed, 0 failed (przed zmianą asercji: 60/1)
- logic-test → LOGIC OK (213/213)
- tech-tree-test → 20 pass, 0 fail
- research-test → 33/0
- combat-test → 6/6
- trade-routes-income-test → 135 passed, 0 failed
- ai-test → 297 passed, 0 failed
- ai-unit-replace-same-rules-test → 45 passed, 0 failed
- war-rules-multiwar-main-guard-test → 21 PASS / 0 FAIL (plik `war-rules-multiwar-main-guard-test.cjs`; dispatch podał nazwę bez `-test`)
- Mennica-pokrewne: currency-mult-per-civ 202/0, currency-test 37/0, danina-podatek-nazwa 15/0, deposit-building-gate 50/0, korupcja 18/0, koszty-surowcowe 161/0, labor-to-tax-conversion-gold 58/0, city-administrator 119/0
- NIE ZMIERZONO: gra w przeglądarce (etykieta UI, żywy przebieg tury po zmianie stolicy).

## BLOKADY / UWAGI-DLA-ORKIESTRATORA
1. **Luka w pełnym dowodzie gry (ważne):** silnik tury (`isCapital` w `advanceCityEconomy` / `previewCityEconomy`) wyznacza stolicę jako PIERWSZE miasto ownera w tablicy `cities`. Autorytatywna stolica w main.ts (`capitalCityIdForOwner`) respektuje jawną mapę `capitalCityIdByOwner`. Po przeniesieniu stolicy tą drogą bonus Mennicy w silniku nadal idzie za starą stolicą (dopóki kolejność tablicy się nie zmieni). Pełna zgodność wymaga przekazania resolvera stolicy do silnika, czyli zmiany sygnatur (długie listy pozycyjne, ok. 6 miejsc wywołań w main.ts). NIE ZROBIONO w tej rundzie. Ta sama luka dotyczy dziś wszystkich efektów stolicy w silniku, nie tylko Mennicy (dług pre-existing, nie regresja tej zmiany). Rekomendacja: osobny temat „stolica w silniku = capitalCityIdForOwner”.
2. **ZAŁOŻENIE (do potwierdzenia przez właściciela, zgodnie z dispatchem):** Mennica osierocona poza stolicą NIE blokuje budowy nowej Mennicy w nowej stolicy. Potwierdzone w kodzie: limit budynku jest per miasto (`wielokrotny`), a lokalizacja `stolica` sprawdza tylko `ctx.isCapital`. Nie dodano nowej blokady „1 na cywilizację”: jest jedna stolica na ownera, a Mennica jest jednorazowa w mieście, więc w stolicy może stać tylko jedna. Bonus i tak liczy się raz (Set).
3. **Punkt 3 dispatchu (etykieta UI dla osieroconej Mennicy): NIE ZROBIONO.** Dla miasta poza stolicą `ownerHasMennica` zwraca teraz false, więc panel pokazuje zwykły „Bez Mennicy — ... netto bez mnożnika”. Brak osobnego komunikatu „Mennica poza stolicą — nieaktywna”. Dodanie wymagałoby stanu w `cityPanel` (poza tą rundą).
4. Punkt 4 dispatchu (podatek ≤5 mieszkańców = 0): bez zmian, nie dotykane.
5. Zmiana zachowania (do wiadomości właściciela): Mennica w regionalnym mieście przestaje mnożyć podatek imperium. Gracz, który traci stolicę z Mennicą, traci mnożnik aż do zbudowania nowej. Zgodnie z odp. 8A.
6. Poza zakresem, bez zmian: `gra/src/game/danina-nazwa.ts` (`mennicaWStolicy` już sprawdza stolicę), `gra/src/game/building-resource-gate.ts`, `gra/src/main.ts` (debugowe dopisanie Mennicy, ok. linii 33380).

## DECISION_REQUIRED
Brak. Konflikt reguł nie wystąpił. Punkt 2 to założenie, nie pytanie w tej rundzie.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja diffu z allowlistą i wyników bramek); osobno decyzja o luce stolicy w silniku (uwaga 1) przed uznaniem tematu za pełny.
DEPLOY/PUSH: NIE WYKONANO
