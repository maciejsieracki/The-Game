# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 — raport Operatora (runda 1/5, partia 1 z 4)

STATUS: PASS-WITH-NOTES (partia 1: struktura dziennika + pipeline magazynu państwa; temat NIE ukończony — partie 2–4 w kolejnych rundach)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1
GOAL: panel „Skąd zapasy” z dziennikiem źródeł przyrostu i zużycia surowców z ostatnich N tur; suma źródeł = zmiana magazynu państwa (różnica 0); bez wpływu na wynik gry. Ten przebieg realizuje TYLKO warstwę księgującą dla magazynu państwa (teren, konwersja, wejścia konwerterów, drain Spichlerza) oraz parametr N. Brak UI, brak konsumpcji (obywatele, utrzymanie, jednostki, budowa, handel, szlak, zdobycie miasta, bitwa, prezenty) — patrz NASTĘPNY KROK.

## Stan bazy
- Kandydat/baza: `5f5f1c3ca` (origin/main, „Rejestr: FALA 728”), worktree `--detach 5f5f1c3ca`.
- Warunek startu „po ceramice”: #402 i #404 w rejestrze są zamknięte (FALE 723–725), więc warunek spełniony.
- `npm ci --ignore-scripts` w `gra/` (71 pakietów) — wyłącznie żeby mieć `tsc` i `esbuild`; bez `npm run build/dev`.

## ZMIANY-COMMIT
Commit zawierający kod i raport: patrz SHA w polu `sha` odpowiedzi StructuredOutput (czubek pracy na gałęzi detached).

Allowlista użyta w tej partii:
- `gra/src/game/resource-ledger.ts` (NOWY) — czysta struktura: `ResourceLedgerTurn` = `surowiec → klucz źródła → {kind, label, amount}`; `createLedgerTurn`, `recordLedgerFlow` (pomija 0/NaN, sumuje po kluczu źródła), `ledgerResourceNet` (gain/loss/net), `appendLedgerTurn` (przycina do N), `readLedgerHistoryTurns` (N z econ-params, domyślnie 10).
- `gra/src/game/turn-economy.ts` — miejsca modyfikacji magazynu państwa podpięte w `tickEmpireResourcePipeline` (funkcja teraz `export`):
  - Faza 1 (`creditTerritory` + `drewno` Stolarni, linia `recordTerrain`): przyrost „Teren i plony z mapy (<miasto>)”. Stolarnia NIE jest jeszcze rozbita osobno (wszystko w „teren”).
  - Faza 2 (konwertery, po bloku `producedOut`): wyjście „<Budynek> (<miasto>)” (+) i wejścia „<Budynek> (<miasto>) — zużyte wejście” (−), z `runConverters`/`ConvertResult.produced|consumed`.
  - Faza 3 (drain Spichlerza): migawka puli przed i po pętli; różnica per owner jako „Spichlerz (zużycie zapasów)”.
  - `advanceCityEconomy`: nowe pole `EconomyTickResult.resourceLedgerByOwner` (init `new Map()`), przekazywane do pipeline tylko gdy `productionForecastOnly !== true`; etykiety budynków z `data.buildings[].nazwa` (fallback: id).
- `gra/data/econ-params.json` — nowy wpis `ekonomia_miasta.ksiega_zasobow_tury` = 10 (easy/normal/hard), jednostka „tury”, opis po polsku.
- `gra/tools/resource-ledger-test.cjs` (NOWY) — test partii 1 (esbuild-bundle, jak reszta tools/).

Poza allowlistą: NIC. Nie tknięto `gra/src/main.ts`, `gra/src/ui/**`, `WERSJE.md`, manifestu, `rust-port`, `wikiBundle.json`, dokumentacji `docs/**`.

## TESTY
- `node_modules/.bin/tsc --noEmit` w `gra/`: exit 0, brak wyjścia (ZMIERZONO).
- `node tools/resource-ledger-test.cjs`: **333 passed, 0 failed**, exit 0 (ZMIERZONO):
  - (a) 30 tur, 2 właścicieli, 3 miasta; surowce z realnym przepływem: braz, cegla, ceramika, drewno, glina, kamien, ruda, ruda_cyny, sol; **maks. różnica zmiana magazynu − suma księgi = 0** (ZMIERZONO, liczba z wyjścia).
  - (a-mut) mutacja: usunięcie jednego źródła `konwersja` daje rozjazd (asercja przeszła — test czuły).
  - (c) brak wpływu na wynik: stan wszystkich miast identyczny (JSON) z księgą i bez księgi przez 30 tur (ZMIERZONO).
  - etykiety: „Cegielnia (Lublin)”, „Spichlerz (zużycie zapasów)”, „Teren i plony z mapy…”; brak podkreśleń (surowych ID) w etykietach.
  - parametr N = 10 z econ-params (normal/hard), domyślne przy braku, przycinanie do N, N=0 → pusta historia.
