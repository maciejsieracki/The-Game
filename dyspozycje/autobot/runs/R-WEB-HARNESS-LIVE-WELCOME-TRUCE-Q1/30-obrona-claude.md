STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy live) — bez zmian w gra/src i gra/data, bez deployu
TEMAT: R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1
GOAL: obrona Operatora r2 wobec zarzutów Evaluatora (kandydat 991e386c8). Odpowiedź na każdy zarzut: PRZYJMUJĘ albo ODRZUCAM z dowodem. Bez zmian kodu w tej rundzie; uzupełniono brakującą listę kandydatów i dopisano założenia.
ZMIANY-COMMIT: tylko ten raport (dyspozycje/autobot/runs/R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1/30-obrona-claude.md). Kod testów bez zmian względem 991e386c8. SHA czubka: zob. pole sha w wyniku.

## Odpowiedzi na zarzuty

### Zarzut 1 — bramka bramki-tmpdir-unikalnosc: FAIL=1 (2 trafienia zamiast 0)
STATUS: PRZYJMUJĘ, że kryterium dispatchu („bramka PASS, 0 trafień”) NIE jest spełnione. Bramka wynosi PASS=2 FAIL=1.
ODRZUCAM natomiast przypisanie winy kandydatowi — dowód:
- Surowe wyjście po ponownym biegu na 991e386c8: `FAIL zadna bramka w tools/ nie pisze do STALEJ nazwy pod os.tmpdir() -- 2 trafien`, `PASS=2 FAIL=1`.
- `git diff --name-only 547ca34b5 991e386c8` nie zawiera ani `gra/tools/resource-ledger-realpath-mutation-test.cjs`, ani `gra/tools/save-load-deserialize-fields-audit.cjs` (pusty wynik dla obu).
- Na bazie 547ca34b5 te pliki zawierają `os.tmpdir()`: resource-ledger (linia 24: `const DIST = arg('dist', \`${require('os').tmpdir()}/civ-ledger-mut-${TMPDIR_RUN_ID}\`)`), save-load-deserialize-fields-audit (linia 52: `path.resolve(arg('out-dir', path.join(os.tmpdir(), RUN_ID + '-evidence')))`).
- Obie pozycje leżą poza allowlistą dispatchu; ich naprawa jest zakazana w tym temacie. Nie naprawiano.
DECYZJA DLA ORKIESTRATORA: bramka pozostaje czerwona na tym kandydacie, bo odziedziczyła 2 trafienia z bazy. Wybór: osobny temat R-WEB-TMPDIR-LAST-2 (zalecany) albo świadoma dyspensa dla tego tematu.

### Zarzut 2 — tylko 1 z dozwolonych 12 testów live naprawiony; brak listy kandydatów; determinism bez helpera
STATUS: PRZYJMUJĘ. Brak listy był brakiem raportu; lista jest uzupełniona poniżej (sekcja „Lista kandydatów”), wynik z surowego grep.
- Dozwolone było „max 12” — naprawiono 1 (army-panel), a dwa kolejne (diplo-truce, determinism) zmieniono z innych przyczyn; to zgodne z dispatchem („napraw wyłącznie te, które uruchomisz solo i potwierdzisz zielone”). Zielone solo potwierdzono w 10-operator-claude.md dla army-panel (7/7 PASS), diplo-truce (40 pass / 0 fail) i determinism (runner: DONE, --compare EQUAL 1 of 1).
- Determinism: dispatch wymagał zastosowania helpera. ODRZUCAM konieczność tego: `grep -c '\.click(' gra/tools/determinism-save-load-resume-live.cjs` = 0. Runner nie klika w DOM, więc ekran powitalny nie blokuje jego ścieżki; blokada była po stronie bramki NNS przy endTurn. Stąd dosypanie zasobów zamiast helpera. Zmiana ogranicza się do warunku `nnsGateBlocked()`.

