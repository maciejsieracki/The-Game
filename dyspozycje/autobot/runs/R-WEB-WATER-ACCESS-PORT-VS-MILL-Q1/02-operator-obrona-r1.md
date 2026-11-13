# Obrona Operatora R1 — R-WEB-WATER-ACCESS-PORT-VS-MILL-Q1

1. Brak gate-*.txt: PRZYJMUJE. Dodane gate-water-access-port-vs-mill.txt (ALL PASS, EXIT=0), gate-freshwater-access.txt (37/0, EXIT=0), gate-naval-water-access-gate.txt (34 pass/5 fail, EXIT=1, dlug odziedziczony), gate-deposit-building-gate.txt (46/1, EXIT=1, dlug odziedziczony).
2. Zero zmian kodu: ODRZUCAM jako wade. Dowod: brak "mlyn" w jakimkolwiek JSON repo poza node_modules; Port = isCoastalCity||cityHasWaterAccess juz zgodny. Sprostowanie: maMlyn jest ustawiane z runtimeBuiltIds.includes('mlyn') (turn-economy.ts:2006,2584; cityPanel.ts:1238), czyli zawsze false, bo budynek nie istnieje (wczesniejsze "nic nie ustawia" bylo nieprecyzyjne).
3. Jezioro w cityHasWaterAccess: PRZYJMUJE jako notatke, bez zmiany kodu (dispatch zakazuje jezior; decyzja 2026-11-02). Przy definicji Mlyna "tylko rzeka" wymaga osobnej bramki rzecznej (isRiverAdjacent), nie cityHasWaterAccess, jesli jezioro ma byc wykluczone. Osobny temat.
4. Dlug testowy (5+1 FAIL): PRZYJMUJE jako istniejacy, poza zakresem (nieaktualne piny tekstowe); osobny temat.
