STATUS: DECISION_REQUIRED
DOMAIN: GAME (generator map)
TEMAT: R-WEB-MAP-RIVER-GEN-SEP1-Q1 (RIVERS3B) — obrona Operatora, runda 2/5
GOAL: odstęp rzek głównych 1 pole + naprawa ujść bez spadku liczby średnich rzek; testy rzek przepięte; wydajność zmierzona.
BAZA: cb18bff7c (origin/main); KANDYDAT: 49659069769075e74186f811dde8da41ffc411ab (commit 496590697)

ZMIANY-COMMIT:
- gra/src/map/gen-helpers.ts: tylko komentarz przy MEDIUM_RIVER_MIN_PATH_SEP (treść pomiaru zamiast błędnego uzasadnienia „kryterium medium ≥ baza”). Zero zmian zachowania.
- gra/tools/river-turn-window-test.cjs: asercja „soft sep dist=2” była zakodowana na stałej MAIN (3); po zmianie 14C test wpadał w czerwony. Zmieniono na jawną wartość 3 (dwie stare asercje zachowane) + nowa asercja dla MAIN=1 (dist=2 dozwolony). Asercji nie osłabiono.
- docs/obieg/MAPA-RZEKI-SPEC.md §2: odstęp 1 (decyzja 14C), pomiar, skutki uboczne, ujścia, bufor od morza.
- docs/obieg/MAPA-KANON-GENERATOR.md: wiersz o odstępie głównych nurtów z odsyłaczem do SPEC.
- SHA: patrz pole sha w StructuredOutput (commit z tymi plikami i raportem).
- Pozostaje bez zmian (kod z kandydata): RIVMOUTH (gen-helpers.ts, river-mouth-gap-enforce-test.cjs), MAIN_RIVER_MIN_PATH_SEP = 1, MEDIUM_RIVER_MIN_PATH_SEP = 3. Nie wprowadzono nowej poprawki średnich/dopływów (patrz ODPOWIEDZI, zarzut 1–2).

ODPOWIEDZI NA ZARZUTY EVALUATORA (f862ef79):
1. PRZYJMUJĘ. Potwierdzone własnym pomiarem (ta sama metodyka co zarzut 7): kontynenty s7 medium 29→12, s42 16→13. Próba: MEDIUM_RIVER_MIN_PATH_SEP 3→1 (kopia kandydata, bez innych zmian): medium s7 17, s42 11, s1 13, pangea s7 24. Obniżenie odstępu średnich NIE przywraca liczby. Przyczyna (wskazana, nie w pełni udowodniona): gęstsze główne nurty zajmują heksy, na których średnie szukają korytarza długości min. 7 (`mediumTributaryMinNetLen`). Poprawka wymagająca zmiany kolejności generacji (średnie przed głównymi) lub limitu gęstości main jest zmianą mechaniki generatora — decyzja właściciela, nie wdrożyłem.
2. PRZYJMUJĘ. Dopływy s7 18→2, s42 12→0 (po zmianie: 0–11% bazy). Próba z MEDIUM sep 1 daje dopływy 0/0/1/0 (s7/s42/s1/pangea): odstęp średnich nie jest przyczyną. Przyczyna: zajęcie heksów przez main (jak w 1). Brak poprawki w tej rundzie — wariant decyzji poniżej.
3. PRZYJMUJĘ jako fakt, nie jako błąd kodu w tej rundzie. `river-mouth-gap-enforce-test` 3/1: kontynenty s42 luka ujść 11 > limit 7 (asercja NIE osłabiona). Złagodzenie limitu do 15/20 jest decyzją produktową — DECISION_REQUIRED (wariant B niżej). Pangea s7 (w bazie luka 15) po zmianie przechodzi.
4. PRZYJMUJĘ. Etap 4 uzupełniony w zakresie możliwym w tej rundzie (wyniki w tabeli TESTY); pozostałe testy NIE ZMIERZONO z przyczyny czasu (lista niżej). Piny NIE przepinano: żaden test nie został uznany za czerwony z powodu pina; jedyny przepięty kontrakt to asercja MAIN=3 (zob. ZMIANY).
5. PRZYJMUJĘ. Czas: pomiar przeplatany (base/cand, 3 powtórzenia) — wyniki poniżej. +12% NIE potwierdzone; na 84×60 różnica mieści się w szumie. Jedno powtórzenie 168×120 s42: baza 59,0 s, kandydat 118,8 s (2,3× więcej głównych nurtów) — to może być realny koszt, wymaga powtórzeń na nieobciążonej maszynie (maszyna: load avg ~5 na 4 rdzeniach, obce procesy Chromium/node).
6. PRZYJMUJĘ. Dokumentacja zaktualizowana (ZMIANY). Liczby w docs = liczby z tabeli POMIAR tej rundy.
7. PRZYJMUJĘ. Raport Operatora r1 podawał bazę s7 42/22/11 i inne liczby bazowe, których nie udało się odtworzyć. Jedna metodyka (poniżej: jeden skrypt measure.cjs, jeden przebieg na każdy punkt, ta sama opcja „Standardowy”, worldDensity medium) daje bazę s7 40/29/18 — zgodnie z Evaluatorem. Tabela r1 jest nieaktualna.

