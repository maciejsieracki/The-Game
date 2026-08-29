## Raport Evaluatora — R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4

STATUS: **BLOCK** (potwierdzam BLOCK Operatora, konflikt kontraktu jest realny i uzasadniony)
DOMAIN: GAME
TEMAT: R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4
GOAL: (jak w dispatchu) zastąpić globalny mnożnik +5% Handlu sumą per-trasowych bonusów 0.05×dochód, wyłącznie dla tras z `budynekOdblokowany===true`.

**Metodologia:** własny worktree (`git fetch origin autobot/HANDEL-T4-Q1` → `git worktree add ... origin/autobot/HANDEL-T4-Q1 --detach`, kommit `127143bb`, zweryfikowany identyczny z raportem), niezależny od Operatora.

### Zadanie 1 — zakres zmian
`git merge-base origin/main HEAD` = `2955fe32` = dokładnie `origin/main`. `git diff origin/main..HEAD --stat`: **1 plik, 70 insercji** — wyłącznie `dyspozycje/autobot/runs/R-HANDEL-SZLAKI-PRZEBUDOWA-Q1-T4/decision-abc.md`. Zero zmian w `trade-routes.ts`, `economy.ts`, `main.ts`, `cityPanel.ts`, `empireDetailPanel.ts`. Potwierdzone.

### Zadanie 2 — NAJWAŻNIEJSZE: własny scenariusz testowy na żywym silniku
Napisałem i uruchomiłem niezależny skrypt (esbuild + `refreshTradeRoutes`/`computeTradeRouteCountByCity`/`cityYieldPerTurn` z realnego kodu, zero mocków logiki): dwa miasta, dystans 2, ZERO budynków handlowych → trasa powstaje (`status='polaczony'`, `budynekOdblokowany=false`, zgodnie z T3), ale `computeTradeRouteCountByCity()` mimo to zwraca `1` dla obu miast, a `cityYieldPerTurn` z tym `ctx.liczbaAktywnychTrasHandlowych=1` daje `handelBrutto=42` zamiast bazowych `40` — **czyli miasto BEZ budynku dostaje stary bonus +5%, dokładnie ten bug, który T4 ma zamknąć**. Bug potwierdzony na żywym silniku, nie tylko w opisie. Ponieważ Operator nie zmienił ani linijki produkcyjnego kodu (BLOCK przed kodowaniem), bug pozostaje otwarty — zgodnie z raportem.

### Zadanie 3 — czy stary mechanizm zniknął / podwójne liczenie
Nie mógł zniknąć — zero zmian kodu. Grep repo-wide `liczbaAktywnychTrasHandlowych`/`computeTradeRouteCountByCity` potwierdza mechanizm w pełni nietknięty w `economy.ts:653/953-957`, `trade-routes.ts:963-972`, `turn-economy.ts:2036/2598`, `main.ts` (9 miejsc: 2581 deklaracja, 13051/31499 budowa, 19814/29972 zasilenie ctx, 25615 przekazanie, 30445/30772/31017/31243 `.clear()`), `cityPanel.ts:10360-10521` (zduplikowana kopia formuły, stała `TRADE_ROUTE_HANDEL_BONUS_PCT_PER_ROUTE=5`, komentarz „musi zgadzać się z hardcoded 0.05 w game/economy.ts"). Brak podwójnego liczenia — bo nic nowego nie istnieje.

### Zadanie 4 — matematyka nowej formuły
N/A — Operator STOP przed napisaniem nowego mechanizmu, kryteria 1–7 dispatchu pozostają otwarte (poprawnie zaraportowane jako takie).

### Zadanie 5 — miejsce wpięcia w kolejności kroków economy.ts
Zweryfikowałem bezpośrednio kod (linie 945–960): stary mnożnik +5% siedzi PO zastosowaniu `civHandelMult` i PRZED „Step 5 (renumbered from 6): Apply corruption/waste". Zgadza się dokładnie z opisem reconu w `decision-abc.md` („po Targowisku i civHandelMult, przed Step 5 korupcją"). Uzasadnienie „realny transfer budżetu Podatek→Handel" (D5/ECHO Q3) jest spójne z tym miejscem w łańcuchu (przed korupcją/Walutą+Mennicą, tak jak reszta Handlu) — nieproblematyczne, choć samego kodu jeszcze nie ma do ostatecznej weryfikacji.

