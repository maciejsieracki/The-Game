STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy, pozycjonowanie etykiet obrazen)
TEMAT: R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1
GOAL: etykiety obrazen nad jedna jednostka nie nakladaja sie; kolejne etykiety startuja wyzej niz widoczne. Kolory (niebieski/czerwony wg strony) i tresc liczb bez zmian.
BAZA: origin/main cc7ba08669f163cb5867ad1b6180c92a17d7402c (FALA 806). Worktree: detached na tej bazie; `git merge-base --is-ancestor cc7ba0866 HEAD` = OK.

ZMIANY/COMMIT:
- gra/src/battle/battleScene.ts: interfejs FloatLabel dostaje pole `owner?: RuntimeBattleUnit`; _spawnDamageLabel liczy aktywne etykiety tej samej jednostki (floatLabels z owner === ru) i dodaje damageLabelStackOffset(activeOnUnit) do worldPos.y; etykieta zapisuje owner. Import z ./damageLabelStack.
- gra/src/battle/damageLabelStack.ts (NOWY, odchylenie od allowlisty: wydzielony czysty helper, zeby test logiczny mogl go zaladowac bez DOM/THREE; zakres wylacznie pozycjonowanie etykiet): DMG_LABEL_STACK_STEP = 0.30, damageLabelStackOffset(n) = n * step (0 dla n<=0 lub NaN).
- gra/tools/battle-damage-label-stack-test.cjs (NOWY): test logiczny (A czysta funkcja, B wiring w battleScene.ts, C tresc/kolor/czas zycia bez zmian). Helper transpilowany esbuild w pamieci, bez zapisu plikow. Opcja --src do mutacji.
- Nie zmieniono: reguly walki, obrazen, trafien, kolorow, WERSJE.md, gra-robocza.
- Commit: patrz sekcja DEPLOY/PUSH (SHA w polu sha raportu orkiestratora).

TESTY:
- node tools/battle-damage-label-stack-test.cjs -> 17 PASS / 0 FAIL, EXIT 0.
- Mutacja (damageLabelStackOffset zwraca 0): --src <kopia z 0*step> -> 14 PASS / 3 FAIL (offset 1 aktywnej, offset 2, odstep = 0), EXIT 1 -> test czerwony, jak wymagane.
- npx tsc --noEmit -> EXIT 0 (bez bledow).
- Bramki: logic-test LOGIC OK (213/213) EXIT 0; tech-tree-test 20 pass / 0 fail EXIT 0; research-test ALL GREEN EXIT 0; unit-replace-test WSZYSTKIE TESTY ZIELONE (21/21) EXIT 0; combat-test All sanity checks passed EXIT 0.
- battle-damage-colors-test.cjs (strukturalny kolorow) -> WYNIK 28 PASS / 0 FAIL, EXIT 0.
- battle-damage-colors-live-test.cjs (Chromium, xvfb, build poza repo do /tmp/dmg-colors-dist-nooverlap): NIE ZAKONCZONO. Pierwsza proba: SIGTRAP przy starcie chromium (z ustawionym TMPDIR na podkatalog scratchpad). Druga proba (domyslny TMPDIR): start Chromium OK (probe playwright = OK), ale `page.waitForFunction` przekroczylo 60000 ms (etap wejscia na mape/bitwe). Nie zmierzono kolorow ani pozycji etykiet w zywej grze.
- Pomiar pozycji etykiet PRZED/PO w zywym Chromium (kryterium b): NIE ZMIERZONO (nie udalo sie uruchomic bitwy w czasie sesji). Test logiczny (a) pokrywa mechanike przesuniecia; wizualnie etykiety nie zostaly sprawdzone.

BLOKADY:
- Zywy Chromium: bitwa nie wystartowala w 60 s oczekiwania (harness battle-damage-colors-live-test.cjs); do powtorzenia przez orkiestratora/Final Control z dluzszym limitem (BATTLE_DMG_MAP_BOOT_MS, domyslnie 150000 ms) albo w osobnej rundzie.
- Dobor wielkosci kroku (0.30 jednostek swiata) jest zalozeniem: nie dobrany wizualnie w Chromium. Przy 15 px czcionce i kamerze domyslnej wymaga potwierdzenia na zrzucie.

RUNDY: 1/5
NASTEPNY KROK: (1) zywa weryfikacja bitwy z >=2 trafieniami na jednostke (Chromium, dluzszy limit boot) i zrzut PRZED/PO; (2) Evaluator + Final Control.
UWAGI-DLA-ORKIESTRATORA:
- Dispatch w 00-dispatch.md (gałąź claude/sprawdzenie-funkcjonalnosci-ek4ra0) jest w tej gałęzi, nie w origin/main; w origin/main katalog runs/R-WEB-UI-BATTLE-DAMAGE-LABELS-NO-OVERLAP-Q1 nie istnieje.
- W worktree zainstalowano node_modules (npm ci --ignore-scripts) w gra/; katalog jest ignorowany przez git.
- Opcjonalne znalezisko poza zakresem (nie ruszane): manualBattle.ts ma wlasna kopie FloatLabel i etykiety obrazen bitwy recznej (HPBAR_Y = 1.05) — ten sam problem nakladania moze tam wystepowac; nie zmieniano.
- Log npm ci nie zostawil plikow poza worktree (usuniety).
DEPLOY/PUSH: NIE WYKONANO
