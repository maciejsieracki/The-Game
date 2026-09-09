STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP6D-PODETAP-A-Q1
GOAL: Migracja `playerDeclareWarOnOwner` (main.ts) z hardkodu literału `0` na `isMe()`/`ME()`,
zachowanie boolean, żywy dowód no-op PRZED/PO czerwieniejący na mutacji.

WERDYKTY: Operator PASS (runda 1), Evaluator PASS (runda 1, zero zarzutów). Final Control
przeprowadził pełną NIEZALEŻNĄ weryfikację (nie powtórzenie cudzych raportów) w worktree
`/home/user/wt-6d-PODETAP-A`, gałąź `autobot/R-HOTSEAT-ETAP6D-PODETAP-A-Q1`, commit
`716a6feb`, `git merge-base HEAD origin/main` = `cb667e5d` (zgodne z deklaracją Operatora —
potwierdzone poleceniem, nie założone).

DOWOD WLASNEJ WERYFIKACJI:
1. `npx tsc --noEmit` (z `gra/`) — exit 0, brak błędów.
2. Pełne ciało `playerDeclareWarOnOwner` przeczytane w całości (main.ts:9934-9967, dryf od
   9864 z dispatchu, zgodny z raportami): wszystkie 9 pozycji literału `0` jako "aktywny
   fotel wołający" zamienione na `ME()` — `isPeaceLockedBetween` (1×), `chargeWarDeclarationCredibility`
   (1×), `breakTreatiesOnWar` (1×), `applyAllianceObligationsOnWar` (1×), `setDiploRelation`
   arg 1 (1×), `applyDiploEventTracked` arg 1 + zagnieżdżony `getDiploRelation` arg 1 (2× w
   jednej linii), `pruneTributeNegotiationsBetween` (1×), `recordWarDeclarationEvent` (1×) =
   9/9 policzone osobiście przez odczyt, nie przez zaufanie liczbie z raportu. Sygnatura
   `function playerDeclareWarOnOwner(ownerId: number): boolean` nietknięta — dwa wczesne
   `return false;` (linie 9938, 9948) i końcowe `return true;` (9966) bez zmian.
   `ownerDeclareWarOn` (main.ts:9977+, tuż obok) przeczytana — operuje na `attackerId`/
   `defenderId`, ZERO odwołań do `ME()`/literału `0` w roli wołającego — funkcja faktycznie
   nietknięta.
3. `git diff cb667e5d..716a6feb -- gra/src/main.ts` przeczytany w całości: dokładnie jeden
   hunk, dokładnie 9 zamian `0`→`ME()`, żadna inna linia main.ts nie ruszona. `git diff --check
   cb667e5d..716a6feb` — czyste (exit 0, brak whitespace/no-newline errorów).
4. `node tools/hotseat-etap6d-podetap-a-test.cjs` — uruchomione samodzielnie: 9/9 PASS.
   Kod bramki przeczytany w całości: scenariusz [A] (activeHumanOwnerId=0, dzisiejszy stan
   produkcyjny) dowodzi PRE==POST identyczne logi wywołań i identyczny boolean (no-op).
   Scenariusz [B] (activeHumanOwnerId=1) to PRAWDZIWY dowód PRZED!=PO: PRE wywołuje
   `chargeWarDeclarationCredibility` z callerem=0 (regresja — literał zaszyty), POST z
   callerem=ME()=1 (poprawnie), `JSON.stringify(log)` różne między PRE i POST — nie jest to
   tautologia. Osobny blok [MUTACJA] podstawia `mutatedME()=>2` pod POST i potwierdza, że
   callerArg=2 NIE zgadza się z oczekiwanym 1 — bramka faktycznie czerwienieje na cofniętej/
   błędnej migracji, czyli wykrywa regresję, a nie tylko "zawsze zielona".
