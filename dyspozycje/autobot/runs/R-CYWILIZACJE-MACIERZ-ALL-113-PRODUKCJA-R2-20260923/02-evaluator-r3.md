STATUS: FAIL
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-ALL-113-PRODUKCJA-R2-20260923
GOAL: Podłączyć wszystkie 5 pól produkcyjnych macierzy cywilizacji do realnego runtime produkcji, rekrutacji i rush dla gracza, AI i city-state.
ZMIANY/COMMIT: HEAD=a8c9cf6c181f688201dd45e6a5871da1b0eb1301; brak commita. Worktree pozostaje niezatwierdzony. Zmienione ścieżki względem HEAD: gra/src/game/auto-manage.ts, gra/src/game/civ-matrix.ts, gra/src/game/production.ts, gra/src/main.ts, gra/src/ui/cityPanel.ts oraz allowlisted artefakty testowe/raportowe. Readback statusu nie wykazał ścieżek poza allowlistą.
TESTY:
- node --check gra/tools/civ-matrix-production-consumer-test.cjs: PASS, exit 0.
- node --check gra/tools/civ-matrix-production-runtime-live-test.cjs: PASS, exit 0.
- ESBUILD_MODULE=.../gra/node_modules/esbuild node gra/tools/civ-matrix-production-consumer-test.cjs: 19 passed, 0 failed.
- node gra/tools/civ-matrix-production-runtime-live-test.cjs: 112 passed, 0 failed; realny Vite bundle + headless Chromium, 15 civs, 5 parametrów, player/AI owner routing, city-state marker, auto-build, world-end-turn, city-panel/rush, zero console.error/pageerror.
- node gra/tools/logic-test.cjs: LOGIC OK (213/213).
- gra/node_modules/.bin/tsc --noEmit: PASS.
- JSON.parse(data/civ-matrix.json): PASS, JSON OK.
- git diff --check: PASS.
- Niezależny browser probe rzeczywistego end-turn: strona pozostała na turn=1; po wymuszeniu kliknięcia disabled `Zakończ turę` trace AI miał 0 owner calls i 0 parameter calls, bez błędów konsoli. To potwierdza brak niezależnego dowodu wykonania callbacku AI w tym scenariuszu.
BLOKADY: Brak blokady infrastrukturalnej. FAIL wynika z niespełnionego kryterium dowodowego, nie z crasza.
RUNDY: 3/5
ZARZUTY:
1. `gra/tools/civ-matrix-production-runtime-live-test.cjs:112-153` nie wywołuje rzeczywistego AI `availableProduction` callbacku ani `runAiPhase`. Po oznaczeniu ownera jako city-state test wywołuje `probeOwner` (`:122-129`), `probeAutoBuildForOwner` (`:133-144`) i `runWorldEndTurn` (`:146-153`), ale nie ścieżkę `isProductionAllowed` z callbackiem AI. Rzeczywisty callback znajduje się w `gra/src/main.ts:33815-33849` (z resolverem w `:33821-33832`) oraz drugi handler w `:35115-35180`; sam odczyt diffu nie zastępuje wykonania. Tym samym kryterium końca z `00-dispatch.md:27` („AI availableProduction assertions” w live gate) oraz reguła przeciw samooszukiwaniu z `00-dispatch.md:36-37` nie są spełnione. Player, auto-manager/auto-build, city-state, city-panel i world-end-turn mają niezależne dowody; AI `availableProduction` nie ma.
NEXT: Conditional Defense/Obrona ma dostarczyć dowód uruchomienia rzeczywistego callbacku AI `availableProduction` przez actual `main.ts`/`runAiPhase`, bez zastępowania go `probeOwner`, injected resolverem ani statycznym token search. Nie wykonywać integracji, push ani deploy.
DEPLOY/PUSH: NIE WYKONANO
