STATUS: PASS-WITH-NOTES (DECYZJA_WYMAGANA: generator nie tworzy jezior)
DOMAIN: GAME
TEMAT: R-WEB-FRESHWATER-ACCESS-LAKE-Q1
GOAL: „dostęp do wody” = wyłącznie słodka woda (rzeka, jezioro; nie morze) + zero tartaku/obozu na heksach na rzece i przy rzece (rezerwacja pod żywność).
ROLA: Operator (obrona) po Evaluator R1 (PASS-WITH-NOTES).

## Odpowiedzi na zarzuty
1. PRZYJMUJĘ. Skrypt pomiarowy dodany do repo: `gra/tools/freshwater-lake-measure.cjs` (bundle esbuild w mktemp, bez builda `gra/`). Pomiar powtórzony na 24 mapach (kontynenty/pangea/wyspy/ziemia x Mały/Standardowy x ziarna 11,222,3333; bez rzek, bo nie zmieniają lądu/morza; liczby waterHex zgodne z dawnym logiem, np. pangea Mały 3424/3423/3490): `gate-lake-measure-r2.txt` => SUMA maps=24, mapsWithLake=0, lakeHexTotal=0, startów 708, w zasięgu jeziora 0. Wynik odtwarzalny jedną komendą; mapa Mały ok. 2 s, Standard ok. 6-11 s.
2. PRZYJMUJĘ (dopisek). Typu „Archipelag” generator nie ma (typy: kontynenty, pangea, wyspy, ziemia; komentarz w nagłówku skryptu); w miejsce zmierzono Ziemię, a wyspy pokrywają ten przypadek.
3. PRZYJMUJĘ (poprawka). `gra/src/map/freshwater.ts` `getLakeHexSet`: gdy żadna woda nie dotyka krawędzi mapy (ląd na całym obwodzie / zapis), za ocean uznawana jest NAJWIĘKSZA składowa wody; mniejsze zamknięte składowe pozostają jeziorami. Test: `freshwater-access-test.cjs` +2 asercje (duże morze przy lądzie na obwodzie = nie jezioro, miasto bez wody; mała zamknięta składowa = jezioro, woda TAK). Wynik 37/37 (było 35/35). Dla map generatora (woda zawsze przy krawędzi) zachowanie bez zmian; dowód: pomiar 24 map, lakeHex=0 jak przed poprawką.
4. ODRZUCAM jako zarzut do poprawki (decyzja orkiestratora/właściciela): wzrost rezerwacji lasów (1350 -> 1611 z 2717, Pangea Mały) wynika wprost z decyzji właściciela „wszystkie miejsca przy rzece i na rzece są przeznaczone na żywność”; lasy poza rzeką nadal dopuszczają tartak (test: las poza wodą słodką -> tartak powstaje, w profilach surowce i zrównoważone+niedobór drewna). Wpływ na drewno w pełnej grze i weryfikacja w Chromium: NIE_ZMIERZONO (bundle zabroniony dla Operatora; wymaga budowy po stronie orkiestratora).
5. ODRZUCAM jako zarzut (Evaluator potwierdza brak niezgodności): ZAŁOŻENIA 2 i 3 pozostają oznaczone jako ZAŁOŻENIE do akceptacji właściciela; dotyczą tylko jezior (których generator nie tworzy) i sąsiada z samym `rzeka.obecna`, zgodnie z „przy rzece = żywność”.

## ZMIANY/COMMIT
Gałąź worktree-wf_f2e9e549-fb7-3 (baza 08b87d0b7), SHA w odpowiedzi końcowej. Pliki: gra/src/map/freshwater.ts, gra/tools/freshwater-access-test.cjs, nowy gra/tools/freshwater-lake-measure.cjs, logi gate-* i ten raport. Poza allowlistą nic nie ruszono.

## TESTY (logi w katalogu runu, linia EXIT=)
- tsc --noEmit: EXIT=0 (gate-tsc.txt)
- freshwater-access-test.cjs: 37 PASS / 0 FAIL, EXIT=0
- Regres po poprawce: auto-improvements 46/0, ai-improvements 56/0, autoimprove-stages-q1 302/0, wire-ekonomia 37/0 (gate-r2-*.txt). Pozostałych regresów z R1 (farma-nie-w-lesie, wyrab-rzeka-r2, oboz-lowiecki, hodowla-las) nie powtarzano: poprawka dotyczy gałęzi „brak wody przy krawędzi”, nieosiągalnej na mapach generatora.
- gra/node_modules usunięty po pracy.

## BLOKADY
DECYZJA_WYMAGANA: generator nie tworzy jezior (poza zakresem). NIE_ZMIERZONO: Chromium / 20 tur.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO
