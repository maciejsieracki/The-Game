STATUS: PASS-WITH-NOTES (kod i testy strukturalne zielone; kryterium „test Chromium w bitwie" NIE SPEŁNIONE, patrz BLOKADY)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1
GOAL: W trakcie bitwy (ręcznej, oblężenia, bitwy taktycznej) i na podsumowaniu bitwy zapis gry jest zablokowany z komunikatem „Zapis niedostępny w trakcie bitwy"; autozapis nie zapisuje stanu bitwy; poza bitwą zapis bez zmian; format zapisu bez zmian.
BAZA: origin/main b0b0e3f86 (worktree wf_94c22ea3-89f-1, HEAD = b0b0e3f86 przed zmianą).
DISPATCH: 00-dispatch.md istnieje tylko na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie na origin/main); DODATEK przeczytany z tej gałęzi.

ZMIANY/COMMIT:
- gra/src/main.ts (+35 linii): isSaveBlockedByBattle() = isBattleSceneOpen() || isPostBattleSummaryOpen(); notifySaveBlockedByBattle() (showHintMessage z aboveBattle=true, żeby komunikat był ponad sceną bitwy z-index 9999). Bramka na początku: persistSaveToSlot (zapisy przez dialog, test-hooki), doQuickSave (Ctrl+S, przyciski zapisu przed bitwą), doRotatingAutosave (autozapis: ciche pominięcie + console.warn), openSaveGameDialog (menu pauzy -> Zapisz).
- gra/tools/battle-save-disabled-test.cjs (nowy): test strukturalny + mutacja (usunięcie bramki z persistSaveToSlot czerwieni).
- dyspozycje/autobot/runs/R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1/10-operator-claude.md (ten raport).
- Commit: czubek gałęzi operatora (SHA zwracany orkiestratorowi w polu sha). Nie zmieniano: WERSJE.md, JSON balansu, format zapisu, rust-port.

INWENTARZ ŚCIEŻEK ZAPISU (gra/src/main.ts):
1. Ctrl+S (keydown, ~main.ts:44344) -> doQuickSave(true) -> ZABLOKOWANE.
2. Menu pauzy „Zapisz" (gamePauseMenu.ts data-act=save -> openSaveGameDialog) -> ZABLOKOWANE (dialog się nie otwiera).
3. Dialog zapisu (saveLoadDialog onSave -> persistSaveToSlot) -> ZABLOKOWANE w persistSaveToSlot.
4. Autozapis rotacyjny na koniec tury (doRotatingAutosave, ~main.ts:38520) -> ZABLOKOWANE (pominięcie).
5. Szybki zapis z paneli przed bitwą (preBattle onSave / mapFieldBattle onQuickSave / oblężenie onSave -> doQuickSave(false)) -> ZABLOKOWANE przez doQuickSave, gdy scena bitwy jest otwarta; panel przed bitwą sam nie jest sceną bitwy, więc zapis przed startem działa jak dotąd.
6. Test-hooki quickSave (window debug) -> przez persistSaveToSlot, zablokowane w bitwie.
7. Brak zapisu w src/battle/* (przyciski bitwy nie zapisują). Brak beforeunload/pagehide/visibilitychange zapisu w src/.

ZAŁOŻENIA (luki rozstrzygnięte przez operatora):
- „Scena bitwy" = wszystko, co rejestruje markBattleSceneOpen (BattleScene: ręczna, oblężenie, taktyczna).
- Podsumowanie bitwy (isPostBattleSummaryOpen) traktowane jak bitwa: zapis zablokowany do zamknięcia podsumowania (spójnie z istniejącymi strażami autozapisu/EOT w main.ts ~38129/38144/38417). Po zamknięciu zapis działa normalnie.
- Ctrl+L (wczytanie) i inne ścieżki wczytywania NIE są w zakresie tematu.

TESTY (surowe wyniki, uruchomione z gra/):
- npx tsc --noEmit: EXIT=0, 0 linii błędów (przed i po zmianie).
- node tools/battle-save-disabled-test.cjs: 8 PASS / 0 FAIL, EXIT=0 (w tym MUTACJA: kopia bez bramki w persistSaveToSlot -> czerwień).
- Bramki referencyjne:
  - logic-test: EXIT=0, "LOGIC OK (213/213)" (ref 213/213).
  - tech-tree-test: EXIT=0, "tech-tree-test: 20 pass, 0 fail" (ref 19/19; zielone).
  - research-test: EXIT=0, "PASSED: 33 / FAILED: 0 / TOTAL: 33" (ref 33/33).
  - unit-replace-test: EXIT=0, "WSZYSTKIE TESTY ZIELONE (21/21)" (ref 13/13; zielone).
  - combat-test: EXIT=0, "COMBAT TEST: 6/6 pass" (ref 6/6).
- Nie uruchamiano: unit-power-test (znany czerwony pre-istniejący), map-gen, mgla-inwariant, map-field-battle — zmiana ich nie dotyka (NIE_ZMIERZONO w tej rundzie).
- npm ci --ignore-scripts w gra/ wykonane; NIE uruchamiano npm run build/dev.

BLOKADY:
1. KRYTERIUM NIESPEŁNIONE: brak żywego testu Chromium (Vite HTTP) wchodzącego do bitwy w pełnej grze i sprawdzającego: (a) Ctrl+S / zapis z menu / autozapis w bitwie -> zablokowane + komunikat; (b) po bitwie zapis działa. Test strukturalny nie dowodzi zachowania w przeglądarce. NIE_ZMIERZONO w przeglądarce.
2. Mutacja czerwieni tylko w wariancie strukturalnym; mutacja na poziomie zachowania nie wykonana.
3. Widoczność komunikatu nad sceną bitwy (toast z-index) nie zmierzona wizualnie (NIE_ZMIERZONO).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) — zweryfikować diff gra/src/main.ts (35 linii) i test strukturalny; Final Control: zażądać żywego testu Chromium w bitwie (blokada 1) przed READY_FOR_DEPLOY, albo wydzielić go jako osobny temat.
DEPLOY/PUSH: NIE WYKONANO
