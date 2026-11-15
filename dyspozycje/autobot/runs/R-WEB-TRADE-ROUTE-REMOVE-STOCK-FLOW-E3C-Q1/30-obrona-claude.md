# R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1 — obrona Operatora (runda 2, odpowiedzi na zarzuty Evaluatora r1)

STATUS: PASS-WITH-NOTES (zarzuty 2 i 4 naprawione; zarzuty 1, 6 i 3 nadal otwarte i jawnie nieobrobione w tej rundzie; zarzut 5 zgłoszony orkiestratorowi)
DOMAIN: GAME
TEMAT: R-WEB-TRADE-ROUTE-REMOVE-STOCK-FLOW-E3C-Q1
GOAL: aktywny szlak handlowy nie zmienia zapasów żadnej strony; zostaje dochód, boolean-grant dostępu, limity i kontakt szlaku.
BAZA: eac3326a2 (kandydat Operatora r1). Kod w tej rundzie: 1f39c940d, 325f8ede3.
ODNOŚNIK DISPATCHU: dispatch i DODATEK pobrane z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (w origin/main ich nie ma).

## ODPOWIEDZI NA ZARZUTY

1. **PRZYJMUJĘ — NIE WYKONANO w tej rundzie.** Kryterium (a) (test w realnej turze, dwie cywilizacje, pomiar zapasów i dochodu Pieniądza przed/po) nie zostało wykonane. Brak uruchomienia przeglądarki w tej rundzie. Nie podaję żadnego pomiaru z pamięci. NIE ZMIERZONO.

2. **PRZYJMUJĘ — CZĘŚCIOWO WYKONANE (1f39c940d).** `gra/tools/trade-ilosc-test.cjs` miał czerwone asercje przed tym tematem (B: `capacityPerRoutePerTurn` usunięty w PYTANIE-84-U16; E: lista kluczy ma 6 pozycji, w tym `kon`, zgodnie z GOAL dispatchu). Zmieniono B (brak limitu trasy, transfer = nadwyżka ponad rezerwę: 998 przy 1000 − 2) i E (6 kluczy). Wynik: `trade-ilosc-test: 42 passed, 0 failed` (było 35/5).
   Nadal otwarte: `zloto-szlak-test` (54/0) w sekcji 4 nadal asercjonuje działanie `computeTradeRouteResourceFlow`. Przejdzie dalej, bo funkcja jest wciąż wyeksportowana. Zmiana tej sekcji wchodzi razem z zarzutem 3.

3. **PRZYJMUJĘ zasadę — NIE WYKONANO w tej rundzie.** Odczytanie dispatchu: usunąć martwy kod, jeśli „nic poza testami go nie używa”. Warunek jest spełniony: poza testami nie importuje tych symboli żaden plik (`main.ts:39864` i `citizen-resource-upkeep.ts:48,63,312` mają tylko komentarze). Mojej poprzedniej interpretacji („zostawiam, bo używają testy”) nie podtrzymuję. Usunięcie `computeTradeRouteResourceFlow`, `loadTradeRouteResourceFlowParams`, `TRADE_ROUTE_STOCK_FLOW_KEYS`, `DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS` wymaga przepisania `trade-ilosc-test.cjs` (wszystkie sekcje B–H używają przepływu), sekcji 4 `zloto-szlak-test.cjs` i `perf-large-empire-stress-live-test.cjs` (poza allowlistą, patrz zarzut 5). To jest zakres następnej rundy — do decyzji orkiestratora.

4. **PRZYJMUJĘ — CZĘŚCIOWO WYKONANE (1f39c940d, 325f8ede3).**
   - `docs/encyklopedia/pojecia/szlaki-handlowe.md`: dopisane zdanie „Szlak nie przesuwa zapasów” w sekcji dostępu do surowców.
   - `docs/PORADNIK-GRACZA/08-ekonomia-imperium.md`: dopisane to samo w §53.3 („Dostęp do surowca”); wiersz tabeli „Surowce” (linia ~406) doprecyzowany z „przez szlak handlowy” na „dostęp przez szlak handlowy (§53.3; szlak nie przesuwa zapasów)”.
   - `gra/src/data/wikiBundle.json`: zregenerowany `node gra/tools/bundle-wiki-for-game.cjs` → „22 rozdz. + 181 haseł”, diff 2 linie.
   - `gra/src/game/trade-routes.ts` (allowlista): komentarze w bloku „zloto”/„sol” (ok. l. 1842 i 1847) zmienione z „dostarczają sztuki/turę” na „dają dochód i dostęp; NIE przesuwają zapasów”.
   - ODRZUCAM część „krok (4) resource-ledger.ts”: plik `gra/src/game/resource-ledger.ts` nie istnieje w bazie eac3326a2 (`git cat-file` i listing; księga jest w innej gałęzi). Nic do usunięcia.
   - NIE WYKONANO (poza allowlistą): `gra/src/ui/cityPanel.ts:~11612` (ostrzeżenie Mennicy wskazuje szlak jako źródło Złota), nagłówek `zloto-access.ts`, `citizen-resource-upkeep.ts` (komentarze l. 48, 63, 312). Do decyzji orkiestratora.

5. **PRZYJMUJĘ — NIE WYKONANO (poza allowlistą).** `gra/tools/perf-large-empire-stress-live-test.cjs` (linie ~468–472) robi `replaceOnce` na tekście usuniętego bloku E3c (`const tradeFlowParams = loadTradeRouteResourceFlowParams(`, `trade_route_stock_flow`). Po eac3326a2 skrypt nie znajdzie tekstu. Nie edytowałem go, bo plik jest poza allowlistą. Wymaga zgody orkiestratora na rozszerzenie allowlisty albo osobnego tematu.

