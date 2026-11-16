# R-WEB-AI-UPKEEP-RUNWAY-GATE-ENABLE-Q1 — obrona Operatora (runda 1/5, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (AI: rekrutacja a zapas złota/żywności)
TEMAT: R-WEB-AI-UPKEEP-RUNWAY-GATE-ENABLE-Q1
GOAL: po zarzutach Evaluatora (`20-evaluator-claude.md`, SHA 32125a4e3) domknąć allowlistę i uczciwie oznaczyć dowody, których nie da się odtworzyć w tej rundzie. Kod bramki bez zmian względem kandydata f294a4122, poza usunięciem liczników pomiarowych spoza allowlisty.
BAZA: `origin/main` = `8265bbec0e8d040562fc73bbafaf57ae3aef50ed` (`git merge-base --is-ancestor` = OK). Kod operatora: `f294a41223901ac0785622ac0eb46298007c1171`.

## ZMIANY-COMMIT

- `2a4a33c6367e58683cb6f52d862d48f523983c01` — `gra/src/main.ts` (12 linii, 2 wstawione / 10 usunięte względem f294a41). Usunięto `aiUpkeepGateStats`, eksport `window.__aiUpkeepGateStats` (tylko z `?civTest=1`) i trzy inkrementacje liczników w `aiUpkeepRunwayAllows`. Logika bramki nie zmieniona (`if (!cfg.wlaczone) return true;` i `if (income === undefined || foodTick === undefined) return true;` zachowują dawne zwroty).
- Ten raport (`30-obrona-claude.md`) — osobny commit po fixie (SHA podany w polu „sha” odpowiedzi orkiestratora).
- Stan `main.ts` względem bazy `8265bbec0`: 56 wstawień, 1 usunięcie. Brak liczników, brak `window.*`. Sprawdzone: `git diff 8265bbec0 2a4a33c63 -- gra/src/main.ts` zawiera tylko wpięcie bramki (`aiUpkeepRunwayAllows`, mapa `aiFoodTickNetByOwner` z zapisem w ticku i czyszczeniem w 3 miejscach, import konfiguracji i modułu, wywołanie w `wantsPurchase`).
- Pozostałe pliki bez zmian względem f294a41: `gra/data/ai-upkeep-params.json` (`wlaczone: true`), `gra/src/game/ai-upkeep-runway.ts`, `gra/tools/ai-upkeep-runway-test.cjs`, `gra/tools/ai-upkeep-wiring-test.cjs`, `10-operator-claude.md`.

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — odstępstwo od allowlisty (liczniki w main.ts): PRZYJMUJĘ

Zarzut jest zasadny. Dispatch (`ALLOWLISTA`) dopuszcza w `main.ts` tylko wpięcie bramki. Liczniki i eksport `window.__aiUpkeepGateStats` były poza tym zakresem. Operator zgłosił odstępstwo w 10-operator, ale nie usunął go; decyzja o akceptacji nie należała do Operatora.

Poprawka: commit `2a4a33c63` (usunięcie, patrz ZMIANY-COMMIT).

Dowód:
- `git grep -n aiUpkeepGateStats 2a4a33c63 -- gra/` → brak trafień w kodzie (poza tekstem raportu 10-operator, który jest historyczny).
- `git diff --stat f294a41 2a4a33c63` → `gra/src/main.ts | 12 ++----------` (tylko usunięcia liczników i dwóch linii zwrotu).
- Liczniki nie wpływały na logikę: były wyłącznie inkrementowane i eksportowane do `window`, nie czytane przez żadną ścieżkę gry.

Konsekwencja dla dowodu smoke: runner `ai-economy-measure-run.cjs` z `refs/keep/UPKEEP-ONOFF-r3-fc` czyta `window.__aiUpkeepGateStats`. Bez licznika metryka `upkeepGate` w przebiegu na `2a4a33c63` będzie pusta (jak w pierwszym przebiegu Operatora). Blokady zmierzone w 10-operator (821/1072 do tury 45) dotyczą bundla f294a41 z licznikiem, nie końcowego commita. Patrz zarzut 2.

### Zarzut 2 — kryteria (c) i (d) bez niezależnego dowodu: PRZYJMUJĘ jako NIE ZMIERZONO na końcowym SHA; (d) uzupełniam dowodem z kodu

