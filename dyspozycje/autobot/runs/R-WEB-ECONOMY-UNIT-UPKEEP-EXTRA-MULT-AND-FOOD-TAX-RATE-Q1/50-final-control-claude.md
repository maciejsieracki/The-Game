# R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1 — Final Control (Dodatek 1, po rundzie 2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1
GOAL: fala 875 anulowana; zywnosc jednostek = geometria x4/epoke (4/16/64 przy ON), pieniadz i surowce utrzymania bez zmian, kurs Zywnosc->Podatek 0,2; silnik = karta takze po rollbacku flagi w locie.
ZMIANY-COMMIT: kandydat d30b1a99d91ac35fac889c4783b867d284e8b404; merge-base --is-ancestor 3e978f882 d30b1a99d -> ANCESTOR_OK. git diff --stat: 9 plikow (+179/-89): econ-era-rebalance-params.json, econ-params.json (tylko kurs), econ-era-rebalance.ts, economy-upkeep.ts, 3 testy gra/tools, 2 raporty runu. Wszystko w allowliscie; brak gra-robocza/, WERSJE.md, manifestu, rust-port.
TESTY (wlasne, surowe wyjscie, worktree na d30b1a99d):
- tsc --noEmit: exit 0
- logic-test 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6 (wszystkie exit 0)
- unit-upkeep-era-scale-test: 24 ok, 0 FAIL (M1-M6 wykryte, w tym M6 rollback w locie)
- econ-era-rebalance-test: 38 ok, 0 FAIL
- food-to-tax-conversion-test: 71 PASS / 0 FAIL
- empire-food-b5-test: 32 pass / 2 fail (dlug sprzed zmiany, identycznie na bazie wg Evaluatora i Operatora; diff nie dotyka empire-food ani racji)
ZARZUTY:
1. Rozjazd silnik-karta po rollbacku flagi ON->OFF w locie: PRZYJETY przez obrone i naprawiony w d30b1a99d (unitFoodPerTurn liczy baze zawsze z unitFoodBaseByEpoch(raw.direct, raw.epoch); tabela nie zapieka wartosci zaleznej od flagi). Dowod: diff economy-upkeep.ts + pin "stala tabela ON->OFF" + mutant M6 czerwony, 24/0. Zamkniety.
2. empire-food-b5 2 FAIL: dlug sprzed zmiany, poza zakresem -> ODDAL (uwaga).
3. Pomiar dymny AI: Operator zmierzyl (seed 4242, 90 tur, PRZED/PO): brak glodu, brak masowego rozpadu armii (t80 AI 327->310, t90 479->493). Ja go NIE odtwarzalem — NIE ZMIERZONO przeze mnie; netto zywnosci HUD NIE ZMIERZONO; zapas zywnosci AI ok. -5% w t90. -> ODDAL (uwaga).
BLOKADY: brak.
RUNDY: 2/5 zuzyte (Operator r1, obrona r2); FC r1.
UWAGI-DLA-ORKIESTRATORA: (a) przed deployem zweryfikowac w grze zywnosc jednostek 4/16/64 i kurs 0,2 (live NIE ZMIERZONO); (b) dlug empire-food-b5-test (2 FAIL) do tematu TEST-DEBT; (c) gracz w pomiarze Operatora martwy po t70 w obu biegach — pomiar gracza bez wartosci.
NASTEPNY KROK: integracja orkiestratora (merge d30b1a99d do main, bramki), bez deployu w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO
