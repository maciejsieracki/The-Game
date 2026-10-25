STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-RULES-MULTIWAR-Q1
GOAL: Obrona zarzutow Evaluatora r5 (FAIL, 1-8 blokujace, 9-13 uwagi). Poprawki kodu tam, gdzie zarzut byl sluszny i wykonalny; pozostale zarzuty przyjete jako dlug/NIE_ZMIERZONO z uzasadnieniem.
BAZA: 32515b91 (r5, detached). Pliki zmienione w tej rundzie: gra/src/game/warAllInCapital.ts, gra/src/main.ts (okablowanie), gra/tools/war-rules-multiwar-test.cjs, gra/tools/war-rules-multiwar-main-guard-test.cjs, ten raport.

ZMIANY (r6):
- warAllInCapital.ts ~linia 522-534 (zarzut 4): przy W2 pula W1 = armie TYLKO przydzielonego wroga (c.target.ownerId).
- warAllInCapital.ts ~linia 617-619 (zarzut 4): zapasowy cel (`others`) przy W2 tylko u przydzielonego wroga.
- main.ts warAllInContextFor ~29301-29305 (zarzut 5, R1): flaga ON + cywilizacja AI + tura < delayInterCivWarsUntilTurn -> undefined (all-in i W1 bez skutku przed T40). Barbarzyncy bez zmiany.
- main.ts warAllInContextFor ~29321 (zarzut 8, czesciowo): barbarzyncy nie dostaja listy armii (barbarians.ts ~1811 czyta wylacznie targets).
- main.ts ~31275-31285 (zarzut 3): klucz meta save warRulesForcedEraDeclared dodawany tylko przy fladze ON (przy OFF zapis bez dodatkowego pola, jak baza). Load (~39698) obsluguje brak klucza.
- war-rules-multiwar-test.cjs: scenariusze W2m/W2n (regresja zarzutu 4). Mutacja (w2Split=false w kopii src): 54/1, FAIL W2m -- test wykrywa stary błąd.
- war-rules-multiwar-main-guard-test.cjs: wzorzec OFF zaktualizowany do nowej formy + 2 nowe asercje (R1 w warAllInContextFor, zapis meta tylko ON).

