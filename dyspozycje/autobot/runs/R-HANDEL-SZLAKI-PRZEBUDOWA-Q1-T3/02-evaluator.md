# RAPORT EVALUATORA — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3

STATUS: **PASS**
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T3
GOAL: Rozdzielić w `refreshTradeRoutes()` gating budynkami handlowymi od istnienia trasy.

## Metodologia

Własny, izolowany worktree (`git worktree add ... FETCH_HEAD` na `origin/autobot/HANDEL-T3-Q1`, commit `c206b490`), niezależny od worktree Operatora. Baseline porównawczy: osobny worktree na `origin/main` (`aa11df2a`). `node_modules` zsymlinkowany z głównego repo (package.json bit-identyczny — zweryfikowane `diff`).

## Zadanie 1 — Zakres zmian

`git diff origin/main..HEAD --stat`: wyłącznie `gra/src/game/trade-routes.ts` + `gra/tools/{trade-routes-test,trade-routes-income-test,trade-grant-test}.cjs`. Zero `economy.ts`, `empireDetailPanel.ts`, `main.ts`. Merge-base = `origin/main` (bez dryfu). **Zgodne z allowlistą.** Przejrzałem cały diff hunk-po-hunku (12 hunków) — lista zmienionych zakresów linii nie pokrywa się z `findCityConnection` (308-393), `cityHasPort` (153-162) ani `detectBestConnection` (530+), `DEFAULT_TRADE_ROUTE_INCOME_PARAMS` (~840-920) — potwierdzone też statycznie przez `grep -n` definicji tych funkcji w pliku po zmianie.

## Zadanie 2 — Trasa istnieje i daje dochód BEZ budynku (własny scenariusz)

