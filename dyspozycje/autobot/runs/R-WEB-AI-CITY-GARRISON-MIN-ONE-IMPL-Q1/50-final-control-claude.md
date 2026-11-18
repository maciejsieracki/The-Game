STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: garnizon min. 1 jednostka bojowa w kazdym miescie AI, takze w pokoju, poza armia.
ZMIANY/COMMIT: kandydat b6302fcc2 (baza 1484bdc1e; is-ancestor = TAK). Diff 1484bdc1e..b6302fcc2: ai-city-garrison.ts (+21, garrisonGoldReserve, sufit 3), ai.ts (+37/-), main.ts (4 linie), 3 testy w gra/tools, raporty i dowody-r3. Allowlista kodu zachowana, ale zmiany setupu istniejacych testow (home-defense-vs-barbarians, army-concentration sc.4) leza poza jawna lista.

TESTY (wlasny bieg na b6302fcc2, surowe wyniki): tsc --noEmit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; min-one 23/0; ai-war-city-garrison 21/0; ai-war-defend-home 30/0; home-defense-civilian-filter 8/0; home-defense-vs-barbarians 46/0; army-concentration 57/0; ai-war-army-seeks-army 22/0; siege-ai 17/0; siege-last-stand-sortie 71/0.
Wlasna mutacja: usuniecie 3 filtrow `campaignGarrisonIds` w kampanii wodza (ai.ts) -> min-one 23/0, army-concentration 57/0, ai-war-city-garrison 21/0, ai-war-defend-home 30/0 -- wszystko zielone (mutacja przezyla; zrodlo przywrocone). Zarzut 4 potwierdzony dla kampanii wodza; obrona domknela tylko front-merge (C4).
Pomiar w zywej grze: NIE URUCHAMIANY przeze mnie; oceniam dowody operatora (dowody-r3/pomiar-przed-po-seed4242.txt, diagnoza-puste-miasta-po.txt).

OCENA ZARZUTOW:
1 (cel niespelniony) -- NAPRAW. Dowod: t30 pokoj 32/90 (przed 78/91), t60 pokoj 42/71, wojna 7/125; razem 49 pustych miast w t60, z czego 22 "nigdy bez wojska". Poprawa t30 realna, ale regula "min. 1 w kazdym miescie" nie obowiazuje.
2 (nieudiagnozowane puste miasta) -- NAPRAW. Wlasciciel 28: 15/15 pustych przy skarbcu 1530, upkeep 28; wlasciciele 10/22: 13/15 i 11/15 pustych przy 45/39 jednostkach poza miastem. Przyczyna nie zmierzona; obrona sama przyznaje hipoteze bez dowodu.
3 (odejscia) -- NAPRAW. Odejscia garnizonu 73 -> 162 (wojna 42->103, pokoj 31->59), cityEmptyAfter 64->100; sprzeczne z regula i z deklarowanym skutkiem filtrow. Brak pomiaru potwierdzajacego bramke.
4 (testy niedyskryminujace) -- NAPRAW (potwierdzone wlasna mutacja, patrz wyzej; dodatkowo csGarrisonUnitIds bez testu wg Evaluatora, nie weryfikowalem osobno).
5 (zmiana setupu testow poza allowlista) -- ODDAL do wlasciciela jako uwaga/ABC: T2/T4 home-defense (dodany garnizon a0 -- oryginalny plik z 1484bdc1e daje 38/2 na kandydacie, wiec zmiana zachowania jest realna) i sc.4 army-concentration (prog 9 -> <=6 poza stolica). Uzasadnione regula wlasciciela, ale wymaga jawnej akceptacji.
6 (koszt) -- ODDAL (ABC): upkeep jednostek 2744 -> 3468 (+26%), skarbiec t30 3520->3114 (-12%), t40 10246->7755 (-24%); sufit GARRISON_RESERVE_MAX_CITIES=3 to arbitralny prog bez decyzji wlasciciela (zalozenie).
7 (nie dotyczy bez pomiaru) -- ODDAL jako uwaga: odsiecz/zwiad/armyMerge bez pomiaru; homeDefenderPool celowo niezmieniony (decyzja "CZEKA NA RANO"), a jest prawdopodobnym zrodlem odejsc.

BLOKADY: (1) cel niespelniony wg pomiaru (49 pustych miast t60); (2) odejscia garnizonu wzrosly zamiast spasc, przyczyna nieustalona; (3) kampania wodza bez testu dyskryminujacego; (4) decyzje ABC: sufit rezerwy, allowlista zmian testow.
RUNDY: FC r3 / 5 (r4 i r5 jeszcze dostepne).
NASTEPNY KROK: Operator r4 (ten sam ID): najpierw DIAGNOZA przyczyn w zywej grze -- dla wlascicieli 28/10/22 ustalic dlaczego brak rekrutacji/dlaczego jednostki poza miastem nie wracaja (hook miastaWojsko, log decyzji zakupu i ruchu); zrodla odejsc garnizonu rozbic po sciezkach (w tym homeDefenderPool, odsiecz, zwiad); test dyskryminujacy kampanii wodza (mutacja filtrow musi byc czerwona); ABC wlasciciela: sufit rezerwy i akceptacja zmian setupu testow.
UWAGI-DLA-ORKIESTRATORA: homeDefenderPool jest jedyna niezmieniona sciezka i moze tlumaczyc wzrost odejsc -- pytanie "CZEKA NA RANO" blokuje meritum; warto przyspieszyc decyzje. Raport obrony przekroczyl limit slow (~600 > 450).
DEPLOY/PUSH: NIE WYKONANO
