STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-GATE-REMOVE-QUEUE-LEVER-Q1
GOAL: usunąć dźwignię „kolejka produkcji” z tekstu/logiki bramki „Zakończ turę” (gracz), zostawić podatek, racje i jednostki; test czerwony na bazie 1f728f160.
ZMIANY-COMMIT: 3cbc24b785fbc81ef40338a440a3e228ff44f947 (kod operatora, bez zmian w tej rundzie). Obrona nie zmieniła kodu ani testów; ta runda dodaje tylko ten raport. Startowy SHA obrony: 3cbc24b78.

## Odpowiedzi na zarzuty Evaluatora (af5e2adcf)

### Zarzut 1 — zmiana bez obserwowalnego skutku dla gracza: PRZYJMUJĘ (fakt), z korektą wniosku
Potwierdzone:
- `evaluateEndTurnStocks().komunikat` (gra/src/game/no-negative-stocks.ts:104 po zmianie) ma tylko wywołania w testach (`gra/tools/no-negative-stocks-*.cjs`) i w `decideEndTurnGate` (l.443), który NIE zwraca tego pola graczowi.
- Gracz dostaje `komunikatBramki(...)` (no-negative-stocks.ts ~l.471–475) przez `decideEndTurnGate` → `nnsGateForPlayer` → `nnsEndTurnTooltipText` (main.ts ~39544) i `hintEndTurnBlocked` (main.ts ~39640).
- Na bazie 1f728f160 `komunikatBramki` i `decideEndTurnGate` NIE zawierały słowa „kolejk” (`git show 1f728f160:gra/src/game/no-negative-stocks.ts | grep -n kolejk` daje tylko l.8, 15, 104, 198 — żadnej z ścieżki gracza). Wniosek dispatchu („komunikat blokady wskazuje kolejkę”) dotyczył martwego tekstu, nie tekstu widzianego przez gracza.
- Live (Chromium, patrz TESTY): title przycisku w blokadzie = „Nie można zakończyć tury: Skarbiec (złoto): po turze zabraknie 2. Pomogą: podatek złota: +5 złota/turę; rozwiązanie jednostek (złoto): +12 złota/turę; rozwiązanie jednostek (żywność): +12 żywności/turę.” — 0 wystąpień „kolejk” w `result-a1-gold-seed11.json`.
Decyzja: zmiana w `evaluateEndTurnStocks` ZOSTAJE (usuwa błędny opis z eksportowanej funkcji i jej komentarza nagłówkowego, zgodny z GOAL), ale NIE twierdzę, że zmienia cokolwiek dla gracza. Efekt dla gracza tego tematu: brak zmiany zachowania, tekst gracza był już poprawny na bazie.

### Zarzut 2 — nowe asercje (i) dla gracza i (j) nie są czerwone na bazie: PRZYJMUJĘ (korekta raportu operatora)
Dowód (ta sama wersja testu z 3cbc24b78, wykonana przy źródłach z bazy 1f728f160 podstawionych tymczasowo i przywróconych do 3cbc24b78):
- `node tools/no-negative-stocks-end-turn-gate-levers-test.cjs` na bazie → `32 passed, 2 failed`; FAIL tylko:
  - `FAIL: (i) komunikat evaluateEndTurnStocks NIE zawiera „kolejk” (czerwony na bazie)`
  - `FAIL: (i) komunikat wskazuje podatki, racje i jednostki`
- Pozostałe asercje (i) dla bramki gracza (`komunikat bramki gracza NIE zawiera kolejk`, `żadna dźwignia gracza nie jest kolejką`, dźwignie podatku/racji/jednostek) ORAZ (j) (wiring: brak `kolejk|cityProd|.kolejka` w `nnsGateForPlayer..canPlayerInitiateEndTurn`) są ZIELONE na bazie.
- Commit message 3cbc24b78 mówi „Test (i)/(j) czerwony na bazie 1f728f160” — to NIEPRAWDA dla (j) i dla części (i) dotyczącej gracza. Prawdziwie czerwone na bazie są 2 asercje dotyczące martwego komunikatu `evaluateEndTurnStocks`.
ODRZUCAM żądanie, by asercje gracza były czerwone na bazie: wymagałoby to zmiany zachowania gracza, której dispatch nie zamawia (baza gracza jest już wolna od kolejki). Warunek dispatchu „nowy test czerwony na bazie” jest spełniony (2 asercje), a dowód mutacyjny jest powtórzony powyżej.

