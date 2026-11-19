STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-CONVERTERS-MENNICA-CLAY-ORDER-Q1
GOAL: (A) Mennica: rozstrzygnąć czy delta 0 to błąd testu czy gry i doprowadzić asercje do zieleni; (B) proporcjonalny rozdział wspólnego wejścia (glina) zgodny z HUD; test shared-input; pomiar 45 tur seed 4242.
ZMIANY/COMMIT: kandydat c2342a78e; merge-base --is-ancestor 1bc8ec66d (origin/main) c2342a78e = TAK. Diff: converters.ts (proporcjonalny runConverters, nowa converterAllocatedConsumedRatesForBuildings), converters-shared-input-test.cjs (nowy), mennica-magazyn-test.cjs, raporty 10/30. Allowlista zachowana (brak zmian w main.ts / resource-gross-net.ts / turn-economy.ts).
TESTY (własny przebieg na c2342a78e): tsc --noEmit exit 0; logic 213/213; ekonomia-5x 280/0; zloto 45/0; converters-shared-input 22/0; mennica-magazyn 44 passed / 1 FAILED ("Mennica ZE złotem (zloto 10): delta > 0 (got 0)"). Pozostałych bramek (tech-tree, research, unit-replace, grupa-b, hex, tarasy) NIE ZMIERZONO przeze mnie; wyniki obrony to deklaracje.
OCENA ZARZUTÓW:
1 (osłabiona asercja): obrona rozbiła regułę na trzy: (i) bez złota =0 PASS, (iii) Mennica+Waluta > Waluta PASS, ale (ii) ze złotem > 0 jest CZERWONA. Dispatch (Zadanie A, wariant ii) nakazuje NAPRAWĘ gry, gdy delta 0 występuje także ze złotem. Zmierzone: jest 0 ze złotem (floor(2x0,30)=0, podział Handlu 60/30/10) -> błąd gry do naprawy w tym temacie; obrona odesłała do ABC, choć dispatch rozstrzyga ("NIE zatrzymuj się na DECISION_REQUIRED"). Zadanie A NIEWYKONANE. NAPRAW.
2 (harness bez resolveOwnerActiveLabels): naprawione (runTick podaje bramkę złota).
3 (HUD vs silnik): częściowo. Jest converterAllocatedConsumedRatesForBuildings (HUD 39 = silnik 39), ale niepodpięta: main.ts:4013 nadal liczy nominał (130), resource-gross-net.ts bez zmian. Wymóg "HUD = silnik" niespełniony w grze. NAPRAW (allowlista: resource-gross-net.ts jest, main.ts nie).
4 (bieg dymny 45 tur): NIE ZMIERZONO (wolne 11 GB, więc blokada dyskowa nieuzasadniona). NAPRAW.
5 (tor realny): naprawione (sekcja C2 przez advanceCityEconomy: cegla>0, ceramika>0, glina zmalała).
Zadanie B (silnik): proporcjonalny rozdział działa, brak regresji w bramkach, które uruchomiłem.
BLOKADY: (a) Mennica ze złotem delta 0, czerwona asercja; (b) HUD niepodpięty; (c) pomiar 45 tur NIE ZMIERZONO.
RUNDY: FC po 2 rundach operatora/obrony; powrót do Operatora, runda 3/5, to samo ID.
NASTĘPNY KROK: Operator: naprawić Mennicę ze złotem (delta > 0 zgodna z mnożnikiem, np. reszta/zaokrąglenie podziału małej puli w cities.ts), podpiąć HUD, wykonać bieg dymny 45 tur seed 4242. Wymaga rozszerzenia allowlisty o cities.ts i main.ts (decyzja orkiestratora).
UWAGI-DLA-ORKIESTRATORA: allowlista dispatchu nie obejmuje plików potrzebnych do naprawy (cities.ts, main.ts); dopisz w dodatku do rundy 3.
DEPLOY/PUSH: NIE WYKONANO
