Now composing the Final Control verdict.

## Raport Final Control — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4

**STATUS: BLOCK — potwierdzam** (werdykt Operatora i Evaluatora prawidłowy, konflikt kontraktu jest realny; gotowość do integracji: **NIE**, do czasu decyzji właściciela)
**DOMAIN:** GAME
**TEMAT:** R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4
**GOAL:** zastąpić globalny mnożnik +5% Handlu sumą per-trasowych bonusów 0,05×dochód dystansowy, wyłącznie dla tras `budynekOdblokowany===true`.

**Metodologia:** własny, niezależny worktree (`git worktree add … FETCH_HEAD --detach`, commit `127143bb`, node_modules symlink z main), zero zależności od raportów Operatora/Evaluatora poza punktem wyjścia.

### Co zweryfikowałem niezależnie i potwierdziłem

1. **Zakres zmian.** `git merge-base origin/main FETCH_HEAD` = `2955fe32` = `origin/main`. `git diff origin/main..FETCH_HEAD --stat` → **1 plik, 70 insercji, wyłącznie `decision-abc.md`**. Zero zmian w `trade-routes.ts`/`economy.ts`/`main.ts`/`cityPanel.ts`. Zgodne z oboma raportami.

2. **`tsc --noEmit`** → 0 błędów. **5 bramek referencyjnych**: logic 213/213, tech-tree 19/19, research 33/33, unit-replace 13/13, combat 6/6 — wszystkie zielone, zgodne z baseline `main` z §6 `R-PROC-AUTOBOT.md`.

3. **Testy tematu**: `trade-routes-test` 65/0, `trade-routes-income-test` 91 passed/1 failed (H2, pre-istniejący), `trade-ilosc-test` 35/5 (pre-istniejące), `mennica-uspienie-test` 49/0, `zloto-szlak-test` 54/0 — liczby identyczne z obydwoma raportami.

4. **Krytyczna, niezależna weryfikacja buga (zadanie priorytetowe orkiestratora).** Napisałem własny skrypt repro (esbuild, bez mocków, bundlujący żywy `trade-routes.ts`+`economy.ts`) — dwa miasta, dystans 2, zero budynków handlowych:
   - `refreshTradeRoutes` → trasa powstaje, `status='polaczony'`, `budynekOdblokowany=false`;
   - `computeTradeRouteCountByCity()` mimo to zwraca `1`;
   - `cityYieldPerTurn` z tym `ctx.liczbaAktywnychTrasHandlowych=1` → `handelBrutto=42` zamiast bazowych `40`.

   Liczby identyczne z reprodukcją Evaluatora. Potwierdzone też przez czytanie źródła wprost: `computeTradeRouteCountByCity` (trade-routes.ts:963-972) i `activeTradeRouteCountForCity` w `cityPanel.ts` (10512-10521) filtrują WYŁĄCZNIE po `route.status==='polaczony'`, nigdzie nie odwołują się do `budynekOdblokowany`; a `status` jest przypisywany niezależnie od `budynekOdblokowany` (`trade-routes.ts:436` vs `:777/808`). Istniejący test T3 (`trade-routes-income-test.cjs`, sekcja J1) niezależnie potwierdza `budynekOdblokowany=false` przy `status='polaczony'` i dochodzie dystansowym >0. **Bug jest faktycznie otwarty na tym commicie — to jedyny powód pilności tego tematu, i jest potwierdzony trzema niezależnymi drogami (żywy silnik, czytanie kodu, istniejący test).**

5. **Miejsce wpięcia w economy.ts.** Zweryfikowałem bezpośrednio (linie 945-960): stary mnożnik siedzi PO `civHandelMult`/Targowisku, PRZED „Step 5 (renumbered from 6): Apply corruption/waste" — zgodne z opisem w `decision-abc.md` i z zakresem plików `T4` w `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md:170` (`trade-routes.ts`, `economy.ts` — dokładnie te dwa, **bez** `turn-economy.ts`/`main.ts`/`cityPanel.ts`, co potwierdza że luka allowlisty pochodzi z niekompletnego mapowania plików w samej decyzji, nie z błędu Operatora).

6. **Konflikt sam w sobie** — treść `decision-abc.md` jest dokładnie zgodna z rzeczywistym kodem w każdym sprawdzonym numerze linii i nazwie funkcji. Charakter czysto inżynierski (podmiana kształtu istniejącej mapy w 3 plikach, bez zmiany formuły/liczb) potwierdzony — kwalifikuje się do lekkiej ścieżki, nie C-018.

### Znalezisko wymagające korekty przed wznowieniem (nie blokuje samego BLOCK, ale wpływa na treść przyszłego dispatchu)

