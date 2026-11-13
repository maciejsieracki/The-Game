STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-ARMY-PANEL-RECRUIT-REMOVE-Q1
GOAL: Kolejka rekrutacji z ✕, ↑ ↓ i przeciąganiem pod każdym miastem w panelu armii (Imperium → Armia), jedna logika z panelem miasta, odświeżanie obu paneli.
ZMIANY/COMMIT: oceniany SHA ff6ac152c (baza 89b3ee5db = origin/main). `git diff --name-only 89b3ee5db ff6ac152c`: 11 plików, wszystkie w allowliście (gra/src/ui/cityPanel.ts, nowy gra/tools/army-panel-recruit-remove-test.cjs, 9 artefaktów w runie). Brak zmian w main.ts, gra-robocza, WERSJE.md, rust-port. `git diff --check`: czysto. Commit FC dodaje tylko 03-final-control.md.
ZARZUTY: brak (Evaluator: 0 zarzutów). Notatki Evaluatora 1-5: ODDAL (nieblokujące). Nota 2 (poszerzenie cityPanel.ts o montaż kolejki w armii i aria-label) wynika z doprecyzowania właściciela; plik w allowliście.
TESTY (własne, po npm ci --ignore-scripts, PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium):
- army-panel-recruit-remove-test.cjs: 21 passed, 0 failed, 0 błędów strony.
- tsc --noEmit: EXIT=0.
- army-merge-panel-production-mount 9/0; empire-mass-recruitment 30/0; recruit-list-visibility-ui 15/0.
- Przegląd diffu: cancelRecruitmentQueueItem i moveRecruitmentQueueItemBy wspólne dla obu paneli; ✕ idzie przez cfg.onCancelRecruitment (istniejący zwrot); onMutated tylko gdy host isConnected.
- NIE_ZMIERZONO: zwrot MP i surowców przy ✕ w pełnej grze (cancelRecruitmentPurchase to domknięcie w main.ts, kod niezmieniony). Zalecana kontrola ręczna po integracji.
- Regresje: przed/po identyczne wg Operatora; 16 padających identycznie przed i po.
- Regresje nadpisały śledzony PNG innego runu; przywrócony git checkout, node_modules usunięte.
BLOKADY: brak
RUNDY: 1/5 (FC)
NASTĘPNY KROK: integracja orkiestratora. SHA do integracji: ff6ac152c (kod), potem commit FC z tym raportem (kod pierwszy). Kolejność względem origin/rust-port/parity-v2: niezależne; zmiana tylko w gra/src/ui/cityPanel.ts, a parity-v2 nie zmienia tego pliku względem main (git diff --stat origin/main...origin/rust-port/parity-v2 -- gra/src/ui/cityPanel.ts: pusty). Integrować do main w dowolnej kolejce, bez rebase parity-v2 z tego powodu.
DEPLOY/PUSH: NIE WYKONANO
