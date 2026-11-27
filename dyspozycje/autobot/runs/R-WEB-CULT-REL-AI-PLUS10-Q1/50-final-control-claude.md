STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CULT-REL-AI-PLUS10-Q1
GOAL: wdrożyć tabelę addytywną „Kultura i religia” (plus i minus rosną z epoką o Δ = 0/+6/+13, gracz i AI) oraz dwa niezależne poziomy (gracz / komputer) w kreatorze, z zapisem pola AI.
ZMIANY/COMMIT: kandydat 3c0ac171d0bcfdb2822aba3425605130d6b089ae; `git merge-base --is-ancestor c605a386b 3c0ac171d` = TAK (ANC_OK). Diff c605a386b..3c0ac171d: 14 plików, +487/-192; wszystkie na allowliście (culture-religion-level.ts, society-breakdown.ts bez zmian w tej rundzie, main.ts tylko hak startGame, newGameFlow.ts tylko teksty, society-params.json tylko `_opis`, testy kultury, nowy ai-plus10-wizard-ui-test.cjs, runner ai-cult-rel-measure-run.cjs [poza literalną listą, ale to runner pomiaru wskazany w dispatchu], dokumenty runa, zrzut). Brak zmian w gra-robocza/gra-kanon/WERSJE.md/rust-port. Silnik: jedna gałąź addytywna w `cultureReligionLineValue` (D−Δ, G_podmiotu+Δ), typ właściciela wybiera tylko plus (G gracza / G_ai). SHA raportu: patrz wynik zwrotny.

TESTY (własne, surowe wyjście, gra/, świeże `npm ci`, HEAD = 3c0ac171d):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/33 ALL GREEN; unit-replace 21/21; combat 6/6; unit-power 6/0; ai-test 297 passed, 0 failed
- culture-religion-level 108/0; culture-religion 65/0; society-breakdown 56 OK/0 FAIL; ai-city-order-need 35/0; ai-city-order-need-wiring 267/0; ai-plus10-matrix 190/0; ai-plus10-culture 72/0; ai-plus10-wizard-ui 6/0 (realny Chromium)
- newgame-settings-layout-reposition-test: CZERWONY (exit 1, „advanced window lists 14 options”); lista rzeczywista ma 16 pozycji. Czerwony już w bazie: oczekiwana lista ADV_ORDER nie zawiera nawet „Wzrost surowców z epoką” i „Dyplomacja i wojna” (dodane wcześniej); ta runda dodaje dwie kolejne. Dług testowy, nie regresja logiki gry.

MUTACJE (własne, kod przywracany i potwierdzony `cmp`; wyniki = pass/fail w level / matrix / culture / wiring):
- M1 AI czyta G gracza: 100/8 · 160/30 · 51/21 · wiring 29/1 — czerwone
- M2 minus D mnożony zamiast dodawany: 91/17 · 154/36 · 71/1 · wiring bez zmian — czerwone
- M3 typ właściciela ignorowany (zawsze G_ai): 89/19 · 165/25 · 59/13 — czerwone
- M4 plus gracza mnożony zamiast dodawany: 98/10 · 174/16 · 69/3 — czerwone
- M5 society-breakdown.ts:750 typ właściciela na stałe `true`: level 106/2, wiring 29/1, culture 57/15 — czerwone (zarzut 4/W1 Evaluatora zamknięty)

POMIAR własny (silnik 3c0ac171d, build vite do /tmp, runner z `--pace wysoki --kr trudny --kr-ai trudny --city-state 1`, gra Trudny, 60 tur, seed 4242): unitCostPace w rekordach = „wysoki” (potwierdzone), miasta AI 42/126/188 (t10/t30/t60), jednostki wojskowe AI 57/159/205, miasta AI poniżej progu buntu skrajnego t60 = 0, Porządek AI t10 65,8%, t60 55,6%. Zgodne co do kierunku z liczbami obrony (200 miast / 292 jedn. / 1 / 56,1%). PRZED (baza) nie mierzone przeze mnie; liczby PRZED z raportów (s4242: 159 miast / 187 jedn. / 63 poniżej progu / 21,3%).