**Liczba miejsc w `main.ts` jest niedoszacowana.** Własny grep (`tradeRouteCountByCity` jako identyfikator zmiennej, nie nazwa importowanej funkcji) daje **10** miejsc, nie 8 (Operator) ani nawet 9 (Evaluator podał liczbę „9", ale wypisał 10 numerów linii — sam się pomylił w podsumowaniu, choć lista jest poprawna):
`2581` (deklaracja), `13051`+`31499` (budowa), **`19814`+`29972` (zasilenie `ctx.liczbaAktywnychTrasHandlowych` — to są NAJWAŻNIEJSZE dwie linie, bo to one realnie podłączają dane do `cityYieldPerTurn`)**, `25615` (przekazanie), `30445`/`30772`/`31017`/`31243` (`.clear()`). Jeśli orkiestrator zatwierdzi rozszerzenie allowlisty dosłownie jako „8 punktów", a wznowiony Operator policzy je od nowa i pominie któreś z dwóch `ctx`-feed, mechanizm zostanie martwy mimo pozornie kompletnej listy plików. Rekomendacja: zatwierdzić allowlistę **plikiem**, nie sztywną liczbą punktów w nim.

### T6 — czy będzie miał dane gotowe do wyświetlenia (zadanie orkiestratora)

Sprawdzone w `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md:172`: T6 = „UI per-trasa pełny rozkład dochodu", zależność T1+T2+T4, zakres `empireDetailPanel.ts` + `main.ts::buildEmpireTradeSnap()` — **`buildEmpireTradeSnap()` jest świadomie poza zakresem T4** (potwierdzone w `decision-abc.md` i w `00-dispatch.md` T3/T4). To nie jest problem: T6 operuje bezpośrednio na liście `tradeRoutes` (już ma `dystans`/`medium`/`budynekOdblokowany` per trasa) i na już wyeksportowanej `tradeRouteTotalDistanceIncome()` z `trade-routes.ts` — czyli T6 nie potrzebuje per-miastowej mapy sum, którą T4 wpina do `economy.ts`, tylko surowych danych trasy, które już istnieją niezależnie od kształtu tej mapy. **Rekomendacja dla wznowionego Operatora T4** (niewiążąca, do rozważenia przy kodowaniu, nie blokuje T4): wystawić w `trade-routes.ts` jedną małą, eksportowaną funkcję liczącą bonus pojedynczej trasy (np. `tradeRouteHandelBonus(route, incomeParams)`), żeby T6 jej użył zamiast implementować wzór po raz trzeci — dokładnie ten wzorzec duplikacji formuły już raz wystąpił i został naprawiony (`P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1`, rozwiązane przy T2).

### Podsumowanie zgodności raportów

Operator i Evaluator zgodni ze sobą i z rzeczywistym stanem repo we wszystkich sprawdzonych przeze mnie punktach poza drobną nieścisłością w liczbie miejsc w `main.ts` (patrz wyżej — nie zmienia to werdyktu, tylko treść przyszłego dispatchu).

**ZMIANY/COMMIT:** potwierdzone — `autobot/HANDEL-T4-Q1`, `127143bb`, wypchnięty do `origin/autobot/HANDEL-T4-Q1`, jedyny plik `decision-abc.md`.
**TESTY:** własny worktree, `tsc` 0 błędów, 5 bramek referencyjnych zielone, 5 testów tematu zgodne z baseline (91/1, 35/5 pre-istniejące), własny skrypt repro potwierdzający bug żywym silnikiem — patrz punkty 2-4 wyżej.
**BLOKADY:** konflikt allowlisty potwierdzony jako realny, nierozwiązywalny bez rozszerzenia o `turn-economy.ts` (2 funkcje), `main.ts` (10, nie 8, miejsc — patrz znalezisko wyżej) i jedną linię `cityPanel.ts`. Bez tego: albo nowy mechanizm jest martwy w rozgrywce, albo usunięcie starego mnożnika zostawia miasta bez bonusu za trasy.
**RUNDY:** 0/5 (STOP przy konflikcie kontraktu nie zużywa rundy, C-054 — potwierdzone).
**NASTĘPNY KROK:** decyzja orkiestratora/właściciela o rozszerzeniu allowlisty T4 o `gra/src/game/turn-economy.ts`, `gra/src/main.ts` (wszystkie ~10 miejsc identyfikatora `tradeRouteCountByCity`, bez `buildEmpireTradeSnap()`) i jedną linię `gra/src/ui/cityPanel.ts`; następnie wznowienie Operatora na tym samym ID/branchu `autobot/HANDEL-T4-Q1`. Rozważyć dodatkowo (niewiążąco) eksport reużywalnej funkcji per-trasowego bonusu w `trade-routes.ts` pod kątem T6.
**DEPLOY/PUSH:** NIE WYKONANO (branch roboczy wypchnięty do origin, poza tym brak integracji/deployu — poza zakresem Final Control).
**GOTOWOŚĆ DO INTEGRACJI:** NIE — wymagana decyzja właściciela o allowliście przed dowolnym dalszym dispatchem tego ID.