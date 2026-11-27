STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar/weryfikacja)
TEMAT: R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (tag AIREBELVER)
GOAL: domknąć pozycje 1–5 weryfikacji buntów AI na maksimum; obrona po zarzutach Evaluatora z rundy 1 (commit 1b22830d9, raport Evaluatora 453d56ef3).
ZMIANY-COMMIT:
- NOWY gra/tools/ai-rebel-verify-last-city-live.cjs (scenariusz pozycji 1: wymuszony bunt jedynego miasta AI w ?playtest=mapa oraz kontrola na jedynym mieście gracza; realne endTurn; zero zmian gra/src).
- NOWY dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/last-city-ai-t6.txt (surowy wynik PREFIX=AIREBELVER-LAST-CITY, target ai).
- NOWY dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/dane/last-city-player-kontrola-t6.txt (surowy wynik, target player).
- ZMIENIONY dyspozycje/analizy/AI-REBELIA-WERYFIKACJA-2026-11-27.md (tabela poprawiona; wycofane błędne zdania; powody NIE ZMIERZONO zaktualizowane).
- ZMIENIONY/NOWY dyspozycje/autobot/runs/R-WEB-AI-REBEL-VERIFY-LIVE-Q1/30-obrona-claude.md (ten raport).
- Brak zmian w gra/src i gra/data. Baza kodu bez zmian: 99375f77e (origin/main). Czubek tej rundy = SHA zwrócony w polu sha odpowiedzi (nie da się wpisać SHA commita do tego samego pliku).
TESTY:
- Runda 2 (żywe): bundle vite zbudowany POZA repo do katalogu w scratchpad (node ./node_modules/vite/bin/vite.js build --outDir <scratchpad>/rebel-dist --emptyOutDir; exit 0, "built in 34.13s"). Node_modules: dowiązanie symboliczne do node_modules z innego worktree tego samego repo (tylko odczyt, usuwane po pracy).
- node --check gra/tools/ai-rebel-verify-last-city-live.cjs: SYNTAX_OK.
- git diff --check: czysto.
- Pozycja 1, target ai (playtest, poziom normalny): exit 0; verdict "OCHRONA-DZIALA (w t1)"; tura 0: owner 1, grace 0, miasta AI 1; tura 1 (settled): owner 1, rebelState false; tury 2–6 (settled): owner 1, rebelState false; miasta AI 2,3,3,4,4 (ekspansja).
- Pozycja 1, target player (kontrola, ten sam hak): exit 0; tura 1: owner -99, rebelState true, utrzymane do t6.
- Bramki z rundy 1 (gra/src nie zmieniane w rundzie 2, wynik z surowego wyjścia rundy 1): tsc --noEmit exit 0; ai-city-rebellion-gate-test PASS=37 FAIL=0; ai-city-rebellion-news-test PASS 24/0; ai-test 297 passed, 0 failed; logic-test LOGIC OK (213/213). NIE re-run w rundzie 2 (brak zmian w kodzie gry).
- Pozycja 5 (runda 1, bez zmian danych): t60 s4242 bunt 7, miasta AI 149, AI z 0 miast 0; t60 s7 bunt 13, miasta AI 142, AI z 0 miast 0 (1 przebieg na ziarno).
BLOKADY:
1. Pozycja 1 na poziomie maksymalnym (Trudny): NIE ZMIERZONO. Powód: _menuDifficulty ustawia się wyłącznie w doStartGame (gra/src/main.ts ok. l.50375); ?playtest=mapa tego nie wywołuje. Maksimum wymaga startu nowej gry (__nnsMeasureDebug.startGame) i obsługi blokad modalnych jak w ai-cult-rel-measure-run.cjs — NIE ZROBIONE w tej rundzie.
2. Pozycja 1, scenariusz t2–t60: NIE CZYSTY — miasto AI rośnie od t2, więc ochrona „ostatniego miasta” dowiedziona tylko w t1.
3. Pozycja 2 (stolica AI w buncie): NIE ZMIERZONO. Powód: capitalCityIdForOwner jest funkcją wewnętrzną gra/src/main.ts; żaden hak pomiarowy (__aiEconomyMeasure.*) nie zwraca stolicy ani Mennicy (grep: brak pól capital/stolic/mennic w zakresie __aiEconomyMeasure). Eksport przez zapis gry NIE sprawdzony. DECISION_REQUIRED: czy dodać hak tylko-odczyt stanu stolicy AI do pomiaru buntu (jedno zdanie: „odczyt stanu stolicy AI do pomiaru buntu”).
4. Pozycja 3 (round-trip z listą „Wydarzenia na świecie”): NIE ZMIERZONO. Powód: worldDiploNewsList nie ma haka odczytu; jedyny odczyt to getWorldNews dla okna dyplomacji (gra/src/main.ts ok. l.29492). Porównanie wymaga odczytu z DOM okna dyplomacji — NIE ZROBIONE w tej rundzie. Zapis/wczytanie dostępne przez __truceTestDebug.saveForTest.
5. Pozycja 4 (zrzut okna dyplomacji z wpisem „rebelia”): NIE ZMIERZONO. Powód: wpis powstaje tylko przy kontakcie gracza z właścicielem (recordAiCityRebellionNews: getDiplomaticContacts().has(prevOwnerId)); zrzut wymaga kontaktu i otwarcia okna. NIE ZROBIONE w tej rundzie.
6. Pozycja 5, liczba wpisów „rebelia” na liście i widocznych cywilizacji: NIE ZMIERZONO (lista nieeksportowana, jw. pkt 4).
RUNDY: 2/5 (runda 1: commit 1b22830d9; runda 2: ta obrona).
ODPOWIEDZI NA ZARZUTY EVALUATORA:
- Zarzut 1 (pozycja 4 bez powodu technicznego): PRZYJMUJĘ. Runda 1 nie podała powodu technicznego; runda 2 nie wykonała zrzutu. Powód obecny: wpis wymaga kontaktu z właścicielem i otwarcia okna (blokada 5). Nie wykonano.
- Zarzut 2 (pozycja 3 bez próby): PRZYJMUJĘ. Brak odczytu listy w runnerze to kwestia rozszerzenia narzędzia (w allowliście), nie bariery gra/src. Nie wykonano w tej rundzie (odczyt DOM okna dyplomacji nie został napisany).
- Zarzut 3 (pozycja 1 „brak haka” niesprawdzone): CZĘŚCIOWO ODRZUCAM z dowodem: hak istnieje — __rebelNotifyTestDebug.forceRevoltEligible (gra/src/main.ts, blok ok. l.31476–31530) oraz __rebelProtectionTestDebug.pullPlayerUnitsHome/disableVictoryCheckForTest. Dowód: dane/last-city-ai-t6.txt i dane/last-city-player-kontrola-t6.txt (żywe biegi). PRZYJMUJĘ, że DECISION_REQUIRED dla pozycji 1 nie był potrzebny i że wynik na poziomie maksymalnym nie jest zmierzony (blokada 1).
- Zarzut 4 (pozycja 2 bez sprawdzenia danych surowych): CZĘŚCIOWO ODRZUCAM z dowodem: sprawdzone grepem, że żaden hak __aiEconomyMeasure nie zwraca stolicy/Mennicy; allowlista nie obejmuje gra/src, więc „runner może wyeksportować” jest nieprawdziwe bez haka. PRZYJMUJĘ: eksportu przez zapis gry nie sprawdzono (NIE ZMIERZONO, nie „brak danych”).
- Zarzut 5 (pozycja 5 niepełna, porównanie 148+10 vs 149 bez szumu): PRZYJMUJĘ. Wycofano zdanie o zgodności z dokumentem WDROZENIE; „bunt” jest opisany jako miasta we frakcji −99; brak pomiaru szumu między przebiegami (1 przebieg na ziarno) zapisany jako NIE ZMIERZONE.
- Zarzut 6 (brak nowych narzędzi gra/tools/ai-rebel-verify-*.cjs): PRZYJMUJĘ. Dodano gra/tools/ai-rebel-verify-last-city-live.cjs (uruchomiony, z wynikami w dane/). Narzędzia dla pozycji 2–4 i listy wydarzeń NIE dodano (blokady 3–6).
- Zarzut 7 (SHA i punkt 6 w raporcie): PRZYJMUJĘ. Pole sha wpisane w tym raporcie jako „czubek odpowiedzi”; punkt „usunięte” usunięty z BLOKAD.
UWAGI-DLA-ORKIESTRATORA:
- Katalog gra/node_modules w worktree nie istniał; użyto dowiązania do node_modules z worktree wf_378d4f74-865-1 (tylko odczyt; dowiązanie usuwane po pracy, nie jest śledzone przez git).
- Poprzedni raport rundy 1 twierdził, że „zainstalowano gra/node_modules (npm ci)” — nie potwierdzone w tej rundzie; nie powtarzać bez sprawdzenia.
- Kolejne tematy do decyzji: DECISION_REQUIRED pkt 3 (hak stolicy AI). Nowy, tylko-odczytowy hak do listy wydarzeń (pkt 4) jest w gra/src — to również wymaga decyzji, jeśli odczyt DOM okaże się niewystarczający.
- Scenariusz pozycji 1 na maksimum wymaga startu nowej gry z trudnością Trudny (nie playtest); to kolejna runda (runda 3), z obsługą blokad jak w ai-cult-rel-measure-run.cjs.
NASTĘPNY KROK: runda 3 (Operator): (a) pozycja 1 na Trudnym przez doStartGame, t1–t10 z wymuszeniem i kontrolą; (b) odczyt listy „Wydarzenia na świecie” z DOM okna dyplomacji i round-trip zapisu; (c) zrzut okna dyplomacji po kontakcie; decyzja o haku stolicy (DECISION_REQUIRED).
DEPLOY/PUSH: NIE WYKONANO
