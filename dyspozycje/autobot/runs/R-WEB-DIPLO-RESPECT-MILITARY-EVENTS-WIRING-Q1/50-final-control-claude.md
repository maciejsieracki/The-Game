STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
GOAL: zdarzenia Respektu "Przewaga militarna" (+15) i "Slabszy militarnie" (-10) na progu 50% sily wojskowej, jednorazowo na przejsciu progu, widoczne w rejestrze Respektu i na pasku Respektu panelu dyplomacji.
ZMIANY/COMMIT: kandydat 27c5cf58e (potomek 72f06535d i 42a93543a: `git merge-base --is-ancestor` OK dla obu). integration_sha = 27c5cf58e. Zakres diffu vs main 42a93543a: gra/src/main.ts, diplomacy.ts, diplomacy-military-strength.ts, diplomacy-pn-engine.ts, data/diplomacy*.json (prog + opis), wikiBundle.json (regeneracja), docs (respekt.md, moc-podzial.md, 12-dyplomacja.md), testy diplo-respect-military-*, runs/<ID>/**. Odchylenie allowlisty (main.ts, pn-engine) zatwierdzone w DODATKU 1. Brak zmian w WERSJE.md/manifest/rust-port.

TESTY (liczby z surowego wyjscia tej rundy FC, kandydat 27c5cf58e):
- npx tsc --noEmit: exit 0.
- git diff --check 72f06535d 27c5cf58e: czysto.
- diplo-respect-military-offset-test: 12 OK / 0 FAIL. events-test: 30 / 0. edge-test: 12 / 0.
- diplo-respect-military-live-test (Chromium, build vite poza repo, tury 1-30, realny endTurn i tick): 40 OK / 0 FAIL, exit 0. result.json: T2 bar 100 (baza 85 + 15, clamp), T8 bar 99 (baza 84 + 15 < 100, dowod przesuniecia), T9 bar 72 (baza 82 - 10), rejestr zawiera "Slabszy militarnie"; round-trip JSON zachowuje stan B i offset -10; stary zapis = inicjalizacja bez zdarzenia; consoleErrors 0.
- MUTACJA M4 NA REALNYM KODZIE (main.ts: zamiana 'A'->'B' w przypisaniu respektMilOffset, rebuild vite): live test exit 1, 26 OK / 14 FAIL (T2 offset -10 zamiast +15, pasek 75 zamiast 85...). Mutacja cofnieta (git checkout), drzewo czyste.
- Zrzut Chromium (swiezy, z mojego przebiegu): audiencja dyplomatyczna, rejestr "ZA CO CIE LUBIA" zawiera 2x "Przewaga militarna +15", pasek Respekt 99/100. Zrzuty t2/t8/t9 + t15 sa w runs/<ID>/evidence/.
- Bramki referencyjne (kandydat): logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, unit-power 6/0 (wszystkie exit 0).
- Czerwone, IDENTYCZNE NA BAZIE 42a93543a (zmierzone osobno): diplomacy-city-cession-r3 56 pass / 17 fail (kandydat i baza tak samo); diplomacy-stol-pw-sum 167 / 1 (kandydat i baza tak samo); diplo-truce-live 13 pass / 1 fail "endUntilTurn: nie osiagnieto tury 5" (kandydat i baza tak samo, pelny przebieg 560 s); diplomacy-direct-negotiation-live exit 1 "__audienceRelTestDebug.setupListRelationsFixture is not a function" (kandydat i baza tak samo; brak hooka w kodzie). Zielone: diplomacy-border-era-penalty-live (exit 0 na obu). Brak regresji wzgledem bazy.

ROZSTRZYGNIECIE ZARZUTOW:
1. Korekta +15 do paska gracza i do rel.respekt AI (suma 100->130): ODDAL. Pasek gracza (udzial gracza + offset) i rel.respekt AI (udzial AI + offset) to dwie rozne wielkosci, nigdzie nie sumowane; semantyka wynika wprost z dispatchu ("+15 Respektu u AI wobec gracza") i DODATKU 1/2 (pasek ma uwzgledniac korekte, przewaga podnosi pasek). Realne pytanie produktowe (czy znak korekty po stronie bazy AI ma byc odwrocony) zostaje DO POTWIERDZENIA, nie blokuje - patrz UWAGI.
2. Rejestr = dziennik zdarzen, pasek = biezaca korekta: ODDAL. Zachowanie zgodne z decyzja wariantu A (korekta zastepuje sie, zdejmowana w pasmie neutralnym); opisane w respekt.md i poradniku. Zmiana rejestru na wartosc stanu to decyzja produktowa, nie defekt.
3. Testy offset/events/edge to repliki/asercje tekstowe: ODDAL jako blokujacy. Dowod na realnym kodzie istnieje i go potwierdzilem (live 40/0 oraz M4 -> exit 1). Uwaga: live test nie nalezy do zadnego zestawu bramek - patrz UWAGI.
4. Poradnik 12-dyplomacja.md bez opisu zaniku korekty: ODDAL (naprawione w 2dcc7dcd0; zweryfikowane w diffie: "korekta ... trwa, dopoki utrzymuje sie stan progu; po powrocie w pasmo neutralne pasek wraca ...").
5. Sprzeczne zdania w respekt.md: ODDAL (naprawione; grep na kandydacie nie znajduje "niewdrozone"/"usuniete z obowiazujacych" w akapicie Historia; jedyne "nie jest jeszcze wywolywane" dotyczy innego zdarzenia, "Wspolny wrog").
6. Offset = clampowane dR: ODDAL (naprawione: nominal DIPLOMACY_PARAMS +15/-10, clamp 0-100 tylko przy wyswietlaniu w respektZKorektaMilitarna). Kod zweryfikowany w main.ts ~12808. Brzeg (baza >= 86) nie jest w tescie zywym (T2 = dokladnie 100); funkcja clamp jest trywialna (Math.max/min/round) - NIE ZMIERZONO osobnym scenariuszem.
Zarzuty NAPRAW: brak => nie ma podstaw do FAIL.

BLOKADY: brak technicznych.
RUNDY: 4/5 (Operator r4 Sonnet, obrona r4, Final Control); werdykt PASS-WITH-NOTES.
NASTEPNY KROK: integracja orkiestratora kandydata 27c5cf58e na aktualny main (merge origin/main; konflikt spodziewany tylko w gra/src/data/wikiBundle.json - regeneracja narzedziem bundle-wiki-for-game.cjs), potem bramki, READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- DO POTWIERDZENIA przez wlasciciela: (a) znak korekty po stronie bazy AI (rel.respekt AI = udzial AI + 15 przy przewadze gracza), (b) rejestr jako dziennik vs stan, (c) korekta zastepowana/zdejmowana w pasmie neutralnym (wariant A; zapis ABC 2026-11-15 w rejestrze zadan sugeruje juz zatwierdzenie).
- Dlug: diplo-respect-military-live-test.cjs nie jest w zadnym zestawie bramek (wymaga vite + Chromium, ~2-3 min); rozwazyc dopisanie do R-PROC-AUTOBOT.md §Bramki osobnym tematem.
- Dlug pre-existing (identyczne na bazie): city-cession-r3 (17 fail), stol-pw-sum (1 fail), diplo-truce-live (1 fail, tura 5), direct-negotiation-live (brak setupListRelationsFixture).
- Dlug pre-existing (z dispatchu DODATEK 1): zdarzenia +5/+10 (wygrana bitwa, wspolny wrog, trybut) nadpisywane petla AI - osobny temat. Dlug Rust: REPIN.
- Sprzatanie: w worktree wf_1465bf01-f91-4 symlink gra/node_modules (nieśledzony) do usuniecia; /tmp/fc-evid, /tmp/fc-*.out. Dysk wolny 4,8 GB po moich testach.
- Test truce-live nadpisuje sledzony plik dyspozycje/autobot/runs/R-WEB-TRUCE-Q1/evidence/truce-01-modal-rozejm-5.png - cofnalem (git checkout), nie jest czescia commita.
