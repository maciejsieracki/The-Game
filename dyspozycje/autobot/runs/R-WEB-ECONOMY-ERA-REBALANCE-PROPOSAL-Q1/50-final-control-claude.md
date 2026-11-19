STATUS: PASS-WITH-NOTES
DOMAIN: GAME (analiza i propozycja; zero zmian w gra/src i gra/data)
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-PROPOSAL-Q1
GOAL: konkretna propozycja rebalansu ekonomii wg epok (przychody z ulepszen, koszty, zywnosc obywateli i wojska) + PRZED/PO na przykladzie pomiaru gracza
ZMIANY/COMMIT: kandydat b21e81a92 (baza 8d2cb32b668472e9105ba237977a9d7e65f42f2d). `git merge-base --is-ancestor 8d2cb32b6 b21e81a92` = OK (2 commity: ca3f0ce95, b21e81a92). `git diff --name-only 8d2cb32b6 b21e81a92` = 5 plikow, wszystkie w allowliscie: dyspozycje/analizy/EKONOMIA-REBALANS-EPOKI-PROPOZYCJA.md, gra/tools/econ-rebalance-model.cjs, runs/<ID>/{10-operator-claude.md, 30-obrona-claude.md, model-out.txt}. Zero zmian w gra/src, gra/data, gra-robocza, gra-kanon, WERSJE.md (+896 / -0).
TESTY:
- node gra/tools/econ-rebalance-model.cjs: rc=0, 401 wierszy, NaN=0, wyjscie identyczne (diff) z model-out.txt.
- Weryfikacja cytowanych zrodel w kodzie: terrain-improvements.ts l.128-142 (mnozniki upkeep 1/2/4, potem x2), l.191-200 (improvementYieldForEra: base+(era-1) tylko dla epok 2,3), l.331-342 (normalizeProductionEra -> 1..3, round(base*1,5^(era-1))); turn-economy.ts l.991 computePracaUpkeepByOwner; economy-upkeep.ts l.1153 unitFoodPerTurn; citizen-consumption-era.ts m(e)=1+0,5*(e-1). Zgodne z dokumentem (w tym ustalenie, ze epoki 4-5 wracaja do bazy plonow/surowcow).
- Ocena zarzutow: 1 (floor) - obrona trafnie, bonus calkowity bez floor, Brąz bez ciecia, dokument spojny (§C, §E.6). 2 (zywnosc w Zelazie) - naprawione (racje 1,6 / 2,2). 3 - warianty (ii),(iv),(v) dodane; koszt rekrutacji jawnie NIE_MODELOWANE (uczciwe oznaczenie, nie FAIL). 4 - tabela epok 1-5 jest. 5 - Praca: dokument mowi wprost, ze zapas rosnie ok. 250/t bez ujscia (ABC 8). 6 - dwa estymatory UPK/BRU jako zakres. 7 - spichlerz skorygowany danymi. 8 - miks jednostek 4/8, zuzycie wojska NIE_ZMIERZONO. 9, 10 - noty, przyjete.
- tsc --noEmit: NIE_WYKONANO (brak node_modules; diff nie dotyka gra/src; bramka bez przedmiotu). 5 bramek referencyjnych: NIE_WYKONANO z tego samego powodu (zero zmian kodu gry). Test mutacyjny modelu: brak (opcjonalny w dispatchu).
BLOKADY: brak.
NOTY (nie blokujace):
1. Wariant REKOMENDOWANY daje zywnosc netto ujemna w obu seedach (§D); dokument warunkuje wdrozenie decyzja o produkcji zywnosci (ABC 9). Wartosci bezwzgledne zaleza od zalozonego miksu jednostek (NIE_ZMIERZONO) - zakres, nie pomiar.
2. Wszystko poza epoka 2 to projekcja statyczna; model bez sprzezenia zwrotnego. Wlasciwa weryfikacja = bieg w zywej grze za flaga danych (kolejny krok, opisany w §D).
3. Koszt rekrutacji jednostek (ii) oraz ujscia Drewna/Pracy pozostaja NIE_MODELOWANE - do kolejnego tematu.
4. Znalezisko kodu: epoki 4-5 wracaja do bazy plonow/surowcow, a upkeep Pracy rosnie x8/x16 - decyzja ABC 10.
UWAGI-DLA-ORKIESTRATORA: dokument ma 10 pytan ABC z rekomendacja pierwsza; do przekazania wlascicielowi po polsku. Brak dodatkowych znalezisk poza zakresem.
RUNDY: FC po rundzie 2/5
NASTEPNY KROK: integracja orkiestratora (dokument analityczny, bez wplywu na gre), pytania ABC do wlasciciela; potem temat biegu weryfikacyjnego w zywej grze.
DEPLOY/PUSH: NIE WYKONANO
