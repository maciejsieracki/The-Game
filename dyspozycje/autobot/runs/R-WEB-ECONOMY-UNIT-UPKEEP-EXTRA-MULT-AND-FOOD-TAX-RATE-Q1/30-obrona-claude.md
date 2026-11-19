# R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1 — obrona Operatora, runda 2/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-EXTRA-MULT-AND-FOOD-TAX-RATE-Q1 (Dodatek 1, decyzja wlasciciela 2026-11-19: fala 875 anulowana, zywnosc jednostek geometria x4/epoke)
GOAL: usunac rozjazd silnik-karta po rollbacku flagi w locie (zarzut 1 Evaluatora); pozostale zarzuty rozstrzygniete z dowodem.
ZMIANY-COMMIT: baza 3e978f882; poprawka w allowliscie: gra/src/game/economy-upkeep.ts (unitFoodPerTurn: baza z tabeli zawsze przeliczana z surowych danych przez unitFoodBaseByEpoch), gra/tools/unit-upkeep-era-scale-test.cjs (nowe piny stala tabela ON->OFF + mutant M6), gra/tools/econ-era-rebalance-test.cjs (kotwica mutanta M6 zaktualizowana do nowego kodu), dyspozycje/.../30-obrona-claude.md. Commit: patrz pole sha.

ODPOWIEDZI NA ZARZUTY:
- ZARZUT 1 (rollback w locie ON->OFF, silnik 64 vs karta 16): PRZYJETY i NAPRAWIONY. Przyczyna: unitFoodPerTurn przy tabeli zbudowanej przy ON bral zapieczona wartosc z tabeli, bo rebalancedUnitFoodBase przy OFF zwraca null i nie nadpisywal bazy. Poprawka: `if (raw) base = unitFoodBaseByEpoch(raw.direct, raw.epoch);` — silnik i karta uzywaja tej samej funkcji, wiec przy OFF licza legacy (scaleCostByEpoch) niezaleznie od tego, kiedy tabela byla zbudowana. Dowod: nowy pin w unit-upkeep-era-scale-test.cjs ("stala tabela (zbudowana ON), flaga OFF -> silnik = legacy 4/8/16" i "silnik == karta legacy 4/8/16") — obie OK; mutant M6 (przywraca stary kod) wykryty (czerwony). Wynik testu: `WYNIK: 24 ok, 0 FAIL`. Komentarz "flaga czytana przy kazdym wywolaniu" jest teraz prawdziwy.
- ZARZUT 2 (INFO, empire-food-b5-test 2 FAIL): PRZYJETY jako dlug sprzed zmiany, bez poprawki w tym temacie. Dowod: moj bieg na kandydacie `empire-food-b5-test: 32 pass, 2 fail` (FAIL: Bronze/Iron auto ration clamp, era-scaled affordability); Evaluator podaje identyczny wynik na 3e978f882. Diff tematu nie dotyka empire-food.ts ani plikow racji obywateli (citizen*).
- ZARZUT 3 (INFO, pomiar dymny AI nie odtworzony): PRZYJETY jako NIE ZMIERZONO PONOWNIE w tej rundzie. Liczby pomiaru z rundy 1 (10-operator-claude.md, seed 4242, 90 tur) pochodza z kodu, ktory dla sciezki flaga ON daje identyczne wartosci (zywnosc 4/16/64, pieniadz 4/8/16, surowce 3/6/12 — potwierdzone testami). Poprawka F1 zmienia wylacznie sciezke "tabela ON, potem OFF w locie", ktorej bieg dymny (flaga ON od startu) nie uzywa. Pelnego ponownego biegu (vite bundle + Chromium, 90 tur) nie wykonano w tej rundzie — NIE ZMIERZONO ponownie. Netto zywnosci HUD nadal NIE ZMIERZONO (jak w rundzie 1). Wynik r1 sugerowal brak glodu i brak masowego rozpadu armii (AI t80 327->310, t90 479->493 jednostek); zmiana wlascicieli w Brazie utrudnia porownanie.

BRAMKI (liczby z surowego wyjscia):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: exit 0 (wszystkie [OK])
- combat-test: COMBAT TEST 6/6 pass
- unit-upkeep-era-scale-test: WYNIK 24 ok, 0 FAIL (M1-M6 wykryte)
- econ-era-rebalance-test: WYNIK 38 ok, 0 FAIL (M1-M10 wykryte; M6 zaktualizowany)
- food-to-tax-conversion-test: 71 PASS / 0 FAIL
- empire-food-b5-test: 32 pass / 2 fail (dlug sprzed zmiany, jak wyzej)

JAK TO WYGLADA W GRZE (bez zmian wzgledem r1): flaga ON: zywnosc/ture jednostki Kamien 4 / Braz 16 / Zelazo 64; pieniadz i surowce bez zmian; karta = silnik. Flaga OFF: legacy 4/8/16, karta = silnik takze po rollbacku w locie.

BLOKADY: brak. Uwaga srodowiskowa: npm ci --ignore-scripts w gra/ (node_modules gitignorowane), df / = 6,3 GB wolne po instalacji.
RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL z jednym zarzutem technicznym i dwoma INFO)
UWAGI-DLA-ORKIESTRATORA: (1) pomiar dymny ON do ponowienia przez Evaluatora lub osobny temat, jesli wymagany jest dowod netto HUD; (2) empire-food-b5-test ma 2 FAIL od dawna — osobny temat naprawy poza tym zakresem.
NASTEPNY KROK: Evaluator r2 (weryfikacja poprawki F1 i piny M6), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
