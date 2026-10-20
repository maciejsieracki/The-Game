STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P1-17C-MERGED-CLASSIFICATION-Q1
GOAL: Scalić P1.17 (game) i P1.17b (ui) w jeden dokument klasyfikacji dla gra/src (300 plików).
ZMIANY/COMMIT: dyspozycje/rust-port/p1/P1-17C-MERGED-CLASSIFICATION.md (untracked, bez commita). Sekcja 2 przebudowana: uzasadnienia verbatim z wierszy źródłowych (zarzut 3), etykiety bez zmian. Źródła P1-17 i P1-17B nietknięte (git diff --quiet = 0).
TESTY: skrypt odczytujący pliki źródłowe: game 183 = ADAPT 8 / REPLACE 6 / UNKNOWN 169 / REUSE 0; ui 117 = ADAPT 6 / REPLACE 4 / UNKNOWN 107 / REUSE 0; razem 300 (0/14/10/276). Lista nie-UNKNOWN = 24 (14 game + 10 ui), zgodna z plikiem. Brak spacji na końcu linii.
BLOKADY: brak po stronie Operatora. Dispatch wymaga 34 pozycji nie-UNKNOWN (24+10); źródła dają 24. Kryterium „34” jest niespełnialne, poprawna wartość to 24. Dispatch jest poza allowlistą Operatora, więc korektę wykonuje orkiestrator.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator weryfikuje przebudowaną sekcję 2 (verbatim względem P1-17 i P1-17B) i potwierdza korektę dispatchu do 24; Final Control zatwierdza.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty Evaluatora

1. Kryterium 34 vs 24: PRZYJMUJE. Dispatch podaje 34 bez źródła. Pliki dają 24. Plik zawiera 24 pozycje, bez dopisywania UNKNOWN. Korektę dispatchu (34→24) wykonuje orkiestrator.
2. Potwierdzenie liczb i etykiet (0/14/10/276, 300): PRZYJMUJE jako potwierdzenie. Brak zmian.
3. Uzasadnienia to parafrazy, a nie oryginał; notatka „nie zmieniony” była nieprecyzyjna i dispatch wymaga „oryginalnego uzasadnienia”: PRZYJMUJE. Naprawa: sekcja 2 odtworzona skryptem z wierszy źródłowych (verbatim, z numerem wiersza źródła). Dowód path+linia dla auto-battle-power (combat.rs:296-300, combat.rs:433-447) jest już w przepisanym wierszu 2. Etykiety pozostały bez zmian.
4. Podsumowanie dla właściciela (8% / 0% / 92%, wzmianka o economy.ts, siege.ts, unit-power.ts): ODRZUCAM zarzut jako merytoryczny. Liczby zgadzają się z 24/300 i 0/300 (24/300 = 8,0%; 276/300 = 92,0%). Trzy pliki mają w źródłach etykietę UNKNOWN: P1-17 wiersz 114 (economy.ts), 177 (siege.ts), 194 (unit-power.ts). Zdanie nie zmienia etykiet. Zarzut nie wymaga korekty.

## Zmiany w pliku wynikowym (tylko allowlista)

- Sekcja 2: tabela 24 wierszy z kolumnami: źródło, wiersz źródła, plik, etykieta, moduł/odpowiednik, uzasadnienie verbatim.
- Akapit metody i nagłówek „Rola” uzupełnione o informację o obronie i kopiowaniu verbatim.
- Sekcje 1, 3 i 4 bez zmian.
