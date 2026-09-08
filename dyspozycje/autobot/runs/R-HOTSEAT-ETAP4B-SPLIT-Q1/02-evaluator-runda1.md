STATUS: PASS
DOMAIN: GAME
TEMAT: R-HOTSEAT-ETAP4B-SPLIT-Q1
GOAL: Niezależna weryfikacja Kroku 2-4 z recon (`R-HOTSEAT-ETAP-4-RECON-END-TURN-Q1` §6.1):
wydzielenie `endActiveHumanTurn(humanOwnerId)`, orkiestrator `advanceSeat()`, przepięcie
trzech zewnętrznych call-site'ów, zachowanie identycznego try/catch/finally (cztery flushe
fazy 15), no-op behawioralny przy jednym fotelu, Krok 5 nietknięty.

ZMIANY/COMMIT: brak zmian w allowlisowanych plikach poza tym raportem (Evaluator nie
modyfikuje `gra/src/main.ts`). Zweryfikowany commit Operatora: `df76db7f` na branchu
`autobot/R-HOTSEAT-ETAP4B-SPLIT-Q1` (worktree `/home/user/wt-hotseat-etap4b-split`), baza
`dfb051d3` (Etap 4a zintegrowany). Dodatkowo utworzony i usunięty tymczasowy worktree
`/home/user/wt-eval-baseline-etap4b` @ `dfb051d3` (wyłącznie do niezależnego przebiegu
baseline bramki no-op) — usunięty po zakończeniu weryfikacji (`git worktree remove --force`),
zero śladów w repo.

## Metoda weryfikacji (niezależna od raportu Operatora)

1. `git show df76db7f -- gra/src/main.ts` — pełny diff przeczytany w całości. Diff zawiera
   DOKŁADNIE 5 hunków: trzy 1-linijkowe podmiany call-site'ów (21039-21045, 21627-21633,
   33280-33312) + jeden hunk rename+komentarz `triggerPlayerEndTurn`→`endActiveHumanTurn`
   (32988-33003) + jeden hunk wstawki `advanceSeat()`/aliasu (33156-33188). Usunięte linie
   (`git diff ... | grep "^-"`): dokładnie 4 — trzy stare wywołania `triggerPlayerEndTurn()`
   + stara deklaracja `function triggerPlayerEndTurn(): void {`. Żadna linia CIAŁA funkcji
   nie została usunięta/zmieniona — potwierdza "ciało w 100% niezmienione" niezależnie od
   twierdzenia Operatora.
2. Przeczytane w całości `endActiveHumanTurn` (main.ts:32999-33166), `advanceSeat`
   (33174-33176), `triggerPlayerEndTurn`-alias (33181-33183) — struktura try(33023)/
   catch(33132)/finally(33134-33164) jednym blokiem, `await runWorldEndTurn()` (33131) W
   ŚRODKU tego samego `try`, cztery flushe (flushDeferredPlayerUnitReveals/
   flushDeferredMergePrompts/flushDeferredAutoPreBattle/flushPendingEraChangeToast) w
   `finally` PO `endTurnInProgress=false` — dokładnie ta sama kolejność/zagnieżdżenie co
   przed rozcięciem. `advanceSeat()` NIE ma własnego try/catch — architektura (a) oznacza,
   że nic nie zostało przesunięte między funkcjami, więc pytanie "czy try/catch/finally
   zachowuje identyczne zachowanie błędu" jest w tej architekturze trywialnie prawdziwe
   (żadna granica nie została przecięta) — potwierdzone czytaniem, nie tylko przyjęte na
   słowo.
3. Trzy zewnętrzne call-site'y potwierdzone grepem `grep -n "advanceSeat()"`: main.ts:21042
   (HUD `onEndTurn`), main.ts:21630 (`__eraTestDebug.endTurn`), main.ts:33309 (keydown "N").
   Grep `triggerPlayerEndTurn(` potwierdza ZERO wywołań poza definicją aliasu (33181) —
   zgodne z twierdzeniem raportu.
4. `grep -rn "triggerPlayerEndTurn|advanceSeat|endActiveHumanTurn" src --include="*.ts" |
   grep -v main.ts` — tylko dwa trafienia, oba w komentarzach (`cityPanel.ts`), zero
   wywołań z innych plików TS — main.ts jest jedynym miejscem z realnymi call-site'ami.
