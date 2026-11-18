STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-LIVE-AUDIT-Q1
GOAL: Ustalić, czy każde miasto AI trzyma minimum 1 jednostkę wojskową stałą w mieście (nie dołącza do armii, nie jest zabierana przez generała), oraz zmierzyć to w żywej grze.
ZMIANY/COMMIT: 89fe3675b (gra/src/main.ts: hak odczytu `miastaWojsko`/`wojskoPozaMiastem`, tylko ?civTest=1). Analiza: gra/tools/ai-city-garrison-measure-analyze.cjs. Dowody: dowody/ 
TESTY: tsc --noEmit 0 błędów; logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; ai-home-defense-*-test 8/0 i 46/0; ai-war-city-garrison-test 20/0; ai-war-defend-home-test 30/0.
POMIAR (surowe liczby, miasta AI bez wojska w mieście):
 - pokój, tura 10: 11/41 bez wojska; 20: 13/41; 30: 78/91.
 - wojna, tura 40: 82/90; 50: 91/106; 60: 131/154.
 - pokój tura 40: 56/60; 50: 67/72; 60: 36/39.
 - zdarzenia odejścia jednostki stacjonującej (była w mieście N, poza miastem N+1, bez zastąpienia): 73, w tym 43 w wojnie i 30 w pokoju; 64 z 73 zostawia miasto puste.
 - inGarnizon w miastach AI: 0 we wszystkich próbkach.
 - oblężone miasta AI (oblegaCityId): 2 próbki (t40 miasto city51 wojsko 0; t50 city1 wojsko 0).
UWAGA: resume ze slotu dał SEGV; wynik ze świeżego startu, jeden seed.
WERDYKT W KODZIE (ai.ts / ai-war-*):
 - C (pokój): brak jakiejkolwiek reguły utrzymania garnizonu. Jedyna rekrutacja garnizonu: `emptyCityGarrisonRecruitIds` (ai.ts ~1945–1960, wywołanie ~3946), tylko gdy AI jest w wojnie LUB wróg w zasięgu `ekspansja_zagroz_zasieg`; w pokoju zero.
 - B (wojna): rekrutacja tylko dla PUSTEGO miasta; po jej zrealizowaniu jednostka może wyjść do armii. Jedyna ścieżka z wykluczeniem to planner `planArmySeeksArmy` (ai.ts ~3740–3747: najsłabsza jednostka na heksie miasta zostaje) — nie obejmuje pozostałych ścieżek (obrona domu `homeDefenderPool` ai.ts ~3386 wybiera dowolną bojową jednostkę; armia/koncentracja army-concentration.ts ~235).
 - `inGarnizon` (armyMerge.ts ~289) to mechanika ukrycia w scaleniu; w pomiarze AI jej nie używa (0 próbek).
 - Dotyczy państw-miast? Pomiar nie rozróżnia typu właściciela (wszyscy AI w jednej liście); gracz wyłączony z analizy.
BLOKADY: Pełne wdrożenie reguły "zawsze ≥1 jednostka" wymaga decyzji produktowej: (a) rekrutacja w pokoju kosztuje utrzymanie i zmienia ekonomię AI; (b) zakres: czy tylko w wojnie, czy zawsze; (c) państwa-miasta osobno. Zgodnie z zadaniem nie zmieniam balansu ani kosztów — poprawki wycofania z armii nie wdrożono.
PYTANIE ABC (do właściciela):
 A) (rekomendacja) Garnizon 1 jednostki bojowej w KAŻDYM mieście AI, także w pokoju: stała jednostka wyłączona z zbierania, marszów i scalania; rekrutacja w pustym mieście z priorytetem; koszt: utrzymanie jednostki w każdym mieście (więcej wojska w pokoju).
 B) Garnizon tylko w wojnie / przy zagrożeniu (stan obecny rozszerzony o wykluczenie z armii, bez kosztu w pokoju).
 C) Bez zmiany: tylko zakaz wyjścia garnizonu z miasta (bez rekrutacji w pokoju).
NASTĘPNY KROK: po decyzji A/B/C osobny temat R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (wykluczenie z ścieżek: planArmySeeksArmy, army-concentration, homeDefenderPool, armyMerge; test czysty przed/po + mutacja).
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: gracz (owner 0 — założenie) bez miasta od tury ok. 50–60; przyczyna NIE_ZMIERZONO.