- (c) smoke w żywej grze: NIE ZMIERZONO przeze mnie na `2a4a33c63`. Nie uruchomiłem Chromium ani buildu vite w tej rundzie. Wynik z 10-operator (ziarno 4242, tury 1–45, 0 `cannot-end`, 0 `endturn-timeout`, deficyt złota AI 0, blokady 821/1072) dotyczy bundla f294a41 z licznikiem i nie został powtórzony. Różnica między f294a41 a 2a4a33c63 to wyłącznie usunięte liczniki (patrz zarzut 1). Ich brak nie zmienia logiki, ale to jest wnioskowanie z diffu, nie pomiar. Ponowny smoke na 2a4a33c63 wymaga wyniku bez licznika do oceny `upkeepGate` — do decyzji orkiestratora, czy FC ma wymagać go osobno.
- Runner: 10-operator używał `refs/keep/UPKEEP-ONOFF-r3-fc` (zgodnie z dispatchem), różniącego się od wersji w `main` (uwaga 3 w 10-operator). Nie rozstrzygam tego tutaj.
- (d) `wlaczone=false` daje stan jak baza: NIE ZMIERZONO hashem w przeglądarce. Dowód z kodu (bez uruchamiania gry):
  1. `aiUpkeepRunwayAllows` przy `wlaczone=false` zwraca `true` w pierwszej linii, zanim odczyta jakikolwiek stan (`gra/src/main.ts`, funkcja `aiUpkeepRunwayAllows`, ~l. 37374–37376).
  2. Wyrażenie `wantsPurchase` przy `false` = `!aiNnsHoldOwners.has(ownerId) && true && shouldAIPurchaseUnit({...})`. Dawne wyrażenie = `!aiNnsHoldOwners.has(ownerId) && shouldAIPurchaseUnit({...})`. Różnica to dodatkowe `&& true`, bez efektu ubocznego.
  3. Mapa `aiFoodTickNetByOwner` jest tylko zapisywana w ticku (`main.ts` ~l. 41756) i czyszczona w 3 miejscach (~l. 11533, 47955, 50124). Nie jest czytana przez save — `git grep aiFoodTickNet` poza `main.ts` nie zwraca trafień, więc format zapisu i deserializacja są bez zmian.
  4. Mapa nie konsumuje RNG i nie zmienia kolejności wywołań `shouldAIPurchaseUnit`.
  Wniosek: przy `false` stan gry jest identyczny z bazą z konstrukcji. Dowód pomiarowy (hash) pozostaje NIE ZMIERZONO.

### Zarzut 3 — test wiring jest tekstowy, logika sklejenia nie ma testu jednostkowego: ODRZUCAM jako blokujący, zostawiam jako notatkę

- `gra/tools/ai-upkeep-wiring-test.cjs` z założenia sprawdza źródło (nagłówek: „test okablowania bramki zapasu w src/main.ts (źródłowy, bez uruchamiania silnika gry)”). Tak zaprojektowano w dispatchu (kryterium a: „testy gate i wiring zielone”). Test behawioralny silnika `main.ts` nie jest możliwy bez uruchamiania bootu gry, a ta rundza tego nie wymaga.
- Logika bramki (`aiUpkeepRunwayAllowsRecruit`) ma test behawioralny: `ai-upkeep-runway-test.cjs` 17/0.
- Glue w `main.ts` (preview utrzymania, `foodTick - milBefore`) nie ma testu jednostkowego. To realna luka. Zostaje jako notatka dla FC (UWAGI-DLA-ORKIESTRATORA, pkt 3), nie jest to zmiana w tym temacie.
- Mutacja M2 (`wlaczone=false`) jest wykrywana przez W1 (wartość JSON), nie przez runway-test. To zgodne z opisem w 10-operator.

### Zarzut 4 — informacja o blokadach 77% vs 35%: PRZYJMUJĘ jako notatkę

Zgadzam się, że to nieporównywalne (inny horyzont: 45 tur vs 100; inny bundle). 10-operator to wprost pisze („NIE ZROBIONE: porównanie”). Nie porównuję i nie stroję parametrów. Wpływ na tempo rekrutacji AI i balans: NIE ZMIERZONO. Decyzja o balansie należy do właściciela.

### Zarzut 5 — zakres bramki (tylko `wantsPurchase`, bez „Zastąp”): PRZYJMUJĘ jako informację

