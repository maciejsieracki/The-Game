STATUS: PASS-WITH-NOTES (wynik tematu bez zmian: NIE_ODTWORZONO; zero zmian w gra/src)
DOMAIN: GAME
TEMAT: R-BITWA-DEAD-UNIT-DISAPPEARS-Q2
GOAL: zabite jednostki znikają ze sceny na realnych ścieżkach; odtworzyć ducha albo uczciwie zgłosić NIE_ODTWORZONO.

ZMIANY/COMMIT: baza cb216eb8d. Zmienione tylko narzędzia testowe (allowlista): gra/tools/battle-dead-unit-e2e-browser-test.cjs, gra/tools/battle-dead-unit-disappearance-browser-test.cjs, ten raport. SHA: commit na czubku (pole sha).

ODPOWIEDZI NA ZARZUTY
1. auto:siege NIE_ZMIERZONO / bramka domyślna niedomykalna — PRZYJMUJĘ. Poprawka: lista domyślna e2e = auto, skip, manualskip, midskip, skip:siege; auto:siege tylko jawnie (argument) albo E2E_SLOW=1 (komentarz w kodzie). skip:siege pokrywa ten sam _singleBlow. Luka auto:siege pozostaje NIE_ZMIERZONO (swiftshader, >MAX_MS), nie jest zgłaszana jako PASS.
2. Brak e2e z wyłomem/replay/ręczna bez skip; inwariant tylko graf sceny — ODRZUCAM jako blokadę, PRZYJMUJĘ jako udokumentowaną lukę. Dowód: wyłom muru i replay są pokryte przez baseline Codexa (battle-dead-unit-disappearance-browser-test: breach + replay-fresh-unit-kill, rc=0, wyniki "removed/bodyDetached/hpBarDetached/tileReleased" = true); pierścień zaznaczenia jest dzieckiem group (odpięcie group = odpięcie pierścienia, audyt kodu w 10-operator). NIE ZMIERZONO: _skipInstantFallback w przeglądarce, etykiety DOM, duch szyku, bitwa ręczna bez skip, AUTO z wyłomem. Rozszerzenie wymagałoby nowego harnessu = poza zakresem rundy obrony bez decyzji; brak odtworzenia ducha nadal decyzją właściciela (A: zamknąć NIE_ODTWORZONO + zostawić bramkę; B: prosić o zrzut/kroki).
3. Sztywny executablePath /usr/bin/chromium — PRZYJMUJĘ. Poprawka: oba testy rozwiązują przeglądarkę z CHROMIUM_PATH, /usr/bin/chromium, potem /opt/pw-browsers/chromium-*/chrome-linux/chrome. Dowód: bez symlinka /usr/bin/chromium (nie istnieje) disappearance-browser-test rc=0; e2e skip i auto działają.
4. Audyt kodu: scene.add w 4 miejscach — PRZYJMUJĘ jako korektę opisu. Sprostowanie do 10-operator-claude.md: jednostki dodawane do sceny w _placeUnits, _placeUnitsOneSide i _placeSiegeDefenders (x2) (battleScene.ts ~4516, 4684, 5424, 17203); wniosek bez zmian, bo inwariant per klatka (0 naruszeń; mutacja _removeUnitFromScene=no-op: 78 wg Evaluatora) jest niezależny od liczby miejsc dodawania. Uwaga: pełne HP daje tylko 1-3 zabitych (powtórka: skip 3, auto 1); istotne pokrycie to E2E_WEAK, co już zapisano.

TESTY (surowe wyjście, ta runda): node --check obu plików OK; disappearance-browser-test rc=0; e2e skip: 16 klatek, 3 zabitych, 0 naruszeń; e2e auto: 92 klatki, 1 zabity, 0 naruszeń; 0 błędów strony. tsc/logic nie uruchamiane ponownie — zero zmian w gra/src (Evaluator: 213/213, tsc czysto na cb216eb8d). Pliki evidence przywrócone do wersji z kandydata (nie nadpisane przebiegiem).
BLOKADY: brak (decyzja produktowa właściciela jak wyżej).
RUNDY: obrona po rundzie 2/5.
NASTĘPNY KROK: Final Control; potem decyzja orkiestratora/właściciela (ABC A/B). Brak zmiany produkcyjnej, więc deploy kodu gry nie dotyczy.
DEPLOY/PUSH: NIE WYKONANO