POMIAR LICZBY RZEK (jedna metodyka, jeden przebieg; liczby z surowego wyjścia measure.cjs):
| mapa | baza cb18bff7c main/medium/trib | kandydat 49659069 main/medium/trib | kandydat, medium sep 1 (eksperyment) main/medium/trib |
| 84x60 kontynenty s7 | 40/29/18 | 106/12/2 | 106/17/0 |
| 84x60 kontynenty s42 | 45/16/12 | 102/13/0 | 102/11/0 |
| 84x60 kontynenty s1 | 47/25/8 | 96/16/2 | 90/13/1 |
| 168x120 kontynenty s42 | 120/42/67 | 274/18/12 | nie mierzono |
| 84x60 pangea s7 | 23/11/0 | 21/14/0 | 21/24/0 |
Główne: ×2,0–2,3 (cel osiągnięty). Średnie: 40–81% bazy (cel ≥100%) — NIE SPEŁNIONE. Dopływy: 0–11% bazy (cel ≥50%) — NIE SPEŁNIONE.

POMIAR CZASU (generateMap, kontynenty 84×60, przeplatane base/kand, ms; obciążona maszyna):
- s42: baza 12041 / 12228 / 11395 (mediana 12041); kandydat 10961 / 11377 / 11238 (mediana 11238) — różnica mediany ok. −7%, w granicach szumu.
- s7: baza 4497 / 4956 / 4524 (mediana 4524); kandydat 4882 / 10742 / 4112 (mediana 4882) — jeden wynik 10742 ms to szum; NIE ROZSTRZYGNIĘTE.
- 168×120 s42 (1 przebieg): baza 59022 ms, kandydat 118788 ms — NIE ZMIERZONO rzetelnie (obciążenie), ale wskazuje możliwy wzrost kosztu przy 2,3× większej liczbie głównych nurtów.
Wniosek: deklarowane +12% wydajności NIE POTWIERDZONE.

