STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI komunikatow)
TEMAT: R-WEB-UI-AMBUSH-SUCCESS-TOAST-IMMEDIATE-IN-AI-PHASE-Q1
GOAL: Gdy zasadzka gracza ujawnia sie/powodzi w fazie ruchu AI, toast "Zasadzka sie powiodla" pokazuje sie od razu (nie jest odraczany do konca tury); wpis "Wazne" zostaje; pozostale komunikaty fazy AI bez zmian.
ZMIANY/COMMIT: Commit operatora (SHA w polu sha odpowiedzi). Allowlista:
  - gra/src/main.ts: showHintMessage dostaje 5. parametr showNowDuringEot (domyslnie false, zero zmiany dla istniejacych wywolan). W galezi odroczenia wpis do deferredEotHints zostaje; gdy showNowDuringEot=true, toast jest renderowany od razu. Dwa wywolania ambush w fazie AI (AI->gracz ~45797 oraz barbarzynca->gracz ~46695) przekazuja showNowDuringEot=true. Diff: 9 linii (+6/-3).
  - gra/tools/ambush-live-vite.config.ts: przeniesiony z kandydata 42734f99c (probe: zasadzka gracza na trasie AI do miasta, ambHex).
  - gra/tools/ambush-live-test.cjs: przeniesiony z kandydata 42734f99c (B0 opis + ambHex, B6 dopasowanie przycisku AUTO). Blok INFO diag z kandydata USUNIETY. Asercja B5 NIEZMIENIONA.
  - Nie zmieniano: gra-robocza, WERSJE.md, inne pliki src, npm run build/dev.
  - NIE wciagnieto z kandydata 42734f99c jego main.ts: kandydat jest starszy niz baza bc4d623 i jego diff main.ts cofalby zmiany z main (PLAYER-BLUE, hooki truce).
  - Srodowisko: gra/node_modules zainstalowane lokalnie w worktree (npm ci --ignore-scripts), nie sledzone przez git.
TESTY (liczby z surowego wyjscia):
  - npx tsc --noEmit: exit 0.
  - node gra/tools/ambush-core-test.cjs: Wynik 48 OK, 0 FAIL.
  - node gra/tools/ambush-ui-reason-test.cjs: Wynik 10 OK, 0 FAIL.
  - node gra/tools/ambush-wiring-test.cjs: Wynik 28 OK, 0 FAIL.
  - node gra/tools/ambush-realstep-test.cjs: Wynik 16 OK, 0 FAIL.
  - ambush-deploy-geometry: 20 OK / 0 FAIL; ambush-deploy-scene: 26 OK / 0 FAIL; ambush-deploy-wiring: 15 OK / 0 FAIL; ambush-deploy-zone-visual: 11 OK / 0 FAIL; ambush-deploy-line-width: PASS (240 checks); ambush-deploy-lineside-guard: PASS (757 checks).
  - ambush-deploy-identity-test.cjs: SKIP (wymaga AMBUSH_BASE_GRA = katalog gra/ bazy 1c452ec35). NIE ZMIERZONO, poza listą bramek dispatchu.
  - ZYWY TEST: TMPDIR=/tmp/amb4 node gra/tools/ambush-live-test.cjs: WYNIK 26 PASS / 0 FAIL. B5 "Zasadzka sie powiodla" PASS (DOM: ["Zasadzka się powiodła"]), B6 PASS, B7 PASS.
  - MUTACJA: tymczasowo showNowDuringEot=false w obu wywolaniach ambush -> ambush-live-test: WYNIK 25 PASS / 1 FAIL, FAIL B5 (DOM: []). Potwierdza, ze B5 zalezy od poprawki. Plik main.ts przywrocony (kontrola: 2 wystapienia "undefined, false, true);").
  - git diff --check: czysto.
BLOKADY: brak blokad kodu.
  NIE ZMIERZONO: widocznosc wizualna toastu. Overlay przejscia tury (z-index 100400) moze zaslaniac toast w fazie AI; test sprawdza obecnosc w DOM, nie zrzut pikseli.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (SONNET): przeglad diffu main.ts (9 linii) i zalozenia o widocznosci wizualnej. Potem Final Control po PASS.
UWAGI-DLA-ORKIESTRATORA:
  - Dispatch wskazuje plik 00-dispatch-DODATEK-claude.md na galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0. NIE ISTNIEJE (git show: "does not exist"). Na origin/main tez brak 00-dispatch.md. Jedyny znaleziony dispatch: origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:dyspozycje/autobot/runs/R-WEB-UI-AMBUSH-SUCCESS-TOAST-IMMEDIATE-IN-AI-PHASE-Q1/00-dispatch.md. ZALOZENIE: zadanie wykonano wg niego; DODATEK nie wnosi dodatkowych zakazow.
  - Kandydat testu 42734f99c jest starszy niz origin/main (bc4d623). Jego main.ts cofa zmiany z main. Nie wciagano go. Po integracji warto sprawdzic, czy kandydat AMBLIVE nie dubluje zmian z tego commita.
  - Dispatch zawiera "START PO ADDUNIT (ten sam plik main.ts)". Wpisy na liscie orkiestratora: ADDUNIT w toku. Baza bc4d623 ma juz PLAYER-BLUE. Zmiana w main.ts dotyczy 1 sygnatury (showHintMessage) i 2 wywolan; konflikt do sprawdzenia przy integracji.
DEPLOY/PUSH: NIE WYKONANO