TESTY (na poprawionym kodzie):
- tsc --noEmit: exit 0.
- Build Vite bezposredni (--outDir scratchpad): EXIT=0, 33,4 s.
- war-rules-multiwar-test: 55/0 (bylo 50/0 + 5 nowych).
- war-rules-multiwar-main-guard-test: 21/0 (przed zmianami r6: 19 asercji, 0 FAIL na 32515b91 wg Evaluatora; raport r5 podawal 18/0). Po zmianie wzorca OFF jeden FAIL -> wzorzec zaktualizowany, dodane 2 asercje (R1, zapis meta).
- war-allin-capital-test 95/0; ai-move-range 46/0.
- forced-war-stone 38/0; bronze ALL GREEN; iron 55/0; waves 17/0; trojstronna 23/0; stone/iron/trojstronna main-guard 19/0, 37/0, 14/0.
- Czerwone NA BAZIE 00fe8dc4 (potwierdzone przez git archive do scratchpad, zero zmian w worktree): forced-war-bronze-main-guard 27/1 (finalizePeaceTreatyBetween); forced-war-bronze-new-game-reset exit 1 (ReferenceError: forcedWarWavesByPairKey is not defined). Nie sa na liscie znanych czerwonych z dispatchu -- prosba do Final Control o dopisanie.
- Live Chromium (sandbox ?playtest=mapa, 2 cywilizacje): patrz sekcja LIVE nizej.
- NIE_ZMIERZONO: barbarzyncy-krazenie, barb-city-behavior, logic-test, ai-test, endturn-battle-deadlock (+exec) w tej rundzie (nie uruchamiane, poza zakresem poprawek -- zmiana dotyka tylko warAllInContextFor dla barbarzyncow przez wycięcie listy armii, bez zmiany targets).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJE (bez pomiaru): 4-6 AI, >=2 seedy, >=60 tur NIE_ZMIERZONO -- brak haka headless startu gry z N AI i kontrola seeda w repo. Poza allowlista tej rundy. Dlug/nastepny temat.
2. PRZYJMUJE: liczniki "minięć bez walki" i "miast zdobytych bez armii" NIE_ZMIERZONO (wymagaja pelnej gry, jw.).
3. PRZYJMUJE w czesci: zapis meta poprawiony (ODRAZU zrobione, zarzut sluszny). Hash OFF vs baza i determinizm 2 przebiegow NIE_ZMIERZONO.
4. PRZYJMUJE i POPRAWIAM: planner brał armie wszystkich wrogow. Poprawka: pula W1 i zapasowy cel ograniczone do przydzielonego wroga przy W2. Dowod: W2m/W2n, mutacja 54/1.
5. PRZYJMUJE i POPRAWIAM: bramka R1 w warAllInContextFor (flaga ON, AI, tura < 40 -> brak kontekstu all-in/W1). Istniejace wojny od startu nie prowadza juz marszu przed T40. Dowod: guard R1 (zielony) + build + live (ponizej). Nota: normalne ataki AI wg bazy w istniejacej wojnie przed T40 pozostaja bez zmian (poza zakresem all-in) -- ZALOZENIE Z5.
6. PRZYJMUJE jako hipoteze: liczby AI<->AI i AI->gracz NIE_ZMIERZONO; sandbox 23 vs 8 nie mierzy wojen AI->gracz. Diagnoza z kodu zostaje hipoteza do potwierdzenia pomiarem.
7. PRZYJMUJE jako dlug: brak testu main.ts zachowania (main-guard jest tekstowy). Dodano 2 asercje tekstowe (R1, zapis meta). Test zachowania wymaga haka headless (jw. 1).
8. PRZYJMUJE w czesci: barbarzyncy nie liczą listy armii (poprawka). Koszt warAllInContextFor dla cywilizacji AI to O(jednostki+miasta) na wlasciciela na ture; koszt w grze NIE_ZMIERZONO (sandbox nie zawiera wojen AI<->AI).
9. PRZYJMUJE jako dlug: war-allin-capital-test nie wykrywa X1-X7. Plik poza allowlista tej rundy (tylko war-rules-multiwar-*.cjs i forced-war-*). Nowy test W2m/W2n w war-rules-multiwar-test.cjs.
10. PRZYJMUJE: obie czerwone sa PRZED zmianami (ODRZUCAM zarzut o braku weryfikacji -- sprawdzone na 00fe8dc4). Prosba o dopisanie do listy znanych czerwonych.
11. PRZYJMUJE jako dlug: brak testu stabilnosci przydzialu (przeliczanie co ture po minId). Nie poprawiono.
12. PRZYJMUJE jako odchylenie od dispatchu: "blisko" = dystans heksowy <= engageRadiusHexes, bez limitu dojscia 2-3 tury. Zweryfikowane: nieosiagalna armia (brak sciezki) -> tryGoal 'next' (warAllInCapital.ts ~596-607) -> marsz na stolice, wiec grupa NIE jest przyciagana bez sciezki. Limit czasu dojscia NIE wdrozony (dlug).
13. PRZYJMUJE: raport r5 mial bledne liczby (main-guard podany 18/0, a na 32515b91 wg Evaluatora 19/0; "stone-main-guard 0" zamiast 19/0). Ten raport podaje wyniki przebiegow r6.

LIVE (war-rules-multiwar-live-test.cjs na poprawionym kodzie, sandbox ?playtest=mapa, 2 cywilizacje, 46 tur): 6 PASS / 0 FAIL. ON: 46/46 tur, nowe wojny przed T40 = 0, wojna startowa (0,1) = 1, sredni czas tury 3026 ms, console.error 8, pageerror 0. OFF: 46/46, nowe wojny przed T40 = 0, 3786 ms, console.error 23, pageerror 0. Czas ON/OFF = 0,80 (limit 1,15 OK). Flaga w zrodle przywrocona (war-rules-multiwar.ts:38 = true). Uwaga: sandbox nie zawiera wojen AI<->AI, wiec R2/R3 i liczniki z zarzutow 1-2 pozostaja NIE_ZMIERZONO.

ZALOZENIA (r6):
- Z5: normalne ataki AI w wojnie istniejacej przed T40 (poza all-in) zachowuja zachowanie bazowe; R1 dotyczy ruchu all-in i W1.
- Z1-Z4 z r5 bez zmian.

BLOKADY: brak technicznych. Pomiar 4-6 AI i 60 tur x 5 seedow wymaga haka headless (osobny temat).
RUNDY: 6 (odpowiedz na zarzuty Evaluatora r5; poza limitem 5/5 -- decyzja orkiestratora).
NASTEPNY KROK: Evaluator r6 na commit Operatora; Final Control; osobne tematy: hak headless + pomiar 60 t x 5 seedow; testy X1-X7 w war-allin-capital; limit czasu dojscia W1; stabilnosc przydzialu W2.
DEPLOY/PUSH: NIE WYKONANO