5. Krok 5 (bitwy/zwycięstwo): pełen diff commitu (punkt 1) nie dotyka ŻADNEGO miejsca poza
   pięcioma wypisanymi hunkami — `ownerId===0`/`VictoryInput` poza zasięgiem zmiany,
   potwierdzone brakiem jakiegokolwiek hunka w tych obszarach.
6. `docs/decyzje/PLAN-HOT-SEAT-2-GRACZY.md` — `git diff dfb051d3 df76db7f` puste, plik
   nietknięty (zakaz z dyspozycji przestrzegany). Allowlista commitu: wyłącznie
   `gra/src/main.ts` + raport Operatora — potwierdzone `git show --stat`.

TESTY (wszystkie uruchomione SAMODZIELNIE przez Evaluatora, nie przepisane z raportu
Operatora):
- `node ./node_modules/typescript/bin/tsc --noEmit` na worktree Operatora: **0 błędów**.
- `hotseat-etap4-noop-test.cjs` — DWA niezależne przebiegi na kodzie PO zmianie
  (worktree Operatora, commit `df76db7f`): przebieg 1 PASS 30/30 (A vs B), przebieg 2 PASS
  30/30 (A vs B). Dodatkowo osobny przebieg baseline na ŚWIEŻO utworzonym worktree @
  `dfb051d3` (main PRZED tą zmianą, PO Etapie 4a) — również PASS 30/30. Wszystkie 30 hashy
  z każdego z trzech przebiegów (baseline, post-run1, post-run2) porównane programowo
  (`sort -u` + `diff`, nie tylko wizualnie) — **diff pusty w obu porównaniach**
  (baseline vs post-run1, baseline vs post-run2). jsExceptions 0/0 we wszystkich
  przebiegach, console.error() gry 7/7 identyczne (informacyjne, nie część kryterium PASS).
  Potwierdza w pełni no-op behawioralny, niezależnie od przebiegów Operatora.
- `end-turn-modal-sequencing-test.cjs`: na worktree Operatora **39 pass / 1 fail** (`[A6]`
  czerwony). Ten sam test uruchomiony na osobnym worktree baseline @ `dfb051d3` (main PRZED
  zmianą) daje **identyczny wynik 39 pass / 1 fail, [A6] czerwony** — potwierdza
  NIEZALEŻNIE (nie przez `git stash`, tylko przez osobny worktree z czystym `dfb051d3`), że
  `[A6]` jest pre-istniejące i NIE jest regresją tej zmiany. `[A7]` (pin na strukturę
  `finally`) PASS w obu.
- Pięć bramek referencyjnych: `logic-test` 213/213, `tech-tree-test` 19/19, `research-test`
  33/33, `unit-replace-test` 13/13, `combat-test` 6/6 — wszystkie zgodne z liczbami z
  raportu Operatora, uruchomione samodzielnie na worktree Operatora.
- `git diff --check dfb051d3 df76db7f -- gra/src/main.ts`: czyste (exit 0).

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Evaluator PASS → Final Control (osobno) → integracja allowlist-only.

DEPLOY/PUSH: NIE WYKONANO

ZARZUTY: brak.

Uwaga niebędąca zarzutem (kosmetyczna, nie wpływa na poprawność ani na kryteria sukcesu z
dyspozycji): komunikaty `console.warn`/`console.error` wewnątrz `endActiveHumanTurn` nadal
brzmią `'[EndTurn] triggerPlayerEndTurn: ...'` (main.ts:33003, 33007, 33163) — stara nazwa
funkcji w tekście logu, nie w kodzie wykonywalnym. To jest wymagana konsekwencja zachowania
ciała funkcji w 100% bajt-w-bajt (żądanie dyspozycji i architektury (a)) — zmiana tego
tekstu byłaby WYJŚCIEM poza allowlistę "ciało niezmienione" i nie jest wymagana żadnym
kryterium sukcesu z dyspozycji. Nie wymaga naprawy w tej rundzie; odnotowuję wyłącznie dla
świadomości przy przyszłym Etapie 6/8 (naturalne miejsce do odświeżenia nazw w logach razem
z migracją `humanOwnerId`).
