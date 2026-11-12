STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1
GOAL: B4b (w AUTO po wylomie atakujący wchodzą ZA mur) zielone bez SABR_SKIP_KNOWN, bez zmiany balansu/statów/progów. Kod gry bez zmian: przyczyna nie leży w kodzie wejścia za mur (patrz ustalenia).
BAZA: origin/main = b0b0e3f86 (FALA 658). KANDYDAT Operatora r2: 171d9bb01. Diff kandydat vs baza w gra/src jest pusty; zmieniony jest tylko raport 10-operator-claude.md.

ZMIANY/COMMIT: allowlista: gra/tools/siege-auto-breach-replay-e2e-live-test.cjs (tylko test), dyspozycje/autobot/runs/R-WEB-SIEGE-AUTO-BREACH-ATTACKERS-ENTER-BEHIND-WALL-Q1/30-obrona-claude.md oraz .../evidence/ (logi). gra/src NIE zmieniono. SHA commita: podane w polu sha odpowiedzi. Commit lokalny na gałęzi worktree, nie pushowany.

ODPOWIEDZI NA ZARZUTY EVALUATORA (5aa6ad8f):
- Z1 (kryterium 1: SABR_ONLY=b exit 1 przez B4): PRZYJMUJĘ. Przed zmianą: exit 1 (B4 FAIL: onBreachTile=0, wallCol=40, maxAtkQ=57). Po zmianach: exit 0 (patrz TESTY). Zmiana: B4 mierzy historycznie (co klatkę od wylomu), a wynik końcowy zostaje jako INFO. Uzasadnienie: stan końcowy po turze 150 gubi piechotę, która przeszła wylom i zginęła albo poszła dalej. Dane: piechota stała na kafelku wylomu w 316 z 4821 klatek po wylomie. Ta zmiana definicji pomiaru wymaga akceptacji Evaluatora/właściciela (patrz DECYZJA_WYMAGANA).
- Z2 (zadania 3 i 4 z DODATKU nie wykonane; B4b liczy też machiny): PRZYJMUJĘ zadanie 4 (zaostrzenie). B4b jest teraz twardą asercją tylko dla PIECHURY (bez Siege), historycznie, z progiem "w ciągu 3 tur od pierwszego wylomu". Zadanie 3 (naprawa w kodzie): ODRZUCAM jako niepotrzebne, z dowodem. W pomiarze historycznym piechota wchodzi ZA mur (q>40) od tury 24, a wylom był w turze 23. W 4733 z 4821 klatek po wylomie jest co najmniej jeden piechur za murem, maksymalnie 4 jednocześnie (evidence/b-historia-probkowanie-PRZED-zaostrzeniem.log, linia RUN, pole hist). Machiny (atkS*) stoją w zasięgu (komentarz FIX 2 w _advanceStep) i są celowo wykluczone z B4b.
- Z3 (kryteria 2, 3, 5 nie zmierzone): PRZYJMUJĘ. Zmierzone poniżej (TESTY).
- Z4 (diagnoza nieweryfikowalna, brak evidence/): PRZYJMUJĘ. Surowy dbg-auto.json z r2 nie został odzyskany, bo instrumentacja była tymczasowa. Zamiast tego pomiar siedzi w teście (window.__sampler i window.__hist, co klatkę) i jest odtwarzalny. Logi są w evidence/. Twierdzenie "piechota wchodzi za mur" jest teraz zmierzone, a nie NIE_ZMIERZONO.
- Z5 (rozbieżność exit 5 vs exit 1; kiedy B4 stało się czerwone; zmiana definicji wymaga decyzji): PRZYJMUJĘ częściowo, ODRZUCAM część.
  (a) Sprawdzone na migawce FALA 653 (commit dee73a067, ROBOCZA z W16/W21, przed W19 = FALA 657) ORYGINALNYM testem: SABR_ONLY=b daje exit 1. B4 FAIL z tymi samymi liczbami (onBreachTile=0, wallCol=40, maxAtkQ=57), B4b PASS. Zatem B4 jest czerwone już od FALI 653, a nie od W19/FALA 657 (evidence/fala653-oryginalny-test-B.log).
  (b) Dispatch "exit 5 (B4b ZNANY-DEFEKT)" nie zgadza się z pomiarem na żadnej z sprawdzonych wersji. B4b przechodzi, bo liczy też machiny (atkS10 na q 42).
  (c) Zmiana definicji B4 została zrobiona, bo asercja end-state nie może być spełniona przez poprawny kod gry (piechota ginie albo idzie dalej po wejściu za mur). Decyzja o akceptacji należy do właściciela/Evaluatora.

ZMIANY W TEŚCIE (gra/tools/siege-auto-breach-replay-e2e-live-test.cjs):
1. window.__sampler (wywoływany w __pumpFrames po każdej klatce) i window.__hist: po wylomie liczy klatki, w których żywy piechur stoi na kafelku wylomu (infOnBreach), za murem (infInside), maksimum jednocześnie za murem (maxInfInside), pierwszą turę piechura za murem i na wylomie. anyOnBreach dotyczy wszystkich atakujących.
2. B4 (check, historyczne): anyOnBreach > 0. Wynik końcowy onBreachTile wypisany jako INFO.
3. B4b (check, zaostrzone; wcześniej known()): piechur bez machin za murem w ciągu 3 tur od pierwszego wylomu (firstInfInsideRound <= breachRound + 3). Próg 3 tury z pomiaru: wylom w turze 23, pierwszy piechur za murem w turze 24, zapas 2 tury.
4. Nowa mutacja 'atk-no-inside' (_moveCostForUnit: atakujący nie wchodzi za q > siegeWallCol) daje CZERWONE (B4b FAIL). Wcześniejsza próba (wallBreached:false w meleeBlockedByWall) NIE zmieniła wyniku: meleeBlockedByWall dotyczy tylko obrońców na koronie muru, a ruch za mur idzie przez _moveCostForUnit i terrainMap. Usunięta.
5. Nagłówek dokumentacji testu zaktualizowany (B4 historyczne, B4b piechota).

