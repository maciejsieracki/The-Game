STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4B-SPLIT-Q1
GOAL: Drugi i ostatni pod-etap rozcięcia `triggerPlayerEndTurn()` (recon
`R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1` §6.1, Krok 2-4): wydzielić `endActiveHumanTurn
(humanOwnerId)` jako nazwę dla faz 0-6 gracza, orkiestrator `advanceSeat()`, przepiąć
WSZYSTKIE TRZY zewnętrzne call-site'y `triggerPlayerEndTurn()` na `advanceSeat()`, zachować
identyczne rozłożenie try/catch/finally (cztery flushe fazy 15) — no-op behawioralny przy
jednym fotelu, dowiedziony bramką hash-per-tura porównaną z baseline main po Etapie 4a.
Krok 5 (bitwy/zwycięstwo) jawnie poza zakresem, nietknięty.

## Weryfikacja linii przed edycją (fresh grep — main.ts zmienił się od dispatchu)

Dispatch orientacyjnie: `triggerPlayerEndTurn` @ 28643, 3 call-site'y @ 20910/21498/33092.
Świeży grep (ta runda): `runWorldEndTurn` (Etap 4a) @ **28643** jako sibling PRZED
`triggerPlayerEndTurn`, która zaczyna się dziś @ **32991** (guard sync) → async IIFE
@ 33013 → `await runWorldEndTurn();` @ **33122** → `catch`/`finally` 33123-33156 → koniec
@ 33157. Call-site'y zweryfikowane grepem `grep -n "triggerPlayerEndTurn"`: dokładnie
TRZY wywołania poza definicją/komentarzami — **21042** (HUD `onEndTurn`), **21630**
(`__eraTestDebug.endTurn`), **33283** (keydown „N”) — zgodne z receptą recon sekcja 4.

## Wybór architektury (Krok 3) — wybrałem (a), NIE rekomendowane (b)

Dyspozycja rekomendowała (b) (`advanceSeat()` przejmuje wywołanie `runWorldEndTurn()`).
Wybrałem **(a)** (`runWorldEndTurn()` zostaje wywoływana Z WEWNĄTRZ `endActiveHumanTurn`,
`advanceSeat()` jest dziś cienkim punktem wejścia) — jawne uzasadnienie, nie ciche
odłożenie:

Architektura (b) wymaga rozłożenia DZISIEJSZEGO jednego `try/catch/finally` (który
dziś otacza RAZEM fazy gracza i `runWorldEndTurn()`) na dwie funkcje. Żeby zachować
identyczny skutek błędu — (1) błąd w fazie gracza dziś NIGDY nie uruchamia
`runWorldEndTurn()` (rzucony wyjątek przerywa `try` przed dotarciem do jej wywołania),
(2) dokładnie JEDNO wywołanie `console.error` i JEDNO wykonanie czterech flushy,
niezależnie od tego, w której fazie błąd powstał — próbowałem rozłożyć try/catch/finally
między funkcje i za KAŻDYM razem trafiałem na skrót: albo `endActiveHumanTurn` musi
zwracać sygnał „czy faktycznie wystartowała" (guard `canPlayerInitiateEndTurn` odrzuca
PRZED ustawieniem `endTurnInProgress`, więc `advanceSeat` musi to rozróżnić od błędu),
albo błąd fazy gracza byłby połykany przez wewnętrzny catch i `advanceSeat` i tak
uruchomiłby `runWorldEndTurn()` — **realna zmiana zachowania na ścieżce błędu**, której
30-turowa bramka no-op (happy path, zero wstrzykniętych błędów) NIE jest w stanie
wykryć. To DOKŁADNIE ten rodzaj przeoczenia, przed którym ostrzega REGUŁA PRZECIW
SAMOOSZUKIWANIU tej dyspozycji i Zarzut 4 rundy 2 recon. Wybrałem (a): rename +
ekstrakcja BEZ przesuwania granic try/catch/finally — zero ryzyka na ścieżce błędu,
bo struktura jest bajt-w-bajt tą samą logiką, tylko pod nazwaną funkcją. To NIE jest
odłożenie Kroku 3 „na później" bez treści: Krok 3 wymagał (i dostał) nazwane
`endActiveHumanTurn`/`advanceSeat` z jasnymi odpowiedzialnościami ORAZ wszystkie trzy
call-site'y przepięte na `advanceSeat()` — jedyne co odłożone to WEWNĘTRZNE miejsce
wywołania `runWorldEndTurn()`, co i tak będzie wymagało przeprojektowania w Etapie 8
(gdy `advanceSeat()` dostanie warunek „czy to ostatni fotel" — dopiero wtedy naturalnie
powstanie potrzeba nowego, przemyślanego rozkładu try/catch dla wielu foteli, z własną
bramką błędów, zamiast robić to teraz bez testu, który by to zweryfikował).

