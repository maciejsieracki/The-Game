STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-PACE-EQUAL-LINE-LIVE-BUG-Q1
GOAL: Rowne tempo = w kazdej turze marszu do pierwszego wzwarcia wrecz roznica miedzy najszybsza a najwolniejsza jednostka armii <= 1 hex; sufit obejmuje piechote, strzelcow, konnice i machiny (decyzja wlasciciela 2026-11-13, DODATEK runda 2). Kod silnika (battleScene.ts) bez zmian w tej obronie; poprawiany jest dowod (test).

## Baza
- Start: c3ebc5440 (kandydat Operatora). Kod src/ nie zmieniany: `git diff --stat c3ebc5440 HEAD -- gra/src` puste.
- Jedyny zmieniony plik: gra/tools/battle-pace-equal-line-live-test.cjs.
- Commit kodu/testu: 5b1e51945. Commit tego raportu: SHA koncowy w polu sha (wiadomosc zawiera ten sam ID).
- Lokalnie doinstalowano zaleznosci gra/node_modules (`npm ci --ignore-scripts`, bez build/dev). Katalog ignorowany przez git.

## Odpowiedzi na zarzuty Evaluatora
1. Test mierzy tylko strone atakujaca -- PRZYJMUJE (dowod symetrii, nie pomiar ruchu obroncy).
   Obronca w symulacji stoi (obserwacja: wspolrzedne def-infantry-0..2 identyczne w turach 0-4, rowniez po ustawieniu doktryny steady, sprawdzone probe-em). Przebyte hexy obroncy nic wiec nie dowodza. Zamiast tego dodano check `paceCapSymmetry`: po 1 turze, przed kontaktem, KAZDA jednostka obu stron ma sufit = najmniejsza pula ruchu swojej strony (wywolanie _paceCapFor). Wynik: 12/12 PASS, sufit = 2 (piechota) dla obu stron i wszystkich 6 skladow.
2. Scenariusz dobrany tak, by uniknac kolizji; uklad zblizony do zrzutu NIE_ZMIERZONO -- PRZYJMUJE CZESCIOWO. Dodano dwa sklady "L": dense_infantry_archers (20 wierszy piechoty + 20 lucznikow na strone, dwie grupy top/bottom) i dense_full_mixed (+ konnica i machiny). Przy pierwszym uruchomieniu dense_full_mixed FAIL: max roznica 2 w turze 1 -- przyczyna: konnica atk-cavalry-1 byla postawiona W BLOKU piechoty (10,29), nie moze sie ruszyc, 0 hexow. To blad mojego ukladu testu, nie silnika; poprawione: konnica i machiny L na wierszach poza blokiem (konnica -2 i 21, machiny -1 i 20). Po poprawce 0 tur z roznica >1 we wszystkich skladach. Nie jest to odtworzenie zrzutu (dwie kolumny ~20 jednostek z roznymi zasiegami); NIE_ZMIERZONO na zrzucie wlasciciela.
3. Teren plaski (moveCost=1), _doMove zastubowany -- NIE_ZMIERZONO, nie zmieniam w tej rundzie. Powod: stub wykonania w runSim robi `u.moveLeft--` za kazdy hex i ignoruje koszt terenu, wiec zroznicowany teren nie jest w tym harnessie modelowany. Sufit liczony jest w punktach ruchu (_paceCapFor -> moveLeft), nie w hexach; to jest realne ryzyko dla metryki 1 hex na terenie. DECYZJA_REQUIRED (ABC): czy metryka ma byc w hexach (wymaga zmiany silnika) czy w punktach ruchu.
4. K3 (Chromium 1920x1080, zrzuty przed/po) niewykonane -- ODRZUCAM jako wymog tej rundy. Dowod: DODATEK runda 2 (dispatch, sekcja ZADANIE/KRYTERIA KOŃCA) nie zawiera K3; wymaga "test na zywo-symulacji" headless i "mutacja czerwieni test". K3 pozostaje NIE_ZMIERZONO na zywo.
5. Okno pomiaru konczy sie przy dystansie <12 hexow -- PRZYJMUJE. Okno zmienione: pomiar trwa dopoki zadna para jednostek WRECZ (piechota, konnica) nie stoi w odleglosci <= 1 hex (perRoundTravel: `if (minGap <= 1) break`, strzelcy/machiny nie koncza okna). Uwaga: wszystkie sklady nadal daja 12 tur pomiaru, bo symulacja konczy sie po ROUNDS=12, zanim dojdzie do wzwarcia. Pelne pokrycie "do wzwarcia" wymagaloby ROUNDS > 12 (czas) -- NIE_ZMIERZONO poza 12 turami.
6. Mutacje czesciowo sie pokrywaja; mutacja "sufit tylko dla grupy 1 / od pozycji lidera" nie testowana -- PRZYJMUJE CZESCIOWO. Dodano mutacje K2 "sufit tylko dla grupy gornej (bottom wylaczona)" -> czerwieni 16 tur. Wariant "od pozycji lidera" NIE_ZMIERZONO (wymaga innej mutacji formuly, nie predykatu klasy).
7. Test W40 (battle-mixed-army-advance-pace-test.cjs) nie istnieje -- ODRZUCAM jako zarzut do tej rundy, ale zgadzam sie z ryzykiem integracji. Dowod: `ls gra/tools | grep battle-mixed-army-advance-pace-test` w c3ebc5440 -> brak pliku; w gra/tools jest tylko battle-large-mixed-doctrine-matrix-test.cjs. DODATEK nie wymaga W40. Ryzyko dla orkiestratora: przy integracji W40 moze powstac duplikat logiki sufitu (_paceCapFor vs W40).
8. battle-skip-equals-auto-resolve-test trwa 4m43s -- ODRZUCAM jako zarzut do tej rundy. Dowod: od c3ebc5440 nie zmieniono src/, wiec wynik tego testu nie zmienia sie; czas to pomiar maszyny, nie regresja. Nie uruchamialem go ponownie (zmiana dotyczy wylacznie pliku testu).

