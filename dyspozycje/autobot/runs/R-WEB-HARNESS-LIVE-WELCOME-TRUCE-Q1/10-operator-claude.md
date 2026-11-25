STATUS: PASS-WITH-NOTES
DOMAIN: INFRA (testy live) — bez zmian w gra/src i gra/data, bez deployu
TEMAT: R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1
GOAL: (1) ekran powitalny #civ-welcome-screen-root nie blokuje testów live (wspólny helper); (2) diplo-truce nie zapisuje do śledzonego pliku repo i blokada żywności sklasyfikowana z dowodem; (3) testy zielone solo po naprawie, mutacja czerwona tam, gdzie zmieniono warunek.
ZMIANY-COMMIT: SHA — patrz sekcja "Commit" na końcu. Allowlista: gra/tools/_live-ready.cjs (NOWY), gra/tools/army-panel-general-label-multiselect-live-test.cjs, gra/tools/determinism-save-load-resume-live.cjs, gra/tools/diplo-truce-live-test.cjs, dyspozycje/autobot/runs/R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1/10-operator-claude.md. Brak zmian w gra/src, gra/data, WERSJE.md, manifeście, rust-port.

TESTY (surowe wyniki, worktree na 547ca34b5; build przez vite do katalogu tymczasowego poza repo):

1. Ekran powitalny (helper gra/tools/_live-ready.cjs, funkcja closeCivWelcome: klika data-cww="close" i czeka na zniknięcie roota):
   - army-panel-general-label-multiselect-live-test.cjs PRZED: EXIT=1; Playwright: "<div role=dialog id=civ-welcome-screen-root aria-label='Odkryłeś nową cywilizację: Rzymianie'> intercepts pointer events" przy kliknięciu karty Wojownika (live-w0).
   - PO: EXIT=0, "7/7 PASS (live)" (production game, seed 981042; 3 kliknięcia wyboru, ROZWIĄŻ 3 z potwierdzeniem, Zaznacz wszystko 8/9, Odznacz, generał w zaznaczeniu z ostrzeżeniem). Asercje bez zmian.
   - Mutacja: bazowy przebieg bez helpera jest czerwony (dowód, że zmiana ma efekt). Brak mutacji asercji, bo asercje nie zmieniano.
   - determinism-save-load-resume-live.cjs: nie klika DOM, więc helper nie był potrzebny (ekran nie przechwytuje endTurn przez __eraTestDebug).

2. determinism-save-load-resume-live.cjs (runner pomiaru, nie test z asercjami):
   - PRZED (dist z 547ca34b5, seed 2222, --n 2 --k 1): "FATAL Error: endTurn timeout at turn 1" (400 s). Diagnoza: nie waitForFunction 180 s z dispatchu; blokada tury przez bramkę NNS (no-negative-stocks), prognoza < 0 od tury 1 (reguła R-WEB-ECON-END-TURN-GATE-PROJECTION-ONLY-FROM-TURN1-Q1, komunikat gry w sidePanelEventFilter / end-turn-block).
   - Naprawa (STARY-PIN, nie błąd gry): przed endTurn, gdy __aiTradeWiringTestDebug.nnsGateBlocked(), dosypanie grantPlayerGold(200)/grantPlayerFood(200) — ten sam wzorzec co w innych testach live.
   - PO: mode A "DONE records=4 pageErrors=0"; mode B "DONE records=2 pageErrors=0"; --compare: restore==snap true; "tura 3: EQ"; "EQUAL 1 of 1".

