# POMIAR FORTRING i FLEEMANUAL — runnery i wyniki (2026-11-25, runda 2/5)

Temat: R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1. Baza kodu: `3ae80b02a` (origin/main 547ca34b5 + runda 1 + obrona 2).
Commity rundy 2 (SHA w raporcie `runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/10-operator-claude.md`).
Dane surowe: `dyspozycje/autobot/runs/R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1/dane/` (JSON, jsonl.gz, `SHA256SUMS`).

Legenda werdyktów: DZIAŁA / NIE DZIAŁA / NIE ZMIERZONO (z powodem).

## Tabela: funkcja | co zmierzono | wynik | werdykt

| Funkcja | Co zmierzono | Wynik (liczby z surowego wyjścia) | Werdykt |
|---|---|---|---|
| FORTRING: przełącznik pierścienia (hak) | `__settingsLive.setFortRingOff` → `civTestFortRingOff` w `territory.ts` (bramka `fortRingBuildBlockReason`) i wezły terytorium w `main.ts` | test źródłowy `gra/tools/fortring-civtest-hook-test.cjs`: 8 PASS / 0 FAIL; `npx tsc --noEmit` exit 0 | DZIAŁA (kod + test źródłowy); runtime pokazany biegiem poniżej |
| FORTRING: wydajność tury AI ON vs OFF (ms/turę, mediana, p95) | 59 wywołań `endTurn` (tury 1→60), seed 4242, pierścień ON i OFF | ON: mediana 12108,6 ms, p95 26846,7 ms, max 28112,6 ms. OFF: mediana 9674,8 ms, p95 24113,9 ms, max 26637,2 ms | NIE ZMIERZONO (wpływ pierścienia): w obu biegach **0 fortów** przez całą grę, więc pierścień nie miał czego liczyć; różnica median (ok. 25%) nie jest przypisywalna pierścieniowi (biegi różnią się trajektorią, mają 6 vs 7 wznowień ze slotu, kolejność czasu nieskontrolowana; patrz niżej) |
| FORTRING: liczba fortów/posterunków ON vs OFF | odczyt `__settingsLive.fortCount()` po każdej turze | ON: max 0, ostatnia 0; OFF: max 0, ostatnia 0 | NIE ZMIERZONO (brak obiektu działania: pierścień nie został uruchomiony w tym ziarnie) |
| FORTRING: round-trip zapisu (stan przed = po wczytaniu) | `__settingsLive.saveRoundTrip()` po turze 60; skrót znormalizowanego stanu PRZED i PO | ON: **różne** (skrót przed `48227e74…`, po `5d80f64e…`); jedyne różniące się pole: `cityProd` (kolejka produkcji miast: w `city105` znika pozycja `__wonder__:hamonga`, a `city106` dostaje `biblioteka`; pierwsza różnica na bajcie 9182). OFF: **identyczne** | NIE DZIAŁA w biegu ON (1 pole: kolejka produkcji miast przy zapisie/wczytaniu); OFF DZIAŁA. Przyczyna źródłowa NIE ZMIERZONO (kandydat R-WEB-*: zapis kolejki produkcji miast z cudem). Zgodnie z kodem pierścień nie ma tu udziału przy 0 fortach |
| FORTRING: skrót stanu po turze 30 i 60 ON vs OFF | `__detHarness.snapshotJson()` (znormalizowany jak w ai-economy-measure-run.cjs) | ON t30 `92824409…`, t60 `48227e74…`; OFF t30 `145f972f…`, t60 `b8a50fae…` | NIE ZMIERZONO (porównanie nieinterpretowalne): biegi zostały przerwane wznowieniami ze slotu (ON 6, OFF 7); bez biegu ciągłego różnica nie daje się przypisać pierścieniowi. Kod: przy 0 fortach ścieżki pierścienia zwracają to samo co bez przełącznika (`fortRingBuildBlockReason` przy braku własnego fortu zwraca `null`; predykat terytorium fortu nie jest wołany) |
| FLEEMANUAL: limit ruchu odwrotu (Wojownik, zasięg 4) | max kroków/turę vs limit = floor(0,5 × 4) = 2 | max 2 na turę (tury 1–5), 9 kroków, 10 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: limit ruchu odwrotu (Rydwan konny, zasięg 6) | j.w., limit 3 | max 3 na turę, 13 kroków, 10 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: limit ruchu odwrotu (Strażnik bram Harappy, zasięg 3) | j.w., limit max(1, floor(0,5 × 3)) = 1 | max 1 na turę, 5 kroków, 10 PASS / 0 FAIL | DZIAŁA |
| FLEEMANUAL: brak odwrotu poza mapą | każdy krok (col,row) względem planszy 68 × 156 (`battleScene.ts` BF_COLS / BF_ROWS) | 0 kroków poza planszą we wszystkich 3 przypadkach | DZIAŁA (w zakresie zalogowanych kroków) |
| FLEEMANUAL: punkty ruchu przed krokiem | moveLeft >= 1 przed każdym krokiem | 0 kroków bez punktów we wszystkich przypadkach | DZIAŁA |
| FLEEMANUAL: pozycja startowa i końcowa po odwrocie | pole `from` (zajmowane przed pierwszym krokiem; hak wejścia `battle-flee-manual-browser-entry.ts`) i cel ostatniego kroku | Wojownik (31,74) → (22,74); Rydwan konny (31,76) → (18,76); Strażnik bram Harappy (31,76) → (26,76). Przemieszczenie we wszystkich 3 przypadkach | DZIAŁA (pozycja startowa, końcowa i przemieszczenie; NIE sprawdzono zgodności z animacją) |
| FLEEMANUAL: bitwy > 5 tur | runner kończy bitwę po `MAX_ROUNDS` od złamania (domyślnie 4, czyli 5 tur łącznie); próba `rounds=10` (`dane/flee-manual-measure-case0-rundy10.json`) nie zakończyła się w 500 s (timeout strony) | wszystkie przypadki: `bitwaTury` = 5; `rundy10`: brak wyniku | NIE ZMIERZONO: powód techniczny — runner w tej rundzie kończy po 5 turach, a dłuższa bitwa nie zakończyła się w limicie czasu (headless, swiftshader); nie naprawiano |
| FLEEMANUAL: animacja odwrotu | czas i zakończenie animacji kroku | brak hooka na zakończenie animacji w wejściu testowym | NIE ZMIERZONO (powód: wejście testowe loguje krok w `_doMove` przed animacją; hak zakończenia animacji poza zakresem tego runnera) |

