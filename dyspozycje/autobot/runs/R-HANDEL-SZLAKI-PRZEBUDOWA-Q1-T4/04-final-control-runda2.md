# Raport Final Control (runda 2) — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4

**STATUS: PASS**
**DOMAIN:** GAME
**TEMAT:** R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4
**GOAL:** zastąpić stary globalny mnożnik +5% Handlu (liczony ze WSZYSTKICH połączonych tras) addytywną sumą per-trasowych bonusów `0.05 × własny dochód dystansowy trasy`, naliczaną WYŁĄCZNIE dla tras z `budynekOdblokowany===true`, z realnym podłączeniem w rozgrywce.

**Metodologia:** własny, izolowany worktree (`/home/user/The-Game-worktrees/fc-handel-t4-q1-r2`, `git worktree add … FETCH_HEAD --detach`), `git fetch origin autobot/HANDEL-T4-Q1` → HEAD `5cbf2abd3854a3089e0d823b19735471c13222c3`, potwierdzony niezależnie `git ls-remote` (identyczny z raportami Operatora/Evaluatora). Worktree usunięty po zakończeniu weryfikacji.

## Co zweryfikowałem niezależnie

1. **Zakres/allowlista.** `git diff --stat 127143bb..5cbf2abd`: wyłącznie `trade-routes.ts`, `economy.ts`, `turn-economy.ts`, `main.ts`, `cityPanel.ts`, `trade-routes-income-test.cjs`, `02-operator-runda2.md` — dokładnie rozszerzona allowlista rundy 2 z `00-dispatch.md`. Zero `empireDetailPanel.ts`/`buildEmpireTradeSnap` (T6). `git merge-base --is-ancestor origin/main HEAD` = false, ale `git log 2955fe32..origin/main` pokazuje że `main` posunął się wyłącznie o commit dokumentacyjny (BLOCK rundy 1 + rozszerzenie allowlisty) — zero nakładania się plików, zero ryzyka konfliktu przy integracji.

2. **Czytanie diffu linia po linii** (nie tylko statystyki) dla wszystkich 5 plików kodu — każda zmiana zgodna z opisem obu ról:
   - `trade-routes.ts`: `computeTradeRouteCountByCity` → `computeTradeRouteBuildingBonusByCity`, filtr `budynekOdblokowany`, `bonus = 0.05 × tradeRouteTotalDistanceIncome(...)`, symetrycznie do `fromCityId`/`toCityId` (zgodne z precedensem Q8=B już ustalonym w `computeTradeRouteIncomeByCity`). Formuła dystansowa T1/T2 nietknięta.
   - `economy.ts`: `handelBrutto *= (1+0.05*n)` → `handelBrutto += premiaTrasHandlowych`, dokładnie w tym samym miejscu Step-ów (po Targowisku/civHandelMult, przed korupcją). Pole kontekstu przemianowane spójnie.
   - `turn-economy.ts`: `previewCityEconomy` i `advanceCityEconomy` — parametr przemianowany pozycyjnie bez przesunięcia miejsca w sygnaturze, przekabelowany do `ctx.premiaHandluTrasHandlowych` w obu funkcjach.
   - `main.ts`: import + 10 miejsc użycia zmiennej (2× rebuild po `refreshTradeRoutes`, 2× `getCityBuildingFlags`, 1× przekazanie do `advanceCityEconomy`, 4× `.clear()`) — wszystkie zaktualizowane.
   - `cityPanel.ts`: martwa stała `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE` usunięta, `activeTradeRouteCountForCity` filtruje `budynekOdblokowany`, 3 miejsca wyświetlania przełączone z fałszywego `+X%` na realną kwotę `+X Handlu` liczoną na żywo z `computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes())`.

3. **Martwy kod starego mechanizmu — potwierdzone usunięty.** Grep repo-wide po `tradeRouteCountByCity\b`, `liczbaAktywnychTrasHandlowych\b`, `computeTradeRouteCountByCity\b`, `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE` w plikach allowlisty: zero aktywnych wystąpień — wyłącznie komentarze historyczne. Sprawdziłem też pozostałe trafienia `computeTradeRouteCountByCity` w komentarzach `trade-routes.ts:989/1017` — dotyczą osobnej, niepowiązanej funkcji `computeSeaTradeRouteCountByCity` (mechanizm portowy R-BUDYNEK-PORTOWY, poza zakresem T4) — nie jest to ukryty równoległy stary mnożnik.