- Regresja istniejących testów (ZMIERZONO, tylko te uruchomione):
  - `brick-production-x2-test`: 69 passed, 0 failed.
  - `spichlerz-deficyt-scalenie-test`: 58 pass, 0 fail.
  - `building-upkeep-resources-test`: 47 passed, **1 failed** — asercja `D10: karta uzywa polskich etykiet i odmian (bez surowych id)` czyta `src/ui/entityCards/buildingAdapter.ts`. Potwierdzone statycznie (ZMIERZONO): w commicie bazowym `5f5f1c3ca` plik zawiera 0 wystąpień `stockResourceLabel(k)`, a `git diff` tego pliku względem bazy jest pusty — błąd zastany, nie wprowadzony tą partią.
  - `spichlerz-drain-pipeline-test`: 21 pass, 0 fail, exit 0 (ZMIERZONO).
- Tsc/diff: `git diff --check` czysty (ZMIERZONO, przed commitem).

NIE ZMIERZONO w tej partii:
- (b) „Umowa wymiany z <civ>” i „Warzelnia (<miasto>)” — wymaga partii 2 (handel/umowy) i warzelni w danych; nie zaimplementowane.
- (d) czas tury tick 100 przed/po — NIE ZMIERZONO (brak pomiaru perf w tej partii; księga dodaje alokacje stringów per tura — do zmierzenia).
- (e) zrzut Chromium karty „Skąd zapasy” dla soli i ceramiki — NIE ZMIERZONO (brak UI).
- Pełna zgodność księgi z realnym stanem w ścieżce gry (30 tur, ≥3 ziarna) — NIE ZMIERZONO w przebiegu `advanceCityEconomy`; test obejmuje wyłącznie `tickEmpireResourcePipeline` na fixture. Konsumpcja poza pipeline (obywatele, utrzymanie budynków — `resourceUpkeepByOwner` jest liczone w `advanceCityEconomy`, a odjęcie od magazynu dzieje się POZA tą funkcją, prawdopodobnie w `main.ts`) NIE jest jeszcze księgowana, więc pełny bilans gry jeszcze się nie domyka.
- Zapis/odczyt w zapisie gry (opcjonalne pole) — NIE ZMIERZONO, nie dotknięte.
- Wpływ na determinizm hash stanu z istniejącego narzędzia — NIE ZMIERZONO na poziomie gry (pokryte jedynie testem (c) na pipeline).

## BLOKADY
1. Konsumpcja i pozostałe wpływy zapasów poza pipeline (partia 2): obywatele, utrzymanie budynków/jednostek, budowa/rekrutacja, Spichlerz-drain poza fazą 3, handel/umowa, szlak, zdobycie/oddanie miasta, łup, prezent. Wymaga wejścia w `main.ts` (odjęcie utrzymania) i `trade-routes.ts`, `diplomacy-*`, `building-stock-cost.ts` — poza partią 1.
2. `building-upkeep-resources-test` D10 czerwony — zastany na bazie `5f5f1c3ca` (plik `buildingAdapter.ts` nietknięty, asercja szuka wzorca nieobecnego w bazie). Poza zakresem tej partii; do decyzji orkiestratora (osobny dług testowy).
3. Brak `node_modules` w worktree po starcie — zainstalowane w `gra/` (gitignored); do sprzątania przez orkiestratora.

## RUNDY
1/5 (partia 1 z 4: struktura + pipeline magazynu państwa). Kolejne rundy: DODATEK z podziałem partii 2–4.

## NASTĘPNY KROK
Partia 2 (ta sama gałąź/DODATEK): konsumpcja poza pipeline — `resourceUpkeepByOwner` (obywatele, budynki, jednostki), odjęcie w `main.ts` przez wspólny helper księgi; potem handel/szlak/umowy (`trade-routes.ts`, `diplomacy` deal execution) z etykietami „Umowa wymiany z <civ>”; potem miasto/bitwa/łup; na końcu UI (`gra/src/ui/**`, karta „Skąd zapasy”, zrzut Chromium dla soli i ceramiki) i pomiar czasu tury (tick 100 przed/po).
Dodatkowo do decyzji orkiestratora (UWAGI-DLA-ORKIESTRATORA): dług testowy D10 `building-upkeep-resources-test` (zastany na bazie); rozważyć przeniesienie Stolarni do osobnej etykiety w partii 2.

## UWAGI-DLA-ORKIESTRATORA
- Zgodnie z zakazem nie tworzyłem sesji/zadań/triggerów; nic nie pushowałem.
- Zmiany w `turn-economy.ts` dotykają miejsc, które dzielą plik z tematami ceramiki (#402/#404) — po merge trzeba sprawdzić konflikt na `tickEmpireResourcePipeline` i `advanceCityEconomy` (sygnatura pipeline rozszerzona o 2 argumenty na końcu).
- Pipeline został wyeksportowany (`export function`) wyłącznie na potrzeby testu; nie zmienia zachowania.
- Brak pomiaru wydajności: alokacje stringów w ścieżce ekonomii przy każdej turze — przed partią 2 zmierzyć tick 100 tur przed/po.
