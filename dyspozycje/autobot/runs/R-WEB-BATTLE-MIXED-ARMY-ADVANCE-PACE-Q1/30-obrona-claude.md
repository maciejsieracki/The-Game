STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1
GOAL: w rozkazie Atak cała armia mieszana (piechota, strzelcy, machiny, konnica) idzie tempem najwolniejszej jednostki do pierwszego wzwarcia wręcz; konnica poza regułą tempa (FALA 554/578); po wzwarciu strzelcy trzymają dystans (zarzut 1 rundy 1).
ZMIANY/COMMIT: obrona rundy 5 (Operator Haiku, odpowiedź na FAIL-ZARZUTY Evaluatora 804fefc94; kandydat wejściowy 17afe955a, baza 81e357dee).
- Commit obrony: fa5d572cb — gra/tools/battle-mixed-army-advance-pace-test.cjs (+11 linii: hook MUTATE_PACE w runMixed, kryterium B3 w checkKite). Brak zmian w gra/src, progach TOL=2 / TOL_RANK1=2 ani w innych plikach.
- Raport: ten plik; SHA końcowy = commit raportu (pole sha zwrotki).
- Allowlista: zgodna (gra/tools/battle-mixed-army-advance-pace-test.cjs, dyspozycje/autobot/runs/R-WEB-BATTLE-MIXED-ARMY-ADVANCE-PACE-Q1/30-obrona-claude.md). Sprawdzone: git status czysty poza commitowanymi plikami.
- Poprzednia treść tego pliku (obrona rundy 2, commit 6ea477041 i wcześniej) jest w historii git; ta wersja zastępuje ją dla rundy 5.

ODPOWIEDZI NA ZARZUTY EVALUATORA (804fefc94):

1. Kryterium 2 (mutacja czerwieniąca dla poprawki tempa) i próg TOL_RANK1=2 nie odróżniają bazy (machiny). — PRZYJĘTY (luka), DECISION_REQUIRED.
   - Potwierdzam: przy TOL_RANK1=2 baza 81e357dee przechodzi A3 (machiny spread 2 <= 2). Nie zmieniłem progu (decyzja ABC).
   - Nowy dowód: hook MUTATE_PACE=1 (kasuje cały sufit tempa, _lineAdvanceCap = Infinity): A1 FAIL (melee spread 11 <= 2), A2 FAIL (archers spread 10 <= 2), A3 PASS (machines spread 2 <= 2). Czyli test wykrywa brak tempa dla piechoty i strzelców, ale przy progu 2 nie wykrywa braku tempa machin. To zmierzony fakt.
   - Pozostaje: próg 1 dla machin (baza 2, poprawka 1) rozstrzygnie to wyłącznie po decyzji właściciela.

2. Zarzut 4 FC (grupa bez piechoty, C1 zielone na bazie, brak mutacji dla warunku groupId) — PRZYJĘTY, NIE_ZMIERZONO (nie domknięte).
   - Mutant: usunięty warunek `(u.groupId ?? '') === (ru.groupId ?? '')` z filtra info.meleeContact (sed na kopii battleScene, plik usunięty po pomiarze). Wynik MEASURE: g2 spread 0,1,2,2,2,2,2,2,2,2,2,2,2 (identyczny z bazą), C1 PASS. Scenariusz C1 nie wykonuje warunku group-scope, więc test nie czerwieni po jego usunięciu.
   - Nie zaprojektowałem nowego scenariusza w tej rundzie (wymaga osobnego projektu: to nie jest mała zmiana). Zostaje otwarte.

3. Kryterium 3 (kite po wzwarciu): tylko manual, pojedynczy łucznik, nieruchomy wróg; AUTO bez kite; B1/B2 zielone na bazie; brak wielu tur. — CZĘŚCIOWO PRZYJĘTY, CZĘŚCIOWO ODRZUCONY.
   - PRZYJĘTE: B1/B2 nie dowodzą poprawki, bo kite nie jest zmieniany w 2d352358d / 17afe955a (mechanizm pre-existing, RANGED KITE w _kiteStep / blok rangedKite). Test kite jest regresją istniejącego mechanizmu, nie dowodem tempa.
   - DODANE: B3 — przy nieruchomym wrogu po 6 rundach ostatni dystans łucznika = 2 (>= MELEE_SAFE_GAP) i po osiągnięciu dystansu nie ma ruchu, który go zmniejsza. Wynik: PASS B3 (final gap 2). Z MUTATE_KITE=1: B1 FAIL (0 ruchów kite), B2 FAIL, B3 FAIL (final gap 1). Na bazie B3 nie zmierzono osobno (kite nie zmieniany, więc spodziewany PASS); nie rozróżnia bazy.
   - ODRZUCONE jako wada testu: „ciągłość w wielu turach" dla AUTO — ścieżka AUTO nie wykonuje kite (zmierzone przez operatora rundy 4; NIE powtórzone w tej rundzie). Naprawa wymagałaby zmiany reguł walki po kontakcie (rozszerzenie kite na _executeGroupDoctrineStep), a dispatch wprost zakazuje zmiany reguł po kontakcie. Zostaje DECISION_REQUIRED: albo zgoda na zmianę reguły AUTO (osobny temat), albo zawężenie GOAL do ścieżki manual.

