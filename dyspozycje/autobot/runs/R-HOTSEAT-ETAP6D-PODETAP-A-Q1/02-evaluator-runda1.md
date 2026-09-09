STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-A-Q1
GOAL: Migracja `playerDeclareWarOnOwner` (main.ts) z hardkodu literału `0` na `isMe()`/`ME()`, zachowanie boolean, żywy dowód no-op PRZED/PO czerwieniejący na mutacji.

ZARZUTY: brak (lista pusta). Weryfikacja niezależna w `/home/user/wt-6d-PODETAP-A`:

1. `npx tsc --noEmit` — exit 0, brak błędów. Zgodne z raportem Operatora.

2. Pełne ciało `playerDeclareWarOnOwner` (obecnie linie 9934-9967) przeczytane w całości:
   - Zero literałów `0` jako identyfikator aktywnego fotela — wszystkie 9 miejsc zamienione na `ME()`
     (`isPeaceLockedBetween`, `chargeWarDeclarationCredibility`, `breakTreatiesOnWar`,
     `applyAllianceObligationsOnWar`, `setDiploRelation` (arg 1), `applyDiploEventTracked` (2×
     w jednej linii), `pruneTributeNegotiationsBetween`, `recordWarDeclarationEvent`).
   - Sygnatura `function playerDeclareWarOnOwner(ownerId: number): boolean` nietknięta,
     oba `return false`/`return true` bez zmian.
   - `git diff cb667e5d..716a6feb -- gra/src/main.ts` pokazuje dokładnie ten jeden hunk
     (9 zamian `0`→`ME()`) — żadna inna funkcja w main.ts nie tknięta w tym diffie, w
     szczególności `ownerDeclareWarOn` (widoczna w kontekście diffu tuż poniżej,
     linie niezmienione, poza patchem).

3. Bramka jednostkowa `node tools/hotseat-etap6d-podetap-a-test.cjs`: 9/9 PASS, w tym
   jawny dowód nietautologii — test [B] pokazuje PRE (regresja: caller=0 mimo aktywnego
   fotela=1) vs PO (caller=ME()=1) jako RÓŻNE wartości, i osobny test [MUTACJA] potwierdza,
   że przy zmutowanym `ME()=2` bramka faktycznie czerwienieje (łapie regresję) — to nie jest
   tautologia typu "test zawsze zielony".
   Bramka żywa `node tools/hotseat-etap6d-podetap-a-live-test.cjs` (realny Chromium,
   `vite build` + klik w audiencji): 6/6 PASS, zero console.error/pageerror, w tym
   potwierdzenie `recordWarDeclarationEvent(ME(),1)` faktycznie wykonanego na żywym DOM.

4. `git diff --stat cb667e5d..716a6feb`:
   `gra/src/main.ts | 16 +-`, `gra/tools/hotseat-etap6d-podetap-a-live-test.cjs | 171 ++`,
   `gra/tools/hotseat-etap6d-podetap-a-test.cjs | 195 ++` — zgodne z allowlistą (jedna
   funkcja w main.ts + dwa nowe pliki narzędziowe testowe). `git diff --check` czyste
   (exit 0), `git status --porcelain` w worktree pusty (branch ahead 1 od origin/main,
   commit `716a6feb` na bazie `cb667e5d`, zgodnie z raportem).

5. Pięć bramek referencyjnych uruchomione niezależnie:
   - `logic-test.cjs`: LOGIC OK (213/213)
   - `tech-tree-test.cjs`: 19 pass, 0 fail
   - `research-test.cjs`: PASSED 33/33, ALL GREEN
   - `unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (13/13)
   - `combat-test.cjs`: COMBAT TEST 6/6 pass
   Wszystkie zielone, zgodne z liczbami z raportu Operatora.

TESTY: tsc --noEmit (0 błędów) · hotseat-etap6d-podetap-a-test.cjs 9/9 PASS ·
hotseat-etap6d-podetap-a-live-test.cjs 6/6 PASS (0 console.error) ·
logic-test.cjs 213/213 · tech-tree-test.cjs 19/19 · research-test.cjs 33/33 ·
unit-replace-test.cjs 13/13 · combat-test.cjs 6/6 · git diff --check czyste ·
git status czysty.

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Final Control.

DEPLOY/PUSH: NIE WYKONANO