TESTY (surowe wyniki; kandydat po zmianach tej rundy, chyba że zaznaczono):
- tsc --noEmit (gra/): exit 0.
- medium-river-test: 38 pass / 0 fail (33 s).
- river-density-test: 2 passed / 0 failed (110 s).
- river-turn-window-test: BAZA 10 pass / 0 fail; kandydat przed poprawką testu 9 pass / 1 fail (FAIL: „soft sep: krok przy dist=2”, asercja z MAIN=3); po poprawce testu 11 pass / 0 fail.
- river-fog-visibility-test: 31 pass / 0 fail.
- river-sea-buffer-test: BAZA 6 pass / 3 fail (kontynenty s42 bufor: 10 złych heksów; ujścia s42 worst 18; pangea s7 ujścia worst 15). KANDYDAT 6 pass / 3 fail: kontynenty s42 bufor 19 złych (gorzej); ziemia s99 bufor 1 zły (NOWY — regresja); ujścia s42 worst 11 (lepiej); pangea s7 ujścia OK (lepiej). Test czerwony w bazie; po zmianie pojawia się nowe naruszenie bufora od morza — zgłaszam jako regresję do decyzji (RIVSEATEST #167). Nie naprawiałem: wymaga zbadania ścieżek main przy odstępie 1.
- river-mouth-gap-enforce-test: 3 pass / 1 fail (wynik Operatora r1 i Evaluatora; NIE uruchamiałem ponownie w tej rundzie — kod generatora bez zmian).
- river-grid-coverage-test: BAZA i kandydat przerwane limitem 560 s, nie dokończone. W wyjściu obu: FAIL „max suchy płat nizin ≤30 hex” (baza 178, kandydat 185) — błąd istniał w bazie. Pozostałe wypisane asercje PASS w obu (≥40 startów, 0 tras bez ujścia, hierarchia 3 etapów, siatka 5×5 ≥85%, siatka mas ≥75%). NIE ZAMKNIĘTE.
- map-continents-rivers-test: przerwany limitem 180 s, bez wyniku. NIE ZMIERZONO (do ponownego uruchomienia z dłuższym limitem).
- river-path-adjacency-test: w r1 przekroczył 580 s; w tej rundzie NIE ZMIERZONO.
- river-loop-test: 7/0 w r1 i Evaluator (kod nie zmieniany w tej rundzie); NIE uruchamiałem ponownie.
- NIE ZMIERZONO w tej rundzie: river-map-scale-test, map-gen-regression-test, world-density-test, earth-template, map-coast-buffer, cluster-plan-name, determinism-save-load, river-sea-buffer (ponad wynik powyżej), bramki ogólne (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0, war-rules-multiwar-main-guard 21/0). Powód: czas maszyny (obciążona) i limit 590 s na wywołanie.
- Nowy test z mutacją czerwoną: NIE WYKONANO (zmiana testu to przepięcie kontraktu, nie nowa funkcjonalność).

PINY MAP-ZALEŻNE: NIE PRZEPINANO. Żaden test nie został przepięty na nową wartość; tabela zmian pinów: brak.

BLOKADY / DECISION_REQUIRED (jedno zdanie konfliktu per wariant; rozwiązania nie wdrażam):
1. Średnie i dopływy (zarzuty 1–2). Odstęp głównych 1 podwaja główne nurty, lecz zajmuje heksy, których potrzebują średnie i dopływy.
   (a) akceptacja spadku średnich do 40–81% i dopływów do 0–11% bazy (zmiana gry: mniej rzek średnich i dopływów);
   (b) zmiana kolejności generacji: średnie i dopływy przed głównymi nurtami (większa przebudowa generatora, zmienia układ wszystkich map);
   (c) odstęp 1 tylko dla części map albo osobny próg gęstości dla głównych (mniejszy zakres, ale mniej przewidywalna mapa).
   Konsekwencje testowe: (a) przepina testy medium/trib i piny; (b) przebudowa większości testów generatora; (c) testy dwóch zestawów map.
2. Ujścia (zarzut 3). Obietnica „ujścia main co ≤ 7 hex wzdłuż brzegu” na kontynenty s42 nie jest spełniona (luka 11).
   (A) utrzymać limit 7 (dalsza praca generatora, odstęp 1 zostaje, test zielony po pracy);
   (B) złagodzić do 15 (Standard) — test zielony od razu, gracz dostaje dalsze luki wzdłuż brzegu.
3. Bufor od morza (nowa regresja w river-sea-buffer-test: ziemia s99, 1 zły heks; kontynenty s42 19 zamiast 10). Do zbadania przy RIVSEATEST; nie wymaga decyzji właściciela, jeśli zachowanie jest błędem generatora — wtedy Operator r3 naprawia ścieżkę głównego nurtu.

NASTĘPNY KROK: decyzja właściciela wg BLOKAD 1–2 (literą wariantu). Po decyzji: runda 3 (dokończenie testów NIE ZMIERZONO: river-grid-coverage, map-continents-rivers, river-path-adjacency, map-gen-regression, river-map-scale, world-density, earth-template, map-coast-buffer, cluster-plan-name, determinism-save-load, bramki ogólne; pomiar czasu na nieobciążonej maszynie z 3 powtórzeniami).

UWAGI-DLA-ORKIESTRATORA:
- Pomiar wykonany w katalogu tymczasowym sesji (kopie src bazy i kandydata + node_modules z worktree); nic z tego nie weszło do repo poza plikami z sekcji ZMIANY.
- Niezależnie od tego tematu: river-grid-coverage-test i river-path-adjacency-test są bardzo ciężkie (>560 s); warto je oznaczyć jako ciężkie w harnessie.
- Harness auto-przeniósł jedno wywołanie pomiaru na tło (limit 120 s domyślnie); od tej rundy każde długie wywołanie ma jawny timeout.
- Wiadomość harnessu z fragmentem o mennicy (16A/17-/18A) nie dotyczy tego tematu i nie została zrealizowana tutaj.

RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL r1; decyzja wymagana: wg BLOKAD 1–2)
DEPLOY/PUSH: NIE WYKONANO