3. diplo-truce-live-test.cjs:
   - PRZED (bez zmian, domyślny bundle w os.tmpdir): wynik prawie cały zielony do L2a, potem "FAIL wyjątek: endUntilTurn: nie osiągnięto tury 6 stan={turn:5 ... 'Nie można zakończyć tury. Spichlerz państwa (żywność): po zakończeniu tury zabraknie 135'}". Bufor spichlerza 999 ustawiony tylko raz w setupie (setPlayerGranary) nie wystarcza na 5 tur po R-WEB-UPKEEPMULT (żywność jednostek ×4/×16/×64).
   - KLASYFIKACJA: STARY-PIN, nie BŁĄD-GRY. Reguła gry (no-negative-stocks.ts, nagłówek: "Prognoza < 0 po reakcji automatu → blokada, o ile istnieje ręczna dźwignia"; "Gracz zawsze ma ruch naprawczy") jest zachowana: blokada jest poprawna. Test miał dostarczyć żywność; poprawiono endOneTurn: gdy bramka blokuje, dosypanie grantPlayerGold(300)/grantPlayerFood(300). Asercje rozejmu bez zmian. Założenie: "zabraknie 135" w tej turze to skutek kosztów żywności jednostek z UPKEEPMULT, a nie błąd naliczania (nie zweryfikowano wzoru konsumpcji).
   - PO: "40 pass / 0 fail" (EXIT=0), w tym L2b/L2b2/L2g/L2h (oferta pokoju stałego dla gracza), L3, L4 (odmowa AI, wymuszona akceptacja), C zero pageerror/console.error.
   - Zrzut: domyślna ścieżka zmieniona z dyspozycje/.../evidence (śledzony plik truce-01-modal-rozejm-5.png) na os.tmpdir()/civ-truce-evidence-<TMPDIR_RUN_ID> (argv[3] nadal działa). Plik w repo nie jest zmieniany: git status po biegu pokazuje wyłącznie pliki kodu z allowlisty. Plik truce-01-modal-rozejm-5.png pozostaje w git bez zmian (nie usuwano go; to osobny temat sprzątania, nie w allowliście).
   - Mutacja: nie wykonano mutacji asercji (nie zmieniano asercji). Czerwień przed zmianą = dowód.

BRAMKI (liczby z surowego wyjścia):
- tsc --noEmit: EXIT=0 (bez błędów)
- logic-test.cjs: "LOGIC OK (213/213)"
- ai-test.cjs: "ai-test: 297 passed, 0 failed"
- bramki-tmpdir-unikalnosc-test.cjs: FAIL=1 (NIE ZGODNE z dispatchem "0 trafień"). Dwa trafienia STALE pod os.tmpdir() w plikach POZA allowlistą, obecne już na bazie 547ca34b5 (nie dotknięte przeze mnie):
  [R2] gra/tools/resource-ledger-realpath-mutation-test.cjs:64 — const tmp = require('os').tmpdir();
  [R3] gra/tools/save-load-deserialize-fields-audit.cjs:52 — path.join(os.tmpdir(), RUN_ID + '-evidence')
  Nie naprawiono (poza allowlistą). Kandydat R-WEB-TMPDIR-LAST-2 dla orkiestratora.

BLOKADY: brak blokady technicznej. Zgłoszone rozbieżności: (a) tmpdir-gate FAIL 2 trafienia (poza allowlistą, na bazie); (b) symptom determinism to endTurn timeout, nie waitForFunction 180 s z dispatchu.

UWAGI-DLA-ORKIESTRATORA (zakres poza tym tematem, nie wykonywano):
- Heurystyka: 102 pliki tools/*live*.cjs zawierają .click( i nie mają obsługi ekranu powitalnego (cww/closeCivWelcome). Nie zweryfikowano, które realnie dochodzą do pierwszego kontaktu. Kandydaci do osobnej weryfikacji solo (nie naprawiono, poza max 12 z allowlisty i bez dowodu zieleni).
- Kandydat R-WEB-*: bufor żywności w testach live po UPKEEPMULT — kilka testów może mieć ten sam stary pin (nie grep-owano dalej).
- W sesji istnieją osierocone procesy chromium/esbuild należące do innych worktree (wf_16bb3ef0..., wf_eac27800...): NIE zabijano (nie moje PID-y). Moje procesy zakończyły się same (sprawdzono pgrep).

RUNDY: 1/5
NASTĘPNY KROK: orkiestrator decyduje o integracji (Final Control), ewentualnie o R-WEB-TMPDIR-LAST-2 dla dwóch trafień tmpdir.
DEPLOY/PUSH: NIE WYKONANO

Commit: (wpisany przez orkiestratora po zakończeniu commita — SHA w polu sha wyniku)
