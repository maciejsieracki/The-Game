# 00 — DISPATCH

STATUS: DISPATCHOWANE
DOMAIN: GAME
TEMAT: `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T6`
GOAL: Rozszerzyć istniejącą tabelę tras handlowych w `empireDetailPanel.ts` (zasilaną
przez `main.ts::buildEmpireTradeSnap()`) o pełny rozkład dochodu per trasa — składnik
dystansowy osobno od składnika 5% — oraz jawne wskazanie, gdy 5% czeka jeszcze na
wybudowanie budynku handlowego w mieście (`budynekOdblokowany===false`).

## Wyzwalacz

Bezpośrednia kontynuacja `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4` (ZINTEGROWANE main
`fee7f455`), ostatni temat tej serii, zgodnie z jawnym poleceniem właściciela:

> „Działaj samodzielnie, automatycznie, aż zakończysz wszystkie tematy pozytywnie,
> i zrób potem deploy do roboczej oraz git push.”

T1+T2+T2b+T3+T4 już zintegrowane. Po T6 następuje zbiorczy deploy ROBOCZA.

## Izolacja

Nowa gałąź `autobot/HANDEL-T6-Q1`, odgałęziona od `origin/main` (zawiera już
T1-T4), osobny worktree per rola.

## Allowlista

- `gra/src/main.ts::buildEmpireTradeSnap()` (funkcja budująca dane wiersza tabeli,
  linia ok. 14039 w chwili dispatchu — numer mógł się przesunąć, potwierdź w
  reconie) — dodać per-trasowy rozkład dochodu
- `gra/src/ui/empireDetailPanel.ts` (sekcja „Handel — szlaki per miasto”/tabela
  tras, ok. linii 1985-2020 w chwili dispatchu) — wyświetlenie rozkładu
- typy w `empireDetailTypes.ts` jeśli `EmpireTradeSnap`/wiersz trasy wymaga nowych pól
- `gra/tools/*empire*test.cjs`, `gra/tools/*trade*test.cjs` dotyczące tej tabeli
  (rozszerzenie/aktualizacja)

Poza zakresem: `trade-routes.ts`, `economy.ts`, `turn-economy.ts` (T3/T4, już
zintegrowane i nietykalne — T6 WYŁĄCZNIE czyta już istniejące pola, np.
`TradeRoute.budynekOdblokowany` z T3, nie zmienia logiki liczenia).

## Kontekst techniczny (z reconu orkiestratora, do potwierdzenia przez Operatora)

`buildEmpireTradeSnap()` dziś buduje wiersz per trasa z polem `income` = pełny
dochód dystansowy trasy (`tradeRouteTotalDistanceIncome` × ewentualny bonus cudu),
BEZ składnika 5% (5% jest dziś liczone per-MIASTO, sumarycznie, w
`computeTradeRouteBuildingBonusByCity()` z T4 — osobna ścieżka). Każda trasa
(`TradeRoute`) niesie już pole `budynekOdblokowany: boolean` z T3. T6 ma:
1. Dodać do wiersza trasy w `buildEmpireTradeSnap()` osobne pole ujawniające
   składnik 5% TEJ KONKRETNEJ trasy — analogicznie do sposobu liczenia w
   `computeTradeRouteBuildingBonusByCity()`, ale per trasa, nie zsumowane —
   sprawdź czy w `trade-routes.ts` istnieje już taka funkcja per-trasowa (T4 mogła
   ją stworzyć jako krok pośredni) czy trzeba dodać nowy, mały eksport.
2. Gdy `budynekOdblokowany===false` — pole 5% ma być `0` LUB nieść osobną flagę
   „czeka na budynek” (Twoja decyzja co do dokładnego kształtu, udokumentuj).
3. W `empireDetailPanel.ts` w tabeli „Handel — szlaki per miasto” pokazać rozkład
   dochodu (np. dodatkowa kolumna albo rozbicie w istniejącej komórce DOCHÓD:
   „X (dystans) + Y (5%)” lub „X (dystans) + 5% czeka na budynek”) — dopasuj do
   istniejącego stylu tabeli (`miniHeader`/`miniRow`/grid), nie wymyślaj nowego
   layoutu od zera.

## Kryteria sukcesu

1. Tabela tras handlowych w panelu imperium pokazuje per trasa: dochód dystansowy
   ORAZ składnik 5% (kwota, jeśli budynek jest) LUB jawne wskazanie że 5% czeka na
   budynek (jeśli budynku nie ma).
2. Suma pokazanych składników per trasa = to, co faktycznie trafia do skarbca dla
   tej trasy (spójność z `economy.ts`/T4 — zero rozjazdu wyświetlanej liczby od
   realnego wpływu, analogicznie do istniejącego komentarza CUDA-HANDEL-01 w kodzie
   o zgodności trzech miejsc wyświetlania tego samego dochodu).
3. Zero zmian w logice liczenia (T3/T4 nietykalne) — to wyłącznie warstwa
   prezentacji/odczytu już istniejących danych.
4. Real render (Playwright/Chromium) potwierdzający że rozkład faktycznie widać w
   DOM, zgodnie z `R-PROC-AUTOBOT.md` §9 poz. 6(a) — dowód z żywej przeglądarki dla
   każdej zmiany wizualnej, bezwarunkowo na tej ścieżce dispatchu.
5. `tsc --noEmit` i `vite build` (C-001) czyste; testy tematu + testy dotknięte +
   5 bramek referencyjnych zielone.
6. Jeśli dokładny UX rozkładu (np. gdzie dokładnie umieścić info „czeka na
   budynek” w istniejącej tabeli bez jej psucia) budzi wątpliwość — Operator sam
   dobiera najlepsze rozwiązanie zgodne z istniejącym stylem (to nie jest pytanie
   produktowe, tylko implementacyjne) i uzasadnia wybór w raporcie; DECISION_REQUIRED
   wyłącznie jeśli treść decyzji `R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` jest sprzeczna
   z tym, co widać w kodzie.

## Pętla

Operator → Evaluator → Final Control → integracja orkiestratora, jedno ID, jedna
gałąź. Limit 5 rund. Model/effort: **Opus 5 High dla Operatora i Evaluatora**
(temat czysto wizualny — UI/tabela, `R-PROC-AUTOBOT.md` §5a), Final Control
Sonnet 5 High.

## Raport terminalny dispatchu

ZMIANY/COMMIT: jeszcze brak — dispatch.
TESTY: kryteria sukcesu 1–6 wyżej.
BLOKADY: brak.
RUNDY: 0/5 (dispatch).
NASTĘPNY KROK: Operator, runda 1.
DEPLOY/PUSH: NIE WYKONANO.
