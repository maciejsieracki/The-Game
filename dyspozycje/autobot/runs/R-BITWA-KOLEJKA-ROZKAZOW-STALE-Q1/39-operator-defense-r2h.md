# Operator Defense R2-H — R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1

**Status: Etap 6/11 — odpowiedź Operatora na uwagi Evaluatora; oba pytania diagnostyczne rozstrzygnięte.** Produktu nie zmieniałem.

## Rozstrzygnięcie uwag

- Rzeczywisty klik w rundzie 2 wywołał `_issueBattleMove(..., queueOnly=false)` i `_executeUnitsImmediate` o `2026-10-30T01:30:08.402Z`, w `round=2`, `turnIdx=13`, z kolejką pustą. `atk27` (pozycja 27 w `turnOrder`) znalazł się w kwalifikowanej partii natychmiastowej. `_performPlayerOrder` wykonał jego ruch o `01:30:27.118Z`, w `turnIdx=27`, z `immediateBatch=true` i bez kontekstu `_activateUnit`; lista rzeczywistych aktywacji `_activateUnit` nie zawiera `atk27`. Zatem ruch został uruchomiony ścieżką rozkazu natychmiastowego, zanim zwykła aktywacja `atk27` wykonała jego rozkaz. Pozostałe jednostki partii były obsługiwane podczas oczekiwania na zwolnienie `busy`, więc `turnIdx` zdążył dojść do 27.
- Kliknięty pusty heks to `(31,72)`. `atk27` ma `groupId="1"` i `formationOffset={dc:0,dr:-4}`. Produkcyjne `_moveTargetForUnit` obliczyło `(31,68)`, dokładnie taki cel zapisał `playerOrder`. Rozbieżność jest oczekiwym offsetem formacji, nie niezgodnością hit-testu.
- Pozycja `atk27` zmieniła się `(30,72) → (31,71)`; aktualny rozkaz w chwili zapisu miał cel `(31,68)`. Ruch nie doszedł jeszcze do punktu docelowego, ale wykonał krok w jego stronę.

## Bieg testu i walidacja

- Ponowny produkcyjny Chromium/WebGL run użył rzeczywistej bitwy 28v28 (20 dystansowych i 8 konnych/rydwanów po stronie gracza), rzeczywistych kliknięć karty jednostki i canvasu oraz obserwatorów metod produkcyjnej `BattleScene`.
- Build: 917 modułów, 70,029,425 B, SHA-256 `2164c747231241b2c148940fa1c6b602a77006c984b3f12f45330b6f42ecac0e`.
- Browser run w wersji z nowymi asercjami zakończył się kodem 2: **14/15**. Jedyna czerwona asercja w harnessie wymagała zbyt rygorystycznie `turnOrderIndex > turnIdx`; poprawny ślad ma w chwili wywołania `turnOrderIndex=27` i `turnIdx=27`. Pozostałe 14 asercji, brak błędów strony/konsoli oraz nowe trace potwierdziły zachowanie.
- Skorygowano predykat testu tak, by wymagał kwalifikowanego immediate dispatch, `immediateBatch=true`, braku kontekstu `_activateUnit` i braku normalnej aktywacji badanego ID. Walidator zapisanych danych browsera przeszedł **5/5**: dispatch, wykonanie przed normalną aktywacją, zmiana pozycji, zgodność offsetu i brak błędów przeglądarki. To jest rewalidacja istniejącego browser trace, a nie trzeci run Chromium; poprawiona wersja testu nie została jeszcze ponownie uruchomiona.
- Po zmianie predykatu: `node --check gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs`, `npm run typecheck` i `git diff --check` — PASS.

## Dowody

- `evidence/operator-r2h-defense/full-result.json`
- `evidence/operator-r2h-defense/execution-trace.json`
- `evidence/operator-r2h-defense/battle-screenshot.png`

SHA-256:

- `full-result.json`: `f56fb2e6b71cadaa2c8a5992b82bc4ae9cd17b45038e3f841150fc76efa5c10c`
- `execution-trace.json`: `e0f53c337e966002c9debb047a0b343a8a01e48777d7b7adaeb2b2fca583233d`
- `battle-screenshot.png`: `6e283d5a0d34c3fe3ea0944580f0771c82cbc536071ad88b60ef57a63e32ff24`

## Następna bramka

Operator Defense nie wykrył nowego błędu produktu; oba uwagi Evaluatora są wyjaśnione danymi runtime. Ponieważ skorygowany predykat nie był uruchamiany w świeżym browser runie, pakiet pozostaje na etapie 6/11 i powinien dostać niezależny re-eval. Nie wykonywałem integracji, deployu ani pushu.