Napisałem **własny, niezależny plik testowy** (`eval-t3-independent-test.cjs`, 26 asercji), używający bezpośrednio `refreshTradeRoutes`/`computeTradeRouteIncomeByCity`/`createTradeRoute` z realnego silnika (bundlowanie esbuild, ta sama technika co testy Operatora, ale własne fixture'y/scenariusze, napisane PRZED szczegółową lekturą testów Operatora):

- Zero budynków handlowych w obu miastach, aktywna umowa, brak wojny, ląd → trasa **istnieje**, `status='polaczony'`, `budynekOdblokowany=false`, dochód dystansowy obu miast **> 0**.
- Budynek tylko po jednej stronie → trasa istnieje, dochód > 0, `budynekOdblokowany` nadal `false` (wymaga obu stron).
- Budynek po obu stronach → `budynekOdblokowany=true`.
- Wojna / brak traktatu nadal całkowicie blokują trasę (regresja niezmieniona przez T3).
- Wynik: **26/26 passed**.

## Zadanie 3 — Fizyczny wymóg Portu na morzu

Osobne fixture'y z wyspami (pas wody blokujący ląd): brak Portu w ogóle → **0 tras** (nie tylko brak flagi); Port tylko jednostronnie → **0 tras**; Port obustronnie → trasa powstaje, `medium='morze'`, `budynekOdblokowany=true` (bo `port` jest jednocześnie w `PORT_BUILDING_IDS` i `TRADE_BUILDING_IDS` — spójne z definicją w kodzie). Potwierdza, że rozdzielenie gatingu budynkowego od istnienia trasy **nie naruszyło** niezależnego fizycznego wymogu Portu z `findCityConnection`. Diff nie dotyka linii tej funkcji (patrz Zad. 1).

## Zadanie 4 — Krytyczna ocena projektu `budynekOdblokowany`

- Nazwa pola zgodna z sugestią dispatchu.
- Mechanizm przydziału gdy tras > slotów: dokładnie ten sam mechanizm priorytetu co dawniej gatingował istnienie (`existingRoutes` sort po id → `fresh` sort po rosnącym dystansie), teraz konsumujący `tradeRouteLimitForCity` wyłącznie dla flagi. Zweryfikowałem to zachowanie niezależnie w scenariuszu S7 (własny test): istniejąca trasa A-B z flagą `true` **zachowuje** slot mimo pojawienia się bliższej A-D w kolejnej turze; A-D mimo to **nadal istnieje i zarabia** (tylko bez flagi) — dokładnie to, co dispatch wymagał w kryterium 3 ("Reguła stabilności... zachowana dla nowego pola").
- Uzasadnienie z cytatu właściciela ("budynki... dochodzi dodatkowo tych 5%" do już płynącego dochodu) trafnie odzwierciedla decyzję: budynek pozostaje rzadkim zasobem przydzielanym wg tego samego priorytetu co dawniej decydował o samym istnieniu — zgodne z `docs/decyzje/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1.md` ECHO Q3 (Wariant C, T4 poza zakresem).
- `createTradeRoute()` liczy `budynekOdblokowany` uproszczono (bez rywalizacji o slot) — sprawdziłem: funkcja jest **martwym kodem produkcyjnym** (brak wywołań w `main.ts`, tylko w testach), więc uproszczenie nie wpływa na realną rozgrywkę; jawnie udokumentowane w komentarzu.
- Efekt uboczny `computeTradeRouteResourceGrants` (grant brąz/żelazo/koń przetrwał brak budynku) — zweryfikowałem kodem: ta funkcja zależy wyłącznie od `route.status`, nigdy nie odwoływała się do budynków ani przed, ani po T3 — więc to naturalna, poprawna konsekwencja usunięcia gatingu istnienia, nie scope creep. Operator zaktualizował tylko 1 test odzwierciedlający tę (poprawną) zmianę zachowania, transparentnie to opisując.
- Kompatybilność starych zapisów: `main.ts:31584` ładuje `tradeRoutes` bezpośrednio z pliku zapisu bez migracji — ale `refreshTradeRoutes` **nigdy nie czyta** `route.budynekOdblokowany` z `existingRoutes`, zawsze przelicza je na nowo przez `grantBuilding()`. Brak ryzyka nawet dla starych zapisów sprzed T3 (self-healing przy pierwszym odświeżeniu tury).

## Zadanie 5 — tsc/build/testy (własne polecenia, ten sam worktree)

| Test | Wynik (mój) | Zgodność z raportem Operatora |
|---|---|---|
| `tsc --noEmit` | czyste | ✓ |
| `vite build` (outDir poza repo) | OK, 32.98s | ✓ |
| `trade-routes-test.cjs` | 65/0 | ✓ |
| `trade-routes-income-test.cjs` | 91 passed / 1 FAIL (H2) | ✓ — H2 zweryfikowany **bit-for-bit identyczny** na baseline `origin/main` (własny worktree, ten sam komunikat: "got 38, want 37") |
| `trade-grant-test.cjs` | 62/0 | ✓ |
| `trade-ilosc-test.cjs` | 35 passed / 5 FAIL | ✓ — te same 5 FAIL (identyczne komunikaty) zweryfikowane na baseline `origin/main` |
| `mennica-uspienie-test.cjs` | 49/0 | ✓ |
| `zloto-szlak-test.cjs` | 54/0 | ✓ |
| `logic-test.cjs` | 213/213 | ✓ |
| `tech-tree-test.cjs` | 19/0 | ✓ |
| `research-test.cjs` | 33/0 | ✓ |
| `unit-replace-test.cjs` | 13/13 | ✓ |
| `combat-test.cjs` | 6/6 | ✓ |

## Zadanie 6 — Formuła dystansowa T1/T2 nietknięta

Diff nie dotyka `DEFAULT_TRADE_ROUTE_INCOME_PARAMS`/`tradeRouteDistanceIncome`/`tradeRouteTotalDistanceIncome`. Własny scenariusz S6: dochód rośnie wraz z dystansem (nieodwrócona regresja starej formuły), mieści się w clampie `[5,40]` (stałe z T1) — regresja czysta.

## Konkluzja

Wszystkie 6 zadań zweryfikowane niezależnie z pozytywnym wynikiem. Zakres ściśle zgodny z allowlistą, fizyczny Port nietknięty, nowe pole poprawnie zaprojektowane i uzasadnione cytatem właściciela, wszystkie testy (własne + Operatora + bramki referencyjne) zielone lub bit-for-bit identyczne z pre-istniejącymi, niezwiązanymi FAIL-ami na `origin/main`. Brak blokad.

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO (poza zakresem Evaluatora).

Pliki użyte/wytworzone w tej ocenie (lokalne, poza repo `/home/user/The-Game`, worktree'y usunięte po zakończeniu): `/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/eval-t3/gra/tools/eval-t3-independent-test.cjs` (treść zachowana powyżej w opisie testów, plik istniał tylko w usuniętym worktree, nienarudzony do repo — nie jest częścią zmian tematu).

**Uwaga informacyjna (niewiążąca):** commit `aa11df2a` na `origin/main` ("docs(run): ...raport Operatora rundy 1") zawiera `01-operator.md` — Operator w swoim raporcie opisał ten plik jako "NIEZACOMMITOWANY" w bieżącym worktree. Plik jest już wypchnięty do `origin/main` (prawdopodobnie przez orkiestratora równolegle). Nie wpływa na ocenę kodu (poza allowlistą tego dispatchu), zgłaszam do wiadomości Final Control/orkiestratora.