## Zmiany (allowlista: `gra/src/main.ts` wyłącznie)

1. `function triggerPlayerEndTurn(): void {` (32991, teraz 32999 po wstawce komentarza)
   → `function endActiveHumanTurn(humanOwnerId: number): void {` — ciało w 100%
   niezmienione (guard, logging, `endTurnInProgress`, `try/catch/finally`, cztery
   flushe fazy 15 — wszystko na dokładnie tych samych liniach względem siebie).
   `humanOwnerId` dziś nieużywany (`void humanOwnerId;`) — literał `0` w
   `runScoutsAutoExplore` (main.ts:33085) i pozostałe `u.ownerId===0` w bloku
   anim/scout (33055,33068,33103,33111 — wszystkie zgodne z klasyfikacją recon
   „anim zawsze gracza"/scout filtrowany do playerOwnerId) **celowo nietknięte**,
   zgodnie z dyspozycją (odłożone do Etapu 6).
2. Nowa `function advanceSeat(): void { endActiveHumanTurn(HUMAN_OWNER_PRIMARY); }` —
   jeden fotel dziś, bezwarunkowo ostatni.
3. `triggerPlayerEndTurn` zachowana jako cienki alias (`= advanceSeat()`), zgodnie z
   opcją stylu z recon §6.1 Krok 3 — dziś bez wywołań z main.ts, spójna z komentarzami
   opisowymi gdzie indziej w pliku.
4. WSZYSTKIE TRZY call-site'y przepięte na `advanceSeat()`: main.ts:21042 (HUD
   `onEndTurn`), main.ts:21630 (`__eraTestDebug.endTurn`), main.ts:33309 (keydown „N”).

Krok 5 (bitwy/zwycięstwo, `ownerId===0`/`VictoryInput.gracz:0`) — zero zmian, potwierdzone
`git diff` (diff nie dotyka main.ts poza liniami wypisanymi wyżej).

BLOKADY: brak.

ZMIANY/COMMIT: `gra/src/main.ts` (34 linie +/-, patrz wyżej) + ten raport. Commit SHA —
patrz `git log -1` po zapisaniu.

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` (5.9.3, `node_modules` skopiowane
  z `/home/user/The-Game/gra`, `package-lock.json` identyczny): **0 błędów** przed i po.
- `xvfb-run -a node tools/hotseat-etap4-noop-test.cjs` (baseline PRZED zmianą, na
  dzisiejszym `main` po Etapie 4a, commit `5e0d9b67`): **PASS 30/30** A vs B.
  PO zmianie: **PASS 30/30** A vs B. **Porównanie WSZYSTKICH 30 hashy z baseline**
  (nie tylko A==B): zbiory `{tura→hash}` baseline (A∪B, zdeduplikowane) i po-zmianie
  (A∪B, zdeduplikowane) — `diff` **pusty, identyczne**. jsExceptions 0/0 w obu
  przebiegach obu uruchomień; console.error() gry 7/7, identyczne.
- `node tools/end-turn-modal-sequencing-test.cjs` (bramka sąsiednia, uruchomiona
  defensywnie — dotyczy dokładnie tego try/catch/finally, który przenosiłem):
  39 pass / 1 fail PRZED i PO zmianie identycznie — `[A6]` czerwony
  pre-istniejąco (zweryfikowane `git stash` na czystym `main`, ten sam wynik),
  **nie regresja tego tematu**. `[A7]` (pin na `} finally {\n          endTurnTransition();`)
  **PASS** w obu — potwierdza, że architektura (a) zachowała bajt-w-bajt tę samą
  strukturę tekstową finally.
- Pięć bramek referencyjnych §6: `logic-test` 213/213, `tech-tree-test` 19/19,
  `research-test` 33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie
  zgodne z wynikiem referencyjnym.
- `git diff --check -- gra/src/main.ts`: czyste.

RUNDY: 1/5

NASTĘPNY KROK: Operator → Evaluator (Ścieżka A, Workflow) → orkiestrator dispatchuje
Final Control osobno → integracja allowlist-only. Po zielonym Etapie 4b: Etap 4 planu
hot-seat KOMPLETNY (Krok 0-4). Ewaluator: proszę zwrócić szczególną uwagę na wybór
architektury (a) zamiast rekomendowanej (b) — uzasadnienie wyżej, gotów do obrony.

DEPLOY/PUSH: NIE WYKONANO
