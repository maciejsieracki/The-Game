# R-WEB-ENDTURN-NNS-CONSOLE-Q1 — Final Control (runda 2/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian gra/src i gra/data)
TEMAT: R-WEB-ENDTURN-NNS-CONSOLE-Q1
GOAL: konsola "Zakończ turę" w stanie blokady NNS (stan c) PRZED/PO FALI 934 na maksimum ustawień; NIE ZMIERZONO tam, gdzie nie zmierzono
ZMIANY/COMMIT: kandydat d0092d1d58fde26fbf8e935c2ab9befb9421e654; baza d7b4dd3a9af2df6057a2965991c788bfa406559b jest przodkiem (merge-base --is-ancestor: OK). git diff --stat baza..kandydat: 9 plików, 751 wstawień, 0 usunięć; wszystkie w allowliście (gra/tools/endturn-nns-console.cjs, dyspozycje/analizy/KONIEC-TURY-NNS-KONSOLA-2026-11-27.md, runs/R-WEB-ENDTURN-NNS-CONSOLE-Q1/**). `git diff baza..kandydat -- gra/src gra/data`: pusto.
TESTY (własny przebieg na kandydacie, npm ci --ignore-scripts, surowe wyjście): tsc --noEmit EXIT 0, 0 linii; logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6; ai-test 297 passed, 0 failed; node --check endturn-nns-console.cjs EXIT 0. Pomiar na żywo (stan c): NIE URUCHOMIONO przeze mnie (headless nie ładuje świata na maksimum, wg artefaktów Operatora).

## Ocena zarzutów (bez etykiet ról)
1. Stan c NIE ZMIERZONO, próby niewystarczające: zarzut TRAFNY merytorycznie (brak PRE, ziarna 7, t16–19, wielu jednostek). ODDAL jako uwaga, nie FAIL: kryterium binarne dispatchu dopuszcza wprost "opis prób i NIE ZMIERZONO", a dokument uczciwie to deklaruje (§0, §4, §5). Nie ma fałszywego twierdzenia o wyniku.
2. Czekanie na [ClusterStart]: obrona poprawiła narzędzie (awaitingFirstCity + brak .civ-map-load-overlay, linie 258–263), zweryfikowane w kodzie. Brak próby na mniejszej mapie i brak zbadania przyczyny overlay = niedomiar zakresu, ODDAL do następnej rundy.
3. cityStateDifficultyOverride: poprawione na 'hard' (linia 49). Obrona słusznie odrzuca "settingsReadback nieobecny" (jest częściowo w nns-PO-ogromny-s4242-proba.json). Żywy odczyt pól mapa/prędkość/barbarzyńcy/miasta-państwa nadal brak: uwaga.
4. Niespójności dokumentu: większość poprawiona (P2 oznaczone jako bez artefaktów, hipoteza oznaczona). Pozostałości: §2 nadal zawiera zepsute zdanie "Narzędzie nie zostało dotąd przeszło do końca" (kosmetyka).
5. Maksimum "rywale": obrona rozstrzygnęła założeniem (menu: 6 miast-państw, 7 cywilizacji; 9/15 to sufity walidacji, nie opcje). Dokument (§1) jest spójny z tym założeniem. ALE plik readback-ustawien-maksimum.txt (artefakt wskazany przez dispatch) NIE został zaktualizowany: nadal podaje 9 i 15 oraz "NIEJEDNOZNACZNE". To rozbieżność artefaktu z dokumentem (nowy, drobny zarzut Final Control, ODDAL jako uwaga: źródłem prawdy jest §1 dokumentu).

## Werdykt
Kryterium binarne spełnione w wariancie "opis prób + NIE ZMIERZONO": maksima ustalone z kodu i zapisane, tabela PRZED/PO jawnie NIE ZMIERZONO, zero zmian gra/src, bramki zielone. Brak twierdzeń bez dowodu. Wartość tematu dla gry: zerowa na tym etapie (nie potwierdzono ani nie obalono ciszy konsoli w stanie NNS); temat NIE jest domknięty merytorycznie.

BLOKADY: stan c nie wykazany (utrzymanie 0 w t1–15 po FALI 935; t16–19 i wiele jednostek nieprzetestowane); Super Huge/Ogromny nie ładują świata w headless (overlay >5 min, przyczyna nieznana); brak PRE (6afdec814) i ziarna 7.
UWAGI-DLA-ORKIESTRATORA: (a) readback-ustawien-maksimum.txt niespójny z §1 dokumentu (9/15 vs 6/7) i zdanie w §2 do poprawy; (b) jeśli pomiar stanu c ma być dokończony: osobna runda ze średnią mapą (nie-maksimum opisane wprost) albo temat na ładowanie świata w headless; zalecane t16–19 (STATE_TURN=17 CLICK_TURNS=16); (c) pytanie "rywale" rozstrzygnięte założeniem inżynierskim, nie wymaga właściciela.
RUNDY: 2/5 (FC); kolejna runda wymaga decyzji orkiestratora.
NASTĘPNY KROK: integracja orkiestratora (doc/narzędzie/dane, bez deployu) albo runda 3 wg BLOKAD.
DEPLOY/PUSH: NIE WYKONANO
