STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1
GOAL: ustalić liczbami, ile testów live blokuje ekran powitalny / bramka „Zakończ turę”, i naprawić je wspólnym helperem (z mutacją czerwoną). Runda 2 (obrona): odpowiedź na zarzuty Evaluatora z 20-evaluator-claude.md.
ZMIANY-COMMIT: baza kandydat 1cdc32d99 (checkout detach). Zmienione tylko: dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md (nowa sekcja 7 z korektą), dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/30-obrona-claude.md, dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/probe/ (sondy probe-welcome.cjs, probe-gate.cjs i ich wyjścia out-*.txt). Zero zmian w gra/src, gra/data, gra/tools (_live-ready.cjs i *-test.cjs bez zmian). SHA: czubek commita obrony (pole sha).
TESTY (surowe wyjścia w probe/*.log, uruchomienia na buildzie bazowym 6319eaf66 poza repo):
  build: vite build do scratchpadu, 21.84 s, index.html 15 038 140 B, bez błędów.
  Sonda 1 probe-welcome.cjs (seed 4242, Maly, 8 endTurn, bez helperów): ekran powitalny OTWARTY w turach 1–9 (welcomeOpen=true w 9/9 próbek); przycisk „Zakończ turę” zasłonięty w 9/9 (elementFromPoint trafia w #civ-welcome-screen-root); tura 1 → 1 po 8 endTurn (canEnd=false, gate=true). pageerrors=0.
  Sonda 2 probe-gate.cjs mode bare (bez helperów): klik timeout 4000 ms, przycisk aria-disabled=true; tura 1 → 1 po 3 endTurn. CLICK-FAIL.
  Sonda 2 mode gateonly (bramka przygotowana prepareEndTurnGate, ekran NIE zamknięty): klik timeout 4000 ms, przycisk aria-disabled=false, welcomeOpen=true → MUTACJA CZERWONA (ekran zasłania klik). endTurn hakiem: tura 1 → 2 → 3 (ekran nie blokuje hooka).
  Sonda 2 mode full (closeCivWelcome z repo + prepareEndTurnGate + klik): closed=2, klik CLICK-OK, tura 2; endTurn 3, 4, 5. pageerrors=0. → ZIELONA.
  Gate: prepareEndTurnGate na starcie: gateBefore.blokada=true, skarbiec prognoza −2, zasób skarbiec, canEnd z false na true (changed=true).
  tsc / logic 213 / ai-test 297: NIE ZMIERZONO (kandydat nie zmienia kodu gry; brak uruchomienia bramek w tej rundzie).
BLOKADY: brak blokad procesu. Świadomie NIE zrobiono (patrz odpowiedzi na zarzuty): przepięcia testów na helper i ponownego biegu 26 testów z próbki.
RUNDY: 2/5 (runda 1: FAIL Evaluatora → runda 2: ta obrona)

ODPOWIEDZI NA ZARZUTY EWALUATORA:
1. PRZYJMUJĘ (częściowo zweryfikowane). Bramka tury zbadana sondą: na seedzie 4242/Maly tura 1 jest zablokowana bramką (skarbiec −2, canEnd=false); hak endTurn bez prepareEndTurnGate nie przesuwa tury. Testy end-turn-gate-live-test, end-turn-block-event-live-test, forced-war-*, era-change-toast, diplo-truce, sidepanel-diplo NIE uruchomione ponownie w tej rundzie. Ich klasyfikacja „inny powód” pozostaje NIE ZWERYFIKOWANA dla tych testów; forced-war i era-change używają playtest=mapa i innego startu — NIE ZMIERZONO, czy bramka tam blokuje.
2. PRZYJMUJĘ. Próbka nie była reprezentatywna; zero trafień w logach nie dowodziło braku blokady. Dowód zamiast tego: sonda na żywej grze pokazuje, że ekran jest otwarty od tury 1 (9/9 próbek) i zasłania klik. Testy z closeCivWelcome (army-panel-general-label-multiselect-live-test, live-nns-gate-smoke-test, civ-welcome-screen-brand-live-test, diplo-forced-peace-d2-live-test, hotseat-etap5-no-leak-test) NIE uruchomiono w tej rundzie. Grep „closeCivWelcome|civ-welcome” daje 6 plików; civ-welcome-screen-test.cjs to test logiki w Node, bez przeglądarki.
3. PRZYJMUJĘ. Klasyfikacja 3/12/4/7 z rundy 1 nie była zweryfikowana surowymi logami (logi nie zostały zachowane) i nie jest ponownie zmierzona. Nie bronię jej jako dowodu „0 blokowanych”. Wniosek „0 blokowanych” wycofuję: sonda pokazuje, że ekran powitalny i bramka blokują kliki w teście startującym przez civTest.
4. PRZYJMUJĘ (częściowo). Mutacja wykonana na żywym buildzie (sonda gateonly: klik czerwony bez zamknięcia ekranu, zielony po closeCivWelcome+prepareEndTurnGate w mode full). NIE wykonano przepięcia testów na helper: kryterium binarne z dispatchu NIE jest spełnione. Powód: testy kliknięcia mają różne ścieżki startu (civTest, kreator, playtest=mapa, hotseat), każdy bieg 190–280 s; w tej rundzie zmierzono ścieżkę civTest/seed 4242 i nie przepinano testów bez ich biegu. To zostaje jako następny krok.
5. PRZYJMUJĘ. Poziom maksymalny nie został zmierzony. Sondy używają domyślnych parametrów startGame (seed 4242, Maly, 15 cywilizacji, 2 państwa-miasta). Poziom uznany za maksymalny: NIEJEDNOZNACZNY — haki nie wystawiają suwaka Praca na ulepszenia ani najwyższej trudności w tym starcie. NIE ZMIERZONO na poziomie maksymalnym.
6. PRZYJMUJĘ. Surowe logi rundy 1 nie zostały zachowane; liczby 3/12/4/7 nie są zweryfikowane. Surowe wyjścia sond rundy 2 są w probe/out-*.txt; skrypty sond to probe/probe-welcome.cjs i probe/probe-gate.cjs.
7. PRZYJMUJĘ. Rozbieżność 102 vs 369 nie została rozstrzygnięta: 102 to szacunek z dispatchu (testy z kliknięciem w UI i Chromium), 369 to liczba plików z launch/chromium/playwright w grep rundy 1; 200 „bez kliknięcia” i 194 „vite” to dopasowania tekstowe. Nie traktuję ich jako pomiaru.
8. PRZYJMUJĘ. Liczba plików obsługujących ekran powitalny: 6 po grepie (w tym civ-welcome-screen-test.cjs, test logiki bez przeglądarki), 3 realnie wywołujące closeCivWelcome w grze (army-panel x2 wywołania w jednym pliku, live-nns-gate-smoke) — poprawiam „5” na „6 plików (wg grep)”.

NASTĘPNY KROK (dla orkiestratora, nie wykonane tutaj):
- Osobny temat R-WEB-LIVE-TESTS-WELCOME-GATE-Q2: przepiąć testy z page.click('.civ-bottom-bar .end-turn') na wspólny ensureGameReady (closeCivWelcome + prepareEndTurnGate przed klikiem) w batchu, z biegiem każdego przepiętego testu i mutacją czerwoną; najpierw 5 testów z civTest (seed 4242), potem kreator/playtest.
- Ustalić, czy bramka blokuje playtest=mapa (forced-war-*, era-change-toast) jednym odczytem gateInfo.
- Decyzja o poziomie „maksymalnym” dla startGame (haki nie wystawiają suwaków) — zgłosić właścicielowi tylko jeśli wpływa na grę; to decyzja testowa, orkiestrator.
- Zachować surowe logi biegów w probe/ (nie tylko podsumowania).
UWAGI-DLA-ORKIESTRATORA: (1) Ekran powitalny otwiera się na starcie gry (tura 1), nie dopiero przy kontakcie — popraw wniosek w dokumencie rundy 1 (dodano sekcję 7). (2) Na seedzie 4242/Maly bramka blokuje turę 1 (skarbiec −2): każdy test klikający koniec tury w tym starcie potrzebuje prepareEndTurnGate. (3) Build w gra/node_modules (npm ci --ignore-scripts) usunięty po pracy; build w scratchpadzie usunięty.
DEPLOY/PUSH: NIE WYKONANO
