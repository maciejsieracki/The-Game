STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-RENDER-FALANGA-UNIT-MODEL-PHALANGITE-Q1
GOAL: Falanga jako falangita macedonski — sarissa w OBU rekach + mala tarcza (pelte) na przedramieniu; wyraznie inny niz hoplita; bez nowej geometrii per instancja.
ZMIANY/COMMIT: start 767f5a611d61f45bcafa1f4536aa0a6e4e46485f; zmiany tylko w gra/tools/zelazo-super-rzym-grecja-real-render-test.cjs (komentarz), gra/tools/zelazo-falanga-real-render-test.cjs (usuniete (0c)/(0d)/(0e)), ten raport. Kod gry (gra/src) bez zmian. SHA koncowy w polu sha zwrotki.

ZARZUT 1 (brak zrzutow z zywej bitwy; uzasadnienie zakazem builda niescisle) — PRZYJMUJE CZESCIOWO.
- Uzasadnienie Operatora bylo niescisle: test tematu sam buduje vite do katalogu tmp (poza gra/). Przyjmuje korekte.
- Zrzutu z zywej sceny bitwy NIE wykonano w tej rundzie (wymaga rozgrywki/hooka bitwy; brak gotowego narzedzia dla Falangi, a budowa takiego = nowy zakres). NIE_ZMIERZONO. Zrzuty z harnessu uzywaja buildUnitModel — ta sama funkcja, ktora wola scena bitwy (dowod strukturalny: A1/A2 dispatch, E5/E8 wspolne geometrie i scalanie).
- Notatka dla FC/orkiestratora: sarissa z przodu/z daleka jest skrocona perspektywa (znane, opisane przez Operatora); weryfikacja na zywo pozostaje do potwierdzenia przez wlasciciela po deployu na ROBOCZA.

ZARZUT 2 (M16 przestarzala, luka dla pary Evocati/Hastati w H13) — ODRZUCAM jako luke, DOPISANO dowod.
- Dowod: macierz mutacji z surowego wyjscia: wiersz "M12 tors Evocatiego z powrotem czerwony jak tunika Hastatiego" ma H12=RED i H13=RED (obecna zielona kolumna reszty). Czyli para Evocati/Hastati w H13 JEST rozstrzygana mutacja M12.
- Para Hieros/Falanga ma z natury duzy zapas (inny model), wiec bez osobnej mutacji — swiadoma decyzja, opisana komentarzem w ttescie (dopisane).
- Wynik: node tools/zelazo-super-rzym-grecja-real-render-test.cjs = 92 pass, 0 fail.

ZARZUT 3 (asercje (0c)/(0d)/(0e) sprawdzaja tekst komentarzy) — PRZYJMUJE.
- Poprawka: usuniete trzy asercje komentarzowe; zachowanie pilnuja H1-H11 (chwyt, skret torsu, pelte, episema), a przeslanki blazonu sekcja (K). Dodany komentarz w tescie.
- Dowod: node tools/zelazo-falanga-real-render-test.cjs = 50 pass, 0 fail (bylo 53; roznica = 3 usuniete).

TESTY: falanga 50/0; super-rzym-grecja 92/0; tsc --noEmit -p gra: 0 bledow (rc 0). Pozostalych testow zelazo-* nie uruchamiano ponownie (kod gry i ich pliki bez zmian wzgledem oceny Evaluatora). Dlug bazowy celtowie-miecznik-rydwan (81/1 na bazie) — niezwiazany, bez zmian.
BLOKADY: brak (zrzut z zywej bitwy: NIE_ZMIERZONO).
RUNDY: obrona po rundzie 1/5
NASTEPNY KROK: Final Control (Sonnet); dlug REPIN Rust (model Falangi) po FC PASS.
DEPLOY/PUSH: NIE WYKONANO