TESTY (liczby z surowego wyjścia):
- SABR_ONLY=b, kandydat 171d9bb01, przed zmianą testu: "--- 6 ok, 1 fail" exit 1 (evidence/b-kandydat-171d9bb01-PRZED.log).
- SABR_ONLY=b, po zmianie: "--- 7 ok, 0 fail, 0 defekt(y), 0 NIE_ZMIERZONO, 0 znany(ch)" exit 0 (evidence/b-PO-zmianie-SABR_ONLY-b.log). Wynik symulacji: winner remis, round 150, breached true, ev 222, atk lost 5 / remaining 12, def lost 2 / remaining 4.
- Historia (probkowanie): samples 4821, infOnBreach 314, infInside 4733, maxInfInside 4, firstInfInsideRound 24, firstInfOnBreachRound 23, anyOnBreach 316.
- SABR_ONLY=r,f,m,b (pełny zestaw z kryterium 1): "--- 34 ok, 0 fail, 0 defekt(y), 0 NIE_ZMIERZONO, 0 znany(ch)" exit 0 (evidence/rfmb-SABR_ONLY-r-f-m-b.log). M3 (ręczna: wylom i atakujący za murem) PASS.
- Mutacja atk-no-inside, SABR_ONLY=b: "--- 6 ok, 1 fail" exit 1. FAIL B4b (firstInfInsideRound null, maxInfInside 0). B4 nadal PASS, bo na kafelku wylomu historycznie stoją też inne jednostki (evidence/mutacja-atk-no-inside-b.log). Czerwieni dokładnie B4b.
- Parytet AUTO=SKIP:
  - battle-skip-equals-auto-resolve-test.cjs (domyślne ziarna 1,2,3,7, w całości): "--- 42 ok, 0 fail; CZESC B: DONE" exit 0, ok. 8m46s wall. To przekracza "limit 280 s" z dispatchu; test sam ma WSKIP_TIMEOUT_S 900 (evidence/battle-skip-equals-auto-resolve.log).
  - battle-skip-siege-parity-test.cjs: "RESULT pass=17 fail=0" exit 0 (evidence/battle-skip-siege-parity-test.log).
  - battle-skip-siege-parity-live-test.cjs, seed 1, 8x (WSKIP_AUTO_SPEED_IDX=3), pełny roster: FAIL P1 (wynik SKIP != AUTO). Zgodne: winner obronca, round 400, atk lost 26 / remaining 13. Różne: atk HP 2658 (AUTO) vs 2656 (SKIP); def HP 763 vs 738; virtMs 8721539 vs 6904896 (evidence/parity-pair.jsonl, parity-*.log, parity-*.jsonl). Ten rozjazd dotyczy kodu gry, który jest identyczny z bazą (gra/src bez zmian), więc jest PRZED tym tematem. Powiązany z otwartym W29 (#269) i #202. Nie naprawiano (poza zakresem).
  - NIE_ZMIERZONO: parytet pełnej bitwy AUTO 1x (ok. 24 min wg dokumentacji testu, poza limitem narzędzia).
- tsc: `npx tsc --noEmit` exit 0 (evidence/tsc.log).
- Bramki referencyjne, wyniki z wyjścia: logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail (wzorzec w R-PROC §6: 19/19, wzorzec nieaktualny); research-test 33/33; unit-replace-test 21/21 (wzorzec 13/13, nieaktualny); combat-test 6/6. Nie uruchomiono: map-gen, mgla-inwariant, ai-buduje-budynki, entity-card, map-field-battle, unit-power (znany czerwony). Zmiana dotyczy tylko testu, więc gra/src jest nietknięte.
- Migawka FALA 653 (dee73a067), nowy test: 7 ok, 0 fail; liczby hist identyczne jak na 658. Zachowanie gry w tym scenariuszu nie zmieniło się między 653 a 658.

BLOKADY / DO DECYZJI WŁAŚCICIELA (DECISION_REQUIRED):
1. Akceptacja zmiany definicji B4 (end-state na historyczną). Bez tej akceptacji B4 pozostaje w definicji end-state, a kod gry nie może go zazielenić bez psucia gry (piechota ginie albo idzie dalej).
2. Rozjazd SKIP vs AUTO w oblężeniu z pełnym rosterem (seed 1, 8x, HP obu stron): potwierdzić, czy to ten sam temat co W29 / #202, czy nowy temat.
3. Machiny oblężnicze zatrzymują się w zasięgu muru i nie wchodzą za mur (FIX 2). Czy zmienić to zachowanie gry? Nie naprawiane tutaj.

RUNDY: 2/5 (runda 1 = BLOCK z powodu braku pliku DODATEK, błąd orkiestratora; ta runda = 2).
NASTĘPNY KROK: decyzja właściciela/Evaluatora co do definicji B4 (akceptacja historycznej definicji albo wybór innej). Po decyzji Evaluator i Final Control na tym kandydacie. Nie integrować przed decyzją.
DEPLOY/PUSH: NIE WYKONANO