### Zadanie 6 — tsc/build/testy/5 bramek (własne polecenie)
- `node ./node_modules/typescript/bin/tsc --noEmit` (z `gra/`) → **0 błędów**.
- 5 bramek referencyjnych: `logic-test.cjs` 213/213, `tech-tree-test.cjs` 19/19, `research-test.cjs` 33/33, `unit-replace-test.cjs` 13/13, `combat-test.cjs` 6/6 — **wszystkie zgodne z referencją R-PROC-AUTOBOT.md §6**.
- Testy tematu: `trade-routes-test.cjs` 65/0, `trade-routes-income-test.cjs` 91 passed/**1 failed (H2, pre-istniejący)**, `trade-ilosc-test.cjs` 35 passed/**5 failed (pre-istniejące)**, `mennica-uspienie-test.cjs` 49/0, `zloto-szlak-test.cjs` 54/0 — dokładnie zgodne z liczbami z raportu T3 i z opisem pre-istniejących, nie-związanych FAIL z kryterium 6 dispatchu T4. Zero regresji.

### Zadanie 7 — regresja T1/T2/T3
Zero zmian kodu → formuła dystansowa, bonus morski ×2, gating istnienia trasy z T3 nietknięte z definicji. Potwierdzone przez identyczne wyniki testów jak na `main`.

### Ocena samego konfliktu kontraktu
Treść `decision-abc.md` jest precyzyjnie zgodna z rzeczywistym kodem w każdym szczególe, który sprawdziłem niezależnie (numery linii, nazwy funkcji, treść komentarzy) — brak żadnej rozbieżności między twierdzeniem a stanem repo. Struktura pliku (sekcja „opis konfliktu bez rozwiązania" + osobna sekcja „Propozycja — lekka ścieżka") jest zgodna z regułą procesu dla konfliktu czysto inżynierskiego bez wpływu na balans/gameplay (jedna propozycja, nie turniej C-018). `RUNDY: 0/5` poprawne (STOP przy konflikcie kontraktu nie zużywa rundy). Propozycja rozszerzenia allowlisty (dokładnie 3 pliki: `turn-economy.ts`, 8 istniejących punktów wpięcia w `main.ts` bez `buildEmpireTradeSnap()`/T6, jedna linia w `cityPanel.ts`) jest minimalna i mechaniczna (1:1 podmiana kształtu mapy w już istniejących miejscach) — nie poszerza zakresu balansowego ani UX poza to, co T4 już miało zrobić.

ZMIANY/COMMIT: potwierdzone — branch `autobot/HANDEL-T4-Q1`, commit `127143bb`, wypchnięty do `origin/autobot/HANDEL-T4-Q1`, jedyny plik `decision-abc.md`.
TESTY: patrz Zadanie 6 wyżej — własnym poleceniem, wszystkie zgodne z baseline `main`.
BLOKADY: konflikt allowlisty potwierdzony jako realny i nierozwiązywalny w obecnym zakresie T4 bez wprowadzenia martwego kodu (jeśli nowy mechanizm nie zostanie podłączony) albo regresji „miasta bez żadnego bonusu za trasy" (jeśli stary mnożnik zostanie usunięty bez zastąpienia) — potwierdzone niezależną reprodukcją buga na żywym silniku.
NASTĘPNY KROK: zgadzam się z rekomendacją Operatora — decyzja orkiestratora/właściciela o rozszerzeniu allowlisty T4 o `gra/src/game/turn-economy.ts`, 8 wskazanych punktów wpięcia w `gra/src/main.ts` i jedną linię `gra/src/ui/cityPanel.ts`, następnie wznowienie Operatora na tym samym ID/branchu.
DEPLOY/PUSH: NIE WYKONANO.