STATUS: PASS
DOMAIN: GAME
TEMAT: H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1

GOAL: Jednostki startowe gracza wg trudności (easy1/normal2/hard3), obce
państwa-miasta odwrotnie (easy2/normal1/hard0), państwa-miasta gracza
sterowane niezależnym suwakiem `_menuCityStateDifficulty`; pełna armia
startowa tylko przy pierwszym mieście ownera/fotela; Manpower/HP
zweryfikowane bez zmian.

ZMIANY/COMMIT: merge-base `git merge-base origin/main HEAD` = **46bfc81e**
(potwierdzone niezależnie). `git diff 46bfc81e..HEAD --stat` = **11 plików,
+520/−82**, ściśle w allowliście z `00-dispatch.md`: `gra/src/main.ts`,
`gra/src/game/ai-difficulty-bonus.ts`, 5× `gra/tools/*-test.cjs` (w tym nowy
`starting-army-first-city-live-test.cjs`), 4× dokumenty procesu w tym
katalogu. Zero plików spoza listy. HEAD gałęzi źródłowej = `241f56ee`.

TESTY (uruchomione samodzielnie od zera przez Final Control):
- `tsc --noEmit` (TS 5.9.3): 0 błędów.
- `ai-difficulty-bonus-test.cjs`: 79/0. `city-state-start-units-test.cjs`:
  16/0. `city-state-start-units-live-test.cjs` (Chromium, 3 generacje
  świata): 22/0. `manpower-test.cjs`: 63/0.
  `r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs`: 12/0.
  `starting-army-first-city-live-test.cjs` (oba fotele hot-seat): 13/0.
  `first-player-city-test.cjs`: 16/0. `hotseat-human-owners-test.cjs`:
  29/0. `hotseat-etap7-saveload-test.cjs`: 59/0.
- 5 bramek referencyjnych: logic 213/213, tech-tree 19/19, research 33/33,
  unit-replace 13/13, combat 6/6.
- Własna mutacja (niezależna od Evaluatora): osłabienie guard-a pierwszego
  miasta (`if (isFirstCityForOwner)` → `if (true)`) → 12 pass/1 fail,
  dokładnie asercja drugiego miasta duplikującego armię. Przywrócone,
  ponownie 13/0, `git diff` czysty.

BLOKADY: brak.

WERDYKT co do zarzutu proceduralnego świeżego Evaluatora (staleness
gałęzi względem `origin/main` — naiwny `git diff origin/main..HEAD`
myląco wygląda jak cofnięcie 5 innych, już zintegrowanych tematów):
**ODDAL jako zarzut wobec Operatora/tematu — to wyłącznie wiążąca instrukcja
integracyjna, nie defekt pracy.** Diff liczony od właściwego merge-base
(46bfc81e) jest czysty i ściśle w allowliście. Zintegrowano metodą scoped
diff od merge-base (git diff 46bfc81e..HEAD ograniczony do plików kodu +
`git apply`), zgodnie z zaleceniem — NIE metodą naiwnego
`git diff origin/main..HEAD | git apply` ani zastąpieniem plików.

INTEGRACJA: Wykonana przez orkiestratora (Claude Code, sesja The-Game) w
`/home/user/The-Game`, commit `9950ba24` na `main`. Niezależna, pełna
powtórka wszystkich bramek w drzewie integratora (wyniki jak wyżej,
identyczne z tym raportem Final Control) — zero regresu.

RUNDY: finalna (2/5 wykorzystane w procesie Hermes)
NASTĘPNY KROK: deploy ROBOCZA.
DEPLOY/PUSH: main — WYKONANO (commit 9950ba24, push origin/main +
origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0). Deploy ROBOCZA — patrz
WERSJE.md dla kolejnego wpisu FALA.