## Dane i powtarzalność

- FORTRING ON i OFF: `dane/fortring-on-seed4242.jsonl.gz`, `dane/fortring-off-seed4242.jsonl.gz` (wiersz na turę, wiersz startowy, wiersze wznowień i podsumowanie), `*.summary.json`. Wiersze tur: ON 59, OFF 59, tury 2..60 bez duplikatów i bez luk.
- Bieg rozbity na 5–6 wywołań z zapisem slotu (`quickSave`) i wznowieniem (`loadSlot`) w tym samym profilu Chromium; wiersze tur po ostatnim zapisanym slocie są odrzucane przy wznowieniu, więc nie ma zdublowanych tur. Kilka prób wznowienia kończyło się zamknięciem przeglądarki (Chromium, ponawiane automatycznie, bez zapisu niepotwierdzonych tur); udane wznowienia: 6 (ON) i 7 (OFF).
- Pomiar czasu: `performance.now()` wokół `endTurn` do chwili, gdy `state().turn` wzrośnie i `isEndTurnInProgress()` = false; odpytywanie co 100 ms. Czas obejmuje fazę AI.
- FLEEMANUAL: `dane/flee-manual-measure-case{0,1,2}.json` (+ logi w przebiegu) i `SHA256SUMS`. Dane z tej rundy zastępują dane rundy 1 (zakres wzbogacony o pozycję startową).

## Dlaczego pełne ON/OFF nie daje wpływu pierścienia

Seed 4242 nie wytworzył żadnego fortu ani posterunku przez 60 tur (`fortCount` = 0), zgodnie z wcześniejszym pomiarem „forty prawie nie powstają”. Pierścień fortów działa tylko wokół fortów/posterunków (`fortNodes`), więc w tym ziarnie przełącznik nie zmienia reguł. Aby zmierzyć koszt i skutek pierścienia, potrzebny jest scenariusz z fortami (np. ziarno, w którym AI buduje forty, albo jawne postawienie fortu gracza przez hak testowy) — to osobny temat.

## Wynik negatywny (kandydat R-WEB-*)

1. Round-trip zapisu w biegu ON: `cityProd` (kolejka produkcji miast z cudem) nie przechodzi zapisu/wczytania. Odtworzenie: seed 4242, zapis po turze 60, porównanie `snapshotJson()` przed i po `saveRoundTrip()`. Plik z różnicą: `dane/fortring-on-seed4242.summary.json` (pole `roundTrip.diff`). Pierścień nie ma tu udziału (0 fortów).
2. Bitwy dłuższe niż 5 tur w runnerze FLEEMANUAL: wymaga zakończenia bitwy w limicie czasu (np. wyższy limit, mniejszy rozmiar strony lub hak skrócenia bitwy). Do decyzji orkiestratora.

## Źródła i odtwarzalność

- Komendy (z `gra/`, bundle poza repo):
  - `node tools/fortring-civtest-hook-test.cjs` → 8 PASS / 0 FAIL
  - `node tools/fortring-measure.cjs --variant on|off --turns 60 --dist <abs> --scratch <abs> --out <abs-dane> --build 1` (wznowienia kolejnymi wywołaniami; bez limitu pojedynczego polecenia > 590 s)
  - `FLEE_CASE=0|1|2 node tools/flee-manual-measure.cjs --out <abs-dane>`; kontrola 10 tur: `FLEE_ROUNDS=10 FLEE_MANUAL_MAX_MS=500000 …`
- Bramki tej rundy (z tego worktree, po poprawkach): `tsc --noEmit` exit 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; archer-slinger 51/0; full-cost 40/0; multitype-walk 25/0; promotion-table 32 wpisy, 63 krawędzie; combat 6/6; ai-test 297/0; war-rules-multiwar-main-guard 21/0; hotseat-etap6d-podetap-e-source 77/0; `territory-improvement-owner-test` 34/0; `bramki-tmpdir-unikalnosc-test`: FAIL=1 (2 trafienia w plikach spoza tematu: `resource-ledger-realpath-mutation-test.cjs:64`, `save-load-deserialize-fields-audit.cjs:52`; obecne w bazie, nie naprawiane w tej rundzie). Trafienia z własnych plików runnera usunięto (ścieżki wymagane z linii poleceń).