## ZMIANY-COMMIT
- 5b1e51945 -- gra/tools/battle-pace-equal-line-live-test.cjs (62 insertions, 10 deletions):
  - KINDS: infantryL, archerL (20 wierszy), cavalryL, siegeL (poza blokiem).
  - runSim: 20 wierszy dla skladow z infantryL; zwraca {frames, scene}.
  - perRoundTravel: okno = do wzwarcia wrecz (minGap melee <= 1).
  - paceCapSymmetry(): sufit obu stron (atk i def) = min pula strony, przed kontaktem.
  - COMPOSITIONS: +dense_infantry_archers, +dense_full_mixed.
  - MUTATIONS: +"sufit tylko dla grupy gornej (bottom wylaczona)".
  - Mutacje liczone na full_mixed i dense_full_mixed (skrocenie czasu).
  - PART=base,sym: tryb bez mutacji (opcjonalny, do podzialu na krotsze Bash).
- Kod silnika: bez zmian (battleScene.ts identyczny z c3ebc5440).

## TESTY (surowe wyjscie)
- `node ./node_modules/typescript/bin/tsc --noEmit` -> TSC_EXIT=0
- `node tools/battle-pace-equal-line-live-test.cjs` (pelny przebieg, bez PART) -> `=== battle-pace-equal-line-live-test: 23 pass, 0 fail ===`, EXIT=0, real 6m57s
  - PASS infantry/atk, infantry_archers/atk, infantry_archers_cavalry/atk, full_mixed/atk, dense_infantry_archers/atk, dense_full_mixed/atk: 0 z 12 tur z roznica > 1 hex (max roznica 0)
  - PASS symetria sufitu x12 (6 skladow x atk/def): sufit = 2 = min pula strony
  - PASS mutacja "sufit wylaczony dla piechoty": 22 tury czerwone
  - PASS mutacja "sufit wylaczony dla strzelcow": 4
  - PASS mutacja "sufit wylaczony dla konnicy": 16
  - PASS mutacja "sufit wylaczony dla machin": 4
  - PASS mutacja "sufit tylko dla grupy gornej (bottom wylaczona)": 16
- Zanim poprawiono uklad konnicy L (przebieg diagnostyczny): dense_full_mixed FAIL, max roznica 2 w turze 1 (atk-cavalry-1 at (10,29) -> (10,29), d=0). Ten FAIL jest powodem zmiany ukladu, nie regresja silnika.
- Pomiar (MEASURE=1, dense_full_mixed po poprawce): tura 1-12: min=2 max=2 roznica=0 (infantryL[2] archerL[2] cavalryL[2] siegeL[2]).
- Bramki z dispatchu/DODATKU (logic-test, tech-tree, research, unit-replace, combat, W19, cavalry-flank, deploy-cavalry-flanks, standoff, skip) NIE uruchamiane ponownie w tej obronie: src/ nie zmienione od c3ebc5440, a Evaluator podal ich wyniki na tym samym kodzie (nie sa dowodem dla samego pliku testu).

## BLOKADY
- DECYZJA_REQUIRED (ABC): metryka tempa na terenie (hexy vs punkty ruchu) -- punkt 3.
- NIE_ZMIERZONO: K3 w Chromium; zrzut wlasciciela (układ ~20 w dwoch kolumnach); teren zroznicowany; pelne pokrycie do wzwarcia (>12 tur); wariant mutacji "od pozycji lidera".

## ZALOZENIA
1. Metryka = hexy przebyte w turze (|dq|+|dr|), jak w poprzedniej rundzie.
2. Obronca nie porusza sie w tej symulacji (silnik trzyma obrone); symetrie sufitu sprawdzam bezposrednio z _paceCapFor, nie przez ruch.
3. Pierwszy ruch zwykle 2 hexy dla piechoty; roznica 1 w turze 1 (zaobserwowana w r2 operatora) nie wystapila w tej wersji ukladu.
4. Test dziala w headless z produkcyjna petla tury (_beginTurn + AUTO batch) i stubem _doMove (bez kosztu terenu).

## RUNDY
Obrona (Operator) runda 1 tej obrony; numeracja rund tematu wg DODATKU: runda 2 pozostaje aktualna. Nie zwiekszam licznika.

## NASTEPNY KROK
Evaluator (ponowna weryfikacja 5b1e51945 + ten raport) -> Final Control. Osobny temat (po ABC): metryka hex vs punkty ruchu na terenie; osobny temat LIVE-VERIFY w Chromium (K3). Ostrzezenie: pelny przebieg testu trwa ~7 min (granica 590 s Bash); PART=base,sym dzieli go na dwie krotsze czesci.

DEPLOY/PUSH: NIE WYKONANO