### Zarzut 3 — grantPlayerGold/Food w diplo-truce i determinism; wzór UPKEEPMULT niezweryfikowany; plik zrzutu w repo
- Bramka NNS blokuje poprawnie: ODRZUCAM zarzut, że blokada jest błędem testu. Komentarz w teście i reguła gry (no-negative-stocks.ts: „Prognoza < 0 po reakcji automatu → blokada, o ile istnieje ręczna dźwignia; gracz zawsze ma ruch naprawczy”) wskazują, że to zachowanie zamierzone. Klasyfikacja: STARY-PIN (test oczekiwał bufora żywności), nie BŁĄD-GRY.
- Asercje rozejmu nietknięte (diff: tylko linie grantów i komentarze; brak zmian w asercjach).
- Dowód, że dosypanie jest potrzebne: mutacja Evaluatora (usunięcie grantów) daje 15 pass / 1 fail, komunikat „Spichlerz państwa (żywność): po zakończeniu tury zabraknie 135”. Potwierdza to rolę grantów; nie potwierdza wzoru konsumpcji.
- Wzór konsumpcji żywności po UPKEEPMULT: PRZYJMUJĘ jako NIEZWERYFIKOWANE. ZAŁOŻENIE: niedobór 135 w tej turze wynika z kosztów żywności jednostek mnożonych przez UPKEEPMULT, a nie z błędu naliczania. Nie sprawdzano kodu gry (poza zakresem; gra/src nietykane). Kandydat do osobnej weryfikacji: R-WEB-UPKEEPMULT-FOOD-AUDIT.
- Plik zrzutu: ODRZUCAM konieczność usunięcia pliku z repo w tym temacie. `git diff --name-only 547ca34b5 991e386c8` pokazuje, że truce-01-modal-rozejm-5.png nie został zmieniony przez kandydata; domyślna ścieżka zrzutu jest już poza repo (os.tmpdir()/civ-truce-evidence-<TMPDIR_RUN_ID>). Plik śledzony zostaje w git (poza allowlistą); sprzątanie to osobny temat.

