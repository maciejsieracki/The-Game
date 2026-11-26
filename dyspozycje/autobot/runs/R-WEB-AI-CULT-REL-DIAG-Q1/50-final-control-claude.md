STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-DIAG-Q1
GOAL: liczbami ustalić przyczynę różnicy AI (Kultura i religia: trudny vs zgodność); tylko pomiar i diagnoza, zero zmian reguł i balansu.
ZMIANY/COMMIT: kandydat d9c54ebb862f676e3f8ece15d81c4f6285fd4e75 (baza 5748b924f8ca8918b472bd46cffac8cc257918e2; `git merge-base --is-ancestor` = tak). diff --stat: 6 plików, +343/-0: gra/src/main.ts (+42, hak odczytu za ?civTest=1: cityStateTurn, cityTransfersLast; brak zapisu do stanu gry, sprawdzone w diffie), gra/tools/ai-cult-rel-measure-run.cjs (+8), gra/tools/ai-cult-rel-measure-flow.cjs (nowy), dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md, runs/.../10-operator-claude.md, 30-obrona-claude.md. Wszystko w allowliście; zero zmian reguł/balansu/parametrów; brak gra-robocza, WERSJE.md, rust-port.
TESTY (własne, surowe wyjścia na d9c54ebb8): tsc --noEmit exit 0; logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33 / FAILED 0; combat-test 6/6 pass, All sanity checks passed; ai-test 297 passed, 0 failed; ai-city-order-need-wiring-test 231 passed, 0 failed; ai-unit-replace-same-rules 45 passed, 0 failed; unit-replace-test 21/21. Odtworzenie zestawienia: `node gra/tools/ai-cult-rel-measure-flow.cjs trudny=<dir> zgod=<dir>` na surowych JSONL (seed 4242) dało liczby z dokumentu (t60: miasta 153 vs 190, jednostki 159 vs 221, nowe jednostki 208 vs 278, rozwiązania 59 vs 61, poniżej progu 60 vs 1). Pole unitCostPace w JSONL = wysoki we wszystkich 4 biegach. Nie powtarzałem biegów live (Chromium, wielogodzinne); poleganie na surowych plikach operatora (seed 7 nie odtwarzany ponownie przez skrypt).
OCENA ZARZUTÓW (bez etykiet ról):
1. ODDAL (obrona trafna): pomiar powtórzony na tempo wysoki, zweryfikowane w JSONL 4/4; poziom maksymalny zadeklarowany w dokumencie (society hard, trudny, wysoki).
2. ODDAL: dodano przejęcia miast i pierwsze tury budynków; brakujące liczniki (kupione vs wyprodukowane, utrzymanie żywnościowe) jawnie NIE ZMIERZONO; wymagają haków w ścieżkach zakupu/produkcji, poza ścisłym zakresem diagnozy. Nie blokuje.
3. ODDAL: wniosek zdegradowany do hipotezy w sekcji Rozstrzygnięcie; kary z society-params nie przedstawione jako pomiar.
4. ODDAL: premisa pustych miast opisana jako częściowa (37 vs 32%, 40 vs 26%).
5. ODDAL: rozwiązania przez AI odrzucone z dowodem (59 vs 61, 69 vs 66); hipoteza złota na zakup jawnie nierozstrzygnięta.
6. ODDAL: numery linii poprawione, pałac t10 skorygowany, analyze.py zastąpiony zacommitowanym narzędziem.
BLOKADY: brak technicznych.
UWAGI-DLA-ORKIESTRATORA: (a) główna przyczyna to hipoteza (produkcja jednostek i mniej miast od t30; Porządek najbardziej różniącą się wielkością), nie ustalenie; dokument mówi to uczciwie. (b) 60 miast AI poniżej progu buntu skrajnego przy 0 rebelii przez 60 tur: do osobnej oceny (garnizon FALA 926 czy luka). (c) Kandydaci na osobne tematy: rozdział zakup/produkcja jednostek; dlaczego AI trudnego zakłada mniej miast do t30 i nie buduje pałacu w t10; pomiar kar niepokoju w punktach Porządku. (d) Decyzja A/B właściciela (zostawić vs zmienić parametry Porządku/kultury dla trudny) do zredagowania wg zasad ABC bez żargonu. (e) Hak zostaje w main.ts za ?civTest=1, bez wpływu na grę; deploy na ROBOCZĄ zbędny (zmiana tylko w ścieżce civTest), decyzja orkiestratora.
RUNDY: 2/5 (FC po rundzie 2 obrony).
NASTĘPNY KROK: integracja orkiestratora (merge d9c54ebb8 do main, rejestr, push); pytanie ABC A/B do właściciela osobno.
DEPLOY/PUSH: NIE WYKONANO
