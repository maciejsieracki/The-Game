# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4`
GOAL: Zastąpić stary, globalny mnożnik +5% Handlu w `economy.ts` (`handelBrutto *=
(1 + 0.05*liczbaTrasHandlowych)`, dziś liczący WSZYSTKIE połączone trasy bez
względu na budynek) sumą per-trasowych bonusów `0.05 × własny dochód dystansowy
trasy`, naliczaną WYŁĄCZNIE dla tras z `budynekOdblokowany===true` (pole z T3).

## Wyzwalacz

Bezpośrednia kontynuacja `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3` (ZINTEGROWANE main
`f552f8e3`), zgodnie z jawnym poleceniem właściciela w głównym czacie
orkiestratora (C-043):

> „Działaj samodzielnie, automatycznie, aż zakończysz wszystkie tematy pozytywnie,
> i zrób potem deploy do roboczej oraz git push.”

**Pilne uzasadnienie techniczne (nie tylko kolejność z planu):** Final Control T3
znalazł, że scalenie samego T3 do stanu obowiązującego BEZ T4 tworzy realny bug —
`computeTradeRouteCountByCity()` liczy wszystkie połączone trasy niezależnie od
`budynekOdblokowany`, więc stary mnożnik w `economy.ts` nadal daje miastu +5% Handlu
nawet BEZ budynku, dokładnie odwrotnie niż zlecenie właściciela. T3 jest już na
`main`, więc T4 musi zostać zintegrowane PRZED jakimkolwiek deployem ROBOCZA.

## Izolacja

Nowa gałąź `autobot/HANDEL-T4-Q1`, odgałęziona od `origin/main` (zawiera już T3),
osobny worktree per rola.

## Allowlista

- `gra/src/game/trade-routes.ts` (dodanie funkcji liczącej sumę per-trasowych
  bonusów 5%, jeśli potrzebna jako eksport konsumowany przez `economy.ts`)
- `gra/src/game/economy.ts` (zastąpienie starego globalnego mnożnika)
- `gra/tools/*trade*test.cjs`, `gra/tools/*economy*test.cjs`,
  `gra/tools/mennica-uspienie-test.cjs`, `gra/tools/zloto-szlak-test.cjs`
  (rozszerzenie/aktualizacja testów dotkniętych zmianą formuły)

Poza zakresem: `gra/src/ui/empireDetailPanel.ts`, `gra/src/main.ts::buildEmpireTradeSnap()`
(T6 — UI, osobny dispatch po T4), formuła dystansowa/stawki T1/T2 (nietykalne),
`refreshTradeRoutes()`'s gating logic z T3 poza tym, co niezbędne do odczytania
`budynekOdblokowany`.

## Kryteria sukcesu

1. `economy.ts` NIE stosuje już `handelBrutto *= (1 + 0.05 * liczbaTrasHandlowych)`
   liczonego ze WSZYSTKICH połączonych tras. Zamiast tego dochód miasta z Handlu
   rośnie o sumę `0.05 × własny dochód dystansowy` WYŁĄCZNIE dla tras tego miasta
   z `budynekOdblokowany===true` (ECHO Q3, Wariant C — „stały 5% WŁASNEGO dochodu
   trasy, sumowane globalnie do civ/city-wide wpływu”).
2. Miasto z aktywną trasą ale BEZ budynku handlowego (budynekOdblokowany=false)
   NIE dostaje żadnego bonusu 5% z tej trasy — dokładnie zamyka ryzyko znalezione
   przez Final Control T3.
3. Brak podwójnego liczenia: stary globalny mnożnik faktycznie USUNIĘTY (nie
   utrzymywany równolegle z nowym mechanizmem per-trasowym).
4. Każda trasa niesie (bezpośrednio lub przez funkcję pomocniczą) swój własny
   składnik 5% — gotowe do wyświetlenia w T6 (rozbicie dystans + 5% per trasa).
5. Zero zmian w formule dystansowej/stawkach T1/T2 i w gatingu istnienia trasy
   z T3 (regresja).
6. `tsc --noEmit` i `vite build` (C-001, katalog poza drzewem repo) czyste; testy
   tematu + testy handlu/ekonomii dotknięte zmianą formuły + 5 bramek
   referencyjnych zielone. Pre-istniejące, niezwiązane FAIL (H2 w
   `trade-routes-income-test.cjs`, 5 FAIL w `trade-ilosc-test.cjs`) potwierdzone
   jako niezmienione przez `git stash`/porównanie z `origin/main` PRZED zmianą.
7. Jeśli dokładny sposób agregacji (np. czy 5% liczy się od dochodu PRZED czy PO
   uwzględnieniu bonusu morskiego ×2 z T2, czy od `income` widocznego w
   `t.routes[]`) budzi wątpliwość niedającą się rozstrzygnąć z treści decyzji —
   `DECISION_REQUIRED`, nie własna interpretacja.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: Sonnet 5 — temat logika/ekonomia, nie
wizualny (§5a nie dotyczy).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–7 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
