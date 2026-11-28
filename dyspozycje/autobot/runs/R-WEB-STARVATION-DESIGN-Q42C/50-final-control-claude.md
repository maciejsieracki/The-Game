STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-STARVATION-DESIGN-Q42C
GOAL: dokument i model projektu głodu zamiast blokady końca tury (Q42 = C); zero zmian gra/src i gra/data.
ZMIANY/COMMIT: kandydat b590bb87c1df33dce852665d8cd854f5165f9ab8 (potomek bazy 42992edde48ccf32da3065ebf4924cafa291371e: merge-base --is-ancestor = OK). git diff --stat: 5 plików, +456/-0: dyspozycje/analizy/GLOD-ZAMIAST-BLOKADY-2026-11-28.md, gra/tools/starvation-model.cjs, runs/.../10-operator-claude.md, 30-obrona-claude.md, model-output.txt. Wszystko w allowliście; gra/src i gra/data: 0 zmian. git diff --check: OK.
TESTY: (1) node gra/tools/starvation-model.cjs: rc=0, wyjście identyczne z model-output.txt (diff pusty). (2) Wyrywkowa weryfikacja numerów linii w kodzie bazy: main.ts l. 7955 (obronna: nnsUnitIsDefender), l. 43739-43742 (blokada canPlayerInitiateEndTurn), no-negative-stocks.ts l. 486 (suwak-zywnosc), empire-food.ts l. 290 (glodWojska = central < 0) - zgodne z dokumentem. (3) tsc i 5 bramek referencyjnych NIE uruchomione: brak gra/node_modules w worktree; ponieważ diff gra/src + gra/data jest pusty, wynik jest tożsamy z bazą 42992edde (wnioskowanie z diffu, nie pomiar).
OCENA ZARZUTÓW EVALUATORA I OBRONY: 1 (G2/t17) - poprawione w dokumencie (l. 149, 167), zgodne ze źródłem; 2 (brak pomiaru żywego) - nie naprawiony pomiarem, ale jawnie ujawniony w STANIE WIĄŻĄCYM pkt 1 i na liście NIE ZMIERZONO; kryterium (c) dispatchu dopuszcza model z NIE ZMIERZONO - uwaga, nie FAIL; 3 (założenia/wrażliwość) - dodano, wyjście modelu powtarzalne; 4 (ochrona obrońców AI) - poprawione, teza "AI de facto G2" usunięta, zgodne z kodem; 5 (testy opisane po nagłówkach) - częściowo, uczciwie oznaczone; 6 - SHA i uwaga o lud_spadek_proc dodane.
BLOKADY: brak blokujących.
UWAGI-DLA-ORKIESTRATORA: (a) przed pytaniem ABC do właściciela potrzebny osobny temat pomiaru żywego G1-G3 w Chromium na poziomie maksymalnym (populacja w t16, ubytek, atak barbarzyńców po t17); (b) decyzje do pytań: ochrona obrońców w G2, wyłączenie/zmiana atrycji HP przy G3; (c) pytanie redagować wg ZASAD ABC (bez nazw plików/testów w treści); (d) treść części testów nieczytana w całości.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (dokument/narzędzie, bez deployu - zero zmian gra/); następnie turniej C-018 i pytanie ABC.
DEPLOY/PUSH: NIE WYKONANO