4. Parytet AUTO=SKIP i testy przeglądarkowe NIE_ZMIERZONO (ryzyko rozjazdu przez info.meleeContact na klonach). — CZĘŚCIOWO PRZYJĘTY (dowód zebrany, nie kompletny).
   - Korekta: Chromium jest dostępny w tym środowisku (/usr/bin/chromium); zależności gra/ zainstalowane przez `npm ci --ignore-scripts` (katalog gra/node_modules, nieśledzony). Evaluator odnotował brak Chromium — w tej sesji go nie było problemem.
   - Wynik battle-skip-equals-auto-resolve-test.cjs (foreground, timeout 585 s): exit 124 (ucięty limitem). Wyjście: D0, D1, D2, D3 PASS (tryb ręczny, skip w trakcie animacji, brak duplikatu aktywacji, kontrola). Część RUN dla seedów 1, 2, 3 (WSKIP_SEEDS domyślnie 1,2,3,7): AUTO i SKIP identyczne — seed 1: round 22, atk lost 28/28, def lost 11/28, hp 524, pursuit 37/5, winner obronca; seed 2: round 26, def lost 12, hp 509, pursuit 44/4; seed 3: round 23, atk lost 17 remaining 11, def lost 28, winner atakujacy, pursuit 40/6. Seed 7 nie został wykonany (limit czasu).
   - Parytet dla seedów 1-3: ZIELONY (dane z surowego wyjścia). Seed 7 i pozostałe testy przeglądarkowe: NIE_ZMIERZONO.
   - Pozostałe battle-*: battle-ranged-approach-regression-test, battle-standoff (w tej rundzie niewykonany ponownie), battle-skip-siege-parity — NIE_ZMIERZONO (limit czasu i zakres rundy).

5. Drobne: odwołanie do nieistniejącej sekcji „ZAPIS PROGU niżej" i brak konkretnego SHA. — PRZYJĘTY, naprawiony.
   - Ten raport nie odwołuje się do nieistniejących sekcji; SHA podane poniżej i w polu sha zwrotki.

POMIAR (surowe wyjścia, ta runda, kandydat 17afe955a + commit fa5d572cb):
- tsc --noEmit (gra): exit 0.
- battle-mixed-army-advance-pace-test.cjs (fa5d572cb): PASS A1 (melee spread 0 <= 2), PASS A2 (archers 0 <= 2, regresja), PASS A3 (machines 1 <= 2), PASS A4 (archers advance, min q 25 > 2), PASS B1 (6 kite moves), PASS B2, PASS B3 (final gap 2 >= 2), PASS C1 (g2 spread 2 <= 2). Exit 0.
- MUTATE_KITE=1: A1-A4 PASS, FAIL B1 (0 kite moves), FAIL B2, FAIL B3 (final gap 1), C1 PASS. Exit 1 (czerwieni kite).
- MUTATE_PACE=1: FAIL A1 (11 > 2), FAIL A2 (10 > 2), PASS A3 (2 <= 2), PASS B1-B3, C1. Exit 1.
- Mutant group-scope (sed na kopii battleScene.mut-group.ts, usunięty): MEASURE g2 spreads 0,1,2,2,...,2; C1 PASS. NIE czerwieni.
- battle-line-advance-uniform-test.cjs (W19): exit 0, 17 PASS, 0 FAIL.
- battle-skip-equals-auto-resolve-test.cjs: exit 124 (limit), D0-D3 PASS, RUN seedy 1-3 identyczne AUTO vs SKIP, seed 7 NIE_ZMIERZONO.
- Bramki referencyjne (logic 213/213, tech-tree 20/20, research 33/33, unit-replace 21/21, combat 6/6) nie były ponownie uruchamiane w tej rundzie: NIE_ZMIERZONO (zmiana w tej rundzie dotyczy wyłącznie pliku testu; gra/src nie zmieniono).

TESTY:
- Wyżej. Wszystkie wyniki liczbowe pochodzą z surowego wyjścia tej sesji.

BLOKADY:
- DECISION_REQUIRED (ABC właściciela, A): próg machin TOL_RANK1 = 2 nie czerwieni bazy ani braku tempa machin (A3). Opcje: (a) zostawić 2 i uznać mutację machin za NIE_ZMIERZONO; (b) próg 1 dla machin (zmierzone: baza 2, poprawka 1) — zmiana progu wymaga zgody właściciela.
- DECISION_REQUIRED (ABC właściciela, B): kite strzelca po wzwarciu w ścieżce AUTO nie działa (zmierzone w rundzie 4). Opcje: (a) osobny temat zmieniający regułę po kontakcie w AUTO (łamie zakaz z dispatchu bez zgody); (b) zawężenie GOAL do ścieżki manual.
- NIE_ZMIERZONO: mutacja group-scope (zarzut 2) — C1 nie czerwieni; wymaga nowego scenariusza.
- NIE_ZMIERZONO: seed 7 testu battle-skip-equals-auto-resolve oraz pozostałe testy przeglądarkowe (ranged-approach, standoff, skip-siege-parity).
- NIE_ZMIERZONO: bramki referencyjne po tej rundzie.

RUNDY: 5/5 — ostatnia runda obrony przed Final Control; wg dispatchu limit 5 rund osiągnięty w tej rundzie (wejście w rundzie 4, obrona r5). Decyzje A i B wymagają właściciela, nie kolejnej rundy Operatora.
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje commit fa5d572cb (B3 i hook MUTATE_PACE) i ten raport. Orkiestrator: decyzja ABC A (próg machin) i B (kite AUTO / zawężenie GOAL) przed FC; bez decyzji temat zostaje PASS-WITH-NOTES, bez READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