### Zarzut 3 — c3-turn i live Chromium NIE_ZMIERZONO: PRZYJMUJĘ (wykonane w tej rundzie)
- Build tylko do katalogu roboczego poza repo: `npx vite build --outDir <scratchpad>/dist-q1 --emptyOutDir` (bez `npm run build`, bez `gra/dist`). Wynik: „✓ built in 25.27s”.
- c3-turn z `--dist` na tym buildzie: `no-negative-stocks-c3-turn-test: 16 passed, 0 failed` (ON: skarb 16,2 po turze, pokryte=true; OFF: skarb −163 — kontrola negatywna działa).
- Live Chromium: `live-verify-wave-689-697-a1-title-tax.cjs --dist <scratchpad>/dist-q1 --out <scratchpad>/live-q1 --seed 11` → exit 0, `errors []`, `fatal -`. Title w blokadzie bez „kolejk”; suwak podatku zmienia canEnd false→true; klik „Zakończ turę” przesuwa turę 11→12. Zrzuty: `a1-seed11-g1-goldblock-tooltip.png`, `a1-seed11-g2-lever.png`. Uwaga: ten skrypt sprawdza dźwignię podatku, NIE dźwignię racji; racje nie były w tym scenariuszu aktywne.

### Zarzut 4 — pole wstrzymania w NnsAiLeverInput (ścieżka AI): ODRZUCAM jako zarzut do zmiany
Informacja Evaluatora przyjęta: `gra/src/game/no-negative-stocks.ts` (pole wstrzymania ~l.199–234) pozostaje, bo należy do ścieżki AI (`no-negative-stocks-ai.*`), która ma być nietknięta. Testy AI: ai-test 8/0, c2 43/0.

## TESTY (surowe wyniki, ten sam kod 3cbc24b78)
- `npx tsc --noEmit` (gra/): brak wyjścia błędów. Uwaga: pierwsze wywołanie przeszło przez `tail`, więc kod wyjścia tego wywołania nie został zarejestrowany osobno; wynik końcowy patrz sekcja „Końcowe sprawdzenie”.
- `node tools/no-negative-stocks-end-turn-gate-levers-test.cjs`: `34 passed, 0 failed` (exit 0).
- `node tools/no-negative-stocks-test.cjs`: `25 passed, 0 failed`.
- `node tools/no-negative-stocks-projection-test.cjs`: `49 passed, 0 failed`.
- `node tools/no-negative-stocks-c3-turn-test.cjs --dist <dist-q1>`: `16 passed, 0 failed` (exit 0).
- Live: patrz zarzut 3.
- Mutacja (baza 1f728f160 w źródłach gry, test z 3cbc24b78): `32 passed, 2 failed` (opis w zarzucie 2).
- Nie uruchomiono ponownie 5 bramek referencyjnych (logic, tech-tree, research, unit-replace, combat): Evaluator podał zielone; NIE_ZMIERZONO w tej rundzie. Zmiana dotyczy tylko no-negative-stocks.ts i main.ts (tekst/wiring NNS), a testy NNS wyżej przechodzą.
- `git diff --check 3cbc24b78 -- gra`: czysto (brak wyjścia).

## BLOKADY
- Brak. Live verify: wykonany dla dźwigni podatku, nie racji.

## RUNDY
1/5 (obrona). Poprzednia runda: Evaluator af5e2adcf.

## UWAGI-DLA-ORKIESTRATORA
1. Premisa dispatchu była częściowo błędna: komunikat gracza nigdy nie zawierał kolejki produkcji na bazie 1f728f160. Wpis w rejestrze (#368/#375) powinien to odnotować: „usunięcie kolejki = usunięcie martwego tekstu, brak zmiany dla gracza”.
2. Commit 3cbc24b78 ma w treści błędne zdanie „(i)/(j) czerwony na bazie”. Nie poprawiam historii; prawdę zawiera ten raport.
3. Do rozważenia: test `gra/tools/no-negative-stocks-end-turn-gate-levers-test.cjs` (j) jest przydatny jako strażnik regresji, ale nie jest czerwony na bazie.
4. Build testowy zostawiony w katalogu scratchpad sesji (dist-q1, live-q1); nie jest w repo.

## NASTĘPNY KROK
Orkiestrator: Final Control (Sonnet) na 3cbc24b78 + ta runda obrony. Integracja i deploy wyłącznie po FC PASS, osobną decyzją orkiestratora.

DEPLOY/PUSH: NIE WYKONANO
