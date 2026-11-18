STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dyplomacja/UI)
TEMAT: R-WEB-UI-DIPLO-WEARINESS-PEACE-EXPLAIN-Q1
GOAL: w podpowiedziach panelu dyplomacji wyjaśnić skalę zmęczenia wojną (0% start wojny, 100% pokój wymuszony), narastanie (2,5% na turę + 10% za miasto), progi 50/80/100%, rolę desperacji (tylko przegrywający, decyduje o ofercie miast, nie wymusza pokoju) oraz wiersz „Pokój wymuszony za N tur” (tylko przy stałym tempie); aktualizacja Civpedii (zmeczenie-wojna.md) i regeneracja wikiBundle. Bez zmiany reguł i progów.
ZMIANY/COMMIT: baza 99724ec705d636fd21d71f905b671df878859f77 (origin/main). Zmienione pliki:
- gra/src/game/diplomacy-display.ts: warDespairTooltipPl (skala, rola, próg oferty z parametrów); nowa warWearinessScaleTooltipPl (skala, wzór, progi, „Pokój wymuszony za N tur” z warWearinessTurnsToLevel). Istniejące podciągi (Za N tur, Etapy:, Pokój wymuszony (100%).) zachowane.
- docs/encyklopedia/pojecia/zmeczenie-wojna.md: akapity „Jak czytać skalę” i „Desperacja” w sekcji Panel dyplomacji.
- gra/src/data/wikiBundle.json: regeneracja narzędziem gra/tools/bundle-wiki-for-game.cjs (zmiana jednej linii JSON).
- gra/tools/diplo-weariness-explain-test.cjs: NOWY test (11 asercji).
- dyspozycje/autobot/runs/R-WEB-UI-DIPLO-WEARINESS-PEACE-EXPLAIN-Q1/10-operator-claude.md: ten raport.
TESTY:
- tsc --noEmit (node_modules/typescript 5.9.3, tsconfig gra/): exit 0 po poprawce. Pierwszy przebieg: 1 błąd TS2345 w linii progiStopni[0], naprawiony przez `?? 0`. Uwaga: `npx tsc` bez zainstalowanych zależności kończy się błędem TS5101 (baseUrl, deprecated), niezwiązanym z tematem.
- diplo-weariness-display-test: PASSED 54 / FAILED 0.
- diplo-weariness-stages-view-test: 22 pass / 0 fail.
- diplo-weariness-explain-test (nowy): 11 pass / 0 fail.
- diplo-trust-war-n6-cleanup-test: 17 pass / 0 fail.
- polish-language-audit-q1-guard-test: 7497 ok / 0 fail.
- civpedia-oslabienie-docs-guard-test: 7 PASS / 0 FAIL.
- diplo-civpedia-values-test: exit 0.
- Pełnej listy testów dyplomacji (logic, tech-tree, research, unit-replace, combat) nie uruchomiono: zmiany są tekstowe i nie dotykają tych modułów. NIE ZMIERZONO.
- Dowód live (Chromium + xvfb, zrzut panelu): NIE ZMIERZONO. Chromium jest dostępny (/usr/bin/chromium), ale nie wykonano buildu poza repo ani nie doprowadzono gry do wojny z przegrywającym w panelu audiencji. Teksty potwierdzone testami jednostkowymi.
BLOKADY: brak (dowód live jak wyżej).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator: przegląd tekstów PL i zgodności z parametrami; zrzut live w Chromium przed Final Control.
UWAGI-DLA-ORKIESTRATORA: wikiBundle regenerowany. Dispatch zakazuje równoległego tematu dotykającego wikiBundle, więc sprawdzić przy integracji (DIPLO-4/DIPLO-5). Nie zmieniano diplomacy-locks.ts, diplomacy-proposals.ts, diplomacyAcceptanceBalance.ts ani main.ts.
DEPLOY/PUSH: NIE WYKONANO