OCENA ZARZUTÓW (bez etykiet ról):
1. UI w przeglądarce: CZĘŚCIOWO ZASADNY. Zrzut kreatora potwierdza dwa selektory (gracz „Duży wpływ (trudny)”, komputer „Mały wpływ (łatwy)”), test 6/0 potwierdza parametry startu kulturaReligiaLevel=trudny / kulturaReligiaLevelAI=latwy i zapis w oknie. Odczyt D/G w żywej grze oraz round-trip zapisu/wczytania w przeglądarce NIE ZMIERZONE. Kod zapisu (main.ts ~34480) i wczytania (~52246) istnieje i jest pokryty testami jednostkowymi; ryzyko niskie, ale dowodu live brak. ODDAL jako uwaga (nie FAIL), pozostaje warunkiem przed deployem wg dispatchu.
2. Pomiar „AI łatwy, gracz trudny”: ODDAL — wykonany przez obronę (s4242, 203/283/0/61,2%). Uwaga do pkt (b) poniżej.
3. Opis selektora gracza: ODDAL — wdrożone, tekst w newGameFlow.ts zgodny z tabelą addytywną (−10/−23, −15/−28, −20/−33; plus +23/+18/+13).
4. Luki testowe: ODDAL — mutacje AI/typu właściciela czerwone (M1, M3, M5 powyżej).
5. Widoki poza turą: ODDAL — odrzucenie przez obronę zgodne ze stanem (growth-happiness/turn-economy/conquest-stability bez wywołań), cityPanel ma typ właściciela; osobny temat.

BLOKADY / NOTY:
(a) newgame-settings-layout-reposition-test czerwony (patrz wyżej); naprawa = aktualizacja ADV_ORDER do 16 pozycji, poza allowlistą tej rundy — osobny temat testowy (propozycja nazwy: NEWGAMELAYOUTORDER).
(b) Pole unitCostPace w rekordach: WYJAŚNIONE. Runner po starcie wywołuje `setUnitCostPace(--pace)` i nadpisuje hak startGame; bez `--pace wysoki` pomiar biegnie na „normalny” (domyślna wartość `--pace`). Zatem biegi obrony (rekord „normalny”) nie były na poziomie maksymalnym wg zasady testowania; pomiary operatora z `--pace wysoki` były poprawne. Mój bieg s4242 z `--pace wysoki` potwierdza wynik. Hak `kosztJednostekPace` w startGame jest przez to zbędny dla runnera (szkodliwy nie jest). Zalecenie: w kolejnych pomiarach zawsze `--pace wysoki`; PRZED w identycznych warunkach (baza 44649038c) warto powtórzyć przy okazji deployu.
(c) Odczyt D/G i round-trip zapisu w żywej grze: NIE ZMIERZONO (patrz zarzut 1). Konieczne dopisanie do KOLEJKI jako weryfikacja żywa po deployu na ROBOCZĄ albo osobny temat; nie blokuje integracji kodu do main.
(d) Seed 7 i PRZED nie powtórzone przeze mnie (NIE ZMIERZONO tu).

UWAGI-DLA-ORKIESTRATORA: integrować 3c0ac171d do main (FF możliwe względem c605a386b; sprawdzić, że main nie odjechał — worktree widział origin/main = 99375f77e, który zawiera inne FALE, więc potrzebny merge-tree/rebase przez orkiestratora). Przed deployem: poprawić ADV_ORDER (a) lub świadomie przyjąć dług; po deployu zlecić weryfikację żywą (c).

RUNDY: 2/5 (ten werdykt kończy rundę 2).
NASTĘPNY KROK: integracja orkiestratora po FC, następnie wpis w rejestrze; READY_FOR_DEPLOY wystawia orkiestrator po decyzji o (a) i (c).
DEPLOY/PUSH: NIE WYKONANO
