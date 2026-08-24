# RAPORT FINAL CONTROL — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3

STATUS: **PASS-WITH-NOTES**
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3
GOAL: Rozdzielić w `refreshTradeRoutes()` gating budynkami handlowymi od istnienia trasy.

## Metodologia

Własny, izolowany worktree (`git worktree add ... FETCH_HEAD` na `origin/autobot/HANDEL-T3-Q1`, commit `c206b490`), niezależny od worktree'y Operatora i Evaluatora. Osobny drugi worktree jako baseline na `origin/main` (`aa11df2a`) do niezależnej weryfikacji pre-istniejących FAIL. `node_modules` zsymlinkowany, `package.json` bit-identyczny w obu worktree'ach. Oba worktree usunięte po zakończeniu (`git worktree remove --force`).

## Zakres i allowlista

`git diff origin/main..HEAD --stat`: `gra/src/game/trade-routes.ts` + 3 pliki testów (`trade-routes-test.cjs`, `trade-routes-income-test.cjs`, `trade-grant-test.cjs`). Dodatkowo widoczne jako "usunięcie" `dyspozycje/autobot/runs/.../01-operator.md` — to artefakt zdywergowanej bazy (plik doszedł do `origin/main` przez orkiestratora PO odgałęzieniu brancha T3), nie zmiana Operatora; poza allowlistą kodu, bez wpływu na scalenie (branch go po prostu nie ma, merge zachowa wersję z `main`). Zgodne z allowlistą dispatchu.

Przejrzałem diff `trade-routes.ts` hunk-po-hunku (13 hunków, zakresy linii 18–437, 573–725, 724–810 w nowym pliku) i potwierdziłem grepem, że `findCityConnection`, `cityHasPort`, `PORT_BUILDING_IDS`, `detectBestConnection`, `DEFAULT_TRADE_ROUTE_INCOME_PARAMS`, `tradeRouteDistanceIncome`, `tradeRouteTotalDistanceIncome` leżą całkowicie poza zmienionymi zakresami. Fizyczny wymóg Portu na morze i formuła dystansowa T1/T2 — nietknięte, potwierdzone statycznie.

## Weryfikacja kryteriów sukcesu dispatchu (1–6)

1–4, 6 — potwierdzone niezależnie: własny minimalny scenariusz (2 miasta, `builtByCity` pusty) przez `refreshTradeRoutes` w świeżo zbundlowanym kodzie (esbuild) dał trasę `status='polaczony'`, `budynekOdblokowany=false`, `dystans=5`, dochód dystansowy > 0 bez żadnego budynku. Nazwa pola zgodna z sugestią dispatchu, bez `DECISION_REQUIRED`.
5 — `tsc --noEmit`: czyste (własne uruchomienie). Testy własne uruchomienia: `trade-routes-test.cjs` 65/0, `trade-routes-income-test.cjs` 91/1 (H2), `trade-grant-test.cjs` 62/0, `trade-ilosc-test.cjs` 35/5, `mennica-uspienie-test.cjs` 49/0, `zloto-szlak-test.cjs` 54/0 — identyczne liczby co w raportach Operatora/Evaluatora. 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/0, `research-test.cjs` 33/0, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — wszystkie zielone.

**Weryfikacja pre-istnienia FAIL (nie z pamięci, na własnym baseline worktree `origin/main`):** `trade-routes-income-test.cjs` (stara wersja pliku) na baseline: 74/1, ten sam H2, identyczny komunikat `(got 38, want 37)` — bit-for-bit. `trade-ilosc-test.cjs` na baseline: 35/5 — identyczna liczba. Potwierdzone niezależnie, nie z deklaracji Operatora/Evaluatora.

Przejrzałem też diff nowych asercji w testach (D1/D2/E/J1/J2 w `trade-routes-income-test.cjs`, F2 w `trade-grant-test.cjs`) — nietautologiczne, faktycznie sprawdzają nowe zachowanie (trasa istnieje bez budynku + dochód > 0 + `budynekOdblokowany` poprawnie przydzielany wg priorytetu; F2 transparentnie udokumentowana zmiana zachowania grantu surowcowego).