4. **Krytyczna, własna, NIEZALEŻNA weryfikacja zamknięcia buga** — własny skrypt (esbuild, bundlujący żywy `trade-routes.ts`), scenariusz z innymi liczbami niż użyte przez Operatora (dystans 5/8) i Evaluatora (dystans 6/10): miasto X z trasą LĄD dystans=1 BEZ budynku + trasą MORZE dystans=14 Z budynkiem, plus trzecia trasa `status='brak_polaczenia'` mimo `budynekOdblokowany=true`.
   - Trasa bez budynku → **brak wpisu w mapie** (dokładnie zamyka bug T3).
   - Trasa z budynkiem → bonus = dokładnie `0.05 × 58 = 2.9`, zgodne z ręcznym przeliczeniem `tradeRouteTotalDistanceIncome(14,'morze')`.
   - Obie strony trasy z budynkiem dostają identyczną kwotę (Q8=B potwierdzone).
   - Trasa rozłączona (`brak_polaczenia`) ignorowana mimo `budynekOdblokowany=true` — gating statusu działa poprawnie.

5. **Testy — wszystkie uruchomione niezależnie we własnym worktree:**
   - `tsc --noEmit`: 0 błędów.
   - `vite build --outDir /tmp/... --emptyOutDir`: czysty, 846 modułów — identyczne z obydwoma raportami.
   - `trade-routes-income-test.cjs`: **94/0** (sekcje F/G/H czytelnie testują nietautologicznie — G porównuje `handelBrutto` z ręcznie liczonym `Math.floor(base+premia)`, nie z wewnętrzną formułą pod testem).
   - `trade-routes-test` 65/0, `trade-grant-test` 62/0, `zloto-szlak-test` 54/0, `mennica-uspienie-test` 49/0, `owner-economy-test` 9/0, `ai-major-economy-test` 33/0.
   - Wszystkie 42 testy `diplomacy-*`/`eot-diplomacy-*` dotknięte pośrednio przez ekonomię handlu: 0 FAIL.
   - `trade-ilosc-test.cjs`: 35/5 — potwierdzone `git diff 127143bb..HEAD` = 0 linii na tym pliku, pre-istniejące.
   - `praca-global-default-live-test.cjs`: 7/7, brak regresji.
   - 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — identyczne z wartościami referencyjnymi `R-PROC-AUTOBOT.md` §6.

6. **Artefakt raportu.** `02-operator-runda2.md` faktycznie istnieje na branchu (nie tylko deklaracja) — treść zgodna z raportem terminalnym Operatora.

## Drobna uwaga (nieblokująca, zgodna z notatką Evaluatora)

`cityPanel.ts` wyświetla `Math.round(premiaTrasHandlowych)` zamiast `Math.floor()` stosowanego w silniku na całym `handelBrutto` — kosmetyczna rozbieżność do ±1 w wyświetlonej liczbie przy niecałkowitej premii. Kierunek i rząd wielkości poprawne (kwota rzeczywista, nie fałszywy procent) — nie kwalifikuje się jako "kłamliwy napis". Do rozważenia przy T6, nie powód FAIL.

## Podsumowanie zgodności ról

Operator i Evaluator zgodni ze sobą i z rzeczywistym stanem repo we wszystkich sprawdzonych przeze mnie punktach. Zero rozbieżności wymagających korekty.

**ZMIANY/COMMIT:** potwierdzone — `autobot/HANDEL-T4-Q1`, `5cbf2abd`, na wierzchu `127143bb`, wypchnięty do `origin/autobot/HANDEL-T4-Q1`. Zero nakładania z `main` (który posunął się wyłącznie o commit dokumentacyjny bez konfliktu plików).

**TESTY:** własny worktree, `tsc` 0 błędów, `vite build` czysty (846 modułów), 5 bramek referencyjnych zielone, wszystkie testy tematu i sąsiednie (handel/dyplomacja/ekonomia) zielone z liczbami identycznymi do obu raportów, własny niezależny skrypt repro (inne dane niż Operator/Evaluator) potwierdzający zamknięcie buga i poprawność formuły.

**BLOKADY:** brak.

**RUNDY:** 1/5 (runda 1 była BLOCK-bez-kodu, nie zużywa licznika — potwierdzone zgodnie z C-054).

**NASTĘPNY KROK:** integracja orkiestratora do `main` (allowlist-only, per plik/hunk — choć tu nie ma nakładania, więc pełny merge bezpieczny), następnie `READY_FOR_DEPLOY`. Temat odblokowuje deploy ROBOCZA (T3 wymaga T4).

**DEPLOY/PUSH:** NIE WYKONANO (poza zakresem Final Control).

**GOTOWOŚĆ DO INTEGRACJI: TAK.**