Zgodne z dispatchem i z kodem: jedyne wywołanie `aiUpkeepRunwayAllows` to `main.ts` ~l. 45765 (`wantsPurchase`). Grep: definicja ~37374, wywołanie ~45765. Ścieżka „Zastąp” AI nie przechodzi przez bramkę. To świadoma decyzja zakresu, nie błąd. Wiki i Civpedia nie były sprawdzane (generator nie był uruchamiany; allowlista wiki tylko przy rozbieżności). NIE ZMIERZONO.

## TESTY (na commicie 2a4a33c63, uruchomione w tej rundzie w `gra/`)

Środowisko: `npm ci` w `gra/` (71 pakietów, OK). Bez `npm run build/dev`. Wyniki z surowego wyjścia:

- `npx tsc --noEmit` → exit 0, brak błędów (TSC_EXIT=0)
- `node tools/ai-upkeep-runway-test.cjs` → `RESULT ai-upkeep-runway-test: 17 passed, 0 failed`
- `node tools/ai-upkeep-wiring-test.cjs` → `RESULT ai-upkeep-wiring-test: 4 passed, 0 failed` (W1–W4 PASS)
- `node tools/logic-test.cjs` → `LOGIC OK (213/213)`
- `node tools/tech-tree-test.cjs` → `tech-tree-test: 20 pass, 0 fail`
- `node tools/research-test.cjs` → `PASSED: 33 / FAILED: 0 / TOTAL: 33`
- `node tools/unit-replace-test.cjs` → `WSZYSTKIE TESTY ZIELONE (21/21)`
- `node tools/combat-test.cjs` → `COMBAT TEST: 6/6 pass`
- `node tools/load-game-regression-test.cjs` → `load-game-regression: 34 PASS / 0 FAIL`

Uwaga o kodach wyjścia: przy pętlach z `| tail` kod wyjścia to kod `tail`; wynik zaliczenia oparłem na linii wyniku, nie na exit code.

Nie wykonano w tej rundzie: mutacji na kopii (zrobione przez Operatora na f294a41, nie powtarzane), smoke w grze (NIE ZMIERZONO), hasha dla `wlaczone=false` (NIE ZMIERZONO).

## BLOKADY

- Brak blokad technicznych.
- NIE ZMIERZONO: smoke w żywej grze na `2a4a33c63` (kryterium c) — patrz zarzut 2.
- NIE ZMIERZONO: hash stanu przy `wlaczone=false` (kryterium d) — dowód z kodu w zarzucie 2.
- NIE ZMIERZONO: wpływ na tempo rekrutacji AI i balans.

## RUNDY

2/5 (runda 1 Operatora, obrona tej rundy). Ostatni werdykt Evaluatora: PASS-WITH-NOTES. Nie ma FAIL ani BLOCK do obsługi. Zarzut 1 wymagał zmiany kodu (zrobiona). Zarzuty 2–5 wymagały odpowiedzi lub notatki.

## UWAGI-DLA-ORKIESTRATORA

1. Allowlista zachowana po poprawce: `main.ts` zawiera wyłącznie wpięcie bramki. Liczniki z f294a41 zostały usunięte w `2a4a33c63`. Nie trzeba akceptować odstępstwa.
2. Smoke na `2a4a33c63` nie był powtórzony. Jeśli FC ma wymagać dowodu kryterium (c) na końcowym SHA, potrzebny będzie nowy przebieg runnera. Runner w `main` różni się od `refs/keep/UPKEEP-ONOFF-r3-fc` (uwaga 3 w 10-operator). Decyzja, którą wersję runnera użyć, należy do orkiestratora.
3. Luka testowa: glue w `main.ts` (preview utrzymania, `foodTick - milBefore`) nie ma testu behawioralnego. Kandydat na osobny temat testowy, jeśli właściciel tego zechce.
4. Dług Rust (z dispatchu): REPIN bramki rekrutacji AI (nowy plik `ai-upkeep-runway` i dane `ai-upkeep-params.json`) — nie wykonany, zgodnie z dispatchem.
5. Sprzątanie poza repo: `/tmp/upk-dist2`, `/tmp/upk-prof2`, `/tmp/upk-out2` (z 10-operator) nie zostały usunięte przez tę rundę, bo nie dotyczą tego worktree. `gra/node_modules` w worktree obrony zostaje do sprzątnięcia po FC.

## NASTĘPNY KROK

Evaluator (SONNET) na `2a4a33c63` + ten raport. Potem Final Control (SONNET). Ewentualny ponowny smoke na `2a4a33c63` — decyzja orkiestratora (uwaga 2).

## DEPLOY/PUSH

DEPLOY/PUSH: NIE WYKONANO
