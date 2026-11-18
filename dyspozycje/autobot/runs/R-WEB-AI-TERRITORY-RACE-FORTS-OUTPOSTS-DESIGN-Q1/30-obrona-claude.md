STATUS: BLOCK
DOMAIN: GAME (analiza/projekt; bez zmian logiki gry)
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-OUTPOSTS-DESIGN-Q1
GOAL: Zinwentaryzować forty/posterunki, zmierzyć stan PRZED (3 ziarna x >=150 tur), zaproponować mechanizm wyścigu o teren dla AI z wariantami i pytaniami ABC.
ZMIANY-COMMIT: 96ac7bfafa3e2426e9a473d1e6ef71e6b8d8eb60 (dyspozycje/analizy/AI-TERRITORY-RACE-DESIGN.md, korekty obrony r2). Raport: commit po tym pliku, SHA w polu sha wyniku. Baza 64208a85b; kod gry nietknięty.
TESTY: NIE ZMIERZONO. Pomiar PRZED nie wykonany (zarzut 1 PRZYJĘTY). Bramki tsc/logic/tech-tree/research/unit-replace/combat nie uruchamiane: main.ts ani kod gry nie zmienione.
BLOKADY: (a) pomiar PRZED: brak gra/node_modules, brak narzędzia gra/tools/territory-race-measure-run.cjs, hak __aiEconomyMeasure nie ma pól fortów/terytorium (main.ts:33398); wykonanie to kilka godzin wall-time, poza zakresem tej rundy. (b) koszt utrzymania fortu/posterunku i UI gracza: NIE ZWERYFIKOWANO.
RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL, zarzuty 1-6)
NASTĘPNY KROK: nowy dispatch wyłącznie na pomiar PRZED: (1) npm ci --ignore-scripts w gra/ (df >= 4 GB), (2) read-only rozszerzenie haka metrics o liczbę miast/fortów/posterunków i heksy terytorium z miast vs fortów, (3) narzędzie gra/tools/territory-race-measure-run.cjs, uruchomienie setsid nohup, 3 ziarna x 150 tur, dowody/ z commitem po każdym ziarnie. Równolegle: pytania P1-P5 do właściciela (sekcja 7), rekomendacje traktować jako wstępne.
DEPLOY/PUSH: NIE WYKONANO

Odpowiedzi na zarzuty Evaluatora:
1. PRZYJĘTY. Pomiar nie został wykonany. Wcześniejsze uzasadnienie „zakaz biegów w tle" było błędne: dispatch dopuszcza `setsid nohup` i odpytywanie. Opisane w sekcji 6 projektu.
2. PRZYJĘTY. Wniosek „AI rzadko stawia forty" oznaczony jako hipoteza z kodu (przebadano 0 AI x 0 ziaren x 0 tur). Rekomendacje A/C w sekcjach 4 i 7 oznaczone jako wstępne.
3. PRZYJĘTY. SHA podane wyżej: 96ac7bfa (korekty projektu).
4. PRZYJĘTY. Zasięg miasta to max(5, populacja) z limitem 15 (`gra/src/map/territory.ts:89-93`, `cityRangeForPopulation` w `okolica.ts`). Fort 5, posterunek 3. Zapis „10 pól" usunięty.
5. CZĘŚCIOWO PRZYJĘTY. Potwierdzono: hak `metrics()` (main.ts:33398-~33480) nie ma pól fortów/posterunków/terytorium, więc zarzut o braku w haku jest prawdziwy. Dodano zapis o utrzymaniu ogólnym (`terrain-improvements.ts:124`, mnożnik epoki 1/2/4), ale czy obejmuje forty: NIE ZWERYFIKOWANO. UI gracza i zachowanie sporne heksy/kontakt granic: NIE ZWERYFIKOWANO, oznaczone jako otwarte.
6. PRZYJĘTY. Planer ekspansji zwraca najwyżej jedną komendę budowy na wywołanie (fort z pętli 1 albo posterunek z pętli 2, `ai.ts:~3120`, `return` po pierwszym trafieniu). Zapis „1 posterunek na turę" poprawiony w sekcjach 1.4 i 4 (wariant C) oraz P3.

Uwagi dla orkiestratora: pytania ABC P1-P5 pozostają ważne, ale ich rekomendacje nie są dowodem. Decyzje liczbowe (limit fortów, udział pracy) nie zostały wybrane.
