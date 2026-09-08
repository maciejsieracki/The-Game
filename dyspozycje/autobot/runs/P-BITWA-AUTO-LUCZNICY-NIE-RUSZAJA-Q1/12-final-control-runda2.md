STATUS: PASS
DOMAIN: GAME
TEMAT: P-BITWA-AUTO-LUCZNICY-NIE-RUSZAJA-Q1
GOAL: Napraw jednostki AUTO stojące bezczynnie (regex-anchoring test rundy 2, engine fix z
rundy 1 już potwierdzony, zero zmian battleScene.ts w tej rundzie poza combined-blokiem już
zatwierdzonym).

WERDYKT: PASS. Wszystkie deklaracje Operatora/Evaluatora rundy 2 zweryfikowane niezależnie i
potwierdzone — zero rozbieżności.

DOWÓD WŁASNEJ WERYFIKACJI (świeży worktree `/tmp/wt-final-control-r2` z `origin/main@9acc5037`,
usunięty po zakończeniu, `git worktree remove --force`):
- Potwierdzono `origin/main@9acc5037` już zawiera obrońców-muru (`siegeDefenderNeverDoctrine`,
  linia 5423-5424).
- Zastosowano combined blok słowo-w-słowo z `08-final-control-runda1.md` (weryfikacja
  `sed`/odczyt — identyczny tekst).
- Skopiowano test z `/home/user/wt-bitwa-lucznicy-auto@3571b302` — `diff` potwierdza kopię
  identyczną bit-do-bitu.
- `node tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` → 6 pass, 0 fail.
- `tsc --noEmit` → 0 błędów.
- 5 bramek referencyjnych: logic-test 213/213, combat-test 6/6, map-field-battle-test 22/22,
  tech-tree-test 19/19, research-test 33/33 — zielone.
- `bitwa-obroncy-mur-kolumny-test.cjs` (żywy Playwright/Chromium/vite build) → 9/9 (0 fail), w
  tym BASE = połączony kod tego tematu z obrońcami-muru — zero regresji.
- Mutacja własna: cofnięto WYŁĄCZNIE wewnętrzny reset `playerOrder`, zostawiając
  `siegeDefenderNeverDoctrine`/warunek muru nietknięty → 3 pass, 3 fail, dokładnie asercje
  #1, #5, #6 (te odnoszące się do fixu łuczników); asercje #2, #3, #4 pozostały OK.
- `git status --porcelain` po zakończeniu — brak trwałych zmian.

ZMIANY-COMMIT: Final Control nie integruje — tekst diffu i test przekazane orkiestratorowi do
ręcznej integracji (poniżej, zastosowane w commicie orkiestratora).

FINALNY DIFF battleScene.ts (zastosowany):
```diff
     const siegeDefenderNeverDoctrine = ru.side === 'def' && this.siegeWallCol >= 0;
     if (!this._manualMode && !siegeDefenderNeverDoctrine) {
-      if (this._isUnitDoctrineAuto(ru) && ru.playerOrder.type === 'none') {
+      if (this._isUnitDoctrineAuto(ru)) {
+        if (ru.playerOrder.type !== 'none') ru.playerOrder = { type: 'none' };
         const meta = this._effectiveMetaForUnit(ru);
         if (meta.doctrine !== 'manual') {
           if (this._executeGroupDoctrineStep(ru, meta, done)) return;
```
Test: cały plik `gra/tools/bitwa-auto-doktryna-playerorder-zrodlo-test.cjs` (96 linii, z
commit `3571b302`).

TESTY: patrz DOWÓD wyżej.
BLOKADY: brak.
NASTĘPNY KROK: orkiestrator integruje diff + test do `main`, aktualizuje rejestr wg procedury,
osobna bramka deploy/push.
DEPLOY/PUSH: NIE WYKONANO