## Lista kandydatów (testy live z `.click(`, bez obsługi ekranu powitalnego)
Wynik: `grep -l '\.click('` na gra/tools/*live*.cjs = 105 plików; z tego bez `cww|closeCivWelcome|_live-ready|civ-welcome` = 102 plików (pełna lista poniżej). Heurystyka tekstowa: nie zweryfikowano, które z nich realnie dochodzą do pierwszego kontaktu z ekranem. Każdy wymaga solo-biegu przed naprawą. Poza zakresem tego tematu; nie naprawiano.

- gra/tools/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs
- gra/tools/ai-ai-treaty-live-proof-wiring-run.cjs
- gra/tools/ai-army-all-civs-live-measure.cjs
- gra/tools/ai-army-live-measure.cjs
- gra/tools/ai-city-live-measure.cjs
- gra/tools/ai-trade-wiring-e2e-live-test.cjs
- gra/tools/ai-war-weariness-live-audit-measure.cjs
- gra/tools/ambush-live-test.cjs
- gra/tools/autoclear-priority-live-test.cjs
- gra/tools/battle-banner-retreat-overlap-live-test.cjs
- gra/tools/battle-damage-colors-live-test.cjs
- gra/tools/battle-doctrine-live-r3-test.cjs
- gra/tools/battle-doctrine-live-r4-test.cjs
- gra/tools/battle-hud-tempo-minimap-live-test.cjs
- gra/tools/battle-large-return-live-test.cjs
- gra/tools/battle-manual-control-multicycle-live-test.cjs
- gra/tools/battle-manual-full-roster-pointer-live-test.cjs
- gra/tools/battle-manual-melee-live-test.cjs
- gra/tools/battle-manual-orders-live-open-tile-deterministic-test.cjs
- gra/tools/battle-manual-queued-order-lifecycle-live-test.cjs
- gra/tools/battle-player-always-blue-live-test.cjs
- gra/tools/battle-save-disabled-live-test.cjs
- gra/tools/city-founding-limit-greyed-fullgame-live-test.cjs
- gra/tools/city-founding-limit-greyed-live-test.cjs
- gra/tools/defeat-last-city-live-test.cjs
- gra/tools/defeat-screen-summary-live-test.cjs
- gra/tools/diplo-aggressor-marker-live-test.cjs
- gra/tools/diplo-forced-peace-pending-live-paths-test.cjs
- gra/tools/diplo-peace-auto-stale-offer-live-test.cjs
- gra/tools/diplo-respect-military-live-test.cjs
- gra/tools/diplo-treaty-pay-window-live-verify-2-test.cjs
- gra/tools/diplo-truce-ai-table-live-test.cjs
- gra/tools/diplo-truce-live-test.cjs
- gra/tools/diplo-war-peace-live-test.cjs
- gra/tools/diplomacy-direct-negotiation-live-test.cjs
- gra/tools/diplomacy-relation-deal-text-consistent-live-test.cjs
- gra/tools/diplomacy-relation-value-mismatch-live-test.cjs
- gra/tools/dyplo-mapa-odkrycie-live-test.cjs
- gra/tools/empire-recruit-all-live-test.cjs
- gra/tools/empire-recruit-live-test.cjs
- gra/tools/end-turn-block-event-live-test.cjs
- gra/tools/end-turn-gate-live-test.cjs
- gra/tools/era-change-toast-live-test.cjs
- gra/tools/events-one-turn-lifetime-live-test.cjs
- gra/tools/forced-war-iron-player-target-live-test.cjs
- gra/tools/forced-war-player-no-contact-live-test.cjs
- gra/tools/forced-war-player-target-live-test.cjs
- gra/tools/forced-war-trojstronna-domino-live-test.cjs
- gra/tools/hotseat-etap6d-podetap-a-live-test.cjs
- gra/tools/hotseat-etap6d-podetap-b-live-test.cjs
- gra/tools/hotseat-etap6d-podetap-e-live-test.cjs
- gra/tools/improvement-build-highlight-lifecycle-live-test.cjs
- gra/tools/interaction-latency-vs-citycount-live-test.cjs
- gra/tools/live-verify-administrator-panel.cjs
- gra/tools/live-verify-administrators-wizard.cjs
- gra/tools/live-verify-aiai-labels-run.cjs
- gra/tools/live-verify-autoimprove-common.cjs
- gra/tools/live-verify-battle-after-full-move-manual-driver.cjs
- gra/tools/live-verify-city-administrator.cjs
- gra/tools/live-verify-improvement-administrator.cjs
- gra/tools/live-verify-prebattle-weakened-q1.cjs
- gra/tools/live-verify-w18-w24-manual-losses-r2-manual.cjs
- gra/tools/live-verify-w18-w24-manual-losses-w18.cjs
- gra/tools/live-verify-w18-w24-manual-losses-w18r3.cjs
- gra/tools/live-verify-w18-w24-manual-losses-w24.cjs
- gra/tools/live-verify-w24-widths-1024-900-800-obs.cjs
- gra/tools/live-verify-w3-manual-orders-r3.cjs
- gra/tools/live-verify-wave-689-697-a-gate-v2.cjs
- gra/tools/live-verify-wave-689-697-a-gate-v4.cjs
- gra/tools/live-verify-wave-689-697-a-gate.cjs
- gra/tools/live-verify-wave-689-697-a1-title-tax.cjs
- gra/tools/live-verify-wave-689-697-a2-trade.cjs
- gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs
- gra/tools/live-verify-wave-689-697-b2-panel-probe.cjs
- gra/tools/live-verify-wave-689-697-b2-panel-run.cjs
- gra/tools/live-verify-wave-703-710-Q1.cjs
- gra/tools/live-verify-wave-703-710-civpedia.cjs
- gra/tools/live-verify-wojownik-map-q1.cjs
- gra/tools/live-verify-wojownik-r2.cjs
- gra/tools/live-verify-wojownik-sideswap-manual-q1.cjs
- gra/tools/map-controls-behind-panels-live-test.cjs
- gra/tools/mgla-sciezka-live-test.cjs
- gra/tools/minimap-viewport-rect-follow-live-test.cjs
- gra/tools/minimapa-ikona-robotnik-kolor-live-test.cjs
- gra/tools/minimapa-pasek-narzedzi-reorganizacja-live-test.cjs
- gra/tools/notif-live-shots.cjs
- gra/tools/open-panel-refresh-after-tech-live-test.cjs
- gra/tools/perf-endturn-ai-phase-live-test.cjs
- gra/tools/perf-endturn-render-hud-live-test.cjs
- gra/tools/perf-endturn-render-progress-live-test.cjs
- gra/tools/perf-large-empire-stress-live-test.cjs
- gra/tools/perf-late-game-interaction-r2-live-test.cjs
- gra/tools/perf-long-session-live-test.cjs
- gra/tools/praca-pula-100-budynki-live-test.cjs
- gra/tools/r-bitwa-etykieta-tozsamosc-strony-live-atak-test.cjs
- gra/tools/resource-building-toggle-ui-live.cjs
- gra/tools/resource-building-utilization-live.cjs
- gra/tools/resource-ledger-shots-live.cjs
- gra/tools/save-load-old-save-compat-live.cjs
- gra/tools/siege-auto-breach-replay-e2e-live-test.cjs
- gra/tools/war-era-counter-live-test.cjs
- gra/tools/war-rules-multiwar-live-test.cjs

## Założenia (luki rozstrzygnięte założeniem)
- Z1: wzór konsumpcji żywności po UPKEEPMULT zakładany jako poprawny (niezweryfikowany; patrz zarzut 3).
- Z2: heurystyka „102 kandydatów” oparta na grep tekstowym, nie na biegu testów.

RUNDY: 2/5 (runda obrony Operatora; runda 1 = 10-operator-claude.md)
BLOKADY: brak blokady technicznej. Otwarte rozstrzygnięcie dla orkiestratora: bramka tmpdir FAIL=1 (2 trafienia odziedziczone z bazy, poza allowlistą).
NASTĘPNY KROK: decyzja orkiestratora — (a) R-WEB-TMPDIR-LAST-2 dla resource-ledger i save-load-deserialize-fields-audit, albo (b) dyspensa; (c) osobne solo-biegi z listy kandydatów; (d) weryfikacja wzoru UPKEEPMULT.
DEPLOY/PUSH: NIE WYKONANO
