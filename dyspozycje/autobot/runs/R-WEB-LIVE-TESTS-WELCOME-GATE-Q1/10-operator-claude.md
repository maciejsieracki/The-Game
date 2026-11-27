STATUS: PASS-WITH-NOTES (kryterium binarne z dodatku NIE SPEŁNIONE — patrz BLOKADY)
DOMAIN: PROCESS
TEMAT: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1 (runda 2/5, Operator HAIKU 5.5)
GOAL: ustalić, czy ekran powitalny blokuje testy live klikające HUD/„Zakończ turę”, i przepiąć je na wspólny helper; zmierzyć przed/po.
ZMIANY/COMMIT: baza cf8c26b225162557cb2f7d8c72e7c812f67a4820 (origin/main ancestor 6319eaf66: merge-base potwierdzony). Commit: patrz SHA w wiadomości zwrotnej (commit na gałęzi detached worktree).
  - gra/tools/*: 12 testów live przepiętych wsadowo na `closeCivWelcome` z `_live-ready.cjs` (import + jedno wywołanie po gotowości strony). Asercje bez zmian. Zero zmian gra/src, gra/data.
  - dyspozycje/analizy/migrate-live-welcome-q1.cjs (skrypt migracyjny, anchor x1).
  - dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md (dokument: ustalenia, tabela, poziom maksymalny, NIE ZMIERZONO).
  - dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-WELCOME-GATE-Q1/logi/ (surowe logi + SHA256SUMS.txt).
TESTY:
  - tsc --noEmit: rc=0 (bez wyjścia).
  - logic-test: LOGIC OK (213/213).
  - ai-test: 297 passed, 0 failed.
  - probe na żywo (dist-base, ?civTest=1, seed 4242, Mały, domyślne ustawienia — NIE poziom maksymalny):
      bez helpera: btnCover = civ-welcome-screen-root (ekran zasłania przycisk w turze 1); z helperem: btnCover = BUTTON; canEnd = false w obu (bramka tury).
  - przed/po (przepięcie):
      era-change-toast: 11 OK / 9 FAIL przed, 11 OK / 9 FAIL po (bez zmiany; blokada = bramka żywności „zabraknie 187”).
      end-turn-gate (civTest, --dist base): 2/9 PASS przed, 2/9 PASS po (bez zmiany; test nie klika przycisku).
      sidepanel-diplo-dismiss-real-render: przed rc=1, 33 OK / 4 FAIL (endTurn nie stabilizuje); po — timeout 280 s, 23 OK / 0 FAIL, BEZ WERDYKTU.
  - NIE ZMIERZONO: pozostałe 9 przepiętych testów (forced-war x5, diplo-truce x3, end-turn-block-event) — czas jednego testu 2–5 min, budżet rundy; pełna mutacja na realnym teście; pełna inwentaryzacja 102 testów z klikiem (wykonana tylko grep: 143 wzmianek o zakończ turę/endTurn, 228 z click).
  - Poziom maksymalny (Dyplomacja Trudna, Koszty jednostek Wysoki ×4, Kultura trudna, największa mapa): NIE ZMIERZONO. Wszystkie pomiary na Mały, domyślnie.
  - end-turn-input-stability-test: nie przepięty (harness DOM setContent, bez gry); NIE ZMIERZONO uruchomieniem.
BLOKADY:
  - Ekran powitalny jest realny i zasłania przycisk, helper go zamyka — ALE tura w trybie ?playtest=mapa dalej nie kończy się: bramka żywności/skarbca (Spichlerz „zabraknie 187”). prepareEndTurnGate wymaga haka __nnsMeasureDebug, który istnieje tylko przy ?civTest=1. Obejście wymaga zmiany gra/src (zakazane w tej rundzie) — KANDYDAT NA OSOBNY TEMAT.
  - Kryterium binarne dodatku (próbka >=20 testów; testy zablokowane ekranem naprawione z mutacją czerwoną; poziom maksymalny >=5 testów) NIE SPEŁNIONE: zmierzone 3 testy przed/po, mutacja zastępcza na sondzie, brak pomiaru na poziomie maksymalnym.
  - Przepiętych testów nie da się uznać za „zielone” na podstawie tej rundy: w zmierzonych przypadkach wynik nie zmienił się.
RUNDY: 2/5 (r1 FC FAIL: nic nie przepięte; r2: przepięcie 12 plików + pomiary jak wyżej). Uwaga: w r1 wniosek „0 blokowanych” był błędny i został wycofany w dodatku.
NASTĘPNY KROK: FC decyduje, czy PASS-WITH-NOTES jest wystarczające, czy wymagana runda 3 z pomiarem 20+ testów. Propozycja tematu: R-WEB-LIVE-PLAYTEST-GRANARY-HOOK-Q1 (hak stanu bramki dla ?playtest=mapa — wymaga zgody na zmianę gra/src; decyzja orkiestratora, nie Operatora).
UWAGI-DLA-ORKIESTRATORA:
  - Operator nadpisał plik dyspozycje/analizy/TESTY-LIVE-EKRAN-POWITALNY-2026-11-27.md (istniał z r1, z błędnym wnioskiem „0 blokowanych”). Wniosek r1 jest wycofany w nowej wersji.
  - Testy live uruchamiane z gra/ wymagają node_modules: `npm ci --ignore-scripts` (71 pakietów, 3 s). Bundle live: `node ./node_modules/vite/bin/vite.js build --outDir <poza repo> --emptyOutDir` (~21 s). Boot gry w headless: ~127 s (obciążenie ~9).
  - Testy forced-war, era-change i sidepanel same budują bundle do gra/dist-*; po pracy usunięte.
  - Usunięto tymczasowe kopie _before-*.cjs (nie trafiły do commita).
DEPLOY/PUSH: NIE WYKONANO
