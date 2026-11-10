STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LOAD-GAME-REGRESSION-Q1
GOAL: Przycisk „Wczytaj grę" w menu pauzy/głównym nie może być wyszarzony z „Brak zapisu", gdy zapisy istnieją (autozapis na dysk przez File System Access).
ZMIANY/COMMIT: allowlista: `gra/src/main.ts` (funkcje: hasAnySaveSlot/refreshHasAnySaveSlotCache, openLoadGameDialog, configureMainMenu onLoad, persistSaveToSlot, doRotatingAutosave, triggerFsaAutosaveBootstrap); NOWE `gra/src/game/save-presence.ts` (czysty helper anySavePresent; dodany poza literalną listą allowlisty jako część poprawki, bo test musi uruchamiać prawdziwą logikę); NOWE `gra/tools/load-game-regression-test.cjs`; ten raport. Brak zmian w `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**`, `package-lock.json`. Commit lokalny, bez push.
TESTY:
- Przyczyna (kod, nie przeglądarka): `gra/src/main.ts` ~22162-22175 i ~22205 — hasAnySaveSlot()/openLoadGameDialog() sprawdzały wyłącznie listSaves() (IDB + localStorage). Autozapis FSA pisze `civ-autosave-N.json` na dysk (`gra/src/game/fsa-autosave.ts` fsaRotatingAutosaveWrite) i NIE dopisuje do IDB; `listFsaAutosaveFiles()` (fsa-autosave.ts ~431) widzi te pliki, ale używa go tylko dialog (`gra/src/ui/saveLoadDialog.ts` ~237). Efekt: gra z aktywnym autozapisem na dysk i bez ręcznego zapisu => „Brak zapisu" (zgodne z objawem właściciela, który nie zapisywał ręcznie — ZAŁOŻENIE do potwierdzenia w przeglądarce).
- Zapisy stanu cache: cache „zapis istnieje" nie był odświeżany po autozapisie (tylko przy boot i ręcznym zapisie) — dodano ustawienie na true po udanym zapisie (3 miejsca).
- `node gra/tools/load-game-regression-test.cjs`: 10 PASS / 0 FAIL (w tym mutacja: stara logika oblewa przypadek FSA-only).
- `node gra/tools/autosave-quota-fail-test.cjs`: 20 pass / 0 fail.
- `node gra/tools/fsa-autosave-test.cjs`: 55 pass / 0 fail.
- `node gra/tools/logic-test.cjs`: LOGIC OK (213/213).
- `npx tsc --noEmit`: bez błędów.
- Bezpośredni `npx vite build` (wyjście do katalogu tymczasowego, bez `dev`): built in 36.02s.
- NIE_ZMIERZONO: test end-to-end w Chromium (headless) z prawdziwym FSA i kilkoma turami; scenariusz „load przy oczekującej bitwie/kolejce" nie był odtwarzany (objaw właściciela dotyczy wyszarzenia przycisku, nie blokady bitwy; nie ruszano logiki kolejki bitew, zgodnie z dispatchem).
BLOKADY: brak. Zależność: temat R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1 dotyka main.ts (kolejka bitew) — ta poprawka nie zmienia tej logiki.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5 medium) — weryfikacja diff i testów; Final Control; w przeglądarce potwierdzić, że po kilku turach z FSA przycisk „Wczytaj grę" jest aktywny.
DEPLOY/PUSH: NIE WYKONANO