## Ustalenie wymagające uwagi orkiestratora (powód PASS-WITH-NOTES)

Zweryfikowałem kodem i własnym testem uruchomionym na silniku (nie z pamięci) efekt uboczny, którego **ani Operator, ani Evaluator nie zidentyfikowali**: `computeTradeRouteCountByCity(tradeRoutes)` (`trade-routes.ts`) liczy WSZYSTKIE trasy o `status='polaczony'`, bez względu na `budynekOdblokowany`. Ta liczba zasila `ctx.liczbaAktywnychTrasHandlowych` w `economy.ts:954-957` — to jest **właśnie ten stary, globalny mnożnik +5% Handlu za trasę**, który T4 ma dopiero zastąpić sumą per-trasowych bonusów gated przez `budynekOdblokowany` (ECHO Q3). Własny test na zbudowanym silniku: trasa bez żadnego budynku handlowego (`budynekOdblokowany=false`) i tak trafia do `computeTradeRouteCountByCity` z wartością >0.

Skutek: jeśli T3 trafi samodzielnie do `main` i zostanie wdrożony (deploy) **przed** T4, miasto z aktywną trasą, ale BEZ jakiegokolwiek budynku handlowego, natychmiast dostanie stary +5% Handlu (bo istniejący mnożnik w `economy.ts` nie sprawdza budynku, tylko liczbę tras) — **dokładnie odwrotnie** niż cytat właściciela: „w momencie, gdy budynki staną wybudowane, to dochodzi dodatkowo tych 5%". To nie jest defekt kodu T3 względem jego własnego zakresu (dispatch jawnie wyklucza `economy.ts`) — to ryzyko sekwencjonowania integracji/deploya.

**Rekomendacja dla orkiestratora:** nie dopuszczać do `DEPLOY/PUSH` stanu `main`, w którym T3 jest zintegrowane, a T4 jeszcze nie — najbezpieczniej scalić T3+T4 razem albo przynajmniej upewnić się, że T4 jest zintegrowane zanim jakikolwiek deploy ROBOCZA/FALA obejmujący T3 zostanie wykonany. Warto dopisać tę zależność jawnie w `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` przy integracji T3.

## Konkluzja

Kod T3 spełnia wszystkie 6 kryteriów sukcesu dispatchu, ściśle w allowlistě, bez regresji formuły/Portu, wszystkie testy (własne + Operatora/Evaluatora + 5 bramek referencyjnych) zielone lub bit-for-bit identyczne z niezwiązanymi pre-istniejącymi FAIL na `origin/main` (zweryfikowane niezależnie na własnym baseline). Jedna materialna uwaga (niewiążąca dla samego kodu T3, wiążąca dla kolejności integracji/deploya): stary globalny mnożnik +5% Handlu w `economy.ts` przestanie być pośrednio gated budynkami z chwilą scalenia T3 — wymaga T4 zanim jakikolwiek deploy dotrze do graczy.

BLOKADY: brak (dla samego T3); ryzyko sekwencjonowania integracja-przed-T4 opisane wyżej.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora do `main` (allowlist-only), z notatką o zależności T3→T4 przed deployem; następnie dispatch T4.
DEPLOY/PUSH: NIE WYKONANO (poza zakresem Final Control) — **rekomendacja: nie deployować T3 bez T4**.

Pliki użyte w tej weryfikacji (lokalne, poza repo, worktree'e usunięte po zakończeniu): oba worktree pod `/tmp/claude-0/.../scratchpad/fc-t3/{w,baseline}` — usunięte. Ad-hoc plik testowy potwierdzający ustalenie o `computeTradeRouteCountByCity` (`.fc-t3-side-effect-check.cjs`) — utworzony, uruchomiony, usunięty; nie jest częścią zmian tematu.