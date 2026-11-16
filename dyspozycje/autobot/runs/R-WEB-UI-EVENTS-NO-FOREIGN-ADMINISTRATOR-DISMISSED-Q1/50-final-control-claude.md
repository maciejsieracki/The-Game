STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-EVENTS-NO-FOREIGN-ADMINISTRATOR-DISMISSED-Q1
GOAL: Gracz nie dostaje wpisu o zwolnieniu zarządcy ZDOBYTEGO miasta obcej cywilizacji; utrata własnego miasta z zarządcą daje wpis; AI<->AI bez wpisu; mechanika zwalniania bez zmian.
ZMIANY/COMMIT: kandydat 71009aaa02c9ceee4323ff6ec8a5ea17dfe417b8 (kod c79aa7d87 + 6d14b02e9; potomek bazy 774fd0eec7de9438c9359756d48b135ebb79df7b: merge-base --is-ancestor = tak). Diff vs baza: city-administrator.ts (+prevOwnerId, administratorChangeAudienceOwnerId, administratorChangeNotifiesPlayer), main.ts (import + 1 bramka w noteAdministratorChange), nowy gra/tools/foreign-administrator-dismissed-test.cjs, raporty 10/30. Zakres zgodny z allowlistą, git diff --check czysto.
TESTY (własne uruchomienie w worktree FC):
- tsc --noEmit: exit 0
- foreign-administrator-dismissed-test: PASS 12 / FAIL 0
- city-administrator 119/0; improvement-administrator 59/0; notif-diplo-tab-count-blocking 25 OK/0 FAIL; events-one-turn-lifetime 25 OK/0 FAIL; research 33/0; combat exit 0 (All sanity checks passed); load-game-regression, logic, tech-tree, unit-replace exit 0. Żadna bramka nie jest czerwona, więc porównanie baza-vs-kandydat nie było potrzebne.
ZARZUTY:
1. ODDAL — test używa wyeksportowanej administratorChangeNotifiesPlayer, tej samej, którą woła noteAdministratorChange w main.ts (potwierdzone diffem). Zagnieżdżona funkcja w boot() pozostaje poza testem, ale jej bramka to jedno wywołanie wspólnej funkcji.
2. NIE ZMIERZONO (Chromium) — brak żywej weryfikacji listy wydarzeń i zrzutu. Ścieżka wpisu to czysta logika, ryzyko niskie, ale kryterium (b) dispatchu nie jest domknięte dowodem w przeglądarce. Do decyzji orkiestratora (czy wymagać LIVE-VERIFY); nie uznaję tego za NAPRAW kodu.
3. ODDAL — firstCity dla roli ulepszenia istnieje w bazie, nie regresja.
4. ODDAL — w repo nie ma listy deployu z nazwami testów; nazwa do wpisu: foreign-administrator-dismissed-test.cjs.
BLOKADY: brak.
RUNDY: FC po rundzie 1/5.
UWAGI-DLA-ORKIESTRATORA: (a) wpis przy utracie WŁASNEGO miasta z zarządcą to założenie Operatora (wcześniej wpisu nie było); jedna linia do zmiany w administratorChangeAudienceOwnerId. (b) events-defer-to-turn-start-test C3 raportowany przez Operatora jako pre-existing czerwony (nie weryfikowano w tej rundzie). (c) Dług Rust: sprawdzić, czy rust-port ma odpowiednik noteAdministratorChange.
NASTĘPNY KROK: integracja orkiestratora (SHA = commit tego raportu, potomek 71009aaa0), potem deploy ROBOCZA po osobnej autoryzacji.
DEPLOY/PUSH: NIE WYKONANO
