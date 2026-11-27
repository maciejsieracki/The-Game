STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar; zero zmian logiki gry, progów i danych)
TEMAT: R-WEB-EARLY-DEFEAT-CAUSE-Q1 (tag DEFEAT)
GOAL: niezależny końcowy werdykt dla kandydata feacfed3b (baza fbd50d4e39657b8676d273a0c7c2f092497bff86)
ZMIANY-COMMIT: kandydat feacfed3b0d7ba1f037cf1fe44d2f27146dab283; merge-base --is-ancestor fbd50d4e3 feacfed3b = TAK. diff --stat: 8 plików, +475/-0: analiza PRZEGRANA-GRACZA-PRZYCZYNA-2026-11-27.md, runs/.../10-operator, 30-obrona, dane-podsumowanie-r2.jsonl, gra/src/main.ts (+9), gra/tools/defeat-cause-live.cjs (+207), endstall-fortring-live.cjs (+3), vlive3-fortring-live.cjs (+3). Wszystko w allowliście; gra/data nietknięte. Jedyna zmiana gra/src/main.ts = jeden read-only hak cityThreatProbe w bloku civTest (tylko .map/.filter, bez mutacji).
TESTY (własne, surowe wyjścia, kandydat feacfed3b): tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20/0; research-test 33/0; combat-test 6/6; unit-replace-test 21/21; ai-test 297/0 (rebellion-gate/news nie wymagane przy hak read-only, NIE URUCHOMIONO). node --check runnera OK.
Weryfikacja danych: przeliczyłem dane-podsumowanie-r2.jsonl (77 wierszy): max 34/37 (4242: 17/19, 7: 17/18), low 20/20, garrison 13/20 (7/10 + 6/10); ownerAfter=-1 we wszystkich 67 przegranych; tury utraty max 8-15, low 8-17, garrison 10-18; summaryOpenAtLoss 34/20/13. Fisher dwustronny: low vs max p=0,545; garrison vs max p=0,0241 (zgodne z raportem). Własny żywy bieg Chromium (max, 20 tur): seed 4242 przegrana w t10, seed 7 przegrana w t8 (w zakresie 8-15, odtworzone).
OCENA ZARZUTÓW: 1 (barbarzyńcy Normalny) NAPRAWIONE: runner domyślnie trudny, typ BarbariansLevel potwierdzony w newGameFlow.ts:208, 'brak' = wyłączeni więc trudny = maksimum; OK. 2 (Fisher, nagłówek) NAPRAWIONE, liczby i p zweryfikowane. 3 (31% vs 62%) uznane za nierozstrzygnięte i tak oznaczone; liczba 31% oznaczona jako historia, nie trafia do pytania; zostaje NIE ZMIERZONO, ocena: uwaga, nie blokada, bo wynik maksimum (92%) jest już z poprawnym poziomem i odtworzony przeze mnie. 4 (klony zamiast budowy) UZNANE: zastrzeżenie jest w analizie i w DECISION_REQUIRED; zostaje NIE ZMIERZONO (budowa gracza przy Wysoki x4). 5 (dane poza repo) NAPRAWIONE: JSONL 77 wierszy w repo. 6 (bitwa vs zajęcie bez walki) ODDAL jako uwaga: pomiar tego nie rozróżnia, jawnie opisane w §5; nie wymaga naprawy w pomiarze celu.
BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA:
(1) Poziom maksimum: runner ma buildingCostPace='niski' (tak samo jak ENDSTALL) mimo że istnieje 'wysoki'; kosztJednostekPace='wysoki' (x4) i pozostałe są maksymalne. Niski koszt budowy budynków jest łagodniejszy dla gracza, więc 92% nie jest zawyżone przez to, ale ścisłe maksimum = wysoki; przed pytaniem do właściciela rozważyć dopisek lub powtórkę.
(2) Pytanie DECISION_REQUIRED redagować wg ZASAD ABC (bez nazw plików/hooków); liczby do pytania: 92% (34/37) przegranych na maksimum, 65% przy 2 jednostkach (klony barbarzyńców, nie budowa gracza), 100% na dolnym poziomie (różnica nieistotna).
(3) Obserwacja: po wczytaniu zapisu z przegraną gameOver=false do końca tury (pytanie o zachowanie, nie błąd).
(4) Round-trip po przegranej: artefakt harnessu, sprawdzony tylko na 1 przebiegu; NIE ZMIERZONO na pozostałych.
(5) Środowisko: gra/node_modules dowiązano chwilowo z innego worktree (tylko odczyt), dowiązanie usunięte; /tmp katalog wyjściowy usunięty.
RUNDY: FC po rundzie 2/5
NASTĘPNY KROK: orkiestrator integruje (merge feacfed3b do main, dokumenty/rejestr), decyduje o DECISION_REQUIRED wg ZASAD ABC; deploy niepotrzebny (zero zmian zachowania gry).
DEPLOY/PUSH: NIE WYKONANO
