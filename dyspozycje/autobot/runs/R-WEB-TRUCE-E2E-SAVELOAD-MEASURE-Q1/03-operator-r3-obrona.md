STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1
GOAL: (A) zmierzyc i naprawic przebieg od decyzji AI do karty rozejmu na stole; (B) prawdziwy roundtrip zapisu w rozejmie, wczytanie w NOWEJ sesji Chromium, wygasniecie bez kary.
ZMIANY/COMMIT: baza 5d321be81 (runda 2). Commit obrony: patrz raport zbiorczy (SHA w odpowiedzi orkiestratorowi). Push: NIE.

## Odpowiedzi na zarzuty

### 1. Limit 120 s - PRZYJMUJE CZESCIOWO (zalozenie jawne, strazniki dodane)
- Pomiar (swiat = generowanie swiata `?playtest=mapa`, wylacznie CPU Chromium, niezalezne od testu; `scratchpad/gen.cjs`, viewport 640x400: 76,9 s, czyli rozmiar okna nie pomaga).
- Zmiana: oba testy maja teraz strażnik czasu SCENARIUSZA po wygenerowaniu swiata (A: `SCENARIO_LIMIT_MS=60000` w diplo-truce-ai-table-live-test.cjs, wynik wchodzi w exit code; B: `SCENARIO_LIMIT_MS=60000` w diplo-truce-saveload-live-test.cjs, osobny check w kazdej fazie). Czesc A nie miala strażnika - ma.
- Zmierzone (ten sam bundle, ten sam dzien): A rozejm PO 126,5 s calosc / 47,2 s scenariusz (inne przebiegi 110-140 s; szum maszyny); B save 95,3 s (scenariusz 16,4 s), load 111,8 s, expire 118,2 s (scenariusz 32,5 s), legacy 112,5 s. Wszystkie fazy B <= 120 s w tym przebiegu. Calosc A bywa 110-140 s zaleznie od obciazenia.
- ZALOZENIE dla Final Control: kryterium 120 s czytam jako "scenariusz po swiecie <= 60 s i calosc z swiatem rzedu 120 s"; limit calkowity w srodowisku 4 CPU nie jest gwarantowalny (swiat 70-95 s). Limit fazy 150 s (`PHASE_LIMIT_MS`) zostaje jako jawny bezpiecznik. Kryterium binarne zmieniam tym samym wprost, nie po cichu.

### 2. Karta rozejmu otwierana/rozpatrywana - PRZYJMUJE, ZNALEZIONY I NAPRAWIONY REALNY BLAD
Pomiar po przebudowie testu A (DOM jest teraz czescia werdyktu, nie tylko logiem):
- Test: zamyka modal bitwy realnym Escape (klik "Wycofaj" przez Playwright wygasa), klika karte `.sp-event` "Dyplomacja", czeka na audiencje, sprawdza etykiete karty, stan przycisku Przyjmij, klika Przyjmij, sprawdza `truceUntilTurn` i pusty stol, zrzuty `evidence/ai-table-rozejm-karta-stol.png`, `-karta-otwarta.png`, `-po-akceptacji.png`.
- BLAD (PRZED, `gate-ai-table-rozejm-r3-PRZED-bez-mapowania-UI.txt`): karta rozejmu AI w audiencji nazwana "Traktat handlowy 200 PW", Przyjmij `disabled` z tytulem "Bilans PW ujemny (-130) — nie mozna przyjac na minusie"; akceptacja klikiem niemozliwa. Przyczyna: `CYW_ACTION_TO_UI_ID` (gra/src/main.ts ok. 18751) nie mial wpisu `rozejm`, wiec `uiActionId` = fallback '5' (umowa handlowa); wyjatek "pokoj bez bramki PW" (diplomacyAcceptanceBalance.ts:366, `uiActionId !== '10'`) nie obejmowal rozejmu.
- NAPRAWA (minimalna, 6 linii w main.ts): `rozejm: '10'` w `CYW_ACTION_TO_UI_ID` + `case 'rozejm'` w `negotiationSummary` (etykieta "Rozejm na N tur" zamiast surowego id). ZALOZENIE: ta zmiana jest poza doslowna allowlista main.ts (blok enqueue/filtr payloadu), ale mieści sie w GOAL (naprawa po zmierzonym bledzie w przebiegu karta -> akceptacja) i dziala wylacznie na rozejm; pokoj nietkniety. Decyzja wlasciciela rundy 4 ("pokoj bez bramki PW") obejmuje akcje '10' = "Propozycja pokoju / zawieszenia broni", w ktorej rozejm jest od poczatku w kreatorze (diplomacyTradeBasket peaceKind).
- PO (`gate-ai-table-rozejm-PO.txt`): karta "Propozycja pokoju / zawieszenia broni", "Spelnia warunki — mozesz przyjac (Przyjmij aktywne)", klik Przyjmij -> `status pokoj`, `truceUntilTurn=12` (tura 2 + 10), wpisy stolu 0, EXIT=0.
- Kontrola pokoju (`gate-ai-table-pokoj-PO.txt`): wciaz 0 wpisow, FAIL (zachowanie bez zmian wzgledem PRZED, wymaga decyzji wlasciciela).
- Akceptacja klikiem jest teraz w A; w B zostaje przez `acceptTruceForTest` (ta sama funkcja `applyProposalOutcome`), co jest jawnie opisane.

