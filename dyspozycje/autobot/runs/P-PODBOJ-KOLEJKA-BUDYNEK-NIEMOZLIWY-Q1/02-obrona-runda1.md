STATUS: PASS
DOMAIN: GAME
TEMAT: P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1
GOAL: W obu miejscach przejęcia miasta (`gra/src/main.ts`) usunąć z kolejki budynki `lokalizacja:'stolica'` niemożliwe do dokończenia przez zdobywcę, zwracając zebraną Pracę do puli zdobywcy (nie starego właściciela), zero regresji na legacy-jednostkach.

ZMIANY-COMMIT: `gra/src/main.ts` (oba bloki przejęcia miasta, kapitulacja i podbój bojowy —
lokalnie, per blok, dodane liczenie sumy zbankowanego `item.postep` dla WSZYSTKICH usuwanych
nie-frontowych budynków-stolica, obok istniejącego `forfeitedPostep` z `filterQueue()`, który
pokrywa tylko front); `gra/tools/podboj-kolejka-budynek-niemozliwy-test.cjs` (nowy scenariusz
E — dwa budynki-stolica naraz, drugi z własnym zbankowanym `item.postep`). Zero zmian w
`gra/src/game/production.ts` — `filterQueue()` (współdzielona z filtrem cudów) pozostaje
NIETKNIĘTA, zgodnie z zastrzeżeniem Evaluatora ("poza zakresem tego tematu"). Zero zmian poza
allowlistą — potwierdzone `git diff --stat`: wyłącznie te dwa pliki, +72/-12. `git diff --check`
czyste. Linie `setOwnerPracaPool(oldOwner, ...)` nietknięte (nadal dokładnie 2 wystąpienia).

TESTY (worktree `/home/user/wt-kolejka-podboj`):
- Bramka `podboj-kolejka-budynek-niemozliwy-test.cjs`: **75 passed, 0 failed** (69 istniejące
  bez zmian + 6 nowych ze scenariusza E — 3 asercje × 2 bloki przejęcia).
- Kontrola regresji na scenariuszu E: `git stash push -- gra/src/main.ts`, ponowne uruchomienie
  bramki na kodzie SPRZED tej poprawki → **73 passed, 2 failed**, oba FAIL dokładnie na
  scenariuszu E, dokładnie z wartością zgłoszoną przez Evaluatora (got 37, want 57) w OBU
  blokach (kapitulacja i podbój). Potwierdza: (a) defekt z ZARZUTU 1 był realny i odtwarzalny
  przez niezależny test, (b) poprawka go usuwa, (c) nic poza scenariuszem E się nie zmieniło
  (73 z 75 identyczne przed/po).
- `npx tsc --noEmit`: czysto.
- 5 bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zielone.
- Cała rodzina (grep z GOAL, ten sam zestaw co Evaluator): `ai-city-capture-integration-test`
  14 OK, `ai-production-priority-test` 9/9, `capital-capture-test` 86/86, `capital-sep-pangea-test`
  3/3, `capital-sep-unit-test` 36/36, `march-attack-queue-persist-test` 57/57,
  `panel-kolejka-pasek-postepu-test` 82/82, `post-capture-law-test` 25/25,
  `production-overflow-test` 201/201, `religia-konwersja-po-podboju-test` 12/12 — wszystkie
  zielone, identyczne z raportem Evaluatora.
- Dwa przedistniejące FAIL potwierdzone NIEZMIENIONE względem raportu Evaluatora:
  `barb-city-capture-cluster-test` 92/1, `building-queue-refund-test` 2/3 — te same liczby,
  poza zakresem tego tematu (Evaluator już zweryfikował je niezależnie na commicie bazowym
  `9f90cea7` w RUNDZIE 1).

BLOKADY: Dwa przedistniejące FAIL (jak wyżej) — nie blokują tego GOAL, potwierdzone
niezależnie przez Evaluatora na bazie sprzed tego tematu.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator, RUNDA 2 (weryfikacja obrony na ZARZUT 1) lub Final Control jeśli
Evaluator uzna obronę za wystarczającą.

DEPLOY-PUSH: NIE WYKONANO

OBRONA: ZARZUT 1 → PRZYJMUJE.

Dowód z wytworu, że defekt był realny (przed poprawką, ten sam worktree, `git stash` na
`gra/src/main.ts`, bramka Evaluatora rozszerzona o scenariusz E):
```
== kapitulacja głodowa ==
FAIL: E: ... (got 37, want 57)
== podbój bojowy ==
FAIL: E: ... (got 37, want 57)
podboj-kolejka-budynek-niemozliwy-test: 73 passed, 2 failed
```
Identyczne z opisem Evaluatora: kolejka `[mennica (front, prod.postep=37), palac (item.postep=20)]`
→ oba budynki poprawnie usunięte, ale do puli zdobywcy trafiało wyłącznie 37, nie 57.

Przyczyna źródłowa (potwierdzona czytaniem `production.ts:1479-1508`): `filterQueue()` liczy
`forfeitedPostep` WYŁĄCZNIE z aktywnego `prod.postep` frontu — nigdy nie sumuje zbankowanego
`item.postep` innych, nie-frontowych pozycji usuwanych przez ten sam predykat `keep`. Ten sam
brak dotyczy więc też filtra cudów (`sanitizeProductionQueue`, main.ts ok. 3846) — ale to
poza zakresem tego tematu (GRANICE dyspozycji: "Zero zmian w systemie cudów"), co jest
zastrzeżeniem Evaluatora, nie decyzją operatora o poprawności.

Naprawa (NIE w `filterQueue()`, LOKALNIE w obu blokach `main.ts`, dokładnie wzorzec już
istniejący i zatwierdzony w tym samym pliku): `sanitizeBuildQueue()` (`production.ts:1284-1288`,
`refundedWaiting`) rozwiązuje IDENTYCZNY problem dla legacy-jednostek dokładnie w ten sposób —
liczy sumę `item.postep` każdej usuwanej, nie-frontowej pozycji spełniającej predykat OSOBNO
od `filterQueue()`, zamiast polegać na jego `forfeitedPostep`. Powtórzyłem ten wzorzec lokalnie
w obu nowych blokach (`isCapitalOnlyBuildingSurrender`/`isCapitalOnlyBuildingCapture`,
`forfeitedBankedCapitalSurrender`/`forfeitedBankedCapitalCapture`), zamiast modyfikować
współdzieloną `filterQueue()` — powody:
1. Allowlista dopuszcza w `production.ts` wyłącznie "nową, małą funkcję pomocniczą", nie
   zmianę zachowania istniejącej, współdzielonej funkcji.
2. Zmiana `filterQueue()` zmieniłaby też zachowanie filtra cudów (main.ts:3846,
   `sanitizeProductionQueue`) — poza zakresem tego tematu wg GRANIC dyspozycji, mimo że
   sam Evaluator zauważa, że byłaby to tam też poprawka, nie regresja.
3. Lokalna naprawa jest identyczna z już zatwierdzonym precedensem w tym samym pliku
   (`sanitizeBuildQueue`), więc nie wprowadza nowego wzorca do przeglądu.

Weryfikacja zero-regresji na front-only scenariuszach (A/B/C/D, wszystkie jednoelementowe
kolejki): `forfeitedBankedCapital*` liczy `slice(1)` (pomija front), więc dla kolejki
jednoelementowej suma = 0 zawsze — 69 oryginalnych asercji bez zmian, potwierdzone (75-6=69,
identyczne wyniki co przed poprawką).
