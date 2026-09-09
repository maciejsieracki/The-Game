STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-A-Q1
GOAL: Migracja `playerDeclareWarOnOwner` (main.ts) z hardkodu literału `0` na `isMe()`/`ME()`,
zachowanie boolean, żywy dowód no-op PRZED/PO czerwieniejący na mutacji.

ZMIANY/COMMIT: worktree `/home/user/wt-6d-PODETAP-A`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-A-Q1`,
commit `716a6feb` (na bazie `origin/main` `cb667e5d`).
- `gra/src/main.ts::playerDeclareWarOnOwner` (dziś 9934-9967, dryf od 9864 z dispatchu — main.ts
  się przesunął): wszystkie 9 literałów `0` (wołający) zamienione na `ME()` — pozycje
  `isPeaceLockedBetween`, `chargeWarDeclarationCredibility`, `breakTreatiesOnWar`,
  `applyAllianceObligationsOnWar`, `setDiploRelation` (1. arg), `applyDiploEventTracked` (1. arg),
  zagnieżdżony `getDiploRelation` (1. arg), `pruneTributeNegotiationsBetween`,
  `recordWarDeclarationEvent`. Sygnatura `boolean` nietknięta (dwa wczesne `return false`,
  końcowe `return true`). Użyto `ME()` (wartość), nie `isMe()` (predykat) — pozycje to argumenty
  wołań, nie porównania; potwierdzone precedensem: `ME()` w identycznych pozycjach argumentowych
  już istnieje w main.ts (linie 3483, 8029, 19281/19283, 20219, 20378). `ownerDeclareWarOn` obok
  NIE dotknięta (tylko odczyt jako wzorzec).
- Nowe pliki (allowlista `gra/tools/*-test.cjs`):
  `gra/tools/hotseat-etap6d-podetap-a-test.cjs` — PRE/POST stub (wzorem
  `hotseat-etap6d-diplomacy-engine-test.cjs`): scenariusz A (`activeHumanOwnerId=0`, no-op,
  PRE==POST identyczne logi wywołań + oba guardy); scenariusz B (`activeHumanOwnerId=1`) —
  PRE błędnie woła z callerem=0 (regresja), POST poprawnie z ME()=1, plus jawna symulacja
  cofniętej migracji (`mutatedME()=>2`) łapana przez asercję.
  `gra/tools/hotseat-etap6d-podetap-a-live-test.cjs` — kryterium 4 dispatchu: realny
  `vite build` + headless Chromium (`?playtest=mapa`), reset relacji istniejącym hakiem
  `__dyploMapaOdkrycieTestDebug.prepareContact(1)`, realny klik `button[data-aid="11"]` →
  modal → `.cd-war-declare-only` → realna (zmigrowana) `playerDeclareWarOnOwner`, dowód
  skutku przez hint-toast i nowy wpis `warEventLog`.

TESTY:
- `npx tsc --noEmit` — 0 błędów.
- `node tools/hotseat-etap6d-podetap-a-test.cjs` — 9/9 PASS.
- `node tools/hotseat-etap6d-podetap-a-live-test.cjs` — 6/6 PASS, zero console.error/pageerror.
- `node tools/hotseat-etap6d-diplomacy-engine-test.cjs` (sąsiedni, sanity) — PASS.
- 5 bramek referencyjnych: logic-test 213/213, tech-tree-test 19/19, research-test 33/33,
  unit-replace-test 13/13, combat-test 6/6 — wszystkie zielone.
- `git status`/`git diff --check` czyste, tylko pliki z allowlisty.

BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator.
DEPLOY/PUSH: NIE WYKONANO