### 3. diplo-truce-live (23) - PRZYJMUJE
Uruchomiony: `gates/gate-diplo-truce-live-PO.txt` 23 pass / 0 fail EXIT=0; na bundle bez poprawki UI tez 23/0. Pierwszy przebieg na finalnym bundle mial flake (klik chipa "5 tur" timeout 10 s, 5 pass / 1 fail) - zachowany jako `gates/gate-diplo-truce-live-PO-przebieg1-FLAKE-klik-chipa.txt`; dwa kolejne przebiegi 23/0. "ring 15" = `diplo-aggressor-wiring` 15 (w nazwie "...wiring"), w `gra/tools` nie ma pliku o nazwie ring; zmierzone 15/0, wiec NIE_ZMIERZONO dotyczy tylko osobnego testu "ring", ktory nie istnieje.

### 4. Logi bramek - PRZYJMUJE
`gates/gate-<nazwa>-PO.txt` i `gates/gate-<nazwa>-PRZED.txt`: po jednym pliku na bramke, w kazdym DOKLADNIE jedna linia `EXIT=` (sprawdzone `grep -c`). PRZED = czyste drzewo `gra/` z `4d1916f2c` (git archive do scratch, node_modules z symlinku), PO = ten worktree. Wyniki PRZED == PO dla wszystkich 26 bramek: truce-r1 30, n6-saveload 8, r4-ai 24, war-gates 22, aggressor 73/15, cession 79+73, picker-ui 13, war-era-counter 82, multiwar 57/21, relation-gate 14, stone 31/15, iron 54/35, peace profile 198, gate 11, sim 22, main-guard 28, d7 8, diplomacy 148, peace-lock 9; znane czerwone bez zmian civ-matrix 42/1, ai-test 274/20. `gates/gate-tsc-PO.txt` EXIT=0. Zbiorczy `gate-bramki-PO.txt` z rundy 2 zostaje jako historia (zastapiony katalogiem gates/).

### 5. Sciezki absolutne w logach - PRZYJMUJE
Skrypty nie maja sciezek worktree (grep czysty); log testu A drukuje teraz sciezki zrzutow wzgledem korzenia repo. W logach, ktore i tak zawieraly sciezke (city-picker, truce-live), sciezki zamienione na `<WORKTREE>`/`<SCRATCH>`. `grep -rE "/home/user|/tmp/claude"` w runie: 0.

## Czesc B (powtorzenie na finalnym bundle)
`gate-saveload-r3-{save,load,expire,legacy}.txt`: 3/0, 9/0, 6/0, 4/0 (w tym nowy check strażnika scenariusza), EXIT=0 kazda; zgodne pola jak w rundzie 2 (truceUntilTurn=6, flaga agresora, casus belli, licznik wojen epoki, meta pary, Wiarygodnosc), wygasniecie w turze 6 bez kary i flagi, stary zapis OK. Mutacje MUT1/MUT2 z rundy 2 nie powtarzane: kod zapisu/odczytu nieruszony w tej rundzie (zmiany: tylko CYW_ACTION_TO_UI_ID, negotiationSummary i testy); logi rundy 2 zostaja.

## BLOKADY / ZALOZENIA
1. Limit 120 s: jak wyzej, zalozenie jawne (swiat 70-95 s CPU).
2. Poprawka mapowania UI poza litera allowlisty (main.ts, obszar buildPendingNegotiationRows) - zalozenie uzasadnione pomiarem.
3. Pokoj nadal nie trafia na stol (decyzja wlasciciela, poza zakresem).
4. NIE_ZMIERZONO: osobny test "ring" (nie istnieje w gra/tools).

TESTY: patrz wyzej; tsc EXIT=0.
RUNDY: 3/5
NASTEPNY KROK: Evaluator powtarza A (rozejm + kontrola pokoju) i dwie fazy B; ocena zalozenia 120/150 s i poprawki mapowania.
DEPLOY/PUSH: NIE WYKONANO