5. `node tools/hotseat-etap6d-podetap-a-live-test.cjs` — uruchomione samodzielnie: build
   (`vite build --outDir <poza main.ts source>` — jedyna dozwolona komenda wg C-001) +
   headless Chromium realny. 6/6 PASS: bootstrap OK, przycisk audiencji `data-aid="11"`
   obecny, klik → modal → klik `.cd-war-declare-only` → REALNA (zmigrowana)
   `playerDeclareWarOnOwner` wywołana, hint-toast "Wypowiedziałeś wojnę" obecny,
   `warEventLog` dostał nowy wpis (dowód że `recordWarDeclarationEvent(ME(),1)` faktycznie
   wykonał się z poprawnym callerem), zero console.error/pageerror. Ta bramka woła REALNY kod
   main.ts (nie reimplementację) — komplementarna do bramki jednostkowej.
6. `node tools/hotseat-etap6d-diplomacy-engine-test.cjs` (sąsiedni temat, sanity) — PASS,
   wszystkie asercje zielone (w tym własne PRE/PO+MUTACJA dla `playerIsAtWarWith`/`isHuman`
   z tego samego etapu 6d ENGINE).
7. 5 bramek referencyjnych uruchomione samodzielnie z `gra/`:
   - `logic-test.cjs`: LOGIC OK (213/213)
   - `tech-tree-test.cjs`: 19 pass, 0 fail
   - `research-test.cjs`: PASSED 33/33, ALL GREEN
   - `unit-replace-test.cjs`: WSZYSTKIE TESTY ZIELONE (13/13)
   - `combat-test.cjs`: COMBAT TEST 6/6 pass
   Wszystkie zielone, liczby identyczne z raportami Operatora/Evaluatora.
8. `git diff --stat cb667e5d..716a6feb`: `gra/src/main.ts | 16 +-`,
   `gra/tools/hotseat-etap6d-podetap-a-live-test.cjs | 171 ++`,
   `gra/tools/hotseat-etap6d-podetap-a-test.cjs | 195 ++` — zgodne z allowlistą dispatchu
   (wyłącznie ciało jednej funkcji w main.ts + dwa nowe pliki `gra/tools/*-test.cjs`).
   `git status --porcelain` w worktree po wszystkich testach — pusty (bramka live sama
   sprząta swój `dist-*` katalog build, poza repo trackingiem).

ZMIANY-COMMIT: worktree `/home/user/wt-6d-PODETAP-A`, gałąź
`autobot/R-HOTSEAT-ETAP6D-PODETAP-A-Q1`, commit `716a6feb` na bazie `origin/main` `cb667e5d`
(potwierdzone `git merge-base`). Brak nowych zmian od Final Control — wyłącznie weryfikacja,
zero zapisów do `gra/` lub `gra/`-zależnych artefaktów.

TESTY: tsc --noEmit (0 błędów, uruchomione niezależnie) · hotseat-etap6d-podetap-a-test.cjs
9/9 PASS (uruchomione niezależnie, kod przeczytany, dowód PRE!=PO i test mutacyjny
zweryfikowany jako nie-tautologiczny) · hotseat-etap6d-podetap-a-live-test.cjs 6/6 PASS,
0 console.error (uruchomione niezależnie, realny vite build + Chromium) ·
hotseat-etap6d-diplomacy-engine-test.cjs PASS (sąsiedni, sanity) · logic-test.cjs 213/213 ·
tech-tree-test.cjs 19/19 · research-test.cjs 33/33 · unit-replace-test.cjs 13/13 ·
combat-test.cjs 6/6 · git diff --check czyste · git status czysty.

BLOKADY: brak.

NASTEPNY KROK: integracja orkiestratora (merge do main na bazie `git merge-base`, nie
zwykły fast-forward — main poszedł dalej od `cb667e5d`) → `READY_FOR_DEPLOY` wystawia
wyłącznie orkiestrator po faktycznej integracji.

DEPLOY/PUSH: NIE WYKONANO