6. **PRZYJMUJĘ — NIE WYKONANO (jak zarzut 1).** Grant dostępu (boolean) jest pokryty przez `trade-grant-test.cjs` (62/0) i `trade-routes-test.cjs` (96/0). Brakuje testu w realnej turze, że grant działa równolegle z brakiem przepływu. NIE ZMIERZONO.

7. **PRZYJMUJĘ.**
   - Dysk: w trakcie obrony `df -h /` pokazało 3,6 GB (poniżej progu 4 GB dla web). Po usunięciu `gra/node_modules` (134 MB, usunięte po bramkach) i sprzątaniu tymczasowych plików: **6,5 GB wolne** na końcu tej rundy.
   - Dług Rust (REPIN) — zapisany jawnie: usunięto ilościowy przepływ szlaku w logice weba (blok E3c w `main.ts`). Dane i logika przepływu w `trade-routes.ts` (`TRADE_ROUTE_STOCK_FLOW_KEYS`, `computeTradeRouteResourceFlow`, `loadTradeRouteResourceFlowParams`, `DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS`) nadal istnieją w kodzie. Port Rust musi zrobić to samo: szlak nie przenosi zapasów. Klucz `ekonomia_miasta.handel_surowiec_min_stock` w `econ-params.json` nie został zmieniony, ale nadal jest czytany tylko przez usunięty przepływ. Do REPIN.

## TESTY (surowe wyniki z tej rundy, po commitach)

Środowisko: `gra/node_modules` zainstalowane przez `npm ci --ignore-scripts` (71 pakietów), po bramkach usunięte.

- `npx tsc --noEmit` (gra/): exit 0 (po 325f8ede3).
- trade-ilosc-test.cjs: 42 passed, 0 failed (przed: 35 passed, 5 failed).
- trade-grant-test.cjs: 62 passed, 0 failed.
- zloto-szlak-test.cjs: 54 passed, 0 failed.
- trade-routes-test.cjs: 96 passed, 0 failed.
- trade-routes-income-test.cjs: 134 passed, 0 failed.
- trade-routes-contact-only-test.cjs: 36 passed, 0 failed.
- trade-routes-limit-test.cjs: 76 passed, 0 failed.
- trade-routes-ownership-income-test.cjs: 18 passed, 0 failed.
- trade-routes-hud-filter-test.cjs: passed=58 failed=0.
- surow-civ-storage-test.cjs: 63 passed, 4 failed. Wszystkie 4 FAIL to sekcja G (`main.ts: znaleziono koniec pętli wyrębu lasu`, `creditOwnerResourceStock(... 'drewno' ...)`, `drewnoCap`, `ownerResourceCap`). Dług bazowy (opisany w eac3326a2 i potwierdzony w evaluatorze na main.ts z bazy). Sekcja I (nowa, strażnik odwrotny) — PASS.
- `git diff --check`: czysty.
- NIE ZMIERZONO: 5 bramek referencyjnych z PROC (nie uruchamiane w tej rundzie), test w realnej turze (kryterium a), mutacja w realnej turze.

## BLOKADY

1. Kryterium (a) i (c) w realnej turze — brak przeglądarki w tej rundzie (zarzuty 1 i 6).
2. Usunięcie martwego kodu (zarzut 3) — wymaga przepisania `trade-ilosc-test.cjs`, sekcji 4 `zloto-szlak-test.cjs`; decyzja orkiestratora, czy w tym temacie, czy osobno.
3. `gra/tools/perf-large-empire-stress-live-test.cjs` poza allowlistą (zarzut 5).
4. Komentarze poza allowlistą: `cityPanel.ts:~11612`, `zloto-access.ts`, `citizen-resource-upkeep.ts` (zarzut 4).
5. Czerwone bazowe: surow-civ-storage sekcja G (4 FAIL), nie z tego tematu.
6. REPIN Rust — dług zapisany powyżej.

## RUNDY

2/5 — odpowiedź na zarzuty Evaluatora r1.

## NASTĘPNY KROK

Evaluator r2: sprawdzić commity 1f39c940d i 325f8ede3 (zarzuty 2 i 4 naprawione, dowody w tym raporcie). Zarzuty 1, 3, 5, 6 wymagają decyzji orkiestratora (zakres allowlisty i kolejność). Pomiar w realnej turze (kryterium a) — osobny etap z przeglądarką.

## UWAGI-DLA-ORKIESTRATORA

- Dispatch nie istnieje w origin/main pod ścieżką tematu; czytany z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Baza w dispatchu raz jako 06fcc8526 (origin/main), raz jako 005cd9ab0; obrona startuje od eac3326a2 zgodnie z poleceniem.
- Zalecenie: rozszerzyć allowlistę o `gra/tools/perf-large-empire-stress-live-test.cjs` albo wydzielić temat na ten skrypt.
- Zalecenie: osobny temat na sekcję 4 `zloto-szlak-test.cjs` i przepisanie `trade-ilosc-test.cjs` (jeśli usuwamy martwy kod).
- Wykonane operacje git: tylko `git checkout --detach eac3326a2`, dwa commity kodu, ten plik (commit poniżej). Nic nie wypchnięto na main, nic nie zintegrowano, nie utworzono sesji ani zadań.

DEPLOY/PUSH: NIE WYKONANO
