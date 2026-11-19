STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-ERA-SCALE-Q1
GOAL: utrzymanie jednostek (Pieniądz, surowce, żywność) x1/x2/x4 wg epoki jednostki (Kamień/Brąz/Żelazo); karta żywności = silnik przy obu stanach flagi
ZMIANY/COMMIT: allowlista: gra/src/game/economy-upkeep.ts (komentarze + unitFoodCardValue), gra/tools/econ-era-rebalance-test.cjs (piny E3/E4/E8, M6, M10), gra/tools/unit-upkeep-era-scale-test.cjs (+1 check OFF karta==silnik), ten raport. SHA: patrz pole sha w wyniku.
TESTY: tsc --noEmit exit 0; logic-test 213 (PASS); research-test 33/0; ai-unit-replace-same-rules 45/0; combat-test exit 0; econ-era-rebalance-test 38 ok/0 FAIL (10 mutantów wykrytych); unit-upkeep-era-scale-test 16 ok/0 FAIL (M1-M3 wykryte); unit-epoch-cost, citizen-consumption-era-mult, unit-resource-upkeep, upkeep, glod-wojska-karencja: exit 0. tech-tree 20 NIE uruchomiono ponownie w tej rundzie (nazwa skryptu nieustalona; wynik z rundy 1 bez zmian w danych tech).
BLOKADY: pomiar dymny 60 tur (seed 4242) NIE ZMIERZONO (zarzut 4 PRZYJĘTY). Weryfikacja wizualna w przeglądarce NIE ZMIERZONO (zarzut 5 PRZYJĘTY). treasury-unit-cost-model.cjs nieaktualny, poza allowlistą (zarzut 4). Środowisko: gra/node_modules to dowiązanie symboliczne do node_modules worktree wf_294d835a-672-1 (ignorowane przez git; do sprzątania przez orkiestratora). Pliki logów testów przeniesiono poza worktree do /tmp (nie commitowane).
RUNDY: 2/5 (ostatni werdykt Evaluatora: 5 zarzutów, patrz niżej)
NASTĘPNY KROK: Evaluator (runda 2) oraz decyzja orkiestratora/właściciela: zarzut 1 (dyspozycja oparta na błędnej przesłance) i zachowanie karty przy fladze OFF (zmienione, patrz zarzut 5).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

1. PRZYJMUJĘ (fakt, bez zmiany kodu). Przesłanka dispatchu była błędna: buildUnitUpkeepTable, unitResourceUpkeep i buildUnitFoodTable już skalowały utrzymanie przez epochCostMultiplier (1/2/4). Realna zmiana tego tematu to wyłącznie żywność jednostek przy fladze ON (4/12/36 -> 4/8/16; epoki 4-5: 108/324 -> 16/16). Kod pozostaje zgodny z decyzją właściciela (x1/x2/x4). Wymaga świadomej akceptacji orkiestratora lub właściciela.

2. PRZYJMUJĘ, z korektą. Usunięcie M6 nie było w pełni uzasadnione: bramka w unitFoodPerTurn czyta flagę przy każdym wywołaniu (tabela jest budowana wcześniej), więc to jej jedyna ścieżka runtime. Przy domyślnych danych bramka daje te same liczby co tabela, dlatego oryginalny mutant (usunięcie bramki) jest równoważny i nie da się go wykryć wartością. Zamiast tego M6 zastąpiony mutantem wykrywalnym: `base = rebalanced * 2` w bramce; test econ-era-rebalance-test.cjs wykrywa go (zywnosc ON != 4/8/16). Weryfikacja: econ-era-rebalance-test M6 wykryty.

3. PRZYJMUJĘ, poprawione. Komentarze w economy-upkeep.ts (przy bramce unitFoodPerTurn i przy unitFoodCardValue) mówią teraz x1/x2/x4 wg epoki jednostki.

4. PRZYJMUJĘ jako NIE ZMIERZONO. Pomiar dymny 60 tur (seed 4242) nie został wykonany w tej rundzie; model treasury-unit-cost-model.cjs nie był aktualizowany (poza allowlistą). Rozpad armii AI: NIE ZMIERZONO.

5. PRZYJMUJĘ, poprawione (z jedną zmianą zachowania przy fladze OFF). Karta żywności była rozjechana z silnikiem przy OFF (karta 1, silnik 4/8/16). unitFoodCardValue liczy teraz: unitUpkeepScaleByEpoch(direct, epoch) x R_STAWKI (×4), czyli tę samą liczbę co buildUnitFoodTable/silnik, niezależnie od flagi. Skutek: karta przy OFF pokazuje 4/8/16 zamiast surowej 1 (wcześniej rozjazd). Pin E8 OFF zmieniony z [1,1,1] na [4,8,16] i dodany check "OFF karta == silnik". To zmiana widoczna przy rollbacku (flaga OFF); orkiestrator może ją cofnąć, jeśli właściciel woli surową wartość. Weryfikacja wizualna w przeglądarce NIE ZMIERZONO.

## Zmienione piny i mutanty (rejestr)
- econ-era-rebalance-test.cjs E3: żywność ON 4/12/36 -> 4/8/16.
- econ-era-rebalance-test.cjs E4: żywność epok 4-5 108/324 -> 16/16.
- econ-era-rebalance-test.cjs E8: karta ON 4/12/36 -> 4/8/16; karta OFF [1,1,1] -> [4,8,16] (+ check karta==silnik OFF).
- econ-era-rebalance-test.cjs M6: wymieniony (usunięcie bramki równoważne) na `base = rebalanced * 2`.
- econ-era-rebalance-test.cjs M10: stary anchor (`if (rebalanced === null) return direct;`) nie istniał po zmianie karty; zastąpiony mutantem `const base = direct;`.
- unit-upkeep-era-scale-test.cjs: dodany check OFF karta zywnosci == silnik.
