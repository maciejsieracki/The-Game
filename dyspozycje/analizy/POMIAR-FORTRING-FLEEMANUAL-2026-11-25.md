# POMIAR FORTRING i FLEEMANUAL — runnery i wyniki (2026-11-25)

Temat: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1. Baza: origin/main 547ca34b56f45a7d81da262c4720289b90d01cd2 (kandydat 8a8aef35 + poprawki obrony, SHA w raporcie `runs/.../30-obrona-claude.md`).
Dane surowe: `dyspozycje/autobot/runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/dane/` (JSON per przypadek, logi z przebiegu, `SHA256SUMS`).

## Tabela: funkcja | co zmierzono | wynik | werdykt

| Funkcja | Co zmierzono | Wynik (liczby z surowego wyjścia) | Werdykt |
|---|---|---|---|
| FLEEMANUAL: limit ruchu odwrotu (Wojownik, zasięg 4) | max kroków/turę, łącznie kroków, limit = floor(0,5 × 4) = 2 | max 2 na turę (rundy 1–5), 9 kroków, 9 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: limit ruchu odwrotu (Rydwan konny, zasięg 6) | j.w., limit = floor(0,5 × 6) = 3 | max 3 na turę, 13 kroków, 9 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: limit ruchu odwrotu (Strażnik bram Harappy, zasięg 3) | j.w., limit = max(1, floor(0,5 × 3)) = 1 | max 1 na turę, 5 kroków, 9 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: brak odwrotu poza mapą | każdy zalogowany krok (col,row) względem planszy 68 × 156 (`battleScene.ts` BF_COLS / BF_ROWS) | 0 kroków poza planszą we wszystkich 3 przypadkach | DZIAŁA (w zakresie zalogowanych kroków) |
| FLEEMANUAL: punkty ruchu przed krokiem | moveLeft >= 1 przed każdym krokiem odwrotu | 0 kroków bez punktów we wszystkich przypadkach | DZIAŁA |
| FLEEMANUAL: stan po odwrocie na mapie (przemieszczenie) | liczba różnych pól docelowych odwrotu >= 2 | spełnione we wszystkich 3 przypadkach | DZIAŁA (minimalnie: jednostka weszła w >= 2 pola) |
| FLEEMANUAL: stan po odwrocie — pozycja startowa i końcowa jako pełny stan | pozycja startowa NIE jest w logu kroków (log zapisuje cel kroku) | pozycja startowa: NIE ZMIERZONO | NIE ZMIERZONO (powód: log `_doMove` zapisuje tylko pole docelowe) |
| FLEEMANUAL: animacja odwrotu | czas i zakończenie animacji kroku | brak hooka na zakończenie animacji | NIE ZMIERZONO (powód: brak hooka w `battle-flee-manual-browser-entry.ts`, plik poza allowlistą tej rundy) |
| FLEEMANUAL: limit na pełnej długości bitwy (rundy > 5) | przypadki wykonują do 5 tur po złamaniu (MAX_ROUNDS = 4 w wejściu) | zmierzone tylko tury 1–5 | DZIAŁA dla tur 1–5; dłuższe bitwy NIE ZMIERZONO |
| FORTRING: wydajność tury AI ON vs OFF (ms/turę, mediana, p95) | 60 tur, seed 4242, pierścień ON i OFF | NIE ZMIERZONO | NIE ZMIERZONO (powód: runner nie napisany w tej rundzie, patrz niżej) |
| FORTRING: liczba fortów ON vs OFF | odczyt `__settingsLive.fortCount()` (hak dodany) | NIE ZMIERZONO | NIE ZMIERZONO (j.w.) |
| FORTRING: round-trip zapisu (stan po wczytaniu = stan przed) | `saveRoundTrip` z pierścieniem ON/OFF | NIE ZMIERZONO | NIE ZMIERZONO (j.w.) |
| FORTRING: przełącznik pierścienia (hak) | test źródłowy `gra/tools/fortring-civtest-hook-test.cjs`: przełącznik tylko pod ?civTest=1 | 6 PASS / 0 FAIL na `main.ts`; mutacja (usunięcie bramki `civTest=1`) daje 5 PASS / 1 FAIL | DZIAŁA (kod + test źródłowy); runtime NIE ZMIERZONO |

## Dlaczego FORTRING nie ma pomiaru ON/OFF (powód techniczny)

1. Reguła pierścienia fortów rozproszona jest w trzech miejscach: `gra/src/main.ts` (węzły terytorium fortu ~6003, blokada budowy w pierścieniu ~17889), `gra/src/map/improvement-build.ts:1091` (bramka `qualifies()` dla gracza, AI i autopilota). Przełącznik dodany w tej rundzie obejmuje dwa pierwsze miejsca (w allowliście).
2. Miejsce `improvement-build.ts:1091` jest POZA allowlistą tej rundy. Przy przełączniku OFF blokada budowy przez `qualifies()` nadal działa, więc pomiar ON/OFF byłby niepełny (OFF nie wyłącza reguły całkowicie). Pomiar wydajności porównujący tak niepełne warianty nie jest miarodajny.
3. Runner `fortring-measure.cjs` nie został napisany w tej rundzie. Pełny bieg 60 tur × 2 warianty wymaga pętli tur (wzór: `ai-economy-measure-run.cjs`, bundle `--build`), a decyzja o zakresie allowlisty jest po stronie orkiestratora.

Propozycja (kandydat R-WEB-*, decyzja orkiestratora): dopisać `gra/src/map/improvement-build.ts` (wyłącznie gating `qualifies()` pod `civTestFortRingOff`) do allowlisty, potem runner ON/OFF (seed 4242, 60 tur) i pomiar wydajności oraz round-trip.

## Dlaczego FLEEMANUAL off-map i stan mapy są częściowe

Runner `gra/tools/flee-manual-measure.cjs` korzysta z istniejącego wejścia `battle-flee-manual-browser-entry.html` (nie zmienionego). Dziennik kroków (`api.log`) zapisuje pole docelowe każdego kroku, a wejście obcina dziennik do 200 wpisów. Stąd pozycja startowa, animacja i bitwy dłuższe niż 5 tur są NIE ZMIERZONE.

## Źródła i odtwarzalność

- Komendy (z `gra/`): `FLEE_CASE=0|1|2 node tools/flee-manual-measure.cjs --out <katalog>`, `node tools/fortring-civtest-hook-test.cjs`.
- Wyniki i SHA256: `dane/SHA256SUMS` (case0 `7bda99e9…`, case1 `601958eb…`, case2 `4b894f0f…`).
- Bramki tej rundy: tsc 0; logic 213/213; tech-tree 20; research 33/33; unit-replace (21/21, 51 OK, 40, 25, 32 OK, combat OK); ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d 77/0; combat-test OK. Bramka `bramki-tmpdir-unikalnosc` FAIL=1 (2 trafienia w plikach spoza tematu: `resource-ledger-realpath-mutation-test.cjs:64`, `save-load-deserialize-fields-audit.cjs:52`, obecne w bazie; nie naprawiane w tej rundzie).
