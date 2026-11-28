STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-STATE-FIX-Q1 (tag SAVESTATEFIX)
GOAL: zapis i odtworzenie dwóch pól stanu AI (aiWonderStuckTurnsByOwner, aiGarrisonUnitIdByOwner) z audytu SAVEAUDIT; przebadanie pozycji z pkt 3 dispatchu z werdyktami i cytatami.
ZMIANY/COMMIT: baza aaae7b4f811c87a56bcb4ec7d4841d3ae3147419 (origin/main). Allowlista: gra/src/main.ts (+21 linii: zapis meta x2, odtworzenie w restore x2 bloki, clear w doStartGame x1; 0 usuniętych), gra/tools/save-load-ai-state-fields-test.cjs (nowy), dyspozycje/analizy/ZAPIS-STAN-POPRAWKI-2026-11-28.md (nowy), dyspozycje/autobot/runs/R-WEB-SAVE-STATE-FIX-Q1/10-operator-claude.md. SHA commita: patrz pole sha w odpowiedzi strukturalnej (czubek brancha po commicie). Podpis commitów: standardowy (bez zmiany konfiguracji, bez --no-gpg-sign).
TESTY:
- npx tsc --noEmit: exit 0
- node tools/save-load-ai-state-fields-test.cjs (NOWY): 21 PASS / 0 FAIL (T1 zapis, T2 clear->odczyt->set, T3 reset; 12 mutacji semantycznych czerwonych; T5 behawioralny: relaxedWonderCostThreshold(1,12,30)=1,6667 vs (1,0,30)=1,0000)
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21
- combat-test: 6/6
- ai-test: 297 passed, 0 failed
- early-grace-15-test: 33 passed, 0 failed
- society-breakdown-test: 56 OK, 0 FAIL
- ai-city-order-need-wiring-test: 267 passed, 0 failed
- save-load-ai-cs-absorption-state-test: 27 PASS / 0 FAIL
- save-load-podzial-pracy-representation-test: 5 PASS / 0 FAIL
- save-load-ledger-history-test: 4 PASS / 0 FAIL
- save-load-sort-test: 4/4
- determinism-save-load-resume-test: PASS
- save-load-roundtrip-state-drift-test (bez --dist): warstwa A zielona; całość FAIL tylko przez brak argumentu --dist (warstwa B NIE ZMIERZONO, bez builda — zakaz npm run build)
- TEST LIVE (c) z licznikiem cudu > 0 i B==A: NIE ZMIERZONO. Nie uruchomiono save-load-continuity-live.cjs; nie podjęto prób doprowadzenia licznika > 0 na żywo (brak dowodu w tej rundzie).
- Gałąź: git diff --check — do sprawdzenia przy integracji.
BLOKADY:
- DECISION_REQUIRED (pkt 3.2 dokumentu): pendingForeignSpawnCities / pendingSameTypeRivalCount* nie są zapisywane ani odtwarzane; zapis przed założeniem stolicy gracza nie jest blokowany (brak bramki w isSaveBlockedByBattle ani w doQuickSave/autosave). Po wczytaniu rywale tego samego typu i obce klastry AI nie pojawiają się w całej grze (kod: drenaż pustej kolejki w tryFoundPlayerCityAt, ok. 11996-12009 i 12238-12240). Skutek dla gracza: świat po wczytaniu ma mniej państw i cywilizacji AI. Live NIE ZMIERZONO (czy UI pozwala zapisać przed pierwszym miastem — nie sprawdzono w przeglądarce). Wybór: (a) zapisać kolejki w meta jako opcjonalne pola (zmiana formatu zapisu, stary zapis działa jak dziś); (b) zablokować zapis przed założeniem stolicy (zmiana UI). Nie wdrożono na własną rękę (zgodnie z dispatchem).
- Kandydat D do decyzji orkiestratora (nie wdrożony, bo potwierdzenie tylko kodem): playerStartHex / playerStartHexByOwner (pkt 3.1) nie są w zapisie i nie są odtwarzane w restore; krąg startu (isInStartReveal, canFoundPlayerCityAt) czyta je przed założeniem stolicy. Po wczytaniu zapisu sprzed pierwszego miasta start może być w złym miejscu — gracz nie założy stolicy. Live NIE ZMIERZONO. Propozycja: opcjonalne pole meta, odtwarzane w restore.
- NIEROZSTRZYGNIĘTE (pkt 3.3): aiTurnAwaitingBattle — okno „AI czeka na bitwę” bez otwartej sceny bitwy nie jest blokowane przez isSaveBlockedByBattle; czy zapis w tym oknie jest możliwy w UI i co gubi po wczytaniu — NIE ZMIERZONO.
- Warstwa B save-load-roundtrip-state-drift-test NIE ZMIERZONA (wymaga bundla --dist).
RUNDY: 1/5 (bez rund FAIL/BLOCK; jedna runda wykonawcza).
NASTĘPNY KROK: Final Control: (1) przegląd diffu main.ts (21 linii, zero usuniętych) i merge-base z aaae7b4f8; (2) decyzja orkiestratora/właściciela o 3.2 (kolejki spawnu) — osobny temat; (3) decyzja o kandydacie 3.1 (playerStartHex) — osobny temat z testem live przed-pierwszym-miastem; (4) test live SAVEMAT/continuity dla licznika cudu (zakres pkt 4c) jako osobny temat przy maksimum (rivals 9, civTypes 14, Trudny).
DEPLOY/PUSH: NIE WYKONANO
