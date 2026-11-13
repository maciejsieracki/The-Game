# R-CIV-ALL-TOPICS-ROBOCZA-20261027 — Evaluator: audyt domknięcia EOT

**STATUS: PASS-WITH-NOTES**
**DOMAIN:** GAME
**ROLA:** niezależny Evaluator, read-only
**BAZA:** `integration/robocza-all-topics-20261027`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`
**ZAKRES:** ocenić, czy timeoutowy odczyt `busy=true` po przejściu 39→40 dowodzi błędu produkcyjnego po `DONE`.

## Werdykt

Dostępny dowód **nie potwierdza osobnego deadlocka po zakończeniu EOT**. Potwierdza natomiast istotne przekroczenie limitu: `runWorldEndTurn_total` dla tury 40 trwał 69,796 s, podczas gdy harness czeka maksymalnie 60 s. Zrzut pod koniec ścieżki timeoutu pokazał turę świata 40, `busy=true`, `canEnd=false`, brak oczekujących ofert i widoczną Audiencję Dyplomatyczną z panelem Civpedii; brak było widocznego panelu bitwy.

Kod `endActiveHumanTurn()` ustawia `activeWorldEndTurnPipeline` i `endTurnInProgress` przed asynchronicznym EOT. Jego `finally` ustawia `activeWorldEndTurnPipeline=false`, kończy overlay, czyści `endTurnInProgress`/`endTurnStartedAt`, a następnie wykonuje deferred flushy i dopiero loguje `DONE`. `finally` obejmuje też ścieżkę wyjątku. Log `DONE tura 40` w końcowym ogonie warningów jest więc zgodny z normalnym wyjściem z wrappera, ale sam ogon nie datuje tego logu względem timeoutowego zrzutu stanu.

Kolejność w harnessie tworzy nieatomowy, potencjalnie przestarzały odczyt. Timeout state jest budowany jako `{ world, busy, deals: snapshot() }`; JavaScript oblicza właściwości po kolei. `busy` odczytuje flagę przed `snapshot()`. Deals snapshot następnie kopiuje własne `endTurnInProgress`, po czym wywołuje `canPlayerInitiateEndTurn()`. Ta funkcja synchronicznie wywołuje `healStaleEndTurnBlockers()`, która może zmienić flagi, kiedy aktywny pipeline już się zakończył. Warningi są kopiowane jeszcze później, po odczycie stanu, liście modali, zrzucie ekranu i tekście strony; dlatego końcowy warning `DONE` może pojawić się w tym samym raporcie, mimo że wcześniejsze pola `busy` zebrano przed nim.

`canEnd=false` i `pending=[]` nie rozstrzygają sprawy: `pending` obejmuje negocjacje handlowe, a `canEnd` może odzwierciedlać aktywną flagę w momencie sondy, otwarty/odroczony pre-battle albo inne bramki. Nie ma atomowej migawki `activeWorldEndTurnPipeline`, kolejki pre-battle ani czasu obserwacji pól. Zrzut nie dowodzi, że po logu `DONE` flaga nadal pozostawała ustawiona.

## Sprawdzone dowody

- `/tmp/large-empire-stress-summary-37176-efzk9u.json`: próbę zatrzymano po 38 ukończonych EOT; `turnBefore=39`, `turn=40`, `advanced=false`, wall 77,678 ms, `busy=true`; silnik `runWorldEndTurn_total` 69,795.6 ms.
- Ogon warningów zawiera `DONE tura 40`, bez błędów JS i bez force-clear watchdoga. Ostrzeżenia `blocked: endTurnInProgress` są zgodne z pasywnym sondowaniem HUD podczas długiego EOT.
- `gra/src/main.ts`: `finally` po `await runWorldEndTurn()` bezwarunkowo czyści marker i busy przed `DONE` (okolice linii 37944–37992). Healer nie wykonuje pasywnych stale-clearów, gdy `activeWorldEndTurnPipeline=true`.
- `gra/tools/perf-large-empire-stress-live-test.cjs`: timeout odczytuje `busy` przed `__dealsLiveDebug.snapshot()`; screenshot/tekst/warnings są czytane później.
- `/tmp/large-empire-stress-timeout-37176-efzk9u.png`: widać Audiencję Dyplomatyczną i Civpedię; nie widać aktywnego panelu bitwy. To nie wyklucza oczekującej bitwy w wewnętrznej kolejce.

## Ograniczenia i zalecenie

Wynik **nie** certyfikuje atomowego stanu po `DONE`, bo obecny test takiej migawki nie pobrał. Nie zalecam poprawki produkcyjnej end-turn na podstawie samego `{busy:true}`. Przy następnym zatwierdzonym teście warto zapisywać w jednym synchronicznym read-only hooku: `activeWorldEndTurnPipeline`, `endTurnInProgress`, `isTurnTransitionActive()`, `isPreBattleOpen()`, `hasPendingAutoPreBattle()` i `aiCmdResume != null`; po timeoutcie obserwować zakończenie bez ponownego kliknięcia i porównać stan przed oraz po `DONE`.

Niezależny problem wydajności pozostaje otwarty: turn39→40 przekroczyła limit 60 s, a `scanAutoSiegesAfterAiTurn` osiągnął 30,734 s. Ten werdykt nie zmienia ani nie usuwa tej blokady.

**ZMIANY:** brak. **BROWSER / STRESS RUN:** nie uruchamiano. **MERGE / DEPLOY / PUSH:** nie wykonano.
