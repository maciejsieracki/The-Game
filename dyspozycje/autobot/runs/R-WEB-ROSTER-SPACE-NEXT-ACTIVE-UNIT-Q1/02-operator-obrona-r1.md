STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ROSTER-SPACE-NEXT-ACTIVE-UNIT-Q1
GOAL: Spacja -> następna aktywna jednostka; oblegająca/oblegana też w kolejce.

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Dodane test-only haki w `__frozenTestDebug` (`spawn.flags.oblegaCityId`, `setCityBesieged`, `firstCityId`, `cityHex`; tylko z `?civTest=1`). ZAŁOŻENIE: niezbędne do wymaganego dowodu, więc rozszerzenie allowlisty o ten blok. Chromium D8-D11: bez oblężenia obie jednostki poza kolejką; po `oblegane=true` Spacja doskakuje na oblegającą (D9) i na stos oblegany (D10; lider stosu reprezentuje hex); bez ruchu i ufortyfikowana nadal pomijane (D11).
2. PRZYJMUJĘ. Zarzut słuszny: bęben (po wyczerpaniu ruchu) i odznaczenie po „Zwiedzaj" skakałyby na oblężenie. Poprawka: `cyclablePlayerArmyLeads()` przywrócone do starej kolejki (`cyclablePlayerArmyLeadsBase`); nowa `spaceActiveUnitQueue()` tylko dla Spacji, wybierana przez `cycleToAdjacentPlayerUnit(..., { siege: true })` (jedyne takie wywołanie). Strzałki HUD (`all`) bez zmian. Test strukturalny C pilnuje, że bęben/Zwiedzaj nie mają `siege`. ZAŁOŻENIE: oblężenie wpływa wyłącznie na ręczną Spację; bęben automatyczny nie przeskakuje na jednostki bez ruchu.
3. CZĘŚCIOWO. Uruchomione PO: roster-space (43/0), scout-explore-deselect-cycle (34/0), side-panel-unit-cycle-arrows (20/0), unit-frozen-fortified-unselectable (76/0), army-merge (r1: 73/0). Wzorce *next-unit*, *keyboard*, *hotkey*, *space*: brak innych plików w gra/tools. end-turn-input-stability, end-turn-modal-sequencing, hotseat-etap6a: ODRZUCAM dalszy re-dowód ponad r1 -- nie dotykają Spacji ani kolejki; zmiana r2 w main.ts to wyłącznie wybór listy w `cycleToAdjacentPlayerUnit` i bloki test-only.
4. ODRZUCAM/OPISUJĘ. `nextActiveUnit()` to eksport wymagany dispatchem (czysta funkcja testowalna); produkcja używa `activeUnitQueue` + `resolveAdjacentPlayerUnitCycle`. Semantyka „zaznaczona jednostka spoza kolejki -> start od początku" to istniejąca semantyka `resolveAdjacentPlayerUnitCycle`, bez zmian.

Bramki: gate-test-new-r2.txt (43 OK/0 FAIL, EXIT=0), gate-tsc-r2.txt, gate-regress-*-r2.txt.
RUNDY: 1/5 (obrona)
DEPLOY/PUSH: NIE WYKONANO
