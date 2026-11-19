STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-LIVE-AUDIT-Q1
GOAL: Ustalić z pomiaru w grze, czy miasta AI trzymają stały garnizon min. 1 jednostki (nie dołącza do armii/generała); werdykt A/B/C.
ZMIANY/COMMIT: kandydat 0a543d14b; `git merge-base --is-ancestor 0c3fa0747 0a543d14b` = tak. diff --stat vs baza: 11 plików, +1372. Kod gry: wyłącznie gra/src/main.ts +17 (hak odczytu miastaWojsko/wojskoPozaMiastem, tylko ?civTest=1, bez zmiany zachowania). Reszta: 3 narzędzia gra/tools/ai-city-garrison-measure-*.cjs, raporty, dowody. Allowlista zachowana; brak WERSJE.md, gra-robocza, rust-port, JSON balansu.
TESTY (własne, świeże npm ci --ignore-scripts, surowe wyjście): tsc --noEmit 0 błędów; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; ai-war-city-garrison-test 20/0; ai-war-defend-home-test 30/0; ai-home-defense-civilian-filter-test 8/0; ai-home-defense-vs-barbarians-test 46/0. Nowych testów/mutacji brak (brak poprawki) — poprawka = NIE ZMIERZONO, jak w dispatchu.
OCENA ZARZUTÓW:
1. Brak rozdziału cywilizacje/państwa-miasta: ODDAL (uwaga). Typ właściciela NIE_ZMIERZONO (JSONL bez flagi); obrona wyjaśniła skok 42->16 właścicieli (przejęcia miast) i dała podział proxy po liczbie miast. Werdykt B nie zależy od typu: opiera się na zdarzeniach opuszczenia przez tego samego właściciela (64, w tym 30 w pokoju).
2. DECISION_REQUIRED mimo darmowej części: ODDAL (uwaga). Kod potwierdzony: homeDefenderPool (ai.ts ~3384) nie wyklucza garnizonu; planArmySeeksArmy (~3738) wyklucza tylko najsłabszą jednostkę; emptyCityGarrisonRecruitIds (~1940) w pokoju zwraca zero. Wykluczenie zmienia skład armii AI, więc ABC jest uzasadnione, lecz właściciel już zgłosił tę regułę wprost — rekomenduję w pytaniu ABC wskazać, że opcja wykluczenia jest zgodna z jego zgłoszeniem.
3. Słaby dowód (b): ODDAL (uwaga). Obrona dała lepszą miarę: 66 przejść 1->0, 64 z jednostką żyjącą poza miastem; 120 z 167 pustych miast w t60 nigdy nie miało garnizonu (brak rekrutacji, nie odejście).
4. Jeden seed 4242, tury 2-60, owner 0 = gracz nieweryfikowane: ODDAL (uwaga). Ograniczenie jawnie przyznane; nie podważa B, podważa tylko wartości procentowe.
WERDYKT: B (reguła obchodzona/niepełna), poparty kodem i pomiarem. Raport Operatora i obrony zgodne z surowymi dowodami; liczby (11/41, 13/41; 73 zdarzenia; 64 z 73) spójne ze źródłami. Cel audytu osiągnięty, ale funkcja dla właściciela NIE jest wdrożona.
BLOKADY: brak techniczny. Decyzja produktowa A/B/C czeka na właściciela.
RUNDY: 3/5 (Operator, obrona, FC).
NASTĘPNY KROK: pytanie ABC do właściciela, potem R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1 (wspólny helper isCityGarrisonUnit w homeDefenderPool, army-concentration, armyMerge, planArmySeeksArmy; rekrutacja także w pokoju zależnie od opcji; test przed/po + mutacja).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: (1) Druga część zgłoszenia właściciela (priorytet zdjęcia oblężenia: AI z przewagą ma w ~20% atakować armię oblegającą własne miasto; także reakcja na oblężenie gracza) NIE jest objęta tym tematem — wymaga osobnego tematu z pomiarem (w próbkach oblężone t40 city51 i t50 city1 miały wojsko 0). (2) Gracz bez miast w t60 (owner 0, założenie) — przyczyna NIE_ZMIERZONO.
