STATUS: PASS
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4

GOAL: Zastąpić stary globalny mnożnik +5% Handlu (liczony ze WSZYSTKICH połączonych tras) addytywną sumą per-trasowych bonusów `0.05 × własny dochód dystansowy trasy`, naliczaną WYŁĄCZNIE dla tras z `budynekOdblokowany===true`, z realnym podłączeniem w rozgrywce (turn-economy.ts/main.ts/cityPanel.ts).

WERYFIKACJA (własny, izolowany worktree `/home/user/The-Game-worktrees/eval-handel-t4-q1-r2`, `git fetch origin autobot/HANDEL-T4-Q1` → commit `5cbf2abd` na `origin`, potwierdzony `git ls-remote`, HEAD zgodny z raportem):

1. **Zakres/allowlista rundy 2**: `git diff --name-status 127143bb 5cbf2abd` = wyłącznie `trade-routes.ts`, `economy.ts`, `turn-economy.ts`, `main.ts`, `cityPanel.ts`, `trade-routes-income-test.cjs`, raport `02-operator-runda2.md`. Zero `empireDetailPanel.ts`/`buildEmpireTradeSnap` (T6). Zgodne z rozszerzoną allowlistą z `decision-abc.md`.

2. **NAJWAŻNIEJSZE — scenariusz na żywym silniku, własny, niezależny (inne ID/dystans/medium niż fixture Operatora)**: zbudowałem esbuild-em bundle tych samych modułów co main.ts (`computeTradeRouteBuildingBonusByCity`, `cityYieldPerTurn`) i uruchomiłem scenariusz z dwiema trasami tego samego miasta: trasa LĄD dystans=6 BEZ budynku + trasa MORZE dystans=10 Z budynkiem.
   - Trasa BEZ budynku → premia = **dokładnie 0** (brak wpisu w mapie), `handelBrutto` identyczne jak bez żadnej trasy — dokładnie bug zamykany przez T4 potwierdzony jako naprawiony.
   - Trasa Z budynkiem → premia = **dokładnie 2.2** = `0.05 × 44`, gdzie 44 = ręcznie przeliczony wzór dystansowy (niezależnie od kodu, wg `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md`) I potwierdzone przez wyeksportowaną `tradeRouteTotalDistanceIncome` — identyczne.
   - `cityYieldPerTurn` end-to-end: `handelBrutto` z obiema trasami = `floor(baseline + 2.2)` — matematyka zgadza się co do jednostki.
   - Obie strony trasy Z budynkiem dostają identyczną kwotę (Q8=B); druga strona trasy BEZ budynku też 0.
   - Wszystkie kroki PASS (10/10).

3. **Kompletność podłączenia w main.ts**: grep repo-wide po `tradeRouteCountByCity`/`computeTradeRouteCountByCity`/`liczbaAktywnychTrasHandlowych`/`TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE` — zero wystąpień w aktywnym kodzie (wyłącznie w komentarzach historycznych/dokumentacyjnych, np. `trade-routes.ts:32,966,969,989,1017`, `economy.ts:652` — opisowe, nie martwy kod). Stary mechanizm faktycznie usunięty, nie żyje równolegle. Policzyłem 11 miejsc użycia nowego `tradeRouteBuildingBonusByCity`/`computeTradeRouteBuildingBonusByCity` w main.ts (import, deklaracja, 2× przeliczenie po `refreshTradeRoutes`, 2× `getCityBuildingFlags`, 1× przekazanie do `advanceCityEconomy`, 4× `.clear()`) — kompletne, parametr w `advanceCityEconomy` (main.ts:25616) zgodny pozycyjnie z sygnaturą (`turn-economy.ts:2270`).

4. **cityPanel.ts**: linia „premia za trasy handlowe" teraz liczy `computeTradeRouteBuildingBonusByCity(cfg.getTradeRoutes?.() ?? [])` na żywo z realnych tras (nie cache'owana martwa stała) i pokazuje kwotę absolutną (`+X Handlu`) zamiast fałszywego `+X%` — usunięta martwa stała `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE`, `activeTradeRouteCountForCity` filtruje `budynekOdblokowany`. Ścieżka podglądu panelu (`cfg.getCityBuildingFlags` → `ctx.premiaHandluTrasHandlowych` → `cityYieldPerTurn`, linia ~1180) spójna z silnikiem.

5. **Matematyka** — potwierdzona ręcznie i niezależnie od kodu operatora (patrz pkt 2): zgadza się dokładnie.

6. **Testy niezależnie uruchomione**:
   - `tsc --noEmit`: 0 błędów.
   - `vite build --outDir /tmp/... --emptyOutDir` (poza repo, C-001): czysty, 846 modułów — identyczne z raportem.
   - `trade-routes-income-test.cjs`: **94 passed, 0 failed**. Baseline na `127143bb` (`git checkout` plików do stanu rodzica, bez `git stash` bo brak lokalnych zmian): **91 passed, 1 failed (H2)** — identyczne z deklaracją operatora, potwierdzone niezależnie.
   - 14 testów handlu/dyplomacji/ekonomii z raportu: wszystkie zielone, dokładnie zgodne liczby (ai-major-economy 33/0, diplomacy-* wszystkie 0 fail, mennica-uspienie 49/0, owner-economy 9/0, trade-grant 62/0, trade-routes-test 65/0, zloto-szlak 54/0).
   - `trade-ilosc-test.cjs`: 35 passed/5 failed, plik bez diffu vs `127143bb` (`git diff` pusty) — potwierdzony pre-istniejący, niezmieniony.
   - 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — identyczne z wartościami referencyjnymi w `R-PROC-AUTOBOT.md` §6.
   - `praca-global-default-live-test.cjs`: 7/7 PASS, brak regresji.

7. **T1/T2/gating T3 nietknięte**: diff `trade-routes.ts` ogranicza się wyłącznie do zamiany funkcji `computeTradeRouteCountByCity` → `computeTradeRouteBuildingBonusByCity` (+24/-6); `tradeRouteDistanceIncome`, `tradeRouteTotalDistanceIncome`, `refreshTradeRoutes` i gating budynkowy T3 bez zmian.

8. Skontrolowałem też 3 wywołania `previewCityEconomy` w main.ts (linie ~15271/15469/15630, podgląd racji żywności/HUD) — przekazują `undefined` na pozycji mapy premii identycznie jak w `127143bb` (zero diffu w tych miejscach) — pre-istniejące, poza zakresem GOAL (dotyczą Żywności, nie Handlu), nie regresja rundy 2.

DROBNA UWAGA (nie blokująca): `cityPanel.ts` wyświetla `Math.round(premiaTrasHandlowych)` — kosmetyczne zaokrąglenie samej linii tekstu, niezależne od `Math.floor()` faktycznie stosowanego w silniku na całym `handelBrutto`; przy niecałkowitej premii wyświetlona liczba może się różnić o 1 od realnego wkładu widocznego w rozbiciu. Nie jest to „kłamliwy" napis w sensie kryterium 4 (kierunek i rząd wielkości poprawne, kwota rzeczywista nie procent) — kosmetyka do rozważenia przy T6, nie powód FAIL.

BLOKADY: brak.

NASTĘPNY KROK: Final Control, runda 1.

DEPLOY/PUSH: NIE WYKONANO (poza zakresem Evaluatora).