STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1
GOAL: tekst blokady i tooltipu „Zakończ turę” oraz logika bramki gracza nie wskazują dźwigni „kolejka produkcji”; zostają podatek, racje i jednostki. Zachowanie bramki (blokada, wyjątek tur 1–10) bez zmian.
ZMIANY/COMMIT: baza 1f728f160 (origin/main). Allowlista: gra/src/game/no-negative-stocks.ts, gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs, runs/R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1/. Commit: patrz pole sha w wyniku.

## Przegląd odniesień (plik:linia)

Gracz (użyte w bramce i tooltipie):
- gra/src/game/no-negative-stocks.ts:104 — komunikat statyczny `evaluateEndTurnStocks` zawierał „usuń pozycję z kolejki produkcji”. Zmienione na „Zwiększ podatki, zmniejsz racje albo rozwiąż jednostkę.” (jedyne odniesienie do kolejki jako dźwigni w pliku).
- gra/src/game/no-negative-stocks.ts:8–16 — nagłówek pliku: opis dźwigni gracza uzupełniony o informację, że kolejka nie jest dźwignią gracza.
- gra/src/game/no-negative-stocks.ts:436–460 — `decideEndTurnGate`: lista dźwigni gracza to WYŁĄCZNIE podatek skarbca, racje (suwak żywności), rozwiązanie jednostek (skarbiec/spichlerz). Kolejki nie ma w liście; `czyRuchNaprawczy` (l.135) nie liczy kolejki, więc NIE było tu zmiany zachowania.
- gra/src/game/no-negative-stocks.ts:487+ — `komunikatBramki` (bez zmian; generuje „Pomogą: …” z dźwigni przekazanych przez wołającego).
- gra/src/main.ts:39523 `nnsGateForPlayer` i :39544 `nnsEndTurnTooltipText` — nie czytają kolejki produkcji (test (j) to pilnuje). Bez zmian w main.ts.
- Prognoza gracza (refreshLiveEmpireRates) nie zawiera kolejki produkcji — to powód braku modelu dźwigni (zgodnie z dispatchem).

AI (NIE zmieniane):
- gra/src/game/no-negative-stocks.ts `buildAiLevers` / `NnsAiLeverInput.wstrzymania` (l.~198–235) — „Pozycje kolejki/budowy do wstrzymania” to dźwignia planera AI (`planAiBalance`), współdzielona typem `NnsLever`. Zachowanie AI bez zmian (kod nietknięty).
- gra/src/game/no-negative-stocks-ai.* — nie istnieje w tym commicie jako osobny plik o takiej nazwie; planer AI jest w no-negative-stocks.ts. Nie modyfikowano.
- Nie zmieniano ai.ts ani typów współdzielonych.

Inne trafienia grep „kolejk” w gra/src (fortyfikacje, rekrutacja, produkcja miast, dyplomacja, wiki) — niezwiązane z bramką końca tury; nie dotykane.

## Testy

Przed zmianą (baza 1f728f160), wynik referencyjny:
- `npx tsc --noEmit` (node ./node_modules/typescript/bin/tsc --noEmit): exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: ALL GREEN
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: All sanity checks passed.
- no-negative-stocks-test: 25 passed, 0 failed
- no-negative-stocks-end-turn-gate-levers-test: 25 passed, 0 failed

Nowe asercje (i)/(j) w no-negative-stocks-end-turn-gate-levers-test.cjs — CZERWONY NA BAZIE (dowód mutacyjny, bez zmiany kodu gry):
- `FAIL: (i) komunikat evaluateEndTurnStocks NIE zawiera „kolejk” (czerwony na bazie)`
- `FAIL: (i) komunikat wskazuje podatki, racje i jednostki`
- wynik: `32 passed, 2 failed`, exit 1

Po zmianie:
- tsc --noEmit: exit 0 (TSC_EXIT=0)
- logic-test 213/213; tech-tree-test 20/0; research-test ALL GREEN; unit-replace-test 21/21; combat-test passed
- no-negative-stocks-test: 25 passed, 0 failed
- no-negative-stocks-end-turn-gate-levers-test: 34 passed, 0 failed (exit 0)
- no-negative-stocks-ai-test: 8 passed, 0 failed
- no-negative-stocks-c2-test: 43 passed, 0 failed
- no-negative-stocks-c3-turn-test (--dist /tmp/wf-q1-dist, build vite do /tmp poza repo): 16 passed, 0 failed
- no-negative-stocks-endturn-test: 19 passed, 0 failed
- no-negative-stocks-projection-test: 49 passed, 0 failed
- git diff --check: czysty

Asercje dodane w teście:
- (i) komunikat evaluateEndTurnStocks i decideEndTurnGate nie zawiera „kolejk”; komunikat wymienia podatki, racje, jednostki; żadna dźwignia gracza nie jest kolejką; podatek, racje i jednostki nadal są dźwigniami; racje nie pokrywają skarbca (brak blokady).
- (j) wiring: nnsGateForPlayer / nnsEndTurnTooltipText w main.ts nie czytają kolejki produkcji.
- Test eksportuje teraz także evaluateEndTurnStocks (wpis ENTRY w tym samym pliku testu).

## Przypadek brzegowy (dispatch: blokada nie może znikać)
Gdy jedyną teoretyczną dźwignią byłaby kolejka: kolejki nie ma w `levers` ani w `NnsEndTurnLevers`, więc `czyRuchNaprawczy` jej nie liczy. Nie ma ścieżki, w której blokada znika z powodu kolejki — blokada znika wyłącznie wtedy, gdy podatek+racje+jednostki razem nie pokrywają braku (istniejące zachowanie, test (b)/(g)/(h)). Jeśli kolejka nie pokrywa braku, gracz nie dostaje dźwigni kolejki — zgodnie z decyzją ABC nr 4.

## Weryfikacja live (Chromium)
NIE_ZMIERZONO: nie uruchomiono przeglądarki (wzór live-verify-wave-689-697-a1-gate-title-tax-lever*.cjs). Powód: zmiana to treść statycznego tekstu i brak dźwigni w logice, pokryta testami czystej logiki i wiringiem (f)/(j). Do żywej weryfikacji tooltipu w blokadzie potrzebny jest osobny przebieg Chromium.

## BLOKADY
Brak. Nie zmieniano gra/data, WERSJE.md, gra-robocza/, rust-port/. Nie uruchamiano npm run build/dev; build tylko przez `node ./node_modules/vite/bin/vite.js build --outDir /tmp/wf-q1-dist --emptyOutDir`. `npm ci` w gra/ wykonane w worktree (brak node_modules w izolowanym worktree).

## RUNDY
1/5 (ostatni werdykt: brak — runda Operatora).

## UWAGI-DLA-ORKIESTRATORA
- Original dispatch `runs/R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1/00-dispatch.md` NIE istnieje w origin/main (git show zwrócił błąd); użyto DODATKU z gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0, który zawiera pełny zakres.
- Dispatch nie wymaga dodatkowej pracy poza tym tematem.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja zmian w gra/src/game/no-negative-stocks.ts i testach; FC po Evaluatorze.
DEPLOY/PUSH: NIE WYKONANO
