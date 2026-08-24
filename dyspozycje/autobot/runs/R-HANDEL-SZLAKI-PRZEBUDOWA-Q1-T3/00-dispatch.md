# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3`
GOAL: Rozdzielić w `refreshTradeRoutes()` gating budynkami handlowymi od
istnienia trasy — aktywna umowa (`UmowaSzlakow`) + geometryczna łączność
(ląd ≤12 heksów / morze ≤20 heksów, port jako niezmieniony wymóg trasy
morskiej) + brak wojny mają dawać dochód dystansowy OD RAZU, bez budynku;
liczba budynków handlowych w mieście ma zamiast tego określać, czy dana
trasa jest „odblokowana pod 5%” — pole do realnego naliczenia bonusu w T4
(poza zakresem tego dispatchu).

## Wyzwalacz

Właściciel poprosił o weryfikację stanu T3/T4/T6 z zewnętrznego raportu,
potwierdziłem zgodność raportu z kodem (`trade-routes.ts` 620-745,
`economy.ts` 945-960, `empireDetailPanel.ts` 1985-2020 — wszystkie trzy
tematy wciąż niewykonane), po czym właściciel polecił wprost w głównym
czacie orkiestratora (C-043):

> „Dokończ pracę, Autobot, systemem workflow wszystkie tematy T3, T4 i T6.
> Działaj zgodnie z nowymi zasadami Autobot.”

Kolejność bezpieczna z decyzji `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md`:
T3 → T4 → T6 (T4 zależy od T3, T6 zależy od T4) — ten dispatch jest
pierwszym z trzech, sekwencyjnie, na wspólnych plikach (§2b).

## Izolacja

Nowa gałąź `autobot/HANDEL-T3-Q1`, odgałęziona od `origin/main`, osobny
worktree per rola. Baza = `origin/main` w chwili dispatchu (nie gałąź
sesji orkiestratora).

## Allowlista

- `gra/src/game/trade-routes.ts` (główny zakres — `refreshTradeRoutes()`
  i sąsiadujące funkcje pomocnicze gatingu)
- `gra/tools/*trade*test.cjs` (istniejące testy tras handlowych — rozszerzenie)
- nowy plik testu w `gra/tools/` jeśli potrzebny do pokrycia nowego zachowania

Poza zakresem: `gra/src/game/economy.ts` (T4), `gra/src/ui/empireDetailPanel.ts`
(T6), `gra/src/main.ts::buildEmpireTradeSnap()` (T6), jakiekolwiek naliczanie
realnego bonusu 5% do skarbca — T3 przygotowuje wyłącznie pole/flagę na
poziomie trasy, nie zmienia economy.ts.

## Kryteria sukcesu

1. Trasa (ląd lub morze) istnieje i generuje dochód dystansowy natychmiast
   po spełnieniu: aktywna `UmowaSzlakow`, geometryczna łączność, brak wojny,
   (dla morza) port po obu stronach — BEZ wymogu budynku handlowego w mieście.
2. Limit budynków handlowych (`tradeRouteLimitForCity`) przestaje ograniczać
   ISTNIENIE trasy; zamiast tego trasa niesie nowe pole (np.
   `budynekOdblokowany: boolean` lub analogiczne, do ustalenia przez
   Operatora i udokumentowania) mówiące, czy TA KONKRETNA trasa ma dziś
   pokrycie budynkowe po stronie danego miasta — gotowe do konsumpcji przez
   T4, bez zmiany `economy.ts` w tym dispatchu.
3. Reguła stabilności między turami (istniejące trasy priorytetowo zachowywane)
   zachowana dla nowego pola — nie tylko dla samego istnienia trasy.
4. Zero zmian w formule dystansowej/stawkach z T1/T2 — ten temat nie dotyka
   wysokości dochodu, tylko WARUNEK jego naliczania.
5. `tsc --noEmit` i `vite build` (C-001: binarka z `node_modules`, katalog
   docelowy poza drzewem repo) czyste; testy tematu + 5 bramek referencyjnych
   (`logic-test.cjs`, `tech-tree-test.cjs`, `research-test.cjs`,
   `unit-replace-test.cjs`, `combat-test.cjs`) zielone.
6. Jeśli dokładny kształt nowego pola/flagi budzi wątpliwość niedającą się
   rozstrzygnąć z treści decyzji `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` —
   `DECISION_REQUIRED`, nie własna interpretacja.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID,
jedna gałąź. Limit 5 rund. Model/effort: Sonnet 5 — temat logika/ekonomia,
nie wizualny (§5a nie dotyczy).

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
