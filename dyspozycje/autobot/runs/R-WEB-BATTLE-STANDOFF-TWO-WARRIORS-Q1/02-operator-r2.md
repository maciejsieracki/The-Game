STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/src/battle)
TEMAT: R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1
GOAL: Odtworzyc zgloszenie "dwoch wojownikow stoi naprzeciw siebie i nie atakuje" (bitwa reczna -> rozegranie automatyczne), znalezc pierwszy zly commit i przyczyne plik:linia, naprawic tylko po pomiarze.
ZMIANY/COMMIT: produkt gra/src BEZ ZMIAN (HEAD 4d1916f2c; `git diff HEAD -- gra/src` puste po mutacji). Commit r2: gra/tools/battle-standoff-two-warriors-test.cjs (komentarz z przyczyna i mutacja), dyspozycje/autobot/runs/R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1/02-operator-r2.md, gate-*-r2.txt. SHA: podany w raporcie orkiestratora po commicie.

ODPOWIEDZI NA ZARZUTY (Evaluator/FC, runda 1):
1. Bisect 2v2 gap3 na 7fdc191ac -- PRZYJMUJE. Zmierzone: na 7fdc191ac AUTO 2v2 gap3 = 6 ciosow, kontakt (minDist 1). To NIE jest zero ciosow, tylko wolniej niz prog 10. Zielony/czerwony wynik zalezy wiec od progu, nie od standoffu. Pierwszy commit z zerem ciosow (standoff) to 682a6b9a0 (potwierdzone r1 i mutacja r2). Dowod: gate-standoff-parent-7fdc191ac-r2.txt.
2. Brak plik:linia przyczyny -- PRZYJMUJE, z korekta. Przyczyna: 682a6b9a0 battleScene.ts:7672 `if (this._canAttackFrom(ru, ru.q, ru.r)) { done(); return; }` w _advanceStep (komentarz 7670-7671): jednostka stojaca przy wrogu konczy aktywacje BEZ ciosu. Naprawa 0d31bc4ec, w HEAD battleScene.ts:7721-7726 (cios z sasiedztwa). ODRZUCAM wskazanie wstawki `steady` jako przyczyny (HEAD battleScene.ts:17222-17225): ta galezia przekazuje do _advanceStep, ktory w HEAD juz zadaje cios z sasiedztwa; sama galezia nie blokuje ciosu. Dowod: HEAD zielony z 6 ciosami; mutacja samego bloku 7721 daje 6/6 FAIL.
3. Harness nie odtwarza sciezki z rozkazami w kolejce / UI -- CZESCIOWO PRZYJMUJE. Dodany dowod: prawdziwe _toggleManualMode() ze stanu "czeka na rozkazy" (roundNo 0) na HEAD: 1v1 gap3 11 ciosow; 2v2 gap3 22 ciosy przy group steady, group manual, unitDoctrine manual i unitDoctrine aggressive (wszystkie kontakt). Kolejkowane rozkazy gracza nie przezywaja przelaczenia: _toggleManualMode czyści playerOrder i _queuedOrderUnitIds (battleScene.ts:16559-16561), wiec ta sciezka nie daje standoffu. NIE_ZMIERZONO: przelaczenie w trakcie tury z zywa kolejka (probe z ta sciezka zapetlil sie przez moj blad w stubie, usunięty), oraz klik w UI przegladarki.
4. Brak naprawy i brak mutacji -- CZESCIOWO PRZYJMUJE. Produktu nie zmieniam, bo na HEAD defektu nie odtworzono; ZADNEJ poprawki bez pomiaru. Mutacja wykonana: wstawienie wczesnego wyjscia z 682a6b9a0 w miejsce 7721-7726 -> 6/6 FAIL (gate-standoff-mutant-682a6b9a0-r2.txt); przywrocenie -> 6/6 PASS (gate-standoff-green-HEAD-r2.txt). Czerwony/zielony na parze 682a6b9a0 vs 0d31bc4ec.
5. Pelny zestaw bitew przed/po -- PRZYJMUJE jako NIE_ZMIERZONO. Brak zmian gra/src, wiec przed = po z konstrukcji; pelnego suite nie uruchomiono w tej rundzie (koszt czasu). Final Control moze zazadac pomiaru.
6. Chromium -- PRZYJMUJE jako NIE_ZMIERZONO. battle-manual-melee-live-test.cjs ma na sztywno /usr/bin/chromium (linia 180); zmiana na /opt/pw-browsers wymagalaby edycji testu, czego nie robilem. Uruchomienie w r1 przekroczylo 580 s.

TESTY (HEAD gra/src, cwd gra/):
- battle-standoff-two-warriors-test.cjs: EXIT=0, 6/6 PASS (gate-standoff-green-HEAD-r2.txt).
- mutacja 682a6b9a0 w 7721: EXIT=1, 6/6 FAIL (gate-standoff-mutant-682a6b9a0-r2.txt).
- 7fdc191ac: EXIT=1, 5/6 PASS, 2v2 gap3 6 ciosow (gate-standoff-parent-7fdc191ac-r2.txt).
- tsc --noEmit: EXIT=0 (gate-tsc-r2.txt).
- battle-melee-attack-doctrine-test: EXIT=0 (gate-doctrine-HEAD-r2.txt).
- NIE_ZMIERZONO: pelny zestaw bitew (diplomacy 148, war-era-counter 82, ring 15, civ-matrix 42/1, ai-test 274/20), Chromium.

BLOKADY: (1) Zgloszenie wlasciciela nie odtworzone na HEAD w zadnej zmierzonej sciezce (AUTO od startu, reczna->AUTO przez _toggleManualMode, unitDoctrine manual/aggressive). (2) Brak pomiaru w przegladarce i pelnego suite. (3) Zgloszenie moze dotyczyc starszego buildu lub kroku, ktorego nie znamy.

RUNDY: 2/5
NASTEPNY KROK: Evaluator/FC: potwierdzic mutacje (7721) i parent 7fdc191ac. Jesli wlasciciel poda dokladne kroki (typ jednostek, czy po zwyciestwie zwyklych tur, build/URL, czy stoi kilka tur), Operator r3 odtwarza je w Chromium z /opt/pw-browsers. Bez tego: DECISION_REQUIRED (pytanie do wlasciciela o kroki i build).
DEPLOY-PUSH: NIE WYKONANO
