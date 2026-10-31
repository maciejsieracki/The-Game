STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTO-FORT-CLAIM-Q1
GOAL: Automat ulepszen (K2 gracz "Zrownowazone", K3 AI) stawia fort/posterunek na cennym terenie (zloze/gory) na granicy dostepnej budowy; tylko przy wyczerpanym limicie miast, po zywnosci i surowcach, przed drogami.

ZMIANY/COMMIT: kontrolowany SHA kodu+testu+raportow: 2a63fcd8b (baza a07e6916f; Operator 84e8ec4a1, 692018b53; Obrona 2a63fcd8b). Final Control nie zmienia kodu; ten raport = jedyna zmiana FC. Allowlista zgodna: tylko gra/src/game/ai.ts, gra/src/game/auto-improvements.ts, gra/tools/auto-fort-claim-test.cjs, dyspozycje/autobot/runs/R-WEB-AUTO-FORT-CLAIM-Q1/**. git diff --check czysty. Brak zmian w gra-robocza, WERSJE.md, rust-port, main.ts.

WERDYKT ZARZUTOW (Evaluator):
1. m7 (usuniecie !deficitIsPendingNow()): ODDAL. Premisa Evaluatora (stadnina ok. 112 > fort) jest falszywa: z getImprovementMeta (gate-r2-auto-fort-claim.txt:67) stadnina=56, fort=100, najdrozsze ulepszenie niedoboru kopalnia_zelaza=88 < 100. Dodatkowo auto-improvements.ts:871-904 (fallbackIsPending -> foodAndFallbackDone) dubluje straznika, wiec pojedynczy mutant jest rownowazny. Luka testowa zamknieta: test K (wariant stadnina x10=560 > fort=100) zabija mutacje usuwajaca oba straznikow; zachowanie przypiete. Nie wymaga zmiany kodu.
2. Brak wiazania w main.ts (krok martwy w grze): ODDAL jako BLOKADA INTEGRACYJNA dla orkiestratora (allowlista tematu wyklucza main.ts; nie jest bledem kodu tematu, nie jest decyzja produktowa). Wymagane 2 wiazania (ok. 3 linie): gracz - cityLimitExhausted: isCityLimitExhausted(...) przy pickerze main.ts ok. l.36226; AI - cityLimitBase w opcjach decideAITurn. Do czasu wiazania zachowanie gry bez zmian (krok domyslnie wylaczony). Pomiar AI 5x40 (+47,2 hex terytorium/ziarno, +20,0 hex ze zlozem/gorami, 3,8 fortu/ziarno) pochodzi z raportu Operatora na symulacji uproszczonej - NIE_ZMIERZONO przeze mnie; na pelnej grze NIE_ZMIERZONO.
3. Glod drog przy sztywnym suficie % gracza: ODDAL. Zamierzony wzorzec jak E1-E5; test M (sufit 9% < koszt fortu -> ani fort, ani droga; po podniesieniu sufitu fort staje) zielony.
4. Wspolistnienie fort+kopalnia: ODDAL. Test L (silnik) zielony: fort nie blokuje kopalni i odwrotnie.
Brak zarzutu NAPRAW -> PASS-WITH-NOTES.

TESTY (zweryfikowane przeze mnie na 2a63fcd8b po npm ci; node_modules usuniete):
tsc --noEmit EXIT=0; auto-fort-claim 63/0; auto-improvements 46/0; ai-improvements 56/0; fort-outpost-hard-territory 80/0; autoimprove-stages-q1 302/0; saveload-praca-pool-live 13/0; defeat-last-city 14/0; diplomacy 148/0; war-era-counter 82/0; ring (unit-owner-emblem-ring-civ-color) 15/0. Zgodne z Operatorem/Obrona. NIE_POWTORZONE przeze mnie: mutacje m1-m8, pomiar AI 5x40 (biore z raportow). Przeglad diffu: brak bledu logiki E-FORT (kolejnosc E1-E5, niedobor, forty, drogi; rozlaczne okregi; budzet gracza sztywny; K1 bez zmian).

BLOKADY: (1) wiazanie main.ts - decyzja orkiestratora o rozszerzeniu allowlisty/osobnym temacie; (2) isCityLimitExhausted duplikuje wzor canFoundCity (cities.ts poza allowlista), parytet przypiety testem P.

RUNDY: Final Control 1/5 (R2 Operatora zuzyta, Evaluator R1 zakonczony PASS-WITH-NOTES)
NASTEPNY KROK: integracja orkiestratora SHA koncowy (patrz raport zwrotny); decyzja o wiazaniu main.ts. Zmiany webowe (gra/) rozlaczne z rust-port/ -> kolejnosc wzgledem origin/rust-port/parity-v2 dowolna, bez konfliktu; integrowac do main niezaleznie.
DEPLOY/PUSH: NIE WYKONANO
