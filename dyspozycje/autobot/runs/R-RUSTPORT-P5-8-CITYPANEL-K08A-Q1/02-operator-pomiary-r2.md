STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P5-8-CITYPANEL-K08A-Q1
GOAL: Pomiary Operatora r2 (mutacje, harness, bramka kopii) dla portu 15 jednostek nie-DOM K08 (pin edb8fb56).
ZMIANY/COMMIT: brak zmian kodu w tym raporcie; pomiary r2 na 922ce71f (baza 249bca66 = e21ef9a9 + 52d2b385). Źródło: treść raportu Operatora r2 zapisana w dossier P5-8-K08A.md §7 i w logach r2-logi/mutacje-r2.json.
TESTY: harness run-k08a-units 40 wektorów, 0 różnic; mutate-k08a-units 47 mutantów, 47 zabitych (harness + bramka kopii), 0 przeżytych; verify-k08a-copies OK (15 bloków, ORPHAN=0); npm run check EXIT 0; npm run typecheck EXIT 0 (wynik r2 z dossier §7).
BLOKADY: luka lustra K06A w refreshCityPanelIfOpen wykryta przez FC r2 (zarzut 1) i naprawiona w r3 (patrz 01-operator-r3.md). Brak pomiarów przeglądarkowych (NIE_ZMIERZONO).
RUNDY: 2/5 (pomiary r2).
NASTĘPNY KROK: Evaluator r3 -> Final Control r3.
DEPLOY/PUSH: NIE WYKONANO
